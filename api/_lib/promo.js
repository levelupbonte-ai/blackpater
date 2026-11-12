/**
 * Promo codes managed in the LevelUp dashboard (Marketing > Promo codes).
 * The server asks LevelUp (site_promo_check, authenticated by LEVELUP_SITE_KEY)
 * whether a code applies to this offer and amount, then charges the amount
 * LevelUp returns. Nothing is consumed here: LevelUp counts the use when the
 * paid payment arrives with promo_code_id in its metadata.
 */
import { createHash } from 'node:crypto';
import { LEVELUP_SUPABASE_URL, getLevelUpConfig } from './levelup.js';

export const PROMO_CODE_RE = /^[A-Za-z0-9_-]{3,32}$/;
const REASONS = new Set(['unknown', 'expired', 'used_up', 'not_applicable']);

/** { ok: true, codeId, code, finalAmount, amountOff } or { ok: false, reason }. Never throws. */
export async function checkPromo({ code, offerId, amount, currency, ip }, deps = {}) {
  const fetchImpl = deps.fetch || ((...a) => globalThis.fetch(...a));
  const cfg = (deps.getConfig || getLevelUpConfig)();
  if (!PROMO_CODE_RE.test(String(code || ''))) return { ok: false, reason: 'unknown' };
  if (!cfg.siteKey) return { ok: false, reason: 'unavailable' };
  const client = createHash('sha256').update(`${ip || ''}|${cfg.siteKey.slice(-12)}`).digest('hex').slice(0, 32);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 6000);
  try {
    const res = await fetchImpl(`${LEVELUP_SUPABASE_URL}/rest/v1/rpc/site_promo_check`, {
      method: 'POST',
      headers: { apikey: cfg.publishableKey, Authorization: `Bearer ${cfg.publishableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_key: cfg.siteKey, p_code: code, p_offer_id: offerId, p_amount: amount, p_currency: currency, p_client: client }),
      signal: controller.signal
    });
    const body = await res.json().catch(() => null);
    if (res.status === 429 || body?.code === 'PT429') return { ok: false, reason: 'rate_limited' };
    if (!res.ok || !body) return { ok: false, reason: 'unavailable' };
    if (!body.ok) return { ok: false, reason: REASONS.has(body.reason) ? body.reason : 'unknown' };
    const finalAmount = Number(body.final_amount);
    if (!Number.isInteger(finalAmount) || finalAmount < 50 || finalAmount > amount || typeof body.code_id !== 'string') {
      return { ok: false, reason: 'unavailable' };
    }
    return { ok: true, codeId: body.code_id, code: String(body.code), finalAmount, amountOff: amount - finalAmount };
  } catch {
    return { ok: false, reason: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}
