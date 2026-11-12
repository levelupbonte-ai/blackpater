/**
 * Calls the LevelUp database functions of the client portal (portal_*). The
 * publishable key in the headers is public; what authenticates the call is the
 * portal server key sent as p_key. Errors come back as short codes only: the
 * database message never reaches the browser or the logs.
 */
import { LEVELUP_SUPABASE_URL, getLevelUpConfig } from '../levelup.js';

export class PortalDbError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const CODE_STATUS = {
  PT401: [401, 'unauthorized'],
  PT403: [503, 'portal_unavailable'],
  PT402: [402, 'membership_expired'],
  PT404: [404, 'not_found'],
  PT429: [429, 'rate_limited'],
  '22023': [400, 'invalid_request'],
  '22P02': [400, 'invalid_request']
};

export function createPortalDb(deps = {}) {
  const fetchImpl = deps.fetch || ((...a) => globalThis.fetch(...a));
  const publishableKey = () => (deps.publishableKey ?? getLevelUpConfig().publishableKey);
  const timeoutMs = deps.timeoutMs ?? 8000;

  return async function rpc(name, args) {
    if (!/^portal_[a-z_]+$/.test(name)) throw new PortalDbError('invalid_function', 500);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(`${LEVELUP_SUPABASE_URL}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: {
          apikey: publishableKey(),
          Authorization: `Bearer ${publishableKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(args),
        signal: controller.signal
      });
    } catch {
      throw new PortalDbError('upstream_unavailable', 503);
    } finally {
      clearTimeout(timer);
    }
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (res.ok) return body;
    const mapped = CODE_STATUS[body?.code];
    if (mapped) throw new PortalDbError(mapped[1], mapped[0]);
    // A key with the wrong website or revoked shows up as 401 on the key, not the session.
    throw new PortalDbError('upstream_error', 502);
  };
}
