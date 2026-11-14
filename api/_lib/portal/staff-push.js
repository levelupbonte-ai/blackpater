/**
 * Tells the LevelUp dashboard to send the team's push notifications now
 * (new member, new message). The dashboard only sends what its database
 * already queued for the site's team, so this call carries nothing: no key,
 * no member data. Best effort, bounded, never throws.
 */
export const DEFAULT_STAFF_PUSH_URL = 'https://dashboard.levelup-ecosystem.com/api/push/staff';

export function staffPushUrl(env = process.env) {
  const v = String(env.LEVELUP_STAFF_PUSH_URL || '').trim();
  return /^https:\/\/[^\s]+$/.test(v) ? v : DEFAULT_STAFF_PUSH_URL;
}

export function createStaffPinger(deps = {}) {
  const fetchImpl = deps.fetch || ((...a) => globalThis.fetch(...a));
  const url = staffPushUrl(deps.env);
  return async function pingStaff() {
    try {
      await fetchImpl(url, { method: 'POST', signal: AbortSignal.timeout(2000) });
    } catch {
      // The dashboard's own runs catch up; a member's action never fails here.
    }
  };
}
