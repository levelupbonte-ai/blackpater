import React, { useMemo, useState } from 'react';
import './articles.css';
import { useLanguage } from '../../context/LanguageContext';
import { ARTICLES, type ArticleCategory } from '../../data/articles';
import { ArticleCard } from '../../components/ArticleCard';
import { PageHeader } from '../../components/PageHeader';
import type { TranslationKey } from '../../i18n';

const FILTERS: Array<{ id: 'all' | ArticleCategory; key: TranslationKey }> = [
  { id: 'all', key: 'articles_filter_all' },
  { id: 'usa', key: 'articles_filter_usa' },
  { id: 'academic', key: 'articles_filter_academic' },
  { id: 'editorial', key: 'articles_filter_editorial' },
  { id: 'dossier', key: 'articles_filter_dossier' }
];

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export const ArticlesPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<'all' | ArticleCategory>('all');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return ARTICLES.filter((a) => {
      if (filter !== 'all' && a.category !== filter) return false;
      if (!q) return true;
      const hay = normalize([a.title, a.titleEn, a.excerpt, a.excerptEn, a.source].join(' '));
      return hay.includes(q);
    });
  }, [filter, query]);

  const count = results.length === 1 ? t('articles_count_one') : t('articles_count_many', { n: results.length });

  return (
    <div className='page'>
      <PageHeader
        crumbs={[{ label: t('nav_home'), to: '/' }, { label: t('nav_articles') }]}
        eyebrow={t('articles_kicker')}
        title={t('articles_title')}
        lead={t('articles_lead')}
      />

      <section className='section articles' aria-label={t('articles_title')}>
        <div className='container'>
          <div className='articles__toolbar'>
            <div className='articles__filters' role='group' aria-label={t('articles_filters')}>
              {FILTERS.map((f) => (
                <button key={f.id} type='button' aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {t(f.key)}
                </button>
              ))}
            </div>
            <div className='articles__search'>
              <label className='sr-only' htmlFor='article-search'>
                {t('articles_search')}
              </label>
              <input
                id='article-search'
                type='search'
                placeholder={t('articles_search_placeholder')}
                value={query}
                maxLength={80}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <p className='articles__count label' aria-live='polite'>
            {count}
          </p>

          {results.length > 0 ? (
            <div className='article-grid'>
              {results.map((a) => (
                <ArticleCard key={`${a.id}-${lang}`} article={a} headingLevel='h2' />
              ))}
            </div>
          ) : (
            <div className='articles__empty'>
              <p>{t('articles_empty')}</p>
              <button
                type='button'
                className='btn'
                onClick={() => {
                  setFilter('all');
                  setQuery('');
                }}
              >
                {t('articles_reset')}
              </button>
            </div>
          )}

          <figure className='pull-quote articles__quote'>
            <blockquote>{t('press_quote')}</blockquote>
            <figcaption>{t('press_quote_cite')}</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
};

export default ArticlesPage;
