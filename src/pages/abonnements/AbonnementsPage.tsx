import React from 'react';
import './abonnements.css';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import type { TranslationKey } from '../../i18n';
import { OfferTiers } from '../../components/OfferTiers';

const STEPS = [1, 2, 3] as const;

export const AbonnementsPage: React.FC = () => {
  const { t } = useLanguage();
  const k = (s: string) => s as TranslationKey;

  return (
    <div className='page'>
      <PageHeader
        crumbs={[{ label: t('nav_home'), to: '/' }, { label: t('nav_offers') }]}
        eyebrow={t('offers_kicker')}
        title={t('offers_title')}
        lead={t('offers_lead')}
      />

      <section className='section offers-intro' aria-labelledby='offer-intro-title'>
        <div className='container'>
          <article className='offer-card'>
            <div className='offer-card__media'>
              <img src='/media/db4bf6a012c1.webp' alt='' width={560} height={700} loading='lazy' decoding='async' />
            </div>
            <div className='offer-card__body'>
              <p className='eyebrow'>{t('offers_card_tag')}</p>
              <h2 id='offer-intro-title' className='offer-card__title'>
                {t('offer_name')}
              </h2>
              <p className='offer-card__desc'>{t('offers_card_desc')}</p>
              <ul className='offer-card__points'>
                {(['offers_card_point_1', 'offers_card_point_2', 'offers_card_point_3'] as const).map((key) => (
                  <li key={key}>
                    <Icon name='check' />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section className='section section--ruled tiers' aria-labelledby='tiers-title'>
        <div className='container'>
          <div className='section-header-center'>
            <p className='eyebrow'>{t('offers_tier_kicker')}</p>
            <h2 id='tiers-title' className='section-title'>
              {t('offers_tier_label')}
            </h2>
          </div>

          <OfferTiers />

          <p className='tiers__note'>
            <Icon name='info' />
            <span>{t('offers_ecosystem_badge')}</span>
          </p>
        </div>
      </section>

      <section className='section section--ruled' aria-labelledby='how-title'>
        <div className='container'>
          <div className='section-head'>
            <div>
              <p className='eyebrow'>{t('offer_how_kicker')}</p>
              <h2 id='how-title' className='section-head__title'>
                {t('offer_how_title')}
              </h2>
            </div>
          </div>
          <ol className='steps'>
            {STEPS.map((i) => (
              <li key={i} className='step'>
                <span className='step__num' aria-hidden='true'>
                  {i}
                </span>
                <h3 className='step__title'>{t(k(`offer_step_${i}_title`))}</h3>
                <p className='step__text'>{t(k(`offer_step_${i}_text`))}</p>
              </li>
            ))}
          </ol>

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
