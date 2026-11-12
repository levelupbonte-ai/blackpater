import { getOffer } from '../../shared/offers.js';
import { getStripe, getWebhookSecret, stripeWebhooks } from './stripe.js';
import { createBoundedSet } from './memory.js';
import { HttpError, methodNotAllowed, readRawBody, sendJson } from './http.js';
import * as defaultHooks from './fulfilment.js';
import { buildPaymentEvent, createLevelUpForwarder, paymentStatusFor } from './levelup.js';
import { createPortalHandler } from './portal/handler.js';
import { getPortalConfig, missingConfig } from './portal/config.js';
import { PortalDbError, createPortalDb } from './portal/db.js';
import { SUBSCRIPTION_EVENTS, isPlanObject, subscriptionPayload } from './portal/plans.js';

const BODY_LIMIT = 512 * 1024;

export const CHECKOUT_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired'
];

export const HANDLED_EVENTS = [...CHECKOUT_EVENTS, 'charge.refunded', ...SUBSCRIPTION_EVENTS];

/** Reports a member's monthly plan to LevelUp, which decides what the member sees. */
function createPlanSync() {
  const rpc = createPortalDb();
  return async function syncPlan(sub) {
    const cfg = getPortalConfig();
    if (missingConfig(cfg).length) throw new Error('portal_not_configured');
    await rpc('portal_subscription_sync', { p_key: cfg.portalKey, p_sub: subscriptionPayload(sub) });
  };
}

/**
 * For `charge.refunded`: finds the Checkout Session of the refunded payment
 * (the charge itself carries no offer metadata). Null when it is not one of
 * this site's sessions or Stripe cannot be reached.
 */
async function sessionForCharge(charge, stripe) {
  const paymentIntent = typeof charge?.payment_intent === 'string' ? charge.payment_intent : charge?.payment_intent?.id;
  if (!paymentIntent || !stripe) return null;
  const list = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
  const session = list?.data?.[0];
  return session && getOffer(session.metadata?.offer_id) ? session : null;
}

/**
 * POST /api/stripe/webhook
 * Raw body + Stripe-Signature verified with STRIPE_WEBHOOK_SECRET.
 * Each event id is processed once, and each session is fulfilled once, per
 * warm instance; Stripe retries until it gets a 2xx, so an error in the local
 * processing returns 500 and the event is not marked as processed.
 *
 * After local processing, the outcome is sent to the owner's LevelUp dashboard
 * (api/_lib/levelup.js). That step is best effort: whatever happens there,
 * Stripe receives its 200.
 */
