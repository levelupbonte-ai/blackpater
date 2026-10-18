import React, { Suspense, lazy, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { RouterProvider, useRouter } from './router';
import { SiteLayout } from '../layout/SiteLayout';
import { HomePage } from '../pages/home/HomePage';
import { NOT_FOUND, findRoute } from '../../shared/routes.js';

// One folder per page; everything but the home page is loaded on demand.
const PAGES: Record<string, React.ComponentType> = {
  home: HomePage,
  articles: lazy(() => import('../pages/articles/ArticlesPage')),
  offers: lazy(() => import('../pages/abonnements/AbonnementsPage')),
  'offer-travel': lazy(() => import('../pages/offer-travel/OfferTravelPage')),
  'payment-confirmation': lazy(() => import('../pages/payment/ConfirmationPage')),
  'payment-cancelled': lazy(() => import('../pages/payment/CancelledPage')),
  'legal-terms': lazy(() => import('../pages/legal/TermsPage')),
  'legal-refund': lazy(() => import('../pages/legal/RefundPage')),
  'legal-privacy': lazy(() => import('../pages/legal/PrivacyPage'))
};
const NotFoundPage = lazy(() => import('../pages/not-found/NotFoundPage'));

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
    const sid = params.get('session_id');
    if (sid) navigate(`/paiement/confirmation?session_id=${encodeURIComponent(sid)}`, { replace: true });
    else if (params.get('payment') === 'cancelled') navigate('/paiement/annule', { replace: true });
  }, [path, search, navigate]);

  useEffect(() => {
    const meta = (route || NOT_FOUND).meta[lang];
    document.title = meta.title;
    setMetaDescription(meta.description);
  }, [route, lang]);

  const Page = route ? PAGES[route.id] : NotFoundPage;
  return (
    <Suspense fallback={<div className='route-loading' aria-busy='true' />}>
      <Page key={route?.id || 'not-found'} />
    </Suspense>
  );
};

export const App: React.FC = () => (
  <LanguageProvider>
    <RouterProvider>
      <SiteLayout>
        <Routes />
      </SiteLayout>
    </RouterProvider>
  </LanguageProvider>
);
