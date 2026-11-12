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
 * Until LAUNCH_ENDS_AT the first month is at the launch price (launchAmount);
 * afterwards every month is at the regular price (amount). The server decides
 * which price applies (priceFor), never the browser.
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

/** The price that applies to a first month bought now: { amount, regular, launch }. */
export function priceFor(offer, now = Date.now()) {
  const launch = isLaunch(now) && Number.isInteger(offer.launchAmount);
  return { amount: launch ? offer.launchAmount : offer.amount, regular: offer.amount, launch };
}

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

