/**
 * Payments made from the member space: renewing the membership for a month
 * and buying a monthly plan. Nothing is ever charged automatically: each one
 * is a single Stripe payment for one month at the price shown that day. The
 * webhook forwards it to LevelUp, which adds the month (portal_periods) and
 * reminds the member before it ends.
 *
 * Prices never come from the browser: the membership price comes from the
 * catalog (shared/offers.js, regular price), a plan's price from LevelUp
 * (portal_subscribe_start), where the owner sets it.
 */
import { createHash } from 'node:crypto';
import { MEMBERSHIP_DAYS, formatOfferPrice } from '../../../shared/offers.js';

export const PLAN_KIND = 'portal_plan';
export const RENEWAL_KIND = 'renewal';
export const SITE = 'blackpater.com';
const BUCKET_MS = 20 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** A Checkout Session (or any Stripe object) of a monthly plan bought on this site. */
export function isPlanObject(obj) {
  return obj?.metadata?.kind === PLAN_KIND && obj?.metadata?.site === SITE;
}

export function idempotencyKey(parts, now = Date.now()) {
  const bucket = Math.floor(now / BUCKET_MS);
  return `bp-space-${createHash('sha256').update(JSON.stringify([...parts, bucket])).digest('hex').slice(0, 32)}`;
}

function base({ email, locale, origin, metadata, name, description, amount, currency, submit }) {
  return {
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: String(currency || 'usd').toLowerCase(),
          unit_amount: amount,
          product_data: { name: name.slice(0, 120), ...(description ? { description: description.slice(0, 300) } : {}) }
        }
      }
    ],
    // The member's own address, so the payment is attached to their account.
    customer_email: email,
    locale: locale === 'en' ? 'en' : 'fr',
    submit_type: 'pay',
    allow_promotion_codes: true,
    metadata,
    payment_intent_data: { description: name.slice(0, 120), metadata },
    custom_text: { submit: { message: submit } },
    success_url: `${origin}/espace-client?view=account&paid=1`,
    cancel_url: `${origin}/espace-client?view=account&paid=0`
  };
}

const NO_AUTO = (days) =>
  `Accès de ${days} jours, sans prélèvement automatique : vous serez prévenu avant la fin. / ${days} days of access, no automatic charge.`;

/** One more month of membership for a signed-in member, at the regular price. */
export function buildRenewalCheckout({ start, offer, origin }) {
  if (!UUID_RE.test(String(start?.customer_id || ''))) throw new Error('invalid_customer');
  const metadata = {
    offer_id: offer.id,
    site: SITE,
    kind: RENEWAL_KIND,
    portal_customer_id: start.customer_id,
    price: 'regular',
    months: '1'
  };
  return base({
    email: start.email,
    locale: start.locale,
    origin,
    metadata,
    name: offer.stripeName,
    description: offer.stripeDescription,
    amount: offer.amount,
    currency: offer.currency,
    submit: `${NO_AUTO(MEMBERSHIP_DAYS)} ${formatOfferPrice(offer, 'fr', offer.amount)} / mois.`
  });
}

/** One month of a monthly plan, at the price the owner set in LevelUp. */
export function buildPlanCheckout({ start, origin }) {
  const plan = start.plan;
  if (!UUID_RE.test(String(start?.customer_id || '')) || !UUID_RE.test(String(plan?.id || ''))) throw new Error('invalid_plan');
  const metadata = {
    kind: PLAN_KIND,
    site: SITE,
    portal_customer_id: start.customer_id,
    plan_id: plan.id,
    level: String(plan.level),
    plan_name: String(plan.name).slice(0, 60)
  };
  return base({
    email: start.email,
    locale: start.locale,
    origin,
    metadata,
    name: `Black Pater · ${plan.name} (1 mois)`,
    description: plan.description || '',
    amount: plan.amount,
    currency: plan.currency,
    submit: NO_AUTO(MEMBERSHIP_DAYS)
  });
}

// ---------------------------------------------------------------------------
// Monthly plans paid automatically (Stripe subscriptions): Plus, Pro, Premium.
// The plan and its price come from LevelUp (portal_subscribe_start), never from
// the browser. Every change Stripe reports goes back to LevelUp
// (portal_subscription_sync), which decides what the member can see.
// ---------------------------------------------------------------------------

export const SUBSCRIPTION_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
];

/** Stripe ids as they come in objects: a string or an expanded object. */
const idOf = (v) => (typeof v === 'string' ? v : v && typeof v.id === 'string' ? v.id : null);

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
    customer_id: sub.metadata?.portal_customer_id ?? sub.metadata?.customer_id ?? null,
    plan_id: sub.metadata?.plan_id ?? null
  };
}

const planProductName = (plan) => `Black Pater · ${plan.name}`.slice(0, 120);

/**
 * Stripe payment page of a monthly plan, charged automatically every month.
 * `couponId`: the member's credit (launch membership not used yet), taken off
 * the first month only.
 */
export function buildSubscriptionCheckout({ start, origin, couponId = null }) {
  const plan = start.plan;
  if (!UUID_RE.test(String(start?.customer_id || '')) || !UUID_RE.test(String(plan?.id || ''))) throw new Error('invalid_plan');
  const metadata = {
    kind: PLAN_KIND,
    site: SITE,
    portal_customer_id: start.customer_id,
    plan_id: plan.id,
    level: String(plan.level),
    plan_name: String(plan.name).slice(0, 60)
  };
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
            name: planProductName(plan),
            ...(plan.description ? { description: String(plan.description).slice(0, 300) } : {})
          }
        }
      }
    ],
    locale: start.locale === 'en' ? 'en' : 'fr',
    client_reference_id: start.customer_id,
    metadata,
    subscription_data: { metadata, description: planProductName(plan) },
    ...(couponId ? { discounts: [{ coupon: couponId }] } : { allow_promotion_codes: true }),
    custom_text: {
      submit: {
        message:
          'Prélèvement automatique chaque mois, annulable à tout moment depuis votre espace. / Charged automatically every month, cancel any time from your space.'
      }
    },
    success_url: `${origin}/espace-client?view=account&plan=ok&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/espace-client?view=account&plan=cancel`
  };
  if (/^cus_[A-Za-z0-9]+$/.test(String(start.provider_customer_id || ''))) params.customer = start.provider_customer_id;
  else params.customer_email = start.email;
  return params;
}

/** Moves a running subscription to another plan (Stripe prorates the difference). */
export async function switchPlan(stripe, subscriptionId, start) {
  const plan = start.plan;
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const item = sub?.items?.data?.[0];
  if (!item || !isPlanObject(sub)) return null;
  const product = await stripe.products.create(
    { name: planProductName(plan), metadata: { kind: PLAN_KIND, site: SITE, plan_id: plan.id } },
    { idempotencyKey: idempotencyKey(['product', plan.id, plan.name]) }
  );
  const metadata = { ...sub.metadata, plan_id: plan.id, level: String(plan.level), plan_name: String(plan.name).slice(0, 60) };
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
    metadata
  });
}
