import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ExecutiveButtonsProps {
  onNavigate: (path: string) => void;
}

export const ExecutiveButtons: React.FC<ExecutiveButtonsProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <section className="hub-actions" aria-label="Quick Actions">
      <div className="hub-actions__wrap">
        {/* Primary Action Button: Abonnements ($1 Offer) */}
        <a
          href="/abonnements"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/abonnements');
          }}
          className="btn-executive btn-executive--primary"
          data-cursor="S'abonner"
        >
          <div className="btn-executive__spark" />
          <div className="btn-executive__content">
            <span className="btn-executive__main">{t('btn_subs_title')}</span>
            <span className="btn-executive__sub">{t('btn_subs_sub')}</span>
          </div>
          <div className="btn-executive__icon-wrap">
            <svg
              className="btn-executive__arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </a>

        {/* Secondary Action Button: Articles & Press */}
        <a
          href="/articles"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/articles');
          }}
          className="btn-executive btn-executive--outline"
          data-cursor="Lire les guides"
        >
          <div className="btn-executive__spark" />
          <div className="btn-executive__content">
            <span className="btn-executive__main">{t('btn_articles_title')}</span>
            <span className="btn-executive__sub">{t('btn_articles_sub')}</span>
          </div>
          <div className="btn-executive__icon-wrap">
            <svg
              className="btn-executive__arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </a>
      </div>
    </section>
  );
};
