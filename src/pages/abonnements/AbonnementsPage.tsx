import React from 'react';
import './abonnements.css';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import { OFFERS, formatOfferPrice } from '../../../shared/offers.js';

export const AbonnementsPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const offer = OFFERS['accompagnement-voyage'];
  const price = formatOfferPrice(offer, lang);

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
                <Link to='/abonnements/accompagnement-voyage'>
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

              <div className='offer-card__foot'>
                <Link
                  to='/abonnements/accompagnement-voyage'
                  className='offer-card__price'
                  aria-label={`${price} — ${t('offers_card_cta')}`}
                >
                  <span className='offer-card__amount'>{price}</span>
                  <span className='offer-card__note'>{t('offer_price_note')}</span>
                </Link>
                <Link
                  to='/abonnements/accompagnement-voyage'
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

