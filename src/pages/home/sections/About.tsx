import React, { useEffect, useRef, useState } from 'react';
import { Link } from '../../../app/router';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon } from '../../../components/Icon';
import type { TranslationKey } from '../../../i18n';

const ROLES = [1, 2, 3, 4] as const;
const MIX = [
  { id: 1, pct: 98 },
  { id: 2, pct: 96 },
  { id: 3, pct: 94 },
  { id: 4, pct: 95 }
] as const;

export const About: React.FC = () => {
  const { t } = useLanguage();
  const k = (s: string) => s as TranslationKey;
  const skillsRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = skillsRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className='about section' id='about' aria-labelledby='about-title'>
      <div className='container'>
        <div className='section-header-center'>
          <p className='eyebrow'>{t('about_kicker')}</p>
          <h2 id='about-title' className='section-title'>
            {t('about_title_1')} {t('about_title_2')}
          </h2>
          <p className='section-subtitle'>{t('about_sub')}</p>
        </div>

        <div className='about__grid'>
          {/* Left column: Biography, Portrait & Bridge */}
          <div className='about__bio-col'>
            <div className='about__profile-card'>
              <figure className='about__photo'>
                <img
                  src='/media/db4bf6a012c1.webp'
                  alt='Jean-Pierre Lofumbwa — Black Pater'
                  width={420}
                  height={525}
                  loading='lazy'
                  decoding='async'
                />
                <figcaption>{t('about_sub')}</figcaption>
              </figure>
              <div className='about__narrative'>
                <blockquote className='about__lead'>{t('about_lead')}</blockquote>
                <p className='about__bridge-text'>{t('about_bridge')}</p>
              </div>
              <div className='btn-row'>
                <Link to='/parcours' className='btn btn--outline'>
                  <span>{t('nav_journey')}</span>
                  <Icon name='arrowRight' />
                </Link>
                <Link to='/medias' className='btn btn--secondary'>
                  <span>{t('nav_socials')}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right column: Key Expertise (ChevronRight items) + Animated Pillars (SkillProgress) */}
          <div className='about__expertise-col'>
            <div className='about__card'>
              <h3 className='about__card-title'>{t('about_kicker')}</h3>
              <ul className='about__roles'>
                {ROLES.map((i) => (
                  <li key={i} className='about__role-item'>
                    <span className='about__role-icon' aria-hidden='true'>
                      <Icon name='chevronRight' />
                    </span>
                    <div>
                      <h4>{t(k(`about_role_${i}_title`))}</h4>
                      <p>{t(k(`about_role_${i}_desc`))}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div ref={skillsRef} className='about__card about__skills-card'>
              <h3 className='about__card-title'>{t('about_mix_intro')}</h3>
              <ul className='skill-bars'>
                {MIX.map(({ id, pct }) => (
                  <li key={id} className='skill-bar'>
                    <div className='skill-bar__head'>
                      <span className='skill-bar__name'>{t(k(`about_mix_${id}`))}</span>
                      <span className='skill-bar__meta'>
                        {t(k(`about_mix_${id}_sub`))} · <strong>{pct}%</strong>
                      </span>
                    </div>
                    <div className='skill-bar__track' aria-hidden='true'>
                      <div
                        className='skill-bar__fill'
                        style={{ width: inView ? `${pct}%` : '0%' }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
