import React from 'react';
import { Link } from '../../../app/router';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon, type IconName } from '../../../components/Icon';
import type { TranslationKey } from '../../../i18n';

const TRUST: { icon: IconName; key: TranslationKey }[] = [
  { icon: 'lock', key: 'hm_trust_1' },
  { icon: 'receipt', key: 'hm_trust_2' },
  { icon: 'globe', key: 'hm_trust_3' },
  { icon: 'shield', key: 'hm_trust_4' }
];

/**
 * Home hero: the promise, two actions and the facts a visitor can rely on.
 * The portrait is the LCP image: responsive WebP, explicit size (no layout
 * shift), fetched with high priority and never lazy.
 */
export const Hero: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className='lux-hero' aria-labelledby='hero-title'>
      <div className='container lux-hero__grid'>
        <div className='lux-hero__copy'>
          <p className='lux-eyebrow hero-anim hero-anim--1'>
            <span className='lux-eyebrow__dot' aria-hidden='true' />
            {t('hm_eyebrow')}
          </p>
          <h1 id='hero-title' className='lux-hero__title hero-anim hero-anim--1'>
            {t('hm_title')}
          </h1>
          <p className='lux-hero__lead hero-anim hero-anim--2'>{t('hm_lead')}</p>
          <div className='lux-hero__actions hero-anim hero-anim--3'>
            <Link to='/abonnements' className='btn btn--primary btn--lg'>
              <span>{t('hm_cta_offers')}</span>
              <Icon name='arrowRight' />
            </Link>
            <Link to='/espace-client' className='btn btn--outline btn--lg'>
              <Icon name='user' />
              <span>{t('hm_cta_space')}</span>
            </Link>
          </div>
        </div>

        <figure className='lux-hero__visual hero-anim hero-anim--2'>
          <div className='lux-hero__arch' aria-hidden='true' />
          <img
            className='lux-hero__img'
            src='/media/portrait-960.webp'
            srcSet='/media/portrait-640.webp 640w, /media/portrait-960.webp 960w, /media/portrait-1280.webp 1280w'
            sizes='(min-width: 960px) 46vw, 92vw'
            alt='Jean-Pierre Lofumbwa (Black Pater)'
            width={960}
            height={762}
            fetchPriority='high'
            decoding='async'
          />
          <figcaption className='lux-hero__badge'>
            <strong>{t('hm_portrait_name')}</strong>
            <span>{t('hm_portrait_role')}</span>
          </figcaption>
        </figure>
      </div>

      <div className='container'>
        <ul className='lux-trust' aria-label={t('hm_trust_label')}>
          {TRUST.map((item) => (
            <li key={item.key}>
              <span className='lux-trust__icon' aria-hidden='true'>
                <Icon name={item.icon} />
              </span>
              <span>{t(item.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
