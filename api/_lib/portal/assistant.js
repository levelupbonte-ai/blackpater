/**
 * Calls the LevelUp AI assistant (dashboard.levelup-ecosystem.com) for a
 * member. The AI keys live at LevelUp, never on this site: this server only
 * forwards the member's question with the portal key and the member's session,
 * which the LevelUp database checks (membership, daily limit). Errors come back
 * as short codes only.
 */
import { PortalDbError } from './db.js';

export const DEFAULT_ASSISTANT_URL = 'https://dashboard.levelup-ecosystem.com/api/portal/assistant';

const CODES = {
  400: 'invalid_request',
  401: 'unauthorized',
  402: 'membership_expired',
  404: 'assistant_unavailable',
  429: 'rate_limited',
  503: 'ai_unavailable'
};

export function assistantUrl(env = process.env) {
  const v = String(env.LEVELUP_ASSISTANT_URL || '').trim();
  return /^https:\/\/[a-z0-9.-]+\/api\/portal\/assistant$/.test(v) ? v : DEFAULT_ASSISTANT_URL;
}

export function createAssistantClient(deps = {}) {
  const fetchImpl = deps.fetch || ((...a) => globalThis.fetch(...a));
  const timeoutMs = deps.timeoutMs ?? 55000;
  const url = deps.url || assistantUrl();

  return async function callAssistant(portalKey, payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${portalKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch {
      throw new PortalDbError('ai_unavailable', 503);
    } finally {
      clearTimeout(timer);
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
