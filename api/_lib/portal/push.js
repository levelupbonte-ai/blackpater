/**
 * Push notifications of the member space (Web Push, VAPID). Optional: without
 * the keys the space works as before and only e-mails are sent.
 *
 * - BLACKPATER_VAPID_PUBLIC_KEY   public, given to the browser to subscribe
 * - BLACKPATER_VAPID_PRIVATE_KEY  secret (Vercel, Sensitive), signs the sends
 *
 * Generate the pair once with `npx web-push@3.6.7 generate-vapid-keys`.
 * A notification never carries the content: only "new message", "new
 * information", "renew", and the page of the space to open.
 */
import webpush from 'web-push';
import { readEnv } from '../stripe.js';
import { CONTACT_EMAIL } from './config.js';

const KEY_RE = /^[A-Za-z0-9_-]{40,120}$/;

export function getPushConfig() {
  const publicKey = readEnv('BLACKPATER_VAPID_PUBLIC_KEY');
  const privateKey = readEnv('BLACKPATER_VAPID_PRIVATE_KEY');
  const ok = KEY_RE.test(publicKey) && KEY_RE.test(privateKey);
  return { enabled: ok, publicKey: ok ? publicKey : '', privateKey: ok ? privateKey : '' };
}

const TEXT = {
  en: {
    message: { title: 'New message', body: 'Black Pater answered you.' },
    update: { title: 'New information', body: 'Black Pater published something for you.' },
    renew: { title: 'Your access ends soon', body: 'Renew from your space to keep receiving the information.' },
    renewEnded: { title: 'Your access has ended', body: 'Renew from your space to get your information back.' }
  },
  fr: {
    message: { title: 'Nouveau message', body: 'Black Pater vous a répondu.' },
    update: { title: 'Nouvelle information', body: 'Black Pater a publié quelque chose pour vous.' },
    renew: { title: 'Votre accès se termine bientôt', body: 'Renouvelez depuis votre espace pour continuer à recevoir les informations.' },
    renewEnded: { title: 'Votre accès est terminé', body: 'Renouvelez depuis votre espace pour retrouver vos informations.' }
  }
};

/** The notification for one outbox row, or null when that kind is never pushed. */
export function pushFor(row) {
  const t = TEXT[row.locale === 'fr' ? 'fr' : 'en'];
  if (row.kind === 'message') return { ...t.message, url: '/espace-client?view=messages', tag: 'bp-message' };
  if (row.kind === 'update') return { ...t.update, url: '/espace-client?view=info', tag: 'bp-update' };
  if (row.kind === 'renew') {
    const ended = row.data?.stage === 0;
    return { ...(ended ? t.renewEnded : t.renew), url: '/espace-client?view=account', tag: 'bp-renew' };
  }
  return null;
}

/** Sender: resolves to { ok, gone } per device and never throws. */
export function createPushSender(deps = {}) {
  const lib = deps.webpush || webpush;
  return async function sendPush(cfg, device, payload) {
    if (!cfg.enabled) return { ok: false, gone: false };
    try {
      await lib.sendNotification(
        { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
        JSON.stringify(payload),
        {
          TTL: 24 * 3600,
          urgency: 'normal',
          timeout: 6000,
          vapidDetails: { subject: `mailto:${CONTACT_EMAIL}`, publicKey: cfg.publicKey, privateKey: cfg.privateKey }
        }
      );
      return { ok: true, gone: false };
    } catch (err) {
      const status = Number(err?.statusCode) || 0;
      return { ok: false, gone: status === 404 || status === 410 };
    }
  };
}
