import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__grid">
          {/* Col 1: Identity & Brand */}
          <div className="foot__col foot__col--brand">
            <b className="foot__logo">BLACK PATER</b>
            <p className="foot__desc">
              Jean-Pierre Lofumbwa · « Le Prof »<br />
              <span>{t('foot_tag')}</span>
            </p>
            <div className="foot__contact-links" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <a className="foot__mail" href="mailto:lofumbwapater@gmail.com">
                lofumbwapater@gmail.com
              </a>
              <a
                className="foot__mail"
                href="https://wa.me/17205490926"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp : +1 720 549 0926
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Accordion (Samsung style on mobile) */}
          <div className={`foot__col foot__accordion ${openAccordion === 'nav' ? 'is-open' : ''}`}>
            <button
              className="foot__accordion-head"
              type="button"
              onClick={() => toggleAccordion('nav')}
              aria-expanded={openAccordion === 'nav'}
            >
              <span className="foot__title">{t('foot_nav')}</span>
              <svg className="foot__arrow" viewBox="0 0 24 24" width="20" height="20">
                <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="foot__accordion-body">
              <ul className="foot__links">
                <li><a href="/" onClick={(e) => handleLinkClick(e, '/')}>{t('nav_home')}</a></li>
                <li><a href="/abonnements" onClick={(e) => handleLinkClick(e, '/abonnements')}>{t('nav_subs')}</a></li>
                <li><a href="/articles" onClick={(e) => handleLinkClick(e, '/articles')}>{t('nav_articles')}</a></li>
                <li><a href="/#about" onClick={(e) => handleLinkClick(e, '/#about')}>{t('nav_about')}</a></li>
                <li><a href="/#journey" onClick={(e) => handleLinkClick(e, '/#journey')}>{t('nav_journey')}</a></li>
                <li><a href="/#culture" onClick={(e) => handleLinkClick(e, '/#culture')}>{t('nav_culture')}</a></li>
                <li><a href="/#socials" onClick={(e) => handleLinkClick(e, '/#socials')}>{t('nav_socials')}</a></li>
                <li><a href="/#contact" onClick={(e) => handleLinkClick(e, '/#contact')}>{t('nav_contact')}</a></li>
              </ul>
            </div>
          </div>

          {/* Col 3: Media Features Accordion */}
          <div className={`foot__col foot__accordion ${openAccordion === 'media' ? 'is-open' : ''}`}>
            <button
              className="foot__accordion-head"
              type="button"
              onClick={() => toggleAccordion('media')}
              aria-expanded={openAccordion === 'media'}
            >
              <span className="foot__title">{t('foot_media')}</span>
              <svg className="foot__arrow" viewBox="0 0 24 24" width="20" height="20">
                <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="foot__accordion-body">
              <ul className="foot__links">
                <li><a href="https://voyageutah.com/interview/rising-stars-meet-black_pater-lofumbwa-of-salt-lake-city/" target="_blank" rel="noopener noreferrer">VoyageUtah Magazine (USA) ↗</a></li>
                <li><a href="https://connected.ccis.edu/2024/01/columbia-college-fall-semester-2023-deans-list-announced/" target="_blank" rel="noopener noreferrer">Columbia College Dean's List ↗</a></li>
                <li><a href="https://benimuwawa.substack.com/p/black-pater-le-soldat-digital-du" target="_blank" rel="noopener noreferrer">Substack Culture · Soldat Digital ↗</a></li>
                <li><a href="https://komelate-blog.netlify.app/black-pater-biographie/" target="_blank" rel="noopener noreferrer">Komelate Blog (Biographie) ↗</a></li>
                <li><a href="https://komelate-blog.netlify.app/black-pater-rdc-utah-parcours/" target="_blank" rel="noopener noreferrer">Komelate Blog (RDC vers Utah) ↗</a></li>
                <li><a href="https://www.collegesidekick.com/study-docs/7290959" target="_blank" rel="noopener noreferrer">CollegeSidekick Archives ↗</a></li>
              </ul>
            </div>
          </div>

          {/* Col 4: Verified Socials */}
          <div className={`foot__col foot__accordion ${openAccordion === 'socials' ? 'is-open' : ''}`}>
            <button
              className="foot__accordion-head"
              type="button"
              onClick={() => toggleAccordion('socials')}
              aria-expanded={openAccordion === 'socials'}
            >
              <span className="foot__title">{t('foot_socials')}</span>
              <svg className="foot__arrow" viewBox="0 0 24 24" width="20" height="20">
                <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="foot__accordion-body">
              <ul className="foot__links">
                <li><a href="https://www.tiktok.com/@black_pater" target="_blank" rel="noopener noreferrer">TikTok (500K+) ↗</a></li>
                <li><a href="https://www.instagram.com/black_pater/" target="_blank" rel="noopener noreferrer">Instagram (150K+) ↗</a></li>
                <li><a href="https://www.youtube.com/@black_pater" target="_blank" rel="noopener noreferrer">YouTube (100K+) ↗</a></li>
                <li><a href="https://twitter.com/black_pater" target="_blank" rel="noopener noreferrer">X (Twitter) ↗</a></li>
                <li><a href="https://wa.me/17205490926" target="_blank" rel="noopener noreferrer">WhatsApp Officiel ↗</a></li>
                <li><a href="https://www.linkedin.com/in/jean-pierre-lofumbwa-3a5585141/" target="_blank" rel="noopener noreferrer">LinkedIn Pro ↗</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="foot__bot">
          <span>&copy; {new Date().getFullYear()} Black Pater (Jean-Pierre Lofumbwa). {t('foot_legal')}</span>
          <span style={{ maxWidth: '620px', textTransform: 'none', letterSpacing: '0.02em', opacity: 0.7 }}>
            {t('foot_disambig')}
          </span>
          <div className="pw">
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Plateforme certifiée Black Pater · Salt Lake City, Utah
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
