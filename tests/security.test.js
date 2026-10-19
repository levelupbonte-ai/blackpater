import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  hasUnsafeChars,
  isConfirmationPath,
  isSessionId,
  isStripeCheckoutUrl,
  parseCheckoutRequest,
  parseSessionStatus,
  readSessionIdParam,
  safeInternalPath
} from '../shared/validation.js';
import { SECURITY_HEADERS } from '../shared/security-headers.js';
import { createCheckoutHandler } from '../api/_lib/checkout.js';
import { createSessionStatusHandler } from '../api/_lib/session-status.js';
import { createCheckoutController } from '../src/lib/checkout-client.js';
import { fakeReq, fakeRes, fakeStripe, jsonPost, silentLog } from './helpers.js';

const ATTEMPT = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';
const SESSION = 'cs_test_a1B2c3D4e5F6g7H8';
const OFFER = 'accompagnement-voyage';
const ZWSP = String.fromCharCode(0x200b);
const RLO = String.fromCharCode(0x202e);
const NUL = String.fromCharCode(0);

const SCRIPT = '<script>alert(1)</script>';
const BAD_SESSION_IDS = [
  '',
  'cs_test_short',
  'cs_prod_abcdefghijklmnop',
  `cs_test_${'a'.repeat(201)}`,
  `cs_test_abcdefghij${SCRIPT}`,
  'cs_test_abcdefghij/../../v1/customers',
  'cs_test_abcdefghij?expand[]=customer',
  `cs_test_abcdefghij${ZWSP}`,
  `cs_test_abcdefghij${NUL}`,
  ' cs_test_abcdefghijklmnop',
  'javascript:alert(1)',
  12345,
  null,
  { id: SESSION }
];

test('checkout schema: only offerId, attemptId and sessionId are accepted', () => {
  assert.equal(parseCheckoutRequest({ offerId: OFFER, attemptId: ATTEMPT }).ok, true);
  assert.equal(parseCheckoutRequest({ offerId: OFFER, attemptId: ATTEMPT, sessionId: SESSION }).ok, true);
  assert.equal(parseCheckoutRequest({ offerId: OFFER, attemptId: ATTEMPT, sessionId: null }).ok, true);
  for (const extra of [{ amount: 1 }, { price: 0 }, { currency: 'eur' }, { success_url: 'https://evil.example' }, { isAdmin: true }]) {
    assert.equal(parseCheckoutRequest({ offerId: OFFER, attemptId: ATTEMPT, ...extra }).ok, false, JSON.stringify(extra));
  }
  // __proto__ arriving through JSON is an own key: rejected, and no pollution.
  const polluted = JSON.parse(`{"offerId":"${OFFER}","attemptId":"${ATTEMPT}","__proto__":{"admin":true}}`);
  assert.equal(parseCheckoutRequest(polluted).ok, false);
  assert.equal({}.admin, undefined);
});

test('checkout schema: wrong types, unknown offers and malicious strings are rejected', () => {
  const bad = [
    null,
    [],
    'offerId=accompagnement-voyage',
    { offerId: SCRIPT, attemptId: ATTEMPT },
    { offerId: 'toString', attemptId: ATTEMPT },
    { offerId: '__proto__', attemptId: ATTEMPT },
    { offerId: `${OFFER}${ZWSP}`, attemptId: ATTEMPT },
    { offerId: OFFER.repeat(100), attemptId: ATTEMPT },
    { offerId: [OFFER], attemptId: ATTEMPT },
    { offerId: OFFER, attemptId: `${ATTEMPT}${SCRIPT}` },
    { offerId: OFFER, attemptId: ` ${ATTEMPT}` },
    { offerId: OFFER, attemptId: 'x'.repeat(100_000) },
    { offerId: OFFER, attemptId: 42 },
    ...BAD_SESSION_IDS.filter((s) => s !== null).map((sessionId) => ({ offerId: OFFER, attemptId: ATTEMPT, sessionId }))
  ];
  for (const body of bad) assert.equal(parseCheckoutRequest(body).ok, false, JSON.stringify(body)?.slice(0, 80));
});

test('session ids: only the Stripe format passes', () => {
  assert.equal(isSessionId(SESSION), true);
  assert.equal(isSessionId('cs_live_a1B2c3D4e5F6g7H8'), true);
  for (const id of BAD_SESSION_IDS) assert.equal(isSessionId(id), false, String(id));
  assert.equal(readSessionIdParam(`?session_id=${SESSION}`), SESSION);
  assert.equal(readSessionIdParam(`?session_id=${SESSION}&session_id=cs_test_zzzzzzzzzzzzzz`), '');
  assert.equal(readSessionIdParam(`?session_id=${encodeURIComponent(SCRIPT)}`), '');
  assert.equal(readSessionIdParam(`?session_id=${'a'.repeat(600)}`), '');
});

