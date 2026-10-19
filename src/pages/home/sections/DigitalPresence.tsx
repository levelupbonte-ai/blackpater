import React, { useRef, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Icon, WhatsAppIcon } from '../../../components/Icon';
import { whatsappLink } from '../../../lib/contact';

type Screen = 'whatsapp' | 'tiktok' | 'instagram';
const SCREENS: Array<{ id: Screen; label: string }> = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' }
];
const PORTRAIT = '/media/3e0be360f5ad.webp';

export const DigitalPresence: React.FC = () => {
  const { t } = useLanguage();
  const [screen, setScreen] = useState<Screen>('whatsapp');
  const [text, setText] = useState('');
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const video = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = whatsappLink(text.trim() || t('phone_wa_default'));
  };

  return (
    <section className='dig section' id='phone' aria-labelledby='dig-title'>
      <div className='container'>
        <div className='section-header-center'>
          <p className='eyebrow'>{t('phone_kicker')}</p>
          <h2 id='dig-title' className='section-title'>
            {t('phone_title')}
          </h2>
          <p className='section-subtitle'>{t('phone_subtitle')}</p>
        </div>

        <div className='dig__tabs' role='group' aria-label={t('phone_tabs')}>
          {SCREENS.map((s) => (
            <button key={s.id} type='button' aria-pressed={screen === s.id} onClick={() => setScreen(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        <div className='dig__device'>
          <div className='phone'>
            <div className='screen'>
              <div className='island' aria-hidden='true' />
              <div className='sbar' aria-hidden='true'>
                <span>9:41</span>
                <span className='r'>
                  <span className='sig'>
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className='bat' />
                </span>
              </div>

              {screen === 'whatsapp' && (
                <div className='s-wa'>
                  <div className='hd'>
                    <div className='pic'>
                      <div className='im' style={{ backgroundImage: `url(${PORTRAIT})` }} />
                    </div>
                    <div>
                      <b>Jean-Pierre Lofumbwa</b>
                      <span>{t('phone_online')}</span>
                    </div>
                  </div>
                  <div className='chat'>
                    <div className='chip'>{t('phone_today')}</div>
                    <p className='bub rx'>{t('phone_wa_in')}</p>
                    <p className='bub'>{t('phone_wa_out')}</p>
                  </div>
                  <form className='in' onSubmit={send}>
                    <label className='sr-only' htmlFor='wa-field'>
                      {t('phone_wa_field')}
                    </label>
                    <input
                      id='wa-field'
                      type='text'
                      className='wa-field'
                      placeholder={t('phone_wa_placeholder')}
                      value={text}
                      maxLength={500}
                      onChange={(e) => setText(e.target.value)}
                    />
                    <button type='submit' className='wa-send' aria-label={t('phone_wa_send')}>
                      <Icon name='arrowRight' />
                    </button>
                  </form>
                </div>
              )}

              {screen === 'tiktok' && (
                <div className='s-tt'>
                  <div className='bg' style={{ backgroundImage: 'url(/media/50471a19bc72.webp)' }} />
                  <video
                    ref={video}
                    src='/media/3cf83596c4f4.mp4'
                    loop
                    playsInline
                    muted={muted}
                    preload='none'
                    poster='/media/50471a19bc72.webp'
                  />
                  <button type='button' className='tt-play' onClick={togglePlay} aria-label={t('video_play')} aria-pressed={playing}>
                    {!playing && <Icon name='play' />}
                  </button>
                  <button
                    type='button'
                    className='snd'
                    onClick={() => {
                      if (video.current) video.current.muted = !muted;
                      setMuted(!muted);
                    }}
                  >
                    <Icon name={muted ? 'mute' : 'volume'} />
                    <span>{muted ? t('snd_on') : t('snd_off')}</span>
                  </button>
                  <div className='cap'>
                    <b>@black_pater</b>
                    <span>{t('phone_tt_caption')}</span>
                  </div>
                </div>
              )}

              {screen === 'instagram' && (
                <div className='s-ig'>
                  <div className='tb'>
                    <span>black_pater</span>
                  </div>
                  <div className='prof'>
                    <div className='ring'>
                      <div>
                        <div className='im' style={{ backgroundImage: `url(${PORTRAIT})` }} />
                      </div>
                    </div>
                    <div>
                      <b>Black Pater</b>
                      <span>{t('phone_ig_role')}</span>
                    </div>
                  </div>
                  <div className='btns' aria-hidden='true'>
                    <span>{t('phone_follow')}</span>
                    <span>{t('phone_message')}</span>
                  </div>
                  <ul className='bio'>
                    <li>
                      <b>Jean-Pierre Lofumbwa (« Le Prof »)</b>
                    </li>
                    <li>{t('phone_ig_bio_1')}</li>
                    <li>{t('phone_ig_bio_2')}</li>
                    <li>{t('phone_ig_bio_3')}</li>
                  </ul>
                  <div className='grid'>
                    <div className='im' style={{ backgroundImage: 'url(/media/db4bf6a012c1.webp)' }} />
                    <div className='im' style={{ backgroundImage: 'url(/media/331bab387390.webp)' }} />
                    <div className='im' style={{ backgroundImage: 'url(/media/fe552333c4cd.webp)' }} />
                  </div>
                </div>
              )}
              <div className='hbar' aria-hidden='true' />
            </div>
          </div>
        </div>

        <p className='dig__cta'>
          <a className='arrow-link' href={whatsappLink(t('phone_wa_default'))} target='_blank' rel='noopener noreferrer'>
            <WhatsAppIcon />
            {t('phone_wa_direct')}
            <span className='sr-only'> {t('opens_new_tab')}</span>
          </a>
        </p>
      </div>
    </section>
  );
};
