import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FAQ_DATA } from '../data/mockData';

export const FaqSection: React.FC = () => {
  const { lang, t } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="faq-section" id="faq" style={{ padding: 'clamp(70px, 9vw, 120px) 0', borderTop: '1px solid var(--bone-faint)' }}>
      <div className="wrap" style={{ maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="label">{t('faq_kicker')}</span>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2.4rem, 6vw, 4.4rem)', textTransform: 'uppercase', color: 'var(--bone)', margin: '10px 0 14px' }}>
            {t('faq_title')}
          </h2>
          <p style={{ color: 'var(--bone-dim)', fontSize: '1.1rem' }}>{t('faq_subtitle')}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIdx === idx;
            const q = lang === 'en' ? item.questionEn : item.question;
            const a = lang === 'en' ? item.answerEn : item.answer;

            return (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--bone-faint)',
                  borderRadius: '10px',
                  background: isOpen ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  overflow: 'hidden',
                  transition: 'background 0.3s ease, border-color 0.3s ease',
                  borderColor: isOpen ? 'rgba(201,138,82,0.4)' : 'var(--bone-faint)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                    gap: '16px',
                    color: isOpen ? 'var(--copper)' : 'var(--bone)',
                    cursor: 'pointer',
                  }}
                  aria-expanded={isOpen}
                >
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)', fontWeight: 500 }}>
                    {q}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.3s ease',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 24px 22px', color: 'var(--bone-dim)', lineHeight: 1.65, fontSize: '0.98rem' }}>
                    <p>{a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
