import React, { useState } from 'react';
import { Link } from '../app/router';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from '../components/Icon';
import type { TranslationKey } from '../i18n';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, whatsappLink } from '../lib/contact';
import { LevelUpCredit } from './LevelUpCredit';

const NAV: Array<{ to: string; key: TranslationKey }> = [
  { to: '/', key: 'nav_home' },
  { to: '/parcours', key: 'nav_journey' },
  { to: '/abonnements', key: 'nav_offers' },
  { to: '/articles', key: 'nav_articles' },
  { to: '/medias', key: 'nav_socials' },
  { to: '/contact', key: 'nav_contact' }
];

const PRESS = [
  { href: 'https://voyageutah.com/interview/rising-stars-meet-black_pater-lofumbwa-of-salt-lake-city/', label: 'VoyageUtah' },
  { href: 'https://connected.ccis.edu/2024/01/columbia-college-fall-semester-2023-deans-list-announced/', label: 'Columbia College' },
  { href: 'https://benimuwawa.substack.com/p/black-pater-le-soldat-digital-du', label: 'Substack — Béni Muwawa' },
  { href: 'https://komelate-blog.netlify.app/black-pater-biographie/', label: 'Komelate' },
  { href: 'https://www.collegesidekick.com/study-docs/7290959', label: 'CollegeSidekick' }
];

const SOCIAL = [
  { href: 'https://www.tiktok.com/@black_pater', label: 'TikTok' },
  { href: 'https://www.instagram.com/black_pater/', label: 'Instagram' },
  { href: 'https://www.youtube.com/@black_pater', label: 'YouTube' },
  { href: 'https://www.facebook.com/BlackPaterOfficiel', label: 'Facebook' },
  { href: 'https://twitter.com/black_pater', label: 'X' },
  { href: 'https://www.linkedin.com/in/jean-pierre-lofumbwa-3a5585141/', label: 'LinkedIn' }
];

const LEGAL: Array<{ to: string; key: TranslationKey }> = [
  { to: '/legal/conditions-de-vente', key: 'foot_terms' },
  { to: '/legal/remboursement', key: 'foot_refund' },
  { to: '/legal/confidentialite', key: 'foot_privacy' }
];

type SectionId = 'nav' | 'media' | 'socials';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const [openSec, setOpenSec] = useState<SectionId | null>(null);

  const toggleSec = (id: SectionId) => {
    setOpenSec((prev) => (prev === id ? null : id));
  };

  return (
    <footer className='foot'>
      <div className='container'>
        <div className='foot__grid'>
          <div className='foot__brand'>
            <p className='foot__logo'>
              <img src='/logo.svg' alt='' width={34} height={34} className='nav__brand-icon' />
              <span className='brand-wordmark'>
                <span className='brand-b'>Black</span>
                <span className='brand-p'>Pater</span>
              </span>
            </p>
            <p className='foot__desc'>
              Jean-Pierre Lofumbwa · « Le Prof »
              <br />
              {t('foot_tag')}
            </p>
            <ul className='foot__contact'>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
              <li>
                <a href={whatsappLink()} target='_blank' rel='noopener noreferrer'>
                  WhatsApp · {WHATSAPP_DISPLAY}
                  <span className='sr-only'> {t('opens_new_tab')}</span>
                </a>
              </li>
            </ul>
          </div>

          <nav
            className={`foot__col${openSec === 'nav' ? ' is-open' : ''}`}
            aria-labelledby='foot-nav'
          >
            <h2 className='foot__title' id='foot-nav'>
              <button
                type='button'
                className='foot__toggle'
                aria-expanded={openSec === 'nav'}
                onClick={() => toggleSec('nav')}
              >
                <span>{t('foot_nav')}</span>
                <Icon name='chevronDown' className='foot__chevron' />
              </button>
            </h2>
            <ul className='foot__links'>
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to}>{t(n.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`foot__col${openSec === 'media' ? ' is-open' : ''}`}>
            <h2 className='foot__title'>
              <button
                type='button'
                className='foot__toggle'
                aria-expanded={openSec === 'media'}
                onClick={() => toggleSec('media')}
              >
                <span>{t('foot_media')}</span>
                <Icon name='chevronDown' className='foot__chevron' />
              </button>
            </h2>
            <ul className='foot__links'>
              {PRESS.map((p) => (
                <li key={p.href}>
                  <a href={p.href} target='_blank' rel='noopener noreferrer'>
                    {p.label}
                    <span className='sr-only'> {t('opens_new_tab')}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={`foot__col${openSec === 'socials' ? ' is-open' : ''}`}>
            <h2 className='foot__title'>
              <button
                type='button'
                className='foot__toggle'
                aria-expanded={openSec === 'socials'}
                onClick={() => toggleSec('socials')}
              >
                <span>{t('foot_socials')}</span>
                <Icon name='chevronDown' className='foot__chevron' />
              </button>
            </h2>
            <ul className='foot__links'>
              {SOCIAL.map((p) => (
                <li key={p.href}>
                  <a href={p.href} target='_blank' rel='noopener noreferrer'>
                    {p.label}
                    <span className='sr-only'> {t('opens_new_tab')}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className='foot__legal'>
          <nav aria-label={t('foot_legal_title')}>
            <ul className='foot__legal-links'>
              {LEGAL.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{t(l.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className='foot__bot'>
          <p>
            © {year} BlackPater (Jean-Pierre Lofumbwa). {t('foot_rights')}
          </p>
          <LevelUpCredit />
        </div>
      </div>
    </footer>
  );
};
