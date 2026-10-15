import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const AbonnementsPage: React.FC = () => {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        setPaymentSuccess(true);
      }
    }
  }, []);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (data.status === 'success' && data.url) {
        window.location.href = data.url;
      } else if (data.status === 'pending_keys' || data.fallbackUrl) {
        // Stripe waiting for live secret key: seamlessly connect to WhatsApp
        const fallback =
          data.fallbackUrl ||
          `https://wa.me/17205490926?text=${encodeURIComponent(
            `Bonjour Jean-Pierre, je m'appelle ${name} (${email}) et je souhaite souscrire à l'offre à 1$ (Accompagnement Voyage).`
          )}`;
        window.location.href = fallback;
      } else {
        setErrorMsg(data.message || 'Une erreur est survenue lors de l’initialisation.');
      }
    } catch (err: any) {
      // Network or connection error: direct to WhatsApp
      const fallback = `https://wa.me/17205490926?text=${encodeURIComponent(
        `Bonjour Jean-Pierre, je m'appelle ${name} (${email}) et je souhaite souscrire à l'offre à 1$ (Accompagnement Voyage).`
      )}`;
      window.location.href = fallback;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 'calc(var(--nav-h) + 20px)', minHeight: '100vh', background: 'var(--ink)' }}>
      <section className="page-hero" style={{ padding: 'clamp(50px, 8vw, 90px) 0 clamp(40px, 6vw, 60px)', textAlign: 'center', position: 'relative' }}>
        <div className="wrap">
          <span className="label" style={{ color: 'var(--copper)', letterSpacing: '0.2em' }}>
            {t('sub_overline')}
          </span>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 0.95, margin: '14px 0 18px' }}>
            {t('sub_title')}
          </h1>
          <p style={{ color: 'var(--bone-dim)', fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', maxWidth: '760px', margin: '0 auto', lineHeight: 1.6 }}>
            {t('sub_desc')}
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: '100px' }}>
        <div className="wrap" style={{ maxWidth: '820px' }}>
          {/* Payment Success Alert */}
          {paymentSuccess && (
            <div style={{ background: 'rgba(201,138,82,0.12)', border: '1px solid var(--copper)', borderRadius: '10px', padding: '24px', marginBottom: '32px', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: '2.2rem', textTransform: 'uppercase', color: 'var(--copper)', marginBottom: '8px' }}>
                {t('sub_alert_title')}
              </h3>
              <p style={{ color: 'var(--bone)', fontSize: '1rem', marginBottom: '20px', lineHeight: 1.5 }}>
                {t('sub_alert_desc')}
              </p>
              <a
                href="https://wa.me/17205490926?text=Bonjour%20Jean-Pierre,%20mon%20paiement%20a%20%C3%A9t%C3%A9%20confirm%C3%A9.%20Je%20souhaite%20d%C3%A9marrer%20mon%20accompagnement."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-executive btn-executive--primary"
                style={{ display: 'inline-flex', padding: '14px 28px', fontSize: '1.05rem', margin: '0 auto' }}
              >
                {t('sub_alert_btn')}
              </a>
            </div>
          )}

          {/* Main Card: $1 Offer */}
          <div className="sub-card sub-card--featured" style={{ background: 'rgba(23, 19, 17, 0.85)', padding: 'clamp(32px, 5vw, 48px)' }}>
            <span className="label" style={{ color: 'var(--copper)', marginBottom: '10px', display: 'block' }}>OFFRE OFFICIELLE DE LANCEMENT</span>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)', textTransform: 'uppercase', color: '#fff', marginBottom: '12px', lineHeight: 1 }}>
              {t('sub_card_title')}
            </h2>
            <p style={{ fontSize: '1.02rem', color: 'var(--bone-dim)', lineHeight: 1.6, marginBottom: '28px' }}>
              {t('sub_card_desc')}
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(239, 232, 220, 0.1)' }}>
              <span style={{ fontFamily: 'var(--display)', fontSize: 'clamp(4rem, 8vw, 5.5rem)', lineHeight: 0.85, color: 'var(--copper)', fontWeight: 700 }}>
                {t('sub_price')}
              </span>
              <span style={{ fontSize: '1.1rem', color: 'var(--bone-dim)' }}>{t('sub_period')}</span>
            </div>

            <ul className="sub-card__list" style={{ gap: '14px', marginBottom: '36px' }}>
              <li className="sub-card__item">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2.5" stroke="currentColor" fill="none" /></svg>
                <span><b>Informations vérifiées</b> sur les démarches administratives, consulaires et visas (F-1, B1/B2, etc.)</span>
              </li>
              <li className="sub-card__item">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2.5" stroke="currentColor" fill="none" /></svg>
                <span><b>Veille stratégique</b> sur les bourses d'études et programmes d'échanges internationaux</span>
              </li>
              <li className="sub-card__item">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2.5" stroke="currentColor" fill="none" /></svg>
                <span><b>Guide des erreurs éliminatoires</b> à éviter absolument lors du montage de dossier et de l’entretien</span>
              </li>
              <li className="sub-card__item">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2.5" stroke="currentColor" fill="none" /></svg>
                <span><b>Conseils réalistes de terrain</b> : coût réel de la vie, logement, transport et choc culturel aux USA / Utah</span>
              </li>
              <li className="sub-card__item">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2.5" stroke="currentColor" fill="none" /></svg>
                <span><b>Orientation académique</b> : équivalences de diplômes, admissions universitaires et méthodologie de réussite</span>
              </li>
              <li className="sub-card__item">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2.5" stroke="currentColor" fill="none" /></svg>
                <span><b>Ligne WhatsApp VIP prioritaire</b> avec l'équipe de Jean-Pierre Lofumbwa pour un suivi sans intermédiaire douteux</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="sub-card__btn sub-card__btn--primary"
              style={{ fontSize: '1.2rem', padding: '16px 24px', cursor: 'pointer' }}
              data-cursor="CHOISIR"
            >
              {t('sub_btn')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <a
                href="https://wa.me/17205490926?text=Bonjour%20Jean-Pierre,%20j'aimerais%20des%20informations%20sur%20l'offre%20d'accompagnement%20%C3%A0%201$."
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--bone-dim)', fontSize: '0.92rem', textDecoration: 'underline', textUnderlineOffset: '4px' }}
                data-cursor="WHATSAPP"
              >
                {t('sub_wa_consult')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {modalOpen && (
        <div
          id="stripeModal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#171311',
              border: '1px solid rgba(201,138,82,0.4)',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '32px',
              position: 'relative',
              color: 'var(--bone)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                right: '18px',
                top: '18px',
                fontSize: '1.8rem',
                color: 'var(--bone-dim)',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                lineHeight: 1,
              }}
              aria-label="Fermer"
            >
              &times;
            </button>

            <h3 style={{ fontFamily: 'var(--display)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '8px', color: '#fff' }}>
              Adhésion au Programme — $1
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--bone-dim)', lineHeight: 1.5, marginBottom: '24px' }}>
              Renseignez vos coordonnées pour finaliser votre accès immédiat à l'accompagnement de Jean-Pierre Lofumbwa.
            </p>

            {errorMsg && (
              <div style={{ background: 'rgba(206,17,38,0.2)', border: '1px solid #ce1126', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', color: '#fff', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--bone-dim)', marginBottom: '6px' }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Jean-Pierre Mwamba"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,232,220,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--bone-dim)', marginBottom: '6px' }}>
                  Adresse Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,232,220,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sub-card__btn sub-card__btn--primary"
                style={{ width: '100%', padding: '14px', fontSize: '1.05rem', cursor: loading ? 'wait' : 'pointer' }}
              >
                {loading ? 'Connexion en cours...' : 'Valider & Payer — $1'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--bone-dim)' }}>
              <a
                href={`https://wa.me/17205490926?text=${encodeURIComponent(`Bonjour Jean-Pierre, je m'appelle ${name || 'un abonné'} et je souhaite finaliser mon adhésion au programme d'accompagnement à 1$.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--copper)', textDecoration: 'underline' }}
              >
                Ou finaliser directement sur WhatsApp ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
