import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ECOSYSTEM_TIERS, formatOfferPrice, isLaunch } from '../../shared/offers.js';
import { timeLeft, useLaunchClock } from '../lib/launch';
import { Icon } from './Icon';

const pad = (n: number) => String(n).padStart(2, '0');

/** Launch offer banner with a live countdown; renders nothing once the offer has ended. */
export const LaunchCountdown: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { lang, t } = useLanguage();
  const now = useLaunchClock();
  if (!isLaunch(now)) return null;
  const left = timeLeft(now);
  const [solo, duo, family] = ECOSYSTEM_TIERS.map((o) => formatOfferPrice(o, lang, o.amount));
  const units = [
    { value: left.days, unit: t('launch_days') },
    { value: left.hours, unit: t('launch_hours') },
    { value: left.minutes, unit: t('launch_minutes') },
    { value: left.seconds, unit: t('launch_seconds') }
  ];
  return (
    <div className={`launch${compact ? ' launch--compact' : ''}`} role='timer' aria-label={t('launch_label')}>
      {!compact && (
        <div className='launch__text'>
          <p className='launch__kicker'>
            <Icon name='clock' /> {t('launch_kicker')}
          </p>
          <p className='launch__title'>{t('launch_title')}</p>
          <p className='launch__sub'>{t('launch_text', { solo, duo, family })}</p>
        </div>
      )}
      <div className='launch__clock'>
        <span className='launch__ends'>{t('launch_ends_in')}</span>
        <span className='launch__units'>
          {units.map((u, i) => (
            <span key={i} className='launch__unit'>
              <strong suppressHydrationWarning>{i === 0 ? u.value : pad(u.value)}</strong>
              <span>{u.unit}</span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};
