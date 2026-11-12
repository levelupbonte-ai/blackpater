import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Link, useRouter } from '../../app/router';
import { Icon, WhatsAppIcon, type IconName } from '../../components/Icon';
import {
  PortalError,
  daysLeft,
  digits,
  formatDate,
  formatMoney,
  formatSize,
  isCode,
  isEmail,
  portalApi,
  telHref,
  whatsappHref,
  type AssistantThread,
  type PortalHome,
  type PortalItem,
  type PortalLocked,
  type PortalMessage,
  type PortalPlan
} from './api';
import { formatOfferPrice, getOffer, getOfferByTier } from '../../../shared/offers.js';
import type { TranslationKey } from '../../i18n';
import { useMemberApp } from './member-app';
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

const SignIn: React.FC<{ onSignedIn: () => void; notice?: string | null }> = ({ onSignedIn, notice }) => {
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
        {notice && (
          <p className='po-success' role='status'>
            {notice}
          </p>
        )}

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

type View = 'home' | 'info' | 'messages' | 'assistant' | 'account';
const VIEWS: { id: View; icon: IconName; label: Parameters<T>[0] }[] = [
  { id: 'home', icon: 'home', label: 'po_nav_home' },
  { id: 'info', icon: 'bell', label: 'po_nav_info' },
  { id: 'messages', icon: 'chat', label: 'po_nav_messages' },
  { id: 'assistant', icon: 'sparkles', label: 'po_nav_assistant' },
  { id: 'account', icon: 'user', label: 'po_nav_account' }
];
/** Old links (e-mails, bookmarks) still land in the right place. */
const LEGACY_VIEWS: Record<string, View> = {
  overview: 'home',
  updates: 'info',
  trip: 'info',
  documents: 'info',
  checklist: 'info',
  booking: 'account',
  settings: 'account',
  plans: 'account'
};

function readView(search: string): View {
  const v = new URLSearchParams(search).get('view') || '';
  if (VIEWS.some((x) => x.id === v)) return v as View;
  return LEGACY_VIEWS[v] ?? 'home';
}
const viewPath = (v: View) => (v === 'home' ? '/espace-client' : `/espace-client?view=${v}`);

const Confirm: React.FC<{
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, text, confirmLabel, danger, busy, onConfirm, onCancel }) => {
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
        <button type='button' className={`btn btn--primary${danger ? ' po-btn-danger' : ''}`} onClick={onConfirm} disabled={busy} aria-busy={busy} autoFocus>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
};

const Empty: React.FC<{ icon: IconName; title?: string; text: string; children?: React.ReactNode }> = ({ icon, title, text, children }) => (
  <div className='po-empty'>
    <span className='po-empty__icon' aria-hidden='true'>
      <Icon name={icon} />
    </span>
    {title && <strong>{title}</strong>}
    <p>{text}</p>
    {children}
  </div>
);

