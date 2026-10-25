import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from '../app/router';
import { useRevealOnScroll } from '../lib/motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const { path } = useRouter();

  useRevealOnScroll(path);

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
      <Navbar />
      <main id='main' tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
};
