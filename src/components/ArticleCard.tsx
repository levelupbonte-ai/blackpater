import React from 'react';
import type { Article } from '../data/articles';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from './Icon';

export const ArticleCard: React.FC<{ article: Article; headingLevel?: 'h2' | 'h3' }> = ({ article, headingLevel = 'h3' }) => {
  const { lang, t } = useLanguage();
  const H = headingLevel;
  const en = lang === 'en';
  return (
    <article className='article-card'>
      <div className='article-card__meta'>
        <span className='article-card__source'>{en ? article.sourceEn : article.source}</span>
        <span className='article-card__date'>{en ? article.dateEn : article.date}</span>
      </div>
      <H className='article-card__title'>{en ? article.titleEn : article.title}</H>
      <p className='article-card__excerpt'>{en ? article.excerptEn : article.excerpt}</p>
      <div className='article-card__foot'>
        <a className='article-card__link' href={article.url} target='_blank' rel='noopener noreferrer'>
          {en ? article.ctaEn : article.cta}
          <Icon name='arrowUpRight' />
          <span className='sr-only'> {t('opens_new_tab')}</span>
        </a>
      </div>
    </article>
  );
};
