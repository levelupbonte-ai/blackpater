import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Link, useRouter } from '../../app/router';
import { Icon, type IconName } from '../../components/Icon';
import {
  PortalError,
  digits,
  formatDate,
  formatMoney,
  formatSize,
  isCode,
  isEmail,
  portalApi,
  unreadCount,
  type PortalHome,
  type PortalItem
} from './api';
import { getOffer } from '../../../shared/offers.js';
import type { TranslationKey } from '../../i18n';
import './portal.css';

/** "Duo · 2 people" from the catalog, in the visitor's language; the stored name otherwise. */
function offerLabel(t: T, id: string | null, stored: string | null) {
  const offer = getOffer(id);
  if (offer) return t(`offers_tier_${offer.tier}_title` as TranslationKey);
  return stored || id || '';
}

type T = ReturnType<typeof useLanguage>['t'];

function errorText(t: T, err: unknown): string {
  const code = err instanceof PortalError ? err.code : 'generic';
  switch (code) {
    case 'rate_limited':
      return t('po_err_rate');
    case 'portal_unavailable':
      return t('po_err_unavailable');
    case 'invalid_code':
      return t('po_err_invalid_code');
    case 'password_too_short':
      return t('po_err_password_too_short');
    case 'password_too_long':
      return t('po_err_password_too_long');
    case 'password_common':
      return t('po_err_password_common');
    case 'password_personal':
      return t('po_err_password_personal');
    case 'password_breached':
      return t('po_err_password_breached');
    case 'email_unavailable':
      return t('po_err_email_unavailable');
    default:
      return t('po_err_generic');
  }
}

/* ------------------------------------------------------------------ sign-in */

const RESEND_SECONDS = 30;

const SignIn: React.FC<{ onSignedIn: () => void }> = ({ onSignedIn }) => {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const errorId = 'po-signin-error';

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isEmail(email)) return setError(t('po_err_email'));
    setBusy(true);
    setError(null);
    try {
      await portalApi.requestCode(email.trim(), lang);
      setStep('code');
      setCode('');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCode(code)) return setError(t('po_err_code_format'));
    setBusy(true);
    setError(null);
    try {
      await portalApi.verifyCode(email.trim(), code);
      onSignedIn();
    } catch (err) {
      setError(err instanceof PortalError && err.code === 'invalid_credentials' ? t('po_err_invalid_code') : errorText(t, err));
      setBusy(false);
    }
  };

  const passwordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError(t('po_err_email'));
    setBusy(true);
    setError(null);
    try {
      await portalApi.passwordSignIn(email.trim(), password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof PortalError && err.code === 'invalid_credentials' ? t('po_err_invalid_password') : errorText(t, err));
      setBusy(false);
    }
  };

  return (
    <section className='po-auth'>
      <div className='po-auth__card' data-reveal>
        <div className='po-auth__mark' aria-hidden='true'>
          <Icon name='lock' />
        </div>
        <p className='po-kicker'>{t('po_kicker')}</p>
        <h1 className='po-auth__title'>{t('po_signin_title')}</h1>
        <p className='po-auth__lead'>{t('po_signin_text')}</p>

        {step === 'email' && (
          <form className='po-form' onSubmit={requestCode} noValidate>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_email')}</span>
              <input
                type='email'
                inputMode='email'
                autoComplete='email'
                autoCapitalize='none'
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : 'po-email-hint'}
              />
              <span className='po-field__hint' id='po-email-hint'>
                {t('po_email_hint')}
              </span>
            </label>
            {error && (
              <p className='po-error' id={errorId} role='alert'>
                {error}
              </p>
            )}
            <button className='btn btn--primary po-submit' type='submit' disabled={busy} aria-busy={busy}>
              {busy ? t('po_sending') : t('po_send_code')}
              {!busy && <Icon name='arrowRight' />}
            </button>
            <button type='button' className='po-link' onClick={() => (setError(null), setStep('password'))}>
              <Icon name='key' />
              {t('po_use_password')}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form className='po-form' onSubmit={verify} noValidate>
            <div className='po-notice' role='status'>
              <Icon name='mail' />
              <div>
                <strong>{t('po_check_email')}</strong>
                <p>{t('po_check_email_text', { email: email.trim() })}</p>
              </div>
            </div>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_code')}</span>
              <input
                ref={codeRef}
                className='po-code-input'
                type='text'
                inputMode='numeric'
                autoComplete='one-time-code'
                pattern='[0-9]{6}'
                maxLength={9}
                value={code}
                onChange={(e) => setCode(digits(e.target.value))}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
              />
            </label>
            {error && (
              <p className='po-error' id={errorId} role='alert'>
                {error}
              </p>
            )}
            <button className='btn btn--primary po-submit' type='submit' disabled={busy || code.length !== 6} aria-busy={busy}>
              {busy ? t('po_verifying') : t('po_verify')}
            </button>
            <div className='po-row'>
              <button type='button' className='po-link' disabled={cooldown > 0 || busy} onClick={() => requestCode()}>
                {cooldown > 0 ? t('po_resend_in', { s: cooldown }) : t('po_resend')}
              </button>
              <button type='button' className='po-link' onClick={() => (setError(null), setStep('email'))}>
                {t('po_change_email')}
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form className='po-form' onSubmit={passwordSignIn} noValidate>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_email')}</span>
              <input type='email' inputMode='email' autoComplete='username' autoCapitalize='none' spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_password')}</span>
              <input type='password' autoComplete='current-password' value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />
            </label>
            {error && (
              <p className='po-error' id={errorId} role='alert'>
                {error}
              </p>
            )}
            <button className='btn btn--primary po-submit' type='submit' disabled={busy || !password} aria-busy={busy}>
              {busy ? t('po_verifying') : t('po_verify')}
            </button>
            <button type='button' className='po-link' onClick={() => (setError(null), setStep('email'))}>
              <Icon name='mail' />
              {t('po_forgot')}
            </button>
          </form>
        )}

        <p className='po-auth__foot'>
          <Icon name='shield' />
          {t('po_security_note')}
        </p>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ dashboard */

