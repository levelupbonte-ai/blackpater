/**
 * Payment records for the owner's LevelUp Ecosystem dashboard.
 *
 * Every Checkout Session outcome received by the Stripe webhook (and the
 * one-off backfill script) is sent to the LevelUp database through the public
 * RPC `site_ingest_payment`. The request is authenticated by LEVELUP_SITE_KEY,
 * a per-site secret held only in the server environment; the Supabase URL and
 * publishable key below are public (the same values ship to every visitor in
 * public/js/levelup-config.js) and grant nothing on their own.
 *
 * Forwarding is best effort: a missing key, a timeout or an error never fails
 * the Stripe webhook. LevelUp de-duplicates on `provider_event_id`, so a
 * redelivered event or a re-run of the backfill is harmless.
 *
 * Logs never contain keys, emails, names or response bodies.
 */
import { getOffer } from '../../shared/offers.js';
import { readEnv } from './stripe.js';

/** Public LevelUp configuration (not secrets). */
export const LEVELUP_SUPABASE_URL = 'https://rncuhmvykrmtxfzqpitc.supabase.co';
export const LEVELUP_PUBLISHABLE_KEY_DEFAULT = 'sb_publishable_C6yyhI8mh1Dcgfw94mxVYg_VIIMqvBE';
export const LEVELUP_INGEST_PATH = '/rest/v1/rpc/site_ingest_payment';

export const ATTEMPT_TIMEOUT_MS = 5000;
/** Overall budget for one forward (first try + one retry), well under Stripe's webhook timeout. */
export const TOTAL_BUDGET_MS = 9000;
const RETRY_DELAY_MS = 300;

export const PAYMENT_STATUSES = Object.freeze(['paid', 'pending', 'failed', 'refunded', 'expired']);

export function getLevelUpConfig() {
  return {
    url: LEVELUP_SUPABASE_URL,
    publishableKey: readEnv('SUPABASE_PUBLISHABLE_KEY') || LEVELUP_PUBLISHABLE_KEY_DEFAULT,
    siteKey: readEnv('LEVELUP_SITE_KEY')
  };
}

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return typeof value.id === 'string' ? value.id : null;
}

function strOrNull(value, max = 320) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function isoFromUnix(seconds, fallbackMs = Date.now()) {
  const ms = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : fallbackMs;
  return new Date(ms).toISOString();
}

/**
 * Status of a Checkout Session for the dashboard, from the webhook event type
 * (or from the session itself when `eventType` is omitted, as in the backfill).
 * Returns null when there is nothing to record (session still open).
 */
export function paymentStatusFor(eventType, session) {
  switch (eventType) {
    case 'checkout.session.async_payment_succeeded':
      return 'paid';
    case 'checkout.session.async_payment_failed':
      return 'failed';
    case 'checkout.session.expired':
      return 'expired';
    case 'checkout.session.completed':
      return session?.payment_status === 'unpaid' ? 'pending' : 'paid';
    default:
      if (session?.status === 'complete') return session.payment_status === 'unpaid' ? 'pending' : 'paid';
      if (session?.status === 'expired') return 'expired';
      return null;
  }
}

/**
 * The `p_event` object of the LevelUp contract, for one Checkout Session of a
 * catalog offer. Returns null for sessions that are not ours.
 */
export function buildPaymentEvent({ eventId, eventCreated, session, status, extraMetadata }) {
  const offer = getOffer(session?.metadata?.offer_id);
  if (!offer || !PAYMENT_STATUSES.includes(status)) return null;
  const details = session.customer_details || {};
  const amount = Number.isInteger(session.amount_total) ? session.amount_total : offer.amount;
  const metadata = { attempt_id: strOrNull(session.client_reference_id, 64) || strOrNull(session.metadata?.attempt_id, 64) };
  if (extraMetadata) Object.assign(metadata, extraMetadata);
  return {
    provider: 'stripe',
    provider_event_id: eventId,
    provider_session_id: session.id,
    provider_payment_intent: idOf(session.payment_intent),
    status,
    amount,
    currency: String(session.currency || offer.currency).toLowerCase(),
    offer_id: offer.id,
    offer_name: offer.stripeName,
    customer_email: strOrNull(details.email),
    customer_name: strOrNull(details.name, 200),
    occurred_at: isoFromUnix(eventCreated),
    metadata
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isRetryable(result) {
  return result.reason === 'timeout' || result.reason === 'network' || result.status === 429 || result.status >= 500;
}

/**
 * Sender for `site_ingest_payment`. `forward(pEvent)` resolves to
 * { ok, skipped?, status?, reason?, attempts } and never throws.
 */
export function createLevelUpForwarder(deps = {}) {
  const fetchImpl = deps.fetch || ((...args) => globalThis.fetch(...args));
  const configFor = deps.getConfig || getLevelUpConfig;
  const log = deps.log || console;
  const now = deps.now || (() => Date.now());
  const attemptTimeoutMs = deps.attemptTimeoutMs ?? ATTEMPT_TIMEOUT_MS;
  const totalBudgetMs = deps.totalBudgetMs ?? TOTAL_BUDGET_MS;
  const retryDelayMs = deps.retryDelayMs ?? RETRY_DELAY_MS;
  let warnedMissingKey = false;

  async function attempt(cfg, body, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${cfg.url.replace(/\/+$/, '')}${LEVELUP_INGEST_PATH}`, {
        method: 'POST',
        headers: {
          apikey: cfg.publishableKey,
          Authorization: `Bearer ${cfg.publishableKey}`,
          'Content-Type': 'application/json'
        },
        body,
        signal: controller.signal
      });
      // Drain the body so the connection can be reused; its content is never logged.
      try {
        await res.text();
      } catch {
        /* ignore */
      }
      return res.ok ? { ok: true, status: res.status } : { ok: false, status: res.status, reason: 'http' };
    } catch (err) {
      return { ok: false, status: 0, reason: controller.signal.aborted || err?.name === 'AbortError' ? 'timeout' : 'network' };
    } finally {
      clearTimeout(timer);
    }
  }

  return async function forward(pEvent) {
    if (!pEvent) return { ok: false, skipped: true, reason: 'not_applicable', attempts: 0 };
    const cfg = configFor();
    if (!cfg.siteKey) {
      if (!warnedMissingKey) {
        warnedMissingKey = true;
        log.info(JSON.stringify({ evt: 'levelup.forward_skipped', reason: 'missing_site_key' }));
      }
      return { ok: false, skipped: true, reason: 'missing_site_key', attempts: 0 };
    }

    const body = JSON.stringify({ p_key: cfg.siteKey, p_event: pEvent });
    const started = now();
    let result = await attempt(cfg, body, attemptTimeoutMs);
    let attempts = 1;
    if (!result.ok && isRetryable(result)) {
      await sleep(retryDelayMs);
      const remaining = totalBudgetMs - (now() - started);
      if (remaining >= 1000) {
        result = await attempt(cfg, body, Math.min(attemptTimeoutMs, remaining));
        attempts = 2;
      }
    }

    if (!result.ok) {
      log.warn(
        JSON.stringify({
          evt: 'levelup.forward_failed',
          eventId: pEvent.provider_event_id,
          paymentStatus: pEvent.status,
          httpStatus: result.status || null,
          reason: result.reason,
          attempts
        })
      );
    }
    return { ...result, attempts };
  };
}
