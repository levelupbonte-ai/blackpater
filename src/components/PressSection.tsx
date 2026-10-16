import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ARTICLES_DATA, TESTIMONIALS_DATA } from '../data/mockData';

interface PressSectionProps {
  onNavigate: (path: string) => void;
}

export const PressSection: React.FC<PressSectionProps> = ({ onNavigate }) => {
  const { lang, t } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  const displayedArticles = showAll ? ARTICLES_DATA : ARTICLES_DATA.slice(0, 3);

  return (
    <section className="press" id="press" aria-labelledby="pressTitle">
      <div className="wrap">
        <div className="press__head">
          <div className="press__head-text">
            <span className="label">{t('press_kicker')}</span>
            <h2 id="pressTitle">{t('press_title')}</h2>
            <p>{t('press_subtitle')}</p>
          </div>

          <div className="press__head-links" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a
              className="press__cta-btn"
              href="https://voyageutah.com/interview/rising-stars-meet-black_pater-lofumbwa-of-salt-lake-city/"
              target="_blank"
              rel="noopener noreferrer"
            >
              VoyageUtah ↗
            </a>
            <a
              className="press__cta-btn press__cta-btn--sec"
              href="https://connected.ccis.edu/2024/01/columbia-college-fall-semester-2023-deans-list-announced/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Columbia College ↗
            </a>
            <a
              className="press__cta-btn press__cta-btn--sec"
              href="/articles"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/articles');
              }}
            >
              Tous les Articles ↗
            </a>
          </div>
        </div>

        {/* Publications Grid */}
        <div className="press__pubs-grid">
          {displayedArticles.map((art) => (
            <article
              key={art.id}
              className={`press__pub-card ${
                art.badgeType === 'academic'
                  ? 'press__pub-card--gold'
                  : art.badgeType === 'editorial'
                  ? 'press__pub-card--alt'
                  : ''
              }`}
              data-cursor="Consulter la publication"
            >
              <div>
                <div className="press__pub-header">
                  <span className="press__pub-source">{art.source}</span>
                  <span className="press__pub-date">{art.date}</span>
                </div>
                <h3 className="press__pub-title">{lang === 'en' && art.titleEn ? art.titleEn : art.title}</h3>
                <p className="press__pub-excerpt">{lang === 'en' && art.excerptEn ? art.excerptEn : art.excerpt}</p>
              </div>

              <div className="press__pub-footer">
                <a
                  className="press__pub-link"
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {lang === 'en' && art.buttonTextEn ? art.buttonTextEn : art.buttonText}
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Expand / Collapse Action */}
        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="press__cta-btn press__cta-btn--sec"
            style={{ padding: '12px 28px', cursor: 'pointer' }}
          >
            {showAll ? t('press_less') : t('press_more')}
          </button>
        </div>

        {/* Editorial Quote */}
        <div className="press__quote" style={{ marginTop: '56px', padding: '36px clamp(20px, 4vw, 44px)', borderLeft: '3px solid var(--copper)', background: 'rgba(255,255,255,0.02)' }}>
          <blockquote style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', color: 'var(--bone)', lineHeight: 1.5 }}>
            {t('press_quote')}
          </blockquote>
          <cite style={{ display: 'block', marginTop: '14px', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--copper)', fontStyle: 'normal' }}>
            — Jean-Pierre Lofumbwa (« Le Prof »)
          </cite>
        </div>

        {/* Testimonials */}
        <div style={{ marginTop: '64px' }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: '2rem', textTransform: 'uppercase', color: 'var(--bone)', marginBottom: '24px' }}>
            Témoignages & Réactions de la Communauté
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {TESTIMONIALS_DATA.map((tm, idx) => (
              <div
                key={idx}
                style={{
                  padding: '24px',
                  borderRadius: '10px',
                  border: '1px solid var(--bone-faint)',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <p style={{ fontStyle: 'italic', color: 'var(--bone-dim)', lineHeight: 1.55, marginBottom: '16px' }}>
                  {tm.text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(201,138,82,0.2)',
                      color: 'var(--copper)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}
                  >
                    {tm.avatar}
                  </div>
                  <div>
                    <b style={{ display: 'block', fontSize: '0.9rem', color: 'var(--bone)' }}>{tm.author}</b>
                    <span style={{ fontSize: '0.78rem', color: 'var(--bone-dim)' }}>{tm.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
