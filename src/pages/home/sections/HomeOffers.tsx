import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { OfferTiers } from '../../../components/OfferTiers';

export const HomeOffers: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className='section lux-section tiers' aria-labelledby='home-offers-title'>
      <div className='container'>
        <div className='lux-head'>
          <p className='lux-eyebrow'>
            <span className='lux-eyebrow__dot' aria-hidden='true' />
            {t('hm_offers_kicker')}
          </p>
          <h2 id='home-offers-title' className='lux-title'>
            {t('hm_offers_title')}
          </h2>
          <p className='lux-lead'>{t('hm_offers_lead')}</p>
        </div>
        <OfferTiers />
      </div>
    </section>
  );
};
