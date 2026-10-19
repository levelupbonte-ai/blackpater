import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon, WhatsAppIcon } from '../../../components/Icon';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, whatsappLink } from '../../../lib/contact';
import { SOCIALS } from '../../../data/socials';

export const Contact: React.FC = () => {
  const { lang, t } = useLanguage();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const composedText = () => {
    const base = message.trim() || t('wa_contact_message');
    const parts: string[] = [];
    if (name.trim()) parts.push(lang === 'fr' ? `Nom : ${name.trim()}` : `Name: ${name.trim()}`);
    if (subject.trim()) parts.push(lang === 'fr' ? `Objet : ${subject.trim()}` : `Subject: ${subject.trim()}`);
    parts.push(base);
    return parts.join('\n');
  };

  const onSubmitWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = whatsappLink(composedText());
  };

  const mailtoHref = () => {
    const subj = encodeURIComponent(subject.trim() || 'Contact — Black Pater');
    const body = encodeURIComponent(composedText());
    return `mailto:${CONTACT_EMAIL}?subject=${subj}&body=${body}`;
  };

  return (
    <section className='contact section' id='contact' aria-labelledby='contact-title'>
      <div className='container'>
        <div className='section-header-center'>
          <p className='eyebrow'>{t('contact_kicker')}</p>
          <h2 id='contact-title' className='section-title'>
            {t('contact_title_1')} {t('contact_title_2')}
          </h2>
          <p className='section-subtitle'>{t('contact_desc')}</p>
        </div>

        <div className='contact__grid'>
          {/* Left column: Contact details & direct WhatsApp card */}
          <div className='contact__info-card'>
            <h3 className='contact__card-title'>{t('contact_kicker')}</h3>
            <p className='contact__copy'>{t('contact_desc')}</p>

            <dl className='clist'>
              <div className='clist__item'>
                <span className='clist__icon' aria-hidden='true'>
                  <Icon name='mail' />
                </span>
                <div>
                  <dt className='k'>{t('contact_email_label')}</dt>
                  <dd className='v'>
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                  </dd>
                </div>
              </div>

              <div className='clist__item'>
                <span className='clist__icon' aria-hidden='true'>
                  <Icon name='phone' />
                </span>
                <div>
                  <dt className='k'>{t('contact_phone_label')}</dt>
                  <dd className='v'>
                    <a href={whatsappLink()} target='_blank' rel='noopener noreferrer'>
                      {WHATSAPP_DISPLAY}
                      <span className='sr-only'> {t('opens_new_tab')}</span>
                    </a>
                  </dd>
                </div>
              </div>

              <div className='clist__item'>
                <span className='clist__icon' aria-hidden='true'>
                  <Icon name='mapPin' />
                </span>
                <div>
                  <dt className='k'>{t('contact_loc_label')}</dt>
                  <dd className='v'>{t('contact_loc_val')}</dd>
                </div>
              </div>
            </dl>

            <div className='contact__socials'>
              {SOCIALS.slice(0, 6).map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='contact__social-pill'
                >
                  <span>{s.name}</span>
                  <Icon name='arrowUpRight' />
                  <span className='sr-only'> {t('opens_new_tab')}</span>
                </a>
              ))}
            </div>

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

          {/* Right column: Direct message form (opens WhatsApp or Official Email) */}
          <form className='contact__form-card' onSubmit={onSubmitWhatsApp}>
            <h3 className='contact__card-title'>
              {lang === 'fr' ? 'Envoyer un message direct' : 'Send a direct message'}
            </h3>

            <div className='cform__group'>
              <label htmlFor='contact-name' className='cform__label'>
                {lang === 'fr' ? 'Votre nom' : 'Your name'}
              </label>
              <input
                id='contact-name'
                type='text'
                className='cform__input'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === 'fr' ? 'Ex. : Patrick Kabongo' : 'e.g. Patrick Kabongo'}
              />
            </div>

            <div className='cform__group'>
              <label htmlFor='contact-subject' className='cform__label'>
                {lang === 'fr' ? 'Sujet' : 'Subject'}
              </label>
              <input
                id='contact-subject'
                type='text'
                className='cform__input'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  lang === 'fr'
                    ? 'Accompagnement voyage, conférence, média…'
                    : 'Travel guidance, speaking, media…'
                }
              />
            </div>

            <div className='cform__group'>
              <label htmlFor='contact-msg' className='cform__label'>
                {lang === 'fr' ? 'Votre message' : 'Your message'}
              </label>
              <textarea
                id='contact-msg'
                rows={4}
                className='cform__textarea'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('phone_wa_placeholder')}
              />
            </div>

            <div className='cform__actions'>
              <button type='submit' className='btn btn--primary'>
                <WhatsAppIcon />
                <span>{t('phone_wa_send')}</span>
              </button>
              <a href={mailtoHref()} className='btn btn--outline'>
                <Icon name='mail' />
                <span>{t('contact_email_label')}</span>
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
