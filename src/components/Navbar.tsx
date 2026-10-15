import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }, [menuOpen]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setMenuOpen(false);
    onNavigate(path);
  };

  return (
    <div className="nav-wrapper">
      {/* Discreet Congolese Micro Tricolor Accent Line */}
      <div className="nav-tricolor-line" aria-hidden="true" />

      {/* Main Glassmorphic Navigation Header */}
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`} id="nav">
        {/* Brand: Pure Luxury Typography (No bulky logo icon) */}
        <a
          className="nav__brand"
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          aria-label="Black Pater"
        >
          <span className="nav__brand-name">BLACK PATER</span>
        </a>

        {/* Primary Desktop Navigation Links */}
        <nav className="nav__links" aria-label="Main Navigation">
          <a
            href="/"
            className={currentRoute === '/' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/')}
          >
            {t('nav_home')}
          </a>

          <a
            href="/abonnements"
            className={currentRoute.startsWith('/abonnements') ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/abonnements')}
          >
            {t('nav_subs')}
          </a>

          <a
            href="/articles"
            className={currentRoute.startsWith('/articles') ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/articles')}
          >
            {t('nav_articles')}
          </a>

          <a
            href="/#about"
            className={currentRoute === '/#about' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#about')}
          >
            {t('nav_about')}
          </a>

          <a
            href="/#journey"
            className={currentRoute === '/#journey' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#journey')}
          >
            {t('nav_journey')}
          </a>

          <a
            href="/#culture"
            className={currentRoute === '/#culture' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#culture')}
          >
            {t('nav_culture')}
          </a>

          <a
            href="/#contact"
            className={currentRoute === '/#contact' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#contact')}
          >
            {t('nav_contact')}
          </a>
        </nav>

        {/* Actions Cluster: Only Clean Language Switcher + Mobile Burger (No 1$ CTA, No blinking dots) */}
        <div className="nav__actions">
          {/* Segmented Language Switcher */}
          <div className="lang" role="group" aria-label="Language selection">
            <button
              type="button"
              onClick={() => setLang('fr')}
              aria-pressed={lang === 'fr'}
              className={lang === 'fr' ? 'active' : ''}
            >
              FR
            </button>
            <span />
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={lang === 'en' ? 'active' : ''}
            >
              EN
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="burger"
            id="burger"
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            aria-controls="mmenu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i />
            <i />
          </button>
        </div>
      </header>

      {/* Clean Mobile Menu Drawer */}
      <div
        className={`mmenu ${menuOpen ? 'is-open' : ''}`}
        id="mmenu"
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        {/* Mobile Top Header: Pure Brand Text + Clean Close Button */}
        <div className="mmenu__top">
          <span style={{ fontFamily: 'var(--display)', fontSize: '1.45rem', letterSpacing: '0.04em', color: '#fff' }}>
            BLACK PATER
          </span>

          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(239,232,220,0.15)',
              color: 'var(--bone)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Numbered Navigation Links without cheap badges or colors */}
        <div className="mmenu__links">
          <a
            href="/"
            className={currentRoute === '/' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/')}
          >
            <div className="mmenu__link-text">
              <span className="mmenu__link-idx">01</span>
              <span>{t('nav_home')}</span>
            </div>
            <span className="mmenu__link-arrow">→</span>
          </a>

          <a
            href="/abonnements"
            className={currentRoute.startsWith('/abonnements') ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/abonnements')}
          >
            <div className="mmenu__link-text">
              <span className="mmenu__link-idx">02</span>
              <span>{t('nav_subs')}</span>
            </div>
            <span className="mmenu__link-arrow">→</span>
          </a>

          <a
            href="/articles"
            className={currentRoute.startsWith('/articles') ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/articles')}
          >
            <div className="mmenu__link-text">
              <span className="mmenu__link-idx">03</span>
              <span>{t('nav_articles')}</span>
            </div>
            <span className="mmenu__link-arrow">→</span>
          </a>

          <a
            href="/#about"
            className={currentRoute === '/#about' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#about')}
          >
            <div className="mmenu__link-text">
              <span className="mmenu__link-idx">04</span>
              <span>{t('nav_about')}</span>
            </div>
            <span className="mmenu__link-arrow">→</span>
          </a>

          <a
            href="/#journey"
            className={currentRoute === '/#journey' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#journey')}
          >
            <div className="mmenu__link-text">
              <span className="mmenu__link-idx">05</span>
              <span>{t('nav_journey')}</span>
            </div>
            <span className="mmenu__link-arrow">→</span>
          </a>

          <a
            href="/#culture"
            className={currentRoute === '/#culture' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#culture')}
          >
            <div className="mmenu__link-text">
              <span className="mmenu__link-idx">06</span>
              <span>{t('nav_culture')}</span>
            </div>
            <span className="mmenu__link-arrow">→</span>
          </a>

          <a
            href="/#contact"
            className={currentRoute === '/#contact' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#contact')}
          >
            <div className="mmenu__link-text">
              <span className="mmenu__link-idx">07</span>
              <span>{t('nav_contact')}</span>
            </div>
            <span className="mmenu__link-arrow">→</span>
          </a>
        </div>

        {/* Mobile Drawer Bottom: Language switch + Social quick links */}
        <div className="mmenu__bottom">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--bone-dim)' }}>
              Langue / Language
            </span>
            <div className="lang" role="group" aria-label="Mobile Language selection">
              <button
                type="button"
                onClick={() => setLang('fr')}
                aria-pressed={lang === 'fr'}
                className={lang === 'fr' ? 'active' : ''}
              >
                FR
              </button>
              <span />
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                className={lang === 'en' ? 'active' : ''}
              >
                EN
              </button>
            </div>
          </div>

          <div className="mmenu__socials">
            <a href="https://www.tiktok.com/@black_pater" target="_blank" rel="noopener noreferrer">TikTok</a>
            <span>•</span>
            <a href="https://www.instagram.com/black_pater" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span>•</span>
            <a href="https://www.youtube.com/@black_pater" target="_blank" rel="noopener noreferrer">YouTube</a>
            <span>•</span>
            <a href="https://benimuwawa.substack.com" target="_blank" rel="noopener noreferrer">Substack</a>
          </div>
        </div>
      </div>
    </div>
  );
};
