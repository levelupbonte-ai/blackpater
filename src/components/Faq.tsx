import React from 'react';

export interface FaqEntry {
  q: string;
  a: React.ReactNode;
}

/** Native <details> accordion: works without JavaScript, keyboard and screen-reader friendly. */
export const Faq: React.FC<{ items: FaqEntry[]; openFirst?: boolean }> = ({ items, openFirst }) => (
  <div className='faq'>
    {items.map((item, i) => (
      <details className='faq__item' key={i} open={openFirst && i === 0 ? true : undefined}>
        <summary className='faq__q'>
          <span>{item.q}</span>
          <span className='faq__icon' aria-hidden='true' />
        </summary>
        <div className='faq__a'>{typeof item.a === 'string' ? <p>{item.a}</p> : item.a}</div>
      </details>
    ))}
  </div>
);