const Section: React.FC<{ id: string; title: string; lead?: string; children: React.ReactNode; action?: React.ReactNode }> = ({
  id,
  title,
  lead,
  children,
  action
}) => (
  <section className='po-section' aria-labelledby={`po-h-${id}`} id={id}>
    <div className='po-section__head'>
      <div>
        <h2 id={`po-h-${id}`}>{title}</h2>
        {lead && <p className='po-section__lead'>{lead}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

function planForLevel(plans: PortalPlan[], level: number) {
  return plans.filter((p) => p.level >= level).sort((a, b) => a.level - b.level)[0] ?? null;
}

function payErrorText(t: T, err: unknown) {
  const code = err instanceof PortalError ? err.code : 'generic';
  if (code === 'payments_unavailable') return t('po_err_payments');
  if (code === 'already_subscribed') return t('po_err_already');
  if (code === 'nothing_due') return t('po_err_nothing_due');
  if (code === 'membership_expired') return t('po_plans_need_member');
  return errorText(t, err);
}

/** The membership offer the member renews, from the catalog (regular monthly price). */
function renewalOffer(home: PortalHome) {
  return getOffer(home.membership?.offer_id) || getOfferByTier('solo');
}

/** Opens Stripe's payment page for one more month (or one month of a plan). */
async function goPay(start: () => Promise<{ url: string }>) {
  const { url } = await start();
  window.location.assign(url);
  await new Promise(() => {}); // keep the button busy while the payment page opens
}

/**
 * What the member has right now and the next step: membership running (until
 * when), ending soon, or ended (renew); the plan of the month; the free offer.
 */
const AccessCard: React.FC<{ home: PortalHome; onPlans?: () => void }> = ({ home, onPlans }) => {
  const { t, lang } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { access, plans, membership } = home;
  const offer = renewalOffer(home);
  const price = formatOfferPrice(offer, lang, offer.amount);
  const until = formatDate(membership?.until ?? null, lang);
  const left = daysLeft(membership?.until ?? null);
  const plan = access.plan?.active ? access.plan : null;

  const renewPlan = plan ? plans.find((p) => p.level === plan.level) : null;
  const renewPrice = renewPlan ? formatMoney(renewPlan.amount, renewPlan.currency, lang) : price;
  const renew = async () => {
    setBusy(true);
    setError(null);
    try {
      await goPay(renewPlan ? () => portalApi.planBuy(renewPlan.level) : portalApi.renew);
    } catch (err) {
      setError(payErrorText(t, err));
      setBusy(false);
    }
  };
  const renewButton = (primary: boolean) => (
    <button type='button' className={`btn ${primary ? 'btn--primary' : 'btn--secondary'}`} onClick={renew} disabled={busy} aria-busy={busy}>
      <Icon name='card' /> {t('po_renew_cta', { price: renewPrice })}
    </button>
  );
  const errorLine = error && (
    <p className='po-error' role='alert'>
      {error}
    </p>
  );

  if (membership?.monthly && !membership.active) {
    return (
      <div className='po-card po-access po-access--warn' role='status'>
        <span className='po-access__icon' aria-hidden='true'>
          <Icon name='lock' />
        </span>
        <div className='po-access__body'>
          <strong>{t('po_member_ended_title')}</strong>
          <p>{until ? t('po_member_ended_text', { date: until }) : t('po_member_ended_text_nodate')}</p>
          {renewButton(true)}
          {errorLine}
        </div>
      </div>
    );
  }

  const soon = membership?.monthly && left <= 7;
  return (
    <div className={`po-card po-access ${soon ? 'po-access--trial' : 'po-access--plan'}`}>
      <span className='po-access__icon' aria-hidden='true'>
        <Icon name={soon ? 'clock' : 'check'} />
      </span>
      <div className='po-access__body'>
        <span className='po-kicker'>{t('po_member_title')}</span>
        {membership?.monthly ? (
          <>
            <strong>{t('po_member_until', { date: until })}</strong>
            <p>
              {left <= 1 ? t('po_member_last_day') : t('po_member_days_left', { n: left })}
              {' · '}
              {membership.reminders ? t('po_member_no_auto') : t('po_member_reminders_off', { date: until })}
            </p>
            {soon && renewButton(true)}
          </>
        ) : (
          <strong>{t('po_member_active')}</strong>
        )}
        {plan && (
          <p className='po-access__plan'>
            <Icon name='star' /> {t('po_plan_until', { name: plan.plan_name || '', date: formatDate(plan.ends_at, lang) })}
          </p>
        )}
        {!plan && access.trial_active && (
          <p className='po-access__plan'>
            <Icon name='star' /> {t('po_trial_until', { date: formatDate(access.trial_ends_at, lang) })}
          </p>
        )}
        {!plan && onPlans && plans.length > 0 && (
          <button type='button' className='po-link' onClick={onPlans}>
            {t('po_see_plans')} <Icon name='arrowRight' />
          </button>
        )}
        {errorLine}
      </div>
    </div>
  );
};

/** Install the space as an app and get notifications instead of e-mails. */
const AppCard: React.FC = () => {
  const { t } = useLanguage();
  const app = useMemberApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (app.push === 'loading' || (app.push === 'unsupported' && !app.canInstall)) return null;
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError(t('po_app_error'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className='po-card po-app'>
      <span className='po-access__icon' aria-hidden='true'>
        <Icon name='bell' />
      </span>
      <div className='po-access__body'>
        <strong>{t('po_app_title')}</strong>
        <p>{app.push === 'on' ? t('po_app_on') : t('po_app_text')}</p>
        {app.push === 'ios-install' && <p className='po-note'>{t('po_app_ios')}</p>}
        {app.push === 'denied' && <p className='po-note'>{t('po_app_denied')}</p>}
        <div className='po-row'>
          {app.canInstall && (
            <button type='button' className='btn btn--secondary' disabled={busy} onClick={() => run(app.install)}>
              <Icon name='download' /> {t('po_app_install')}
            </button>
          )}
          {app.push === 'off' && (
            <button type='button' className='btn btn--primary' disabled={busy} aria-busy={busy} onClick={() => run(app.enable)}>
              <Icon name='bell' /> {t('po_app_enable')}
            </button>
          )}
          {app.push === 'on' && (
            <button type='button' className='po-link po-link--muted' disabled={busy} onClick={() => run(app.disable)}>
              {t('po_app_disable')}
            </button>
          )}
        </div>
        {error && (
          <p className='po-error' role='alert'>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

/** Phone and WhatsApp: members only, never on the public site. */
const ContactCard: React.FC<{ home: PortalHome; onWrite: () => void }> = ({ home, onWrite }) => {
  const { t } = useLanguage();
  const { phone, whatsapp, note } = home.contact || {};
  return (
    <div className='po-card po-contact'>
      <div>
        <strong>{t('po_contact_title')}</strong>
        <p className='po-note'>{note || t('po_contact_text')}</p>
      </div>
      <div className='po-contact__actions'>
        <button type='button' className='btn btn--primary' onClick={onWrite}>
          <Icon name='chat' /> {t('po_contact_write')}
        </button>
        {whatsapp && (
          <a className='btn btn--secondary' href={whatsappHref(whatsapp)} target='_blank' rel='noopener noreferrer'>
            <WhatsAppIcon /> {t('po_contact_whatsapp')}
          </a>
        )}
        {phone && (
          <a className='btn btn--secondary' href={telHref(phone)}>
            <Icon name='phone' /> {t('po_contact_call')} <span className='po-contact__num'>{phone}</span>
          </a>
        )}
      </div>
    </div>
  );
};

const KIND_ICON: Record<PortalItem['kind'], IconName> = { update: 'bell', trip: 'plane', document: 'file', checklist: 'list' };

const TripBody: React.FC<{ item: PortalItem }> = ({ item }) => {
  const { lang, t } = useLanguage();
  const trip = item.trip;
  if (!trip) return null;
  const dates = [formatDate(trip.start_date, lang), formatDate(trip.end_date, lang)].filter(Boolean).join(' → ');
  return (
    <>
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
    </>
  );
};

const ChecklistBody: React.FC<{ item: PortalItem; onChange: (checked: number[]) => void }> = ({ item, onChange }) => {
  const { t } = useLanguage();
  const list = item.checklist ?? [];
  const done = list.filter((_, i) => item.checked.includes(i)).length;
  const toggle = async (index: number, checked: boolean) => {
    const before = item.checked;
    onChange(checked ? [...before, index] : before.filter((x) => x !== index));
    try {
      const res = await portalApi.checklist(item.id, index, checked);
      onChange(res.checked);
    } catch {
      onChange(before);
    }
  };
  return (
    <>
      <div className='po-check__head'>
        <span className='po-progress'>{t('po_checklist_progress', { done, total: list.length })}</span>
      </div>
      <div className='po-bar' role='progressbar' aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={done} aria-label={item.title}>
        <span style={{ transform: `scaleX(${list.length ? done / list.length : 0})` }} />
      </div>
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
    </>
  );
};

const kindLabel = (t: T, kind: PortalItem['kind']) => t(`po_kind_${kind}` as TranslationKey);

const FeedCard: React.FC<{ item: PortalItem; fresh: boolean; onChecklist: (checked: number[]) => void }> = ({ item, fresh, onChecklist }) => {
  const { t, lang } = useLanguage();
  return (
    <article className={`po-card po-feed-card po-feed-card--${item.kind}${fresh ? ' is-unread' : ''}`}>
      <header className='po-feed-card__meta'>
        <span className={`po-kind po-kind--${item.kind}`}>
          <Icon name={KIND_ICON[item.kind]} /> {kindLabel(t, item.kind)}
        </span>
        <time dateTime={item.published_at}>{formatDate(item.published_at, lang)}</time>
        {fresh && <span className='po-badge'>{t('po_new')}</span>}
      </header>
      <h3>{item.title}</h3>
      {item.body && <p className='po-prose'>{item.body}</p>}
      {item.kind === 'trip' && <TripBody item={item} />}
      {item.kind === 'checklist' && <ChecklistBody item={item} onChange={onChecklist} />}
      {item.kind === 'document' && (
        <div className='po-doc'>
          <span className='po-doc__icon' aria-hidden='true'>
            <Icon name='file' />
          </span>
          <span className='po-doc__text'>
            <strong>{item.document?.name || item.title}</strong>
            <span>{formatSize(item.document?.size ?? null, lang)}</span>
          </span>
          <a className='btn btn--secondary po-doc__btn' href={portalApi.fileUrl(item.id)} download>
            <Icon name='download' />
            <span>{t('po_download')}</span>
          </a>
        </div>
      )}
    </article>
  );
};

const LockedCard: React.FC<{ item: PortalLocked; plans: PortalPlan[]; onPlans: () => void }> = ({ item, plans, onPlans }) => {
  const { t, lang } = useLanguage();
  const plan = planForLevel(plans, item.min_level);
  return (
    <article className='po-card po-locked'>
      <span className='po-locked__icon' aria-hidden='true'>
        <Icon name='lock' />
      </span>
      <div className='po-locked__body'>
        <span className='po-feed-card__meta'>
          <span className={`po-kind po-kind--${item.kind}`}>
            <Icon name={KIND_ICON[item.kind]} /> {kindLabel(t, item.kind)}
          </span>
          <time dateTime={item.published_at}>{formatDate(item.published_at, lang)}</time>
        </span>
        <strong>{item.title}</strong>
        <span className='po-note'>{plan ? t('po_locked_title', { plan: plan.name }) : t('po_locked_generic')}</span>
      </div>
      {plans.length > 0 && (
        <button type='button' className='btn btn--secondary' onClick={onPlans}>
          {t('po_locked_cta')}
        </button>
      )}
    </article>
  );
};

const InfoFeed: React.FC<{
  data: PortalHome;
  setData: React.Dispatch<React.SetStateAction<PortalHome>>;
  markRead: (ids: string[]) => void;
  onPlans: () => void;
}> = ({ data, setData, markRead, onPlans }) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  // What was new when the page opened keeps its "New" badge during this visit.
  const [fresh] = useState(() => new Set(data.items.filter((i) => !i.read).map((i) => i.id)));

  useEffect(() => {
    const unread = data.items.filter((i) => !i.read).slice(0, 20);
    if (!unread.length) return;
    unread.forEach((i) => void portalApi.read(i.id).catch(() => {}));
    markRead(unread.map((i) => i.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = filter === 'unread' ? data.items.filter((i) => fresh.has(i.id)) : data.items;

  return (
    <>
      <Section
        id='info'
        title={t('po_info_title')}
        lead={t('po_info_lead')}
        action={
          fresh.size > 0 ? (
            <div className='po-chips' role='group' aria-label={t('po_info_title')}>
              {(['all', 'unread'] as const).map((f) => (
                <button key={f} type='button' className={`po-chip${filter === f ? ' is-active' : ''}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'all' ? t('po_filter_all') : `${t('po_filter_unread')} · ${fresh.size}`}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        {items.length ? (
          <div className='po-feed'>
            {items.map((i) => (
              <FeedCard
                key={i.id}
                item={i}
                fresh={fresh.has(i.id)}
                onChecklist={(checked) => setData((x) => ({ ...x, items: x.items.map((it) => (it.id === i.id ? { ...it, checked } : it)) }))}
              />
            ))}
          </div>
        ) : (
          <Empty icon='bell' text={t('po_info_empty')} />
        )}
      </Section>
      {data.locked.length > 0 && (
        <Section id='locked' title={t('po_locked_section')}>
          <div className='po-feed'>
            {data.locked.map((l) => (
              <LockedCard key={l.id} item={l} plans={data.plans} onPlans={onPlans} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ messages */

type ChatMessage = PortalMessage & { pending?: boolean; failed?: boolean };

const MAX_MESSAGE = 4000;

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(t: T, iso: string, lang: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (dayKey(iso) === dayKey(today.toISOString())) return t('po_chat_today');
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return t('po_chat_yesterday');
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}

const timeOf = (iso: string, lang: string) =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const Chat: React.FC<{
  data: PortalHome;
  messages: ChatMessage[];
  setMessages: (fn: (m: ChatMessage[]) => ChatMessage[]) => void;
  locked?: boolean;
  onRenew?: () => void;
}> = ({ data, messages, setMessages, locked = false, onRenew }) => {
  const { t, lang } = useLanguage();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const thread = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const finePointer = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches, []);

  // Stay at the bottom when new messages arrive, unless the member scrolled up to read.
  useEffect(() => {
    const el = thread.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // The box grows with the text, up to a limit.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [body]);

  const deliver = async (tempId: string, text: string) => {
    try {
      const res = await portalApi.message(text);
      setMessages((list) => {
        const already = list.some((m) => m.id === res.id);
        return already
          ? list.filter((m) => m.id !== tempId)
          : list.map((m) => (m.id === tempId ? { ...m, id: res.id, created_at: res.created_at, pending: false, failed: false } : m));
      });
    } catch (err) {
      setMessages((list) => list.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      setError(
        err instanceof PortalError && err.code === 'rate_limited'
          ? t('po_err_rate')
          : err instanceof PortalError && err.code === 'membership_expired'
            ? t('po_chat_locked')
            : t('po_err_message')
      );
    }
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setError(null);
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    nearBottom.current = true;
    setMessages((list) => [...list, { id: tempId, sender: 'customer', body: clean, created_at: new Date().toISOString(), read: true, pending: true }]);
    setBody('');
    void deliver(tempId, clean);
    input.current?.focus();
  };

  const retry = (m: ChatMessage) => {
    setError(null);
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, pending: true, failed: false } : x)));
    void deliver(m.id, m.body);
  };

  const lastOwn = [...messages].reverse().find((m) => m.sender === 'customer' && !m.pending && !m.failed);
  const { phone, whatsapp } = data.contact || {};
  let lastDay = '';

  return (
    <section className='po-chat' aria-labelledby='po-chat-title'>
      <header className='po-chat__head'>
        <span className='po-chat__avatar' aria-hidden='true'>
          BP
        </span>
        <div className='po-chat__who'>
          <h2 id='po-chat-title'>Black Pater</h2>
          <p>{t('po_chat_sub')}</p>
        </div>
        <div className='po-chat__quick'>
          {whatsapp && (
            <a className='po-icon-btn' href={whatsappHref(whatsapp)} target='_blank' rel='noopener noreferrer' aria-label={t('po_contact_whatsapp')}>
              <WhatsAppIcon />
            </a>
          )}
          {phone && (
            <a className='po-icon-btn' href={telHref(phone)} aria-label={`${t('po_contact_call')} ${phone}`}>
              <Icon name='phone' />
            </a>
          )}
        </div>
      </header>

      <div
        className='po-chat__thread'
        ref={thread}
        role='log'
        aria-live='polite'
        aria-label={t('po_messages_title')}
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {messages.length === 0 && (
          <div className='po-chat__start'>
            <Empty icon='chat' title={t('po_chat_start')} text={t('po_chat_start_text')}>
              <div className='po-chips po-chips--wrap'>
                {(['po_chat_q1', 'po_chat_q2', 'po_chat_q3'] as const).map((k) => (
                  <button
                    key={k}
                    type='button'
                    className='po-chip'
                    onClick={() => {
                      setBody(t(k) + ' : ');
                      input.current?.focus();
                    }}
                  >
                    {t(k)}
                  </button>
                ))}
              </div>
            </Empty>
          </div>
        )}
        {messages.map((m) => {
          const key = dayKey(m.created_at);
          const separator = key !== lastDay ? dayLabel(t, m.created_at, lang) : null;
          lastDay = key;
          const own = m.sender === 'customer';
          return (
            <React.Fragment key={m.id}>
              {separator && (
                <div className='po-chat__day' role='separator'>
                  <span>{separator}</span>
                </div>
              )}
              <div className={`po-msg po-msg--${own ? 'me' : 'them'}${m.failed ? ' is-failed' : ''}${m.pending ? ' is-pending' : ''}`}>
                <div className='po-msg__bubble'>
                  {m.via === 'assistant' && (
                    <span className='po-ai__tag'>
                      <Icon name='sparkles' /> {t('po_chat_via_ai')}
                    </span>
                  )}
                  {m.validated && (
                    <span className='po-ai__tag po-ai__tag--ok'>
                      <Icon name='check' /> {t('po_chat_validated')}
                    </span>
                  )}
                  <p>{m.body}</p>
                  <span className='po-msg__meta'>
                    <time dateTime={m.created_at}>{timeOf(m.created_at, lang)}</time>
                    {own && m.pending && <span>· {t('po_chat_sending')}</span>}
                    {own && m === lastOwn && <span className={m.seen ? 'is-seen' : undefined}>· {m.seen ? t('po_chat_seen') : t('po_chat_sent')}</span>}
                  </span>
                </div>
                {m.failed && (
                  <button type='button' className='po-msg__retry' onClick={() => retry(m)}>
                    <Icon name='refresh' /> {t('po_chat_failed')}
                  </button>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {locked ? (
        <div className='po-chat__locked' role='status'>
          <Icon name='lock' />
          <span>{t('po_chat_locked')}</span>
          <button type='button' className='btn btn--primary' onClick={onRenew}>
            {t('po_chat_locked_cta')}
          </button>
        </div>
      ) : (
      <form
        className='po-chat__compose'
        onSubmit={(e) => {
          e.preventDefault();
          send(body);
        }}
      >
        <label className='po-sr' htmlFor='po-chat-input'>
          {t('po_message_label')}
        </label>
        <textarea
          id='po-chat-input'
          ref={input}
          rows={1}
          maxLength={MAX_MESSAGE}
          value={body}
          placeholder={t('po_chat_placeholder')}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (finePointer && e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send(body);
            }
          }}
          aria-describedby='po-chat-hint'
        />
        <button className='po-chat__send' type='submit' disabled={!body.trim()} aria-label={t('po_send')}>
          <Icon name='send' />
        </button>
      </form>
      )}
      <p className='po-chat__hint' id='po-chat-hint'>
        {error ? (
          <span className='po-error' role='alert'>
            {error}
          </span>
        ) : body.length > MAX_MESSAGE - 500 ? (
          t('po_chat_chars', { n: MAX_MESSAGE - body.length })
        ) : finePointer ? (
          t('po_chat_hint')
        ) : null}
      </p>
    </section>
  );
};

/* ------------------------------------------------------------------ AI assistant */

const MAX_QUESTION = 2000;

/** A source's label: its title (often the website's name), else its host. */
function sourceLabel(s: { url: string; title: string }) {
  if (s.title) return s.title;
  try {
    return new URL(s.url).hostname.replace(/^www\./, '');
  } catch {
    return s.url;
  }
}

/**
 * The member's AI assistant. The AI runs at LevelUp (keys never on this site);
 * it is always presented as an AI, shows its sources with the date they were
 * checked, and hands a question to Black Pater in one tap.
 */
const Assistant: React.FC<{
  thread: AssistantThread;
  setThread: (fn: (t: AssistantThread) => AssistantThread) => void;
  onRenew: () => void;
}> = ({ thread, setThread, onRenew }) => {
  const { t, lang } = useLanguage();
  const [body, setBody] = useState('');
  const [asking, setAsking] = useState<string | null>(null);
  const [handing, setHanding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const finePointer = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches, []);
  const left = Math.max(0, thread.daily - thread.used);
  const locked = !thread.active;

  useEffect(() => {
    const el = box.current;
    if (el && (thread.messages.length || asking)) el.scrollTop = el.scrollHeight;
  }, [thread.messages.length, asking]);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [body]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || asking || left === 0) return;
    setError(null);
    setAsking(q);
    setBody('');
    try {
      await portalApi.assistantAsk(q);
      const fresh = await portalApi.assistant();
      setThread(() => fresh);
    } catch (err) {
      setBody(q);
      const code = err instanceof PortalError ? err.code : '';
      setError(code === 'rate_limited' ? t('po_ai_err_rate') : code === 'membership_expired' ? t('po_ai_locked') : t('po_ai_err_down'));
    } finally {
      setAsking(null);
    }
  };

  const handoff = async (questionId: string) => {
    setError(null);
    setHanding(questionId);
    try {
      await portalApi.assistantHandoff(questionId);
      setThread((th) => ({ ...th, messages: th.messages.map((m) => (m.id === questionId ? { ...m, handed_off: true } : m)) }));
    } catch (err) {
      setError(err instanceof PortalError && err.code === 'rate_limited' ? t('po_ai_err_rate') : t('po_ai_err_handoff'));
    } finally {
      setHanding(null);
    }
  };

  const questions = new Map(thread.messages.filter((m) => m.role === 'user').map((m) => [m.id, m]));
  let lastDay = '';

  return (
    <section className='po-chat po-ai' aria-labelledby='po-ai-title'>
      <header className='po-chat__head'>
        <span className='po-chat__avatar po-ai__avatar' aria-hidden='true'>
          <Icon name='sparkles' />
        </span>
        <div className='po-chat__who'>
          <h2 id='po-ai-title'>{t('po_ai_title')}</h2>
          <p>{t('po_ai_sub')}</p>
        </div>
      </header>

      <div className='po-chat__thread' ref={box} role='log' aria-live='polite' aria-busy={!!asking}>
        {thread.messages.length === 0 && !asking && (
          <div className='po-chat__start'>
            <Empty icon='sparkles' title={t('po_ai_intro_title')} text={t('po_ai_intro_text')}>
              {!locked && (
                <div className='po-chips po-chips--wrap'>
                  {(['po_ai_q1', 'po_ai_q2', 'po_ai_q3'] as const).map((k) => (
                    <button key={k} type='button' className='po-chip' onClick={() => void ask(t(k))}>
                      {t(k)}
                    </button>
                  ))}
                </div>
              )}
            </Empty>
          </div>
        )}
        {thread.messages.map((m) => {
          const key = dayKey(m.created_at);
          const separator = key !== lastDay ? dayLabel(t, m.created_at, lang) : null;
          lastDay = key;
          const question = m.role === 'assistant' && m.question_id ? questions.get(m.question_id) : undefined;
          return (
            <React.Fragment key={m.id}>
              {separator && (
                <div className='po-chat__day' role='separator'>
                  <span>{separator}</span>
                </div>
              )}
              <div className={`po-msg po-msg--${m.role === 'user' ? 'me' : 'them'}${m.role === 'owner' ? ' po-msg--validated' : ''}`}>
                <div className='po-msg__bubble'>
                  {m.role === 'assistant' && (
                    <span className='po-ai__tag'>
                      <Icon name='sparkles' /> {t('po_ai_badge')}
                    </span>
                  )}
                  {m.role === 'owner' && (
                    <span className='po-ai__tag po-ai__tag--ok'>
                      <Icon name='check' /> {t('po_ai_validated')}
                    </span>
                  )}
                  <p>{m.body}</p>
                  {m.role === 'assistant' &&
                    (m.sources.length ? (
                      <div className='po-ai__sources'>
                        <strong>
                          {t('po_ai_sources')} · {t('po_ai_checked_on', { date: formatDate(m.created_at, lang) })}
                        </strong>
                        <ol>
                          {m.sources.map((src) => (
                            <li key={src.url}>
                              <a href={src.url} target='_blank' rel='noopener noreferrer nofollow'>
                                {sourceLabel(src)}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <p className='po-ai__nosource'>{t('po_ai_no_sources')}</p>
                    ))}
                  <span className='po-msg__meta'>
                    <time dateTime={m.created_at}>{timeOf(m.created_at, lang)}</time>
                  </span>
                </div>
                {question &&
                  (question.handed_off ? (
                    <p className='po-ai__handed'>
                      <Icon name='check' /> {t('po_ai_handed_off')}
                    </p>
                  ) : (
                    !locked && (
                      <button type='button' className='po-ai__ask' disabled={handing === question.id} onClick={() => void handoff(question.id)}>
                        <Icon name='send' /> {handing === question.id ? t('po_ai_asking_bp') : t('po_ai_ask_bp')}
                      </button>
                    )
                  ))}
              </div>
            </React.Fragment>
          );
        })}
        {asking && (
          <>
            <div className='po-msg po-msg--me is-pending'>
              <div className='po-msg__bubble'>
                <p>{asking}</p>
              </div>
            </div>
            <div className='po-msg po-msg--them'>
              <div className='po-msg__bubble po-ai__thinking'>
                <span className='po-ai__dots' aria-hidden='true'>
                  <i />
                  <i />
                  <i />
                </span>
                <p>{t('po_ai_thinking')}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {locked ? (
        <div className='po-chat__locked' role='status'>
          <Icon name='lock' />
          <span>{t('po_ai_locked')}</span>
          <button type='button' className='btn btn--primary' onClick={onRenew}>
            {t('po_chat_locked_cta')}
          </button>
        </div>
      ) : (
        <form
          className='po-chat__compose'
          onSubmit={(e) => {
            e.preventDefault();
            void ask(body);
          }}
        >
          <label className='po-sr' htmlFor='po-ai-input'>
            {t('po_ai_label')}
          </label>
          <textarea
            id='po-ai-input'
            ref={input}
            rows={1}
            maxLength={MAX_QUESTION}
            value={body}
            disabled={!!asking || left === 0}
            placeholder={t('po_ai_placeholder')}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (finePointer && e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void ask(body);
              }
            }}
            aria-describedby='po-ai-hint'
          />
          <button className='po-chat__send' type='submit' disabled={!body.trim() || !!asking || left === 0} aria-label={t('po_ai_send')}>
            <Icon name='send' />
          </button>
        </form>
      )}
      <p className='po-chat__hint' id='po-ai-hint'>
        {error ? (
          <span className='po-error' role='alert'>
            {error}
          </span>
        ) : (
          !locked && (left === 0 ? t('po_ai_left_none') : left === 1 ? t('po_ai_left_one') : t('po_ai_left', { n: left }))
        )}
      </p>
      <p className='po-ai__disclaimer'>{t('po_ai_disclaimer')}</p>
    </section>
  );
};

/* ------------------------------------------------------------------ account */

const Plans: React.FC<{ home: PortalHome; reload: () => Promise<void>; flash: (text: string) => void }> = ({ home, reload, flash }) => {
  const { t, lang } = useLanguage();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ask, setAsk] = useState(false);
  const { membership } = home;
  const current = home.access.plan?.active ? home.access.plan : null;
  const offer = renewalOffer(home);
  const until = formatDate(membership?.until ?? null, lang);
  const active = Boolean(membership?.active);

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(payErrorText(t, err));
    } finally {
      setBusy(null);
      setAsk(false);
    }
  };

  const baseCurrent = active && !current;
  return (
    <Section id='plans' title={t('po_plans_title')} lead={t('po_plans_lead_monthly')}>
      <AccessCard home={home} />

      <h3 className='po-subtitle'>{t('po_formula_title')}</h3>
      <p className='po-note'>{t('po_formula_text')}</p>
      <div className='po-plans'>
        <article className={`po-card po-plan${baseCurrent ? ' is-current' : ''}`}>
          {baseCurrent && <span className='po-plan__tag'>{t('po_plan_until_short', { date: until })}</span>}
          <h3>{t('po_formula_base')}</h3>
          <p className='po-plan__price'>
            <strong>{formatOfferPrice(offer, lang, offer.amount)}</strong> <span>{t('po_per_month')}</span>
          </p>
          <p className='po-plan__desc'>{offerLabel(t, offer.id, null)}</p>
          <ul className='po-plan__features'>
            {(['po_formula_base_f1', 'po_formula_base_f2', 'po_formula_base_f3'] as const).map((k) => (
              <li key={k}>
                <Icon name='check' /> {t(k)}
              </li>
            ))}
          </ul>
          <button
            type='button'
            className={`btn ${baseCurrent ? 'btn--secondary' : active ? 'btn--secondary' : 'btn--primary'}`}
            disabled={busy !== null}
            aria-busy={busy === 'renew'}
            onClick={() => act('renew', () => goPay(portalApi.renew))}
          >
            {baseCurrent ? t('po_plan_extend') : active ? t('po_formula_back_base') : t('po_plan_take')}
          </button>
        </article>
        {home.plans.map((p) => {
          const mine = current?.level === p.level;
          return (
            <article key={p.level} className={`po-card po-plan${mine ? ' is-current' : ''}`}>
              {mine && <span className='po-plan__tag'>{t('po_plan_until_short', { date: formatDate(current!.ends_at, lang) })}</span>}
              <h3>{p.name}</h3>
              <p className='po-plan__price'>
                <strong>{formatMoney(p.amount, p.currency, lang)}</strong> <span>{t('po_per_month')}</span>
              </p>
              {p.description && <p className='po-plan__desc'>{p.description}</p>}
              <ul className='po-plan__features'>
                <li>
                  <Icon name='check' /> {t('po_formula_includes_base')}
                </li>
                {p.features.map((f, i) => (
                  <li key={i}>
                    <Icon name='check' /> {f}
                  </li>
                ))}
              </ul>
              <button
                type='button'
                className={`btn ${mine ? 'btn--secondary' : 'btn--primary'}`}
                disabled={busy !== null}
                aria-busy={busy === `plan-${p.level}`}
                onClick={() => act(`plan-${p.level}`, () => goPay(() => portalApi.planBuy(p.level)))}
              >
                {mine ? t('po_plan_extend') : active ? t('po_plan_switch') : t('po_plan_take')}
              </button>
            </article>
          );
        })}
      </div>
      {home.plans.length === 0 && <p className='po-note'>{t('po_plans_soon')}</p>}

      {membership?.monthly && active && (
        <div className='po-row'>
          {membership.reminders ? (
            <button type='button' className='po-link po-link--muted' onClick={() => setAsk(true)}>
              {t('po_cancel_sub')}
            </button>
          ) : (
            <button
              type='button'
              className='po-link'
              disabled={busy !== null}
              onClick={() =>
                act('resume', async () => {
                  await portalApi.reminders(true);
                  await reload();
                  flash(t('po_reminders_on_done'));
                })
              }
            >
              {t('po_reminders_on')}
            </button>
          )}
        </div>
      )}
      {error && (
        <p className='po-error' role='alert'>
          {error}
        </p>
      )}
      <Confirm
        open={ask}
        busy={busy !== null}
        danger
        title={t('po_cancel_sub_title')}
        text={t('po_cancel_sub_text', { date: until })}
        confirmLabel={t('po_cancel_sub')}
        onCancel={() => setAsk(false)}
        onConfirm={() =>
          void act('cancel', async () => {
            await portalApi.reminders(false);
            await reload();
            flash(t('po_cancel_sub_done', { date: until }));
          })
        }
      />
    </Section>
  );
};

const Payments: React.FC<{ home: PortalHome }> = ({ home }) => {
  const { t, lang } = useLanguage();
  const [receiptError, setReceiptError] = useState<string | null>(null);
  if (home.bookings.length === 0) return null;
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
    <Section id='payments' title={t('po_payments_title')}>
      <ul className='po-payments'>
        {home.bookings.map((b) => (
          <li key={b.id} className='po-card po-payment'>
            <div className='po-payment__main'>
              <strong>
                {b.kind === 'plan'
                  ? `${t('po_plan_label')} · ${(b.offer_name || '').replace(/^Black Pater · /, '')}`
                  : `${t('po_membership')} · ${offerLabel(t, b.offer_id, b.offer_name)}`}
              </strong>
              <span className='po-note'>
                {formatMoney(b.amount, b.currency, lang)}
                {b.paid_at && ` · ${formatDate(b.paid_at, lang)}`}
                {b.period_end && ` · ${t('po_period_until', { date: formatDate(b.period_end, lang) })}`}
              </span>
              {b.status === 'refunded' && (
                <span className='po-note'>
                  {b.refund === 'partial' && b.amount_refunded !== null
                    ? t('po_refund_partial', { amount: formatMoney(b.amount_refunded, b.currency, lang), date: formatDate(b.refunded_at, lang) })
                    : b.refund === 'full'
                      ? t('po_refund_full', { date: formatDate(b.refunded_at, lang) })
                      : t('po_refunded_on', { date: formatDate(b.refunded_at, lang) })}
                </span>
              )}
            </div>
            <span className={`po-status po-status--${b.status}`}>{b.status === 'paid' ? t('po_status_paid') : t('po_status_refunded')}</span>
            {b.receipt && (
              <button type='button' className='po-link' onClick={() => openReceipt(b.id)}>
                <Icon name='receipt' /> {t('po_receipt')}
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

const DeleteAccount: React.FC<{ home: PortalHome; onDeleted: () => void }> = ({ home, onDeleted }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'idle' | 'code'>('idle');
  const [code, setCode] = useState('');
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expected = t('po_delete_word');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(payErrorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section id='delete' title={t('po_delete_title')}>
      <div className='po-card po-setting po-danger-zone'>
        <p className='po-note'>{t('po_delete_text')}</p>
        {step === 'idle' ? (
          <button
            type='button'
            className='btn btn--secondary po-danger'
            disabled={busy}
            onClick={() =>
              run(async () => {
                await portalApi.deleteCode();
                setStep('code');
              })
            }
          >
            <Icon name='trash' /> {t('po_delete_title')}
          </button>
        ) : (
          <form
            className='po-form'
            onSubmit={(e) => {
              e.preventDefault();
              if (!isCode(code)) return setError(t('po_err_code_format'));
              void run(async () => {
                await portalApi.deleteAccount(code);
                onDeleted();
              });
            }}
          >
            <p className='po-note' role='status'>
              {t('po_delete_code_sent', { email: home.customer.email })}
            </p>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_code')}</span>
              <input className='po-code-input' inputMode='numeric' autoComplete='one-time-code' value={code} onChange={(e) => setCode(digits(e.target.value))} />
            </label>
            <label className='po-field'>
              <span className='po-field__label'>{t('po_delete_type', { word: expected })}</span>
              <input autoComplete='off' autoCapitalize='characters' value={word} onChange={(e) => setWord(e.target.value)} />
            </label>
            <div className='po-row'>
              <button type='submit' className='btn btn--primary po-btn-danger' disabled={busy || code.length !== 6 || word.trim().toUpperCase() !== expected} aria-busy={busy}>
                {t('po_delete_confirm')}
              </button>
              <button type='button' className='po-link' onClick={() => (setStep('idle'), setCode(''), setWord(''))}>
                {t('po_cancel')}
              </button>
            </div>
          </form>
        )}
        {error && (
          <p className='po-error' role='alert'>
            {error}
          </p>
        )}
      </div>
    </Section>
  );
};

/* ------------------------------------------------------------------ shell */

const POLL_ACTIVE_MS = 5000;
const POLL_IDLE_MS = 20000;

const Dashboard: React.FC<{ home: PortalHome; reload: () => Promise<void>; onSignedOut: (notice?: string) => void }> = ({ home, reload, onSignedOut }) => {
  const { t, lang } = useLanguage();
  const { search, navigate } = useRouter();
  const [assistant, setAssistantState] = useState<AssistantThread | null>(null);
  const requested = readView(search);
  // The assistant tab exists only when Black Pater turned it on.
  const view: View = requested === 'assistant' && !assistant?.enabled ? 'home' : requested;
  const views = VIEWS.filter((v) => v.id !== 'assistant' || assistant?.enabled);
  const setAssistant = useCallback(
    (fn: (t: AssistantThread) => AssistantThread) => setAssistantState((a) => (a ? fn(a) : a)),
    []
  );
  useEffect(() => {
    let alive = true;
    portalApi
      .assistant()
      .then((a) => alive && setAssistantState(a))
      .catch(() => alive && setAssistantState(null));
    return () => {
      alive = false;
    };
  }, [home]);
  const [data, setData] = useState(home);
  const [messages, setMessagesState] = useState<ChatMessage[]>(home.messages);
  const [notice, setNotice] = useState<string | null>(null);
  // Items read during this visit stay read when the data is loaded again.
  const readIds = useRef(new Set<string>());
  const markRead = useCallback((ids: string[]) => {
    ids.forEach((id) => readIds.current.add(id));
    setData((d) => ({ ...d, items: d.items.map((i) => (readIds.current.has(i.id) ? { ...i, read: true } : i)) }));
  }, []);
  useEffect(() => {
    setData({ ...home, items: home.items.map((i) => (readIds.current.has(i.id) ? { ...i, read: true } : i)) });
    setMessagesState((list) => {
      const pending = list.filter((m) => m.pending || m.failed);
      return [...home.messages, ...pending.filter((p) => !home.messages.some((m) => m.id === p.id))];
    });
  }, [home]);
  const setMessages = useCallback((fn: (m: ChatMessage[]) => ChatMessage[]) => setMessagesState(fn), []);

  const go = useCallback((v: View) => navigate(viewPath(v)), [navigate]);
  const flash = useCallback((text: string) => setNotice(text), []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(id);
  }, [notice]);

  // Back from Stripe: the payment reaches LevelUp through the webhook within
  // seconds; refresh until the new end date shows, then tidy the address.
  useEffect(() => {
    const params = new URLSearchParams(search);
    const outcome = params.get('paid');
    if (outcome === null) return;
    navigate(viewPath('account'), { replace: true });
    if (outcome !== '1') {
      flash(t('po_paid_aborted'));
      return;
    }
    flash(t('po_paid_pending'));
    const before = JSON.stringify([home.membership?.until, home.access.plan?.ends_at]);
    let tries = 0;
    let stopped = false;
    const check = async () => {
      if (stopped) return;
      tries += 1;
      try {
        const fresh = await portalApi.me();
        if (JSON.stringify([fresh.membership?.until, fresh.access.plan?.ends_at]) !== before) {
          await reload();
          flash(t('po_paid_done'));
          return;
        }
      } catch {
        /* try again */
      }
      if (tries < 8) window.setTimeout(check, 2500);
      else flash(t('po_paid_slow'));
    };
    window.setTimeout(check, 1500);
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The conversation refreshes itself: often while it is open, rarely otherwise, never in a hidden tab.
  const lastAt = messages.filter((m) => !m.pending && !m.failed && !m.id.startsWith('tmp-')).at(-1)?.created_at ?? null;
  const lastAtRef = useRef(lastAt);
  lastAtRef.current = lastAt;
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState === 'visible') {
        try {
          const res = await portalApi.messagesSince(lastAtRef.current);
          const seen = new Set(res.seen);
          const onChat = viewRef.current === 'messages';
          const incoming = res.messages.map((m) => (onChat && m.sender === 'owner' ? { ...m, read: true } : m));
          if (onChat && res.messages.some((m) => m.sender === 'owner' && !m.read)) void portalApi.read(null, true).catch(() => {});
          setMessagesState((list) => {
            const known = new Set(list.map((m) => m.id));
            const added = incoming.filter((m) => !known.has(m.id));
            const updated = list.map((m) => (m.sender === 'customer' && seen.has(m.id) && !m.seen ? { ...m, seen: true } : m));
            return added.length || updated.some((m, i) => m !== list[i]) ? [...updated, ...added] : list;
          });
        } catch (err) {
          if (err instanceof PortalError && err.status === 401) return onSignedOut();
        }
      }
      timer = window.setTimeout(tick, viewRef.current === 'messages' ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    };
    timer = window.setTimeout(tick, view === 'messages' ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timer);
        void tick();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view === 'messages']);

  // Opening the conversation marks Black Pater's messages as read.
  const unreadMessages = messages.filter((m) => !m.read).length;
  useEffect(() => {
    if (view === 'messages' && unreadMessages) {
      void portalApi.read(null, true).catch(() => {});
      setMessagesState((list) => list.map((m) => (m.read ? m : { ...m, read: true })));
    }
  }, [view, unreadMessages]);

  const ended = Boolean(data.membership?.monthly && !data.membership.active);
  const unreadInfo = data.items.filter((i) => !i.read).length;
  const badges: Partial<Record<View, number>> = { info: unreadInfo, messages: unreadMessages };
  const name = data.customer.name?.split(' ')[0];
  const lastMessage = messages.at(-1);

  return (
    <div className={`po-shell po-shell--${view}`}>
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
            {views.map((v) => (
              <li key={v.id}>
                <Link to={viewPath(v.id)} className={`po-nav__link${view === v.id ? ' is-active' : ''}`} aria-current={view === v.id ? 'page' : undefined}>
                  <Icon name={v.icon} />
                  <span>{t(v.label)}</span>
                  {!!badges[v.id] && <span className='po-count'>{badges[v.id]}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className='po-main'>
        {notice && (
          <p className='po-flash' role='status'>
            <Icon name='check' /> {notice}
          </p>
        )}

        {view === 'home' && (
          <>
            <header className='po-hero' data-reveal>
              <p className='po-kicker'>{t('po_kicker')}</p>
              <h1>{name ? t('po_welcome', { name }) : t('po_welcome_anon')}</h1>
              <p>{t('po_member_since', { date: formatDate(data.customer.since, lang) })}</p>
            </header>
            <AccessCard home={data} onPlans={() => go('account')} />
            <div className='po-shortcuts'>
              <button type='button' className='po-card po-shortcut' onClick={() => go('info')}>
                <span className='po-shortcut__icon' aria-hidden='true'>
                  <Icon name='bell' />
                </span>
                <span className='po-shortcut__text'>
                  <strong>{t('po_home_info')}</strong>
                  <span>{unreadInfo ? t('po_home_info_new', { n: unreadInfo }) : data.items[0]?.title || t('po_home_info_none')}</span>
                </span>
                {!!unreadInfo && <span className='po-count'>{unreadInfo}</span>}
                <Icon name='chevronRight' className='po-shortcut__chev' />
              </button>
              <button type='button' className='po-card po-shortcut' onClick={() => go('messages')}>
                <span className='po-shortcut__icon' aria-hidden='true'>
                  <Icon name='chat' />
                </span>
                <span className='po-shortcut__text'>
                  <strong>{t('po_home_messages')}</strong>
                  <span>{unreadMessages ? t('po_home_messages_new', { n: unreadMessages }) : lastMessage?.body || t('po_home_messages_none')}</span>
                </span>
                {!!unreadMessages && <span className='po-count'>{unreadMessages}</span>}
                <Icon name='chevronRight' className='po-shortcut__chev' />
              </button>
              {assistant?.enabled && !ended && (
                <button type='button' className='po-card po-shortcut' onClick={() => go('assistant')}>
                  <span className='po-shortcut__icon' aria-hidden='true'>
                    <Icon name='sparkles' />
                  </span>
                  <span className='po-shortcut__text'>
                    <strong>{t('po_home_ai')}</strong>
                    <span>{t('po_home_ai_text')}</span>
                  </span>
                  <Icon name='chevronRight' className='po-shortcut__chev' />
                </button>
              )}
            </div>
            <AppCard />
            {!ended && <ContactCard home={data} onWrite={() => go('messages')} />}
          </>
        )}

        {view === 'info' &&
          (ended ? (
            <Section id='info' title={t('po_info_title')}>
              <AccessCard home={data} />
            </Section>
          ) : (
            <InfoFeed data={data} setData={setData} markRead={markRead} onPlans={() => go('account')} />
          ))}

        {view === 'assistant' && assistant && <Assistant thread={assistant} setThread={setAssistant} onRenew={() => go('account')} />}

        {view === 'messages' && <Chat data={data} messages={messages} setMessages={setMessages} locked={ended} onRenew={() => go('account')} />}

        {view === 'account' && (
          <>
            <Plans home={data} reload={reload} flash={flash} />
            <Payments home={data} />
            <Settings home={data} reload={reload} onSignedOut={() => onSignedOut()} />
            <DeleteAccount home={data} onDeleted={() => onSignedOut(t('po_deleted'))} />
          </>
        )}
      </div>

      <nav className='po-tabbar' aria-label={t('po_nav_label')}>
        {views.map((v) => (
          <Link key={v.id} to={viewPath(v.id)} className={`po-tabbar__link${view === v.id ? ' is-active' : ''}`} aria-current={view === v.id ? 'page' : undefined}>
            <span className='po-tabbar__icon'>
              <Icon name={v.icon} />
              {!!badges[v.id] && <span className='po-dot' aria-label={t('po_unread', { n: badges[v.id]! })} />}
            </span>
            <span>{t(v.label)}</span>
          </Link>
        ))}
      </nav>
    </div>
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
    <Section id='profile' title={t('po_profile_title')}>
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

  const [notice, setNotice] = useState<string | null>(null);
  const signedOut = useCallback((text?: string) => {
    setNotice(text ?? null);
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
    if (state === 'signed-out' || !home) return <SignIn notice={notice} onSignedIn={() => (setNotice(null), void load())} />;
    return <Dashboard home={home} reload={load} onSignedOut={signedOut} />;
  }, [state, home, load, signedOut, notice, t]);

  return <div className='po-page'>{body}</div>;
};

export default PortalPage;
