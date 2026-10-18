import React from 'react';
import './abonnements.css';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Icon, WhatsAppIcon, type IconName } from '../../components/Icon';
import { OFFERS, formatOfferPrice } from '../../../shared/offers.js';
import { whatsappLink } from '../../lib/contact';
import type { TranslationKey } from '../../i18n';

const offer = OFFERS['accompagnement-voyage'];

const ASSURANCES: Array<{ icon: IconName; title: TranslationKey; text: TranslationKey }> = [
  { icon: 'receipt', title: 'offers_assure_1_title', text: 'offers_assure_1_text' },
  { icon: 'lock', title: 'offers_assure_2_title', text: 'offers_assure_2_text' },
  { icon: 'chat', title: 'offers_assure_3_title', text: 'offers_assure_3_text' }
];

export const AbonnementsPage: React.FC = () => {
  const { lang, t } = useLanguage();
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
                <Link to={offer.path}>{t('offer_name')}</Link>
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
                <p className='offer-card__price'>
                  <span className='offer-card__amount'>{price}</span>
                  <span className='offer-card__note'>{t('offer_price_note')}</span>
                </p>
                <Link to={offer.path} className='btn btn--primary btn--lg' aria-label={`${t('offers_card_cta')} — ${t('offer_name')}`}>
                  {t('offers_card_cta')}
                  <Icon name='arrowRight' />
                </Link>
              </div>
            </div>
          </article>

          <ul className='assure'>
            {ASSURANCES.map((a) => (
              <li key={a.title}>
                <Icon name={a.icon} />
                <div>
                  <h3>{t(a.title)}</h3>
                  <p>{t(a.text)}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className='offers__question'>
            <span>{t('offers_question')}</span>
            <a className='arrow-link' href={whatsappLink(t('wa_question_message'))} target='_blank' rel='noopener noreferrer'>
              <WhatsAppIcon />
              {t('offers_question_cta')}
              <span className='sr-only'> {t('opens_new_tab')}</span>
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default AbonnementsPage;
