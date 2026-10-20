import React from 'react';
import '../home/home.css';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import { Journey } from '../home/sections/Journey';
import { CoverFlow } from '../home/sections/CoverFlow';

export const ParcoursPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className='page'>
      <PageHeader
        breadcrumbs={[{ label: t('nav_home'), to: '/' }, { label: t('nav_journey') }]}
        eyebrow={t('journey_kicker')}
        title={t('journey_title')}
        lead={t('journey_subtitle')}
        actions={
          <>
            <Link className='btn btn--primary' to='/abonnements/accompagnement-voyage'>
              <span>{t('nav_offers')}</span>
              <Icon name='arrowRight' />
            </Link>
            <Link className='btn btn--outline' to='/contact'>
              <span>{t('nav_contact')}</span>
            </Link>
          </>
        }
      />
      <Journey />
      <CoverFlow />
    </div>
  );
};

export default ParcoursPage;
