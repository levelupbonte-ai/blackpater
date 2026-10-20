import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REDIRECTS, ROUTES } from '../shared/routes.js';
import { OFFERS, formatOfferPrice } from '../shared/offers.js';
import { DEFAULT_QUESTIONS, mergeQuestionnaire } from '../shared/questionnaire.js';

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
  assert.equal(formatOfferPrice(OFFERS['accompagnement-voyage'], 'en'), '$2.60');
  assert.equal(formatOfferPrice(OFFERS['accompagnement-voyage'], 'fr').replace(/\s/g, ' '), '2,60 $');
  assert.equal(formatOfferPrice(OFFERS['accompagnement-voyage-duo'], 'en'), '$5');
  assert.equal(formatOfferPrice(OFFERS['accompagnement-voyage-duo'], 'fr').replace(/\s/g, ' '), '5 $');
  assert.equal(formatOfferPrice(OFFERS['accompagnement-voyage-famille'], 'en'), '$11');
  assert.equal(formatOfferPrice(OFFERS['accompagnement-voyage-famille'], 'fr').replace(/\s/g, ' '), '11 $');
});

test('questionnaire includes groupTier, sex and age and supports adding/removing questions from database', () => {
  const ids = DEFAULT_QUESTIONS.map((q) => q.id);
  assert.equal(ids[0], 'groupTier', 'starts with groupTier (Solo, Duo, Family)');
  assert.ok(ids.includes('sex'), 'includes sex question');
  assert.ok(ids.includes('age'), 'includes age question');
  assert.ok(ids.includes('contactInfo'), 'includes contactInfo step');

  const merged = mergeQuestionnaire(DEFAULT_QUESTIONS, [
    { id: 'concern', enabled: false },
    { id: 'custom_db_q', sort_order: 25, type: 'text', question: 'Question personnalisée|Custom question' }
  ]);
  const mergedIds = merged.map((q) => q.id);
  assert.ok(!mergedIds.includes('concern'), 'disabled question is removed');
  assert.ok(mergedIds.includes('custom_db_q'), 'database question is added');
});

