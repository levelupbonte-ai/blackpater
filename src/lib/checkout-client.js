/**
 * Browser side of the Stripe Checkout flow, framework-free so it can be tested
 * with the Node test runner.
 *
 * Guarantees:
 *  - one purchase attempt id per offer (crypto.randomUUID), kept in
 *    sessionStorage, reused by every tap and every retry;
 *  - while a request is in flight or a redirect is under way, further calls to
 *    start() return the same promise (no second request);
 *  - requests time out (AbortController) and only then can be retried — with
 *    the same attempt id, so the server returns the same Checkout Session.
 */

import { getOffer } from '../../shared/offers.js';
import { isAttemptId, isConfirmationPath, isSessionId, isStripeCheckoutUrl, parseCheckoutRequest } from '../../shared/validation.js';

const STORAGE_PREFIX = 'bp_checkout:';

export const CHECKOUT_ENDPOINT = '/api/stripe/create-checkout-session';

function safeGet(storage, key) {
  try {
    return storage ? storage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    if (storage) storage.setItem(key, value);
  } catch {
    /* private mode: the attempt then lives in memory for this page only */
  }
}

function safeRemove(storage, key) {
  try {
    if (storage) storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function clearCheckoutAttempt(storage, offerId) {
  safeRemove(storage, STORAGE_PREFIX + offerId);
}

export function readCheckoutAttempt(storage, offerId) {
  const raw = safeGet(storage, STORAGE_PREFIX + offerId);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v && isAttemptId(v.attemptId)) {
      return { attemptId: v.attemptId, sessionId: isSessionId(v.sessionId) ? v.sessionId : null };
    }
  } catch {
    /* corrupted entry: start a new attempt */
  }
  return null;
}

/**
 * @param {{
 *   offerId: string,
 *   fetchImpl?: typeof fetch,
 *   storage?: Storage | null,
 *   randomUUID?: () => string,
 *   timeoutMs?: number,
 *   endpoint?: string
 * }} options
 */
export function createCheckoutController(options) {
  const {
    offerId,
    fetchImpl = (...args) => fetch(...args),
    storage = null,
    randomUUID = () => crypto.randomUUID(),
    timeoutMs = 15000,
    endpoint = CHECKOUT_ENDPOINT
  } = options;
  if (!getOffer(offerId)) throw new Error('Unknown offer');
  const key = STORAGE_PREFIX + offerId;
  let memoryAttempt = null;
  let inflight = null;

  function save(attempt) {
    memoryAttempt = attempt;
    safeSet(storage, key, JSON.stringify(attempt));
  }

  function currentAttempt() {
    const stored = readCheckoutAttempt(storage, offerId) || memoryAttempt;
    if (stored) return stored;
    const fresh = { attemptId: randomUUID(), sessionId: null };
    save(fresh);
    return fresh;
  }

  async function post(attempt) {
    // Same schema as the server: nothing unvalidated leaves the browser.
    const payload = { offerId, attemptId: attempt.attemptId };
    if (attempt.sessionId) payload.sessionId = attempt.sessionId;
    if (!parseCheckoutRequest(payload).ok) throw Object.assign(new Error('invalid_request'), { name: 'ValidationError' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
        body: JSON.stringify(payload)
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      return { res, data };
    } finally {
      clearTimeout(timer);
    }
  }

  async function run() {
    let attempt = currentAttempt();
    try {
      let { res, data } = await post(attempt);

      // The server says this attempt can no longer be paid (session expired):
      // start one fresh attempt, automatically, once.
      if (res.status === 409 && data?.error === 'checkout_expired') {
        attempt = { attemptId: randomUUID(), sessionId: null };
        save(attempt);
        ({ res, data } = await post(attempt));
      }

      // Only Stripe-hosted Checkout, or this site's confirmation page.
      if (res.ok && data?.status === 'redirect' && isStripeCheckoutUrl(data.url)) {
        save({ attemptId: attempt.attemptId, sessionId: isSessionId(data.sessionId) ? data.sessionId : null });
        return { type: 'redirect', url: data.url };
      }
      if (res.ok && data?.status === 'paid' && isConfirmationPath(data.redirect)) {
        return { type: 'paid', redirect: data.redirect };
      }
      if (res.status === 503) return { type: 'error', code: 'payments_unavailable' };
      if (res.status === 429) return { type: 'error', code: 'rate_limited' };
      return { type: 'error', code: 'checkout_failed' };
    } catch (err) {
      if (err && err.name === 'ValidationError') return { type: 'error', code: 'checkout_failed' };
      return { type: 'error', code: err && err.name === 'AbortError' ? 'timeout' : 'network' };
    }
  }

  return {
    /** Idempotent: returns the in-flight (or completed redirect) promise. */
    start() {
      if (!inflight) {
        inflight = run().then((result) => {
          // Only a real failure unlocks a retry; a redirect keeps the lock.
          if (result.type === 'error') inflight = null;
          return result;
        });
      }
      return inflight;
    },
    /** Back/forward cache restore: allow a new tap (same attempt id). */
    reset() {
      inflight = null;
    },
    get attemptId() {
      return currentAttempt().attemptId;
    }
  };
}
