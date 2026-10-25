import { test } from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { createWebhookHandler } from '../api/_lib/webhook.js';
import {
  LEVELUP_INGEST_PATH,
  LEVELUP_PUBLISHABLE_KEY_DEFAULT,
  LEVELUP_SUPABASE_URL,
  buildPaymentEvent,
  createLevelUpForwarder,
  paymentStatusFor
} from '../api/_lib/levelup.js';
import { OFFERS } from '../shared/offers.js';
import { fakeReq, fakeRes, silentLog } from './helpers.js';

const SECRET = 'whsec_test_secret_for_unit_tests';
const SITE_KEY = 'lu_site_test_0123456789abcdef';
const EMAIL = 'client.example@example.com';
const NAME = 'Client Example';
const CREATED = 1792800000; // Stripe event.created (Unix seconds)

function session(over = {}) {
  return {
    id: 'cs_test_levelup0000001',
    object: 'checkout.session',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 500,
    currency: 'usd',
    livemode: false,
    payment_intent: 'pi_test_levelup0000001',
    client_reference_id: '7b0a3f5e-2d7c-4a51-9a0e-6b8f1c2d3e4f',
    customer_details: { email: EMAIL, name: NAME },
    metadata: { offer_id: 'accompagnement-voyage-duo', attempt_id: '7b0a3f5e-2d7c-4a51-9a0e-6b8f1c2d3e4f' },
    ...over
  };
}

function event(id, type, object) {
  return { id, object: 'event', type, created: CREATED, livemode: false, data: { object } };
}

function signedReq(payload) {
  const body = JSON.stringify(payload);
  const header = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: SECRET });
  return fakeReq({ method: 'POST', url: '/api/stripe/webhook', body, headers: { 'content-type': 'application/json', 'stripe-signature': header } });
}

function captureLog() {
  const lines = [];
  const push = (level) => (...args) => lines.push(`${level} ${args.map(String).join(' ')}`);
  return { lines, info: push('info'), warn: push('warn'), error: push('error') };
}

const noopHooks = {
  onCheckoutPaid: async () => {},
  onCheckoutPending: async () => {},
  onCheckoutPaymentFailed: async () => {}
};

function setup({ forwardPayment, getStripe, log = silentLog } = {}) {
  const sent = [];
  const handler = createWebhookHandler({
    getWebhookSecret: () => SECRET,
    log,
    hooks: noopHooks,
    getStripe: getStripe || (() => null),
    forwardPayment:
      forwardPayment ||
      (async (pEvent) => {
        sent.push(pEvent);
        return { ok: true };
      })
  });
  return { handler, sent };
}

function assertNoPii(lines) {
  const text = lines.join('\n');
  for (const secret of [EMAIL, NAME, SITE_KEY, LEVELUP_PUBLISHABLE_KEY_DEFAULT, SECRET]) {
    assert.ok(!text.includes(secret), `log must not contain ${secret.slice(0, 6)}…`);
  }
}

// ---------- Payload mapping ----------

