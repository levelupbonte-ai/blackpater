import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon, WhatsAppIcon } from '../../../components/Icon';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, whatsappLink } from '../../../lib/contact';

export const Contact: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className='contact' id='contact' aria-labelledby='contact-title'>
      <div className='wrap'>
        <p className='eyebrow'>{t('contact_kicker')}</p>
        <h2 id='contact-title' className='contact__title'>
          <span>{t('contact_title_1')}</span>
          <span>{t('contact_title_2')}</span>
        </h2>

        <div className='contact__grid'>
          <p className='contact__copy'>{t('contact_desc')}</p>
          <div>
            <dl className='clist'>
              <div className='row'>
                <dt className='k'>{t('contact_email_label')}</dt>
                <dd className='v'>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </dd>
              </div>
              <div className='row'>
                <dt className='k'>{t('contact_phone_label')}</dt>
                <dd className='v'>
                  <a href={whatsappLink()} target='_blank' rel='noopener noreferrer'>
                    {WHATSAPP_DISPLAY}
                    <span className='sr-only'> {t('opens_new_tab')}</span>
                  </a>
                </dd>
              </div>
              <div className='row'>
                <dt className='k'>{t('contact_loc_label')}</dt>
                <dd className='v'>{t('contact_loc_val')}</dd>
              </div>
            </dl>

            <a className='wa' href={whatsappLink(t('wa_contact_message'))} target='_blank' rel='noopener noreferrer'>
              <WhatsAppIcon className='wa__logo' />
              <span className='wa__text'>
                <b>{t('contact_wa_title')}</b>
                <small>{t('contact_wa_sub')}</small>
              </span>
              <span className='wa__go' aria-hidden='true'>
                <Icon name='arrowUpRight' />
              </span>
              <span className='sr-only'> {t('opens_new_tab')}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
