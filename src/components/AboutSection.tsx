import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const AboutSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="about" id="about" aria-labelledby="aboutTitle">
      <div className="wrap">
        <div className="about__grid">
          {/* Left Column (Sticky Title & Image) */}
          <div className="about__left">
            <h2 id="aboutTitle" className="about__title">
              <span>{t('about_title_1')}</span>
              <span>{t('about_title_2')}</span>
            </h2>

            <figure className="about__photo">
              <div
                className="im"
                style={{ backgroundImage: 'url(/media/db4bf6a012c1.webp)' }}
              />
              <figcaption>{t('about_sub')}</figcaption>
            </figure>
          </div>

          {/* Right Column (Bio, Roles, Mix List, Stats) */}
          <div className="about__right">
            <p className="about__lead">{t('about_lead')}</p>

            <div className="about__roles">
              <div>
                <p>
                  <b>{t('about_role_1_title')}</b>
                  {t('about_role_1_desc')}
                </p>
              </div>
              <div>
                <p>
                  <b>{t('about_role_2_title')}</b>
                  {t('about_role_2_desc')}
                </p>
              </div>
              <div>
                <p>
                  <b>{t('about_role_3_title')}</b>
                  {t('about_role_3_desc')}
                </p>
              </div>
              <div>
                <p>
                  <b>{t('about_role_4_title')}</b>
                  {t('about_role_4_desc')}
                </p>
              </div>
            </div>

            {/* Interactive Mix List */}
            <div className="mix">
              <div className="mix__intro">
                <span className="label">LES FONDATIONS DU PROJET</span>
                <div className="rule in" />
              </div>

              <ul>
                <li>
                  <h3>{t('about_mix_1')}</h3>
                  <p>{t('about_mix_1_sub')}</p>
                </li>
                <li>
                  <h3>{t('about_mix_2')}</h3>
                  <p>{t('about_mix_2_sub')}</p>
                </li>
                <li>
                  <h3>{t('about_mix_3')}</h3>
                  <p>{t('about_mix_3_sub')}</p>
                </li>
                <li>
                  <h3>{t('about_mix_4')}</h3>
                  <p>{t('about_mix_4_sub')}</p>
                </li>
              </ul>
            </div>

            {/* 3 Key Metric Stats */}
            <div className="stats">
              <div>
                <span className="stats__val">{t('stat_1_num')}</span>
                <div className="stats__txt">
                  <b>{t('stat_1_title')}</b>
                  <span>{t('stat_1_sub')}</span>
                </div>
              </div>
              <div>
                <span className="stats__val">{t('stat_2_num')}</span>
                <div className="stats__txt">
                  <b>{t('stat_2_title')}</b>
                  <span>{t('stat_2_sub')}</span>
                </div>
              </div>
              <div>
                <span className="stats__val">{t('stat_3_num')}</span>
                <div className="stats__txt">
                  <b>{t('stat_3_title')}</b>
                  <span>{t('stat_3_sub')}</span>
                </div>
              </div>
            </div>

            {/* Bridge */}
            <div className="bridge">
              <span className="tri">
                <i />
                <i />
                <i />
              </span>
              <p>
                De la République Démocratique du Congo aux montagnes de l’Utah,
                une voix authentique qui unit la diaspora et forme la nouvelle génération.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
