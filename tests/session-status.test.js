import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStatusHandler } from '../api/_lib/session-status.js';
import { fakeReq, fakeRes, fakeStripe, silentLog } from './helpers.js';

const ID = 'cs_test_status0000000001';

function setup(session) {
  const stripe = fakeStripe();
  if (session) stripe.sessions.set(session.id, session);
  const handler = createSessionStatusHandler({ getStripe: () => stripe, log: silentLog });
  return async (id = ID) => {
    const res = fakeRes();
    await handler(fakeReq({ url: `/api/stripe/session-status?session_id=${encodeURIComponent(id)}` }), res);
    return res;
  };
}

const base = { id: ID, amount_total: 100, currency: 'usd', client_reference_id: '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c', metadata: { offer_id: 'accompagnement-voyage' }, customer_details: { email: 'someone@example.com', name: 'Someone' } };

test('paid session is confirmed', async () => {
  const res = await setup({ ...base, status: 'complete', payment_status: 'paid' })();
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.state, 'paid');
});

test('unpaid (open) session is not confirmed', async () => {
  const res = await setup({ ...base, status: 'open', payment_status: 'unpaid' })();
  assert.equal(res.body.state, 'open');
});

test('expired session is not confirmed', async () => {
  const res = await setup({ ...base, status: 'expired', payment_status: 'unpaid' })();
  assert.equal(res.body.state, 'expired');
});

test('completed session with a pending delayed payment is "processing"', async () => {
  const res = await setup({ ...base, status: 'complete', payment_status: 'unpaid' })();
  assert.equal(res.body.state, 'processing');
});

test('returns no personal data', async () => {
  const res = await setup({ ...base, status: 'complete', payment_status: 'paid' })();
  const text = JSON.stringify(res.body);
  assert.ok(!text.includes('someone@example.com') && !text.includes('Someone'));
});

test('sessions of other products are not confirmed', async () => {
  const res = await setup({ ...base, status: 'complete', payment_status: 'paid', metadata: {} })();
  assert.equal(res.statusCode, 404);
});

test('unknown or malformed ids', async () => {
  const check = setup(null);
  assert.equal((await check('cs_test_doesnotexist0001')).statusCode, 404);
  assert.equal((await check('../../etc')).statusCode, 400);
});

test('503 when Stripe is not configured', async () => {
  const handler = createSessionStatusHandler({ getStripe: () => null, log: silentLog });
  const res = fakeRes();
  await handler(fakeReq({ url: `/api/stripe/session-status?session_id=${ID}` }), res);
  assert.equal(res.statusCode, 503);
});
