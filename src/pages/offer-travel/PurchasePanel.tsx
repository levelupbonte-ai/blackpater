import React from 'react';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { Icon, WhatsAppIcon } from '../../components/Icon';
import { TrustRow } from '../../components/TrustRow';
import { whatsappLink } from '../../lib/contact';
import { formatOfferPrice, type OFFERS } from '../../../shared/offers.js';
import type { TranslationKey } from '../../i18n';
import { useCheckout } from './useCheckout';

type Offer = (typeof OFFERS)[keyof typeof OFFERS];

const ERROR_KEYS: Record<string, TranslationKey> = {
  rate_limited: 'err_rate_limited',
  timeout: 'err_timeout',
  network: 'err_network',
  checkout_failed: 'err_checkout_failed'
};

export const PurchasePanel: React.FC<{ offer: Offer }> = ({ offer }) => {
  const { lang, t } = useLanguage();
  const { state, pay } = useCheckout(offer.id);
  const price = formatOfferPrice(offer, lang);
  const redirecting = state.kind === 'redirecting';
  const unavailable = state.kind === 'unavailable';

  let label = t('offer_cta', { price });
  if (redirecting) label = t('offer_cta_redirecting');
  else if (unavailable) label = t('offer_cta_unavailable');
  else if (state.kind === 'error') label = t('offer_cta_retry');

  return (
    <aside className='buy' id='achat' aria-labelledby='buy-title'>
      <p className='eyebrow'>{t('offer_panel_label')}</p>
      <h2 id='buy-title' className='buy__title'>
        {t('offer_name')}
      </h2>

      <p className='buy__price'>
        <span className='buy__amount'>{price}</span>
        <span className='buy__note'>{t('offer_price_note')}</span>
      </p>
      <ul className='buy__facts'>
        <li>
          <Icon name='check' />
          {t('offer_no_renewal')}
        </li>
        <li>
          <Icon name='check' />
          {t('offer_includes_short')}
        </li>
      </ul>

      <button
        type='button'
        className='btn btn--primary btn--lg btn--block buy__cta'
        onClick={pay}
        disabled={redirecting || unavailable}
        aria-busy={redirecting || undefined}
        aria-describedby='buy-hint'
      >
        {redirecting ? <span className='btn__spinner' aria-hidden='true' /> : !unavailable && <Icon name='lock' />}
        <span>{label}</span>
      </button>

      <div className='buy__status' role='status' aria-live='polite'>
        {state.kind === 'error' && (
          <p className='notice notice--error'>
            <Icon name='alert' />
            <span>{t(ERROR_KEYS[state.code] || 'err_checkout_failed')}</span>
          </p>
        )}
        {unavailable && (
          <p className='notice notice--info'>
            <Icon name='info' />
            <span>{t('offer_unavailable_text')}</span>
          </p>
        )}
        {redirecting && <span className='sr-only'>{t('offer_cta_redirecting')}</span>}
      </div>

      <p id='buy-hint' className='buy__hint'>
        {t('offer_cta_hint')}
      </p>

      <TrustRow />

      <p className='buy__terms'>
        {t('offer_terms_before')}
        <Link className='text-link' to='/legal/conditions-de-vente'>
          {t('offer_terms_link')}
        </Link>
        {t('offer_terms_middle')}
        <Link className='text-link' to='/legal/remboursement'>
          {t('offer_refund_link')}
        </Link>
        {t('offer_terms_after')}
      </p>

      <p className='buy__question'>
        <span>{t('offer_question')}</span>
        <a className='arrow-link' href={whatsappLink(t('wa_question_message'))} target='_blank' rel='noopener noreferrer'>
          <WhatsAppIcon />
          {t('offer_question_cta')}
          <span className='sr-only'> {t('opens_new_tab')}</span>
        </a>
      </p>
    </aside>
  );
};
