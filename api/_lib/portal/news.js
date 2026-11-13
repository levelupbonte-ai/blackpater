/**
 * Official news for members, served by LevelUp (dashboard.levelup-ecosystem.com).
 * Like the assistant: this server forwards the member's session with the
 * portal key; the LevelUp database checks both and decides what the member may
 * see (full feed for a paid month, a preview otherwise). Short error codes only.
 */
import { PortalDbError } from './db.js';

export const DEFAULT_NEWS_URL = 'https://dashboard.levelup-ecosystem.com/api/portal/news';

const CODES = {
  400: 'invalid_request',
  401: 'unauthorized',
  402: 'membership_required',
  429: 'rate_limited',
  503: 'news_unavailable'
};

export function newsUrl(env = process.env) {
  const v = String(env.LEVELUP_NEWS_URL || '').trim();
  return /^https:\/\/[a-z0-9.-]+\/api\/portal\/news$/.test(v) ? v : DEFAULT_NEWS_URL;
}

export function createNewsClient(deps = {}) {
  const fetchImpl = deps.fetch || ((...a) => globalThis.fetch(...a));
  const timeoutMs = deps.timeoutMs ?? 28000;
  const url = deps.url || newsUrl();

  return async function callNews(portalKey, payload) {
    let res;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${portalKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch {
      throw new PortalDbError('news_unavailable', 503);
    }
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (res.ok && body && typeof body === 'object') return body;
    const status = CODES[res.status] ? res.status : 503;
    throw new PortalDbError(CODES[status], status);
  };
}
