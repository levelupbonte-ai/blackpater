import React from 'react';
import './payment.css';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '../../components/Icon';
import { OFFERS } from '../../../shared/offers.js';

export const CancelledPage: React.FC = () => {
  const { t } = useLanguage();
  const offerPath = OFFERS['accompagnement-voyage'].path;
  return (
    <div className='page pay'>
      <div className='container container--narrow pay__inner'>
        <p className='eyebrow'>{t('pay_kicker')}</p>
        <div className='pay-card pay-card--neutral'>
          <span className='pay-card__icon' aria-hidden='true'>
            <Icon name='info' />
          </span>
          <h1 className='pay-card__title'>{t('pay_cancel_title')}</h1>
          <p className='pay-card__text'>{t('pay_cancel_text')}</p>
          <div className='btn-row pay-card__actions'>
            <Link className='btn btn--primary btn--lg' to={offerPath}>
              {t('pay_resume')}
              <Icon name='arrowRight' />
            </Link>
            <Link className='btn btn--lg' to='/abonnements'>
              {t('pay_back_offer')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelledPage;