test('redirects: Stripe Checkout or this site only — no javascript:, data: or foreign hosts', () => {
  assert.equal(isStripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_a1B2'), true);
  for (const url of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://checkout.stripe.com/c/pay/x',
    'https://checkout.stripe.com.evil.example/c/pay/x',
    'https://evil.example/https://checkout.stripe.com/',
    'https://user:pass@checkout.stripe.com/c/pay/x',
    '//checkout.stripe.com/c/pay/x',
    `https://checkout.stripe.com/${NUL}`,
    `https://checkout.stripe.com/${'a'.repeat(3000)}`,
    null,
    42
  ]) {
    assert.equal(isStripeCheckoutUrl(url), false, String(url).slice(0, 60));
  }

  assert.equal(isConfirmationPath(`/paiement/confirmation?session_id=${SESSION}`), true);
  assert.equal(isConfirmationPath(`/paiement/confirmation?session_id=${SESSION}&next=//evil.example`), false);
  assert.equal(isConfirmationPath('/paiement/confirmation?session_id=javascript:alert(1)'), false);
  assert.equal(isConfirmationPath('//evil.example/paiement/confirmation?session_id=x'), false);

  assert.equal(safeInternalPath('/abonnements#achat'), '/abonnements#achat');
  for (const p of ['//evil.example', '/\\evil.example', '\\\\evil.example', 'https://evil.example', 'javascript:alert(1)', ' /x', `/x${RLO}`, 'abonnements']) {
    assert.equal(safeInternalPath(p, 'FALLBACK'), 'FALLBACK', p);
  }
});

test('control, zero-width and bidi characters are detected', () => {
  assert.equal(hasUnsafeChars('Bonjour, ça va ?'), false);
  for (const s of [`a${ZWSP}b`, `a${RLO}b`, `a${NUL}b`, 'a\nb', `a${String.fromCharCode(7)}b`]) {
    assert.equal(hasUnsafeChars(s), true);
  }
});

test('session-status answers are checked before display', () => {
  assert.deepEqual(parseSessionStatus({ state: 'paid', offerId: OFFER, amount: 100, currency: 'usd' }), {
    state: 'paid',
    offerId: OFFER,
    amount: 100,
    currency: 'usd'
  });
  assert.equal(parseSessionStatus({ state: SCRIPT, offerId: OFFER }), null);
  assert.equal(parseSessionStatus({ state: 'paid', offerId: OFFER, amount: '100', currency: 'usd' }), null);
  assert.equal(parseSessionStatus({ state: 'paid', offerId: OFFER, amount: 100, currency: '<b>' }), null);
  assert.equal(parseSessionStatus({ state: 'paid', offerId: 'other', amount: 100, currency: 'usd' }), null);
  assert.equal(parseSessionStatus('paid'), null);
});

test('checkout API: malicious bodies never reach Stripe', async () => {
  const stripe = fakeStripe();
  const handler = createCheckoutHandler({ getStripe: () => stripe, log: silentLog });
  const bodies = [
    { offerId: OFFER, attemptId: ATTEMPT, amount: 1 },
    { offerId: SCRIPT, attemptId: ATTEMPT },
    { offerId: OFFER, attemptId: ATTEMPT, sessionId: 'cs_test_abcdefghij/../../v1/customers' },
    '{"offerId":"accompagnement-voyage","attemptId":"' + ATTEMPT + '","__proto__":{"x":1}}',
    '[1,2,3]',
    'not json'
  ];
  for (const body of bodies) {
    const res = fakeRes();
    await handler(jsonPost('/api/stripe/create-checkout-session', body), res);
    assert.equal(res.statusCode, 400, String(typeof body === 'string' ? body : JSON.stringify(body)));
    assert.deepEqual(res.body, { error: 'invalid_request' });
  }
  // Oversized body: refused on its declared size, then on its real size.
  const big = { offerId: OFFER, attemptId: ATTEMPT, pad: 'x'.repeat(5000) };
  let res = fakeRes();
  await handler(jsonPost('/api/stripe/create-checkout-session', big), res);
  assert.equal(res.statusCode, 413);
  res = fakeRes();
  const preParsed = jsonPost('/api/stripe/create-checkout-session', undefined);
  preParsed.body = big; // as a platform body parser would hand it over
  await handler(preParsed, res);
  assert.equal(res.statusCode, 413);
  // Wrong content type.
  res = fakeRes();
  await handler(fakeReq({ method: 'POST', url: '/api/stripe/create-checkout-session', body: { offerId: OFFER, attemptId: ATTEMPT }, headers: { 'content-type': 'text/plain' } }), res);
  assert.equal(res.statusCode, 415);
  assert.equal(stripe.calls.create.length + stripe.calls.retrieve.length, 0);
});

