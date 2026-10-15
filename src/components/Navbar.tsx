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
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`} id="nav">
        <a
          className="nav__brand"
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          aria-label="Black Pater home"
        >
          BLACK PATER
        </a>

        <nav className="nav__links" aria-label="Main">
          <a
            href="/"
            className={currentRoute === '/' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/')}
          >
            {t('nav_home')}
          </a>
          <a
            href="/abonnements"
            className={currentRoute === '/abonnements' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/abonnements')}
          >
            {t('nav_subs')}
          </a>
          <a
            href="/articles"
            className={currentRoute === '/articles' ? 'is-active' : ''}
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
            href="/#socials"
            className={currentRoute === '/#socials' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#socials')}
          >
            {t('nav_socials')}
          </a>
          <a
            href="/#contact"
            className={currentRoute === '/#contact' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/#contact')}
          >
            {t('nav_contact')}
          </a>

          <div className="lang" role="group" aria-label="Language selection">
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={lang === 'en' ? 'active' : ''}
            >
              EN
            </button>
            <span />
            <button
              type="button"
              onClick={() => setLang('fr')}
              aria-pressed={lang === 'fr'}
              className={lang === 'fr' ? 'active' : ''}
            >
              FR
            </button>
          </div>
        </nav>

        <button
          className="burger"
          id="burger"
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mmenu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <i />
          <i />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`mmenu ${menuOpen ? 'is-open' : ''}`}
        id="mmenu"
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="mmenu__links">
          <a href="/" onClick={(e) => handleLinkClick(e, '/')} style={{ '--i': 0 } as any}>
            <span>{t('nav_home')}</span>
          </a>
          <a
            href="/abonnements"
            className={currentRoute === '/abonnements' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/abonnements')}
            style={{ '--i': 1 } as any}
          >
            <span>{t('nav_subs')}</span>
          </a>
          <a
            href="/articles"
            className={currentRoute === '/articles' ? 'is-active' : ''}
            onClick={(e) => handleLinkClick(e, '/articles')}
            style={{ '--i': 2 } as any}
          >
            <span>{t('nav_articles')}</span>
          </a>
          <a
            href="/#about"
            onClick={(e) => handleLinkClick(e, '/#about')}
            style={{ '--i': 3 } as any}
          >
            <span>{t('nav_about')}</span>
          </a>
          <a
            href="/#journey"
            onClick={(e) => handleLinkClick(e, '/#journey')}
            style={{ '--i': 4 } as any}
          >
            <span>{t('nav_journey')}</span>
          </a>
          <a
            href="/#culture"
            onClick={(e) => handleLinkClick(e, '/#culture')}
            style={{ '--i': 5 } as any}
          >
            <span>{t('nav_culture')}</span>
          </a>
          <a
            href="/#socials"
            onClick={(e) => handleLinkClick(e, '/#socials')}
            style={{ '--i': 6 } as any}
          >
            <span>{t('nav_socials')}</span>
          </a>
          <a
            href="/#contact"
            onClick={(e) => handleLinkClick(e, '/#contact')}
            style={{ '--i': 7 } as any}
          >
            <span>{t('nav_contact')}</span>
          </a>
        </div>

        <div className="lang" role="group" aria-label="Language selection" style={{ marginTop: '28px' }}>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            className={lang === 'en' ? 'active' : ''}
          >
            EN
          </button>
          <span />
          <button
            type="button"
            onClick={() => setLang('fr')}
            aria-pressed={lang === 'fr'}
            className={lang === 'fr' ? 'active' : ''}
          >
            FR
          </button>
        </div>
      </div>
    </>
  );
};
