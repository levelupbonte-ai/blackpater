/**
 * Monthly plans of the member space, paid with Stripe subscriptions.
 *
 * Joining (the one-time offers) makes someone a member; the information itself
 * comes with a monthly plan the owner sets in his LevelUp dashboard (name,
 * price, what it includes). Prices are never taken from the browser: the
 * server asks LevelUp for the plan (portal_subscribe_start) and builds the
 * Stripe payment page from it. Every state change Stripe reports goes back to
 * LevelUp (portal_subscription_sync), which decides what the member can see.
 */
import { createHash } from 'node:crypto';

export const PLAN_KIND = 'portal_plan';
export const SITE = 'blackpater.com';
const BUCKET_MS = 20 * 60 * 1000;

export const SUBSCRIPTION_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
];

/** Stripe ids as they come in objects: a string or an expanded object. */
const idOf = (v) => (typeof v === 'string' ? v : v && typeof v.id === 'string' ? v.id : null);

export function isPlanObject(obj) {
  return obj?.metadata?.kind === PLAN_KIND && obj?.metadata?.site === SITE;
}

/** What LevelUp needs to know about one Stripe subscription. */
export function subscriptionPayload(sub) {
  const item = sub?.items?.data?.[0];
  // Newer Stripe API versions keep the period on the item.
  const end = item?.current_period_end ?? sub?.current_period_end ?? null;
  return {
    subscription_id: sub.id,
    status: sub.status,
    current_period_end: Number.isInteger(end) ? end : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    provider_customer_id: idOf(sub.customer),
    customer_id: sub.metadata?.customer_id ?? null,
    plan_id: sub.metadata?.plan_id ?? null
  };
}

function productName(plan) {
  return `Black Pater · ${plan.name}`.slice(0, 120);
}

export function buildPlanCheckout({ start, origin }) {
  const plan = start.plan;
  const meta = { kind: PLAN_KIND, site: SITE, customer_id: start.customer_id, plan_id: plan.id, level: String(plan.level) };
  const params = {
    mode: 'subscription',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: String(plan.currency || 'usd').toLowerCase(),
          unit_amount: plan.amount,
          recurring: { interval: 'month' },
          product_data: {
            name: productName(plan),
            ...(plan.description ? { description: String(plan.description).slice(0, 300) } : {})
          }
        }
      }
    ],
    locale: start.locale === 'fr' ? 'fr' : 'en',
    client_reference_id: start.customer_id,
    metadata: meta,
    subscription_data: { metadata: meta, description: productName(plan) },
    success_url: `${origin}/espace-client?plan=ok&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/espace-client?plan=cancel`
  };
  if (/^cus_[A-Za-z0-9]+$/.test(String(start.provider_customer_id || ''))) params.customer = start.provider_customer_id;
  else params.customer_email = start.email;
  return params;
}

export function idempotencyKey(parts, now = Date.now()) {
  const bucket = Math.floor(now / BUCKET_MS);
  return `bp-plan-${createHash('sha256').update(JSON.stringify([...parts, bucket])).digest('hex').slice(0, 32)}`;
}

/** Moves an existing subscription to another plan (prorated by Stripe). */
export async function switchPlan(stripe, subscriptionId, start) {
  const plan = start.plan;
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const item = sub?.items?.data?.[0];
  if (!item || !isPlanObject(sub)) return null;
  const product = await stripe.products.create(
    { name: productName(plan), metadata: { kind: PLAN_KIND, site: SITE, plan_id: plan.id } },
    { idempotencyKey: idempotencyKey(['product', plan.id, plan.name]) }
  );
  const meta = { ...sub.metadata, plan_id: plan.id, level: String(plan.level) };
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: item.id,
        price_data: {
          currency: String(plan.currency || 'usd').toLowerCase(),
          unit_amount: plan.amount,
          recurring: { interval: 'month' },
          product: product.id
        }
      }
    ],
    cancel_at_period_end: false,
    proration_behavior: 'create_prorations',
    metadata: meta
  });
}