test('checkout API: a non-Stripe checkout URL is never handed to the browser', async () => {
  const stripe = fakeStripe();
  const create = stripe.checkout.sessions.create;
  stripe.checkout.sessions.create = async (...args) => ({ ...(await create(...args)), url: 'https://evil.example/pay' });
  const handler = createCheckoutHandler({ getStripe: () => stripe, log: silentLog });
  const res = fakeRes();
  await handler(jsonPost('/api/stripe/create-checkout-session', { offerId: OFFER, attemptId: ATTEMPT }), res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.url, undefined);
});

test('session-status API: session_id is validated before calling Stripe', async () => {
  const stripe = fakeStripe();
  const handler = createSessionStatusHandler({ getStripe: () => stripe, log: silentLog });
  const urls = [
    '/api/stripe/session-status',
    `/api/stripe/session-status?session_id=${encodeURIComponent(SCRIPT)}`,
    '/api/stripe/session-status?session_id=cs_test_abcdefghij%2F..%2Fcustomers',
    `/api/stripe/session-status?session_id=${SESSION}&session_id=cs_test_zzzzzzzzzzzz`,
    `/api/stripe/session-status?session_id=${SESSION}&expand[]=customer`,
    `/api/stripe/session-status?session_id=${SESSION}%E2%80%8B`,
    `/api/stripe/session-status?session_id=${'a'.repeat(700)}`
  ];
  for (const url of urls) {
    const res = fakeRes();
    await handler(fakeReq({ url }), res);
    assert.equal(res.statusCode, 400, url.slice(0, 80));
    assert.deepEqual(res.body, { error: 'invalid_request' });
  }
  assert.equal(stripe.calls.retrieve.length, 0);
});

test('checkout client: never follows a javascript: or foreign redirect', async () => {
  const response = (body) => ({ ok: true, status: 200, json: async () => body });
  const uuid = () => ATTEMPT;
  for (const body of [
    { status: 'redirect', url: 'javascript:alert(1)' },
    { status: 'redirect', url: 'https://evil.example/c/pay/x' },
    { status: 'paid', redirect: '//evil.example/paiement/confirmation?session_id=x' },
    { status: 'paid', redirect: `/paiement/confirmation?session_id=${encodeURIComponent(SCRIPT)}` }
  ]) {
    const c = createCheckoutController({ offerId: OFFER, fetchImpl: async () => response(body), randomUUID: uuid });
    assert.equal((await c.start()).type, 'error', JSON.stringify(body));
  }
  assert.throws(() => createCheckoutController({ offerId: SCRIPT }));
});

test('checkout client: sends exactly the validated fields', async () => {
  let sent;
  const fetchImpl = async (_url, init) => {
    sent = JSON.parse(init.body);
    return { ok: true, status: 200, json: async () => ({ status: 'redirect', url: 'https://checkout.stripe.com/c/pay/x', sessionId: SESSION }) };
  };
  const c = createCheckoutController({ offerId: OFFER, fetchImpl, randomUUID: () => ATTEMPT });
  await c.start();
  assert.deepEqual(sent, { offerId: OFFER, attemptId: ATTEMPT });
});

test('security headers: vercel.json matches shared/security-headers.js', () => {
  const vercel = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const all = vercel.headers.find((h) => h.source === '/(.*)');
  assert.deepEqual(all.headers, SECURITY_HEADERS.map(({ key, value }) => ({ key, value })));
  const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /script-src 'self'(;|$)/, 'no inline or third-party scripts');
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /frame-ancestors 'self'/);
});

test('no user data is rendered as HTML', () => {
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|jsx?)$/.test(e.name)) files.push(p);
    }
  };
  walk(new URL('../src', import.meta.url).pathname);
  const offenders = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    if (/\.innerHTML\s*=|insertAdjacentHTML|document\.write|eval\(|new Function\(/.test(src)) offenders.push(f);
    // The only dangerouslySetInnerHTML is the static LevelUp credit constant.
    if (/dangerouslySetInnerHTML/.test(src) && !/dangerouslySetInnerHTML=\{\{ __html: CREDIT_HTML \}\}/.test(src)) offenders.push(f);
  }
  assert.deepEqual(offenders, []);
});
