import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { structuredData, structuredDataTag } from '../shared/structured-data.js';
import { ECOSYSTEM_TIERS } from '../shared/offers.js';
import { ROUTES } from '../shared/routes.js';
import { renderRouteHtml } from '../scripts/vite-plugins.js';

const template = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('JSON-LD prices come from the offer catalog, and the business type is true', () => {
  const graph = structuredData()['@graph'];
  const biz = graph.find((n) => n['@type'] === 'ProfessionalService');
  assert.ok(biz, 'guidance service, not a travel agency');
  assert.ok(!graph.some((n) => n['@type'] === 'TravelAgency' || n['@type'] === 'WebApplication'));
  const prices = biz.hasOfferCatalog.itemListElement.map((o) => o.price);
  assert.deepEqual(prices, ECOSYSTEM_TIERS.map((o) => (o.amount / 100).toFixed(2)));
  assert.ok(!JSON.stringify(graph).match(/aggregateRating|review/i), 'no ratings or reviews');
  assert.ok(!structuredDataTag().slice(35, -9).includes('<'));
});

test('index.html: French head, canonical, no English-only hreflang, JSON-LD placeholder', () => {
  assert.match(template, /<html lang="fr"/);
  assert.match(template, /<link rel="canonical" href="https:\/\/blackpater\.com\/">/);
  assert.ok(!/hreflang="en"/.test(template));
  assert.ok(template.includes('<!--structured-data-->'));
  assert.ok(!/noindex/.test(template));
});

test('prerendered pages carry real content, a French title and their own canonical', () => {
  const route = ROUTES.find((r) => r.id === 'offers');
  const html = renderRouteHtml(template, route, '<main><h1>Plans</h1></main>');
  assert.match(html, /<div id="root" data-ssr><main><h1>Plans<\/h1><\/main><\/div>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/blackpater\.com\/abonnements">/);
  assert.ok(html.includes(`<title>${route.meta.fr.title.replace(/&/g, '&amp;')}</title>`));
  const portal = renderRouteHtml(template, ROUTES.find((r) => r.id === 'portal'));
  assert.match(portal, /<meta name="robots" content="noindex, follow">/);
  assert.ok(!portal.includes('data-ssr'));
});

test('robots.txt allows the site, keeps the API out and points to the sitemap', () => {
  const robots = fs.readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Sitemap: https:\/\/blackpater\.com\/sitemap\.xml/);
  assert.ok(!/Disallow: \/\s*$/m.test(robots));
});

test('every public page has its own English title and description', () => {
  const titles = new Set();
  for (const r of ROUTES) {
    assert.ok(r.meta.en.title && r.meta.en.description, r.id);
    assert.ok(!titles.has(r.meta.en.title), `duplicate title ${r.id}`);
    titles.add(r.meta.en.title);
  }
});

test('prices with "$" survive the HTML rewrite (no regex group references)', () => {
  const route = ROUTES.find((r) => r.id === 'offer-travel');
  const html = renderRouteHtml(template, route, '<p>$2.60 / $5 / $11</p>');
  assert.ok(html.includes('<p>$2.60 / $5 / $11</p>'));
  assert.ok(html.includes(`<meta property="og:title" content="${route.meta.fr.title.replace(/&/g, '&amp;')}">`));
  assert.ok(!html.includes('<script1'));
});
