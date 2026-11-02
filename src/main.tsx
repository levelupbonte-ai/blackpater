import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './layout/layout.css';
import { App } from './app/App';

/**
 * Public pages are prerendered in English (light theme) at build time. When the
 * visitor will see exactly that, React hydrates the existing HTML (no flash);
 * otherwise (French chosen, dark theme, a page without prerender) it renders
 * from scratch.
 */
function canHydrate(root: HTMLElement): boolean {
  if (!root.hasAttribute('data-ssr')) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang') || window.localStorage.getItem('bp_lang_v4');
    const theme = window.localStorage.getItem('bp_theme_pref');
    return (!lang || lang === 'en') && theme !== 'dark' && !window.location.hash;
  } catch {
    return true;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const app = (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  if (canHydrate(rootElement)) {
    ReactDOM.hydrateRoot(rootElement, app);
  } else {
    rootElement.textContent = '';
    ReactDOM.createRoot(rootElement).render(app);
  }
}
