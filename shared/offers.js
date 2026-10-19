/**
 * Offer catalog — the single source of truth for what can be bought and for
 * how much. The checkout endpoint only ever reads amounts from here: the
 * browser sends an offer id, never a price, so the amount cannot be changed
 * client-side. The site imports the same file to display the price.
 *
 * Amounts are in the smallest currency unit (cents).
 */
export const OFFERS = Object.freeze({
  'accompagnement-voyage': Object.freeze({
    id: 'accompagnement-voyage',
    amount: 100,
    currency: 'usd',
    path: '/abonnements/accompagnement-voyage',
    // Shown on the Stripe Checkout page and on the customer's receipt.
    stripeName: 'Black Pater — Accompagnement & Démarches Voyage',
    stripeDescription:
      'Paiement unique, sans abonnement ni renouvellement. One-time payment, no subscription or renewal.'
  })
});

export const OFFER_IDS = Object.freeze(Object.keys(OFFERS));

export function getOffer(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(OFFERS, id) ? OFFERS[id] : null;
}

/** "$1" / "1 $" style display price, from the catalog amount. */
export function formatOfferPrice(offer, lang = 'fr') {
  const value = offer.amount / 100;
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: offer.currency.toUpperCase(),
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}
