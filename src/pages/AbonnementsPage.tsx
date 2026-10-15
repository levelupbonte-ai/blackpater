import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const AbonnementsPage: React.FC = () => {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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
      const endpoint =
        paymentMethod === 'card'
          ? '/api/stripe/create-checkout-session'
          : '/api/mobile-money/create-session';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Non-JSON response from checkout endpoint:', parseErr);
      }

      if (data && data.status === 'success' && data.url) {
        window.location.href = data.url;
      } else if (data && data.status === 'pending_keys') {
        setErrorMsg(
          data.message ||
            'La passerelle de paiement en ligne est en cours de configuration sur le serveur. Veuillez réessayer dans quelques instants.'
        );
      } else if (data && data.status === 'error') {
        setErrorMsg(data.message || 'Une erreur est survenue lors de la création de la session de paiement.');
      } else if (!res.ok) {
        setErrorMsg(`Erreur serveur (${res.status}). Veuillez vérifier la configuration et réessayer.`);
      } else {
        setErrorMsg(data?.message || 'Une erreur est survenue lors de l’initialisation du paiement.');
      }
    } catch (err: any) {
      console.error('Checkout fetch error:', err);
      setErrorMsg('Impossible de joindre le serveur de paiement. Veuillez vérifier votre connexion.');
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
                href="/contact"
                className="btn-executive btn-executive--primary"
                style={{ display: 'inline-flex', padding: '14px 28px', fontSize: '1.05rem', margin: '0 auto' }}
              >
                Accéder à mon espace VIP &rarr;
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
                <span><b>Accès VIP direct</b> à l'accompagnement personnalisé de Jean-Pierre Lofumbwa</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setModalOpen(true);
              }}
              className="sub-card__btn sub-card__btn--primary"
              style={{ fontSize: '1.2rem', padding: '16px 24px', cursor: 'pointer', width: '100%' }}
              data-cursor="PAYER"
            >
              SOUSCRIRE EN LIGNE POUR 1$
            </button>

            {/* Supported Payment Badges */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(239, 232, 220, 0.08)', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--bone-dim)', marginBottom: '10px' }}>
                Paiement 100% en ligne disponible
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '4px 10px', fontSize: '0.78rem', color: '#fff' }}>
                  💳 Cartes Visa / Mastercard
                </span>
                <span style={{ background: 'rgba(255,102,0,0.12)', border: '1px solid rgba(255,102,0,0.4)', borderRadius: '4px', padding: '4px 10px', fontSize: '0.78rem', color: '#ff8533' }}>
                  🟠 Orange Money
                </span>
                <span style={{ background: 'rgba(255,204,0,0.12)', border: '1px solid rgba(255,204,0,0.4)', borderRadius: '4px', padding: '4px 10px', fontSize: '0.78rem', color: '#ffd633' }}>
                  🟡 MTN Mobile Money
                </span>
                <span style={{ background: 'rgba(255,0,0,0.12)', border: '1px solid rgba(255,0,0,0.4)', borderRadius: '4px', padding: '4px 10px', fontSize: '0.78rem', color: '#ff6666' }}>
                  🔴 Airtel Money
                </span>
                <span style={{ background: 'rgba(0,153,255,0.12)', border: '1px solid rgba(0,153,255,0.4)', borderRadius: '4px', padding: '4px 10px', fontSize: '0.78rem', color: '#66b2ff' }}>
                  🔵 Vodacom M-Pesa / Wave
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 100% Online Checkout Modal */}
      {modalOpen && (
        <div
          id="checkoutModal"
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
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: 'clamp(24px, 5vw, 36px)',
              position: 'relative',
              color: 'var(--bone)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
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

            <span className="label" style={{ color: 'var(--copper)', letterSpacing: '0.14em', marginBottom: '6px', display: 'block', fontSize: '0.76rem' }}>
              PAIEMENT 100% EN LIGNE SÉCURISÉ
            </span>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '8px', color: '#fff' }}>
              Adhésion au Programme — $1
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--bone-dim)', lineHeight: 1.5, marginBottom: '20px' }}>
              Choisissez votre méthode de paiement pour ouvrir votre session en direct.
            </p>

            {/* Payment Method Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: paymentMethod === 'card' ? '2px solid var(--copper)' : '1px solid rgba(239,232,220,0.15)',
                  background: paymentMethod === 'card' ? 'rgba(201,138,82,0.18)' : 'rgba(255,255,255,0.03)',
                  color: paymentMethod === 'card' ? '#fff' : 'var(--bone-dim)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '3px' }}>
                  💳 Carte Bancaire
                </div>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>
                  Visa, Mastercard, Apple Pay, Google Pay
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mobile_money')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: paymentMethod === 'mobile_money' ? '2px solid var(--copper)' : '1px solid rgba(239,232,220,0.15)',
                  background: paymentMethod === 'mobile_money' ? 'rgba(201,138,82,0.18)' : 'rgba(255,255,255,0.03)',
                  color: paymentMethod === 'mobile_money' ? '#fff' : 'var(--bone-dim)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '3px' }}>
                  📱 Mobile Money Afrique
                </div>
                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>
                  Orange Money, MTN, Airtel, M-Pesa, Wave
                </div>
              </button>
            </div>

            {/* Method Details Notice */}
            {paymentMethod === 'mobile_money' && (
              <div style={{ background: 'rgba(201,138,82,0.08)', border: '1px solid rgba(201,138,82,0.25)', borderRadius: '8px', padding: '12px 14px', fontSize: '0.82rem', color: 'var(--bone)', marginBottom: '18px', lineHeight: 1.45 }}>
                <span style={{ fontWeight: 600, color: 'var(--copper)' }}>Réseaux acceptés : </span>
                Orange Money (RDC, CI, SN, etc.), MTN MoMo, Airtel Money, Vodacom M-Pesa et Wave. Vous recevrez la notification push sur votre téléphone.
              </div>
            )}

            {errorMsg && (
              <div style={{ background: 'rgba(206,17,38,0.2)', border: '1px solid #ce1126', padding: '12px 14px', borderRadius: '8px', fontSize: '0.86rem', color: '#fff', marginBottom: '16px', lineHeight: 1.4 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--bone-dim)', marginBottom: '6px' }}>
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
                <label style={{ display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--bone-dim)', marginBottom: '6px' }}>
                  Adresse Email (pour recevoir le reçu & l'accès)
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

              {paymentMethod === 'mobile_money' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--bone-dim)', marginBottom: '6px' }}>
                    Numéro de téléphone Mobile Money (optionnel)
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex : +243 81 234 5678 ou 0812345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,232,220,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="sub-card__btn sub-card__btn--primary"
                style={{ width: '100%', padding: '14px', fontSize: '1.05rem', cursor: loading ? 'wait' : 'pointer', marginTop: '6px' }}
              >
                {loading
                  ? 'Redirection vers le paiement en cours...'
                  : paymentMethod === 'card'
                  ? 'Payer 1$ en ligne par Carte (Stripe)'
                  : 'Payer 1$ en ligne par Mobile Money'}
              </button>
            </form>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', marginTop: '16px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--copper)', marginBottom: '6px' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                <span>Sécurité Bancaire Maximale Certifiée (PCI-DSS Niveau 1)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--bone-dim)', lineHeight: 1.45 }}>
                Chiffrement militaire AES-256 bits • Validation directe par notification OTP sur votre téléphone auprès de votre opérateur (Orange, MTN, Airtel, Wave) • Aucune coordonnée confidentielle n’est stockée.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
