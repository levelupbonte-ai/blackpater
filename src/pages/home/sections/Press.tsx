import React from 'react';
import { Link } from '../../../app/router';
import { useLanguage } from '../../../context/LanguageContext';
import { ARTICLES } from '../../../data/articles';
import { ArticleCard } from '../../../components/ArticleCard';
import { Icon } from '../../../components/Icon';

export const Press: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className='press section' id='press' aria-labelledby='press-title'>
      <div className='wrap'>
        <div className='section-head'>
          <div>
            <p className='eyebrow'>{t('press_kicker')}</p>
            <h2 id='press-title' className='section-head__title'>
              {t('press_title')}
            </h2>
            <p className='lead press__lead'>{t('press_subtitle')}</p>
          </div>
          <Link className='arrow-link' to='/articles'>
            {t('press_all')} ({ARTICLES.length})
            <Icon name='arrowRight' />
          </Link>
        </div>

        <div className='article-grid'>
          {ARTICLES.slice(0, 3).map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>

        <figure className='pull-quote press__quote'>
          <blockquote>{t('press_quote')}</blockquote>
          <figcaption>{t('press_quote_cite')}</figcaption>
        </figure>
      </div>
    </section>
  );
};
