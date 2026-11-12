import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPortalHandler } from '../api/_lib/portal/handler.js';
import { buildPlanCheckout, subscriptionPayload } from '../api/_lib/portal/plans.js';
import { fakeReq, fakeRes, silentLog } from './helpers.js';

const KEY = 'lu_live_' + 'a'.repeat(48);
const SESSION = 'b'.repeat(64);
const CONFIG = { portalKey: KEY, resendKey: 're_test_1234567890', from: 'Black Pater <espace@blackpater.com>', replyTo: 'x@example.com' };
const CUSTOMER = '11111111-1111-4111-8111-111111111111';
const PLAN = { id: '22222222-2222-4222-8222-222222222222', level: 2, name: 'Pro', description: 'Weekly briefings', amount: 1500, currency: 'usd' };
const META = { kind: 'portal_plan', site: 'blackpater.com', customer_id: CUSTOMER, plan_id: PLAN.id, level: '2' };

function fakeSubStripe() {
  const calls = [];
  const sub = (id, extra = {}) => ({
    id,
    status: 'active',
    cancel_at_period_end: false,
    customer: 'cus_ABC123',
    metadata: META,
    items: { data: [{ id: 'si_1', current_period_end: 1900000000 }] },
    ...extra
  });
  return {
    calls,
    checkout: {
      sessions: {
        async create(params, opts) {
          calls.push(['checkout', params, opts]);
          return { id: 'cs_test_abcdefghijkl', url: 'https://checkout.stripe.com/c/pay/cs_test_abcdefghijkl' };
        },
        async retrieve(id) {
          calls.push(['retrieve-session', id]);
          return { id, status: 'complete', metadata: META, subscription: sub('sub_NEW12345') };
        }
      }
    },
    products: { async create(p) { calls.push(['product', p]); return { id: 'prod_X1' }; } },
    subscriptions: {
      async update(id, params) {
        calls.push(['update', id, params]);
        return sub(id, { cancel_at_period_end: Boolean(params.cancel_at_period_end), metadata: params.metadata || META });
      },
      async cancel(id) {
        calls.push(['cancel', id]);
        if (id === 'sub_GONE12345') throw Object.assign(new Error('missing'), { code: 'resource_missing' });
        return sub(id, { status: 'canceled' });
      },
      async retrieve(id, opts) {
        calls.push(['retrieve', id, opts]);
        return sub(id, { status: 'past_due', latest_invoice: { hosted_invoice_url: 'https://invoice.stripe.com/i/acct_1/test_x' } });
      }
    }
  };
}

function setup(rpcImpl, stripe = fakeSubStripe()) {
  const calls = [];
  const sent = [];
  const handler = createPortalHandler({
    getConfig: () => CONFIG,
    rpc: async (name, args) => {
      calls.push({ name, args });
      return rpcImpl(name, args);
    },
    send: async (cfg, mail) => {
      sent.push(mail);
      return { ok: true, status: 200 };
    },
    getStripe: () => stripe,
    log: silentLog
  });
  return { handler, calls, sent, stripe };
}

const post = (action, body) =>
  fakeReq({
    method: 'POST',
    url: `/api/portal/${action}`,
    body,
    headers: { 'content-type': 'application/json', origin: 'https://blackpater.com', cookie: `__Host-bp_portal=${SESSION}` }
  });

const start = (current = null) => ({ customer_id: CUSTOMER, email: 'jane@example.com', name: 'Jane', locale: 'fr', plan: PLAN, current, provider_customer_id: null });

