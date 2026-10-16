import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface CountryZone {
  id: string;
  label: string;
  flag: string;
  method: 'card' | 'mobile_money';
  currencyText: string;
  networks: string;
}

const COUNTRY_OPTIONS: CountryZone[] = [
  {
    id: 'international',
    label: 'Europe, Amérique du Nord & Reste du monde',
    flag: '🌐',
    method: 'card',
    currencyText: '$1 USD',
    networks: 'Visa, Mastercard, American Express, Apple Pay, Google Pay',
  },
  {
    id: 'ci_sn_uemoa',
    label: "Afrique de l'Ouest (Côte d'Ivoire, Sénégal, Bénin, Togo, etc.)",
    flag: '🌍',
    method: 'mobile_money',
    currencyText: 'env. 650 FCFA',
    networks: 'Wave, Orange Money, MTN MoMo, Moov Money',
  },
  {
    id: 'rdc',
    label: 'RD Congo (Kinshasa, Lubumbashi, Goma...)',
    flag: '🇨🇩',
    method: 'mobile_money',
    currencyText: '$1 USD (ou ~2 800 CDF)',
    networks: 'Vodacom M-Pesa, Orange Money, Airtel Money',
  },
  {
    id: 'cemac',
    label: 'Afrique Centrale (Cameroun, Gabon, Congo Brazza, Tchad...)',
    flag: '🌍',
    method: 'mobile_money',
    currencyText: 'env. 650 FCFA',
    networks: 'MTN MoMo, Orange Money, Airtel Money',
  },
  {
    id: 'guinee',
    label: 'Guinée Conakry',
    flag: '🇬🇳',
    method: 'mobile_money',
    currencyText: 'env. 8 600 GNF',
    networks: 'Orange Money Guinée, MTN Mobile Money',
  },
  {
    id: 'east_africa',
    label: 'Afrique de l’Est (Kenya, Rwanda, Ouganda...)',
    flag: '🌍',
    method: 'mobile_money',
    currencyText: '$1 USD (ou devises locales)',
    networks: 'M-Pesa, MTN MoMo, Airtel Money',
  },
];

