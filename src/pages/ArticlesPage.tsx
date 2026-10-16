import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ARTICLES_DATA, TESTIMONIALS_DATA } from '../data/mockData';

interface ArticlesPageProps {
  onNavigate: (path: string) => void;
}

export const ArticlesPage: React.FC<ArticlesPageProps> = ({ onNavigate }) => {
  const { lang, t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = ARTICLES_DATA.filter((art) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'usa' && art.badgeType === 'usa') ||
      (activeFilter === 'academic' && art.badgeType === 'academic') ||
      (activeFilter === 'editorial' && art.badgeType === 'editorial') ||
      (activeFilter === 'dossier' && (art.badgeType === 'dossier' || art.badgeType === 'culture'));

    const titleText = (lang === 'en' && art.titleEn ? art.titleEn : art.title).toLowerCase();
    const excerptText = (lang === 'en' && art.excerptEn ? art.excerptEn : art.excerpt).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || titleText.includes(query) || excerptText.includes(query);

    return matchesFilter && matchesQuery;
  });

  return (
    <div style={{ paddingTop: 'calc(var(--nav-h) + 20px)', minHeight: '100vh', background: 'var(--ink)' }}>
      {/* Page Hero */}
      <section className="page-hero" style={{ padding: 'clamp(50px, 8vw, 90px) 0 clamp(40px, 6vw, 60px)', textAlign: 'center', borderBottom: '1px solid var(--bone-faint)' }}>
        <div className="wrap">
          <span className="label" style={{ color: 'var(--copper)', letterSpacing: '0.22em' }}>
            PRESSE & TRIBUNES OFFICIELLES
          </span>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 0.95, margin: '14px 0 18px' }}>
            {t('nav_articles')}
          </h1>
          <p style={{ color: 'var(--bone-dim)', fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', maxWidth: '740px', margin: '0 auto', lineHeight: 1.6 }}>
            Reportages exclusifs dans la presse américaine (VoyageUtah), distinction d'honneur au Columbia College (Dean’s List), tribunes culturelles Substack et dossiers d'analyse.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section style={{ padding: '36px 0', borderBottom: '1px solid var(--bone-faint)' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tous les Articles' },
              { id: 'usa', label: 'Presse USA' },
              { id: 'academic', label: 'Distinctions Académiques' },
              { id: 'editorial', label: 'Tribunes & Substack' },
              { id: 'dossier', label: 'Portraits & Culture' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: activeFilter === f.id ? '1px solid var(--copper)' : '1px solid var(--bone-faint)',
                  background: activeFilter === f.id ? 'var(--copper)' : 'rgba(255,255,255,0.03)',
                  color: activeFilter === f.id ? '#0c0a09' : 'var(--bone-dim)',
                  fontWeight: activeFilter === f.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--bone-faint)',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>
      </section>

      {/* Publications Showcase Grid */}
      <section style={{ padding: '60px 0 100px' }}>
        <div className="wrap">
          <div className="press__pubs-grid">
            {filteredArticles.map((art) => (
              <article
                key={art.id}
                className={`press__pub-card ${
                  art.badgeType === 'academic'
                    ? 'press__pub-card--gold'
                    : art.badgeType === 'editorial'
                    ? 'press__pub-card--alt'
                    : ''
                }`}
                data-cursor="Consulter l'article"
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

          {filteredArticles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--bone-dim)' }}>
              Aucun article ne correspond à votre recherche.
            </div>
          )}

          {/* Editorial Quote */}
          <div className="press__quote" style={{ marginTop: '72px', padding: '36px clamp(20px, 4vw, 44px)', borderLeft: '3px solid var(--copper)', background: 'rgba(255,255,255,0.02)' }}>
            <blockquote style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', color: 'var(--bone)', lineHeight: 1.5 }}>
              {t('press_quote')}
            </blockquote>
            <cite style={{ display: 'block', marginTop: '14px', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--copper)', fontStyle: 'normal' }}>
              — Jean-Pierre Lofumbwa (« Le Prof »)
            </cite>
          </div>

          {/* Testimonials */}
          <div style={{ marginTop: '72px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '2.2rem', textTransform: 'uppercase', color: 'var(--bone)', marginBottom: '24px' }}>
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
    </div>
  );
};
