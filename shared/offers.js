/**
 * Offer catalog — the single source of truth for what can be bought and for
 * how much. The checkout endpoint only ever reads amounts from here: the
 * browser sends an offer id, never a price, so the amount cannot be changed
 * client-side. The site imports the same file to display the price.
 *
 * Amounts are in the smallest currency unit (cents).
 *
 * Membership is paid month by month, with no automatic charge: each payment
 * gives one month of access and the member renews from the client space.
 *
 * Founding members: whoever joins before LAUNCH_ENDS_AT pays the launch price
 * (launchAmount) for the first month, then the founder price (amount) for as
 * long as they stay, and gets the features of a plan (founderLevel: Solo ->
 * Plus, Duo -> Pro, Famille -> Premium) with a founding member badge. After
 * the countdown, new members pay the public price (publicAmount). LevelUp
 * records who is a founder; the server decides which price applies, never
 * the browser.
 */

/** End of the launch offer: Sunday 16 November 2026, 23:59:59 in Salt Lake City (MST, UTC-7). */
export const LAUNCH_ENDS_AT = '2026-11-17T06:59:59Z';
export const LAUNCH_ENDS_MS = Date.parse(LAUNCH_ENDS_AT);

/** Membership access bought by one payment. */
export const MEMBERSHIP_DAYS = 30;
export const OFFERS = Object.freeze({
  'accompagnement-voyage': Object.freeze({
    id: 'accompagnement-voyage',
    tier: 'solo',
    persons: 1,
    amount: 500,
    launchAmount: 260,
    publicAmount: 1100,
    founderLevel: 1,
    currency: 'usd',
    path: '/abonnements/accompagnement-voyage',
    // Shown on the Stripe Checkout page and on the customer's receipt.
    stripeName: 'Black Pater — Adhésion Solo · 1 personne (1 mois)',
    stripeDescription:
      'Un mois d’adhésion (1 personne) : dossier enregistré, espace membre et messagerie avec Black Pater. Sans prélèvement automatique.'
  }),
  'accompagnement-voyage-duo': Object.freeze({
    id: 'accompagnement-voyage-duo',
    tier: 'duo',
    persons: 2,
    amount: 900,
    launchAmount: 500,
    publicAmount: 1600,
    founderLevel: 2,
    currency: 'usd',
    path: '/abonnements/accompagnement-voyage',
    // Shown on the Stripe Checkout page and on the customer's receipt.
    stripeName: 'Black Pater — Adhésion Duo · 2 personnes (1 mois)',
    stripeDescription:
      'Un mois d’adhésion Duo (2 personnes) : dossier enregistré, espace membre et messagerie avec Black Pater. Sans prélèvement automatique.'
  }),
  'accompagnement-voyage-famille': Object.freeze({
    id: 'accompagnement-voyage-famille',
    tier: 'family',
    persons: 5,
    amount: 1600,
    launchAmount: 1100,
    publicAmount: 2300,
    founderLevel: 3,
    currency: 'usd',
    path: '/abonnements/accompagnement-voyage',
    // Shown on the Stripe Checkout page and on the customer's receipt.
    stripeName: 'Black Pater — Adhésion Famille · jusqu’à 5 personnes (1 mois)',
    stripeDescription:
      'Un mois d’adhésion Famille (jusqu’à 5 personnes) : dossier enregistré, espace membre et messagerie avec Black Pater. Sans prélèvement automatique.'
  })
});

export const OFFER_IDS = Object.freeze(Object.keys(OFFERS));

export const ECOSYSTEM_TIERS = Object.freeze([
  OFFERS['accompagnement-voyage'],
  OFFERS['accompagnement-voyage-duo'],
  OFFERS['accompagnement-voyage-famille']
]);

export function getOffer(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(OFFERS, id) ? OFFERS[id] : null;
}

export function getOfferByTier(tier) {
  if (tier === 'duo') return OFFERS['accompagnement-voyage-duo'];
  if (tier === 'family') return OFFERS['accompagnement-voyage-famille'];
  return OFFERS['accompagnement-voyage'];
}

/** True while the launch offer runs. */
export function isLaunch(now = Date.now()) {
  return now < LAUNCH_ENDS_MS;
}

/**
 * The price that applies to a first month bought now:
 * { amount, regular (public price), founder (founder monthly price), launch }.
 */
export function priceFor(offer, now = Date.now()) {
  const launch = isLaunch(now) && Number.isInteger(offer.launchAmount);
  const regular = Number.isInteger(offer.publicAmount) ? offer.publicAmount : offer.amount;
  return { amount: launch ? offer.launchAmount : regular, regular, founder: offer.amount, launch };
}

/** Monthly price of a renewal: the founder price for founding members, else the public price. */
export function renewalAmount(offer, isFounder) {
  return isFounder || !Number.isInteger(offer.publicAmount) ? offer.amount : offer.publicAmount;
}

/** Plan whose features a founding member of this formula gets (1 Plus, 2 Pro, 3 Premium). */
export const FOUNDER_PLAN_NAMES = Object.freeze({ 1: 'Plus', 2: 'Pro', 3: 'Premium' });

/** "$2.60" / "2,60 $" style display price; the price that applies now unless an amount is given. */
export function formatOfferPrice(offer, lang = 'fr', amount = priceFor(offer).amount) {
  const value = amount / 100;
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: offer.currency.toUpperCase(),
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
}

