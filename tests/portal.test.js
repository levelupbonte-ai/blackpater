import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createPortalHandler, emailForOutbox } from '../api/_lib/portal/handler.js';
import { buildEmail, createMailer, escapeHtml } from '../api/_lib/portal/email.js';
import { missingConfig } from '../api/_lib/portal/config.js';
import {
  clientHash,
  deviceLabel,
  passwordProblem,
  readSessionCookie,
  sessionCookie,
  verifySignature
} from '../api/_lib/portal/security.js';
import { PortalDbError } from '../api/_lib/portal/db.js';
import { fakeReq, fakeRes, silentLog } from './helpers.js';

const KEY = 'lu_live_' + 'a'.repeat(48);
const SESSION = 'b'.repeat(64);
const CONFIG = {
  portalKey: KEY,
  resendKey: 're_test_1234567890',
  from: 'Black Pater <espace@blackpater.com>',
  replyTo: 'lofumbwapater@gmail.com',
  notifySecret: 'n'.repeat(64),
  cronSecret: 'c'.repeat(40)
};

function setup({ rpc, config = CONFIG, ...rest } = {}) {
  const calls = [];
  const sent = [];
  const handler = createPortalHandler({
    getConfig: () => config,
    rpc: async (name, args) => {
      calls.push({ name, args });
      return rpc ? rpc(name, args) : { ok: true };
    },
    send: async (cfg, mail) => {
      sent.push({ cfg, mail });
      return { ok: true, status: 200 };
    },
    log: silentLog,
    minCodeResponseMs: 0,
    isBreached: async () => false,
    ...rest
  });
  return { handler, calls, sent };
}

function post(action, body, headers = {}) {
  return fakeReq({
    method: 'POST',
    url: `/api/portal/${action}`,
    body,
    headers: { 'content-type': 'application/json', origin: 'https://blackpater.com', ...headers }
  });
}

const withSession = { cookie: `__Host-bp_portal=${SESSION}` };

