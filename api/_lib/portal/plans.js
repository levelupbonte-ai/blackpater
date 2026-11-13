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