export const AbonnementsPage: React.FC = () => {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('international');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Promo countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20895); // ~5h 48m 15s

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const currentZone = COUNTRY_OPTIONS.find((c) => c.id === selectedCountry) || COUNTRY_OPTIONS[0];

  // When country/zone changes, auto-select the best payment method
  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    const zone = COUNTRY_OPTIONS.find((c) => c.id === countryId);
    if (zone) {
      setPaymentMethod(zone.method);
    }
  };

  // Single exclusive offer
  const plan = {
    id: 'discovery-pass',
    name: 'Pass Découverte & Guides Visas',
    price: 1,
    originalPrice: 15,
    periodText: 'le premier mois',
    description:
      'Accédez immédiatement à l’ensemble des ressources fondamentales, fiches synthèses de visas et guides exclusifs vérifiés par Jean-Pierre Lofumbwa (Black Pater) depuis Salt Lake City (Utah).',
    features: [
      'Fiches synthèses visas USA & internationaux (F-1 étudiant, B1/B2 visiteur)',
      'Guide exclusif : Les 10 erreurs éliminatoires à l’entretien consulaire',
      'Calendrier & répertoire des bourses d’études et programmes d’échanges actifs',
      'Accès au groupe privé des membres Black Pater (entraide, alertes & partages)',
      'Conseils & astuces pratiques vérifiés sur le terrain à Salt Lake City (Utah)',
      'Reçu officiel instantané & confirmation envoyée par email',
    ],
    ctaText: "S'abonner",
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        setPaymentSuccess(true);
      }
    }
  }, []);

  const openCheckout = () => {
    setErrorMsg(null);
    setModalOpen(true);
  };

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
        body: JSON.stringify({
          email,
          name,
          phone,
          country: currentZone.id,
          amount: plan.price,
          planName: `${plan.name} ($1 Promo)`,
        }),
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
            'La passerelle de paiement en direct est en cours de configuration. Les clés de connexion sont requises.'
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

  const faqs = [
    {
      q: 'Comment fonctionne l’accès après le paiement ?',
      a: 'L’accès est immédiat et 100% automatisé. Dès validation du paiement, vous recevez instantanément un email contenant vos accès complets, les liens de téléchargement de tous les guides officiels et l’accès au groupe privé.',
    },
    {
      q: 'Comment s’effectue le paiement par Mobile Money en Afrique ?',
      a: 'En choisissant votre pays ou la zone Mobile Money, vous êtes orienté vers le règlement sécurisé. Vous saisissez votre numéro de mobile (Orange, MTN, Wave, Airtel, M-Pesa) et confirmez directement la transaction sur votre téléphone via le prompt sécurisé.',
    },
    {
      q: 'Puis-je payer par Carte Bancaire internationale ?',
      a: 'Oui. Le paiement par carte bancaire (Visa, Mastercard, Apple Pay, Google Pay) est pris en charge mondialement via Stripe avec un chiffrement de niveau bancaire.',
    },
    {
      q: 'Y a-t-il un engagement de durée ?',
      a: 'Aucun engagement. Vous gardez le contrôle total et pouvez suspendre votre accès à tout moment en un clic depuis votre espace ou par email.',
    },
    {
      q: 'Que contient exactement le Guide des 10 erreurs éliminatoires ?',
      a: 'Une synthèse concrète des pièges les plus fréquents lors des entretiens aux ambassades (justification des attaches au pays d’origine, solvabilité financière, cohérence du cursus d’études) documentée d’après des cas réels.',
    },
  ];

  return (
    <div style={{ paddingTop: 'calc(var(--nav-h) + 10px)', minHeight: '100vh', background: '#090d16', color: '#f8fafc' }}>
      
      {/* Top Countdown Promotional Banner (Clean text, no blinking green dots) */}
      <aside
        aria-label="Promotion de lancement"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '10px 16px',
          position: 'sticky',
          top: 'var(--nav-h)',
          zIndex: 40,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="wrap"
          style={{
            maxWidth: '1000px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
            color: '#e2e8f0',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#ffffff' }}>
              Offre spéciale de lancement à 1$
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#94a3b8' }}>Fin de la promotion dans :</span>
          </div>

          {/* Digital Timer Badges */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.86rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px',
                color: '#ffffff',
                minWidth: '32px',
                textAlign: 'center',
              }}
            >
              {String(hours).padStart(2, '0')}h
            </span>
            <span style={{ color: '#64748b', fontWeight: 700 }}>:</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.86rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px',
                color: '#ffffff',
                minWidth: '32px',
                textAlign: 'center',
              }}
            >
              {String(minutes).padStart(2, '0')}m
            </span>
            <span style={{ color: '#64748b', fontWeight: 700 }}>:</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.86rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px',
                color: '#ffffff',
                minWidth: '32px',
                textAlign: 'center',
              }}
            >
              {String(seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>
      </aside>

      {/* Hero Header without bulky pill badges */}
      <section style={{ padding: 'clamp(44px, 6vw, 75px) 0 clamp(24px, 4vw, 40px)', textAlign: 'center', position: 'relative' }}>
        <div className="wrap" style={{ maxWidth: '860px' }}>
          <h1
            style={{
              fontFamily: 'var(--display)',
              fontSize: 'clamp(2.6rem, 5.8vw, 4.8rem)',
              textTransform: 'uppercase',
              color: '#ffffff',
              lineHeight: 0.98,
              margin: '0 0 18px',
              letterSpacing: '0.02em',
            }}
          >
            Accompagnement & Guides Officiels
          </h1>

          <p
            style={{
              color: '#94a3b8',
              fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Démarches de voyage, visas d’études et opportunités internationales vérifiées sur le terrain à Salt Lake City (Utah) par Jean-Pierre Lofumbwa.
          </p>
        </div>
      </section>

      {/* Main Single Pricing Card Section */}
      <section style={{ paddingBottom: '70px' }}>
        <div className="wrap" style={{ maxWidth: '680px' }}>
          {/* Payment Success Notification */}
          {paymentSuccess && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '28px',
                marginBottom: '36px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🎉</div>
              <h3
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: '2.2rem',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  marginBottom: '8px',
                }}
              >
                Paiement Validé avec Succès !
              </h3>
              <p
                style={{
                  color: '#f8fafc',
                  fontSize: '1.02rem',
                  marginBottom: '20px',
                  maxWidth: '560px',
                  margin: '0 auto 20px',
                  lineHeight: 1.6,
                }}
              >
                Félicitations pour votre adhésion. Vous recevrez sous peu vos accès complets et les liens exclusifs par email.
              </p>
              <a
                href="/contact"
                className="btn-executive btn-executive--primary"
                style={{ display: 'inline-flex', padding: '12px 28px', fontSize: '1rem' }}
              >
                Accéder à mon espace &rarr;
              </a>
            </div>
          )}

          {/* Clean High-End Card without pills */}
          <div
            style={{
              background: '#0f141f',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: 'clamp(32px, 5vw, 48px)',
              position: 'relative',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 255, 255, 0.03)',
            }}
          >
            {/* Clean Sub-Header */}
            <div style={{ marginBottom: '14px' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#94a3b8',
                  fontWeight: 600,
                }}
              >
                FORMULE UNIQUE & EXCLUSIVE • SANS ENGAGEMENT
              </span>
            </div>

            {/* Plan Title */}
            <h2
              style={{
                fontFamily: 'var(--display)',
                fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
                textTransform: 'uppercase',
                color: '#ffffff',
                margin: '0 0 10px',
                lineHeight: 1.05,
                letterSpacing: '0.01em',
              }}
            >
              {plan.name}
            </h2>

            {/* Plan Description */}
            <p
              style={{
                fontSize: '0.96rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                marginBottom: '26px',
              }}
            >
              {plan.description}
            </p>

            {/* Price Box */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '1.4rem',
                    color: '#64748b',
                    textDecoration: 'line-through',
                    fontWeight: 500,
                  }}
                >
                  ${plan.originalPrice}
                </span>

                <span
                  style={{
                    fontFamily: 'var(--display)',
                    fontSize: 'clamp(3.6rem, 7vw, 4.8rem)',
                    lineHeight: 0.85,
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  ${plan.price}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>
                    {plan.periodText}
                  </span>
                </div>
              </div>

              <div
                style={{
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Tarif découverte
              </div>
            </div>

            {/* Feature Checklist */}
            <div style={{ marginBottom: '32px' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#94a3b8',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                Ressources et accès inclus :
              </span>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {plan.features.map((feat, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      fontSize: '0.95rem',
                      color: '#e2e8f0',
                      lineHeight: 1.45,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="12"
                        height="12"
                        stroke="#ffffff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary Action Button (Pure White High-Contrast) */}
            <button
              type="button"
              onClick={openCheckout}
              data-cursor="S'abonner"
              style={{
                width: '100%',
                padding: '18px 24px',
                fontSize: '1.12rem',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '12px',
                background: '#ffffff',
                color: '#090d16',
                border: 'none',
                transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: '0 8px 25px rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <span>{plan.ctaText}</span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '0 0 90px' }}>
        <div className="wrap" style={{ maxWidth: '680px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span
              style={{
                color: '#94a3b8',
                fontSize: '0.78rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              QUESTIONS FRÉQUENTES
            </span>
            <h2
              style={{
                fontFamily: 'var(--display)',
                fontSize: 'clamp(2rem, 3.6vw, 3rem)',
                textTransform: 'uppercase',
                color: '#ffffff',
                margin: '8px 0',
              }}
            >
              Foire Aux Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, index) => {
              const isOpen = faqOpen === index;
              return (
                <div
                  key={index}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#0f141f',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      padding: '18px 22px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      color: '#ffffff',
                      fontSize: '0.98rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{faq.q}</span>
                    <span
                      style={{
                        fontSize: '1.3rem',
                        color: '#94a3b8',
                        transform: isOpen ? 'rotate(45deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        lineHeight: 1,
                      }}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 22px 20px',
                        fontSize: '0.92rem',
                        color: '#94a3b8',
                        lineHeight: 1.65,
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Checkout Modal with Intelligent Country/Zone Routing */}
      {modalOpen && (
        <div
          id="checkoutModal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
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
              background: '#0f141f',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: 'clamp(24px, 5vw, 36px)',
              position: 'relative',
              color: '#f8fafc',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
              maxHeight: '92vh',
              overflowY: 'auto',
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
                color: '#94a3b8',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                lineHeight: 1,
              }}
              aria-label="Fermer"
            >
              &times;
            </button>

            <span
              style={{
                color: '#94a3b8',
                letterSpacing: '0.12em',
                marginBottom: '6px',
                display: 'block',
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              FINALISATION DE VOTRE ABONNEMENT
            </span>

            <h3
              style={{
                fontFamily: 'var(--display)',
                fontSize: '1.9rem',
                textTransform: 'uppercase',
                marginBottom: '16px',
                color: '#ffffff',
              }}
            >
              {plan.name}
            </h3>

            {/* Country / Zone Selector (System Auto-routes payment) */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.76rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                1. Votre région ou pays de résidence
              </label>

              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} style={{ background: '#0f141f', color: '#ffffff' }}>
                    {opt.flag} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Price Display based on Selection */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600, display: 'block' }}>
                  Montant à régler
                </span>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500 }}>
                  {currentZone.currencyText}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: '2.4rem',
                  color: '#ffffff',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                ${plan.price}
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.76rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#94a3b8',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                2. Mode de paiement (sélectionné automatiquement)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: paymentMethod === 'card' ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: paymentMethod === 'card' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    color: paymentMethod === 'card' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>
                    Carte Bancaire
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                    Visa, Mastercard, Apple Pay
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('mobile_money')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: paymentMethod === 'mobile_money' ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: paymentMethod === 'mobile_money' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    color: paymentMethod === 'mobile_money' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>
                    Mobile Money
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                    Orange, Wave, MTN, M-Pesa
                  </div>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(220, 38, 38, 0.15)',
                  border: '1px solid #dc2626',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  color: '#fca5a5',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#94a3b8',
                    marginBottom: '6px',
                  }}
                >
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Jean-Pierre Mwamba"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#94a3b8',
                    marginBottom: '6px',
                  }}
                >
                  Adresse Email (réception instantanée des guides & reçu)
                </label>
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              {paymentMethod === 'mobile_money' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: '#94a3b8',
                      marginBottom: '6px',
                    }}
                  >
                    Numéro de téléphone mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex : +225 07 12 34 56 ou +243 81 234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  marginTop: '6px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: '#090d16',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading
                  ? 'Redirection en cours...'
                  : paymentMethod === 'card'
                  ? `Valider mon abonnement ($1)`
                  : `Payer via Mobile Money (${currentZone.currencyText})`}
              </button>
            </form>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '4px',
                }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Plateforme de paiement sécurisée</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Les transactions sont traitées de manière chiffrée et sécurisée par les organismes bancaires et opérateurs agréés.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
