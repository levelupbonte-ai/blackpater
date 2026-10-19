import { getOffer } from '../../shared/offers.js';
import { getStripe } from './stripe.js';
import { createRateLimiter } from './memory.js';
import { readSessionIdParam } from '../../shared/validation.js';
import { getClientIp, methodNotAllowed, sendJson } from './http.js';

/**
 * Maps a Checkout Session to what the confirmation page may show.
 *  - paid:       payment received (status complete + paid / no_payment_required)
 *  - processing: checkout completed but the payment is still pending
 *                (delayed methods) — the page keeps polling
 *  - open:       not paid (customer left before paying)
 *  - expired:    session expired without payment
 */
export function sessionState(session) {
  if (session.status === 'complete') {
    return session.payment_status === 'unpaid' ? 'processing' : 'paid';
  }
  if (session.status === 'expired') return 'expired';
  return 'open';
}

function readStrictSessionId(rawUrl) {
  const raw = String(rawUrl || '');
  if (raw.length > 600) return '';
  const q = raw.indexOf('?');
  const search = q === -1 ? '' : raw.slice(q + 1);
  const keys = [...new URLSearchParams(search).keys()];
  if (keys.length !== 1 || keys[0] !== 'session_id') return '';
  return readSessionIdParam(search);
}

/**
 * GET /api/stripe/session-status?session_id=cs_...
 * Server-side verification used by /paiement/confirmation: the page never
 * trusts its own URL, only this answer. Returns no personal data.
 */
export function createSessionStatusHandler(deps = {}) {
  const stripeFor = deps.getStripe || getStripe;
  const limiter = deps.limiter || createRateLimiter({ windowMs: 60 * 1000, max: 40, now: deps.now });
  const log = deps.log || console;

  return async function handler(req, res) {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

    const rl = limiter(getClientIp(req));
    if (!rl.ok) return sendJson(res, 429, { error: 'rate_limited' }, { 'Retry-After': String(rl.retryAfter) });

    // Only `?session_id=cs_...`, once, in the Stripe format — validated before
    // anything is sent to Stripe.
    const sessionId = readStrictSessionId(req.url);
    if (!sessionId) return sendJson(res, 400, { error: 'invalid_request' });

    const stripe = stripeFor();
    if (!stripe) return sendJson(res, 503, { error: 'payments_unavailable' });

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const offer = getOffer(session.metadata?.offer_id);
      if (!offer) return sendJson(res, 404, { error: 'not_found' });
      return sendJson(res, 200, {
        state: sessionState(session),
        offerId: offer.id,
        amount: session.amount_total,
        currency: session.currency,
        attemptId: session.client_reference_id || null
      });
    } catch (err) {
      if (err?.code === 'resource_missing') return sendJson(res, 404, { error: 'not_found' });
      log.error(JSON.stringify({ evt: 'checkout.status_failed', type: err?.type || err?.name || 'Error', code: err?.code || null }));
      return sendJson(res, 502, { error: 'status_unavailable' });
    }
  };
}
