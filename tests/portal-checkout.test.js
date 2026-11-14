import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMemberCheckout } from '../api/_lib/portal/handler.js';

const quiet = { error() {} };
const params = { mode: 'payment', custom_text: { submit: { message: 'x' } }, line_items: [] };

test('member checkout: same Stripe settings as the signup (managed payments off)', async () => {
  const calls = [];
  const stripe = { checkout: { sessions: { create: async (p, o) => (calls.push({ p, o }), { url: 'https://checkout.stripe.com/c/pay/x' }) } } };
  const s = await createMemberCheckout(stripe, params, 'k1', quiet);
  assert.equal(s.url, 'https://checkout.stripe.com/c/pay/x');
  assert.deepEqual(calls[0].p.managed_payments, { enabled: false });
  assert.equal(calls[0].o.idempotencyKey, 'k1');
});

test('member checkout: Stripe refuses managed payments or custom text → same session without them', async () => {
  const calls = [];
  const stripe = {
    checkout: {
      sessions: {
        create: async (p, o) => {
          calls.push({ p, o });
          if (calls.length === 1) throw Object.assign(new Error('Received unknown parameter: managed_payments'), { type: 'StripeInvalidRequestError', param: 'managed_payments' });
          return { url: 'https://checkout.stripe.com/c/pay/y' };
        }
      }
    }
  };
  const s = await createMemberCheckout(stripe, params, 'k2', quiet);
  assert.equal(s.url, 'https://checkout.stripe.com/c/pay/y');
  assert.equal(calls[1].p.managed_payments, undefined);
  assert.equal(calls[1].p.custom_text, undefined);
  assert.equal(calls[1].o.idempotencyKey, 'k2-std');
});

test('member checkout: other Stripe errors are not retried and are logged', async () => {
  const logs = [];
  const stripe = { checkout: { sessions: { create: async () => { throw Object.assign(new Error('Invalid API Key provided'), { type: 'StripeAuthenticationError' }); } } } };
  await assert.rejects(createMemberCheckout(stripe, params, 'k3', { error: (l) => logs.push(l) }), /Invalid API Key/);
  assert.match(logs[0], /portal.stripe_refused/);
});
