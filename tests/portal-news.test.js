import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPortalHandler } from '../api/_lib/portal/handler.js';
import { createNewsClient, DEFAULT_NEWS_URL, newsUrl } from '../api/_lib/portal/news.js';
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
const withSession = { cookie: `__Host-bp_portal=${SESSION}` };

function setup(callNews) {
  const sent = [];
  const handler = createPortalHandler({
    getConfig: () => CONFIG,
    rpc: async () => ({ ok: true }),
    send: async () => ({ ok: true, status: 200 }),
    callNews: async (key, payload) => {
      sent.push({ key, payload });
      return callNews(key, payload);
    },
    log: silentLog,
    isBreached: async () => false
  });
  return { handler, sent };
}

const post = (action, body, headers = {}) =>
  fakeReq({
    method: 'POST',
    url: `/api/portal/${action}`,
    body,
    headers: { 'content-type': 'application/json', origin: 'https://blackpater.com', ...headers }
  });

test('news: the member feed comes from LevelUp with the portal key and session', async () => {
  const { handler, sent } = setup(async () => ({ country: 'CA', access: 'full', items: [{ id: '1', title: 'T' }] }));
  const res = fakeRes();
  await handler(post('news', { country: 'ca', lang: 'en' }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.country, 'CA');
  assert.equal(sent[0].key, KEY);
  assert.deepEqual(sent[0].payload, { action: 'list', session: SESSION, country: 'CA', lang: 'en' });

  // No country: LevelUp uses the one of the member's dossier; French by default.
  const def = fakeRes();
  await handler(post('news', {}, withSession), def);
  assert.deepEqual(sent[1].payload, { action: 'list', session: SESSION, lang: 'fr' });
});

test('news: strict input, a session, and the same site only', async () => {
  const { handler, sent } = setup(async () => ({}));
  const bad = fakeRes();
  await handler(post('news', { country: 'Canada' }, withSession), bad);
  assert.equal(bad.statusCode, 400);
  const extra = fakeRes();
  await handler(post('news', { country: 'CA', x: 1 }, withSession), extra);
  assert.equal(extra.statusCode, 400);
  const anon = fakeRes();
  await handler(post('news', {}), anon);
  assert.equal(anon.statusCode, 401);
  const cross = fakeRes();
  await handler(post('news', {}, { ...withSession, origin: 'https://evil.example' }), cross);
  assert.equal(cross.statusCode, 403);
  assert.equal(sent.length, 0);
});

test('news-guide: needs a country, returns only the links, passes "membership required" on', async () => {
  const { handler, sent } = setup(async (_k, p) => {
    if (p.country === 'SN') throw new PortalDbError('membership_required', 402);
    return { country: p.country, links: [{ name: 'Visa', url: 'https://www.example.gov', kind: 'visa' }], extra: 'x' };
  });
  const res = fakeRes();
  await handler(post('news-guide', { country: 'cm' }, withSession), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { country: 'CM', links: [{ name: 'Visa', url: 'https://www.example.gov', kind: 'visa' }] });
  assert.deepEqual(sent[0].payload, { action: 'guide', session: SESSION, country: 'CM', lang: 'fr' });

  const missing = fakeRes();
  await handler(post('news-guide', {}, withSession), missing);
  assert.equal(missing.statusCode, 400);

  const locked = fakeRes();
  await handler(post('news-guide', { country: 'SN' }, withSession), locked);
  assert.equal(locked.statusCode, 402);
  assert.equal(locked.body.error, 'membership_required');
});

test('news client: LevelUp address, bearer key, short error codes', async () => {
  assert.equal(newsUrl({}), DEFAULT_NEWS_URL);
  assert.equal(newsUrl({ LEVELUP_NEWS_URL: 'https://evil.example/x' }), DEFAULT_NEWS_URL);
  const seen = [];
  const call = createNewsClient({
    fetch: async (url, init) => {
      seen.push({ url, init });
      return new Response(JSON.stringify({ error: 'x' }), { status: 402 });
    }
  });
  await assert.rejects(() => call(KEY, { action: 'list', session: SESSION }), (e) => e.code === 'membership_required' && e.status === 402);
  assert.equal(seen[0].url, DEFAULT_NEWS_URL);
  assert.equal(seen[0].init.headers.Authorization, `Bearer ${KEY}`);
  const down = createNewsClient({ fetch: async () => { throw new Error('down'); } });
  await assert.rejects(() => down(KEY, {}), (e) => e.code === 'news_unavailable');
});

test('news-react and news-read: strict ids and values, forwarded to LevelUp', async () => {
  const ITEM = '11111111-2222-4333-8444-555555555555';
  const { handler, sent } = setup(async (_k, p) => (p.action === 'react' ? { mine: p.helpful, helpful: 3 } : {}));
  const r = fakeRes();
  await handler(post('news-react', { item: ITEM, helpful: true }, withSession), r);
  assert.equal(r.statusCode, 200);
  assert.deepEqual(r.body, { mine: true, helpful: 3 });
  assert.deepEqual(sent[0].payload, { action: 'react', session: SESSION, item: ITEM, helpful: true });

  const withdraw = fakeRes();
  await handler(post('news-react', { item: ITEM, helpful: null }, withSession), withdraw);
  assert.equal(sent[1].payload.helpful, null);

  const bad = fakeRes();
  await handler(post('news-react', { item: ITEM, helpful: 'yes' }, withSession), bad);
  assert.equal(bad.statusCode, 400);
  const badId = fakeRes();
  await handler(post('news-read', { item: 'x' }, withSession), badId);
  assert.equal(badId.statusCode, 400);

  const read = fakeRes();
  await handler(post('news-read', { item: ITEM }, withSession), read);
  assert.equal(read.statusCode, 200);
  assert.deepEqual(sent[2].payload, { action: 'read', session: SESSION, item: ITEM });
});
