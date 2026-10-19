import React, { useRef, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon } from '../../../components/Icon';
import type { TranslationKey } from '../../../i18n';

const STEPS = [
  { n: 1, image: '/media/fe552333c4cd.webp' },
  { n: 2, image: '/media/0e1ee5dff864.webp' },
  { n: 3, image: '/media/50471a19bc72.webp' }
];

export const Journey: React.FC = () => {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const k = (n: number, f: string) => t(`journey_step_${n}_${f}` as TranslationKey);

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + STEPS.length) % STEPS.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const step = STEPS[active];
  return (
    <section className='jny section' id='journey' aria-labelledby='journey-title'>
      <div className='container'>
        <div className='section-header-center'>
          <p className='eyebrow'>{t('journey_kicker')}</p>
          <h2 id='journey-title' className='section-title'>
            {t('journey_title')}
          </h2>
          <p className='section-subtitle'>{t('journey_subtitle')}</p>
        </div>

        {/* Segmented Filter / Tab Bar */}
        <div className='jny__tabs-wrap'>
          <div className='jny__tabs' role='tablist' aria-label={t('journey_tabs')} onKeyDown={onKeyDown}>
            {STEPS.map((s, i) => (
              <button
                key={s.n}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type='button'
                role='tab'
                id={`jny-tab-${s.n}`}
                aria-selected={active === i}
                aria-controls='jny-panel'
                tabIndex={active === i ? 0 : -1}
                onClick={() => setActive(i)}
              >
                {k(s.n, 'num').replace(' / ', '. ')}
              </button>
            ))}
          </div>
        </div>

        {/* Active Spotlight Card */}
        <div className='jrow' id='jny-panel' role='tabpanel' aria-labelledby={`jny-tab-${step.n}`}>
          <div className='jart'>
            <img key={step.image} src={step.image} alt={k(step.n, 'title')} width={420} height={320} loading='lazy' decoding='async' />
          </div>
          <div className='jtxt'>
            <p className='jnum'>{k(step.n, 'num').replace(' / ', ' · ')}</p>
            <h3 className='jtitle'>{k(step.n, 'title')}</h3>
            <p className='jlead'>{k(step.n, 'lead')}</p>
            <p className='jdesc'>{k(step.n, 'desc')}</p>
          </div>
        </div>

        {/* 3-Card Experience Timeline Overview (v0 Portfolio Card Grid) */}
        <div className='jny__cards'>
          {STEPS.map((s, i) => {
            const isSelected = active === i;
            return (
              <article
                key={s.n}
                className={`jny__card${isSelected ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                <div className='jny__card-head'>
                  <span className='jny__card-index'>{k(s.n, 'num').replace(' / ', ' · ')}</span>
                  <Icon name='chevronRight' />
                </div>
                <h3 className='jny__card-title'>{k(s.n, 'title')}</h3>
                <p className='jny__card-lead'>{k(s.n, 'lead')}</p>
                <p className='jny__card-desc'>{k(s.n, 'desc')}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
