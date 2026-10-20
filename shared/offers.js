/**
 * Offer catalog — the single source of truth for what can be bought and for
 * how much. The checkout endpoint only ever reads amounts from here: the
 * browser sends an offer id, never a price, so the amount cannot be changed
 * client-side. The site imports the same file to display the price.
 *
 * Amounts are in the smallest currency unit (cents).
 */
export const OFFERS = Object.freeze({
  'accompagnement-voyage-test': Object.freeze({
    id: 'accompagnement-voyage-test',
    tier: 'test',
    persons: 1,
    amount: 1,
    currency: 'usd',
    path: '/abonnements/accompagnement-voyage',
    stripeName: 'Black Pater — Test Paiement Stripe (0,01 $)',
    stripeDescription: 'Test de validation du flux de paiement Stripe (1 centime / $0.01).'
  }),
  'accompagnement-voyage': Object.freeze({
    id: 'accompagnement-voyage',
    tier: 'solo',
    persons: 1,
    amount: 260,
    currency: 'usd',
    path: '/abonnements/accompagnement-voyage',
    // Shown on the Stripe Checkout page and on the customer's receipt.
    stripeName: 'Black Pater — Intégration Écosystème (Solo · 1 personne)',
    stripeDescription:
      'Enregistrement officiel du dossier (1 personne) et intégration dans l’écosystème Black Pater (accès aux forfaits mensuels Pro & Premium).'
  }),
  'accompagnement-voyage-duo': Object.freeze({
    id: 'accompagnement-voyage-duo',
    tier: 'duo',
    persons: 2,
    amount: 500,
    currency: 'usd',
    path: '/abonnements/accompagnement-voyage',
    // Shown on the Stripe Checkout page and on the customer's receipt.
    stripeName: 'Black Pater — Intégration Écosystème (Duo · 2 personnes)',
    stripeDescription:
      'Enregistrement officiel du dossier Duo (2 personnes) et intégration dans l’écosystème Black Pater (accès aux forfaits mensuels Pro & Premium).'
  }),
  'accompagnement-voyage-famille': Object.freeze({
    id: 'accompagnement-voyage-famille',
    tier: 'family',
    persons: 5,
    amount: 1100,
    currency: 'usd',
    path: '/abonnements/accompagnement-voyage',
    // Shown on the Stripe Checkout page and on the customer's receipt.
    stripeName: 'Black Pater — Intégration Écosystème (Famille · jusqu’à 5 personnes)',
    stripeDescription:
      'Enregistrement officiel du dossier Famille (jusqu’à 5 personnes) et intégration dans l’écosystème Black Pater (accès aux forfaits mensuels Pro & Premium).'
  })
});

export const OFFER_IDS = Object.freeze(Object.keys(OFFERS));

export const ECOSYSTEM_TIERS = Object.freeze([
  OFFERS['accompagnement-voyage-test'],
  OFFERS['accompagnement-voyage'],
  OFFERS['accompagnement-voyage-duo'],
  OFFERS['accompagnement-voyage-famille']
]);

export function getOffer(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(OFFERS, id) ? OFFERS[id] : null;
}

export function getOfferByTier(tier) {
  if (tier === 'test') return OFFERS['accompagnement-voyage-test'];
  if (tier === 'duo') return OFFERS['accompagnement-voyage-duo'];
  if (tier === 'family') return OFFERS['accompagnement-voyage-famille'];
  return OFFERS['accompagnement-voyage'];
}

/** "$2.60" / "2,60 $" style display price, from the catalog amount. */
export function formatOfferPrice(offer, lang = 'fr') {
  const value = offer.amount / 100;
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: offer.currency.toUpperCase(),
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
}

