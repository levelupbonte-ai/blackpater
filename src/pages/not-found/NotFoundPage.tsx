import React from 'react';
import './not-found.css';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '../../components/Icon';
import type { TranslationKey } from '../../i18n';

const QUICK_LINKS: Array<{ to: string; key: TranslationKey }> = [
  { to: '/', key: 'nav_home' },
  { to: '/parcours', key: 'nav_journey' },
  { to: '/abonnements/accompagnement-voyage', key: 'nav_offers' },
  { to: '/articles', key: 'nav_articles' },
  { to: '/medias', key: 'nav_socials' },
  { to: '/contact', key: 'nav_contact' }
];

export const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className='page nf'>
      <div className='container'>
        <div className='nf__card'>
          <span className='nf__badge'>404</span>
          <p className='nf__code' aria-hidden='true'>
            404
          </p>
          <h1 className='nf__title'>{t('notfound_title')}</h1>
          <p className='nf__lead'>{t('notfound_lead')}</p>
          <div className='nf__actions'>
            <Link className='btn btn--primary btn--lg' to='/'>
              <Icon name='arrowLeft' />
              <span>{t('notfound_home')}</span>
            </Link>
            <Link className='btn btn--outline btn--lg' to='/contact'>
              <Icon name='mail' />
              <span>{t('nav_contact')}</span>
            </Link>
          </div>
        </div>

        <nav aria-label={t('nav_label')}>
          <ul className='nf__grid'>
            {QUICK_LINKS.map((item, idx) => (
              <li key={item.to}>
                <Link className='nf__link-card' to={item.to}>
                  <span className='nf__link-meta'>
                    <span className='nf__link-idx'>{String(idx + 1).padStart(2, '0')}</span>
                    <span className='nf__link-title'>{t(item.key)}</span>
                  </span>
                  <Icon name='arrowRight' />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default NotFoundPage;
