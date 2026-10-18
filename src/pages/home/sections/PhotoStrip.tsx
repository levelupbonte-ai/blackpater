import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { TranslationKey } from '../../../i18n';

const PHOTOS = [
  '/media/3e0be360f5ad.webp',
  '/media/db4bf6a012c1.webp',
  '/media/fe552333c4cd.webp',
  '/media/50471a19bc72.webp',
  '/media/331bab387390.webp',
  '/media/0e1ee5dff864.webp',
  '/media/880bac4f1415.jpg'
];

export const PhotoStrip: React.FC = () => {
  const { t } = useLanguage();
  const set = (dup: boolean) => (
    <ul className='strip__set' aria-hidden={dup || undefined}>
      {PHOTOS.map((src, i) => (
        <li key={src}>
          <figure>
            <img src={src} alt='' width={330} height={412} loading='lazy' decoding='async' />
            <figcaption>{t(`strip_${i + 1}` as TranslationKey)}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
  return (
    <section className='strip' aria-label={t('strip_label')}>
      <div className='strip__row'>
        {set(false)}
        {set(true)}
      </div>
    </section>
  );
};
