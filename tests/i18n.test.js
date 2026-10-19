import { test } from 'node:test';
import assert from 'node:assert/strict';

const files = ['common', 'home', 'articles', 'offer', 'payment'];

test('every French string has a non-empty English translation (and vice versa)', async () => {
  for (const f of files) {
    const { fr, en } = await import(`../src/i18n/${f}.ts`);
    assert.deepEqual(Object.keys(en).sort(), Object.keys(fr).sort(), `${f}: key mismatch`);
    for (const [k, v] of Object.entries({ ...fr, ...en })) assert.ok(typeof v === 'string' && v.trim(), `${f}.${k} is empty`);
  }
});

test('no non-Stripe payment wording in user-facing strings', async () => {
  for (const f of files) {
    const { fr, en } = await import(`../src/i18n/${f}.ts`);
    const all = JSON.stringify([fr, en]);
    assert.ok(!/mobile money|orange money|m-pesa|airtel|wave|mtn|cinetpay|flutterwave/i.test(all), `${f} mentions another payment method`);
  }
});
