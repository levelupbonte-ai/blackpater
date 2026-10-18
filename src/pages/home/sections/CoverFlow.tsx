import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { TranslationKey } from '../../../i18n';
import { Icon } from '../../../components/Icon';

interface Card {
  n: number;
  title?: string;
  titleKey?: TranslationKey;
  image: string;
  link: string;
}

const CARDS: Card[] = [
  { n: 1, title: 'Columbia College', image: '/media/331bab387390.webp', link: 'https://connected.ccis.edu/2024/01/columbia-college-fall-semester-2023-deans-list-announced/' },
  { n: 2, title: 'VoyageUtah', image: '/media/880bac4f1415.jpg', link: 'https://voyageutah.com/interview/rising-stars-meet-black_pater-lofumbwa-of-salt-lake-city/' },
  { n: 3, titleKey: 'cf_3_title', image: '/media/3e0be360f5ad.webp', link: 'https://benimuwawa.substack.com/p/black-pater-le-soldat-digital-du' },
  { n: 4, titleKey: 'cf_4_title', image: '/media/fe552333c4cd.webp', link: 'https://komelate-blog.netlify.app/black-pater-culture-danse-banafro/' },
  { n: 5, title: 'Molakisi', image: '/media/db4bf6a012c1.webp', link: 'https://komelate-blog.netlify.app/le-prof-black-pater-etudes-langues/' }
];

export const CoverFlow: React.FC = () => {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(2);
  const title = (c: Card) => (c.titleKey ? t(c.titleKey) : c.title || '');
  const go = (d: number) => setCurrent((i) => (i + d + CARDS.length) % CARDS.length);

  return (
    <section className='cf' id='culture' aria-labelledby='cf-title'>
      <div className='wrap'>
        <div className='section-head'>
          <div>
            <p className='eyebrow'>{t('cf_kicker')}</p>
            <h2 id='cf-title' className='section-head__title'>
              {t('cf_title')}
            </h2>
          </div>
          <p className='section-head__aside'>{t('cf_subtitle')}</p>
        </div>

        <div className='cf__stage'>
          <ul className='cf__track'>
            {CARDS.map((c, i) => {
              const offset = i - current;
              const abs = Math.abs(offset);
              const active = offset === 0;
              return (
                <li
                  key={c.n}
                  className={`cf__card${active ? ' is-active' : ''}`}
                  style={{ '--o': offset, '--abs': abs, zIndex: 10 - abs, opacity: abs > 2 ? 0 : 1 - abs * 0.22 } as React.CSSProperties}
                  aria-hidden={active ? undefined : true}
                  onClick={active ? undefined : () => setCurrent(i)}
                >
                  <img src={c.image} alt='' width={360} height={482} loading='lazy' decoding='async' />
                  <span className='cf__num'>{t(`cf_${c.n}_num` as TranslationKey)}</span>
                  <div className='cf__txt'>
                    <h3>{title(c)}</h3>
                    <p>{t(`cf_${c.n}_desc` as TranslationKey)}</p>
                    {active && (
                      <a className='cf__open' href={c.link} target='_blank' rel='noopener noreferrer'>
                        {t('cf_open')}
                        <Icon name='arrowUpRight' />
                        <span className='sr-only'> {t('opens_new_tab')}</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className='cf__ui'>
          <div className='cf__names'>
            {CARDS.map((c, i) => (
              <button key={c.n} type='button' onClick={() => setCurrent(i)} aria-pressed={current === i}>
                {title(c)}
              </button>
            ))}
          </div>
          <div className='cf__arrows'>
            <button className='round' type='button' onClick={() => go(-1)} aria-label={t('cf_prev')}>
              <Icon name='arrowLeft' />
            </button>
            <button className='round' type='button' onClick={() => go(1)} aria-label={t('cf_next')}>
              <Icon name='arrowRight' />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
