import { getOffer } from '../../shared/offers.js';
import { getWebhookSecret, stripeWebhooks } from './stripe.js';
import { createBoundedSet } from './memory.js';
import { HttpError, methodNotAllowed, readRawBody, sendJson } from './http.js';
import * as defaultHooks from './fulfilment.js';

const BODY_LIMIT = 512 * 1024;

export const HANDLED_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed'
];

/**
 * POST /api/stripe/webhook
 * Raw body + Stripe-Signature verified with STRIPE_WEBHOOK_SECRET.
 * Each event id is processed once, and each session is fulfilled once, per
 * warm instance; Stripe retries until it gets a 2xx, so an error here returns
 * 500 and the event is not marked as processed.
 */
export function createWebhookHandler(deps = {}) {
  const secretFor = deps.getWebhookSecret || getWebhookSecret;
  const webhooks = deps.webhooks || stripeWebhooks;
  const hooks = deps.hooks || defaultHooks;
  const processedEvents = deps.processedEvents || createBoundedSet(5000);
  const fulfilledSessions = deps.fulfilledSessions || createBoundedSet(5000);
  const log = deps.log || console;

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

    try {
      if (HANDLED_EVENTS.includes(event.type)) {
        const session = event.data.object;
        if (getOffer(session?.metadata?.offer_id)) {
          const paid =
            event.type === 'checkout.session.async_payment_succeeded' ||
            (event.type === 'checkout.session.completed' && session.payment_status !== 'unpaid');

          if (paid) {
            if (!fulfilledSessions.has(session.id)) {
              await hooks.onCheckoutPaid(session, event, log);
              fulfilledSessions.add(session.id);
            }
          } else if (event.type === 'checkout.session.completed') {
            await hooks.onCheckoutPending(session, event, log);
          } else {
            await hooks.onCheckoutPaymentFailed(session, event, log);
          }
        }
      }
      processedEvents.add(event.id);
      return sendJson(res, 200, { received: true });
    } catch (err) {
      log.error(JSON.stringify({ evt: 'webhook.handler_failed', eventId: event.id, type: event.type, error: err?.name || 'Error' }));
      return sendJson(res, 500, { error: 'handler_failed' });
    }
  };
}
