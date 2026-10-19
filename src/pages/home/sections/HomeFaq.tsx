import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { HOME_FAQ } from '../../../data/faq';
import { Faq } from '../../../components/Faq';
import { frenchTypography } from '../../../lib/typography';

export const HomeFaq: React.FC = () => {
  const { lang, t } = useLanguage();
  const items = HOME_FAQ.map((f) => (lang === 'en' ? { q: f.qEn, a: f.aEn } : { q: frenchTypography(f.q), a: frenchTypography(f.a) }));
  return (
    <section className='section section--ruled' id='faq' aria-labelledby='faq-title'>
      <div className='container container--narrow'>
        <div className='section-head section-head--stack'>
          <p className='eyebrow'>{t('faq_kicker')}</p>
          <h2 id='faq-title' className='section-head__title'>
            {t('faq_title')}
          </h2>
          <p className='lead'>{t('faq_subtitle')}</p>
        </div>
        <Faq items={items} openFirst />
      </div>
    </section>
  );
};
