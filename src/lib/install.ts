// Installing the member space as an app. The browser's install prompt
// (Android Chrome, Edge, desktop Chrome) fires once, early: main.tsx keeps it
// on window so any screen can offer the "Install" button later. iPhone and
// iPad have no prompt: the member adds the space to the home screen from
// Safari's Share menu, so we explain the steps.
import { useEffect, useState } from 'react';

export interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __bpInstall?: InstallPrompt | null;
  }
}

/** Called once from main.tsx, before React. */
export function captureInstallPrompt() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__bpInstall = e as InstallPrompt;
    window.dispatchEvent(new Event('bp:installable'));
  });
  window.addEventListener('appinstalled', () => {
    window.__bpInstall = null;
    window.dispatchEvent(new Event('bp:installed'));
  });
}

export type Platform = 'ios' | 'ios-other' | 'android' | 'in-app' | 'desktop';

export function platform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/FBAN|FBAV|Instagram|Line\/|WhatsApp|TikTok|Snapchat/i.test(ua)) return 'in-app';
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua) ? 'ios-other' : 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

export function isInstalled() {
  if (typeof window === 'undefined') return false;
  return (
    ['standalone', 'fullscreen', 'minimal-ui'].some((m) => window.matchMedia?.(`(display-mode: ${m})`).matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Phones and tablets must install the app; computers may stay in the browser. */
export const isMobile = () => platform() !== 'desktop';

export function useInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(() => (typeof window !== 'undefined' ? window.__bpInstall ?? null : null));
  const [installed, setInstalled] = useState(isInstalled);
  useEffect(() => {
    const on = () => setPrompt(window.__bpInstall ?? null);
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('bp:installable', on);
    window.addEventListener('bp:installed', done);
    return () => {
      window.removeEventListener('bp:installable', on);
      window.removeEventListener('bp:installed', done);
    };
  }, []);
  const install = async () => {
    if (!prompt) return false;
    await prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    window.__bpInstall = null;
    setPrompt(null);
    if (choice?.outcome === 'accepted') {
      setInstalled(true);
      return true;
    }
    return false;
  };
  return { platform: platform(), installed, canPrompt: Boolean(prompt), install };
}
