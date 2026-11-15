import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon, type IconName } from '../../components/Icon';
import { portalApi, PortalError, type CallMeeting, type CallPlatform, type CallsHome, type MemberCall } from './api';

const PLATFORMS: { id: CallPlatform; icon: IconName; video: boolean }[] = [
  { id: 'phone', icon: 'phone', video: false },
  { id: 'whatsapp', icon: 'chat', video: false },
  { id: 'zoom', icon: 'play', video: true },
  { id: 'meet', icon: 'play', video: true }
];

const ERRORS: Record<string, string> = {
  slot_taken: 'po_calls_err_taken',
  calls_used_up: 'po_calls_err_used',
  plan_required: 'po_calls_err_plan',
  phone_required: 'po_calls_err_phone',
  invalid_request: 'po_calls_err_invalid',
  membership_expired: 'po_calls_err_expired',
  rate_limited: 'po_calls_err_rate'
};

/** "mardi 18 novembre" and "14:30 (UTC−7)" in the member's own time zone. */
function useWhen(lang: string) {
  return useMemo(() => {
    const locale = lang === 'en' ? 'en-US' : 'fr-FR';
    const day = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
    const full = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    return {
      day: (iso: string) => day.format(new Date(iso)),
      time: (iso: string) => time.format(new Date(iso)),
      full: (iso: string) => full.format(new Date(iso))
    };
  }, [lang]);
}

/**
 * Calls with Black Pater: the member books one of the team's slots and picks
 * how to talk (phone or WhatsApp for every plan, Zoom or Meet in Premium).
 * Black Pater's own number is never shown: the team calls the member at the
 * number they give, which only the team can see.
 */
