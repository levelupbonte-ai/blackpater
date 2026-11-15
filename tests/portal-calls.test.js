import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPortalHandler } from '../api/_lib/portal/handler.js';
import { PortalDbError } from '../api/_lib/portal/db.js';
import { fakeReq, fakeRes, silentLog } from './helpers.js';

const KEY = 'lu_live_' + 'a'.repeat(48);
const SESSION = 'b'.repeat(64);
const SLOT = '11111111-2222-4333-8444-555555555555';
const CONFIG = {
  portalKey: KEY,
  resendKey: 're_test_1234567890',
  from: 'Black Pater <espace@blackpater.com>',
  replyTo: 'lofumbwapater@gmail.com',
  notifySecret: 'n'.repeat(64),
  cronSecret: 'c'.repeat(40)
};
const withSession = { cookie: `__Host-bp_portal=${SESSION}` };

function setup(rpcImpl = async () => ({ ok: true, id: 'call-1' })) {
  const calls = [];
  let pings = 0;
  const handler = createPortalHandler({
    getConfig: () => CONFIG,
    rpc: async (name, args) => {
      calls.push({ name, args });
      return rpcImpl(name, args);
    },
    send: async () => ({ ok: true, status: 200 }),
    pingStaff: async () => {
      pings += 1;
    },
    log: silentLog,
    isBreached: async () => false
  });
  return { handler, calls, pings: () => pings };
}

const post = (action, body, headers = {}) =>
  fakeReq({
    method: 'POST',
    url: `/api/portal/${action}`,
    body,
    headers: { 'content-type': 'application/json', origin: 'https://blackpater.com', ...headers }
  });
const get = (action, headers = {}) => fakeReq({ method: 'GET', url: `/api/portal/${action}`, headers });

test('calls: quota, slots and meetings come from LevelUp with the session', async () => {
  const { handler, calls } = setup(async () => ({ active: true, level: 2, quota: 3, used: 1, video: false, slots: [{ id: SLOT }], meetings: [], calls: [] }));
  const res = fakeRes();
  await handler(get('calls', withSession), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.quota, 3);
  assert.equal(res.body.used, 1);
  assert.equal(res.body.video, false);
  assert.equal(res.body.meetings_allowed, false);
  assert.equal(res.body.slots.length, 1);
  assert.deepEqual(calls[0], { name: 'portal_calls_home', args: { p_key: KEY, p_session: SESSION } });

  const anon = fakeRes();
  await handler(get('calls'), anon);
  assert.equal(anon.statusCode, 401);
});

test('call-book: strict input, phone needed for a phone call, the team is told', async () => {
  const { handler, calls, pings } = setup();
  const ok = fakeRes();
  await handler(post('call-book', { slotId: SLOT, platform: 'phone', phone: '+1 555 123 4567', topic: ' Visa ' }, withSession), ok);
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(calls[0], {
    name: 'portal_call_book',
    args: { p_key: KEY, p_session: SESSION, p_slot: SLOT, p_platform: 'phone', p_phone: '+1 555 123 4567', p_topic: 'Visa' }
  });
  assert.equal(pings(), 1);

  const video = fakeRes();
  await handler(post('call-book', { slotId: SLOT, platform: 'zoom' }, withSession), video);
  assert.equal(video.statusCode, 200);
  assert.equal(calls[1].args.p_phone, null);

  for (const body of [
    { slotId: SLOT, platform: 'phone' },
    { slotId: SLOT, platform: 'skype' },
    { slotId: 'x', platform: 'zoom' },
    { slotId: SLOT, platform: 'phone', phone: 'call me' },
    { slotId: SLOT, platform: 'zoom', extra: 1 },
    { slotId: SLOT, platform: 'zoom', topic: 'x'.repeat(501) }
  ]) {
    const bad = fakeRes();
    await handler(post('call-book', body, withSession), bad);
    assert.equal(bad.statusCode, 400, JSON.stringify(body));
  }
  assert.equal(calls.length, 2);

  const other = fakeRes();
  await handler(post('call-book', { slotId: SLOT, platform: 'zoom' }, { ...withSession, origin: 'https://evil.example' }), other);
  assert.equal(other.statusCode, 403);
});

test('call-book: LevelUp refusals become short codes', async () => {
  for (const [code, status, error] of [
    ['slot_taken', 409, 'slot_taken'],
    ['calls_used_up', 403, 'calls_used_up'],
    ['plan_required', 403, 'plan_required']
  ]) {
    const { handler } = setup(async () => {
      throw new PortalDbError(code, status);
    });
    const res = fakeRes();
    await handler(post('call-book', { slotId: SLOT, platform: 'meet' }, withSession), res);
    assert.equal(res.statusCode, status);
    assert.equal(res.body.error, error);
  }
});

test('call-cancel: a call id only', async () => {
  const { handler, calls } = setup(async () => ({ ok: true }));
  const res = fakeRes();
  await handler(post('call-cancel', { callId: SLOT }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls[0], { name: 'portal_call_cancel', args: { p_key: KEY, p_session: SESSION, p_call: SLOT } });
  const bad = fakeRes();
  await handler(post('call-cancel', { callId: 'nope' }, withSession), bad);
  assert.equal(bad.statusCode, 400);
});
