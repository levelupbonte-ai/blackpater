import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon, type IconName } from '../../../components/Icon';
import type { TranslationKey } from '../../../i18n';

const STEPS: { icon: IconName; n: 1 | 2 | 3 | 4 }[] = [
  { icon: 'list', n: 1 },
  { icon: 'lock', n: 2 },
  { icon: 'user', n: 3 },
  { icon: 'chat', n: 4 }
];

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();
  const k = (s: string) => s as TranslationKey;
  return (
    <section className='section lux-section lux-section--tint' aria-labelledby='how-title'>
      <div className='container'>
        <div className='lux-head'>
          <p className='lux-eyebrow'>
            <span className='lux-eyebrow__dot' aria-hidden='true' />
            {t('hm_how_kicker')}
          </p>
          <h2 id='how-title' className='lux-title'>
            {t('hm_how_title')}
          </h2>
        </div>
        <ol className='lux-steps'>
          {STEPS.map((s) => (
            <li key={s.n} className='lux-step' data-reveal>
              <span className='lux-step__num' aria-hidden='true'>
                {String(s.n).padStart(2, '0')}
              </span>
              <span className='lux-step__icon' aria-hidden='true'>
                <Icon name={s.icon} />
              </span>
              <h3>{t(k(`hm_how_${s.n}_title`))}</h3>
              <p>{t(k(`hm_how_${s.n}_text`))}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export const FinalCta: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className='lux-cta' aria-labelledby='cta-title'>
      <div className='container lux-cta__inner' data-reveal>
        <div>
          <h2 id='cta-title'>{t('hm_cta_title')}</h2>
          <p>{t('hm_cta_text')}</p>
        </div>
        <div className='lux-cta__actions'>
          <a href='/abonnements/accompagnement-voyage' className='btn btn--light btn--lg'>
            <span>{t('hm_cta_primary')}</span>
            <Icon name='arrowRight' />
          </a>
          <a href='/contact' className='btn btn--ghost-light btn--lg'>
            <Icon name='mail' />
            <span>{t('hm_cta_secondary')}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
