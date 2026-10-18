import React from 'react';
import { Link } from '../../../app/router';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon } from '../../../components/Icon';

export const EntryLinks: React.FC = () => {
  const { t } = useLanguage();
  const items = [
    { to: '/abonnements/accompagnement-voyage', kicker: t('entry_offer_kicker'), title: t('entry_offer_title'), sub: t('entry_offer_sub'), primary: true },
    { to: '/articles', kicker: t('entry_articles_kicker'), title: t('entry_articles_title'), sub: t('entry_articles_sub'), primary: false }
  ];
  return (
    <nav className='entry' aria-label={t('entry_label')}>
      <div className='container entry__grid'>
        {items.map((it) => (
          <Link key={it.to} to={it.to} className={`entry__card${it.primary ? ' entry__card--primary' : ''}`}>
            <span className='eyebrow'>{it.kicker}</span>
            <span className='entry__title'>{it.title}</span>
            <span className='entry__sub'>{it.sub}</span>
            <span className='entry__arrow' aria-hidden='true'>
              <Icon name='arrowRight' />
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
