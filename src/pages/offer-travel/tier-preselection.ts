/**
 * Tier chosen on /abonnements, handed to the PaterGuide questionnaire on the
 * offer page. `pg:preselected_tier` is the remembered default; the "fresh"
 * marker says the visitor just picked it, so it wins over a saved draft once.
 */
export type TierKey = 'solo' | 'duo' | 'family';

const TIER_KEY = 'pg:preselected_tier';
const FRESH_KEY = 'pg:preselected_tier_fresh';

export function isTier(v: unknown): v is TierKey {
  return v === 'solo' || v === 'duo' || v === 'family';
}

export function preselectTier(tier: TierKey) {
  try {
    window.localStorage.setItem(TIER_KEY, tier);
    window.sessionStorage.setItem(FRESH_KEY, '1');
  } catch {
    /* storage blocked: the questionnaire simply asks */
  }
}

/** The tier just chosen on /abonnements (consumed once), or null. */
export function takeFreshTier(): TierKey | null {
  try {
    if (window.sessionStorage.getItem(FRESH_KEY) !== '1') return null;
    window.sessionStorage.removeItem(FRESH_KEY);
    const v = window.localStorage.getItem(TIER_KEY);
    return isTier(v) ? v : null;
  } catch {
    return null;
  }
}
