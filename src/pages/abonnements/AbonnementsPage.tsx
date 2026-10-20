import React, { useState } from 'react';
import './abonnements.css';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import { OFFERS, formatOfferPrice, getOfferByTier } from '../../../shared/offers.js';

type TierKey = 'solo' | 'duo' | 'family';

export const AbonnementsPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<TierKey>(() => {
    try {
      const saved = window.localStorage.getItem('pg:preselected_tier');
      if (saved === 'solo' || saved === 'duo' || saved === 'family') return saved;
    } catch {
      /* ignore */
    }
    return 'solo';
  });

  const activeOffer = getOfferByTier(selectedTier);
  const price = formatOfferPrice(activeOffer, lang);

  const handleSelectTier = (tier: TierKey) => {
    setSelectedTier(tier);
    try {
      window.localStorage.setItem('pg:preselected_tier', tier);
    } catch {
      /* ignore */
    }
  };

  const tiers: Array<{
    key: TierKey;
    title: string;
    sub: string;
    price: string;
  }> = [
    {
      key: 'solo',
      title: t('offers_tier_solo_title'),
      sub: t('offers_tier_solo_sub'),
      price: formatOfferPrice(OFFERS['accompagnement-voyage'], lang)
    },
    {
      key: 'duo',
      title: t('offers_tier_duo_title'),
      sub: t('offers_tier_duo_sub'),
      price: formatOfferPrice(OFFERS['accompagnement-voyage-duo'], lang)
    },
    {
      key: 'family',
      title: t('offers_tier_family_title'),
      sub: t('offers_tier_family_sub'),
      price: formatOfferPrice(OFFERS['accompagnement-voyage-famille'], lang)
    }
  ];

  return (
    <div className='page'>
      <PageHeader
        crumbs={[{ label: t('nav_home'), to: '/' }, { label: t('nav_offers') }]}
        eyebrow={t('offers_kicker')}
        title={t('offers_title')}
        lead={t('offers_lead')}
      />

      <section className='section' aria-label={t('offers_list_label')}>
        <div className='container'>
          <article className='offer-card'>
            <div className='offer-card__media'>
              <img src='/media/db4bf6a012c1.webp' alt='' width={560} height={700} loading='lazy' decoding='async' />
            </div>
            <div className='offer-card__body'>
              <p className='eyebrow'>{t('offers_card_tag')}</p>
              <h2 className='offer-card__title'>
                <Link to={activeOffer.path} onClick={() => handleSelectTier(selectedTier)}>
                  {t('offer_name')}
                </Link>
              </h2>
              <p className='offer-card__desc'>{t('offers_card_desc')}</p>
              <ul className='offer-card__points'>
                {(['offers_card_point_1', 'offers_card_point_2', 'offers_card_point_3'] as const).map((k) => (
                  <li key={k}>
                    <Icon name='check' />
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>

              <div className='offer-card__tiers' role='radiogroup' aria-label={t('offers_tier_label')}>
                <p className='offer-card__tiers-label'>{t('offers_tier_label')}</p>
                <div className='offer-card__tiers-grid'>
                  {tiers.map((item) => {
                    const isActive = selectedTier === item.key;
                    return (
                      <button
                        key={item.key}
                        type='button'
                        role='radio'
                        aria-checked={isActive}
                        className={`offer-tier-btn ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleSelectTier(item.key)}
                      >
                        <span className='offer-tier-btn__top'>
                          <span className='offer-tier-btn__title'>{item.title}</span>
                          <span className='offer-tier-btn__price'>{item.price}</span>
                        </span>
                        <span className='offer-tier-btn__sub'>{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
                <p className='offer-card__ecosystem-note'>
                  <Icon name='info' />
                  <span>{t('offers_ecosystem_badge')}</span>
                </p>
              </div>

              <div className='offer-card__foot'>
                <Link
                  to={activeOffer.path}
                  onClick={() => handleSelectTier(selectedTier)}
                  className='offer-card__price'
                  aria-label={`${price} — ${t('offers_card_cta')}`}
                >
                  <span className='offer-card__amount'>{price}</span>
                  <span className='offer-card__note'>{t('offer_price_note')}</span>
                </Link>
                <Link
                  to={activeOffer.path}
                  onClick={() => handleSelectTier(selectedTier)}
                  className='btn btn--primary btn--lg'
                  aria-label={`${t('offers_card_cta')} — ${t('offer_name')}`}
                >
                  {t('offers_card_cta')}
                  <Icon name='arrowRight' />
                </Link>
              </div>
            </div>
          </article>

          <p className='offers__question'>
            <span>{t('offers_question')}</span>
            <Link className='arrow-link' to='/contact'>
              <Icon name='mail' />
              {t('offers_question_cta')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default AbonnementsPage;

