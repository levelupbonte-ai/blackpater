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
  const [current, setCurrent] = useState(0);
  const title = (c: Card) => (c.titleKey ? t(c.titleKey) : c.title || '');

  return (
    <section className='cf section' id='culture' aria-labelledby='cf-title'>
      <div className='container'>
        <div className='section-header-center'>
          <p className='eyebrow'>{t('cf_kicker')}</p>
          <h2 id='cf-title' className='section-title'>
            {t('cf_title')}
          </h2>
          <p className='section-subtitle'>{t('cf_subtitle')}</p>
        </div>

        {/* Featured Showcase Grid (v0 Featured Projects Card Grid) */}
        <ul className='showcase-grid'>
          {CARDS.map((c, i) => {
            const active = current === i;
            const rawMeta = t(`cf_${c.n}_num` as TranslationKey).replace(' / ', ' · ');
            return (
              <li
                key={c.n}
                className={`showcase-card${active ? ' is-featured' : ''}${i === 0 ? ' showcase-card--wide' : ''}`}
                onMouseEnter={() => setCurrent(i)}
              >
                <div className='showcase-card__media'>
                  <img src={c.image} alt={title(c)} width={480} height={320} loading='lazy' decoding='async' />
                  <div className='showcase-card__scrim' aria-hidden='true' />
                </div>
                <div className='showcase-card__body'>
                  <p className='showcase-card__meta'>{rawMeta}</p>
                  <h3 className='showcase-card__title'>{title(c)}</h3>
                  <p className='showcase-card__desc'>{t(`cf_${c.n}_desc` as TranslationKey)}</p>
                  <div className='showcase-card__foot'>
                    <a className='showcase-card__link' href={c.link} target='_blank' rel='noopener noreferrer'>
                      <span>{t('cf_open')}</span>
                      <Icon name='arrowUpRight' />
                      <span className='sr-only'> {t('opens_new_tab')}</span>
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