test('portal fails closed without its keys: 503 and nothing sent', async () => {
  const { handler, calls, sent } = setup({ config: { ...CONFIG, resendKey: '' } });
  const res = fakeRes();
  await handler(post('request-code', { email: 'a@example.com' }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, 'portal_unavailable');
  assert.equal(calls.length, 0);
  assert.equal(sent.length, 0);
  assert.deepEqual(missingConfig({ ...CONFIG, resendKey: '', from: '' }), ['BLACKPATER_RESEND_API_KEY', 'BLACKPATER_EMAIL_FROM']);
});

test('status says only whether the portal is available', async () => {
  const { handler } = setup({ config: { ...CONFIG, portalKey: '' } });
  const res = fakeRes();
  await handler(fakeReq({ url: '/api/portal/status' }), res);
  assert.deepEqual(res.body, { available: false });
});

test('request-code: same answer whether or not the address has a booking', async () => {
  const known = setup({ rpc: () => ({ ok: true, send: true, email: 'jane@example.com', code: '123456', locale: 'fr', name: 'Jane' }) });
  const unknown = setup({ rpc: () => ({ ok: true, send: false }) });
  const r1 = fakeRes();
  const r2 = fakeRes();
  await known.handler(post('request-code', { email: 'Jane@Example.com', lang: 'fr' }), r1);
  await unknown.handler(post('request-code', { email: 'nobody@example.com' }), r2);
  assert.equal(r1.statusCode, 200);
  assert.deepEqual(r1.body, r2.body);
  assert.equal(known.calls[0].args.p_email, 'jane@example.com');
  assert.match(known.calls[0].args.p_client, /^[0-9a-f]{32}$/);
  assert.equal(known.sent.length, 1);
  assert.equal(unknown.sent.length, 0);
  const mail = known.sent[0].mail;
  assert.equal(mail.to, 'jane@example.com');
  assert.match(mail.subject, /123456/);
  assert.equal(known.sent[0].cfg.from, 'Black Pater <espace@blackpater.com>');
});

test('request-code waits a minimum time so timing does not reveal a booking', async () => {
  const { handler } = setup({ rpc: () => ({ ok: true, send: false }), minCodeResponseMs: 120 });
  const t0 = Date.now();
  await handler(post('request-code', { email: 'nobody@example.com' }), fakeRes());
  assert.ok(Date.now() - t0 >= 110);
});

test('rate limits from the database come back as 429', async () => {
  const { handler } = setup({
    rpc: () => {
      throw new PortalDbError('rate_limited', 429);
    }
  });
  const res = fakeRes();
  await handler(post('request-code', { email: 'a@example.com' }), res);
  assert.equal(res.statusCode, 429);
});

test('per-IP limiter on sign-in attempts', async () => {
  const { handler } = setup({ rpc: () => ({ ok: false, reason: 'invalid' }) });
  let last;
  for (let i = 0; i < 21; i += 1) {
    last = fakeRes();
    await handler(post('verify-code', { email: 'a@example.com', code: '000000' }), last);
  }
  assert.equal(last.statusCode, 429);
});

test('cross-site requests and unknown keys are refused', async () => {
  const { handler, calls } = setup();
  const res = fakeRes();
  await handler(post('request-code', { email: 'a@example.com' }, { origin: 'https://evil.example' }), res);
  assert.equal(res.statusCode, 403);
  const res2 = fakeRes();
  await handler(post('request-code', { email: 'a@example.com', price: 1 }), res2);
  assert.equal(res2.statusCode, 400);
  const res3 = fakeRes();
  await handler(post('verify-code', { email: 'a@example.com', code: '12ab56' }), res3);
  assert.equal(res3.statusCode, 400);
  assert.equal(calls.length, 0);
});

test('verify-code sets a 7-day HttpOnly, Secure, SameSite=Strict __Host- cookie and sends the sign-in alert', async () => {
  const outbox = [{ id: 1, kind: 'signin', to: 'jane@example.com', name: 'Jane', locale: 'en', data: { device: 'Chrome on Android', at: '2026-11-02T10:00Z' } }];
  const { handler, calls, sent } = setup({
    rpc: (name) => {
      if (name === 'portal_verify_code') return { ok: true, session: SESSION, expires_at: 'x' };
      if (name === 'portal_outbox_claim') return outbox.splice(0);
      return { ok: true };
    }
  });
  const res = fakeRes();
  await handler(post('verify-code', { email: 'jane@example.com', code: '123456' }, { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36' }), res);
  assert.equal(res.statusCode, 200);
  const cookie = res.headers['set-cookie'];
  assert.match(cookie, /^__Host-bp_portal=b{64}; Path=\/; HttpOnly; SameSite=Strict; Max-Age=604800; Secure$/);
  assert.equal(calls[0].args.p_device, 'Chrome on Android');
  assert.equal(sent.length, 1);
  assert.match(sent[0].mail.subject, /New sign-in/);
  assert.ok(calls.some((c) => c.name === 'portal_outbox_complete' && c.args.p_ok === true));
  assert.ok(!JSON.stringify(res.body).includes(SESSION), 'the token is never in the body');
});

test('a wrong code and an unknown address answer the same', async () => {
  const { handler } = setup({ rpc: () => ({ ok: false, reason: 'invalid' }) });
  const res = fakeRes();
  await handler(post('verify-code', { email: 'a@example.com', code: '000000' }), res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'invalid_credentials' });
  assert.equal(res.headers['set-cookie'], undefined);
});

test('session actions need the cookie; an expired session clears it', async () => {
  const { handler } = setup({
    rpc: () => {
      throw new PortalDbError('unauthorized', 401);
    }
  });
  const res = fakeRes();
  await handler(fakeReq({ url: '/api/portal/me' }), res);
  assert.equal(res.statusCode, 401);
  const res2 = fakeRes();
  await handler(fakeReq({ url: '/api/portal/me', headers: withSession }), res2);
  assert.equal(res2.statusCode, 401);
  assert.match(res2.headers['set-cookie'], /Max-Age=0/);
});

test('sign out of all devices revokes every session and clears the cookie', async () => {
  const { handler, calls } = setup();
  const res = fakeRes();
  await handler(post('sign-out', { all: true }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls[0], { name: 'portal_sign_out', args: { p_key: KEY, p_session: SESSION, p_all: true } });
  assert.match(res.headers['set-cookie'], /Max-Age=0/);
});

test('messages are passed through for the database to validate and rate-limit', async () => {
  const { handler, calls } = setup({ rpc: () => ({ ok: true, id: 'm1', created_at: 'now' }) });
  const res = fakeRes();
  await handler(post('message', { body: 'Hello' }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].name, 'portal_send_message');
  const res2 = fakeRes();
  await handler(post('message', { body: 'x'.repeat(4001) }, withSession), res2);
  assert.equal(res2.statusCode, 400);
});

test('passwords: weak, personal and breached passwords are refused before the database', async () => {
  assert.equal(passwordProblem('short', 'jane@example.com'), 'password_too_short');
  assert.equal(passwordProblem('aaaaaaaaaaaa', 'jane@example.com'), 'password_common');
  assert.equal(passwordProblem('password123', 'jane@example.com'), 'password_common');
  assert.equal(passwordProblem('janedoe-travel-2026', 'janedoe@example.com'), 'password_personal');
  assert.equal(passwordProblem('quiet river lantern', 'jane@example.com'), null);
  const { handler, calls } = setup({
    rpc: (name) => (name === 'portal_home' ? { customer: { email: 'jane@example.com' } } : { ok: true }),
    isBreached: async () => true
  });
  const res = fakeRes();
  await handler(post('set-password', { code: '123456', password: 'quiet river lantern' }, withSession), res);
  assert.equal(res.body.error, 'password_breached');
  assert.ok(!calls.some((c) => c.name === 'portal_set_password'));
});

test('setting a password needs the e-mailed code (passed to the database)', async () => {
  const { handler, calls } = setup({
    rpc: (name) => (name === 'portal_home' ? { customer: { email: 'jane@example.com' } } : { ok: true })
  });
  const res = fakeRes();
  await handler(post('set-password', { code: '123456', password: 'quiet river lantern' }, withSession), res);
  assert.equal(res.statusCode, 200);
  const call = calls.find((c) => c.name === 'portal_set_password');
  assert.equal(call.args.p_code, '123456');
});

test('e-mail change sends a code to the old and to the new address', async () => {
  const { handler, sent } = setup({
    rpc: () => ({ ok: true, name: 'Jane', locale: 'en', old: { email: 'old@example.com', code: '111111' }, new: { email: 'new@example.com', code: '222222' } })
  });
  const res = fakeRes();
  await handler(post('email-start', { email: 'new@example.com' }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(sent.map((s) => s.mail.to), ['old@example.com', 'new@example.com']);
  assert.match(sent[0].mail.text, /new@example\.com/);
});

test('the e-mail queue only runs for the signed dashboard call or the cron secret', async () => {
  const { handler } = setup({ rpc: () => [] });
  const body = JSON.stringify({ website_id: 'ws_ab9493c5857ed460' });
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', CONFIG.notifySecret).update(`${t}.${body}`).digest('hex');
  const bad = fakeRes();
  await handler(fakeReq({ method: 'POST', url: '/api/portal/outbox', body, headers: { 'content-type': 'application/json', 'x-portal-signature': `t=${t},v1=${'0'.repeat(64)}` } }), bad);
  assert.equal(bad.statusCode, 401);
  const ok = fakeRes();
  await handler(fakeReq({ method: 'POST', url: '/api/portal/outbox', body, headers: { 'content-type': 'application/json', 'x-portal-signature': `t=${t},v1=${sig}` } }), ok);
  assert.equal(ok.statusCode, 200);
  const cron = fakeRes();
  await handler(fakeReq({ url: '/api/portal/outbox', headers: { authorization: `Bearer ${CONFIG.cronSecret}` } }), cron);
  assert.equal(cron.statusCode, 200);
  assert.equal(verifySignature(`t=${t - 600},v1=${sig}`, body, CONFIG.notifySecret), false, 'old signatures expire');
});

test('documents: invalid ids are refused; another customer\'s document is not found', async () => {
  const { handler } = setup({
    rpc: () => {
      throw new PortalDbError('not_found', 404);
    }
  });
  const res = fakeRes();
  await handler(fakeReq({ url: '/api/portal/file?item=../../etc', headers: withSession }), res);
  assert.equal(res.statusCode, 400);
  const res2 = fakeRes();
  await handler(fakeReq({ url: '/api/portal/file?item=11111111-2222-4333-8444-555555555555', headers: withSession }), res2);
  assert.equal(res2.statusCode, 404);
});

test('receipt: only a Stripe receipt URL of the customer\'s own payment', async () => {
  const stripe = {
    paymentIntents: {
      retrieve: async () => ({ latest_charge: { receipt_url: 'https://pay.stripe.com/receipts/payment/abc' } })
    }
  };
  const { handler } = setup({ rpc: () => ({ ok: true, provider: 'stripe', payment_intent: 'pi_123' }), getStripe: () => stripe });
  const res = fakeRes();
  await handler(post('receipt', { paymentId: '11111111-2222-4333-8444-555555555555' }, withSession), res);
  assert.deepEqual(res.body, { url: 'https://pay.stripe.com/receipts/payment/abc' });
  const { handler: h2 } = setup({ rpc: () => ({ ok: true, provider: 'stripe', payment_intent: 'pi_123' }), getStripe: () => null });
  const res2 = fakeRes();
  await h2(post('receipt', { paymentId: '11111111-2222-4333-8444-555555555555' }, withSession), res2);
  assert.equal(res2.statusCode, 404);
});

test('e-mails: escaped, branded, in the customer language, never the published content', () => {
  const mail = buildEmail('update', { lang: 'fr', name: '<b>Jane</b>', title: '<script>x</script>' });
  assert.ok(!mail.html.includes('<script>x'));
  assert.ok(mail.html.includes('&lt;b&gt;Jane'));
  assert.match(mail.subject, /^Nouveau dans votre espace Black Pater/);
  assert.match(mail.html, /https:\/\/blackpater\.com\/espace-client/);
  assert.equal(escapeHtml('"&\''), '&quot;&amp;&#39;');
  const code = buildEmail('code', { code: '123456' });
  assert.match(code.text, /123456/);
  assert.match(code.subject, /^123456 is your Black Pater code$/);
  assert.equal(emailForOutbox({ kind: 'nope' }), null);
  assert.match(emailForOutbox({ kind: 'access', locale: 'en' }).subject, /member space is ready/);
});

test('mailer uses Black Pater\'s key and sender, with reply-to, and nothing without them', async () => {
  const requests = [];
  const send = createMailer({ fetch: async (url, init) => (requests.push({ url, init }), { ok: true, status: 200, text: async () => '' }) });
  const r = await send(CONFIG, { to: 'jane@example.com', subject: 's', html: 'h', text: 't' });
  assert.equal(r.ok, true);
  assert.equal(requests[0].url, 'https://api.resend.com/emails');
  assert.equal(requests[0].init.headers.Authorization, `Bearer ${CONFIG.resendKey}`);
  const payload = JSON.parse(requests[0].init.body);
  assert.equal(payload.from, CONFIG.from);
  assert.equal(payload.reply_to, 'lofumbwapater@gmail.com');
  const none = await send({ ...CONFIG, resendKey: '' }, { to: 'x@example.com', subject: 's', html: 'h', text: 't' });
  assert.equal(none.ok, false);
  assert.equal(requests.length, 1);
});

test('helpers: cookie round trip, device labels, client hash', () => {
  assert.equal(readSessionCookie({ headers: { cookie: `a=1; __Host-bp_portal=${SESSION}` } }), SESSION);
  assert.equal(readSessionCookie({ headers: { cookie: '__Host-bp_portal=not-a-token' } }), null);
  assert.match(sessionCookie(null, { secure: false }), /^bp_portal=; Path=\/; HttpOnly; SameSite=Strict; Max-Age=0$/);
  assert.equal(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1'), 'Safari on iPhone');
  assert.equal(deviceLabel('Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.0'), 'Edge on Windows');
  assert.equal(deviceLabel(''), null);
  assert.equal(clientHash('203.0.113.7', KEY), clientHash('203.0.113.7', KEY));
  assert.notEqual(clientHash('203.0.113.7', KEY), clientHash('203.0.113.8', KEY));
});

test('push first: a device that receives it saves the e-mail; a gone device is removed', async () => {
  const pushes = [];
  const results = [];
  const rows = [
    { id: 1, kind: 'message', locale: 'fr', to: 'jane@example.com', push: [{ id: 7, endpoint: 'https://push.example/a', p256dh: 'x'.repeat(60), auth: 'y'.repeat(20) }, { id: 8, endpoint: 'https://push.example/gone', p256dh: 'x'.repeat(60), auth: 'y'.repeat(20) }] },
    { id: 2, kind: 'message', locale: 'en', to: 'joe@example.com', push: [] },
    { id: 3, kind: 'signin', locale: 'en', to: 'joe@example.com', data: { at: '2026-11-12T10:00:00Z' }, push: [{ id: 9, endpoint: 'https://push.example/b', p256dh: 'x'.repeat(60), auth: 'y'.repeat(20) }] }
  ];
  const { handler, sent } = setup({
    rpc: (name, args) => {
      if (name === 'portal_outbox_claim') return rows;
      if (name === 'portal_push_result') results.push(args);
      return { ok: true };
    },
    getPushConfig: () => ({ enabled: true, publicKey: 'k'.repeat(87), privateKey: 'p'.repeat(43) }),
    sendPush: async (cfg, device, note) => {
      pushes.push([device.id, note]);
      return device.endpoint.endsWith('gone') ? { ok: false, gone: true } : { ok: true, gone: false };
    }
  });
  const out = await handler.drainNow(10);
  assert.equal(out.sent, 3);
  // Row 1 pushed (no e-mail), row 2 had no device (e-mail), row 3 is a sign-in alert (always e-mail).
  assert.deepEqual(sent.map((s) => s.mail.subject.slice(0, 3)).length, 2);
  assert.deepEqual(pushes.map((p) => p[0]), [7, 8]);
  assert.equal(pushes[0][1].url, '/espace-client?view=messages');
  assert.equal(pushes[0][1].title, 'Nouveau message');
  assert.doesNotMatch(JSON.stringify(pushes[0][1]), /jane|example/);
  assert.deepEqual(results.map((r) => [r.p_id, r.p_ok, r.p_gone]), [[7, true, false], [8, false, true]]);
});

test('push subscribe: only a well-formed https endpoint and keys reach the database', async () => {
  const pushes = [];
  const { handler, calls } = setup({
    getPushConfig: () => ({ enabled: true, publicKey: 'k'.repeat(87), privateKey: 'p'.repeat(43) }),
    sendPush: async (_cfg, device, payload) => {
      pushes.push({ device, payload });
      return { ok: true, gone: false };
    },
    rpc: async (name) => (name === 'portal_home' ? { customer: { name: 'Amani Kabila' } } : { ok: true })
  });
  const ok = fakeRes();
  await handler(post('push-subscribe', { endpoint: 'https://fcm.googleapis.com/fcm/send/abc123', p256dh: 'B'.repeat(87), auth: 'a'.repeat(22) }, withSession), ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(calls[0].name, 'portal_push_subscribe');
  // A welcome notification goes to that device right away.
  assert.equal(pushes.length, 1);
  assert.equal(pushes[0].device.endpoint, 'https://fcm.googleapis.com/fcm/send/abc123');
  assert.equal(pushes[0].payload.title, 'Notifications activées');
  assert.match(pushes[0].payload.body, /^Bienvenue Amani !/);
  const en = fakeRes();
  await handler(post('push-subscribe', { endpoint: 'https://fcm.googleapis.com/fcm/send/abc123', p256dh: 'B'.repeat(87), auth: 'a'.repeat(22), lang: 'en' }, withSession), en);
  assert.equal(pushes[1].payload.title, 'Notifications are on');
  assert.ok(calls.some((c) => c.name === 'portal_set_locale' && c.args.p_locale === 'en'));
  const bad = fakeRes();
  await handler(post('push-subscribe', { endpoint: 'http://evil.example/x', p256dh: 'B'.repeat(87), auth: 'a'.repeat(22) }, withSession), bad);
  assert.equal(bad.statusCode, 400);
});

test('locale: the space language becomes the language of e-mails and notifications', async () => {
  const { handler, calls } = setup();
  const res = fakeRes();
  await handler(post('locale', { lang: 'en' }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls[0], { name: 'portal_set_locale', args: { p_key: KEY, p_session: SESSION, p_locale: 'en' } });
  const bad = fakeRes();
  await handler(post('locale', { lang: 'de' }, withSession), bad);
  assert.equal(bad.statusCode, 400);
});
