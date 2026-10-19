import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { SOCIALS } from '../../../data/socials';
import { Icon } from '../../../components/Icon';

export const Socials: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className='soc section' id='socials' aria-labelledby='soc-title'>
      <div className='container'>
        <div className='section-header-center'>
          <p className='eyebrow'>{t('soc_kicker')}</p>
          <h2 id='soc-title' className='section-title'>
            {t('soc_title_1')} {t('soc_title_2')}
          </h2>
        </div>

        <ul className='soc__grid'>
          {SOCIALS.map((s) => (
            <li key={s.id} className={s.wide ? 'is-wide' : undefined}>
              <a className='scard' href={s.url} target='_blank' rel='noopener noreferrer' style={{ '--b': s.color } as React.CSSProperties}>
                <div className='scard__top'>
                  <span className='scard__badge'>{t(s.badge)}</span>
                  <span className='scard__arrow' aria-hidden='true'>
                    <Icon name='arrowUpRight' />
                  </span>
                </div>
                <span className='scard__bot'>
                  <span className='scard__name'>{s.name}</span>
                  <span className='scard__handle'>{s.handle}</span>
                </span>
                <span className='sr-only'> {t('opens_new_tab')}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