type View = 'overview' | 'updates' | 'trip' | 'documents' | 'checklist' | 'messages' | 'booking' | 'settings';
const VIEWS: { id: View; icon: IconName; label: Parameters<T>[0] }[] = [
  { id: 'overview', icon: 'home', label: 'po_nav_overview' },
  { id: 'updates', icon: 'bell', label: 'po_nav_updates' },
  { id: 'trip', icon: 'plane', label: 'po_nav_trip' },
  { id: 'documents', icon: 'file', label: 'po_nav_documents' },
  { id: 'checklist', icon: 'list', label: 'po_nav_checklist' },
  { id: 'messages', icon: 'chat', label: 'po_nav_messages' },
  { id: 'booking', icon: 'receipt', label: 'po_nav_booking' },
  { id: 'settings', icon: 'user', label: 'po_nav_settings' }
];
/** The bottom bar on phones keeps five targets; the rest are reached from Home. */
const MOBILE_TABS: View[] = ['overview', 'updates', 'documents', 'messages', 'settings'];

function readView(search: string): View {
  const v = new URLSearchParams(search).get('view');
  return VIEWS.some((x) => x.id === v) ? (v as View) : 'overview';
}

const Confirm: React.FC<{
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, text, confirmLabel, onConfirm, onCancel }) => {
  const { t } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className='po-dialog' aria-labelledby='po-dialog-title' onCancel={(e) => (e.preventDefault(), onCancel())}>
      <h2 id='po-dialog-title'>{title}</h2>
      <p>{text}</p>
      <div className='po-dialog__actions'>
        <button type='button' className='btn btn--secondary' onClick={onCancel}>
          {t('po_cancel')}
        </button>
        <button type='button' className='btn btn--primary' onClick={onConfirm} autoFocus>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
};

