import React from 'react';

// Small inline icon set (stroke icons, 24px grid). Decorative by default.
const paths: Record<string, React.ReactNode> = {
  arrowRight: (
    <>
      <path d='M5 12h14' />
      <path d='m13 6 6 6-6 6' />
    </>
  ),
  arrowUpRight: (
    <>
      <path d='M7 17 17 7' />
      <path d='M8 7h9v9' />
    </>
  ),
  arrowLeft: (
    <>
      <path d='M19 12H5' />
      <path d='m11 6-6 6 6 6' />
    </>
  ),
  check: <path d='m5 12.5 4.5 4.5L19 7.5' />,
  lock: (
    <>
      <rect x='4.5' y='10.5' width='15' height='10' rx='2' />
      <path d='M8 10.5V7.5a4 4 0 0 1 8 0v3' />
    </>
  ),
  shield: (
    <>
      <path d='M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6z' />
      <path d='m9 12 2.2 2.2L15.5 10' />
    </>
  ),
  refresh: (
    <>
      <path d='M20 11a8 8 0 0 0-14.7-4.3L4 8' />
      <path d='M4 4v4h4' />
      <path d='M4 13a8 8 0 0 0 14.7 4.3L20 16' />
      <path d='M20 20v-4h-4' />
    </>
  ),
  chat: <path d='M4 19.5 5.4 15A7.5 7.5 0 1 1 9 18.6z' />,
  mail: (
    <>
      <rect x='3.5' y='5.5' width='17' height='13' rx='2' />
      <path d='m4 7 8 6 8-6' />
    </>
  ),
  info: (
    <>
      <circle cx='12' cy='12' r='8.5' />
      <path d='M12 11v5' />
      <path d='M12 8h.01' />
    </>
  ),
  alert: (
    <>
      <circle cx='12' cy='12' r='8.5' />
      <path d='M12 7.5v5.5' />
      <path d='M12 16.5h.01' />
    </>
  ),
  clock: (
    <>
      <circle cx='12' cy='12' r='8.5' />
      <path d='M12 7.5V12l3 2' />
    </>
  ),
  receipt: (
    <>
      <path d='M6 3.5h12v17l-3-2-3 2-3-2-3 2z' />
      <path d='M9 8.5h6M9 12h6' />
    </>
  ),
  chevronDown: <path d='m6 9 6 6 6-6' />,
  close: (
    <>
      <path d='M6 6l12 12' />
      <path d='M18 6 6 18' />
    </>
  ),
  play: <path d='M8 5.5v13l10-6.5z' />,
  volume: (
    <>
      <path d='M4 9.5h3.5L12 5.5v13l-4.5-4H4z' />
      <path d='M15.5 9a4 4 0 0 1 0 6' />
    </>
  ),
  mute: (
    <>
      <path d='M4 9.5h3.5L12 5.5v13l-4.5-4H4z' />
      <path d='m16 10 4 4M20 10l-4 4' />
    </>
  )
};

export type IconName = keyof typeof paths;

export const Icon: React.FC<{ name: IconName; className?: string; label?: string }> = ({ name, className, label }) => (
  <svg
    className={className}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={1.7}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden={label ? undefined : true}
    role={label ? 'img' : undefined}
    aria-label={label}
    focusable='false'
  >
    {paths[name]}
  </svg>
);

/** WhatsApp glyph (filled). */
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true' focusable='false'>
    <path d='M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2zm5.8 14.03c-.24.68-1.42 1.31-1.95 1.36-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.18-4.94-4.37-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.57-.36.76-.36h.55c.18 0 .41-.07.64.49.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.47l-.42.5c-.14.14-.29.29-.12.57.17.29.74 1.22 1.58 1.97 1.09.97 2 1.27 2.29 1.41.28.14.45.12.62-.07.17-.19.71-.83.9-1.12.19-.28.38-.24.64-.14.26.09 1.66.78 1.95.92.28.14.47.21.54.33.07.12.07.69-.17 1.37z' />
  </svg>
);
