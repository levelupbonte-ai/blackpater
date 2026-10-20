import React from 'react';
import '../home/home.css';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Contact } from '../home/sections/Contact';
import { HomeFaq } from '../home/sections/HomeFaq';

export const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className='page'>
      <PageHeader
        crumbs={[{ label: t('nav_home'), to: '/' }, { label: t('nav_contact') }]}
        eyebrow={t('contact_kicker')}
        title={`${t('contact_title_1')} ${t('contact_title_2')}`}
        lead={t('contact_desc')}
      />
      <Contact />
      <HomeFaq />
    </div>
  );
};

export default ContactPage;
