// Page views sent by public/js/levelup.js (dashboard > Analytics), run in a
// minimal fake browser: one view on load, one per client-side route, nothing
// under Do Not Track or when window.LEVELUP.analytics is false.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE = fs.readFileSync(new URL('../public/js/levelup.js', import.meta.url), 'utf8');
const CONFIG = {
  supabaseUrl: 'https://example.invalid',
  publishableKey: 'sb_publishable_test',
  websiteId: 'ws_ab9493c5857ed460'
};

function browser({ dnt = null, analytics, referrer = 'https://www.google.com/', keepaliveFails = false } = {}) {
  const calls = [];
  let url = new URL('https://blackpater.com/');
  const listeners = {};
  const history = {
    pushState(_s, _t, next) {
      url = new URL(next, url);
    },
    replaceState(_s, _t, next) {
      url = new URL(next, url);
    }
  };
  const location = {
    get pathname() {
      return url.pathname;
    },
    get href() {
      return url.href;
    }
  };
  const window = {
    LEVELUP: { ...CONFIG, ...(analytics === undefined ? {} : { analytics }) },
    navigator: { doNotTrack: dnt, language: 'fr-CA' },
    addEventListener: (type, fn) => {
      (listeners[type] ||= []).push(fn);
    }
  };
  const fetch = async (target, init = {}) => {
    calls.push({ target, init });
    if (target.endsWith('/rpc/track_pageview') && init.keepalive && keepaliveFails) {
      throw new TypeError('keepalive not supported');
    }
    return { ok: true, json: async () => (target.includes('content_blocks') ? [] : null) };
  };
  const document = {
    documentElement: { dataset: {}, lang: 'fr' },
    referrer,
    querySelectorAll: () => []
  };
  const context = vm.createContext({ window, document, history, location, navigator: window.navigator, fetch, JSON, Promise, encodeURIComponent, String });
  vm.runInContext(SOURCE, context);
  // Views that reached the database (a refused keepalive request did not).
  const views = () =>
    calls
      .filter((c) => c.target.endsWith('/rpc/track_pageview') && !(keepaliveFails && c.init.keepalive))
      .map((c) => JSON.parse(c.init.body));
  return {
    calls,
    views,
    push: (path) => context.history.pushState(null, '', path),
    replace: (path) => context.history.replaceState(null, '', path),
    back: (path) => {
      url = new URL(path, url);
      for (const fn of listeners.popstate || []) fn();
    }
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test('one view on load, with the referrer and the language', async () => {
  const b = browser();
  await tick();
  assert.deepEqual(b.views(), [
    { p_website_id: CONFIG.websiteId, p_path: '/', p_referrer: 'https://www.google.com/', p_lang: 'fr-CA' }
  ]);
  const call = b.calls.find((c) => c.target === 'https://example.invalid/rest/v1/rpc/track_pageview');
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.keepalive, true);
  assert.equal(call.init.credentials, 'omit');
  assert.equal(call.init.headers.apikey, CONFIG.publishableKey);
});

test('client-side routes: pushState, replaceState and Back each count once', async () => {
  const b = browser();
  b.push('/abonnements');
  b.push('/abonnements'); // same route again: no extra view
  b.replace('/abonnements?x=1'); // query change only: no extra view
  b.push('/parcours');
  b.back('/abonnements');
  await tick();
  assert.deepEqual(
    b.views().map((v) => v.p_path),
    ['/', '/abonnements', '/parcours', '/abonnements']
  );
  assert.equal(b.views()[1].p_referrer, 'https://blackpater.com/');
  assert.ok(b.views().every((v) => !('p_query' in v) && !v.p_path.includes('?')));
});

test('Do Not Track and analytics: false send nothing', async () => {
  for (const b of [browser({ dnt: '1' }), browser({ analytics: false })]) {
    b.push('/parcours');
    await tick();
    assert.equal(b.views().length, 0);
  }
});

test('a browser that refuses keepalive gets a normal request', async () => {
  const b = browser({ keepaliveFails: true });
  await tick();
  await tick();
  const pv = b.calls.filter((c) => c.target.endsWith('/rpc/track_pageview'));
  assert.deepEqual(pv.map((c) => c.init.keepalive), [true, false]);
});
