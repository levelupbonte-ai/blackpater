import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useInstall } from '../lib/install';
import { Icon, type IconName } from './Icon';
import './install-guide.css';

const Step: React.FC<{ n: number; icon?: IconName; children: React.ReactNode }> = ({ n, icon, children }) => (
  <li className='ig-step'>
    <span className='ig-step__n' aria-hidden='true'>
      {n}
    </span>
    <span className='ig-step__text'>{children}</span>
    {icon && (
      <span className='ig-step__icon' aria-hidden='true'>
        <Icon name={icon} />
      </span>
    )}
  </li>
);

/**
 * How to install the member space as an app, for the device in hand:
 * Android (the browser's install pop-up, or Chrome's menu), iPhone / iPad
 * (Safari's Share menu, step by step), apps' built-in browsers (open in the
 * real browser first). On a computer it stays optional.
 */
export const InstallGuide: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useLanguage();
  const { platform, installed, canPrompt, install } = useInstall();
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = 'https://blackpater.com/espace-client';

  if (installed || done) {
    return (
      <div className='ig ig--done' role='status'>
        <Icon name='check' />
        <p>{t('ig_done')}</p>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`ig${compact ? ' ig--compact' : ''}`}>
      {canPrompt && (
        <button
          type='button'
          className='btn btn--primary btn--lg ig-cta'
          onClick={async () => {
            if (await install()) setDone(true);
          }}
        >
          <Icon name='download' /> {t('ig_install')}
        </button>
      )}

      {!canPrompt && platform === 'android' && (
        <ol className='ig-steps'>
          <Step n={1} icon='dots'>
            {t('ig_android_1')}
          </Step>
          <Step n={2} icon='download'>
            {t('ig_android_2')}
          </Step>
          <Step n={3}>{t('ig_open_home')}</Step>
        </ol>
      )}

      {(platform === 'ios' || platform === 'ios-other') && (
        <ol className='ig-steps'>
          {platform === 'ios-other' && (
            <Step n={0}>
              {t('ig_ios_safari')}{' '}
              <button type='button' className='po-link' onClick={copy}>
                {copied ? t('ig_copied') : t('ig_copy')}
              </button>
            </Step>
          )}
          <Step n={1} icon='share'>
            {t('ig_ios_1')}
          </Step>
          <Step n={2} icon='plusSquare'>
            {t('ig_ios_2')}
          </Step>
          <Step n={3}>{t('ig_ios_3')}</Step>
          <Step n={4}>{t('ig_open_home')}</Step>
        </ol>
      )}

      {platform === 'in-app' && (
        <ol className='ig-steps'>
          <Step n={1} icon='dots'>
            {t('ig_inapp_1')}
          </Step>
          <Step n={2}>{t('ig_inapp_2')}</Step>
        </ol>
      )}

      {platform === 'desktop' && !canPrompt && !compact && <p className='ig-note'>{t('ig_desktop')}</p>}
    </div>
  );
};
