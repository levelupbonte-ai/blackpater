import Stripe from 'stripe';

let cached = null;

function readEnv(name) {
  const raw = process.env[name];
  if (typeof raw !== 'string') return '';
  // Tolerate copy/paste artefacts (surrounding quotes, whitespace, newlines).
  return raw.trim().replace(/^['"]|['"]$/g, '').trim();
}

/** Stripe client, or null when STRIPE_SECRET_KEY is not configured. */
export function getStripe() {
  const key = readEnv('STRIPE_SECRET_KEY');
  if (!key) return null;
  if (!cached || cached.key !== key) {
    cached = {
      key,
      client: new Stripe(key, {
        maxNetworkRetries: 2,
        timeout: 15000,
        appInfo: { name: 'blackpater.com' }
      })
    };
  }
  return cached.client;
}

export function getWebhookSecret() {
  return readEnv('STRIPE_WEBHOOK_SECRET');
}

/** Static webhook helpers: signature checks need no API key. */
export const stripeWebhooks = Stripe.webhooks;
export const StripeErrors = Stripe.errors;
