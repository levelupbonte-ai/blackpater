import { test } from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { createWebhookHandler } from '../api/_lib/webhook.js';
import { buildSubscriptionCheckout, subscriptionPayload } from '../api/_lib/portal/plans.js';
import { fakeReq, fakeRes, silentLog } from './helpers.js';

const SECRET = 'whsec_test_secret_for_unit_tests';
const CUSTOMER = '11111111-2222-4333-8444-555555555555';
const PLAN = '66666666-7777-4888-9999-000000000000';
const meta = { kind: 'portal_plan', site: 'blackpater.com', portal_customer_id: CUSTOMER, plan_id: PLAN, level: '2' };

function signedReq(payload) {
  const body = JSON.stringify(payload);
  const header = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: SECRET });
  return fakeReq({ method: 'POST', url: '/api/stripe/webhook', body, headers: { 'content-type': 'application/json', 'stripe-signature': header } });
}

function setup() {
  const synced = [];
  const forwarded = [];
  const paid = [];
  const handler = createWebhookHandler({
    getWebhookSecret: () => SECRET,
    log: silentLog,
    syncPlan: async (sub) => synced.push(subscriptionPayload(sub)),
    forwardPayment: async (e) => forwarded.push(e),
    hooks: { onCheckoutPaid: async (s) => paid.push(s.id), onCheckoutPending: async () => {}, onCheckoutPaymentFailed: async () => {} }
  });
  return { handler, synced, forwarded, paid };
}

const sub = (extra = {}) => ({
  id: 'sub_TEST12345',
  object: 'subscription',
  status: 'active',
  customer: 'cus_ABC123',
  cancel_at_period_end: false,
  items: { data: [{ current_period_end: 1800000000 }] },
  metadata: meta,
  ...extra
});

test('plan checkout: monthly, automatic, credit taken off the first month only', () => {
  const start = { customer_id: CUSTOMER, email: 'a@b.co', locale: 'fr', plan: { id: PLAN, level: 2, name: 'Pro', amount: 1600, currency: 'usd' } };
  const p = buildSubscriptionCheckout({ start, origin: 'https://blackpater.com', couponId: 'coupon_X' });
  assert.equal(p.mode, 'subscription');
  assert.deepEqual(p.line_items[0].price_data.recurring, { interval: 'month' });
  assert.equal(p.line_items[0].price_data.unit_amount, 1600);
  assert.deepEqual(p.discounts, [{ coupon: 'coupon_X' }]);
  assert.equal(p.allow_promotion_codes, undefined);
  assert.equal(p.subscription_data.metadata.portal_customer_id, CUSTOMER);
  const noCredit = buildSubscriptionCheckout({ start, origin: 'https://blackpater.com' });
  assert.equal(noCredit.discounts, undefined);
  assert.equal(noCredit.allow_promotion_codes, true);
});

test('webhook: every plan change goes to LevelUp, with the member and the period end', async () => {
  const { handler, synced } = setup();
  const res = fakeRes();
  await handler(signedReq({ id: 'evt_s1', object: 'event', type: 'customer.subscription.updated', data: { object: sub({ cancel_at_period_end: true }) } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(synced.length, 1);
  assert.equal(synced[0].customer_id, CUSTOMER);
  assert.equal(synced[0].current_period_end, 1800000000);
  assert.equal(synced[0].cancel_at_period_end, true);
});

test('webhook: a paid plan checkout is synced, never forwarded as a one-time payment', async () => {
  const { handler, synced, forwarded, paid } = setup();
  const session = { id: 'cs_test_sub0000000001', object: 'checkout.session', mode: 'subscription', status: 'complete', payment_status: 'paid', metadata: meta, subscription: sub() };
  await handler(signedReq({ id: 'evt_s2', object: 'event', type: 'checkout.session.completed', data: { object: session } }), fakeRes());
  assert.equal(synced.length, 1);
  assert.equal(forwarded.length, 0);
  assert.equal(paid.length, 0);
});

test('webhook: subscriptions of other sites are ignored', async () => {
  const { handler, synced } = setup();
  await handler(signedReq({ id: 'evt_s3', object: 'event', type: 'customer.subscription.deleted', data: { object: sub({ metadata: { kind: 'other' } }) } }), fakeRes());
  assert.equal(synced.length, 0);
});
