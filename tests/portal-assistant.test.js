import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPortalHandler } from '../api/_lib/portal/handler.js';
import { assistantUrl, createAssistantClient, DEFAULT_ASSISTANT_URL } from '../api/_lib/portal/assistant.js';
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
const ATTEMPT = '11111111-2222-4333-8444-555555555555';
const withSession = { cookie: `__Host-bp_portal=${SESSION}` };

function setup({ rpc, callAssistant } = {}) {
  const calls = [];
  const ai = [];
  const handler = createPortalHandler({
    getConfig: () => CONFIG,
    rpc: async (name, args) => {
      calls.push({ name, args });
      return rpc ? rpc(name, args) : { ok: true };
    },
    send: async () => ({ ok: true, status: 200 }),
    callAssistant: async (key, payload) => {
      ai.push({ key, payload });
      return callAssistant ? callAssistant(key, payload) : { ok: true };
    },
    log: silentLog,
    isBreached: async () => false
  });
  return { handler, calls, ai };
}

const post = (action, body, headers = {}) =>
  fakeReq({
    method: 'POST',
    url: `/api/portal/${action}`,
    body,
    headers: { 'content-type': 'application/json', origin: 'https://blackpater.com', ...headers }
  });

test('dossier: saved before payment without a session, only from this site', async () => {
  const { handler, calls } = setup();
  const res = fakeRes();
  await handler(post('dossier', { attemptId: ATTEMPT, dossier: { destinationCountry: 'CA', email: 'a@example.com' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].name, 'portal_profile_draft');
  assert.equal(calls[0].args.p_attempt, ATTEMPT);
  assert.equal(calls[0].args.p_key, KEY);
  assert.match(calls[0].args.p_client, /^[0-9a-f]+$/);

  const cross = fakeRes();
  await handler(post('dossier', { attemptId: ATTEMPT, dossier: {} }, { origin: 'https://evil.example' }), cross);
  assert.equal(cross.statusCode, 403);

  for (const body of [{ attemptId: 'x', dossier: {} }, { attemptId: ATTEMPT, dossier: [] }, { attemptId: ATTEMPT, dossier: { a: 'x'.repeat(13000) } }]) {
    const bad = fakeRes();
    await handler(post('dossier', body), bad);
    assert.ok([400, 413].includes(bad.statusCode));
  }
  assert.equal(calls.length, 1);
});

test('assistant thread: GET with the session, shape kept tight', async () => {
  const { handler, calls } = setup({ rpc: async () => ({ enabled: true, active: true, daily: 20, used: 3, messages: [{ id: 'm' }], extra: 'x' }) });
  const res = fakeRes();
  await handler(fakeReq({ method: 'GET', url: '/api/portal/assistant', headers: withSession }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].name, 'portal_ai_thread');
  assert.deepEqual(Object.keys(res.body).sort(), ['active', 'daily', 'enabled', 'has_profile', 'images', 'messages', 'used']);
  assert.deepEqual(res.body.images, { daily: 0, used: 0 });

  const anon = fakeRes();
  await handler(fakeReq({ method: 'GET', url: '/api/portal/assistant' }), anon);
  assert.equal(anon.statusCode, 401);
});

test('assistant ask and handoff go to LevelUp with the portal key and session', async () => {
  const { handler, ai } = setup({
    callAssistant: async (_k, p) => (p.action === 'ask' ? { answer: { id: 'a1', role: 'assistant' } } : { ok: true, id: 'msg1' })
  });
  const res = fakeRes();
  await handler(post('assistant-ask', { question: '  Quel visa ?  ' }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.answer.id, 'a1');
  assert.equal(ai[0].key, KEY);
  assert.equal(ai[0].payload.action, 'ask');
  assert.equal(ai[0].payload.session, SESSION);
  assert.equal(ai[0].payload.question, 'Quel visa ?');
  assert.equal(ai[0].payload.lang, 'fr');
  assert.match(ai[0].payload.site.guide, /Mon dossier/);
  assert.equal(ai[0].payload.images, undefined);

  const h = fakeRes();
  await handler(post('assistant-handoff', { questionId: ATTEMPT }, withSession), h);
  assert.equal(h.statusCode, 200);
  assert.deepEqual(ai[1].payload, { action: 'handoff', session: SESSION, questionId: ATTEMPT });

  const tooLong = fakeRes();
  await handler(post('assistant-ask', { question: 'x'.repeat(2001) }, withSession), tooLong);
  assert.equal(tooLong.statusCode, 400);
  assert.equal(ai.length, 2);
});

test('assistant errors come back as short codes', async () => {
  const { handler } = setup({
    callAssistant: async () => {
      throw new PortalDbError('rate_limited', 429);
    }
  });
  const res = fakeRes();
  await handler(post('assistant-ask', { question: 'Q' }, withSession), res);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.error, 'rate_limited');
});

test('assistant client: Bearer portal key, status mapped, network failure is ai_unavailable', async () => {
  const seen = [];
  const ok = createAssistantClient({
    url: DEFAULT_ASSISTANT_URL,
    fetch: async (url, init) => {
      seen.push({ url, init });
      return new Response(JSON.stringify({ answer: { id: 'x' } }), { status: 200 });
    }
  });
  assert.deepEqual(await ok(KEY, { action: 'ask' }), { answer: { id: 'x' } });
  assert.equal(seen[0].init.headers.Authorization, `Bearer ${KEY}`);

  const limited = createAssistantClient({ fetch: async () => new Response('{"error":"rate_limited"}', { status: 429 }) });
  await assert.rejects(limited(KEY, {}), (e) => e.code === 'rate_limited' && e.status === 429);
  const odd = createAssistantClient({ fetch: async () => new Response('nope', { status: 500 }) });
  await assert.rejects(odd(KEY, {}), (e) => e.code === 'ai_unavailable' && e.status === 503);
  const down = createAssistantClient({ fetch: async () => { throw new Error('offline'); } });
  await assert.rejects(down(KEY, {}), (e) => e.code === 'ai_unavailable');

  assert.equal(assistantUrl({}), DEFAULT_ASSISTANT_URL);
  assert.equal(assistantUrl({ LEVELUP_ASSISTANT_URL: 'https://staging.example.com/api/portal/assistant' }), 'https://staging.example.com/api/portal/assistant');
  assert.equal(assistantUrl({ LEVELUP_ASSISTANT_URL: 'http://evil/x' }), DEFAULT_ASSISTANT_URL);
});

test('assistant ask: the dossier goes to the AI in words, without e-mail or phone', async () => {
  const profile = { destinationCountry: 'CA', tier: 'solo', fullName: 'Amani K', email: 'amani@example.com', phone: '+1 555 0100', answers: { purpose: 'study' } };
  const { handler, ai, calls } = setup({ rpc: async (name) => (name === 'portal_profile_me' ? { profile, note: null } : { ok: true }) });
  const res = fakeRes();
  await handler(post('assistant-ask', { question: 'Q', lang: 'en' }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].name, 'portal_profile_me');
  const d = ai[0].payload.site.dossier;
  assert.match(d, /Destination: Canada/);
  assert.match(d, /Study/);
  assert.doesNotMatch(d, /amani@example\.com|555/);
  assert.match(ai[0].payload.site.guide, /My dossier/);
});

test('assistant ask: up to 3 image data URLs pass, anything else is refused', async () => {
  const { handler, ai } = setup({ rpc: async () => ({ profile: null }) });
  const img = 'data:image/jpeg;base64,' + 'A'.repeat(100);
  const ok = fakeRes();
  await handler(post('assistant-ask', { question: 'Q', images: [img, img] }, withSession), ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(ai[0].payload.images.length, 2);
  for (const images of [[img, img, img, img], ['data:image/svg+xml;base64,AAA'], ['https://x/y.jpg'], 'x']) {
    const bad = fakeRes();
    await handler(post('assistant-ask', { question: 'Q', images }, withSession), bad);
    assert.equal(bad.statusCode, 400);
  }
  assert.equal(ai.length, 1);
});

test('image limit from LevelUp keeps its own code', async () => {
  const client = createAssistantClient({ fetch: async () => new Response('{"error":"image_limit"}', { status: 429 }) });
  await assert.rejects(client(KEY, {}), (e) => e.code === 'image_limit' && e.status === 429);
});

test('profile and note: own dossier read, note saved', async () => {
  const { handler, calls } = setup({
    rpc: async (name) => (name === 'portal_profile_me' ? { profile: { tier: 'solo' }, updated_at: '2026-11-10T00:00:00Z', note: 'n' } : { ok: true, note: 'Mon projet' })
  });
  const res = fakeRes();
  await handler(fakeReq({ method: 'GET', url: '/api/portal/profile', headers: withSession }), res);
  assert.deepEqual(res.body, { profile: { tier: 'solo' }, updated_at: '2026-11-10T00:00:00Z', note: 'n' });
  const n = fakeRes();
  await handler(post('profile-note', { note: 'Mon projet' }, withSession), n);
  assert.equal(n.statusCode, 200);
  assert.equal(calls.at(-1).name, 'portal_profile_note');
  const long = fakeRes();
  await handler(post('profile-note', { note: 'x'.repeat(2001) }, withSession), long);
  assert.equal(long.statusCode, 400);
});
