import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutController, readCheckoutAttempt } from '../src/lib/checkout-client.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

let uuidSeq = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++uuidSeq).padStart(12, '0')}`;

test('many taps while a request is in flight send exactly one request', async () => {
  const bodies = [];
  let release;
  const gate = new Promise((r) => (release = r));
  const fetchImpl = async (_url, init) => {
    bodies.push(JSON.parse(init.body));
    await gate;
    return response(200, { status: 'redirect', url: 'https://checkout.stripe.com/c/pay/cs_test_aaaaaaaaaaaa1', sessionId: 'cs_test_aaaaaaaaaaaa1' });
  };
  const c = createCheckoutController({ offerId: 'accompagnement-voyage', fetchImpl, storage: memoryStorage(), randomUUID: uuid });
  const taps = Array.from({ length: 6 }, () => c.start());
  release();
  const results = await Promise.all(taps);
  assert.equal(bodies.length, 1);
  assert.ok(results.every((r) => r.type === 'redirect' && r.url.endsWith('cs_test_aaaaaaaaaaaa1')));
  // Still locked after the redirect started: another tap does not re-request.
  await c.start();
  assert.equal(bodies.length, 1);
});

test('a retry after a failure reuses the same attempt id (and the session id)', async () => {
  const bodies = [];
  let n = 0;
  const fetchImpl = async (_url, init) => {
    bodies.push(JSON.parse(init.body));
    n += 1;
    if (n === 1) return response(200, { status: 'redirect', url: 'https://checkout.stripe.com/c/pay/cs_test_bbbbbbbbbbbb1', sessionId: 'cs_test_bbbbbbbbbbbb1' });
    if (n === 2) throw new TypeError('Failed to fetch');
    return response(200, { status: 'redirect', url: 'https://checkout.stripe.com/c/pay/cs_test_bbbbbbbbbbbb1', sessionId: 'cs_test_bbbbbbbbbbbb1' });
  };
  const storage = memoryStorage();
  const c = createCheckoutController({ offerId: 'accompagnement-voyage', fetchImpl, storage, randomUUID: uuid });
  await c.start();
  c.reset(); // e.g. the visitor came back with the browser's back button
  const failed = await c.start();
  assert.deepEqual(failed, { type: 'error', code: 'network' });
  const ok = await c.start();
  assert.equal(ok.type, 'redirect');
  assert.equal(bodies.length, 3);
  assert.equal(new Set(bodies.map((b) => b.attemptId)).size, 1, 'same attempt id every time');
  assert.equal(bodies[1].sessionId, 'cs_test_bbbbbbbbbbbb1');
  assert.equal(readCheckoutAttempt(storage, 'accompagnement-voyage').attemptId, bodies[0].attemptId);
});

test('timeouts abort the request and allow a retry with the same attempt', async () => {
  const bodies = [];
  const fetchImpl = (_url, init) =>
    new Promise((resolve, reject) => {
      bodies.push(JSON.parse(init.body));
      init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    });
  const c = createCheckoutController({ offerId: 'accompagnement-voyage', fetchImpl, storage: memoryStorage(), randomUUID: uuid, timeoutMs: 20 });
  assert.deepEqual(await c.start(), { type: 'error', code: 'timeout' });
  assert.deepEqual(await c.start(), { type: 'error', code: 'timeout' });
  assert.equal(bodies[0].attemptId, bodies[1].attemptId);
});

test('the attempt survives a reload (sessionStorage) and a new controller', async () => {
  const storage = memoryStorage();
  const seen = [];
  const fetchImpl = async (_url, init) => {
    seen.push(JSON.parse(init.body).attemptId);
    return response(502, { error: 'checkout_failed' });
  };
  await createCheckoutController({ offerId: 'accompagnement-voyage', fetchImpl, storage, randomUUID: uuid }).start();
  await createCheckoutController({ offerId: 'accompagnement-voyage', fetchImpl, storage, randomUUID: uuid }).start();
  assert.equal(seen[0], seen[1]);
});

test('server states are mapped to neutral client codes', async () => {
  const make = (status, body) =>
    createCheckoutController({ offerId: 'accompagnement-voyage', fetchImpl: async () => response(status, body), storage: memoryStorage(), randomUUID: uuid }).start();
  assert.deepEqual(await make(503, { error: 'payments_unavailable' }), { type: 'error', code: 'payments_unavailable' });
  assert.deepEqual(await make(429, { error: 'rate_limited' }), { type: 'error', code: 'rate_limited' });
  assert.deepEqual(await make(500, { message: 'secret detail' }), { type: 'error', code: 'checkout_failed' });
  assert.deepEqual(await make(200, { status: 'paid', redirect: '/paiement/confirmation?session_id=cs_test_cccccccccccc1' }), {
    type: 'paid',
    redirect: '/paiement/confirmation?session_id=cs_test_cccccccccccc1'
  });
  assert.equal((await make(200, { status: 'redirect', url: 'javascript:alert(1)' })).type, 'error');
});

test('an expired attempt is replaced once by a fresh one', async () => {
  const ids = [];
  const fetchImpl = async (_url, init) => {
    const { attemptId } = JSON.parse(init.body);
    ids.push(attemptId);
    if (ids.length === 1) return response(409, { error: 'checkout_expired' });
    return response(200, { status: 'redirect', url: 'https://checkout.stripe.com/c/pay/cs_test_dddddddddddd1', sessionId: 'cs_test_dddddddddddd1' });
  };
  const r = await createCheckoutController({ offerId: 'accompagnement-voyage', fetchImpl, storage: memoryStorage(), randomUUID: uuid }).start();
  assert.equal(r.type, 'redirect');
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
});