test('checkout.session.completed (paid) maps to the exact LevelUp contract', async () => {
  const { handler, sent } = setup();
  const res = fakeRes();
  await handler(signedReq(event('evt_paid_1', 'checkout.session.completed', session())), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(sent, [
    {
      provider: 'stripe',
      provider_event_id: 'evt_paid_1',
      provider_session_id: 'cs_test_levelup0000001',
      provider_payment_intent: 'pi_test_levelup0000001',
      status: 'paid',
      amount: 500,
      currency: 'usd',
      offer_id: 'accompagnement-voyage-duo',
      offer_name: OFFERS['accompagnement-voyage-duo'].stripeName,
      customer_email: EMAIL,
      customer_name: NAME,
      occurred_at: new Date(CREATED * 1000).toISOString(),
      metadata: { attempt_id: '7b0a3f5e-2d7c-4a51-9a0e-6b8f1c2d3e4f', livemode: false }
    }
  ]);
});

test('each checkout event type maps to its dashboard status', async () => {
  const cases = [
    ['checkout.session.completed', session({ payment_status: 'unpaid', payment_intent: null }), 'pending'],
    ['checkout.session.completed', session({ payment_status: 'no_payment_required' }), 'paid'],
    ['checkout.session.async_payment_succeeded', session(), 'paid'],
    ['checkout.session.async_payment_failed', session({ payment_status: 'unpaid' }), 'failed'],
    ['checkout.session.expired', session({ status: 'expired', payment_status: 'unpaid', payment_intent: null, customer_details: null }), 'expired']
  ];
  for (const [i, [type, s, status]] of cases.entries()) {
    const { handler, sent } = setup();
    const res = fakeRes();
    await handler(signedReq(event(`evt_case_${i}`, type, s)), res);
    assert.equal(res.statusCode, 200, type);
    assert.equal(sent.length, 1, type);
    assert.equal(sent[0].status, status, type);
    assert.equal(sent[0].provider_event_id, `evt_case_${i}`);
  }
});

test('expired session without customer details sends nulls, not undefined', () => {
  const p = buildPaymentEvent({
    eventId: 'evt_x',
    eventCreated: CREATED,
    session: session({ status: 'expired', customer_details: null, payment_intent: null, amount_total: null }),
    status: 'expired'
  });
  assert.equal(p.customer_email, null);
  assert.equal(p.customer_name, null);
  assert.equal(p.provider_payment_intent, null);
  assert.equal(p.amount, OFFERS['accompagnement-voyage-duo'].amount, 'falls back to the catalog amount');
});

test('an expanded payment_intent object is reduced to its id', () => {
  const p = buildPaymentEvent({ eventId: 'evt_x', eventCreated: CREATED, session: session({ payment_intent: { id: 'pi_test_expanded' } }), status: 'paid' });
  assert.equal(p.provider_payment_intent, 'pi_test_expanded');
});

test('paymentStatusFor reads the session itself when there is no event (backfill)', () => {
  assert.equal(paymentStatusFor(undefined, { status: 'complete', payment_status: 'paid' }), 'paid');
  assert.equal(paymentStatusFor(undefined, { status: 'complete', payment_status: 'unpaid' }), 'pending');
  assert.equal(paymentStatusFor(undefined, { status: 'expired' }), 'expired');
  assert.equal(paymentStatusFor(undefined, { status: 'open' }), null);
});

test('charge.refunded → status refunded, found through the Checkout Session of the payment intent', async () => {
  const listed = [];
  const stripe = {
    checkout: {
      sessions: {
        list: async (params) => {
          listed.push(params);
          return { data: [session()] };
        }
      }
    }
  };
  const { handler, sent } = setup({ getStripe: () => stripe });
  const charge = { id: 'ch_test_1', object: 'charge', payment_intent: 'pi_test_levelup0000001', refunded: true, amount_refunded: 500 };
  const res = fakeRes();
  await handler(signedReq(event('evt_refund_1', 'charge.refunded', charge)), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(listed, [{ payment_intent: 'pi_test_levelup0000001', limit: 1 }]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].status, 'refunded');
  assert.equal(sent[0].provider_session_id, 'cs_test_levelup0000001');
  assert.equal(sent[0].amount, 500);
  assert.equal(sent[0].metadata.refund, 'full');
  assert.equal(sent[0].metadata.amount_refunded, 500);
});

test('charge.refunded for another product, or when Stripe is unreachable, is acknowledged and not forwarded', async () => {
  const other = { checkout: { sessions: { list: async () => ({ data: [session({ metadata: {} })] }) } } };
  const broken = { checkout: { sessions: { list: async () => Promise.reject(new Error('down')) } } };
  for (const stripe of [other, broken, null]) {
    const { handler, sent } = setup({ getStripe: () => stripe });
    const res = fakeRes();
    await handler(signedReq(event('evt_refund_x', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', refunded: true })), res);
    assert.equal(res.statusCode, 200);
    assert.equal(sent.length, 0);
  }
});

test('sessions of other products on the same Stripe account are not forwarded', async () => {
  const { handler, sent } = setup();
  await handler(signedReq(event('evt_other', 'checkout.session.completed', session({ metadata: {} }))), fakeRes());
  assert.equal(sent.length, 0);
});

// ---------- Webhook resilience ----------

test('a failing or throwing forwarder never breaks the Stripe webhook response', async () => {
  for (const forwardPayment of [async () => ({ ok: false, reason: 'http', status: 500 }), async () => Promise.reject(new Error('boom'))]) {
    const log = captureLog();
    const { handler } = setup({ forwardPayment, log });
    const res = fakeRes();
    await handler(signedReq(event('evt_fail', 'checkout.session.completed', session())), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { received: true });
    assertNoPii(log.lines);
  }
});

test('webhook with the real forwarder and an unreachable LevelUp still answers 200, without PII in logs', async () => {
  const log = captureLog();
  let calls = 0;
  const forwardPayment = createLevelUpForwarder({
    log,
    getConfig: () => ({ url: LEVELUP_SUPABASE_URL, publishableKey: LEVELUP_PUBLISHABLE_KEY_DEFAULT, siteKey: SITE_KEY }),
    fetch: async () => {
      calls += 1;
      throw new TypeError('fetch failed');
    },
    retryDelayMs: 1
  });
  const { handler } = setup({ forwardPayment, log });
  const res = fakeRes();
  await handler(signedReq(event('evt_down', 'checkout.session.completed', session())), res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls, 2, 'one retry');
  assert.ok(log.lines.some((l) => l.includes('levelup.forward_failed') && l.includes('evt_down')));
  assertNoPii(log.lines);
});

// ---------- Forwarder ----------

function fakeFetch(responses) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    const r = responses[Math.min(calls.length - 1, responses.length - 1)];
    if (r instanceof Error) throw r;
    return { ok: r >= 200 && r < 300, status: r, text: async () => '' };
  };
  fn.calls = calls;
  return fn;
}

const P_EVENT = buildPaymentEvent({ eventId: 'evt_fwd', eventCreated: CREATED, session: session(), status: 'paid' });
const config = (siteKey = SITE_KEY) => () => ({ url: LEVELUP_SUPABASE_URL, publishableKey: LEVELUP_PUBLISHABLE_KEY_DEFAULT, siteKey });

test('forwarder posts the contract to site_ingest_payment with the publishable key headers', async () => {
  const fetch = fakeFetch([200]);
  const forward = createLevelUpForwarder({ fetch, getConfig: config(), log: silentLog });
  const result = await forward(P_EVENT);
  assert.equal(result.ok, true);
  assert.equal(fetch.calls.length, 1);
  const { url, init } = fetch.calls[0];
  assert.equal(url, `${LEVELUP_SUPABASE_URL}${LEVELUP_INGEST_PATH}`);
  assert.equal(url, 'https://rncuhmvykrmtxfzqpitc.supabase.co/rest/v1/rpc/site_ingest_payment');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.apikey, LEVELUP_PUBLISHABLE_KEY_DEFAULT);
  assert.equal(init.headers.Authorization, `Bearer ${LEVELUP_PUBLISHABLE_KEY_DEFAULT}`);
  assert.equal(init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(init.body), { p_key: SITE_KEY, p_event: P_EVENT });
});

test('missing LEVELUP_SITE_KEY → skipped silently, logged once, nothing sent', async () => {
  const fetch = fakeFetch([200]);
  const log = captureLog();
  const forward = createLevelUpForwarder({ fetch, getConfig: config(''), log });
  const r1 = await forward(P_EVENT);
  const r2 = await forward(P_EVENT);
  assert.equal(r1.skipped, true);
  assert.equal(r1.reason, 'missing_site_key');
  assert.equal(r2.skipped, true);
  assert.equal(fetch.calls.length, 0);
  assert.equal(log.lines.filter((l) => l.includes('levelup.forward_skipped')).length, 1);
  assertNoPii(log.lines);
});

test('5xx and network errors are retried once; 4xx is not', async () => {
  const f1 = fakeFetch([503, 200]);
  assert.equal((await createLevelUpForwarder({ fetch: f1, getConfig: config(), log: silentLog, retryDelayMs: 1 })(P_EVENT)).ok, true);
  assert.equal(f1.calls.length, 2);

  const f2 = fakeFetch([new TypeError('fetch failed'), 500]);
  const r2 = await createLevelUpForwarder({ fetch: f2, getConfig: config(), log: silentLog, retryDelayMs: 1 })(P_EVENT);
  assert.equal(r2.ok, false);
  assert.equal(r2.attempts, 2);
  assert.equal(f2.calls.length, 2);

  const f3 = fakeFetch([401]);
  const log = captureLog();
  const r3 = await createLevelUpForwarder({ fetch: f3, getConfig: config(), log, retryDelayMs: 1 })(P_EVENT);
  assert.equal(r3.ok, false);
  assert.equal(r3.status, 401);
  assert.equal(f3.calls.length, 1);
  assertNoPii(log.lines);
});

test('each attempt is cut off by its timeout', async () => {
  let calls = 0;
  const hanging = (url, init) =>
    new Promise((_, reject) => {
      calls += 1;
      init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    });
  const log = captureLog();
  const forward = createLevelUpForwarder({ fetch: hanging, getConfig: config(), log, attemptTimeoutMs: 20, totalBudgetMs: 5000, retryDelayMs: 1 });
  const started = Date.now();
  const r = await forward(P_EVENT);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'timeout');
  assert.equal(calls, 2);
  assert.ok(Date.now() - started < 1000);
  assertNoPii(log.lines);
});