const Empty: React.FC<{ icon: IconName; text: string }> = ({ icon, text }) => (
  <div className='po-empty'>
    <span className='po-empty__icon' aria-hidden='true'>
      <Icon name={icon} />
    </span>
    <p>{text}</p>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <section className='po-section' aria-labelledby={`po-h-${title}`}>
    <div className='po-section__head'>
      <h2 id={`po-h-${title}`}>{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const UpdateCard: React.FC<{ item: PortalItem }> = ({ item }) => {
  const { lang, t } = useLanguage();
  return (
    <article className={`po-card po-update${item.read ? '' : ' is-unread'}`}>
      <header className='po-update__head'>
        <time dateTime={item.published_at}>{formatDate(item.published_at, lang)}</time>
        {!item.read && <span className='po-badge'>{t('po_new')}</span>}
      </header>
      <h3>{item.title}</h3>
      {item.body && <p className='po-prose'>{item.body}</p>}
    </article>
  );
};

const TripCard: React.FC<{ item: PortalItem }> = ({ item }) => {
  const { lang, t } = useLanguage();
  const trip = item.trip;
  if (!trip) return null;
  const dates = [formatDate(trip.start_date, lang), formatDate(trip.end_date, lang)].filter(Boolean).join(' → ');
  return (
    <article className='po-card po-trip'>
      <h3>{item.title}</h3>
      <dl className='po-facts'>
        {dates && (
          <div>
            <dt>
              <Icon name='calendar' /> {t('po_dates')}
            </dt>
            <dd>{dates}</dd>
          </div>
        )}
        {trip.meeting_point && (
          <div>
            <dt>
              <Icon name='mapPin' /> {t('po_meeting')}
            </dt>
            <dd>{trip.meeting_point}</dd>
          </div>
        )}
        {trip.meeting_time && (
          <div>
            <dt>
              <Icon name='clock' /> {t('po_meeting_time')}
            </dt>
            <dd>{trip.meeting_time}</dd>
          </div>
        )}
      </dl>
      {item.body && <p className='po-prose'>{item.body}</p>}
      {trip.steps.length > 0 && (
        <>
          <h4 className='po-subtitle'>{t('po_itinerary')}</h4>
          <ol className='po-steps'>
            {trip.steps.map((s, i) => (
              <li key={i}>
                <span className='po-steps__dot' aria-hidden='true' />
                <div>
                  {s.date && <time dateTime={s.date}>{formatDate(s.date, lang)}</time>}
                  <strong>{s.title}</strong>
                  {s.detail && <p>{s.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </article>
  );
};

const Dashboard: React.FC<{ home: PortalHome; reload: () => Promise<void>; onSignedOut: () => void }> = ({ home, reload, onSignedOut }) => {
  const { t, lang } = useLanguage();
  const { search, navigate } = useRouter();
  const view = readView(search);
  const [data, setData] = useState(home);
  useEffect(() => setData(home), [home]);

  const go = useCallback((v: View) => navigate(v === 'overview' ? '/espace-client' : `/espace-client?view=${v}`), [navigate]);

  const updates = data.items.filter((i) => i.kind === 'update');
  const trips = data.items.filter((i) => i.kind === 'trip');
  const documents = data.items.filter((i) => i.kind === 'document');
  const checklists = data.items.filter((i) => i.kind === 'checklist');
  const unreadMessages = data.messages.filter((m) => !m.read).length;
  const unreadByView: Partial<Record<View, number>> = {
    updates: updates.filter((i) => !i.read).length,
    trip: trips.filter((i) => !i.read).length,
    documents: documents.filter((i) => !i.read).length,
    checklist: checklists.filter((i) => !i.read).length,
    messages: unreadMessages
  };

  // Opening a section marks what it shows as read.
  useEffect(() => {
    const kind = { updates: 'update', trip: 'trip', checklist: 'checklist' }[view as string];
    const unread = kind ? data.items.filter((i) => i.kind === kind && !i.read) : [];
    if (unread.length) {
      unread.forEach((i) => void portalApi.read(i.id).catch(() => {}));
      setData((d) => ({ ...d, items: d.items.map((i) => (unread.includes(i) ? { ...i, read: true } : i)) }));
    }
    if (view === 'messages' && unreadMessages) {
      void portalApi.read(null, true).catch(() => {});
      setData((d) => ({ ...d, messages: d.messages.map((m) => ({ ...m, read: true })) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const name = data.customer.name?.split(' ')[0];
  const total = unreadCount(data);

  return (
    <div className='po-shell'>
      <aside className='po-side'>
        <div className='po-side__who'>
          <span className='po-avatar' aria-hidden='true'>
            {(data.customer.name || data.customer.email).slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{data.customer.name || t('po_welcome_anon')}</strong>
            <span>{data.customer.email}</span>
          </div>
        </div>
        <nav aria-label={t('po_nav_label')}>
          <ul className='po-nav'>
            {VIEWS.map((v) => (
              <li key={v.id}>
                <Link
                  to={v.id === 'overview' ? '/espace-client' : `/espace-client?view=${v.id}`}
                  className={`po-nav__link${view === v.id ? ' is-active' : ''}`}
                  aria-current={view === v.id ? 'page' : undefined}
                >
                  <Icon name={v.icon} />
                  <span>{t(v.label)}</span>
                  {!!unreadByView[v.id] && <span className='po-count'>{unreadByView[v.id]}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className='po-main'>
        {view === 'overview' && (
          <>
            <header className='po-hero' data-reveal>
              <p className='po-kicker'>{t('po_kicker')}</p>
              <h1>{name ? t('po_welcome', { name }) : t('po_welcome_anon')}</h1>
              <p>{t('po_overview_text')}</p>
              {total > 0 && <span className='po-pill'>{t('po_unread', { n: total })}</span>}
            </header>
            {data.bookings[0] && (
              <button type='button' className='po-card po-summary' onClick={() => go('booking')}>
                <span className='po-summary__label'>{t('po_booking_title')}</span>
                <span className='po-summary__offer'>{offerLabel(t, data.bookings[0].offer_id, data.bookings[0].offer_name)}</span>
                <span className='po-summary__meta'>
                  {formatMoney(data.bookings[0].amount, data.bookings[0].currency, lang)}
                  {data.bookings[0].paid_at && ` · ${formatDate(data.bookings[0].paid_at, lang)}`}
                  {' · '}
                  <span className={`po-status po-status--${data.bookings[0].status}`}>
                    {data.bookings[0].status === 'paid' ? t('po_status_paid') : t('po_status_refunded')}
                  </span>
                </span>
                <Icon name='chevronRight' className='po-summary__chev' />
              </button>
            )}
            <div className='po-tiles'>
              {VIEWS.filter((v) => v.id !== 'overview').map((v) => (
                <button type='button' key={v.id} className='po-tile' onClick={() => go(v.id)}>
                  <Icon name={v.icon} />
                  <span>{t(v.label)}</span>
                  {!!unreadByView[v.id] && <span className='po-count'>{unreadByView[v.id]}</span>}
                </button>
              ))}
            </div>
            <Section
              title={t('po_latest')}
              action={
                updates.length > 0 ? (
                  <button type='button' className='po-link' onClick={() => go('updates')}>
                    {t('po_see_all')} <Icon name='arrowRight' />
                  </button>
                ) : undefined
              }
            >
              {updates.length ? (
                <div className='po-timeline'>
                  {updates.slice(0, 3).map((i) => (
                    <UpdateCard key={i.id} item={i} />
                  ))}
                </div>
              ) : (
                <Empty icon='bell' text={t('po_updates_empty')} />
              )}
            </Section>
          </>
        )}

        {view === 'updates' && (
          <Section title={t('po_updates_title')}>
            {updates.length ? (
              <div className='po-timeline'>
                {updates.map((i) => (
                  <UpdateCard key={i.id} item={i} />
                ))}
              </div>
            ) : (
              <Empty icon='bell' text={t('po_updates_empty')} />
            )}
          </Section>
        )}

        {view === 'trip' && (
          <Section title={t('po_trip_title')}>
            {trips.length ? trips.map((i) => <TripCard key={i.id} item={i} />) : <Empty icon='plane' text={t('po_trip_empty')} />}
          </Section>
        )}

        {view === 'documents' && (
          <Section title={t('po_documents_title')}>
            {documents.length ? (
              <>
                <ul className='po-docs'>
                  {documents.map((d) => (
                    <li key={d.id} className='po-card po-doc'>
                      <span className='po-doc__icon' aria-hidden='true'>
                        <Icon name='file' />
                      </span>
                      <div className='po-doc__text'>
                        <strong>{d.title}</strong>
                        <span>
                          {[d.document?.name, formatSize(d.document?.size ?? null, lang), formatDate(d.published_at, lang)].filter(Boolean).join(' · ')}
                        </span>
                        {d.body && <p>{d.body}</p>}
                      </div>
                      <a
                        className='btn btn--secondary po-doc__btn'
                        href={portalApi.fileUrl(d.id)}
                        download
                        onClick={() => setData((x) => ({ ...x, items: x.items.map((i) => (i.id === d.id ? { ...i, read: true } : i)) }))}
                      >
                        <Icon name='download' />
                        <span>{t('po_download')}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className='po-note'>
                  <Icon name='lock' /> {t('po_download_note')}
                </p>
              </>
            ) : (
              <Empty icon='file' text={t('po_documents_empty')} />
            )}
          </Section>
        )}

        {view === 'checklist' && (
          <Section title={t('po_checklist_title')}>
            {checklists.length ? (
              checklists.map((c) => <Checklist key={c.id} item={c} onChange={(checked) => setData((x) => ({ ...x, items: x.items.map((i) => (i.id === c.id ? { ...i, checked } : i)) }))} />)
            ) : (
              <Empty icon='list' text={t('po_checklist_empty')} />
            )}
          </Section>
        )}

        {view === 'messages' && (
          <Messages home={data} onSent={(m) => setData((x) => ({ ...x, messages: [...x.messages, m] }))} />
        )}

        {view === 'booking' && <Booking home={data} />}

        {view === 'settings' && <Settings home={data} reload={reload} onSignedOut={onSignedOut} />}
      </div>

      <nav className='po-tabbar' aria-label={t('po_nav_label')}>
        {MOBILE_TABS.map((id) => {
          const v = VIEWS.find((x) => x.id === id)!;
          return (
            <Link
              key={id}
              to={id === 'overview' ? '/espace-client' : `/espace-client?view=${id}`}
              className={`po-tabbar__link${view === id ? ' is-active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <span className='po-tabbar__icon'>
                <Icon name={v.icon} />
                {!!unreadByView[id] && <span className='po-dot' aria-label={t('po_unread', { n: unreadByView[id]! })} />}
              </span>
              <span>{t(v.label)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const Checklist: React.FC<{ item: PortalItem; onChange: (checked: number[]) => void }> = ({ item, onChange }) => {
  const { t } = useLanguage();
  const list = item.checklist ?? [];
  const done = list.filter((_, i) => item.checked.includes(i)).length;
  const toggle = async (index: number, checked: boolean) => {
    const optimistic = checked ? [...item.checked, index] : item.checked.filter((x) => x !== index);
    onChange(optimistic);
    try {
      const res = await portalApi.checklist(item.id, index, checked);
      onChange(res.checked);
    } catch {
      onChange(item.checked);
    }
  };
  return (
    <article className='po-card po-check'>
      <header className='po-check__head'>
        <h3>{item.title}</h3>
        <span className='po-progress' aria-hidden='true'>
          {t('po_checklist_progress', { done, total: list.length })}
        </span>
      </header>
      <div className='po-bar' role='progressbar' aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={done} aria-label={item.title}>
        <span style={{ transform: `scaleX(${list.length ? done / list.length : 0})` }} />
      </div>
      {item.body && <p className='po-prose'>{item.body}</p>}
      <ul className='po-check__list'>
        {list.map((label, i) => {
          const checked = item.checked.includes(i);
          return (
            <li key={i}>
              <label className={checked ? 'is-done' : undefined}>
                <input type='checkbox' checked={checked} onChange={(e) => toggle(i, e.target.checked)} />
                <span className='po-check__box' aria-hidden='true'>
                  <Icon name='check' />
                </span>
                <span>{label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </article>
  );
};

const Messages: React.FC<{ home: PortalHome; onSent: (m: PortalHome['messages'][number]) => void }> = ({ home, onSent }) => {
  const { t, lang } = useLanguage();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [home.messages.length]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const res = await portalApi.message(text);
      onSent({ id: res.id, sender: 'customer', body: text, created_at: res.created_at, read: true });
      setBody('');
    } catch (err) {
      setError(err instanceof PortalError && err.code === 'rate_limited' ? t('po_err_rate') : t('po_err_message'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title={t('po_messages_title')}>
      <div className='po-thread' aria-live='polite'>
        {home.messages.length === 0 && <Empty icon='chat' text={t('po_messages_empty')} />}
        {home.messages.map((m) => (
          <div key={m.id} className={`po-bubble po-bubble--${m.sender}`}>
            <p>{m.body}</p>
            <span>
              {m.sender === 'customer' ? t('po_you') : 'Black Pater'} · {formatDate(m.created_at, lang, true)}
            </span>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className='po-compose' onSubmit={send}>
        <label className='po-field'>
          <span className='po-field__label'>{t('po_message_label')}</span>
          <textarea rows={3} maxLength={4000} value={body} placeholder={t('po_message_placeholder')} onChange={(e) => setBody(e.target.value)} />
        </label>
        {error && (
          <p className='po-error' role='alert'>
            {error}
          </p>
        )}
        <button className='btn btn--primary' type='submit' disabled={busy || !body.trim()} aria-busy={busy}>
          <Icon name='send' />
          {t('po_send')}
        </button>
      </form>
    </Section>
  );
};

const Booking: React.FC<{ home: PortalHome }> = ({ home }) => {
  const { t, lang } = useLanguage();
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const openReceipt = async (id: string) => {
    setReceiptError(null);
    // Open the tab synchronously (popup blockers), then point it at the receipt.
    const w = window.open('about:blank', '_blank');
    try {
      const { url } = await portalApi.receipt(id);
      if (w) {
        w.opener = null;
        w.location.href = url;
      } else window.location.href = url;
    } catch {
      w?.close();
      setReceiptError(id);
    }
  };
  return (
    <Section title={t('po_booking_title')}>
      {home.bookings.length === 0 && <Empty icon='receipt' text={t('po_booking_none')} />}
      <ul className='po-bookings'>
        {home.bookings.map((b) => (
          <li key={b.id} className='po-card po-booking'>
            <div className='po-booking__head'>
              <h3>{offerLabel(t, b.offer_id, b.offer_name)}</h3>
              <span className={`po-status po-status--${b.status}`}>{b.status === 'paid' ? t('po_status_paid') : t('po_status_refunded')}</span>
            </div>
            <dl className='po-facts po-facts--grid'>
              <div>
                <dt>{t('po_amount')}</dt>
                <dd>{formatMoney(b.amount, b.currency, lang)}</dd>
              </div>
              {b.paid_at && (
                <div>
                  <dt>{t('po_paid_on')}</dt>
                  <dd>{formatDate(b.paid_at, lang)}</dd>
                </div>
              )}
              {b.status === 'refunded' && (
                <div>
                  <dt>{t('po_status')}</dt>
                  <dd>
                    {b.refund === 'partial' && b.amount_refunded !== null
                      ? t('po_refund_partial', { amount: formatMoney(b.amount_refunded, b.currency, lang), date: formatDate(b.refunded_at, lang) })
                      : b.refund === 'full'
                        ? t('po_refund_full', { date: formatDate(b.refunded_at, lang) })
                        : t('po_refunded_on', { date: formatDate(b.refunded_at, lang) })}
                  </dd>
                </div>
              )}
            </dl>
            <p className='po-note'>{t('po_one_time')}</p>
            {b.receipt && (
              <button type='button' className='btn btn--secondary' onClick={() => openReceipt(b.id)}>
                <Icon name='receipt' />
                {t('po_receipt')}
              </button>
            )}
            {receiptError === b.id && (
              <p className='po-error' role='alert'>
                {t('po_receipt_none')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
};

const Settings: React.FC<{ home: PortalHome; reload: () => Promise<void>; onSignedOut: () => void }> = ({ home, reload, onSignedOut }) => {
  const { t, lang } = useLanguage();
  const [confirm, setConfirm] = useState<null | 'one' | 'all'>(null);
  const [pwStep, setPwStep] = useState<'idle' | 'code'>('idle');
  const [pwCode, setPwCode] = useState('');
  const [pw, setPw] = useState('');
  const [emStep, setEmStep] = useState<'idle' | 'form' | 'codes'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [oldCode, setOldCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string; where: 'pw' | 'em' } | null>(null);

  const run = async (where: 'pw' | 'em', fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      setMsg({ kind: 'error', text: errorText(t, err), where });
    } finally {
      setBusy(false);
    }
  };

  const signOut = async (all: boolean) => {
    setConfirm(null);
    try {
      await portalApi.signOut(all);
    } finally {
      onSignedOut();
    }
  };

  return (
    <Section title={t('po_settings_title')}>
      <div className='po-card po-account'>
        <span className='po-avatar po-avatar--lg' aria-hidden='true'>
          {(home.customer.name || home.customer.email).slice(0, 1).toUpperCase()}
        </span>
        <div>
          {home.customer.name && <strong>{home.customer.name}</strong>}
          <span>{home.customer.email}</span>
          <span className='po-note'>{t('po_account_since', { date: formatDate(home.customer.since, lang) })}</span>
        </div>
      </div>

      <div className='po-card po-setting'>
        <h3>
          <Icon name='key' /> {t('po_password_title')}
        </h3>
        <p className='po-note'>{home.customer.has_password ? t('po_password_has') : t('po_password_text')}</p>
        {pwStep === 'idle' ? (
          <button
            type='button'
            className='btn btn--secondary'
            disabled={busy}
            onClick={() =>
              run('pw', async () => {
                await portalApi.passwordCode();
                setPwStep('code');
              })
            }
          >
            {home.customer.has_password ? t('po_password_change') : t('po_password_set')}
          </button>
        ) : (
          <form
            className='po-form'
            onSubmit={(e) => {
              e.preventDefault();
              if (!isCode(pwCode)) return setMsg({ kind: 'error', text: t('po_err_code_format'), where: 'pw' });
              void run('pw', async () => {
                await portalApi.setPassword(pwCode, pw);
                setPwStep('idle');
                setPwCode('');
                setPw('');
                setMsg({ kind: 'ok', text: t('po_password_saved'), where: 'pw' });
                await reload();
              });
            }}
          >
            <p className='po-note' role='status'>
              {t('po_password_code_sent', { email: home.customer.email })}
            </p>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_code')}</span>
              <input className='po-code-input' inputMode='numeric' autoComplete='one-time-code' value={pwCode} onChange={(e) => setPwCode(digits(e.target.value))} />
            </label>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_new_password')}</span>
              <input type='password' autoComplete='new-password' minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} aria-describedby='po-pw-rules' />
              <span className='po-field__hint' id='po-pw-rules'>
                {t('po_password_rules')}
              </span>
            </label>
            <div className='po-row'>
              <button type='submit' className='btn btn--primary' disabled={busy || pw.length < 10 || pwCode.length !== 6}>
                {t('po_confirm')}
              </button>
              <button type='button' className='po-link' onClick={() => setPwStep('idle')}>
                {t('po_cancel')}
              </button>
            </div>
          </form>
        )}
        {msg?.where === 'pw' && (
          <p className={msg.kind === 'ok' ? 'po-success' : 'po-error'} role={msg.kind === 'ok' ? 'status' : 'alert'}>
            {msg.text}
          </p>
        )}
      </div>

      <div className='po-card po-setting'>
        <h3>
          <Icon name='mail' /> {t('po_email_title')}
        </h3>
        <p className='po-note'>{t('po_email_text')}</p>
        {emStep === 'idle' && (
          <button type='button' className='btn btn--secondary' onClick={() => setEmStep('form')}>
            {t('po_email_title')}
          </button>
        )}
        {emStep === 'form' && (
          <form
            className='po-form'
            onSubmit={(e) => {
              e.preventDefault();
              if (!isEmail(newEmail)) return setMsg({ kind: 'error', text: t('po_err_email'), where: 'em' });
              void run('em', async () => {
                await portalApi.emailStart(newEmail.trim());
                setEmStep('codes');
              });
            }}
          >
            <label className='po-field'>
              <span className='po-field__label'>{t('po_new_email')}</span>
              <input type='email' inputMode='email' autoComplete='email' autoCapitalize='none' value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </label>
            <div className='po-row'>
              <button type='submit' className='btn btn--primary' disabled={busy}>
                {t('po_email_send')}
              </button>
              <button type='button' className='po-link' onClick={() => setEmStep('idle')}>
                {t('po_cancel')}
              </button>
            </div>
          </form>
        )}
        {emStep === 'codes' && (
          <form
            className='po-form'
            onSubmit={(e) => {
              e.preventDefault();
              if (!isCode(oldCode) || !isCode(newCode)) return setMsg({ kind: 'error', text: t('po_err_code_format'), where: 'em' });
              void run('em', async () => {
                await portalApi.emailConfirm(oldCode, newCode);
                setEmStep('idle');
                setOldCode('');
                setNewCode('');
                setMsg({ kind: 'ok', text: t('po_email_saved'), where: 'em' });
                await reload();
              });
            }}
          >
            <label className='po-field'>
              <span className='po-field__label'>{t('po_code_old')}</span>
              <input className='po-code-input' inputMode='numeric' autoComplete='off' value={oldCode} onChange={(e) => setOldCode(digits(e.target.value))} />
            </label>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_code_new')}</span>
              <input className='po-code-input' inputMode='numeric' autoComplete='off' value={newCode} onChange={(e) => setNewCode(digits(e.target.value))} />
            </label>
            <div className='po-row'>
              <button type='submit' className='btn btn--primary' disabled={busy}>
                {t('po_confirm')}
              </button>
              <button type='button' className='po-link' onClick={() => setEmStep('idle')}>
                {t('po_cancel')}
              </button>
            </div>
          </form>
        )}
        {msg?.where === 'em' && (
          <p className={msg.kind === 'ok' ? 'po-success' : 'po-error'} role={msg.kind === 'ok' ? 'status' : 'alert'}>
            {msg.text}
          </p>
        )}
      </div>

      <div className='po-card po-setting'>
        <h3>
          <Icon name='shield' /> {t('po_security_title')}
        </h3>
        <p className='po-note'>{t('po_sessions', { n: home.customer.sessions })}</p>
        <div className='po-row'>
          <button type='button' className='btn btn--secondary' onClick={() => setConfirm('one')}>
            <Icon name='logout' />
            {t('po_signout')}
          </button>
          <button type='button' className='btn btn--secondary po-danger' onClick={() => setConfirm('all')}>
            {t('po_signout_all')}
          </button>
        </div>
      </div>

      <Confirm
        open={confirm !== null}
        title={confirm === 'all' ? t('po_signout_all_confirm_title') : t('po_signout_confirm_title')}
        text={confirm === 'all' ? t('po_signout_all_confirm_text') : t('po_signout_confirm_text')}
        confirmLabel={confirm === 'all' ? t('po_signout_all') : t('po_signout')}
        onCancel={() => setConfirm(null)}
        onConfirm={() => signOut(confirm === 'all')}
      />
    </Section>
  );
};

/* ------------------------------------------------------------------ page */

export const PortalPage: React.FC = () => {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const [state, setState] = useState<'loading' | 'signed-out' | 'ready' | 'unavailable'>('loading');
  const [home, setHome] = useState<PortalHome | null>(null);

  const load = useCallback(async () => {
    try {
      const h = await portalApi.me();
      setHome(h);
      setState('ready');
    } catch (err) {
      setState(err instanceof PortalError && err.code === 'portal_unavailable' ? 'unavailable' : 'signed-out');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const signedOut = useCallback(() => {
    setHome(null);
    setState('signed-out');
    navigate('/espace-client', { replace: true });
  }, [navigate]);

  const body = useMemo(() => {
    if (state === 'loading')
      return (
        <div className='po-loading' role='status'>
          <span className='po-spinner' aria-hidden='true' />
          {t('po_loading')}
        </div>
      );
    if (state === 'unavailable')
      return (
        <section className='po-auth'>
          <div className='po-auth__card'>
            <p className='po-kicker'>{t('po_kicker')}</p>
            <h1 className='po-auth__title'>{t('po_signin_title')}</h1>
            <p className='po-auth__lead'>{t('po_err_unavailable')}</p>
            <Link to='/contact' className='btn btn--secondary'>
              <Icon name='mail' /> {t('po_back_site')}
            </Link>
          </div>
        </section>
      );
    if (state === 'signed-out' || !home) return <SignIn onSignedIn={() => void load()} />;
    return <Dashboard home={home} reload={load} onSignedOut={signedOut} />;
  }, [state, home, load, signedOut, t]);

  return <div className='po-page'>{body}</div>;
};

export default PortalPage;
