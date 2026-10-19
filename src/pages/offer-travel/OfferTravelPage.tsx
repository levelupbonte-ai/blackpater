import React from 'react';
import './offer.css';
import { useLanguage } from '../../context/LanguageContext';
import { Breadcrumbs } from '../../components/PageHeader';
import { Faq } from '../../components/Faq';
import { Icon } from '../../components/Icon';
import { OFFERS } from '../../../shared/offers.js';
import type { TranslationKey } from '../../i18n';
import { PurchasePanel } from './PurchasePanel';

const offer = OFFERS['accompagnement-voyage'];
const INCLUDED = [1, 2, 3, 4, 5, 6];
const STEPS = [1, 2, 3];
const FAQ = [1, 2, 3, 4, 5, 6];

export const OfferTravelPage: React.FC = () => {
  const { t } = useLanguage();
  const k = (s: string) => t(s as TranslationKey);

  return (
    <div className='page offer'>
      <section className='offer-hero' aria-labelledby='offer-title'>
        <div className='container offer-hero__grid'>
          <div className='offer-hero__intro'>
            <Breadcrumbs
              items={[
                { label: t('nav_home'), to: '/' },
                { label: t('nav_offers'), to: '/abonnements' },
                { label: t('offer_name') }
              ]}
            />
            <p className='eyebrow offer-hero__eyebrow'>{t('offer_kicker')}</p>
            <h1 id='offer-title' className='offer-hero__title'>
              {t('offer_name')}
            </h1>
            <p className='lead offer-hero__lead'>{t('offer_lead')}</p>
            <ul className='offer-hero__facts'>
              {(['offer_fact_1', 'offer_fact_2', 'offer_fact_3'] as const).map((f) => (
                <li key={f}>
                  <Icon name='check' />
                  {t(f)}
                </li>
              ))}
            </ul>
          </div>

          <div className='offer-hero__aside'>
            <PurchasePanel offer={offer} />
          </div>

          <section className='offer-hero__incl' aria-labelledby='incl-title'>
            <p className='eyebrow'>{t('offer_incl_kicker')}</p>
            <h2 id='incl-title' className='offer-block__title'>
              {t('offer_incl_title')}
            </h2>
            <ol className='incl'>
              {INCLUDED.map((i) => (
                <li key={i}>
                  <span className='incl__num' aria-hidden='true'>
                    {String(i).padStart(2, '0')}
                  </span>
                  <div>
                    <h3>{k(`offer_incl_${i}_title`)}</h3>
                    <p>{k(`offer_incl_${i}_text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>

      <section className='section section--ruled' aria-labelledby='how-title'>
        <div className='container'>
          <p className='eyebrow'>{t('offer_how_kicker')}</p>
          <h2 id='how-title' className='offer-block__title'>
            {t('offer_how_title')}
          </h2>
          <ol className='steps offer-steps'>
            {STEPS.map((i) => (
              <li className='step' key={i}>
                <p className='step__num' aria-hidden='true'>
                  {String(i).padStart(2, '0')}
                </p>
                <h3 className='step__title'>{k(`offer_step_${i}_title`)}</h3>
                <p className='step__text'>{k(`offer_step_${i}_text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='section section--ruled who' aria-labelledby='who-title'>
        <div className='container who__grid'>
          <figure className='who__photo'>
            <img src='/media/db4bf6a012c1.webp' alt={t('offer_who_photo')} width={480} height={600} loading='lazy' decoding='async' />
          </figure>
          <div>
            <p className='eyebrow'>{t('offer_who_kicker')}</p>
            <h2 id='who-title' className='offer-block__title'>
              {t('offer_who_title')}
            </h2>
            <p className='who__text'>{t('offer_who_text')}</p>
            <ul className='who__links'>
              <li>
                <a className='arrow-link' href='https://voyageutah.com/interview/rising-stars-meet-black_pater-lofumbwa-of-salt-lake-city/' target='_blank' rel='noopener noreferrer'>
                  {t('offer_who_link_1')}
                  <Icon name='arrowUpRight' />
                  <span className='sr-only'> {t('opens_new_tab')}</span>
                </a>
              </li>
              <li>
                <a className='arrow-link' href='https://connected.ccis.edu/2024/01/columbia-college-fall-semester-2023-deans-list-announced/' target='_blank' rel='noopener noreferrer'>
                  {t('offer_who_link_2')}
                  <Icon name='arrowUpRight' />
                  <span className='sr-only'> {t('opens_new_tab')}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className='section section--ruled' aria-labelledby='offer-faq-title'>
        <div className='container container--narrow'>
          <p className='eyebrow'>{t('offer_faq_kicker')}</p>
          <h2 id='offer-faq-title' className='offer-block__title'>
            {t('offer_faq_title')}
          </h2>
          <div className='offer-faq'>
            <Faq items={FAQ.map((i) => ({ q: k(`offer_faq_${i}_q`), a: k(`offer_faq_${i}_a`) }))} />
          </div>
          <div className='offer-bottom'>
            <p className='offer-bottom__title'>{t('offer_bottom_title')}</p>
            <a className='arrow-link' href='#achat'>
              {t('offer_bottom_cta')}
              <Icon name='arrowRight' />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OfferTravelPage;
