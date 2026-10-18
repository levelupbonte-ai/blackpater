import React from 'react';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';

export const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className='page'>
      <PageHeader
        eyebrow='404'
        title={t('notfound_title')}
        lead={t('notfound_lead')}
        actions={
          <Link className='btn btn--primary btn--lg' to='/'>
            <Icon name='arrowLeft' />
            {t('notfound_home')}
          </Link>
        }
      />
    </div>
  );
};

export default NotFoundPage;
