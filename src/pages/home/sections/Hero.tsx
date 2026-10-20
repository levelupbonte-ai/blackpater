import React from 'react';
import { Link } from '../../../app/router';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon, WhatsAppIcon } from '../../../components/Icon';
import { SOCIALS } from '../../../data/socials';
import { CONTACT_EMAIL, whatsappLink } from '../../../lib/contact';
import type { TranslationKey } from '../../../i18n';

const PORTRAIT = '/media/3e0be360f5ad.webp';
const STATS = [1, 2, 3] as const;

export const Hero: React.FC = () => {
  const { t } = useLanguage();
  const k = (s: string) => s as TranslationKey;

  const quoteWords = `« ${t('hero_quote_line1')} ${t('hero_quote_line2')} » — ${t('about_sub')}.`.split(' ');

  return (
    <section className='hero' id='hero' aria-label={t('hero_label')}>
      <div className='container hero__container'>
        <div className='hero__split'>
          {/* Left column: Brand Wordmark, Subtitle, Quote & CTAs */}
          <div className='hero__content'>
            <h1 className='hero__heading hero-anim hero-anim--1'>
              <span className='hero__name brand-wordmark'>
                <span className='brand-b'>Black</span>
                <span className='brand-p'>Pater</span>
              </span>
              <span className='hero__realname'>{t('hero_prof_label')}</span>
            </h1>

            {/* Staggered Word-by-Word Quote Construction */}
            <p className='hero__lead hero-anim hero-anim--2'>
              <span className='word-reveal'>
                {quoteWords.map((w, idx) => (
                  <span
                    key={idx}
                    className='word-reveal__word'
                    style={{ animationDelay: `${0.16 + idx * 0.035}s` }}
                  >
                    {w}{' '}
                  </span>
                ))}
              </span>
            </p>

            <div className='hero__actions hero-anim hero-anim--3'>
              <Link to='/abonnements/accompagnement-voyage' className='btn btn--primary'>
                <span>{t('nav_offers')}</span>
                <Icon name='arrowRight' />
              </Link>
              <Link to='/parcours' className='btn btn--outline'>
                <span>{t('nav_journey')}</span>
              </Link>
              <Link to='/contact' className='btn btn--secondary'>
                <Icon name='mail' />
                <span>{t('nav_contact')}</span>
              </Link>
            </div>

            <div className='hero__socials hero-anim hero-anim--4'>
              {SOCIALS.slice(0, 5).map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hero__social-link'
                  title={`${s.name} (${s.handle})`}
                >
                  <span>{s.name}</span>
                  <Icon name='arrowUpRight' />
                  <span className='sr-only'> {t('opens_new_tab')}</span>
                </a>
              ))}
              <a
                href={whatsappLink(t('wa_contact_message'))}
                target='_blank'
                rel='noopener noreferrer'
                className='hero__social-link'
                title='WhatsApp'
              >
                <WhatsAppIcon />
                <span>WhatsApp</span>
                <span className='sr-only'> {t('opens_new_tab')}</span>
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className='hero__social-link' title={CONTACT_EMAIL}>
                <Icon name='mail' />
                <span>Email</span>
              </a>
            </div>
          </div>

          {/* Right column: Circular framed portrait with clean status pill right below it */}
          <div className='hero__visual hero-anim hero-anim--2'>
            <div className='hero__avatar-wrap'>
              <div className='hero__avatar-ring' aria-hidden='true' />
              <div className='hero__avatar'>
                <img
                  src={PORTRAIT}
                  alt='BlackPater — Jean-Pierre Lofumbwa'
                  width={360}
                  height={360}
                  fetchPriority='high'
                  decoding='async'
                />
              </div>
              <span className='hero__status-pill'>{t('hero_status')}</span>
            </div>
          </div>
        </div>

        {/* Full-width KPI / Key Facts row below the hero split */}
        <dl className='hero__stats' aria-label={t('about_facts_label')}>
          {STATS.map((i) => (
            <div key={i} className='hero__stat-card'>
              <dt className='hero__stat-val'>{t(k(`stat_${i}_num`))}</dt>
              <dd className='hero__stat-txt'>
                <strong>{t(k(`stat_${i}_title`))}</strong>
                <span>{t(k(`stat_${i}_sub`))}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
