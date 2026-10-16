import React from 'react';
import { SOCIALS_DATA } from '../data/mockData';

export const SocialsGrid: React.FC = () => {
  return (
    <section className="soc" id="socials" aria-labelledby="socTitle">
      <div className="wrap">
        <div className="soc__head">
          <span className="label">COMMUNAUTÉ & MÉDIAS</span>
          <h2 id="socTitle">
            RÉSEAUX <em>OFFICIELS</em>
          </h2>
        </div>

        <div className="soc__grid">
          {SOCIALS_DATA.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`scard ${item.gridSpan || ''}`}
              style={{ '--b': item.color } as any}
              data-cursor="Ouvrir le profil"
            >
              <div className="scard__arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </div>

              <div className="scard__top">
                <span className="label" style={{ color: item.color }}>{item.badge}</span>
              </div>

              <div className="scard__bot">
                <span className="scard__name">{item.name}</span>
                <div className="scard__meta">
                  <span>{item.handle}</span>
                  <em>{item.followers}</em>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
