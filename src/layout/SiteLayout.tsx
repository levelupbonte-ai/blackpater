import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from '../app/router';
import { useRevealOnScroll } from '../lib/motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/** Opened from the home-screen icon (installed app), not in a browser tab. */
function isInstalledApp() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const { path } = useRouter();

  useRevealOnScroll(path);
  // The installed app is the member space only: no site menu, no footer.
  const app = isInstalledApp() && path.startsWith('/espace-client');
  React.useEffect(() => {
    document.documentElement.classList.toggle('is-app', app);
  }, [app]);

  return (
    <>
      <button
        type='button'
        className='skip-link'
        onClick={() => {
          document.getElementById('main')?.focus();
        }}
      >
        {t('skip_to_content')}
      </button>
      {!app && <Navbar />}
      <main id='main' tabIndex={-1}>
        {children}
      </main>
      {!app && <Footer />}
    </>
  );
};
