import React, { useCallback, useEffect, useRef, useState } from 'react';
import './payment.css';
import { Link, useRouter } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { Icon, WhatsAppIcon, type IconName } from '../../components/Icon';
import { CONTACT_EMAIL, whatsappLink } from '../../lib/contact';
import { clearCheckoutAttempt } from '../../lib/checkout-client.js';
import { OFFERS } from '../../../shared/offers.js';
import { parseSessionStatus, readSessionIdParam } from '../../../shared/validation.js';
import type { TranslationKey } from '../../i18n';

type View =
  | { kind: 'verifying' }
  | { kind: 'paid'; amount: number; currency: string }
  | { kind: 'processing'; slow: boolean }
  | { kind: 'unpaid' }
  | { kind: 'unknown' }
  | { kind: 'error' };

const POLL_MS = 3000;
const MAX_POLLS = 10;

function shortRef(id: string) {
  return id.length > 24 ? `${id.slice(0, 8)}…${id.slice(-10)}` : id;
}

/**
 * Never trusts the URL: the payment is confirmed only when the server has
 * retrieved the Checkout Session from Stripe and reports it as paid.
 */
export const ConfirmationPage: React.FC = () => {
  const { search } = useRouter();
  const { lang, t } = useLanguage();
  // Validated before use: one session_id in the Stripe format, or nothing.
  const sessionId = readSessionIdParam(search);
  const valid = sessionId !== '';
  const [view, setView] = useState<View>(valid ? { kind: 'verifying' } : { kind: 'unknown' });
  const polls = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  const check = useCallback(async () => {
    window.clearTimeout(timer.current);
    const abort = new AbortController();
    const to = window.setTimeout(() => abort.abort(), 10000);
    try {
      const res = await fetch(`/api/stripe/session-status?session_id=${encodeURIComponent(sessionId)}`, {
        signal: abort.signal,
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (res.status === 400 || res.status === 404) return setView({ kind: 'unknown' });
      if (!res.ok) return setView({ kind: 'error' });
      // The answer is checked too before anything is displayed.
      const data = parseSessionStatus(await res.json());
      if (!data) return setView({ kind: 'error' });
      if (data.state === 'paid') {
        try {
          clearCheckoutAttempt(window.sessionStorage, data.offerId);
        } catch {
          /* storage blocked */
        }
        return setView({ kind: 'paid', amount: data.amount, currency: data.currency });
      }
      if (data.state === 'processing') {
        polls.current += 1;
        if (polls.current >= MAX_POLLS) return setView({ kind: 'processing', slow: true });
        setView({ kind: 'processing', slow: false });
        timer.current = window.setTimeout(check, POLL_MS);
        return;
      }
      return setView({ kind: 'unpaid' });
    } catch {
      setView({ kind: 'error' });
    } finally {
      window.clearTimeout(to);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!valid) return;
    void check();
    return () => window.clearTimeout(timer.current);
  }, [valid, check]);

  const retry = () => {
    polls.current = 0;
    setView({ kind: 'verifying' });
    void check();
  };

  const offerPath = OFFERS['accompagnement-voyage'].path;

  const status = (icon: IconName, tone: string, title: TranslationKey, text: React.ReactNode, actions?: React.ReactNode) => (
    <div className={`pay-card pay-card--${tone}`}>
      <span className='pay-card__icon' aria-hidden='true'>
        <Icon name={icon} />
      </span>
      <h1 className='pay-card__title'>{t(title)}</h1>
      <p className='pay-card__text'>{text}</p>
      {actions && <div className='btn-row pay-card__actions'>{actions}</div>}
    </div>
  );

  let content: React.ReactNode;
  switch (view.kind) {
    case 'verifying':
      content = status('clock', 'neutral', 'pay_verifying_title', t('pay_verifying_text'));
      break;
    case 'processing':
      content = status(
        'clock',
        'neutral',
        'pay_processing_title',
        view.slow ? t('pay_processing_slow') : t('pay_processing_text'),
        view.slow ? (
          <button type='button' className='btn' onClick={retry}>
            <Icon name='refresh' />
            {t('pay_refresh')}
          </button>
        ) : undefined
      );
      break;
    case 'unpaid':
      content = status(
        'info',
        'neutral',
        'pay_unpaid_title',
        t('pay_unpaid_text'),
        <Link className='btn btn--primary' to={offerPath}>
          {t('pay_resume')}
          <Icon name='arrowRight' />
        </Link>
      );
      break;
    case 'unknown':
      content = status(
        'info',
        'neutral',
        'pay_unknown_title',
        t('pay_unknown_text'),
        <>
          <a className='btn btn--primary' href={`mailto:${CONTACT_EMAIL}`}>
            <Icon name='mail' />
            {t('pay_contact')}
          </a>
          <Link className='btn' to={offerPath}>
            {t('pay_back_offer')}
          </Link>
        </>
      );
      break;
    case 'error':
      content = status(
        'alert',
        'neutral',
        'pay_error_title',
        t('pay_error_text'),
        <button type='button' className='btn btn--primary' onClick={retry}>
          <Icon name='refresh' />
          {t('pay_refresh')}
        </button>
      );
      break;
    case 'paid': {
      const amount = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'fr-FR', {
        style: 'currency',
        currency: (view.currency || 'usd').toUpperCase(),
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: view.amount % 100 === 0 ? 0 : 2
      }).format(view.amount / 100);
      let summarySuffix = '';
      try {
        const savedSummary = window.localStorage.getItem('pg:last_summary');
        if (savedSummary) summarySuffix = ` — PaterGuide : ${savedSummary}`;
      } catch {
        /* ignore */
      }
      const wa = whatsappLink(`${t('pay_wa_message', { ref: sessionId })}${summarySuffix}`);
      content = (
        <>
          {status(
            'check',
            'success',
            'pay_paid_title',
            t('pay_paid_text', { amount }),
            <a className='btn btn--copper btn--lg' href={wa} target='_blank' rel='noopener noreferrer'>
              <WhatsAppIcon />
              {t('pay_start_whatsapp')}
              <span className='sr-only'> {t('opens_new_tab')}</span>
            </a>
          )}
          <dl className='pay-ref'>
            <dt>{t('pay_reference')}</dt>
            <dd title={sessionId}>{shortRef(sessionId)}</dd>
          </dl>
          <section className='pay-next' aria-labelledby='next-title'>
            <h2 id='next-title' className='label'>
              {t('pay_next_title')}
            </h2>
            <ol className='steps pay-steps'>
              {[1, 2, 3].map((i) => (
                <li className='step' key={i}>
                  <p className='step__num' aria-hidden='true'>
                    {String(i).padStart(2, '0')}
                  </p>
                  <h3 className='step__title'>{t(`pay_next_${i}_title` as TranslationKey)}</h3>
                  <p className='step__text'>{t(`pay_next_${i}_text` as TranslationKey)}</p>
                </li>
              ))}
            </ol>
          </section>
        </>
      );
      break;
    }
  }

  return (
    <div className='page pay'>
      <div className='container container--narrow pay__inner'>
        <p className='eyebrow'>{t('pay_kicker')}</p>
        <div aria-live='polite'>{content}</div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