export const CallsView: React.FC<{ onPlans: () => void; onMessages: () => void }> = ({ onPlans, onMessages }) => {
  const { t, lang } = useLanguage();
  const when = useWhen(lang);
  const [home, setHome] = useState<CallsHome | null>(null);
  const [error, setError] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<CallPlatform>('phone');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setHome(await portalApi.calls());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const fail = (e: unknown) => {
    const code = e instanceof PortalError ? e.code : '';
    setMessage({ ok: false, text: t((ERRORS[code] ?? 'po_calls_err_generic') as Parameters<typeof t>[0]) });
    if (code === 'slot_taken') {
      setSlotId(null);
      void load();
    }
  };

  const days = useMemo(() => {
    const map = new Map<string, CallsHome['slots']>();
    for (const s of home?.slots ?? []) {
      const key = when.day(s.starts_at);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map];
  }, [home?.slots, when]);

  if (error && !home) {
    return (
      <section className='po-section' aria-labelledby='po-h-calls'>
        <h2 id='po-h-calls'>{t('po_calls_title')}</h2>
        <div className='po-card' role='alert'>
          <p>{t('po_calls_err_generic')}</p>
          <button type='button' className='btn btn--secondary' onClick={() => void load()}>
            {t('po_calls_retry')}
          </button>
        </div>
      </section>
    );
  }
  if (!home) {
    return (
      <section className='po-section' aria-busy='true'>
        <p className='po-news__loading'>{t('po_calls_loading')}</p>
      </section>
    );
  }

  const left = Math.max(0, home.quota - home.used);
  const upcoming = home.calls.filter((c) => c.status === 'booked' && Date.parse(c.starts_at) > Date.now() - c.minutes * 60000);
  const history = home.calls.filter((c) => !upcoming.includes(c)).slice(0, 6);
  const needsPhone = platform === 'phone' || platform === 'whatsapp';
  const phoneOk = /^\+?[0-9 ().-]{7,24}$/.test(phone.trim());
  const canBook = !!slotId && (!needsPhone || phoneOk) && busy === null;

  const book = async () => {
    if (!slotId) return;
    setBusy('book');
    setMessage(null);
    try {
      await portalApi.callBook({ slotId, platform, ...(needsPhone ? { phone: phone.trim() } : {}), ...(topic.trim() ? { topic: topic.trim() } : {}) });
      setSlotId(null);
      setTopic('');
      setMessage({ ok: true, text: t(needsPhone ? 'po_calls_booked_voice' : 'po_calls_booked_video') });
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (id: string) => {
    setBusy(id);
    setMessage(null);
    try {
      await portalApi.callCancel(id);
      setMessage({ ok: true, text: t('po_calls_canceled') });
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const join = async (m: CallMeeting) => {
    setBusy(m.id);
    setMessage(null);
    try {
      await portalApi.callBook({ slotId: m.id, platform: 'zoom' });
      setMessage({ ok: true, text: t('po_calls_joined') });
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className='po-section po-calls' aria-labelledby='po-h-calls'>
      <div className='po-section__head'>
        <div>
          <h2 id='po-h-calls'>{t('po_calls_title')}</h2>
          <p className='po-section__lead'>{t('po_calls_lead')}</p>
        </div>
      </div>

      {message && (
        <p className={`po-calls__msg${message.ok ? ' is-ok' : ' is-error'}`} role={message.ok ? 'status' : 'alert'}>
          <Icon name={message.ok ? 'check' : 'alert'} /> {message.text}
        </p>
      )}

      {!home.active ? (
        <div className='po-card po-calls__locked'>
          <Icon name='lock' />
          <div>
            <strong>{t('po_calls_locked')}</strong>
            <p>{t('po_calls_locked_text')}</p>
          </div>
          <button type='button' className='btn btn--primary' onClick={onPlans}>
            {t('po_calls_renew')}
          </button>
        </div>
      ) : (
        <div className='po-card po-calls__quota'>
          <div className='po-calls__quota-head'>
            <strong>{t(left === 1 ? 'po_calls_left_1' : 'po_calls_left_n', { n: left })}</strong>
            <span>{t('po_calls_of', { used: home.used, quota: home.quota })}</span>
          </div>
          <div className='po-calls__meter' role='progressbar' aria-valuemin={0} aria-valuemax={home.quota} aria-valuenow={home.used} aria-label={t('po_calls_meter')}>
            {Array.from({ length: home.quota }, (_, i) => (
              <span key={i} className={i < home.used ? 'is-used' : ''} />
            ))}
          </div>
          <p className='po-calls__perks'>
            {home.video ? t('po_calls_perks_premium') : t('po_calls_perks_voice')}{' '}
            {home.level < 3 && (
              <button type='button' className='po-link' onClick={onPlans}>
                {t('po_calls_more')}
              </button>
            )}
          </p>
          <p className='po-calls__privacy'>
            <Icon name='shield' /> {t('po_calls_privacy')}
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className='po-calls__block'>
          <h3>{t('po_calls_upcoming')}</h3>
          <ul className='po-calls__list'>
            {upcoming.map((c) => (
              <CallRow key={c.id} call={c} when={when.full(c.starts_at)} busy={busy === c.id} onCancel={() => void cancel(c.id)} />
            ))}
          </ul>
        </div>
      )}

      {home.active && (
        <div className='po-card po-calls__book'>
          <h3>{t('po_calls_book')}</h3>
          {left === 0 ? (
            <p className='po-calls__note'>
              {t('po_calls_used_up')}{' '}
              {home.level < 3 ? (
                <button type='button' className='po-link' onClick={onPlans}>
                  {t('po_calls_more')}
                </button>
              ) : (
                <button type='button' className='po-link' onClick={onMessages}>
                  {t('po_calls_write')}
                </button>
              )}
            </p>
          ) : days.length === 0 ? (
            <p className='po-calls__note'>
              {t('po_calls_no_slot')}{' '}
              <button type='button' className='po-link' onClick={onMessages}>
                {t('po_calls_write')}
              </button>
            </p>
          ) : (
            <form
              className='po-form'
              onSubmit={(e) => {
                e.preventDefault();
                if (canBook) void book();
              }}
            >
              <fieldset className='po-calls__fieldset'>
                <legend className='po-field__label'>{t('po_calls_pick_time')}</legend>
                <p className='po-field__hint'>{t('po_calls_your_time')}</p>
                {days.map(([day, slots]) => (
                  <div key={day} className='po-calls__day'>
                    <span className='po-calls__day-name'>{day}</span>
                    <div className='po-calls__times'>
                      {slots.map((s) => (
                        <button
                          key={s.id}
                          type='button'
                          className={`po-chip${slotId === s.id ? ' is-active' : ''}`}
                          aria-pressed={slotId === s.id}
                          onClick={() => setSlotId(s.id)}
                        >
                          {when.time(s.starts_at)}
                          <span className='po-chip__tag'>{t('po_calls_min', { n: s.minutes })}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </fieldset>

              <fieldset className='po-calls__fieldset'>
                <legend className='po-field__label'>{t('po_calls_how')}</legend>
                <div className='po-calls__platforms'>
                  {PLATFORMS.map((p) => {
                    const locked = p.video && !home.video;
                    return (
                      <button
                        key={p.id}
                        type='button'
                        className={`po-calls__platform${platform === p.id ? ' is-active' : ''}`}
                        aria-pressed={platform === p.id}
                        disabled={locked}
                        onClick={() => setPlatform(p.id)}
                      >
                        <Icon name={p.icon} />
                        <span>{t(`po_calls_pf_${p.id}` as Parameters<typeof t>[0])}</span>
                        {locked && <span className='po-calls__premium'>Premium</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {needsPhone ? (
                <label className='po-field'>
                  <span className='po-field__label'>{t(platform === 'whatsapp' ? 'po_calls_phone_wa' : 'po_calls_phone')}</span>
                  <input
                    type='tel'
                    inputMode='tel'
                    autoComplete='tel'
                    value={phone}
                    maxLength={24}
                    placeholder='+1 555 123 4567'
                    aria-invalid={phone.trim() !== '' && !phoneOk}
                    aria-describedby='po-calls-phone-hint'
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <span className='po-field__hint' id='po-calls-phone-hint'>
                    {t('po_calls_phone_hint')}
                  </span>
                </label>
              ) : (
                <p className='po-field__hint'>{t('po_calls_video_hint')}</p>
              )}

              <label className='po-field'>
                <span className='po-field__label'>{t('po_calls_topic')}</span>
                <textarea value={topic} maxLength={500} rows={3} placeholder={t('po_calls_topic_ph')} onChange={(e) => setTopic(e.target.value)} />
              </label>

              <button type='submit' className='btn btn--primary' disabled={!canBook}>
                <Icon name='calendar' /> {busy === 'book' ? t('po_calls_booking') : t('po_calls_confirm')}
              </button>
              <p className='po-field__hint'>{t('po_calls_cancel_rule')}</p>
            </form>
          )}
        </div>
      )}

      {home.active && (
        <div className='po-calls__block'>
          <h3>{t('po_calls_meetings')}</h3>
          {!home.meetings_allowed ? (
            <div className='po-card po-calls__locked'>
              <Icon name='star' />
              <div>
                <strong>{t('po_calls_meetings_premium')}</strong>
                <p>{t('po_calls_meetings_premium_text')}</p>
              </div>
              <button type='button' className='btn btn--secondary' onClick={onPlans}>
                {t('po_calls_see_plans')}
              </button>
            </div>
          ) : home.meetings.length === 0 ? (
            <p className='po-calls__note'>{t('po_calls_meetings_none')}</p>
          ) : (
            <ul className='po-calls__list'>
              {home.meetings.map((m) => (
                <li key={m.id} className='po-card po-calls__item'>
                  <div className='po-calls__item-main'>
                    <strong>{m.title || t('po_calls_meeting')}</strong>
                    <span>
                      {when.full(m.starts_at)} · {t('po_calls_min', { n: m.minutes })}
                    </span>
                    {m.joined && (
                      <span className='po-calls__status'>
                        {m.link ? (
                          <a className='btn btn--primary btn--sm' href={m.link} target='_blank' rel='noopener noreferrer'>
                            {t('po_calls_join_link')} <Icon name='arrowUpRight' />
                          </a>
                        ) : (
                          t('po_calls_link_soon')
                        )}
                      </span>
                    )}
                  </div>
                  {m.joined && m.call_id ? (
                    <button type='button' className='po-link' disabled={busy !== null} onClick={() => void cancel(m.call_id!)}>
                      {t('po_calls_leave')}
                    </button>
                  ) : m.full ? (
                    <span className='po-calls__status'>{t('po_calls_full')}</span>
                  ) : (
                    <button type='button' className='btn btn--secondary' disabled={busy !== null} onClick={() => void join(m)}>
                      {t('po_calls_register')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {history.length > 0 && (
        <details className='po-calls__history'>
          <summary>{t('po_calls_history')}</summary>
          <ul className='po-calls__list'>
            {history.map((c) => (
              <CallRow key={c.id} call={c} when={when.full(c.starts_at)} busy={false} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
};

const CallRow: React.FC<{ call: MemberCall; when: string; busy: boolean; onCancel?: () => void }> = ({ call: c, when, busy, onCancel }) => {
  const { t } = useLanguage();
  const video = c.mode === 'video';
  return (
    <li className='po-card po-calls__item'>
      <span className='po-calls__icon' aria-hidden='true'>
        <Icon name={video ? 'play' : c.platform === 'whatsapp' ? 'chat' : 'phone'} />
      </span>
      <div className='po-calls__item-main'>
        <strong>{when}</strong>
        <span>
          {t(`po_calls_pf_${c.platform}` as Parameters<typeof t>[0])} · {t('po_calls_min', { n: c.minutes })}
          {c.status !== 'booked' && <> · {t(`po_calls_st_${c.status}` as Parameters<typeof t>[0])}</>}
        </span>
        {c.status === 'booked' && (
          <span className='po-calls__status'>
            {video ? (
              c.link ? (
                <a className='btn btn--primary btn--sm' href={c.link} target='_blank' rel='noopener noreferrer'>
                  {t('po_calls_join_link')} <Icon name='arrowUpRight' />
                </a>
              ) : (
                t('po_calls_link_soon')
              )
            ) : (
              t(c.platform === 'whatsapp' ? 'po_calls_we_call_wa' : 'po_calls_we_call')
            )}
          </span>
        )}
        {c.topic && <span className='po-calls__topic'>{c.topic}</span>}
      </div>
      {onCancel && c.can_cancel && (
        <button type='button' className='po-link' disabled={busy} onClick={onCancel}>
          {t('po_calls_cancel')}
        </button>
      )}
    </li>
  );
};
