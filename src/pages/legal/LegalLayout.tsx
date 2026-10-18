import React from 'react';
import './legal.css';
import { Link, useRouter } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { frenchTypography } from '../../lib/typography';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export interface LegalDoc {
  title: string;
  lead: string;
  updated: string;
  sections: LegalSection[];
}

const DOCS = [
  { to: '/legal/conditions-de-vente', fr: 'Conditions de vente', en: 'Terms of sale' },
  { to: '/legal/remboursement', fr: 'Remboursement', en: 'Refunds' },
  { to: '/legal/confidentialite', fr: 'Confidentialité', en: 'Privacy' }
];

export const LegalLayout: React.FC<{ doc: LegalDoc }> = ({ doc }) => {
  const { lang, t } = useLanguage();
  const { path } = useRouter();
  return (
    <div className='page legal'>
      <PageHeader
        crumbs={[{ label: t('nav_home'), to: '/' }, { label: doc.title }]}
        eyebrow={t('foot_legal_title')}
        title={doc.title}
        lead={lang === 'fr' ? frenchTypography(doc.lead) : doc.lead}
      />
      <div className='container legal__grid'>
        <aside className='legal__aside'>
          <nav aria-label={t('foot_legal_title')}>
            <ul className='legal__docs'>
              {DOCS.map((d) => (
                <li key={d.to}>
                  <Link to={d.to} aria-current={path === d.to ? 'page' : undefined}>
                    {lang === 'en' ? d.en : d.fr}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className='legal__updated'>{doc.updated}</p>
        </aside>
        <article className='legal__body'>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className='legal__section' aria-labelledby={`${s.id}-t`}>
              <h2 id={`${s.id}-t`}>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
};
