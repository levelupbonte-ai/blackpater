/**
 * Minimal HTTP helpers that work the same on Vercel Functions, Express and the
 * Vite dev server: they only use the plain Node request/response API.
 */

export class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export function sendJson(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: allowed.join(', ') });
}

/**
 * Reads the raw request body as a Buffer (needed for Stripe signatures).
 * Never touches `req.body`, which Vercel parses lazily on access.
 */
export async function readRawBody(req, limitBytes) {
  if (Buffer.isBuffer(req.rawBody)) {
    if (req.rawBody.length > limitBytes) throw new HttpError(413, 'payload_too_large');
    return req.rawBody;
  }
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > limitBytes) throw new HttpError(413, 'payload_too_large');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += buf.length;
    if (size > limitBytes) throw new HttpError(413, 'payload_too_large');
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

/** Reads a small JSON object body. Rejects anything that is not a plain object. */
export async function readJsonBody(req, limitBytes) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > limitBytes) throw new HttpError(413, 'payload_too_large');
  const type = String(req.headers['content-type'] || '').toLowerCase();
  if (!type.startsWith('application/json')) throw new HttpError(415, 'unsupported_media_type');

  let body;
  try {
    // Vercel exposes an already-parsed body; Express (without a body parser)
    // and the Vite dev server leave it undefined.
    body = req.body;
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
  if (body === undefined || body === null || Buffer.isBuffer(body) || typeof body === 'string') {
    const raw = body === undefined || body === null ? await readRawBody(req, limitBytes) : Buffer.from(body);
    if (raw.length > limitBytes) throw new HttpError(413, 'payload_too_large');
    if (raw.length === 0) return {};
    try {
      body = JSON.parse(raw.toString('utf8'));
    } catch {
      throw new HttpError(400, 'invalid_json');
    }
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new HttpError(400, 'invalid_json');
  // A body pre-parsed by the platform (chunked upload, no Content-Length) is
  // held to the same size cap.
  if (Buffer.byteLength(JSON.stringify(body)) > limitBytes) throw new HttpError(413, 'payload_too_large');
  return body;
}

export function getClientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(req.headers['x-real-ip'] || '') || req.socket?.remoteAddress || 'unknown';
}

const PRODUCTION_ORIGIN = 'https://blackpater.com';

function isAllowedHost(host) {
  return (
    host === 'blackpater.com' ||
    host === 'www.blackpater.com' ||
    /^[a-z0-9-]+\.vercel\.app$/.test(host) ||
    /^(localhost|127\.0\.0\.1)(:\d{2,5})?$/.test(host)
  );
}

/**
 * Origin used to build the Stripe return URLs. Only known hosts are accepted;
 * anything else falls back to the production site, so a forged Host header can
 * never send a customer to a foreign domain after payment.
 */
export function resolveOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (!isAllowedHost(host)) return PRODUCTION_ORIGIN;
  const local = /^(localhost|127\.0\.0\.1)/.test(host);
  return `${local ? 'http' : 'https'}://${host}`;
}
