import React from 'react';
import { Link } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '../../components/Icon';
import { PaymentMarks } from '../../components/PaymentMarks';
import { formatOfferPrice, priceFor, type OFFERS } from '../../../shared/offers.js';
import { useLaunchClock } from '../../lib/launch';
import { LaunchCountdown } from '../../components/LaunchCountdown';
import type { TranslationKey } from '../../i18n';
import { useCheckout } from './useCheckout';

type Offer = (typeof OFFERS)[keyof typeof OFFERS];

const ERROR_KEYS: Record<string, TranslationKey> = {
  rate_limited: 'err_rate_limited',
  timeout: 'err_timeout',
  network: 'err_network',
  checkout_failed: 'err_checkout_failed'
};

export const PurchasePanel: React.FC<{ offer: Offer; onOpenGuide?: () => void }> = ({ offer, onOpenGuide }) => {
  const { lang, t } = useLanguage();
  const { state, pay } = useCheckout(offer.id);
  const now = useLaunchClock();
  const current = priceFor(offer, now);
  const price = formatOfferPrice(offer, lang, current.amount);
  const regular = formatOfferPrice(offer, lang, current.regular);
  const redirecting = state.kind === 'redirecting';
  const unavailable = state.kind === 'unavailable';

  let label = t('offer_cta', { price });
  if (redirecting) label = t('offer_cta_redirecting');
  else if (unavailable) label = t('offer_cta_unavailable');
  else if (state.kind === 'error') label = t('offer_cta_retry');

  const handleAction = () => {
    if (onOpenGuide) {
      onOpenGuide();
    } else {
      pay();
    }
  };

  return (
    <aside className='buy' id='achat' aria-labelledby='buy-title'>
      <h2 id='buy-title' className='buy__title'>
        {t('offer_name')}
      </h2>

      <p className='buy__price' onClick={onOpenGuide} style={onOpenGuide ? { cursor: 'pointer' } : undefined}>
        {current.launch && <s className='buy__was'>{regular}</s>}
        <span className='buy__amount' suppressHydrationWarning>
          {price} <span className='buy__per'>{t('offers_tier_per_month')}</span>
        </span>
        <span className='buy__note'>{current.launch ? t('offers_tier_launch_note', { regular }) : t('offers_tier_once')}</span>
      </p>
      <LaunchCountdown compact />
      <p className='buy__note buy__promo'>{t('launch_promo_code')}</p>

      <button
        type='button'
        className='btn btn--primary btn--lg btn--block buy__cta'
        onClick={handleAction}
        disabled={redirecting || unavailable}
        aria-busy={redirecting || undefined}
      >
        {redirecting ? <span className='btn__spinner' aria-hidden='true' /> : <Icon name='lock' />}
        <span>{label}</span>
        {!redirecting && !unavailable && <Icon name='arrowRight' />}
      </button>

      <div className='buy__status' role='status' aria-live='polite'>
        {state.kind === 'error' && (
          <p className='notice notice--error'>
            <Icon name='alert' />
            <span>{t(ERROR_KEYS[state.code] || 'err_checkout_failed')}</span>
          </p>
        )}
        {redirecting && <span className='sr-only'>{t('offer_cta_redirecting')}</span>}
      </div>

      <PaymentMarks label={t('offer_methods_label')} />

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
    </aside>
  );
};
