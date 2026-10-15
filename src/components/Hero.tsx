import React, { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Hero: React.FC = () => {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  const [coords, setCoords] = useState<{ x: string; y: string }>({ x: '50%', y: '40%' });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1) + '%';
    const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1) + '%';
    setCoords({ x, y });
  };

  return (
    <section
      ref={heroRef}
      className="hero"
      id="hero"
      onMouseMove={handleMouseMove}
      aria-label="Black Pater Hero"
    >
      <div className="hero__bg" />

      {/* Ghost silhouette background blur */}
      <div className="hero__ghost" aria-hidden="true">
        <div
          className="im"
          style={{ backgroundImage: 'url(/media/3e0be360f5ad.webp)' }}
        />
      </div>

      {/* Main Title */}
      <h1 className="hero__title">
        <span className="line">
          {'BLACK PATER'.split('').map((char, index) => (
            <span key={index} className="ch" style={{ '--i': index } as any}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </h1>

      {/* Cutout Hero Stage with dual base + color mouse spotlight reveal */}
      <div className="hero__stage" aria-hidden="true">
        <div
          className="subject subject--base"
          style={{ backgroundImage: 'url(/media/3e0be360f5ad.webp)' }}
        />
        <div
          className="subject subject--color"
          style={
            {
              backgroundImage: 'url(/media/3e0be360f5ad.webp)',
              '--x': coords.x,
              '--y': coords.y,
            } as any
          }
        />
      </div>

      <div className="hero__floor" />
      <div className="hero__vig" />

      {/* Side text status badges */}
      <div className="hero__side hero__side--l">
        <span>KINSHASA — SALT LAKE CITY</span>
        <span className="tri">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="hero__side hero__side--r">
        <span>COLUMBIA COLLEGE DEAN’S LIST</span>
        <span className="tri">
          <i />
          <i />
          <i />
        </span>
      </div>

      {/* Bottom overlay texts */}
      <div className="hero__ui">
        <div className="hero__row">
          <div className="hero__stmt">
            <span>{t('hero_quote_line1')}</span>
            <span>{t('hero_quote_line2')}</span>
          </div>

          <div className="hero__prof">
            <b>{t('hero_status')}</b>
            <span className="label">{t('hero_prof_label')}</span>
            <div className="hero__hint">
              <span className="label">{t('hero_scroll')}</span>
              <i />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tricolor Band (Democratic Republic of Congo Flag) */}
      <div className="hero__tricolor" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </section>
  );
};
