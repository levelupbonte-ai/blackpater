import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { TranslationKey } from '../../../i18n';

const ROLES = [1, 2, 3, 4] as const;
const MIX = [1, 2, 3, 4] as const;
const STATS = [1, 2, 3] as const;

export const About: React.FC = () => {
  const { t } = useLanguage();
  const k = (s: string) => s as TranslationKey;
  return (
    <section className='about' id='about' aria-labelledby='about-title'>
      <div className='wrap about__grid'>
        <div className='about__left'>
          <p className='eyebrow'>{t('about_kicker')}</p>
          <h2 id='about-title' className='about__title'>
            <span>{t('about_title_1')}</span>
            <span>{t('about_title_2')}</span>
          </h2>
          <figure className='about__photo'>
            <img src='/media/db4bf6a012c1.webp' alt='' width={420} height={525} loading='lazy' decoding='async' />
            <figcaption>{t('about_sub')}</figcaption>
          </figure>
        </div>

        <div className='about__right'>
          <p className='about__lead'>{t('about_lead')}</p>

          <ul className='about__roles'>
            {ROLES.map((i) => (
              <li key={i}>
                <h3>{t(k(`about_role_${i}_title`))}</h3>
                <p>{t(k(`about_role_${i}_desc`))}</p>
              </li>
            ))}
          </ul>

          <div className='mix'>
            <p className='mix__intro label'>{t('about_mix_intro')}</p>
            <ul>
              {MIX.map((i) => (
                <li key={i}>
                  <h3>{t(k(`about_mix_${i}`))}</h3>
                  <p>{t(k(`about_mix_${i}_sub`))}</p>
                </li>
              ))}
            </ul>
          </div>

          <dl className='stats' aria-label={t('about_facts_label')}>
            {STATS.map((i) => (
              <div key={i}>
                <dt className='stats__val'>{t(k(`stat_${i}_num`))}</dt>
                <dd className='stats__txt'>
                  <b>{t(k(`stat_${i}_title`))}</b>
                  <span>{t(k(`stat_${i}_sub`))}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className='bridge'>
            <span className='tri' aria-hidden='true'>
              <i />
              <i />
              <i />
            </span>
            <p>{t('about_bridge')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
