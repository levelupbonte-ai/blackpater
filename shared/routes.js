/**
 * Site map shared by the React router (client), the build step that writes one
 * HTML file per route (SEO titles, canonical URLs), the local Express server
 * and the Vercel config test. Add a page here first.
 */
export const SITE_URL = 'https://blackpater.com';

/** @typedef {{ title: string, description: string }} RouteMeta */

/**
 * @type {Array<{
 *   id: string,
 *   path: string,
 *   file: string,
 *   indexable: boolean,
 *   meta: { fr: RouteMeta, en: RouteMeta }
 * }>}
 */
export const ROUTES = [
  {
    id: 'home',
    path: '/',
    file: 'index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Black Pater (blackpater) — Jean-Pierre Lofumbwa · Le Prof | Site Officiel & Presse (VoyageUtah, CCIS, Komelate)',
        description:
          "Site officiel de Black Pater (blackpater / Jean-Pierre Lofumbwa · « Le Prof »). Éducateur congolais, ambassadeur culturel en Utah & créateur de contenu. Publications VoyageUtah, Connected CCIS & Komelate."
      },
      en: {
        title: 'Black Pater (blackpater) — Jean-Pierre Lofumbwa · “Le Prof” | Official Website & Press',
        description:
          'Official website of Black Pater (Jean-Pierre Lofumbwa, “Le Prof”): Congolese Cultural Ambassador, educator and content creator in Salt Lake City, Utah.'
      }
    }
  },
  {
    id: 'journey',
    path: '/parcours',
    file: 'parcours/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Parcours, Culture & Distinctions — Black Pater (Jean-Pierre Lofumbwa)',
        description:
          'Découvrez le parcours de Jean-Pierre Lofumbwa (Black Pater) : lauréat national en RDC, enseignement multilingue (anglais, français, espagnol, lingala), danse Banafro et rayonnement culturel à Salt Lake City, Utah.'
      },
      en: {
        title: 'Journey, Culture & Honors — Black Pater (Jean-Pierre Lofumbwa)',
        description:
          'Explore the journey of Jean-Pierre Lofumbwa (Black Pater): DRC national laureate, multilingual educator (English, French, Spanish, Lingala), Banafro dance and cultural ambassador in Salt Lake City, Utah.'
      }
    }
  },
  {
    id: 'medias',
    path: '/medias',
    file: 'medias/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Médias & Réseaux Officiels — Black Pater (Jean-Pierre Lofumbwa)',
        description:
          'Retrouvez tous les réseaux officiels et l’écosystème digital de Black Pater (Jean-Pierre Lofumbwa) : TikTok, Instagram, YouTube, Facebook, X et LinkedIn.'
      },
      en: {
        title: 'Official Media & Channels — Black Pater (Jean-Pierre Lofumbwa)',
        description:
          'Connect with Black Pater (Jean-Pierre Lofumbwa) across all official channels: TikTok, Instagram, YouTube, Facebook, X and LinkedIn.'
      }
    }
  },
  {
    id: 'contact',
    path: '/contact',
    file: 'contact/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Contact & Réservations — Black Pater (Jean-Pierre Lofumbwa)',
        description:
          'Contactez directement Jean-Pierre Lofumbwa (Black Pater) pour des conférences, masterclass culturelles, collaborations médias ou un accompagnement.'
      },
      en: {
        title: 'Contact & Bookings — Black Pater (Jean-Pierre Lofumbwa)',
        description:
          'Get in touch directly with Jean-Pierre Lofumbwa (Black Pater) for talks, cultural masterclasses, media collaborations or personal guidance.'
      }
    }
  },
  {
    id: 'articles',
    path: '/articles',
    file: 'articles/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Articles & revue de presse — Black Pater (Jean-Pierre Lofumbwa)',
        description:
          "Revue de presse de Black Pater (Jean-Pierre Lofumbwa) : VoyageUtah, Columbia College (Dean's List), Substack, Komelate et CollegeSidekick."
      },
      en: {
        title: 'Articles & press — Black Pater (Jean-Pierre Lofumbwa)',
        description:
          "Press coverage of Black Pater (Jean-Pierre Lofumbwa): VoyageUtah, Columbia College (Dean's List), Substack, Komelate and CollegeSidekick."
      }
    }
  },
  {
    id: 'offers',
    path: '/abonnements',
    file: 'abonnements/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Accompagnement — Offres de Black Pater (Jean-Pierre Lofumbwa)',
        description:
          "L'accompagnement de Jean-Pierre Lofumbwa (Black Pater) pour préparer vos démarches de voyage, bourses, études et visas. Paiement unique."
      },
      en: {
        title: 'Guidance — Offers by Black Pater (Jean-Pierre Lofumbwa)',
        description:
          'Guidance from Jean-Pierre Lofumbwa (Black Pater) to prepare your travel, scholarship, study and visa procedures. One-time payment.'
      }
    }
  },
  {
    id: 'offer-travel',
    path: '/abonnements/accompagnement-voyage',
    file: 'abonnements/accompagnement-voyage/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Accompagnement & Démarches Voyage — 2,60 $ | Black Pater',
        description:
          'Informations vérifiées, orientation et accompagnement personnalisé pour vos démarches de voyage, bourses, études et visas. 2,60 $, paiement unique, sans renouvellement.'
      },
      en: {
        title: 'Travel & Visa Guidance — $2.60 | Black Pater',
        description:
          'Verified information, orientation and personalised guidance for your travel, scholarship, study and visa procedures. $2.60 one-time payment, no renewal.'
      }
    }
  },
  {
    id: 'payment-confirmation',
    path: '/paiement/confirmation',
    file: 'paiement/confirmation/index.html',
    indexable: false,
    meta: {
      fr: { title: 'Confirmation de paiement — Black Pater', description: 'Confirmation de votre paiement.' },
      en: { title: 'Payment confirmation — Black Pater', description: 'Your payment confirmation.' }
    }
  },
  {
    id: 'payment-cancelled',
    path: '/paiement/annule',
    file: 'paiement/annule/index.html',
    indexable: false,
    meta: {
      fr: { title: 'Paiement annulé — Black Pater', description: "Votre paiement a été annulé. Aucun montant n'a été débité." },
      en: { title: 'Payment cancelled — Black Pater', description: 'Your payment was cancelled. You have not been charged.' }
    }
  },
  {
    id: 'legal-terms',
    path: '/legal/conditions-de-vente',
    file: 'legal/conditions-de-vente/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Conditions de vente — Black Pater',
        description: "Conditions de vente de l'offre d'accompagnement proposée par Jean-Pierre Lofumbwa (Black Pater)."
      },
      en: {
        title: 'Terms of sale — Black Pater',
        description: 'Terms of sale for the guidance offer provided by Jean-Pierre Lofumbwa (Black Pater).'
      }
    }
  },
  {
    id: 'legal-refund',
    path: '/legal/remboursement',
    file: 'legal/remboursement/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Politique de remboursement — Black Pater',
        description: "Conditions d'annulation et de remboursement de l'offre d'accompagnement Black Pater."
      },
      en: {
        title: 'Refund policy — Black Pater',
        description: 'Cancellation and refund conditions for the Black Pater guidance offer.'
      }
    }
  },
  {
    id: 'legal-privacy',
    path: '/legal/confidentialite',
    file: 'legal/confidentialite/index.html',
    indexable: true,
    meta: {
      fr: {
        title: 'Politique de confidentialité — Black Pater',
        description: 'Quelles données sont traitées sur blackpater.com, par qui, et comment exercer vos droits.'
      },
      en: {
        title: 'Privacy policy — Black Pater',
        description: 'What data blackpater.com processes, by whom, and how to exercise your rights.'
      }
    }
  }
];

export const NOT_FOUND = {
  id: 'not-found',
  file: '404.html',
  meta: {
    fr: { title: '404 — Page introuvable | Black Pater', description: "Cette page n'existe pas ou a été déplacée." },
    en: { title: '404 — Page not found | Black Pater', description: 'This page does not exist or has moved.' }
  }
};

/** Permanent (301) redirects from legacy URLs. */
export const REDIRECTS = [
  { source: '/index.html', destination: '/' },
  { source: '/abonnements.html', destination: '/abonnements' },
  { source: '/articles.html', destination: '/articles' },
  { source: '/biographie', destination: '/parcours' },
  { source: '/biographie.html', destination: '/parcours' },
  { source: '/parcours.html', destination: '/parcours' },
  { source: '/medias.html', destination: '/medias' },
  { source: '/contact.html', destination: '/contact' },
  { source: '/legal', destination: '/legal/conditions-de-vente' },
  { source: '/cgv', destination: '/legal/conditions-de-vente' }
];

export function normalizePath(pathname) {
  const p = (pathname || '/').replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export function findRoute(pathname) {
  const p = normalizePath(pathname);
  return ROUTES.find((r) => r.path === p) || null;
}
