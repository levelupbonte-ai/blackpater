/**
 * Small, dependency-free helpers of the portal API: session cookie, coarse
 * device label, hashed client id for rate limits, password checks, the signed
 * "send now" call from the LevelUp dashboard.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_MAX_AGE = 7 * 24 * 3600;

/** __Host- cookies need https; local development (http://localhost) uses a plain name. */
export function cookieName(secure) {
  return secure ? '__Host-bp_portal' : 'bp_portal';
}

export function readSessionCookie(req) {
  const header = String(req.headers.cookie || '');
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === '__Host-bp_portal' || k === 'bp_portal') {
      const value = v.join('=');
      if (/^[0-9a-f]{64}$/.test(value)) return value;
    }
  }
  return null;
}

export function sessionCookie(token, { secure, maxAge = SESSION_MAX_AGE }) {
  const attrs = [`${cookieName(secure)}=${token || ''}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${token ? maxAge : 0}`];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

/** "Chrome on Android" — browser family + OS only, never the full user agent. */
export function deviceLabel(ua) {
  const s = String(ua || '').slice(0, 400);
  const os = /iPhone|iPad|iPod/.test(s)
    ? /iPad/.test(s) ? 'iPad' : 'iPhone'
    : /Android/.test(s)
      ? 'Android'
      : /Windows/.test(s)
        ? 'Windows'
        : /Mac OS X|Macintosh/.test(s)
          ? 'Mac'
          : /Linux/.test(s)
            ? 'Linux'
            : '';
  const browser = /Edg\//.test(s)
    ? 'Edge'
    : /OPR\/|Opera/.test(s)
      ? 'Opera'
      : /SamsungBrowser/.test(s)
        ? 'Samsung Internet'
        : /Firefox\/|FxiOS/.test(s)
          ? 'Firefox'
          : /Chrome\/|CriOS/.test(s)
            ? 'Chrome'
            : /Safari\//.test(s)
              ? 'Safari'
              : '';
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || null;
}

/** Pseudonymous client id for rate limits: HMAC of the IP with the server key. */
export function clientHash(ip, secret) {
  return createHmac('sha256', String(secret || 'portal')).update(String(ip || 'unknown')).digest('hex').slice(0, 32);
}

const COMMON = new Set(
  [
    'password', 'password1', 'password123', '1234567890', '12345678910', 'qwertyuiop', 'azertyuiop', 'motdepasse',
    'iloveyou123', 'letmein123', 'welcome123', 'football123', 'blackpater', 'blackpater1', 'blackpater123',
    'blackpater2026', 'jeanpierre', 'lofumbwa123', 'congo12345', 'kinshasa123', 'passw0rd123', 'administrator',
    'changeme123', 'qwerty12345', 'abc1234567', 'monkey12345', 'dragon12345', 'sunshine123', 'princess123'
  ]
);

/**
 * Local rules (also enforced by the database): 10 to 72 bytes, not one repeated
 * character, not a well-known password, not the e-mail or its local part.
 * Returns an error code or null.
 */
export function passwordProblem(password, email) {
  if (typeof password !== 'string' || password.length < 10) return 'password_too_short';
  if (Buffer.byteLength(password) > 72) return 'password_too_long';
  const lower = password.toLowerCase();
  if (/^(.)\1*$/.test(password) || COMMON.has(lower) || /^(\d)+$/.test(password) && new Set(password).size < 4) return 'password_common';
  const local = String(email || '').toLowerCase().split('@')[0];
  if (lower === String(email || '').toLowerCase() || (local.length >= 4 && lower.includes(local))) return 'password_personal';
  return null;
}

/**
 * Breached-password check with Have I Been Pwned's k-anonymity range API: only
 * the first 5 characters of the SHA-1 leave the server. Fails open (returns
 * false) when the service cannot be reached.
 */
export async function isBreached(password, fetchImpl = globalThis.fetch) {
  try {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetchImpl(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`, {
      headers: { 'Add-Padding': 'true' },
      signal: controller.signal
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return false;
    const body = await res.text();
    const suffix = sha1.slice(5);
    return body.split('\n').some((line) => {
      const [hash, count] = line.trim().split(':');
      return hash === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}

/** X-Portal-Signature: t=<unix>,v1=<hex HMAC-SHA256(secret, `${t}.${body}`)>, 5-minute window. */
export function verifySignature(header, rawBody, secret, nowSec = Math.floor(Date.now() / 1000)) {
  if (!secret || typeof header !== 'string') return false;
  const m = /^t=(\d{9,11}),v1=([0-9a-f]{64})$/.exec(header.trim());
  if (!m) return false;
  if (Math.abs(nowSec - Number(m[1])) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${m[1]}.${rawBody}`).digest();
  const given = Buffer.from(m[2], 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Bearer comparison in constant time (Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`). */
export function bearerMatches(header, secret) {
  if (!secret || typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
