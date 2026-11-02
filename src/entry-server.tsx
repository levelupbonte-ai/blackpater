// Build-time prerender (scripts/vite-plugins.js): the HTML of each public page
// in the default language (English), so search engines and slow phones get
// real content before JavaScript runs. The browser then hydrates it.
import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './app/App';

export function render(path: string): string {
  return renderToString(
    <React.StrictMode>
      <App initialPath={path} />
    </React.StrictMode>
  );
}
