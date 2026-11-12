import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dossierText, readableDossier } from '../shared/dossier.js';

const dossier = {
  destinationCountry: 'CA',
  tier: 'duo',
  fullName: 'Amani Kabila',
  sex: 'female',
  age: 22,
  email: 'amani@example.com',
  phone: '+243 81 000 0000',
  partner: { fullName: 'Joel K', sex: 'male', age: 24 },
  answers: { groupTier: 'duo', purpose: 'study', sLevel: 'mast', nationality: 'CD', topics: ['docs', 'visa'], tdur: 'm3p' }
};

test('dossier in words: questions and labels, in both languages', () => {
  const fr = readableDossier(dossier, 'fr', { contact: true });
  assert.ok(fr.header.some((h) => h.label === 'Destination' && h.value === 'Canada'));
  assert.ok(fr.header.some((h) => h.label === 'E-mail' && h.value === 'amani@example.com'));
  const rows = fr.sections.flatMap((s) => s.rows);
  assert.ok(rows.some((r) => r.a === 'Études'));
  assert.ok(rows.some((r) => r.a === 'Master'));
  assert.ok(rows.some((r) => /Comprendre le pays/.test(r.a)));
  // tdur only applies to short trips: hidden for a study project.
  assert.ok(!rows.some((r) => r.a === 'Plus de 3 mois'));
  const en = dossierText(dossier, 'en');
  assert.match(en, /Plan: Duo/);
  assert.match(en, /Second person: Joel K · Male · 24 years old/);
});

test('the AI text never carries e-mail or phone', () => {
  const text = dossierText(dossier, 'fr');
  assert.doesNotMatch(text, /amani@example\.com|081|\+243/);
});

test('no dossier, nothing to show', () => {
  assert.equal(readableDossier(null, 'fr'), null);
  assert.equal(readableDossier([], 'fr'), null);
  assert.equal(dossierText({}, 'fr'), '');
});
