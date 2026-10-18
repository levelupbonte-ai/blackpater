/**
 * Small in-memory structures. On Vercel each warm function instance has its
 * own copy and loses it on cold start: they are a cheap first layer only.
 * The real guarantees come from Stripe (idempotency keys, one payment per
 * Checkout Session) — see README "Payment safety".
 */

/** Set that forgets its oldest entries beyond `max`. */
export function createBoundedSet(max = 2000) {
  const items = new Set();
  return {
    has: (k) => items.has(k),
    add(k) {
      items.delete(k);
      items.add(k);
      while (items.size > max) items.delete(items.values().next().value);
    },
    get size() {
      return items.size;
    }
  };
}

/** Map with per-entry expiry and a size cap. */
export function createTtlMap(max = 5000, now = () => Date.now()) {
  const items = new Map();
  return {
    get(k) {
      const e = items.get(k);
      if (!e) return undefined;
      if (e.expiresAt <= now()) {
        items.delete(k);
        return undefined;
      }
      return e.value;
    },
    set(k, value, ttlMs) {
      items.delete(k);
      items.set(k, { value, expiresAt: now() + ttlMs });
      while (items.size > max) items.delete(items.keys().next().value);
    },
    delete: (k) => items.delete(k),
    clear: () => items.clear()
  };
}

/** Fixed-window rate limiter keyed by client IP. */
export function createRateLimiter({ windowMs, max, now = () => Date.now() }) {
  const hits = new Map();
  return function check(key) {
    const t = now();
    let e = hits.get(key);
    if (!e || e.resetAt <= t) {
      e = { count: 0, resetAt: t + windowMs };
      hits.set(key, e);
    }
    e.count += 1;
    if (hits.size > 10000) {
      for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
    }
    if (e.count > max) return { ok: false, retryAfter: Math.ceil((e.resetAt - t) / 1000) };
    return { ok: true, retryAfter: 0 };
  };
}
