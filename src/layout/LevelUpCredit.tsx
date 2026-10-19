import React from 'react';

// LevelUp Ecosystem credit — markup kept byte-for-byte as on the original
// site: public/js/levelup.js hides [data-lu-built-by] when the dashboard says so.
const CREDIT_HTML =
  '<a href="https://levelup-ecosystem.com/?utm_source=blackpater.com&amp;utm_medium=referral&amp;utm_campaign=built_by" target="_blank" rel="noopener" class="lu-built-by" aria-label="Built by LevelUp Ecosystem (opens in a new tab)"><span class="lu-built-by__label">Built by</span><svg class="lu-built-by__logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 220" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="lu-bb-top" x1="500" y1="10" x2="500" y2="90" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" stop-opacity="0.95"/><stop offset="1" stop-color="currentColor" stop-opacity="0.80"/></linearGradient><linearGradient id="lu-bb-bottom" x1="500" y1="95" x2="500" y2="205" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" stop-opacity="0.75"/><stop offset="1" stop-color="currentColor" stop-opacity="0.45"/></linearGradient></defs><text x="50%" y="85" text-anchor="middle" fill="url(#lu-bb-top)" font-family="system-ui, -apple-system, \'Segoe UI\', Roboto, \'DM Sans\', sans-serif" font-size="100px" font-weight="900" letter-spacing="-0.01em">LevelUp</text><text x="50%" y="198" text-anchor="middle" fill="url(#lu-bb-bottom)" font-family="system-ui, -apple-system, \'Segoe UI\', Roboto, \'DM Sans\', sans-serif" font-size="135px" font-weight="900" letter-spacing="0.01em">Ecosystem</text></svg></a>';

export const LevelUpCredit: React.FC = () => (
  <span className='pw' data-lu-built-by='' dangerouslySetInnerHTML={{ __html: CREDIT_HTML }} />
);