export function createWebhookHandler(deps = {}) {
  const secretFor = deps.getWebhookSecret || getWebhookSecret;
  const webhooks = deps.webhooks || stripeWebhooks;
  const hooks = deps.hooks || defaultHooks;
  const processedEvents = deps.processedEvents || createBoundedSet(5000);
  const fulfilledSessions = deps.fulfilledSessions || createBoundedSet(5000);
  const log = deps.log || console;
  const stripeFor = deps.getStripe || getStripe;
  const forward = deps.forwardPayment || createLevelUpForwarder({ log });
  // After a paid checkout LevelUp creates the customer's portal access and queues
  // the invitation e-mail; send it now (best effort, bounded, never fails the webhook).
  const drainPortal = deps.drainPortal || (() => createPortalHandler({ log }).drainNow(5));
  const syncPlan = deps.syncPlan || createPlanSync();

  /** Sends the record to the LevelUp dashboard; never throws, never fails the webhook. */
  async function forwardRecord(event, record) {
    try {
      const pEvent = buildPaymentEvent({
        eventId: event.id,
        eventCreated: event.created,
        session: record.session,
        status: record.status,
        extraMetadata: { livemode: Boolean(event.livemode ?? record.session.livemode), ...record.extraMetadata }
      });
      if (pEvent) await forward(pEvent);
    } catch (err) {
      log.warn(JSON.stringify({ evt: 'levelup.forward_failed', eventId: event.id, reason: 'internal', error: err?.name || 'Error' }));
    }
  }

  return async function handler(req, res) {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const secret = secretFor();
    if (!secret) return sendJson(res, 503, { error: 'webhook_not_configured' });

    let raw;
    try {
      raw = await readRawBody(req, BODY_LIMIT);
    } catch (err) {
      return sendJson(res, err instanceof HttpError ? err.status : 400, { error: 'invalid_request' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') return sendJson(res, 400, { error: 'invalid_signature' });

    let event;
    try {
      event = webhooks.constructEvent(raw, signature, secret);
    } catch {
      return sendJson(res, 400, { error: 'invalid_signature' });
    }

    if (processedEvents.has(event.id)) return sendJson(res, 200, { received: true, duplicate: true });

    // 1. Local processing (fulfilment hooks). A failure here returns 500 so
    //    Stripe redelivers the event.
    let record = null;
    try {
      if (CHECKOUT_EVENTS.includes(event.type)) {
        const session = event.data.object;
        if (getOffer(session?.metadata?.offer_id)) {
          const status = paymentStatusFor(event.type, session);
          if (status === 'paid') {
            if (!fulfilledSessions.has(session.id)) {
              await hooks.onCheckoutPaid(session, event, log);
              fulfilledSessions.add(session.id);
            }
          } else if (status === 'pending') {
            await hooks.onCheckoutPending(session, event, log);
          } else if (status === 'failed') {
            await hooks.onCheckoutPaymentFailed(session, event, log);
          } else if (status === 'expired') {
            await hooks.onCheckoutExpired?.(session, event, log);
          }
          record = { session, status };
        }
      } else if (SUBSCRIPTION_EVENTS.includes(event.type)) {
        // Monthly plans of the member space (never forwarded as one-time payments).
        const sub = event.data.object;
        if (isPlanObject(sub)) {
          try {
            await syncPlan(sub);
          } catch (err) {
            // An account deleted since, or a plan removed: nothing to retry.
            if (!(err instanceof PortalDbError && (err.status === 404 || err.status === 400))) throw err;
            log.warn(JSON.stringify({ evt: 'portal.plan_sync_skipped', eventId: event.id, code: err.code }));
          }
        }
      } else if (event.type === 'charge.refunded') {
        const charge = event.data.object;
        let session = null;
        try {
          session = await sessionForCharge(charge, stripeFor());
        } catch (err) {
          // Only the dashboard record depends on this lookup: never fail the webhook for it.
          log.warn(JSON.stringify({ evt: 'levelup.refund_lookup_failed', eventId: event.id, type: err?.type || err?.name || 'Error' }));
        }
        if (session) {
          await hooks.onCheckoutRefunded?.(session, event, log);
          record = {
            session,
            status: 'refunded',
            extraMetadata: {
              amount_refunded: Number.isInteger(charge.amount_refunded) ? charge.amount_refunded : null,
              refund: charge.refunded ? 'full' : 'partial'
            }
          };
        }
      }
    } catch (err) {
      log.error(JSON.stringify({ evt: 'webhook.handler_failed', eventId: event.id, type: event.type, error: err?.name || 'Error' }));
      return sendJson(res, 500, { error: 'handler_failed' });
    }

    // 2. Owner dashboard (LevelUp). Best effort and bounded in time: Stripe
    //    gets its 200 whatever happens here.
    if (record) await forwardRecord(event, record);
    if (record?.status === 'paid') {
      let timer;
      try {
        await Promise.race([drainPortal(), new Promise((r) => (timer = setTimeout(r, 4000)))]);
      } catch {
        log.warn(JSON.stringify({ evt: 'portal.drain_failed', eventId: event.id }));
      } finally {
        clearTimeout(timer);
      }
    }

    processedEvents.add(event.id);
    return sendJson(res, 200, { received: true });
  };
}
