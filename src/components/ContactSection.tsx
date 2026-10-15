import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const ContactSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="contact" id="contact" aria-labelledby="contactTitle">
      <div className="wrap">
        <h2 id="contactTitle">
          <span>CONTACTEZ</span>
          <span>MOI</span>
        </h2>

        <div className="contact__grid">
          <p className="contact__copy">{t('contact_desc')}</p>

          <div className="contact__links">
            <div className="clist">
              <a className="row" href="mailto:lofumbwapater@gmail.com">
                <span className="k">{t('contact_email_label')}</span>
                <span className="v">lofumbwapater@gmail.com</span>
              </a>

              <a
                className="row"
                href="https://wa.me/17205490926"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="WHATSAPP"
              >
                <span className="k">{t('contact_phone_label')}</span>
                <span className="v">+1 720 549 0926</span>
              </a>

              <div className="row">
                <span className="k">{t('contact_loc_label')}</span>
                <span className="v">{t('contact_loc_val')}</span>
              </div>
            </div>

            {/* Direct WhatsApp Callout Banner */}
            <a
              href="https://wa.me/17205490926?text=Bonjour%20Jean-Pierre,%20j'ai%20d%C3%A9couvert%20votre%20site%20officiel%20et%20je%20souhaite%20entrer%20en%20contact%20avec%20vous."
              target="_blank"
              rel="noopener noreferrer"
              className="wa"
              data-cursor="WHATSAPP"
            >
              <svg className="l" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
              </svg>
              <div>
                <b>Démarrer un échange sur WhatsApp</b>
                <small>Canal prioritaire vérifié · Réponse assurée</small>
              </div>
              <div className="go">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
