import React, { useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const PORTRAIT = '/media/3e0be360f5ad.webp';

export const Hero: React.FC = () => {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);

  // Spotlight follows the pointer: CSS variables only, no React re-render.
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${(((clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--y', `${(((clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    });
  };

  return (
    <section ref={ref} className='hero' id='hero' aria-label={t('hero_label')} onPointerMove={onPointerMove}>
      <div className='hero__bg' aria-hidden='true' />
      <div className='hero__ghost' aria-hidden='true'>
        <div className='im' style={{ backgroundImage: `url(${PORTRAIT})` }} />
      </div>

      <h1 className='hero__title'>
        <span className='sr-only'>Black Pater — Jean-Pierre Lofumbwa</span>
        <span aria-hidden='true'>BLACK PATER</span>
      </h1>

      <div className='hero__stage' aria-hidden='true'>
        <div className='subject subject--base' style={{ backgroundImage: `url(${PORTRAIT})` }} />
        <div className='subject subject--color' style={{ backgroundImage: `url(${PORTRAIT})` }} />
      </div>

      <div className='hero__floor' aria-hidden='true' />
      <div className='hero__vig' aria-hidden='true' />

      <p className='hero__side hero__side--l' aria-hidden='true'>
        <span>{t('hero_side_left')}</span>
        <span className='tri'>
          <i />
          <i />
          <i />
        </span>
      </p>
      <p className='hero__side hero__side--r' aria-hidden='true'>
        <span>{t('hero_side_right')}</span>
        <span className='tri'>
          <i />
          <i />
          <i />
        </span>
      </p>

      <div className='hero__ui'>
        <div className='hero__row'>
          <p className='hero__stmt'>
            <span>{t('hero_quote_line1')}</span>
            <span>{t('hero_quote_line2')}</span>
          </p>
          <div className='hero__prof'>
            <p className='hero__status'>{t('hero_status')}</p>
            <p className='label'>{t('hero_prof_label')}</p>
            <p className='hero__hint' aria-hidden='true'>
              <span className='label'>{t('hero_scroll')}</span>
              <i />
            </p>
          </div>
        </div>
      </div>

      <div className='hero__tricolor tricolor' aria-hidden='true'>
        <i />
        <i />
        <i />
      </div>
    </section>
  );
};
