import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AmbientBackground } from '../components/AmbientBackground';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  return (
    <>
      <a className='skip-link' href='#main'>
        {t('skip_to_content')}
      </a>
      <AmbientBackground />
      <Navbar />
      <main id='main' tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
};
