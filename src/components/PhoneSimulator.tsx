import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const PhoneSimulator: React.FC = () => {
  const { t } = useLanguage();
  const [screen, setScreen] = useState<'home' | 'notes' | 'whatsapp' | 'tiktok' | 'instagram' | 'youtube' | 'x'>('whatsapp');
  const [waText, setWaText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSendWa = (e: React.FormEvent) => {
    e.preventDefault();
    const message = waText.trim() || 'Bonjour Jean-Pierre, j’aimerais échanger avec vous.';
    window.open(`https://wa.me/17205490926?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="dig" id="phone" aria-labelledby="phoneTitle" style={{ height: 'auto', padding: 'clamp(80px, 10vw, 130px) 0' }}>
      <div className="wrap">
        <div className="dig__head" style={{ marginBottom: '40px' }}>
          <div>
            <span className="label">DISPOSITIF CONNECTÉ</span>
            <h2 id="phoneTitle">{t('phone_title')}</h2>
          </div>
          <p>{t('phone_subtitle')}</p>
        </div>

        {/* Screen Selectors */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[
            { id: 'whatsapp', label: 'WhatsApp VIP' },
            { id: 'tiktok', label: 'TikTok (500K)' },
            { id: 'instagram', label: 'Instagram' },
            { id: 'youtube', label: 'YouTube' },
            { id: 'home', label: 'iPhone Home' },
            { id: 'notes', label: 'Notes' },
            { id: 'x', label: 'X / Twitter' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                border: screen === item.id ? '1px solid var(--copper)' : '1px solid var(--bone-faint)',
                background: screen === item.id ? 'var(--copper)' : 'rgba(255,255,255,0.03)',
                color: screen === item.id ? '#0c0a09' : 'var(--bone-dim)',
                fontWeight: screen === item.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Phone Frame Container */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto' }}>
          <div className="phone" style={{ '--w': 'min(85vw, 360px)' } as any}>
            <div className="screen">
              {/* Dynamic Island */}
              <div className="island" />

              {/* Status Bar */}
              <div className="sbar">
                <span>9:41</span>
                <div className="r">
                  <div className="sig">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="bat" />
                </div>
              </div>

              {/* SCREEN CONTENT */}

              {/* 1. WHATSAPP */}
              {screen === 'whatsapp' && (
                <div className="s-wa" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div className="hd">
                    <div className="pic">
                      <div className="im" style={{ backgroundImage: 'url(/media/3e0be360f5ad.webp)' }} />
                    </div>
                    <div>
                      <b>Jean-Pierre Lofumbwa</b>
                      <span>En ligne · Black Pater</span>
                    </div>
                  </div>

                  <div className="chat">
                    <div className="chip">Aujourd’hui</div>
                    <div className="bub rx">
                      Bonjour ! Bienvenue sur mon canal officiel. Comment puis-je vous accompagner dans vos projets de voyage, bourses ou études ?
                      <small>09:38</small>
                    </div>
                    <div className="bub">
                      Bonjour Jean-Pierre, j’aimerais bénéficier de votre expérience pour préparer mon dossier pour les États-Unis.
                      <small>09:40 ✓✓</small>
                    </div>
                  </div>

                  <form className="in" onSubmit={handleSendWa}>
                    <input
                      type="text"
                      className="wa-field"
                      placeholder={t('phone_wa_placeholder')}
                      value={waText}
                      onChange={(e) => setWaText(e.target.value)}
                    />
                    <button type="submit" style={{ border: 'none', background: 'none' }}>
                      <i>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </i>
                    </button>
                  </form>
                </div>
              )}

              {/* 2. TIKTOK */}
              {screen === 'tiktok' && (
                <div className="s-tt" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div className="bg" style={{ backgroundImage: 'url(/media/50471a19bc72.webp)' }} />
                  <video
                    ref={videoRef}
                    src="/media/3cf83596c4f4.mp4"
                    loop
                    playsInline
                    muted={isMuted}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                    onClick={toggleVideo}
                  />

                  <div className="tabs">
                    <span>Abonnements</span>
                    <b>Pour toi</b>
                  </div>

                  <button
                    type="button"
                    className="snd"
                    onClick={toggleSound}
                    data-cursor="AUDIO"
                  >
                    <span>{isMuted ? t('snd_on') : t('snd_off')}</span>
                  </button>

                  <div className="rail">
                    <div className="av">
                      <div className="im" style={{ backgroundImage: 'url(/media/3e0be360f5ad.webp)' }} />
                    </div>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
                  </div>

                  <div className="cap">
                    <b>@black_pater</b>
                    <span>Le secret pour réussir ses démarches de visa sans stress 🇨🇩🇺🇸 #education #utah #visa #congolaise</span>
                  </div>
                </div>
              )}

              {/* 3. INSTAGRAM */}
              {screen === 'instagram' && (
                <div className="s-ig" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div className="tb">
                    <span>black_pater</span>
                    <div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                    </div>
                  </div>

                  <div className="prof">
                    <div className="ring">
                      <div>
                        <div className="im" style={{ backgroundImage: 'url(/media/3e0be360f5ad.webp)' }} />
                      </div>
                    </div>
                    <div>
                      <b>Black Pater</b>
                      <span>Jean-Pierre Lofumbwa · Éducateur</span>
                    </div>
                  </div>

                  <div className="btns">
                    <span>Suivre</span>
                    <span>Message</span>
                  </div>

                  <div className="bio">
                    <b>Jean-Pierre Lofumbwa (« Le Prof »)</b><br />
                    🎓 Dean’s List @ Columbia College<br />
                    🇨🇩 Ambassadeur culturel en Utah 🇺🇸<br />
                    🌍 Démarches voyage, bourses & langues
                  </div>

                  <div className="grid">
                    <div className="im" style={{ backgroundImage: 'url(/media/db4bf6a012c1.webp)' }} />
                    <div className="im" style={{ backgroundImage: 'url(/media/331bab387390.webp)' }} />
                    <div className="im" style={{ backgroundImage: 'url(/media/fe552333c4cd.webp)' }} />
                  </div>
                </div>
              )}

              {/* 4. YOUTUBE */}
              {screen === 'youtube' && (
                <div className="s-yt" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div className="tb">
                    <div className="logo">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      <span>YouTube</span>
                    </div>
                  </div>

                  <div className="banner">BLACK PATER</div>

                  <div className="chan">
                    <div className="pic">
                      <div className="im" style={{ backgroundImage: 'url(/media/3e0be360f5ad.webp)' }} />
                    </div>
                    <div>
                      <b>Black Pater Officiel</b>
                      <span>102 K abonnés · 140 vidéos</span>
                    </div>
                  </div>

                  <div className="sub">S’abonner</div>

                  <div className="vid" style={{ top: '100cqw' }}>
                    <div className="th">
                      <div className="im" style={{ backgroundImage: 'url(/media/880bac4f1415.jpg)' }} />
                      <i>14:20</i>
                    </div>
                    <p>Comment réussir son entretien de visa pour les États-Unis sans paniquer</p>
                    <span>84 K vues · il y a 3 semaines</span>
                  </div>
                </div>
              )}

              {/* 5. HOME SCREEN */}
              {screen === 'home' && (
                <div className="s-home" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div className="hw" style={{ backgroundImage: 'url(/media/04e93a728b66.jpg)', backgroundSize: 'cover' }} />
                  <div className="widget2">
                    <div className="im" style={{ backgroundImage: 'url(/media/3e0be360f5ad.webp)', backgroundSize: 'cover' }} />
                    <div>
                      <b>Jean-Pierre</b>
                      <span>Salt Lake City, UT · 22°C</span>
                    </div>
                  </div>

                  <div className="apps">
                    <div className="app" onClick={() => setScreen('youtube')}>
                      <div className="tile t-yt"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5-3-5-3v6z"/></svg></div>
                      <span>YouTube</span>
                    </div>
                    <div className="app" onClick={() => setScreen('tiktok')}>
                      <div className="tile t-tt"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2v10a4 4 0 11-4-4"/></svg></div>
                      <span>TikTok</span>
                    </div>
                    <div className="app" onClick={() => setScreen('instagram')}>
                      <div className="tile t-ig"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="5"/></svg></div>
                      <span>Instagram</span>
                    </div>
                    <div className="app" onClick={() => setScreen('whatsapp')}>
                      <div className="tile t-wa"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z"/></svg></div>
                      <span>WhatsApp</span>
                    </div>
                  </div>

                  <div className="dock">
                    <i onClick={() => setScreen('whatsapp')} style={{ cursor: 'pointer' }} />
                    <i onClick={() => setScreen('notes')} style={{ cursor: 'pointer' }} />
                    <i onClick={() => setScreen('tiktok')} style={{ cursor: 'pointer' }} />
                    <i onClick={() => setScreen('instagram')} style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              )}

              {/* 6. NOTES */}
              {screen === 'notes' && (
                <div className="s-notes" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div className="top">
                    <span>Dossiers</span>
                    <span>Terminé</span>
                  </div>
                  <div className="doc">
                    <h4>Feuille de Route 2026</h4>
                    <div className="meta">Aujourd’hui à 08:30</div>
                    <ul>
                      <li>Mentorat de 500 étudiants pour les visas</li>
                      <li>Publication du guide bourses USA</li>
                      <li>Masterclass culturelle Banafro Salt Lake City</li>
                      <li className="caret">Conférence internationale Diaspora</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 7. X / TWITTER */}
              {screen === 'x' && (
                <div className="s-x" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div className="tb">
                    <span>X</span>
                  </div>
                  <div className="banner" />
                  <div className="av">
                    <div className="im" style={{ backgroundImage: 'url(/media/3e0be360f5ad.webp)' }} />
                  </div>
                  <div className="fol">Suivre</div>
                  <div className="nm">
                    <b>Black Pater 🇨🇩🇺🇸</b>
                    <span>@black_pater</span>
                    <p>Éducateur, honneur Dean’s List Columbia College, promoteur de la culture congolaise en Utah.</p>
                  </div>
                </div>
              )}

              {/* Bottom Home Indicator Bar */}
              <div className="hbar" />
            </div>
          </div>
        </div>

        {/* Action Direct Link */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <a
            href="https://wa.me/17205490926?text=Bonjour%20Jean-Pierre,%20j'ai%20découvert%20votre%20plateforme%20et%20je%20souhaite%20échanger."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--copper)',
              fontSize: '0.84rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
            data-cursor="💬 Écrire sur WhatsApp"
          >
            {t('phone_wa_direct')}
          </a>
        </div>
      </div>
    </section>
  );
};
