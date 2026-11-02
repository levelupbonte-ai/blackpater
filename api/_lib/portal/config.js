/**
 * Client portal ("Espace client") configuration. Everything here is server-side:
 * none of these variables reaches the browser.
 *
 * - LEVELUP_PORTAL_KEY       LevelUp server key with the "Client portal" scope
 *                            (dashboard → Developers → Server keys). Authenticates
 *                            every portal call to the LevelUp database.
 * - BLACKPATER_RESEND_API_KEY Black Pater's own e-mail provider key (Resend).
 * - BLACKPATER_EMAIL_FROM    Sender on Black Pater's verified domain, e.g.
 *                            "Black Pater <espace@blackpater.com>".
 * - BLACKPATER_EMAIL_REPLY_TO Optional, defaults to the public contact address.
 * - PORTAL_NOTIFY_SECRET     Optional, shared with the LevelUp dashboard: signs the
 *                            "send the queued e-mails now" call.
 * - CRON_SECRET              Optional, set by Vercel Cron: the daily queue run.
 *
 * Without the portal key, the e-mail key or the sender the portal fails closed:
 * every action answers 503 `portal_unavailable` and nothing is sent. There is no
 * fallback to any other sender.
 */
import { readEnv } from '../stripe.js';

export const CONTACT_EMAIL = 'lofumbwapater@gmail.com';
export const PORTAL_PATH = '/espace-client';
export const SITE_ORIGIN = 'https://blackpater.com';

export function getPortalConfig() {
  const portalKey = readEnv('LEVELUP_PORTAL_KEY');
  const resendKey = readEnv('BLACKPATER_RESEND_API_KEY');
  const from = readEnv('BLACKPATER_EMAIL_FROM');
  return {
    portalKey: /^lu_(live|test)_[0-9a-f]{48}$/.test(portalKey) ? portalKey : '',
    resendKey: /^re_[A-Za-z0-9_]{8,}$/.test(resendKey) ? resendKey : '',
    from: /<[^<>@\s]+@[^<>@\s]+>$|^[^<>@\s]+@[^<>@\s]+$/.test(from) ? from : '',
    replyTo: readEnv('BLACKPATER_EMAIL_REPLY_TO') || CONTACT_EMAIL,
    notifySecret: readEnv('PORTAL_NOTIFY_SECRET'),
    cronSecret: readEnv('CRON_SECRET')
  };
}

/** What is missing, as names only (never values), for logs and the status route. */
export function missingConfig(cfg = getPortalConfig()) {
  const missing = [];
  if (!cfg.portalKey) missing.push('LEVELUP_PORTAL_KEY');
  if (!cfg.resendKey) missing.push('BLACKPATER_RESEND_API_KEY');
  if (!cfg.from) missing.push('BLACKPATER_EMAIL_FROM');
  return missing;
}
