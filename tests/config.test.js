import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REDIRECTS, ROUTES } from '../shared/routes.js';
import { OFFERS, formatOfferPrice } from '../shared/offers.js';

const vercel = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

test('vercel.json serves every route with its own HTML file', () => {
  for (const r of ROUTES.filter((x) => x.path !== '/')) {
    assert.ok(
      vercel.rewrites.some((w) => w.source === r.path && w.destination === `/${r.file}`),
      `missing rewrite for ${r.path}`
    );
  }
});

test('vercel.json has every legacy redirect as a 301', () => {
  for (const r of REDIRECTS) {
    assert.ok(
      vercel.redirects.some((x) => x.source === r.source && x.destination === r.destination && x.statusCode === 301),
      `missing redirect ${r.source}`
    );
  }
});

test('no non-Stripe payment code remains', () => {
  assert.ok(!fs.existsSync(new URL('../api/mobile-money', import.meta.url)));
  const sources = ['../server.js', '../vite.config.ts'].map((p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8')).join('\n');
  assert.ok(!/cinetpay|flutterwave|mobile.?money/i.test(sources));
  assert.ok(!/pk_live_|sk_live_|pk_test_|sk_test_/.test(sources), 'no hard-coded Stripe keys');
});

test('catalog price formatting', () => {
  assert.equal(formatOfferPrice(OFFERS['accompagnement-voyage'], 'en'), '$1');
  assert.equal(formatOfferPrice(OFFERS['accompagnement-voyage'], 'fr').replace(/\s/g, ' '), '1 $');
});
