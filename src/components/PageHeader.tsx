import React from 'react';
import { Link } from '../app/router';
import { useLanguage } from '../context/LanguageContext';

export interface Crumb {
  label: string;
  to?: string;
}

export const Breadcrumbs: React.FC<{ items: Crumb[] }> = ({ items }) => {
  const { t } = useLanguage();
  return (
    <nav className='breadcrumbs' aria-label={t('breadcrumbs')}>
      <ol>
        {items.map((c, i) => (
          <li key={i}>{c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current='page'>{c.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
};

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  narrow?: boolean;
}> = ({ eyebrow, title, lead, crumbs, actions, narrow }) => (
  <header className='page-header'>
    <div className={`container${narrow ? ' container--narrow' : ''}`}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      {eyebrow && <p className='eyebrow'>{eyebrow}</p>}
      <h1 className='page-header__title'>{title}</h1>
      {lead && <p className='lead page-header__lead'>{lead}</p>}
      {actions && <div className='page-header__actions'>{actions}</div>}
    </div>
  </header>
);
