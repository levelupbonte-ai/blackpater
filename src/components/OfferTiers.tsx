import React from 'react';
import './offer-tiers.css';
import { Link, useRouter } from '../app/router';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from './Icon';
import { ECOSYSTEM_TIERS, formatOfferPrice } from '../../shared/offers.js';
import type { TranslationKey } from '../i18n';
import { preselectTier, type TierKey } from '../pages/offer-travel/tier-preselection';

const OFFER_PATH = '/abonnements/accompagnement-voyage';

/** The tier highlighted with the primary button. */
const RECOMMENDED_TIER: TierKey = 'solo';

const TIER_KEYS: Record<TierKey, { title: TranslationKey; sub: TranslationKey; scope: TranslationKey; name: string }> = {
  solo: { title: 'offers_tier_solo_title', sub: 'offers_tier_solo_sub', scope: 'offers_tier_solo_scope', name: 'Solo' },
  duo: { title: 'offers_tier_duo_title', sub: 'offers_tier_duo_sub', scope: 'offers_tier_duo_scope', name: 'Duo' },
  family: { title: 'offers_tier_family_title', sub: 'offers_tier_family_sub', scope: 'offers_tier_family_scope', name: 'Famille|Family' }
};

/**
 * Solo / Duo / Famille cards with the catalog prices (shared/offers.js). The
 * button remembers the tier for the questionnaire and opens the offer page,
 * where the only pay button lives. Used on the home and offers pages.
 */
export const OfferTiers: React.FC = () => {
  const { lang, t } = useLanguage();
  const { navigate } = useRouter();
  const k = (s: string) => s as TranslationKey;

  const start = (tier: TierKey) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    preselectTier(tier);
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(OFFER_PATH);
  };

  return (
          <ul className='tiers__grid' aria-label={t('offers_list_label')}>
            {ECOSYSTEM_TIERS.map((offer) => {
              const tier = offer.tier as TierKey;
              const keys = TIER_KEYS[tier];
              const recommended = tier === RECOMMENDED_TIER;
              const tierName = lang === 'en' ? keys.name.split('|').pop() : keys.name.split('|')[0];
              return (
                <li key={offer.id} className={`tier${recommended ? ' tier--featured' : ''}`}>
                  <div className='tier__head'>
                    <h3 className='tier__name'>{t(keys.title)}</h3>
                    {recommended && <span className='tier__badge'>{t('offers_tier_recommended')}</span>}
                  </div>
                  <p className='tier__sub'>{t(keys.sub)}</p>

                  <p className='tier__price'>
                    <span className='tier__amount'>{formatOfferPrice(offer, lang)}</span>
                    <span className='tier__once'>{t('offers_tier_once')}</span>
                  </p>

                  <ul className='tier__list'>
                    {[keys.scope, 'offers_tier_incl_questionnaire', 'offers_card_point_2', 'offers_card_point_3'].map((key) => (
                      <li key={key}>
                        <Icon name='check' />
                        <span>{t(k(key))}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={OFFER_PATH}
                    onClick={start(tier)}
                    className={`btn btn--block ${recommended ? 'btn--primary' : 'btn--outline'} tier__cta`}
                    aria-label={t('offers_tier_cta_label', { tier: tierName || '' })}
                  >
                    <span>{t('offers_tier_cta')}</span>
                    <Icon name='arrowRight' />
                  </Link>
                </li>
              );
            })}
          </ul>
  );
};
