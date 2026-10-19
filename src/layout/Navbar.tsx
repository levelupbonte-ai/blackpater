import React, { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '../app/router';
import { useLanguage, type Language } from '../context/LanguageContext';
import type { TranslationKey } from '../i18n';

const ITEMS: Array<{ to: string; key: TranslationKey; match?: (path: string) => boolean }> = [
  { to: '/', key: 'nav_home', match: (p) => p === '/' },
  { to: '/#about', key: 'nav_about' },
  { to: '/#journey', key: 'nav_journey' },
  { to: '/articles', key: 'nav_articles', match: (p) => p.startsWith('/articles') },
  { to: '/abonnements', key: 'nav_offers', match: (p) => p.startsWith('/abonnements') || p.startsWith('/paiement') },
  { to: '/#contact', key: 'nav_contact' }
];

const LangSwitch: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang, t } = useLanguage();
  const options: Language[] = ['fr', 'en'];
  return (
    <div className={`lang ${className || ''}`} role='group' aria-label={t('lang_switch')}>
      {options.map((l) => (
        <button key={l} type='button' lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { path, hash } = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the menu on navigation.
  useEffect(() => setOpen(false), [path, hash]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('menu-open');
    };
  }, [open]);

  const isActive = (item: (typeof ITEMS)[number]) => (item.match ? item.match(path) : false);

  return (
    <div className='site-nav'>
      <div className='site-nav__tricolor' aria-hidden='true' />
      <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
        <Link className='nav__brand' to='/' aria-label='Black Pater — accueil'>
          BLACK PATER
        </Link>

        <nav className='nav__links' aria-label={t('nav_label')}>
          {ITEMS.map((item) => (
            <Link key={item.to} to={item.to} aria-current={isActive(item) ? 'page' : undefined}>
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className='nav__actions'>
          <LangSwitch className='lang--desktop' />
          <button
            ref={burgerRef}
            className='burger'
            type='button'
            aria-label={open ? t('nav_menu_close') : t('nav_menu_open')}
            aria-expanded={open}
            aria-controls='mobile-menu'
            onClick={() => setOpen((v) => !v)}
          >
            <i />
            <i />
          </button>
        </div>
      </header>

      <div
        ref={panelRef}
        id='mobile-menu'
        className={`mmenu${open ? ' is-open' : ''}`}
        hidden={!open}
        aria-label={t('nav_menu_title')}
      >
        <nav aria-label={t('nav_label')}>
          <ol className='mmenu__links'>
            {ITEMS.map((item, i) => (
              <li key={item.to}>
                <Link to={item.to} aria-current={isActive(item) ? 'page' : undefined}>
                  <span className='mmenu__idx' aria-hidden='true'>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{t(item.key)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <div className='mmenu__bottom'>
          <span className='label'>{t('lang_label')}</span>
          <LangSwitch />
        </div>
      </div>
    </div>
  );
};
