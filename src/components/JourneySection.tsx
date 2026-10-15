import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const JourneySection: React.FC = () => {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: t('journey_step_1_num'),
      title: t('journey_step_1_title'),
      lead: t('journey_step_1_lead'),
      desc: t('journey_step_1_desc'),
      image: '/media/fe552333c4cd.webp',
      glow: 'rgba(27, 111, 214, 0.35)',
    },
    {
      num: t('journey_step_2_num'),
      title: t('journey_step_2_title'),
      lead: t('journey_step_2_lead'),
      desc: t('journey_step_2_desc'),
      image: '/media/0e1ee5dff864.webp',
      glow: 'rgba(201, 138, 82, 0.35)',
    },
    {
      num: t('journey_step_3_num'),
      title: t('journey_step_3_title'),
      lead: t('journey_step_3_lead'),
      desc: t('journey_step_3_desc'),
      image: '/media/50471a19bc72.webp',
      glow: 'rgba(110, 20, 35, 0.4)',
    },
  ];

  return (
    <section className="jny" id="journey" aria-labelledby="journeyTitle">
      <div className="wrap">
        <div className="jny__h">
          <div>
            <span className="label">{t('journey_kicker')}</span>
            <h2 id="journeyTitle">{t('journey_title')}</h2>
            <div className="jtri">
              <i />
              <i />
              <i />
            </div>
          </div>
          <p>{t('journey_subtitle')}</p>
        </div>

        {/* Step Selector Tabs */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '36px', flexWrap: 'wrap' }}>
          {steps.map((st, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStep(idx)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: activeStep === idx ? '1px solid var(--copper)' : '1px solid var(--bone-faint)',
                background: activeStep === idx ? 'rgba(201,138,82,0.14)' : 'rgba(255,255,255,0.02)',
                color: activeStep === idx ? 'var(--copper)' : 'var(--bone-dim)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              {st.num}
            </button>
          ))}
        </div>

        {/* Current Active Step Card */}
        <div className="jrow" style={{ borderBottom: '1px solid var(--bone-faint)' }}>
          <div className="jart" style={{ background: `radial-gradient(circle, ${steps[activeStep].glow}, #150e0d)` }}>
            <div
              className="im"
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${steps[activeStep].image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'grayscale(0.15) contrast(1.05)',
                transition: 'background-image 0.5s ease',
              }}
            />
          </div>

          <div className="jtxt">
            <span className="jnum">{steps[activeStep].num}</span>
            <span className="jbig">{steps[activeStep].title}</span>
            <h3>{steps[activeStep].lead}</h3>
            <p>{steps[activeStep].desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
