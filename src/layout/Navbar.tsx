import React, { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '../app/router';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Icon';
import type { TranslationKey } from '../i18n';
import { LanguageMenu } from './LanguageMenu';

const ITEMS: Array<{ to: string; key: TranslationKey; match?: (path: string, hash: string) => boolean }> = [
  { to: '/', key: 'nav_home', match: (p) => p === '/' },
  { to: '/parcours', key: 'nav_journey', match: (p) => p.startsWith('/parcours') },
  { to: '/abonnements', key: 'nav_offers', match: (p) => p.startsWith('/abonnements') || p.startsWith('/paiement') },
  { to: '/articles', key: 'nav_articles', match: (p) => p.startsWith('/articles') },
  { to: '/medias', key: 'nav_socials', match: (p) => p.startsWith('/medias') },
  { to: '/contact', key: 'nav_contact', match: (p) => p.startsWith('/contact') }
];

const ThemeButton: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const { lang } = useLanguage();
  const label =
    lang === 'fr'
      ? theme === 'dark'
        ? 'Activer le mode clair'
        : 'Activer le mode sombre'
      : theme === 'dark'
        ? 'Switch to light mode'
        : 'Switch to dark mode';

  return (
    <button
      type='button'
      className={`theme-toggle ${className || ''}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
};

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { path, hash } = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tucked, setTucked] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Header: transparent at the top, compact with a frosted background once
  // the page scrolls; slides away while reading down and returns on the
  // slightest scroll up (never while it holds keyboard focus).
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      setScrolled(y > 8);
      if (Math.abs(delta) > 4) {
        const focusInside = headerRef.current?.contains(document.activeElement) ?? false;
        setTucked(delta > 0 && y > 420 && !focusInside);
        lastY = y;
      }
      if (y < 80) setTucked(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // A route change always brings the header back.
  useEffect(() => setTucked(false), [path]);

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

  const isActive = (item: (typeof ITEMS)[number]) => (item.match ? item.match(path, hash) : false);

  return (
    <div className={`site-nav${tucked && !open ? ' is-tucked' : ''}`} onFocusCapture={() => setTucked(false)}>
      <header ref={headerRef} className={`nav${scrolled || open ? ' is-scrolled' : ''}`}>
        <div className='nav__inner'>
          <Link className='nav__brand' to='/' aria-label={`BlackPater — ${t('nav_home')}`}>
            <img src='/logo.svg' alt='' width={34} height={34} className='nav__brand-icon' />
            <span className='nav__wordmark' aria-hidden='true'>
              BlackPater
            </span>
          </Link>

          <nav className='nav__desktop' aria-label={t('nav_label')}>
            <ul className='nav__links'>
              {ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className='nav__link'
                    aria-current={isActive(item) ? 'page' : undefined}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className='nav__actions'>
            <LanguageMenu className='langmenu--desktop' />
            <ThemeButton />
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
              <li key={item.to} style={{ '--i': i } as React.CSSProperties}>
                <Link to={item.to} aria-current={isActive(item) ? 'page' : undefined}>
                  <span className='mmenu__idx' aria-hidden='true'>
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <span>{t(item.key)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <div className='mmenu__bottom'>
          <span className='label'>{t('lang_label')}</span>
          <LanguageMenu placement='up' />
        </div>
      </div>
    </div>
  );
};
