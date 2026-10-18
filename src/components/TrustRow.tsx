import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from './Icon';

/** "Secure payment by Stripe" + accepted methods. Methods come from Stripe itself. */
export const TrustRow: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className='trust'>
      <p className='trust__line'>
        <Icon name='lock' />
        <span>{t('offer_trust_stripe')}</span>
      </p>
      <p className='trust__line'>
        <Icon name='shield' />
        <span>{t('offer_trust_methods')}</span>
      </p>
      <ul className='trust__methods' aria-label={t('offer_trust_methods')}>
        {['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'].map((m) => (
          <li className='chip' key={m}>
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
};