test('the retry is skipped when the overall time budget is spent', async () => {
  let t = 0;
  const fetch = async () => {
    t += 9000;
    return { ok: false, status: 503, text: async () => '' };
  };
  const forward = createLevelUpForwarder({ fetch, getConfig: config(), log: silentLog, now: () => t, retryDelayMs: 1 });
  const r = await forward(P_EVENT);
  assert.equal(r.attempts, 1);
});

// ---------- Backfill ----------

test('backfill: lists our sessions with the same contract, stable ids, refunds and real event ids when available', async () => {
  const { collectRecords, sendRecords } = await import('../scripts/backfill-levelup-payments.mjs');
  const asList = (items) => ({
    async *[Symbol.asyncIterator]() {
      yield* items;
    }
  });
  const listCalls = [];
  const stripe = {
    events: {
      list: (params) => {
        listCalls.push(params);
        if (params.type === 'charge.refunded') return asList([]);
        return asList([{ id: 'evt_real_paid', type: 'checkout.session.completed', created: CREATED, data: { object: session({ id: 'cs_test_paid_recent' }) } }]);
      }
    },
    checkout: {
      sessions: {
        list: () =>
          asList([
            session({ id: 'cs_test_paid_recent', created: CREATED - 60 }),
            session({ id: 'cs_test_paid_old', created: CREATED - 86400 * 60, payment_intent: 'pi_test_refunded' }),
            session({ id: 'cs_test_expired', status: 'expired', payment_status: 'unpaid', payment_intent: null, expires_at: CREATED - 10, customer_details: null }),
            session({ id: 'cs_test_open', status: 'open', payment_status: 'unpaid' }),
            session({ id: 'cs_test_other', metadata: { offer_id: 'something-else' } })
          ])
      }
    },
    paymentIntents: {
      retrieve: async (id) => ({ id, latest_charge: id === 'pi_test_refunded' ? { id: 'ch_1', created: CREATED - 100, amount_refunded: 500, refunded: true } : { id: 'ch_2', amount_refunded: 0 } })
    },
    refunds: { list: async () => ({ data: [{ id: 're_1', created: CREATED - 50 }] }) }
  };
  const records = await collectRecords(stripe, { gte: CREATED - 86400 * 365 });
  const summary = records.map((r) => [r.provider_session_id, r.status, r.provider_event_id]);
  assert.deepEqual(summary, [
    ['cs_test_paid_recent', 'paid', 'evt_real_paid'],
    ['cs_test_paid_old', 'paid', 'evt_backfill_cs_test_paid_old_paid'],
    ['cs_test_paid_old', 'refunded', 'evt_backfill_cs_test_paid_old_refunded'],
    ['cs_test_expired', 'expired', 'evt_backfill_cs_test_expired_expired']
  ]);
  assert.equal(records[0].customer_email, EMAIL);
  assert.equal(records[3].occurred_at, new Date((CREATED - 10) * 1000).toISOString());
  assert.equal(records[2].occurred_at, new Date((CREATED - 50) * 1000).toISOString());
  assert.ok(listCalls.every((p) => p.created && p.created.gte));

  const forwarded = [];
  const lines = [];
  const result = await sendRecords(records, { forward: async (p) => (forwarded.push(p), { ok: true }), out: { log: (l) => lines.push(l) } });
  assert.equal(result.sent, 4);
  assert.equal(forwarded.length, 4);
  assertNoPii(lines);
});
