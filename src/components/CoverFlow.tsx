import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const CoverFlow: React.FC = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(2);

  const cards = [
    {
      num: '01 / HONNEUR',
      title: 'COLUMBIA COLLEGE',
      desc: 'Dean’s List honneur académique (GPA > 3.5) — ccis.edu',
      image: '/media/331bab387390.webp',
      link: 'https://connected.ccis.edu/2024/01/columbia-college-fall-semester-2023-deans-list-announced/',
    },
    {
      num: '02 / PRESSE USA',
      title: 'VOYAGEUTAH',
      desc: 'Rising Stars: Meet Black_Pater Lofumbwa of Salt Lake City',
      image: '/media/880bac4f1415.jpg',
      link: 'https://voyageutah.com/interview/rising-stars-meet-black_pater-lofumbwa-of-salt-lake-city/',
    },
    {
      num: '03 / TRIBUNE',
      title: 'SOLDAT DIGITAL',
      desc: 'Chronique de Béni Muwawa : Le soldat digital du Congo',
      image: '/media/3e0be360f5ad.webp',
      link: 'https://benimuwawa.substack.com/p/black-pater-le-soldat-digital-du',
    },
    {
      num: '04 / CULTURE',
      title: 'DANSE BANAFRO',
      desc: 'Ambassadeur des rythmes urbains et du patrimoine congolais',
      image: '/media/fe552333c4cd.webp',
      link: 'https://komelate-blog.netlify.app/black-pater-culture-danse-banafro/',
    },
    {
      num: '05 / MÉTHODE',
      title: 'MOLAKISI',
      desc: 'Pédagogie vivante & transmission multilingue (5 langues)',
      image: '/media/db4bf6a012c1.webp',
      link: 'https://komelate-blog.netlify.app/le-prof-black-pater-etudes-langues/',
    },
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="cf" id="culture" aria-labelledby="cfTitle" style={{ height: 'auto', padding: 'clamp(80px, 10vw, 130px) 0' }}>
      <div className="wrap">
        <div className="cf__head">
          <div>
            <span className="label">PORTFOLIO & DISTINCTIONS</span>
            <h2 id="cfTitle">{t('cf_title')}</h2>
          </div>
          <p>{t('cf_subtitle')}</p>
        </div>

        {/* 3D Track */}
        <div
          className="cf__stage"
          style={{
            height: 'clamp(380px, 50vw, 480px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div className="cf__track" style={{ position: 'relative', width: '100%', height: '100%' }}>
            {cards.map((card, idx) => {
              const offset = idx - currentIndex;
              const absOffset = Math.abs(offset);
              const isActive = offset === 0;

              // 3D positioning calculation
              const translateX = offset * 210;
              const translateZ = -absOffset * 150;
              const rotateY = offset * -28;
              const opacity = absOffset > 2 ? 0 : 1 - absOffset * 0.25;
              const zIndex = 10 - absOffset;

              return (
                <div
                  key={idx}
                  className={`cf__card ${isActive ? 'is-active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    transform: `translate3d(calc(-50% + ${translateX}px), 0, ${translateZ}px) rotateY(${rotateY}deg)`,
                    opacity,
                    zIndex,
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'transform 0.65s cubic-bezier(0.22, 0.8, 0.2, 1), opacity 0.5s ease',
                  }}
                  data-cursor={isActive ? 'LIRE' : 'EXPLORE'}
                >
                  <div
                    className="im"
                    style={{
                      backgroundImage: `url(${card.image})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }}
                  />
                  <span className="cf__num">{card.num}</span>
                  <div className="cf__txt">
                    <h3>{card.title}</h3>
                    <p>{card.desc}</p>
                    {isActive && (
                      <a
                        href={card.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: '8px',
                          color: 'var(--copper)',
                          fontSize: '0.78rem',
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          pointerEvents: 'auto',
                        }}
                      >
                        Consulter ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel UI Controls */}
        <div className="cf__ui" style={{ marginTop: '24px' }}>
          <div className="cf__names">
            {cards.map((card, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-current={currentIndex === idx}
              >
                {card.title}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="round" type="button" onClick={handlePrev} aria-label="Précédent">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button className="round" type="button" onClick={handleNext} aria-label="Suivant">
              <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
