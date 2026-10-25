import React from 'react';
import './abonnements.css';
import { Link, useRouter } from '../../app/router';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import { ECOSYSTEM_TIERS, formatOfferPrice } from '../../../shared/offers.js';
import type { TranslationKey } from '../../i18n';
import { preselectTier, type TierKey } from '../offer-travel/tier-preselection';

const OFFER_PATH = '/abonnements/accompagnement-voyage';

/** The tier highlighted with the primary button. */
const RECOMMENDED_TIER: TierKey = 'solo';

const TIER_KEYS: Record<TierKey, { title: TranslationKey; sub: TranslationKey; scope: TranslationKey; name: string }> = {
  solo: { title: 'offers_tier_solo_title', sub: 'offers_tier_solo_sub', scope: 'offers_tier_solo_scope', name: 'Solo' },
  duo: { title: 'offers_tier_duo_title', sub: 'offers_tier_duo_sub', scope: 'offers_tier_duo_scope', name: 'Duo' },
  family: { title: 'offers_tier_family_title', sub: 'offers_tier_family_sub', scope: 'offers_tier_family_scope', name: 'Famille|Family' }
};

const STEPS = [1, 2, 3] as const;

export const AbonnementsPage: React.FC = () => {
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
    <div className='page'>
      <PageHeader
        crumbs={[{ label: t('nav_home'), to: '/' }, { label: t('nav_offers') }]}
        eyebrow={t('offers_kicker')}
        title={t('offers_title')}
        lead={t('offers_lead')}
      />

      <section className='section offers-intro' aria-labelledby='offer-intro-title'>
        <div className='container'>
          <article className='offer-card'>
            <div className='offer-card__media'>
              <img src='/media/db4bf6a012c1.webp' alt='' width={560} height={700} loading='lazy' decoding='async' />
            </div>
            <div className='offer-card__body'>
              <p className='eyebrow'>{t('offers_card_tag')}</p>
              <h2 id='offer-intro-title' className='offer-card__title'>
                {t('offer_name')}
              </h2>
              <p className='offer-card__desc'>{t('offers_card_desc')}</p>
              <ul className='offer-card__points'>
                {(['offers_card_point_1', 'offers_card_point_2', 'offers_card_point_3'] as const).map((key) => (
                  <li key={key}>
                    <Icon name='check' />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section className='section section--ruled tiers' aria-labelledby='tiers-title'>
        <div className='container'>
          <div className='section-header-center'>
            <p className='eyebrow'>{t('offers_tier_kicker')}</p>
            <h2 id='tiers-title' className='section-title'>
              {t('offers_tier_label')}
            </h2>
          </div>

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

          <p className='tiers__note'>
            <Icon name='info' />
            <span>{t('offers_ecosystem_badge')}</span>
          </p>
        </div>
      </section>

      <section className='section section--ruled' aria-labelledby='how-title'>
        <div className='container'>
          <div className='section-head'>
            <div>
              <p className='eyebrow'>{t('offer_how_kicker')}</p>
              <h2 id='how-title' className='section-head__title'>
                {t('offer_how_title')}
              </h2>
            </div>
          </div>
          <ol className='steps'>
            {STEPS.map((i) => (
              <li key={i} className='step'>
                <span className='step__num' aria-hidden='true'>
                  {i}
                </span>
                <h3 className='step__title'>{t(k(`offer_step_${i}_title`))}</h3>
                <p className='step__text'>{t(k(`offer_step_${i}_text`))}</p>
              </li>
            ))}
          </ol>

          <p className='offers__question'>
            <span>{t('offers_question')}</span>
            <Link className='arrow-link' to='/contact'>
              <Icon name='mail' />
              {t('offers_question_cta')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default AbonnementsPage;
