import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutHandler, BUCKET_MS } from '../api/_lib/checkout.js';
import { createRateLimiter } from '../api/_lib/memory.js';
import { fakeReq, fakeRes, fakeStripe, jsonPost, silentLog } from './helpers.js';

const URL = '/api/stripe/create-checkout-session';
const ATTEMPT = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

function setup({ stripe = fakeStripe(), now = () => 1_800_000_000_000, ...rest } = {}) {
  const handler = createCheckoutHandler({ getStripe: () => stripe, now, log: silentLog, ...rest });
  return { stripe, handler };
}

async function call(handler, body, headers) {
  const res = fakeRes();
  await handler(jsonPost(URL, body, headers), res);
  return res;
}

test('price comes from the server catalog, never from the request', async () => {
  const { stripe, handler } = setup();
  const res = await call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT, amount: 0.01, planName: 'x' });
  assert.equal(res.statusCode, 200);
  const params = stripe.calls.create[0].params;
  assert.equal(params.line_items[0].price_data.unit_amount, 100);
  assert.equal(params.line_items[0].price_data.currency, 'usd');
  assert.equal(params.client_reference_id, ATTEMPT);
  assert.equal(params.payment_method_types, undefined);
  assert.equal(params.mode, 'payment');
  assert.match(params.success_url, /^https:\/\/blackpater\.com\/paiement\/confirmation\?session_id=\{CHECKOUT_SESSION_ID\}$/);
});

test('repeated taps for one attempt reuse a single Checkout Session', async () => {
  const { stripe, handler } = setup();
  const results = await Promise.all(
    Array.from({ length: 5 }, () => call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT }))
  );
  const urls = new Set(results.map((r) => r.body.url));
  assert.equal(urls.size, 1, 'all taps get the same URL');
  assert.equal(stripe.sessions.size, 1, 'only one session exists at Stripe');
  // Sequential taps after the first are answered from memory.
  const again = await call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT });
  assert.equal(again.body.url, results[0].body.url);
});

test('retries use the same idempotency key, even on a fresh instance', async () => {
  const stripe = fakeStripe();
  const t = 1_800_000_000_000;
  const a = setup({ stripe, now: () => t }).handler;
  const b = setup({ stripe, now: () => t + 5 * 60 * 1000 }).handler; // cold start, 5 min later, same window
  const r1 = await call(a, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT });
  const r2 = await call(b, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT });
  const keys = stripe.calls.create.map((c) => c.opts.idempotencyKey);
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
  assert.ok(keys[0].includes(ATTEMPT) && keys[0].includes('accompagnement-voyage'));
  assert.equal(r1.body.url, r2.body.url);
  assert.equal(stripe.sessions.size, 1);
});

test('an open session the browser already has is reused across time windows', async () => {
  const stripe = fakeStripe();
  const t = 1_800_000_000_000;
  const first = await call(setup({ stripe, now: () => t }).handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT });
  const later = setup({ stripe, now: () => t + BUCKET_MS }).handler;
  const r = await call(later, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT, sessionId: first.body.sessionId });
  assert.equal(r.body.url, first.body.url);
  assert.equal(stripe.sessions.size, 1);
});

test('an attempt whose session is already paid goes to the confirmation page', async () => {
  const stripe = fakeStripe();
  const t = 1_800_000_000_000;
  const first = await call(setup({ stripe, now: () => t }).handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT });
  Object.assign(stripe.sessions.get(first.body.sessionId), { status: 'complete', payment_status: 'paid' });
  const r = await call(setup({ stripe, now: () => t + 3 * 60 * 1000 }).handler, {
    offerId: 'accompagnement-voyage',
    attemptId: ATTEMPT,
    sessionId: first.body.sessionId
  });
  assert.equal(r.body.status, 'paid');
  assert.equal(r.body.redirect, `/paiement/confirmation?session_id=${first.body.sessionId}`);
  assert.equal(stripe.sessions.size, 1, 'no new session is created');
});

test('a session id from another attempt is never reused', async () => {
  const stripe = fakeStripe();
  const other = await call(setup({ stripe }).handler, { offerId: 'accompagnement-voyage', attemptId: '11111111-2222-4333-8444-555555555555' });
  const r = await call(setup({ stripe }).handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT, sessionId: other.body.sessionId });
  assert.notEqual(r.body.url, other.body.url);
});

test('without STRIPE_SECRET_KEY the endpoint answers a neutral 503', async () => {
  const handler = createCheckoutHandler({ getStripe: () => null, log: silentLog });
  const res = await call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT });
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: 'payments_unavailable' });
});

test('Stripe errors are logged without details and never sent to the browser', async () => {
  const logged = [];
  const stripe = fakeStripe();
  stripe.checkout.sessions.create = async () => {
    const err = new Error('Invalid API Key provided: sk_test_****abcd');
    err.type = 'StripeAuthenticationError';
    throw err;
  };
  const handler = createCheckoutHandler({ getStripe: () => stripe, log: { error: (m) => logged.push(m) } });
  const res = await call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT });
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { error: 'checkout_failed' });
  assert.ok(!JSON.stringify(res.body).includes('sk_'));
  assert.ok(logged.length === 1 && !logged[0].includes('sk_'));
});

test('rejects unknown offers, malformed ids, oversized bodies and other methods', async () => {
  const { handler } = setup();
  assert.equal((await call(handler, { offerId: 'other', attemptId: ATTEMPT })).statusCode, 400);
  assert.equal((await call(handler, { offerId: 'accompagnement-voyage', attemptId: 'abc' })).statusCode, 400);
  assert.equal((await call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT, sessionId: 'evil' })).statusCode, 400);
  assert.equal((await call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT, pad: 'x'.repeat(5000) })).statusCode, 413);
  const res = fakeRes();
  await handler(fakeReq({ method: 'GET', url: URL }), res);
  assert.equal(res.statusCode, 405);
});

test('rate limits a single client', async () => {
  const { handler } = setup({ limiter: createRateLimiter({ windowMs: 60000, max: 3 }) });
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT })).statusCode);
  assert.deepEqual(codes, [200, 200, 200, 429, 429]);
});

test('return URLs never point to a foreign host', async () => {
  const { stripe, handler } = setup();
  await call(handler, { offerId: 'accompagnement-voyage', attemptId: ATTEMPT }, { host: 'evil.example', 'x-forwarded-host': 'evil.example' });
  assert.match(stripe.calls.create[0].params.success_url, /^https:\/\/blackpater\.com\//);
});
