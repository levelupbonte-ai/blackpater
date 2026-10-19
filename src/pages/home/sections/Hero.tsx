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

  return (
    <section className='hero' id='hero' aria-label={t('hero_label')}>
      <div className='container hero__container'>
        <div className='hero__split'>
          {/* Left column: Brand Wordmark, Role, CTAs & social links */}
          <div className='hero__content'>
            <h1 className='hero__heading'>
              <span className='hero__name brand-wordmark'>
                <span className='brand-b'>Black</span>
                <span className='brand-p'>Pater</span>
              </span>
              <span className='hero__realname'>{t('hero_prof_label')}</span>
            </h1>

            <p className='hero__role-gradient'>{t('hero_status')}</p>

            <p className='hero__lead'>
              « {t('hero_quote_line1')} {t('hero_quote_line2')} » — {t('about_sub')}.
            </p>

            <div className='hero__actions'>
              <Link to='/abonnements/accompagnement-voyage' className='btn btn--primary'>
                <span>{t('nav_offers')}</span>
                <Icon name='arrowRight' />
              </Link>
              <Link to='/articles' className='btn btn--outline'>
                <span>{t('entry_articles_title')}</span>
              </Link>
              <Link to='/#contact' className='btn btn--secondary'>
                <Icon name='mail' />
                <span>{t('nav_contact')}</span>
              </Link>
            </div>

            <div className='hero__socials'>
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

          {/* Right column: Circular framed portrait */}
          <div className='hero__visual'>
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
                <div className='hero__avatar-overlay' aria-hidden='true' />
              </div>
              <div className='hero__avatar-caption'>
                <Icon name='globe' />
                <span>{t('hero_status')}</span>
              </div>
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

        <div className='hero__scroll-down'>
          <a href='#about' aria-label={t('hero_scroll')}>
            <span>{t('hero_scroll')}</span>
            <Icon name='arrowDown' />
          </a>
        </div>
      </div>
    </section>
  );
};
