import { test } from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { createWebhookHandler } from '../api/_lib/webhook.js';
import { fakeReq, fakeRes, silentLog } from './helpers.js';

const SECRET = 'whsec_test_secret_for_unit_tests';

function event(id, type, session) {
  return { id, object: 'event', type, data: { object: session } };
}

function paidSession(id = 'cs_test_paid000000001') {
  return { id, object: 'checkout.session', status: 'complete', payment_status: 'paid', amount_total: 100, currency: 'usd', livemode: false, metadata: { offer_id: 'accompagnement-voyage' } };
}

function signedReq(payload, secret = SECRET) {
  const body = JSON.stringify(payload);
  const header = Stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return fakeReq({ method: 'POST', url: '/api/stripe/webhook', body, headers: { 'content-type': 'application/json', 'stripe-signature': header } });
}

function setup(secret = SECRET) {
  const paid = [];
  const pending = [];
  const failed = [];
  const handler = createWebhookHandler({
    getWebhookSecret: () => secret,
    log: silentLog,
    forwardPayment: async () => ({ ok: true }),
    hooks: {
      onCheckoutPaid: async (s, e) => paid.push([s.id, e.id]),
      onCheckoutPending: async (s) => pending.push(s.id),
      onCheckoutPaymentFailed: async (s) => failed.push(s.id)
    }
  });
  return { handler, paid, pending, failed };
}

test('valid signature: a paid session is fulfilled once', async () => {
  const { handler, paid } = setup();
  const res = fakeRes();
  await handler(signedReq(event('evt_1', 'checkout.session.completed', paidSession())), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(paid, [['cs_test_paid000000001', 'evt_1']]);
});

test('duplicate event ids are acknowledged but not processed again', async () => {
  const { handler, paid } = setup();
  const payload = event('evt_dup', 'checkout.session.completed', paidSession());
  const r1 = fakeRes();
  const r2 = fakeRes();
  await handler(signedReq(payload), r1);
  await handler(signedReq(payload), r2);
  assert.equal(r2.statusCode, 200);
  assert.equal(r2.body.duplicate, true);
  assert.equal(paid.length, 1);
});

test('one session is fulfilled once even across different events', async () => {
  const { handler, paid } = setup();
  await handler(signedReq(event('evt_a', 'checkout.session.completed', paidSession())), fakeRes());
  await handler(signedReq(event('evt_b', 'checkout.session.async_payment_succeeded', paidSession())), fakeRes());
  assert.equal(paid.length, 1);
});

test('delayed payments: completed-unpaid waits, async success fulfils, async failure is logged', async () => {
  const { handler, paid, pending, failed } = setup();
  const unpaid = { ...paidSession('cs_test_async00000001'), payment_status: 'unpaid' };
  await handler(signedReq(event('evt_c', 'checkout.session.completed', unpaid)), fakeRes());
  assert.deepEqual(pending, ['cs_test_async00000001']);
  assert.equal(paid.length, 0);
  await handler(signedReq(event('evt_d', 'checkout.session.async_payment_succeeded', { ...unpaid, payment_status: 'paid' })), fakeRes());
  assert.equal(paid.length, 1);
  await handler(signedReq(event('evt_e', 'checkout.session.async_payment_failed', paidSession('cs_test_async00000002'))), fakeRes());
  assert.deepEqual(failed, ['cs_test_async00000002']);
});

test('invalid signature is rejected with 400 and nothing is processed', async () => {
  const { handler, paid } = setup();
  const res = fakeRes();
  await handler(signedReq(event('evt_bad', 'checkout.session.completed', paidSession()), 'whsec_wrong_secret'), res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'invalid_signature' });
  assert.equal(paid.length, 0);
});

test('a tampered body is rejected', async () => {
  const { handler, paid } = setup();
  const body = JSON.stringify(event('evt_t', 'checkout.session.completed', paidSession()));
  const header = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: SECRET });
  const req = fakeReq({ method: 'POST', url: '/api/stripe/webhook', body: body.replace('"amount_total":100', '"amount_total":1'), headers: { 'stripe-signature': header } });
  const res = fakeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(paid.length, 0);
});

test('missing signature header is rejected', async () => {
  const { handler } = setup();
  const res = fakeRes();
  await handler(fakeReq({ method: 'POST', url: '/api/stripe/webhook', body: '{}' }), res);
  assert.equal(res.statusCode, 400);
});

test('without STRIPE_WEBHOOK_SECRET the endpoint returns 503', async () => {
  const { handler } = setup('');
  const res = fakeRes();
  await handler(signedReq(event('evt_x', 'checkout.session.completed', paidSession())), res);
  assert.equal(res.statusCode, 503);
});

test('a failing fulfilment returns 500 so Stripe retries, then succeeds once', async () => {
  let fail = true;
  const done = [];
  const handler = createWebhookHandler({
    getWebhookSecret: () => SECRET,
    log: silentLog,
    forwardPayment: async () => ({ ok: true }),
    hooks: {
      onCheckoutPaid: async (s) => {
        if (fail) throw new Error('downstream unavailable');
        done.push(s.id);
      },
      onCheckoutPending: async () => {},
      onCheckoutPaymentFailed: async () => {}
    }
  });
  const payload = event('evt_retry', 'checkout.session.completed', paidSession());
  const r1 = fakeRes();
  await handler(signedReq(payload), r1);
  assert.equal(r1.statusCode, 500);
  fail = false;
  const r2 = fakeRes();
  await handler(signedReq(payload), r2);
  assert.equal(r2.statusCode, 200);
  assert.deepEqual(done, ['cs_test_paid000000001']);
});

test('events for other products on the same Stripe account are ignored', async () => {
  const { handler, paid } = setup();
  const res = fakeRes();
  await handler(signedReq(event('evt_o', 'checkout.session.completed', { ...paidSession(), metadata: {} })), res);
  assert.equal(res.statusCode, 200);
  assert.equal(paid.length, 0);
});

test('monthly plans: subscription events go to LevelUp, never to the one-time payment flow', async () => {
  const synced = [];
  const forwarded = [];
  const handler = createWebhookHandler({
    getWebhookSecret: () => SECRET,
    log: silentLog,
    forwardPayment: async (p) => forwarded.push(p),
    syncPlan: async (sub) => synced.push(sub.id),
    hooks: { onCheckoutPaid: async () => {}, onCheckoutPending: async () => {}, onCheckoutPaymentFailed: async () => {} }
  });
  const meta = { kind: 'portal_plan', site: 'blackpater.com', customer_id: 'x', plan_id: 'y' };
  const res = fakeRes();
  await handler(signedReq(event('evt_sub_1', 'customer.subscription.updated', { id: 'sub_A12345', status: 'past_due', metadata: meta })), res);
  assert.equal(res.statusCode, 200);
  const other = fakeRes();
  await handler(signedReq(event('evt_sub_2', 'customer.subscription.created', { id: 'sub_B12345', status: 'active', metadata: {} })), other);
  assert.equal(other.statusCode, 200);
  assert.deepEqual(synced, ['sub_A12345']);
  assert.equal(forwarded.length, 0);
});

test('monthly plans: a failed sync returns 500 so Stripe retries', async () => {
  const handler = createWebhookHandler({
    getWebhookSecret: () => SECRET,
    log: silentLog,
    syncPlan: async () => {
      throw new Error('down');
    }
  });
  const res = fakeRes();
  await handler(signedReq(event('evt_sub_3', 'customer.subscription.deleted', { id: 'sub_C12345', status: 'canceled', metadata: { kind: 'portal_plan', site: 'blackpater.com' } })), res);
  assert.equal(res.statusCode, 500);
});
