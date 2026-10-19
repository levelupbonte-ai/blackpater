import React, { useRef, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { TranslationKey } from '../../../i18n';

const STEPS = [
  { n: 1, image: '/media/fe552333c4cd.webp', glow: 'rgba(27, 111, 214, 0.35)' },
  { n: 2, image: '/media/0e1ee5dff864.webp', glow: 'rgba(201, 138, 82, 0.35)' },
  { n: 3, image: '/media/50471a19bc72.webp', glow: 'rgba(110, 20, 35, 0.45)' }
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
    <section className='jny' id='journey' aria-labelledby='journey-title'>
      <div className='wrap'>
        <div className='section-head'>
          <div>
            <p className='eyebrow'>{t('journey_kicker')}</p>
            <h2 id='journey-title' className='section-head__title'>
              {t('journey_title')}
            </h2>
            <div className='tricolor jny__tri' aria-hidden='true'>
              <i />
              <i />
              <i />
            </div>
          </div>
          <p className='section-head__aside'>{t('journey_subtitle')}</p>
        </div>

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
              {k(s.n, 'num')}
            </button>
          ))}
        </div>

        <div className='jrow' id='jny-panel' role='tabpanel' aria-labelledby={`jny-tab-${step.n}`}>
          <div className='jart' style={{ '--glow': step.glow } as React.CSSProperties}>
            <img key={step.image} src={step.image} alt='' width={340} height={340} loading='lazy' decoding='async' />
          </div>
          <div className='jtxt'>
            <p className='jnum'>{k(step.n, 'num')}</p>
            <p className='jbig' aria-hidden='true'>
              {k(step.n, 'title')}
            </p>
            <h3>{k(step.n, 'lead')}</h3>
            <p>{k(step.n, 'desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
