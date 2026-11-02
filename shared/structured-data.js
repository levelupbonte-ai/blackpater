/**
 * JSON-LD of blackpater.com, built from the offer catalog so prices can never
 * drift from what Stripe charges. True facts only: the business is a guidance
 * and advisory service (the site says it is not a travel agency), based in
 * Salt Lake City, with the contact details published on the site.
 */
import { ECOSYSTEM_TIERS } from './offers.js';
import { SITE_URL } from './routes.js';

const SAME_AS = [
  'https://www.tiktok.com/@black_pater',
  'https://www.instagram.com/black_pater/',
  'https://www.youtube.com/@black_pater',
  'https://www.facebook.com/BlackPaterOfficiel',
  'https://twitter.com/black_pater',
  'https://www.linkedin.com/in/jean-pierre-lofumbwa-3a5585141/'
];

const OFFER_NAMES = { solo: 'Solo (1 person)', duo: 'Duo (2 people)', family: 'Family (up to 5 people)' };

export function structuredData() {
  const price = (o) => (o.amount / 100).toFixed(2);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${SITE_URL}/#business`,
        name: 'Black Pater',
        alternateName: ['blackpater', 'BlackPater'],
        description:
          'Travel, study and visa guidance by Jean-Pierre Lofumbwa (“Le Prof”), in English and French. Guidance and advisory service, not a travel agency.',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/og-image.png`,
        email: 'lofumbwapater@gmail.com',
        telephone: '+1-720-549-0926',
        address: { '@type': 'PostalAddress', addressLocality: 'Salt Lake City', addressRegion: 'UT', addressCountry: 'US' },
        founder: { '@id': `${SITE_URL}/#person` },
        knowsLanguage: ['en', 'fr'],
        sameAs: SAME_AS,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Travel & visa guidance',
          itemListElement: ECOSYSTEM_TIERS.map((o) => ({
            '@type': 'Offer',
            name: OFFER_NAMES[o.tier],
            price: price(o),
            priceCurrency: o.currency.toUpperCase(),
            url: `${SITE_URL}${o.path}`,
            availability: 'https://schema.org/InStock'
          }))
        }
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: 'Jean-Pierre Lofumbwa',
        alternateName: ['Black Pater', 'Le Prof'],
        jobTitle: 'Educator and cultural ambassador',
        homeLocation: { '@type': 'Place', name: 'Salt Lake City, Utah' },
        url: `${SITE_URL}/`,
        sameAs: SAME_AS
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Black Pater',
        url: `${SITE_URL}/`,
        inLanguage: ['en', 'fr'],
        publisher: { '@id': `${SITE_URL}/#business` }
      }
    ]
  };
}

/** The <script> tag, with "<" escaped so the JSON can never close the tag. */
export function structuredDataTag() {
  return `<script type="application/ld+json">${JSON.stringify(structuredData()).replace(/</g, '\\u003c')}</script>`;
}
