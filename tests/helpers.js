import { Readable } from 'node:stream';

/** Minimal Node-like request: a readable stream with method, url and headers. */
export function fakeReq({ method = 'GET', url = '/', headers = {}, body } = {}) {
  const raw = body === undefined ? Buffer.alloc(0) : Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  const req = Readable.from(raw.length ? [raw] : []);
  req.method = method;
  req.url = url;
  req.headers = { host: 'blackpater.com', 'x-forwarded-for': '203.0.113.7', ...headers };
  if (raw.length && !req.headers['content-length']) req.headers['content-length'] = String(raw.length);
  return req;
}

export function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    end(chunk) {
      this.body = chunk ? JSON.parse(String(chunk)) : null;
      this.done = true;
    }
  };
  return res;
}

export function jsonPost(url, body, headers = {}) {
  return fakeReq({ method: 'POST', url, body, headers: { 'content-type': 'application/json', ...headers } });
}

export const silentLog = { info() {}, warn() {}, error() {} };

/**
 * Fake Stripe client that honours idempotency keys like Stripe does: the same
 * key returns the same session object, and records every call.
 */
export function fakeStripe({ now = () => Date.now() } = {}) {
  const sessions = new Map();
  const byKey = new Map();
  const calls = { create: [], retrieve: [] };
  let seq = 0;
  const stripe = {
    calls,
    sessions,
    checkout: {
      sessions: {
        async create(params, opts = {}) {
          calls.create.push({ params, opts });
          if (opts.idempotencyKey && byKey.has(opts.idempotencyKey)) return { ...byKey.get(opts.idempotencyKey) };
          seq += 1;
          const id = `cs_test_${String(seq).padStart(12, 'a')}`;
          const s = {
            id,
            url: `https://checkout.stripe.com/c/pay/${id}`,
            status: 'open',
            payment_status: 'unpaid',
            created: Math.floor(now() / 1000),
            expires_at: params.expires_at,
            client_reference_id: params.client_reference_id,
            metadata: params.metadata,
            amount_total: params.line_items[0].price_data.unit_amount,
            currency: params.line_items[0].price_data.currency
          };
          sessions.set(id, s);
          if (opts.idempotencyKey) byKey.set(opts.idempotencyKey, { ...s });
          return { ...s };
        },
        async retrieve(id) {
          calls.retrieve.push(id);
          const s = sessions.get(id);
          if (!s) {
            const err = new Error('No such checkout.session');
            err.code = 'resource_missing';
            throw err;
          }
          return { ...s };
        }
      }
    }
  };
  return stripe;
}
