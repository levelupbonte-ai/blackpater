import { createHash } from 'node:crypto';
import { getOffer } from '../../shared/offers.js';
import { getStripe } from './stripe.js';
import { createRateLimiter, createTtlMap } from './memory.js';
import { HttpError, getClientIp, methodNotAllowed, readJsonBody, resolveOrigin, sendJson } from './http.js';

export const ATTEMPT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

const MINUTE = 60 * 1000;
/** Idempotency window: retries inside one window get the very same session. */
export const BUCKET_MS = 20 * MINUTE;
/** Stripe requires expires_at >= 30 min after creation: 31-51 min here. */
const EXPIRY_MARGIN_MS = 31 * MINUTE;
/** Rapid repeated taps are answered from memory without calling Stripe. */
const FAST_REUSE_MS = 90 * 1000;

const BODY_LIMIT = 2048;

function paramsHash(params) {
  return createHash('sha256').update(JSON.stringify(params)).digest('hex').slice(0, 12);
}

export function buildSessionParams({ offer, attemptId, origin, bucket }) {
  const expiresAt = Math.floor(((bucket + 1) * BUCKET_MS + EXPIRY_MARGIN_MS) / 1000);
  return {
    mode: 'payment',
    // No payment_method_types: Stripe shows the methods enabled in the
    // Dashboard (cards, Apple Pay, Google Pay, Link...) — all processed by Stripe.
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: offer.currency,
          unit_amount: offer.amount,
          product_data: { name: offer.stripeName, description: offer.stripeDescription }
        }
      }
    ],
    locale: 'auto',
    submit_type: 'pay',
    billing_address_collection: 'auto',
    client_reference_id: attemptId,
    metadata: { offer_id: offer.id, attempt_id: attemptId, site: 'blackpater.com' },
    payment_intent_data: {
      description: offer.stripeName,
      metadata: { offer_id: offer.id, attempt_id: attemptId, site: 'blackpater.com' }
    },
    custom_text: {
      submit: {
        message: `Paiement unique, sans renouvellement. Conditions de vente / Terms of sale: ${origin}/legal/conditions-de-vente`
      }
    },
    expires_at: expiresAt,
    success_url: `${origin}/paiement/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/paiement/annule?offre=${encodeURIComponent(offer.id)}`
  };
}

function isPaidStatus(session) {
  return session.status === 'complete';
}

function confirmationPath(sessionId) {
  return `/paiement/confirmation?session_id=${encodeURIComponent(sessionId)}`;
}

/**
 * POST /api/stripe/create-checkout-session
 * Body: { offerId, attemptId, sessionId? }
 *
 * Duplicate-safe by construction:
 *  1. repeated taps within seconds are answered from an in-memory map;
 *  2. a session the browser already has (sessionId) is reused while open, and
 *     if it is already paid the customer goes straight to the confirmation;
 *  3. otherwise the session is created with an idempotency key derived from
 *     (offer, attempt, time window, exact params): any number of retries in
 *     the window return the same Checkout Session from Stripe itself.
 */
export function createCheckoutHandler(deps = {}) {
  const stripeFor = deps.getStripe || getStripe;
  const now = deps.now || (() => Date.now());
  const limiter = deps.limiter || createRateLimiter({ windowMs: MINUTE, max: 12, now });
  const sessions = deps.cache || createTtlMap(5000, now);
  const log = deps.log || console;

  return async function handler(req, res) {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const rl = limiter(getClientIp(req));
    if (!rl.ok) return sendJson(res, 429, { error: 'rate_limited' }, { 'Retry-After': String(rl.retryAfter) });

    let body;
    try {
      body = await readJsonBody(req, BODY_LIMIT);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 400;
      return sendJson(res, status, { error: 'invalid_request' });
    }

    const offer = getOffer(body.offerId);
    const attemptId = typeof body.attemptId === 'string' ? body.attemptId.toLowerCase() : '';
    const clientSessionId = body.sessionId == null ? null : body.sessionId;
    if (
      !offer ||
      !ATTEMPT_ID_RE.test(attemptId) ||
      (clientSessionId !== null && (typeof clientSessionId !== 'string' || !SESSION_ID_RE.test(clientSessionId)))
    ) {
      return sendJson(res, 400, { error: 'invalid_request' });
    }

    const stripe = stripeFor();
    if (!stripe) return sendJson(res, 503, { error: 'payments_unavailable' });

    const key = `${offer.id}:${attemptId}`;
    const t = now();

    try {
      // 1. Cheap layer: the same attempt asked again a moment ago.
      const known = sessions.get(key);
      if (known && t - known.createdAt < FAST_REUSE_MS && known.expiresAtMs - t > 5 * MINUTE) {
        return sendJson(res, 200, { status: 'redirect', url: known.url, sessionId: known.sessionId });
      }

      // 2. Reuse (or detect payment of) the session this attempt already has.
      const previousId = known?.sessionId || clientSessionId;
      if (previousId) {
        let previous = null;
        try {
          previous = await stripe.checkout.sessions.retrieve(previousId);
        } catch (err) {
          if (err?.code !== 'resource_missing') throw err;
        }
        if (previous && previous.client_reference_id === attemptId && previous.metadata?.offer_id === offer.id) {
          if (isPaidStatus(previous)) {
            return sendJson(res, 200, { status: 'paid', redirect: confirmationPath(previous.id), sessionId: previous.id });
          }
          if (previous.status === 'open' && previous.url && previous.expires_at * 1000 - t > 5 * MINUTE) {
            sessions.set(key, { sessionId: previous.id, url: previous.url, expiresAtMs: previous.expires_at * 1000, createdAt: t }, previous.expires_at * 1000 - t);
            return sendJson(res, 200, { status: 'redirect', url: previous.url, sessionId: previous.id });
          }
        }
      }

      // 3. Create — idempotent for this attempt within the time window.
      const bucket = Math.floor(t / BUCKET_MS);
      const params = buildSessionParams({ offer, attemptId, origin: resolveOrigin(req), bucket });
      const idempotencyKey = `bp_checkout_${offer.id}_${attemptId}_${bucket}_${paramsHash(params)}`;
      let session = await stripe.checkout.sessions.create(params, { idempotencyKey });

      // A replayed idempotent response describes the session as it was when it
      // was created; refresh it so an already-paid session is never reopened.
      if (session.created && t - session.created * 1000 > 60 * 1000) {
        session = await stripe.checkout.sessions.retrieve(session.id);
      }
      if (isPaidStatus(session)) {
        return sendJson(res, 200, { status: 'paid', redirect: confirmationPath(session.id), sessionId: session.id });
      }
      if (session.status !== 'open' || !session.url) {
        return sendJson(res, 409, { error: 'checkout_expired' });
      }

      sessions.set(key, { sessionId: session.id, url: session.url, expiresAtMs: session.expires_at * 1000, createdAt: t }, Math.max(session.expires_at * 1000 - t, MINUTE));
      return sendJson(res, 200, { status: 'redirect', url: session.url, sessionId: session.id });
    } catch (err) {
      // Never forward Stripe's message to the browser; log only what helps.
      log.error(
        JSON.stringify({ evt: 'checkout.create_failed', offer: offer.id, type: err?.type || err?.name || 'Error', code: err?.code || null, requestId: err?.requestId || null })
      );
      return sendJson(res, 502, { error: 'checkout_failed' });
    }
  };
}
