import React from 'react';

// Accepted payment brands, self-hosted in public/payment/ (sources and
// licences in public/payment/NOTICE.txt), cropped to their real proportions.
const MARKS = [
  { file: 'visa', alt: 'Visa', h: 11 },
  { file: 'mastercard', alt: 'Mastercard', h: 17 },
  { file: 'americanexpress', alt: 'American Express', h: 15 },
  { file: 'applepay', alt: 'Apple Pay', h: 21 },
  { file: 'googlepay', alt: 'Google Pay', h: 13 }
];

export const PaymentMarks: React.FC<{ label: string }> = ({ label }) => (
  <ul className='pay-marks' aria-label={label}>
    {MARKS.map((m) => (
      <li key={m.file}>
        <img className={`pay-marks__${m.file}`} src={`/payment/${m.file}.svg`} alt={m.alt} height={m.h} decoding='async' />
      </li>
    ))}
  </ul>
);
