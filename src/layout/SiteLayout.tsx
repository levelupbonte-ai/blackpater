import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from '../app/router';
import { useRevealOnScroll } from '../lib/motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const APP_FLAG = 'bp_app';

/**
 * Opened from the home-screen icon (installed app), not in a browser tab.
 * The app starts on /espace-client?app=1 (manifest start_url): that mark is
 * kept for the visit, so the app look stays even where the browser does not
 * report its display mode.
 */
export function isInstalledApp() {
  if (typeof window === 'undefined') return false;
  const mode = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].some(
    (m) => window.matchMedia?.(`(display-mode: ${m})`).matches
  );
  if (mode || (navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  try {
    if (new URLSearchParams(window.location.search).get('app') === '1') {
      window.sessionStorage.setItem(APP_FLAG, '1');
      return true;
    }
    return window.sessionStorage.getItem(APP_FLAG) === '1';
  } catch {
    return false;
  }
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
