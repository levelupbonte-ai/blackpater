import React, { useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { RouterProvider, useRouter } from './router';
import { SiteLayout } from '../layout/SiteLayout';
import { HomePage } from '../pages/home/HomePage';
import { ParcoursPage } from '../pages/parcours/ParcoursPage';
import { MediasPage } from '../pages/medias/MediasPage';
import { ContactPage } from '../pages/contact/ContactPage';
import { ArticlesPage } from '../pages/articles/ArticlesPage';
import { AbonnementsPage } from '../pages/abonnements/AbonnementsPage';
import { OfferTravelPage } from '../pages/offer-travel/OfferTravelPage';
import { ConfirmationPage } from '../pages/payment/ConfirmationPage';
import { CancelledPage } from '../pages/payment/CancelledPage';
import { TermsPage } from '../pages/legal/TermsPage';
import { RefundPage } from '../pages/legal/RefundPage';
import { PrivacyPage } from '../pages/legal/PrivacyPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';
import { NOT_FOUND, findRoute } from '../../shared/routes.js';
import { CONFIRMATION_PATH, confirmationPath, readSessionIdParam } from '../../shared/validation.js';

const PAGES: Record<string, React.ComponentType> = {
  home: HomePage,
  journey: ParcoursPage,
  medias: MediasPage,
  contact: ContactPage,
  articles: ArticlesPage,
  offers: AbonnementsPage,
  'offer-travel': OfferTravelPage,
  'payment-confirmation': ConfirmationPage,
  'payment-cancelled': CancelledPage,
  'legal-terms': TermsPage,
  'legal-refund': RefundPage,
  'legal-privacy': PrivacyPage
};

function setMetaDescription(content: string) {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', content);
}

const Routes: React.FC = () => {
  const { path, search, navigate } = useRouter();
  const { lang } = useLanguage();
  const route = findRoute(path);

  // Legacy Stripe return URLs (/abonnements?payment=...) → dedicated pages.
  useEffect(() => {
    if (path !== '/abonnements' || !search) return;
    const params = new URLSearchParams(search);
    const sid = readSessionIdParam(search);
    if (sid) navigate(confirmationPath(sid), { replace: true });
    else if (params.has('session_id')) navigate(CONFIRMATION_PATH, { replace: true });
    else if (params.get('payment') === 'cancelled') navigate('/paiement/annule', { replace: true });
  }, [path, search, navigate]);

  useEffect(() => {
    const meta = (route || NOT_FOUND).meta[lang];
    document.title = meta.title;
    setMetaDescription(meta.description);
  }, [route, lang]);

  const Page = route ? PAGES[route.id] : NotFoundPage;
  const key = route?.id || 'not-found';
  return (
    <div className='route-view' key={key}>
      <Page />
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <LanguageProvider>
      <RouterProvider>
        <SiteLayout>
          <Routes />
        </SiteLayout>
      </RouterProvider>
    </LanguageProvider>
  </ThemeProvider>
);