test('subscribe: monthly Stripe page built from the plan LevelUp returns, never from the browser', async () => {
  const { handler, stripe } = setup(() => start());
  const res = fakeRes();
  await handler(post('subscribe', { level: 2 }), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body.url, /^https:\/\/checkout\.stripe\.com\//);
  const [, params, opts] = stripe.calls[0];
  assert.equal(params.mode, 'subscription');
  assert.equal(params.line_items[0].price_data.unit_amount, 1500);
  assert.deepEqual(params.line_items[0].price_data.recurring, { interval: 'month' });
  assert.equal(params.subscription_data.metadata.customer_id, CUSTOMER);
  assert.equal(params.customer_email, 'jane@example.com');
  assert.equal(params.locale, 'fr');
  assert.match(opts.idempotencyKey, /^bp-plan-[0-9a-f]{32}$/);
});

test('subscribe: invalid levels and extra fields (like a price) are refused', async () => {
  const { handler, calls } = setup(() => start());
  for (const body of [{ level: 4 }, { level: '2' }, { level: 2, amount: 1 }]) {
    const res = fakeRes();
    await handler(post('subscribe', body), res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(calls.length, 0);
});

test('subscribe: same plan twice is refused; another plan moves the same subscription', async () => {
  const same = setup(() => start({ provider_subscription_id: 'sub_OLD12345', level: 2, cancel_at_period_end: false }));
  const r1 = fakeRes();
  await same.handler(post('subscribe', { level: 2 }), r1);
  assert.equal(r1.statusCode, 409);

  const other = setup((name) => (name === 'portal_subscribe_start' ? start({ provider_subscription_id: 'sub_OLD12345', level: 1, cancel_at_period_end: false }) : { ok: true }));
  const r2 = fakeRes();
  await other.handler(post('subscribe', { level: 2 }), r2);
  assert.equal(r2.statusCode, 200);
  const update = other.stripe.calls.find((c) => c[0] === 'update');
  assert.equal(update[2].items[0].price_data.unit_amount, 1500);
  assert.equal(update[2].metadata.plan_id, PLAN.id);
  const sync = other.calls.find((c) => c.name === 'portal_subscription_sync');
  assert.equal(sync.args.p_sub.plan_id, PLAN.id);
});

test('cancel stops at the end of the paid month; resume keeps it going', async () => {
  const refs = [{ provider_subscription_id: 'sub_OLD12345', status: 'active', cancel_at_period_end: false }];
  const { handler, stripe, calls } = setup((name) => (name === 'portal_subscription_refs' ? refs : { ok: true }));
  const res = fakeRes();
  await handler(post('cancel-plan', {}), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(stripe.calls[0], ['update', 'sub_OLD12345', { cancel_at_period_end: true }]);
  assert.equal(calls.find((c) => c.name === 'portal_subscription_sync').args.p_sub.cancel_at_period_end, true);

  refs[0].cancel_at_period_end = true;
  const res2 = fakeRes();
  await handler(post('resume-plan', {}), res2);
  assert.equal(res2.statusCode, 200);
  assert.deepEqual(stripe.calls[1], ['update', 'sub_OLD12345', { cancel_at_period_end: false }]);
});

test('pay again: only Stripe\'s own invoice page for a failed monthly payment', async () => {
  const { handler } = setup(() => [{ provider_subscription_id: 'sub_OLD12345', status: 'past_due' }]);
  const res = fakeRes();
  await handler(post('pay-plan', {}), res);
  assert.equal(res.body.url, 'https://invoice.stripe.com/i/acct_1/test_x');
  const none = setup(() => []);
  const res2 = fakeRes();
  await none.handler(post('pay-plan', {}), res2);
  assert.equal(res2.statusCode, 404);
});

test('back from the payment page: the plan is recorded at once', async () => {
  const { handler, calls } = setup(() => ({ ok: true }));
  const res = fakeRes();
  await handler(post('plan-return', { sessionId: 'cs_test_abcdefghijkl' }), res);
  assert.equal(res.body.active, true);
  const sync = calls.find((c) => c.name === 'portal_subscription_sync');
  assert.equal(sync.args.p_sub.subscription_id, 'sub_NEW12345');
  assert.equal(sync.args.p_sub.current_period_end, 1900000000);
  const bad = fakeRes();
  await handler(post('plan-return', { sessionId: 'https://evil.example' }), bad);
  assert.equal(bad.statusCode, 400);
});

test('delete account: e-mailed code, Stripe plans stopped first, then the data, then the cookie', async () => {
  const order = [];
  const { handler, sent, stripe } = setup((name) => {
    order.push(name);
    if (name === 'portal_request_code') return { send: true, code: '654321', email: 'jane@example.com', locale: 'en' };
    if (name === 'portal_delete_account_begin') return { ok: true, subscriptions: ['sub_OLD12345', 'sub_GONE12345'] };
    return { ok: true };
  });
  const r1 = fakeRes();
  await handler(post('delete-code', {}), r1);
  assert.equal(r1.statusCode, 200);
  assert.match(sent[0].subject, /deletion of your account/);
  const r2 = fakeRes();
  await handler(post('delete-account', { code: '654321' }), r2);
  assert.equal(r2.statusCode, 200);
  assert.deepEqual(stripe.calls.map((c) => c[0] + ':' + c[1]), ['cancel:sub_OLD12345', 'cancel:sub_GONE12345']);
  assert.deepEqual(order.slice(-2), ['portal_delete_account_begin', 'portal_delete_account_finish']);
  assert.match(r2.headers['set-cookie'], /Max-Age=0/);
});

test('delete account: a wrong code deletes nothing', async () => {
  const { handler, calls, stripe } = setup((name) => (name === 'portal_delete_account_begin' ? { ok: false } : { ok: true }));
  const res = fakeRes();
  await handler(post('delete-account', { code: '000000' }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(stripe.calls.length, 0);
  assert.ok(!calls.some((c) => c.name === 'portal_delete_account_finish'));
});

test('delete account: if Stripe fails the account is not erased (retry later)', async () => {
  const stripe = fakeSubStripe();
  stripe.subscriptions.cancel = async () => {
    throw new Error('network');
  };
  const { handler, calls } = setup((name) => (name === 'portal_delete_account_begin' ? { ok: true, subscriptions: ['sub_OLD12345'] } : { ok: true }), stripe);
  const res = fakeRes();
  await handler(post('delete-account', { code: '123456' }), res);
  assert.equal(res.statusCode, 502);
  assert.ok(!calls.some((c) => c.name === 'portal_delete_account_finish'));
});

test('messages-since: only a valid date goes to the database', async () => {
  const { handler, calls } = setup(() => ({ messages: [], seen: [] }));
  const ok = fakeRes();
  await handler(post('messages-since', { after: '2026-11-12T10:00:00.000Z' }), ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(calls[0].args.p_after, '2026-11-12T10:00:00.000Z');
  const bad = fakeRes();
  await handler(post('messages-since', { after: "1' or 1=1" }), bad);
  assert.equal(bad.statusCode, 400);
});

test('subscription payload and checkout helpers', () => {
  const p = subscriptionPayload({ id: 'sub_A12345', status: 'past_due', cancel_at_period_end: true, customer: { id: 'cus_1' }, metadata: META, items: { data: [{}] }, current_period_end: 1800000000 });
  assert.deepEqual(p, { subscription_id: 'sub_A12345', status: 'past_due', current_period_end: 1800000000, cancel_at_period_end: true, provider_customer_id: 'cus_1', customer_id: CUSTOMER, plan_id: PLAN.id });
  const params = buildPlanCheckout({ start: { ...start(), provider_customer_id: 'cus_ABC123' }, origin: 'https://blackpater.com' });
  assert.equal(params.customer, 'cus_ABC123');
  assert.equal(params.customer_email, undefined);
  assert.match(params.success_url, /^https:\/\/blackpater\.com\/espace-client\?plan=ok&session_id=\{CHECKOUT_SESSION_ID\}$/);
});
