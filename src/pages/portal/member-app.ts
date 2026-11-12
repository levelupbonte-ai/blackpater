// The member space as an installable app with notifications. Only on
// /espace-client: the service worker's scope is the space, it never caches or
// intercepts the site, and nothing here runs on the public pages.
import { useCallback, useEffect, useState } from 'react';
import { portalApi } from './api';

const SW_URL = '/espace-client-sw.js';
const SCOPE = '/espace-client';

export type PushState = 'loading' | 'unsupported' | 'ios-install' | 'unavailable' | 'off' | 'on' | 'denied';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function base64ToBytes(value: string) {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function standalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function addManifest() {
  if (document.querySelector('link[rel="manifest"]')) return;
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = '/espace-client.webmanifest';
  document.head.appendChild(link);
}

export function useMemberApp() {
  const [push, setPush] = useState<PushState>('loading');
  const [installEvent, setInstallEvent] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    addManifest();
    setInstalled(standalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    let cancelled = false;
    (async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!('serviceWorker' in navigator)) return setPush('unsupported');
      try {
        await navigator.serviceWorker.register(SW_URL, { scope: SCOPE });
      } catch {
        if (!cancelled) setPush('unsupported');
        return;
      }
      if (!supported) {
        // iPhone and iPad: notifications only once the space is on the home screen.
        if (!cancelled) setPush(isIos() && !standalone() ? 'ios-install' : 'unsupported');
        return;
      }
      let publicKey: string | null = null;
      try {
        publicKey = (await portalApi.pushKey()).key;
      } catch {
        publicKey = null;
      }
      if (cancelled) return;
      if (!publicKey) return setPush('unavailable');
      setKey(publicKey);
      if (Notification.permission === 'denied') return setPush('denied');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) setPush(sub && Notification.permission === 'granted' ? 'on' : 'off');
    })();
    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice.catch(() => null);
    if (choice?.outcome === 'accepted') setInstalled(true);
    setInstallEvent(null);
  }, [installEvent]);

  const enable = useCallback(async () => {
    if (!key) return false;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setPush(permission === 'denied' ? 'denied' : 'off');
      return false;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(key) }));
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
    await portalApi.pushSubscribe({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
    setPush('on');
    return true;
  }, [key]);

  const disable = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await portalApi.pushUnsubscribe(sub.endpoint).catch(() => {});
      await sub.unsubscribe().catch(() => false);
    }
    setPush('off');
  }, []);

  return { push, canInstall: Boolean(installEvent) && !installed, installed, install, enable, disable, ios: isIos() };
}
