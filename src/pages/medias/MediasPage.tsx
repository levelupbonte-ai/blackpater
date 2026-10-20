import React from 'react';
import '../home/home.css';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import { Socials } from '../home/sections/Socials';
import { DigitalPresence } from '../home/sections/DigitalPresence';

export const MediasPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className='page'>
      <PageHeader
        crumbs={[{ label: t('nav_home'), to: '/' }, { label: t('nav_socials') }]}
        eyebrow={t('soc_kicker')}
        title={`${t('soc_title_1')} ${t('soc_title_2')}`}
        lead={t('phone_subtitle')}
        actions={
          <>
            <Link className='btn btn--primary' to='/articles'>
              <span>{t('nav_articles')}</span>
              <Icon name='arrowRight' />
            </Link>
            <Link className='btn btn--outline' to='/contact'>
              <span>{t('nav_contact')}</span>
            </Link>
          </>
        }
      />
      <Socials />
      <DigitalPresence />
    </div>
  );
};

export default MediasPage;
