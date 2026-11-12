import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPortalHandler, emailForOutbox } from '../api/_lib/portal/handler.js';
import { buildPlanCheckout, buildRenewalCheckout } from '../api/_lib/portal/plans.js';
import { getOffer } from '../shared/offers.js';
import { fakeReq, fakeRes, silentLog } from './helpers.js';

const KEY = 'lu_live_' + 'a'.repeat(48);
const SESSION = 'b'.repeat(64);
const CONFIG = { portalKey: KEY, resendKey: 're_test_1234567890', from: 'Black Pater <espace@blackpater.com>', replyTo: 'x@example.com' };
const CUSTOMER = '11111111-1111-4111-8111-111111111111';
const PLAN = { id: '22222222-2222-4222-8222-222222222222', level: 2, name: 'Pro', description: 'Weekly briefings', amount: 1500, currency: 'usd' };

function fakeStripe() {
  const calls = [];
  return {
    calls,
    checkout: {
      sessions: {
        async create(params, opts) {
          calls.push([params, opts]);
          return { id: 'cs_test_abcdefghijkl', url: 'https://checkout.stripe.com/c/pay/cs_test_abcdefghijkl' };
        }
      }
    },
    subscriptions: {
      async cancel(id) {
        calls.push(['cancel', id]);
        if (id === 'sub_GONE12345') throw Object.assign(new Error('missing'), { code: 'resource_missing' });
        return { id, status: 'canceled' };
      }
    }
  };
}

function setup(rpcImpl, stripe = fakeStripe()) {
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

const renewStart = (membership = {}) => ({
  customer_id: CUSTOMER,
  email: 'jane@example.com',
  name: 'Jane',
  locale: 'fr',
  membership: { monthly: true, active: true, until: '2026-12-12T07:00:00Z', offer_id: 'accompagnement-voyage-duo', ...membership }
});

test('renew: one Stripe payment for one month at the regular price of the member\'s formula, nothing automatic', async () => {
  const { handler, stripe } = setup(() => renewStart());
  const res = fakeRes();
  await handler(post('renew', {}), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body.url, /^https:\/\/checkout\.stripe\.com\//);
  const [params, opts] = stripe.calls[0];
  assert.equal(params.mode, 'payment');
  assert.equal(params.line_items[0].price_data.unit_amount, 900);
  assert.equal(params.line_items[0].price_data.recurring, undefined);
  assert.equal(params.customer_email, 'jane@example.com');
  assert.equal(params.metadata.portal_customer_id, CUSTOMER);
  assert.equal(params.metadata.offer_id, 'accompagnement-voyage-duo');
  assert.equal(params.allow_promotion_codes, true);
  assert.match(params.custom_text.submit.message, /sans prélèvement automatique/);
  assert.match(params.success_url, /\/espace-client\?view=account&paid=1$/);
  assert.match(opts.idempotencyKey, /^bp-space-[0-9a-f]{32}$/);
});

test('renew: extra fields are refused', async () => {
  const { handler, calls } = setup(() => renewStart());
  const res = fakeRes();
  await handler(post('renew', { amount: 1 }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test('plan: one month at the price set in LevelUp; refused when the membership has ended', async () => {
  const ok = setup((name) => (name === 'portal_renew_start' ? renewStart() : { customer_id: CUSTOMER, email: 'jane@example.com', locale: 'en', plan: PLAN }));
  const res = fakeRes();
  await ok.handler(post('plan-buy', { level: 2 }), res);
  assert.equal(res.statusCode, 200);
  const [params] = ok.stripe.calls[0];
  assert.equal(params.mode, 'payment');
  assert.equal(params.line_items[0].price_data.unit_amount, 1500);
  assert.deepEqual(
    { kind: params.metadata.kind, plan: params.metadata.plan_id, member: params.metadata.portal_customer_id },
    { kind: 'portal_plan', plan: PLAN.id, member: CUSTOMER }
  );

  const expired = setup(() => renewStart({ active: false }));
  const res2 = fakeRes();
  await expired.handler(post('plan-buy', { level: 2 }), res2);
  assert.equal(res2.statusCode, 402);
  assert.equal(res2.body.error, 'membership_expired');
  assert.equal(expired.stripe.calls.length, 0);

  const bad = setup(() => renewStart());
  for (const body of [{ level: 4 }, { level: '2' }, { level: 2, amount: 1 }]) {
    const r = fakeRes();
    await bad.handler(post('plan-buy', body), r);
    assert.equal(r.statusCode, 400);
  }
});

test('cancel = reminders off (access runs until the paid date); resume = reminders on', async () => {
  const { handler, calls } = setup((name, args) => ({ ok: true, reminders: args.p_on }));
  const res = fakeRes();
  await handler(post('reminders', { on: false }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].name, 'portal_set_reminders');
  assert.equal(calls[0].args.p_on, false);
  const bad = fakeRes();
  await handler(post('reminders', { on: 'no' }), bad);
  assert.equal(bad.statusCode, 400);
});

test('renewal reminder e-mails: in the member\'s language, with the end date and a link to renew', () => {
  const fr = emailForOutbox({ kind: 'renew', locale: 'fr', name: 'Jane', data: { stage: 3, what: 'membership', until: '2026-12-12 07:00:00+00' } }, 'https://blackpater.com');
  assert.match(fr.subject, /3 jours/);
  assert.match(fr.text, /12 décembre 2026/);
  assert.match(fr.text, /Rien n’est prélevé automatiquement/);
  assert.match(fr.text, /espace-client\?view=account/);
  const ended = emailForOutbox({ kind: 'renew', locale: 'en', data: { stage: 0, what: 'plan', plan: 'Pro', until: '2026-12-12T07:00:00Z' } }, 'https://blackpater.com');
  assert.match(ended.subject, /plan has ended/);
  assert.equal(emailForOutbox({ kind: 'renew', locale: 'en', data: { stage: 1 } }, 'https://blackpater.com'), null);
});

test('delete account: e-mailed code, then the data, then the cookie', async () => {
  const order = [];
  const { handler, sent } = setup((name) => {
    order.push(name);
    if (name === 'portal_request_code') return { send: true, code: '654321', email: 'jane@example.com', locale: 'en' };
    if (name === 'portal_delete_account_begin') return { ok: true, subscriptions: [] };
    return { ok: true };
  });
  const r1 = fakeRes();
  await handler(post('delete-code', {}), r1);
  assert.equal(r1.statusCode, 200);
  assert.match(sent[0].subject, /deletion of your account/);
  const r2 = fakeRes();
  await handler(post('delete-account', { code: '654321' }), r2);
  assert.equal(r2.statusCode, 200);
  assert.deepEqual(order.slice(-2), ['portal_delete_account_begin', 'portal_delete_account_finish']);
  assert.match(r2.headers['set-cookie'], /Max-Age=0/);
});

test('delete account: a wrong code deletes nothing', async () => {
  const { handler, calls } = setup((name) => (name === 'portal_delete_account_begin' ? { ok: false } : { ok: true }));
  const res = fakeRes();
  await handler(post('delete-account', { code: '000000' }), res);
  assert.equal(res.statusCode, 400);
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

test('checkout builders refuse anything that is not a member and a plan id', () => {
  assert.throws(() => buildRenewalCheckout({ start: { customer_id: 'x' }, offer: getOffer('accompagnement-voyage'), origin: 'https://blackpater.com' }));
  assert.throws(() => buildPlanCheckout({ start: { customer_id: CUSTOMER, plan: { id: 'nope' } }, origin: 'https://blackpater.com' }));
});
