/**
 * Client portal API: /api/portal/<action>.
 *
 * The browser only ever talks to this site. This server holds the portal key
 * (LEVELUP_PORTAL_KEY) and Black Pater's e-mail key, calls the LevelUp database
 * functions portal_* and keeps the customer's session token in an HttpOnly,
 * SameSite=Strict cookie (7 days). Every rule that matters (who sees what,
 * codes, tries, rate limits, password hashing) is enforced by the database;
 * this layer adds same-origin checks, strict input checks, a per-IP limiter,
 * neutral answers and e-mail sending.
 */
import { getStripe } from '../stripe.js';
import { createRateLimiter } from '../memory.js';
import { HttpError, getClientIp, methodNotAllowed, readJsonBody, readRawBody, sendJson } from '../http.js';
import { LEVELUP_SUPABASE_URL, getLevelUpConfig } from '../levelup.js';
import { getPortalConfig, missingConfig } from './config.js';
import { PortalDbError, createPortalDb } from './db.js';
import { buildEmail, createMailer } from './email.js';
import { buildPlanCheckout, idempotencyKey, isPlanObject, subscriptionPayload, switchPlan } from './plans.js';
import { isStripeCheckoutUrl } from '../../../shared/validation.js';
import {
  bearerMatches,
  clientHash,
  deviceLabel,
  isBreached,
  passwordProblem,
  readSessionCookie,
  sessionCookie,
  verifySignature
} from './security.js';

const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CODE_RE = /^[0-9]{6}$/;

export const PORTAL_ACTIONS = [
  'status',
  'request-code',
  'verify-code',
  'password-sign-in',
  'me',
  'read',
  'checklist',
  'message',
  'file',
  'receipt',
  'password-code',
  'set-password',
  'email-start',
  'email-confirm',
  'sign-out',
  'outbox',
  'messages-since',
  'subscribe',
  'plan-return',
  'cancel-plan',
  'resume-plan',
  'pay-plan',
  'delete-code',
  'delete-account'
];

const GET_ACTIONS = new Set(['status', 'me', 'file']);
const NO_SESSION = new Set(['status', 'request-code', 'verify-code', 'password-sign-in', 'outbox']);

function cleanEmail(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  return v.length >= 6 && v.length <= 254 && !v.includes('..') && EMAIL_RE.test(v) ? v : null;
}

/** Exactly these keys, each passing its check. */
function pick(body, spec) {
  const keys = Object.keys(body);
  if (keys.some((k) => !(k in spec))) throw new HttpError(400, 'invalid_request');
  const out = {};
  for (const [k, check] of Object.entries(spec)) {
    const v = check(body[k]);
    if (v === undefined) throw new HttpError(400, 'invalid_request');
    out[k] = v;
  }
  return out;
}

const req_ = {
  email: (v) => cleanEmail(v) ?? undefined,
  code: (v) => (typeof v === 'string' && CODE_RE.test(v.trim()) ? v.trim() : undefined),
  uuid: (v) => (typeof v === 'string' && UUID_RE.test(v) ? v : undefined),
  lang: (v) => (v === undefined || v === null ? null : v === 'fr' || v === 'en' ? v : undefined),
  bool: (v) => (v === undefined ? false : typeof v === 'boolean' ? v : undefined),
  password: (v) => (typeof v === 'string' && v.length >= 1 && v.length <= 200 ? v : undefined),
  index: (v) => (Number.isInteger(v) && v >= 0 && v < 50 ? v : undefined),
  optUuid: (v) => (v === undefined || v === null ? null : typeof v === 'string' && UUID_RE.test(v) ? v : undefined),
  body: (v) => (typeof v === 'string' && v.trim().length >= 1 && v.length <= 4000 ? v : undefined),
  level: (v) => (Number.isInteger(v) && v >= 1 && v <= 3 ? v : undefined),
  after: (v) =>
    v === undefined || v === null
      ? null
      : typeof v === 'string' && v.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(v) && !Number.isNaN(Date.parse(v))
        ? v
        : undefined,
  checkoutSession: (v) => (typeof v === 'string' && /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(v) ? v : undefined)
};

/** Stripe calls of the member space: any failure becomes a short, neutral error. */
async function viaStripe(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof PortalDbError) throw err;
    throw new PortalDbError('payments_unavailable', 502);
  }
}

function isSecure(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}

/** The browser's Origin must be this very site (no cross-site form or fetch). */
function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

function siteOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  if (host === 'blackpater.com' || host === 'www.blackpater.com') return `https://${host}`;
  return 'https://blackpater.com';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Builds the e-mail for one queued row of portal_outbox_claim. */
export function emailForOutbox(row, origin) {
  const base = { lang: row.locale, name: row.name, origin };
  if (row.kind === 'access') return buildEmail('access', base);
  if (row.kind === 'update') return buildEmail('update', { ...base, title: row.item?.title || '' });
  if (row.kind === 'message') return buildEmail('message', base);
  if (row.kind === 'signin') {
    const at = typeof row.data?.at === 'string' ? row.data.at.replace('T', ' ').replace('Z', '') : '';
    const device = typeof row.data?.device === 'string' ? row.data.device.slice(0, 80) : null;
    return buildEmail('signin', { ...base, device, at });
  }
  return null;
}

export function createPortalHandler(deps = {}) {
  const configFor = deps.getConfig || getPortalConfig;
  const rpc = deps.rpc || createPortalDb({ fetch: deps.fetch });
  const send = deps.send || createMailer({ fetch: deps.fetch });
  const log = deps.log || console;
  const stripeFor = deps.getStripe || getStripe;
  const fetchImpl = deps.fetch || ((...a) => globalThis.fetch(...a));
  const breached = deps.isBreached || ((p) => isBreached(p, fetchImpl));
  const minCodeMs = deps.minCodeResponseMs ?? 900;
  const limitAuth = deps.authLimiter || createRateLimiter({ windowMs: 10 * 60 * 1000, max: 20 });
  const limitAll = deps.limiter || createRateLimiter({ windowMs: 60 * 1000, max: 120 });

  async function drain(cfg, origin, limit = 10) {
    let sent = 0;
    let failed = 0;
    let rows;
    try {
      rows = await rpc('portal_outbox_claim', { p_key: cfg.portalKey, p_limit: limit });
    } catch (err) {
      log.warn(JSON.stringify({ evt: 'portal.outbox_claim_failed', code: err?.code || 'error' }));
      return { sent, failed };
    }
    for (const row of Array.isArray(rows) ? rows : []) {
      const mail = emailForOutbox(row, origin);
      const result = mail && row.to ? await send(cfg, { to: row.to, ...mail }) : { ok: false, reason: 'invalid' };
      if (result.ok) sent += 1;
      else failed += 1;
      try {
        await rpc('portal_outbox_complete', {
          p_key: cfg.portalKey,
          p_id: row.id,
          p_ok: result.ok,
          p_error: result.ok ? null : `${result.reason || 'error'}:${result.status || 0}`
        });
      } catch {
        /* the row is retried after 10 minutes */
      }
    }
    if (failed) log.warn(JSON.stringify({ evt: 'portal.email_failed', count: failed }));
    return { sent, failed };
  }

  async function sendCode(cfg, kind, to, { code, name, locale, newEmail }, origin) {
    const mail = buildEmail(kind, { lang: locale, name, code, newEmail, origin });
    const result = await send(cfg, { to, ...mail });
    if (!result.ok) log.warn(JSON.stringify({ evt: 'portal.code_email_failed', kind, status: result.status || 0 }));
    return result.ok;
  }

  async function syncSubscription(cfg, sub) {
    if (!sub?.id) return;
    await rpc('portal_subscription_sync', { p_key: cfg.portalKey, p_sub: subscriptionPayload(sub) });
  }

  /** Opens a session: cookie + background-free alert e-mail (bounded). */
  async function openSession(req, res, cfg, result, origin) {
    if (!result?.ok || typeof result.session !== 'string') {
      return sendJson(res, result?.reason === 'rate_limited' ? 429 : 400, {
        error: result?.reason === 'rate_limited' ? 'rate_limited' : 'invalid_credentials'
      });
    }
    await Promise.race([drain(cfg, origin, 5), sleep(4000)]);
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(result.session, { secure: isSecure(req) }) });
  }

  const actions = {
    async status(req, res, cfg) {
      const missing = missingConfig(cfg);
      return sendJson(res, 200, { available: missing.length === 0 });
    },

    async 'request-code'(req, res, cfg, ctx) {
      const started = Date.now();
      const { email, lang } = pick(await readJsonBody(req, 1024), { email: req_.email, lang: req_.lang });
      let result = { send: false };
      try {
        result = await rpc('portal_request_code', { p_key: cfg.portalKey, p_email: email, p_client: ctx.client, p_lang: lang });
      } catch (err) {
        if (err instanceof PortalDbError && err.status === 429) return sendJson(res, 429, { error: 'rate_limited' });
        if (err instanceof PortalDbError && err.status === 400) return sendJson(res, 400, { error: 'invalid_request' });
        throw err;
      }
      if (result?.send && result.code) await sendCode(cfg, 'code', result.email, result, ctx.origin);
      // Same answer and roughly the same time whether or not the address has a booking.
      const wait = minCodeMs - (Date.now() - started);
      if (wait > 0) await sleep(wait);
      return sendJson(res, 200, { ok: true });
    },

    async 'verify-code'(req, res, cfg, ctx) {
      const { email, code } = pick(await readJsonBody(req, 1024), { email: req_.email, code: req_.code });
      const result = await rpc('portal_verify_code', {
        p_key: cfg.portalKey,
        p_email: email,
        p_code: code,
        p_client: ctx.client,
        p_device: ctx.device
      });
      return openSession(req, res, cfg, result, ctx.origin);
    },

    async 'password-sign-in'(req, res, cfg, ctx) {
      const { email, password } = pick(await readJsonBody(req, 1024), { email: req_.email, password: req_.password });
      const result = await rpc('portal_password_sign_in', {
        p_key: cfg.portalKey,
        p_email: email,
        p_password: password,
        p_client: ctx.client,
        p_device: ctx.device
      });
      return openSession(req, res, cfg, result, ctx.origin);
    },

    async me(req, res, cfg, ctx) {
      const home = await rpc('portal_home', { p_key: cfg.portalKey, p_session: ctx.session });
      return sendJson(res, 200, home);
    },

    async read(req, res, cfg, ctx) {
      const { itemId, messages } = pick(await readJsonBody(req, 512), { itemId: req_.optUuid, messages: req_.bool });
      await rpc('portal_mark_read', { p_key: cfg.portalKey, p_session: ctx.session, p_item_id: itemId, p_messages: messages });
      return sendJson(res, 200, { ok: true });
    },

    async checklist(req, res, cfg, ctx) {
      const { itemId, index, checked } = pick(await readJsonBody(req, 512), {
        itemId: req_.uuid,
        index: req_.index,
        checked: req_.bool
      });
      const out = await rpc('portal_set_checklist', {
        p_key: cfg.portalKey,
        p_session: ctx.session,
        p_item_id: itemId,
        p_index: index,
        p_checked: checked
      });
      return sendJson(res, 200, { ok: true, checked: out?.checked ?? [] });
    },

    async message(req, res, cfg, ctx) {
      const { body } = pick(await readJsonBody(req, 20000), { body: req_.body });
      const out = await rpc('portal_send_message', { p_key: cfg.portalKey, p_session: ctx.session, p_body: body });
      return sendJson(res, 200, { ok: true, id: out?.id, created_at: out?.created_at });
    },

    /** GET /api/portal/file?item=<uuid>: streams the document; the storage link never reaches the browser. */
    async file(req, res, cfg, ctx) {
      const item = new URL(req.url, 'http://x').searchParams.get('item');
      if (!item || !UUID_RE.test(item)) return sendJson(res, 400, { error: 'invalid_request' });
      const ticket = await rpc('portal_document_ticket', { p_key: cfg.portalKey, p_session: ctx.session, p_item_id: item });
      const path = String(ticket?.path || '');
      if (!/^org\/[0-9a-f-]{36}\/site\/ws_[0-9a-f]{16}\/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/.test(path)) {
        return sendJson(res, 404, { error: 'not_found' });
      }
      const pk = getLevelUpConfig().publishableKey;
      const signRes = await fetchImpl(`${LEVELUP_SUPABASE_URL}/storage/v1/object/sign/portal-documents/${path}`, {
        method: 'POST',
        headers: { apikey: pk, Authorization: `Bearer ${pk}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 60 })
      });
      const signed = signRes.ok ? await signRes.json().catch(() => null) : null;
      if (!signed?.signedURL) return sendJson(res, 404, { error: 'not_found' });
      const fileRes = await fetchImpl(`${LEVELUP_SUPABASE_URL}/storage/v1${signed.signedURL}`);
      if (!fileRes.ok || !fileRes.body) return sendJson(res, 404, { error: 'not_found' });
      const ext = path.split('.').pop();
      const type = { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext];
      const base = String(ticket.name || 'document').replace(/[^\p{L}\p{N} ._()-]/gu, '').trim().slice(0, 120) || 'document';
      const filename = base.toLowerCase().endsWith(`.${ext}`) ? base : `${base}.${ext}`;
      res.statusCode = 200;
      res.setHeader('Content-Type', type);
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      const len = fileRes.headers.get('content-length');
      if (len) res.setHeader('Content-Length', len);
      const reader = fileRes.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    },

    /** Stripe receipt of one of the customer's own payments (looked up live, never stored). */
    async receipt(req, res, cfg, ctx) {
      const { paymentId } = pick(await readJsonBody(req, 512), { paymentId: req_.uuid });
      const ref = await rpc('portal_payment_reference', { p_key: cfg.portalKey, p_session: ctx.session, p_payment_id: paymentId });
      const stripe = stripeFor();
      if (!stripe || ref?.provider !== 'stripe' || !/^pi_[A-Za-z0-9]+$/.test(String(ref?.payment_intent || ''))) {
        return sendJson(res, 404, { error: 'not_found' });
      }
      try {
        const pi = await stripe.paymentIntents.retrieve(ref.payment_intent, { expand: ['latest_charge'] });
        const url = pi?.latest_charge?.receipt_url;
        if (typeof url !== 'string' || !/^https:\/\/pay\.stripe\.com\//.test(url)) return sendJson(res, 404, { error: 'not_found' });
        return sendJson(res, 200, { url });
      } catch {
        return sendJson(res, 404, { error: 'not_found' });
      }
    },

    async 'password-code'(req, res, cfg, ctx) {
      pick(await readJsonBody(req, 256), {});
      const result = await rpc('portal_request_code', {
        p_key: cfg.portalKey,
        p_email: null,
        p_client: ctx.client,
        p_lang: null,
        p_purpose: 'password',
        p_session: ctx.session
      });
      if (result?.send && result.code) await sendCode(cfg, 'password', result.email, result, ctx.origin);
      return sendJson(res, 200, { ok: true });
    },

    async 'set-password'(req, res, cfg, ctx) {
      const { code, password } = pick(await readJsonBody(req, 1024), { code: req_.code, password: req_.password });
      const me = await rpc('portal_home', { p_key: cfg.portalKey, p_session: ctx.session });
      const problem = passwordProblem(password, me?.customer?.email);
      if (problem) return sendJson(res, 400, { error: problem });
      if (await breached(password)) return sendJson(res, 400, { error: 'password_breached' });
      const out = await rpc('portal_set_password', { p_key: cfg.portalKey, p_session: ctx.session, p_code: code, p_password: password });
      if (!out?.ok) return sendJson(res, 400, { error: 'invalid_code' });
      return sendJson(res, 200, { ok: true });
    },

    async 'email-start'(req, res, cfg, ctx) {
      const { email } = pick(await readJsonBody(req, 512), { email: req_.email });
      const out = await rpc('portal_email_change_start', {
        p_key: cfg.portalKey,
        p_session: ctx.session,
        p_new_email: email,
        p_client: ctx.client
      });
      if (!out?.ok) return sendJson(res, 400, { error: 'email_unavailable' });
      const who = { name: out.name, locale: out.locale };
      await sendCode(cfg, 'email_old', out.old.email, { ...who, code: out.old.code, newEmail: out.new.email }, ctx.origin);
      await sendCode(cfg, 'email_new', out.new.email, { ...who, code: out.new.code }, ctx.origin);
      return sendJson(res, 200, { ok: true });
    },

    async 'email-confirm'(req, res, cfg, ctx) {
      const { oldCode, newCode } = pick(await readJsonBody(req, 512), { oldCode: req_.code, newCode: req_.code });
      const out = await rpc('portal_email_change_confirm', {
        p_key: cfg.portalKey,
        p_session: ctx.session,
        p_old_code: oldCode,
        p_new_code: newCode
      });
      if (!out?.ok) return sendJson(res, 400, { error: out?.reason === 'unavailable' ? 'email_unavailable' : 'invalid_code' });
      return sendJson(res, 200, { ok: true, email: out.email });
    },

    async 'sign-out'(req, res, cfg, ctx) {
      const { all } = pick(await readJsonBody(req, 256), { all: req_.bool });
      try {
        await rpc('portal_sign_out', { p_key: cfg.portalKey, p_session: ctx.session, p_all: all });
      } catch (err) {
        if (!(err instanceof PortalDbError && err.status === 401)) throw err;
      }
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(null, { secure: isSecure(req) }) });
    },

    /** New messages since the last one the page has (the conversation refreshes itself). */
    async 'messages-since'(req, res, cfg, ctx) {
      const { after } = pick(await readJsonBody(req, 256), { after: req_.after });
      const out = await rpc('portal_messages_since', { p_key: cfg.portalKey, p_session: ctx.session, p_after: after });
      return sendJson(res, 200, { messages: out?.messages ?? [], seen: out?.seen ?? [] });
    },

    /**
     * Choose a monthly plan. No plan yet: a Stripe payment page (monthly,
     * automatic). A plan already: the same subscription moves to the new plan,
     * or a plan set to stop is kept going.
     */
    async subscribe(req, res, cfg, ctx) {
      const { level } = pick(await readJsonBody(req, 256), { level: req_.level });
      const stripe = stripeFor();
      if (!stripe) return sendJson(res, 503, { error: 'payments_unavailable' });
      const start = await rpc('portal_subscribe_start', { p_key: cfg.portalKey, p_session: ctx.session, p_level: level });
      if (!start?.plan?.id || !Number.isInteger(start.plan.amount)) return sendJson(res, 404, { error: 'not_found' });
      const current = start.current;
      if (current?.provider_subscription_id) {
        const id = current.provider_subscription_id;
        let sub;
        if (current.level === level) {
          if (!current.cancel_at_period_end) return sendJson(res, 409, { error: 'already_subscribed' });
          sub = await viaStripe(() => stripe.subscriptions.update(id, { cancel_at_period_end: false }));
        } else {
          sub = await viaStripe(() => switchPlan(stripe, id, start));
          if (!sub) return sendJson(res, 409, { error: 'already_subscribed' });
        }
        await syncSubscription(cfg, sub);
        return sendJson(res, 200, { ok: true, changed: true });
      }
      const params = buildPlanCheckout({ start, origin: ctx.origin });
      const session = await viaStripe(() =>
        stripe.checkout.sessions.create(params, {
          idempotencyKey: idempotencyKey(['checkout', start.customer_id, start.plan.id, start.plan.amount, start.plan.currency])
        })
      );
      if (!isStripeCheckoutUrl(session?.url)) return sendJson(res, 502, { error: 'payments_unavailable' });
      return sendJson(res, 200, { url: session.url });
    },

    /** Back from the payment page: record the plan at once (the webhook does it too). */
    async 'plan-return'(req, res, cfg, ctx) {
      const { sessionId } = pick(await readJsonBody(req, 512), { sessionId: req_.checkoutSession });
      const stripe = stripeFor();
      if (!stripe) return sendJson(res, 503, { error: 'payments_unavailable' });
      const session = await viaStripe(() => stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] }));
      if (!isPlanObject(session)) return sendJson(res, 404, { error: 'not_found' });
      const sub = session.subscription && typeof session.subscription === 'object' ? session.subscription : null;
      if (session.status !== 'complete' || !sub) return sendJson(res, 200, { ok: true, active: false });
      await syncSubscription(cfg, sub);
      return sendJson(res, 200, { ok: true, active: sub.status === 'active' || sub.status === 'trialing' });
    },

    /** Stop the monthly plan: it runs until the end of the paid month, nothing more is charged. */
    async 'cancel-plan'(req, res, cfg, ctx) {
      pick(await readJsonBody(req, 256), {});
      const stripe = stripeFor();
      if (!stripe) return sendJson(res, 503, { error: 'payments_unavailable' });
      const refs = await rpc('portal_subscription_refs', { p_key: cfg.portalKey, p_session: ctx.session });
      for (const ref of Array.isArray(refs) ? refs : []) {
        const id = ref.provider_subscription_id;
        let sub = null;
        if (ref.status === 'active' && !ref.cancel_at_period_end) {
          sub = await viaStripe(() => stripe.subscriptions.update(id, { cancel_at_period_end: true }));
        } else if (ref.status === 'past_due' || ref.status === 'incomplete') {
          // Nothing paid for this month: stop now.
          sub = await viaStripe(() => stripe.subscriptions.cancel(id));
        }
        if (sub) await syncSubscription(cfg, sub);
      }
      return sendJson(res, 200, { ok: true });
    },

    /** Keep a plan that was set to stop. */
    async 'resume-plan'(req, res, cfg, ctx) {
      pick(await readJsonBody(req, 256), {});
      const stripe = stripeFor();
      if (!stripe) return sendJson(res, 503, { error: 'payments_unavailable' });
      const refs = await rpc('portal_subscription_refs', { p_key: cfg.portalKey, p_session: ctx.session });
      const ref = (Array.isArray(refs) ? refs : []).find((r) => r.status === 'active' && r.cancel_at_period_end);
      if (!ref) return sendJson(res, 404, { error: 'not_found' });
      const sub = await viaStripe(() => stripe.subscriptions.update(ref.provider_subscription_id, { cancel_at_period_end: false }));
      await syncSubscription(cfg, sub);
      return sendJson(res, 200, { ok: true });
    },

    /** A monthly payment failed: Stripe's own page to pay it (card can be changed there). */
    async 'pay-plan'(req, res, cfg, ctx) {
      pick(await readJsonBody(req, 256), {});
      const stripe = stripeFor();
      if (!stripe) return sendJson(res, 503, { error: 'payments_unavailable' });
      const refs = await rpc('portal_subscription_refs', { p_key: cfg.portalKey, p_session: ctx.session });
      const ref = (Array.isArray(refs) ? refs : []).find((r) => r.status === 'past_due' || r.status === 'incomplete');
      if (!ref) return sendJson(res, 404, { error: 'nothing_due' });
      const sub = await viaStripe(() => stripe.subscriptions.retrieve(ref.provider_subscription_id, { expand: ['latest_invoice'] }));
      const url = sub?.latest_invoice?.hosted_invoice_url;
      if (typeof url !== 'string' || !/^https:\/\/invoice\.stripe\.com\//.test(url)) return sendJson(res, 404, { error: 'nothing_due' });
      return sendJson(res, 200, { url });
    },

    async 'delete-code'(req, res, cfg, ctx) {
      pick(await readJsonBody(req, 256), {});
      const result = await rpc('portal_request_code', {
        p_key: cfg.portalKey,
        p_email: null,
        p_client: ctx.client,
        p_lang: null,
        p_purpose: 'delete',
        p_session: ctx.session
      });
      if (result?.send && result.code) await sendCode(cfg, 'delete', result.email, result, ctx.origin);
      return sendJson(res, 200, { ok: true });
    },

    /** Deletes the account: plans stopped at Stripe first, then personal data erased. */
    async 'delete-account'(req, res, cfg, ctx) {
      const { code } = pick(await readJsonBody(req, 256), { code: req_.code });
      const begin = await rpc('portal_delete_account_begin', { p_key: cfg.portalKey, p_session: ctx.session, p_code: code });
      if (!begin?.ok) return sendJson(res, 400, { error: 'invalid_code' });
      const ids = (Array.isArray(begin.subscriptions) ? begin.subscriptions : []).filter((id) => /^sub_[A-Za-z0-9]+$/.test(String(id)));
      if (ids.length) {
        const stripe = stripeFor();
        if (!stripe) return sendJson(res, 503, { error: 'payments_unavailable' });
        for (const id of ids) {
          await viaStripe(async () => {
            try {
              await stripe.subscriptions.cancel(id);
            } catch (err) {
              if (err?.code !== 'resource_missing') throw err;
            }
          });
        }
      }
      await rpc('portal_delete_account_finish', { p_key: cfg.portalKey, p_session: ctx.session });
      log.info?.(JSON.stringify({ evt: 'portal.account_deleted' }));
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(null, { secure: isSecure(req) }) });
    },

    /** Sends queued e-mails: signed call from the LevelUp dashboard or the daily Vercel Cron. */
    async outbox(req, res, cfg, ctx) {
      let authorized = bearerMatches(req.headers.authorization, cfg.cronSecret);
      if (!authorized && req.method === 'POST') {
        const raw = (await readRawBody(req, 2048)).toString('utf8');
        authorized = verifySignature(req.headers['x-portal-signature'], raw, cfg.notifySecret);
      }
      if (!authorized) return sendJson(res, 401, { error: 'unauthorized' });
      const out = await drain(cfg, ctx.origin, 25);
      return sendJson(res, 200, { ok: true, ...out });
    }
  };

  async function handler(req, res) {
    const action = String(req.query?.action || new URL(req.url, 'http://x').pathname.split('/').pop() || '');
    if (!PORTAL_ACTIONS.includes(action)) return sendJson(res, 404, { error: 'not_found' });
    const isGet = GET_ACTIONS.has(action);
    if (action === 'outbox') {
      if (req.method !== 'POST' && req.method !== 'GET') return methodNotAllowed(res, ['GET', 'POST']);
    } else if (isGet ? req.method !== 'GET' : req.method !== 'POST') {
      return methodNotAllowed(res, [isGet ? 'GET' : 'POST']);
    }
    if (!isGet && action !== 'outbox' && !sameOrigin(req)) return sendJson(res, 403, { error: 'forbidden' });

    const ip = getClientIp(req);
    if (!limitAll(ip).ok) return sendJson(res, 429, { error: 'rate_limited' });
    if (
      ['request-code', 'verify-code', 'password-sign-in', 'password-code', 'email-start', 'subscribe', 'delete-code', 'delete-account'].includes(action) &&
      !limitAuth(ip).ok
    ) {
      return sendJson(res, 429, { error: 'rate_limited' });
    }

    const cfg = configFor();
    if (action !== 'status') {
      const missing = missingConfig(cfg);
      if (missing.length) {
        // Fail closed: no key, no e-mail. Names only in the log, never values.
        log.error(JSON.stringify({ evt: 'portal.not_configured', missing }));
        return sendJson(res, 503, { error: 'portal_unavailable' });
      }
    }

    const ctx = {
      client: clientHash(ip, cfg.portalKey),
      device: deviceLabel(req.headers['user-agent']),
      origin: siteOrigin(req),
      session: readSessionCookie(req)
    };
    if (!NO_SESSION.has(action) && !ctx.session) return sendJson(res, 401, { error: 'unauthorized' });

    try {
      return await actions[action](req, res, cfg, ctx);
    } catch (err) {
      if (err instanceof HttpError) return sendJson(res, err.status, { error: err.status === 413 ? 'payload_too_large' : 'invalid_request' });
      if (err instanceof PortalDbError) {
        if (err.status === 401) {
          // Unknown or expired session: clear the cookie. A bad portal key also lands here.
          const headers = ctx.session ? { 'Set-Cookie': sessionCookie(null, { secure: isSecure(req) }) } : {};
          return sendJson(res, NO_SESSION.has(action) ? 503 : 401, { error: NO_SESSION.has(action) ? 'portal_unavailable' : 'unauthorized' }, headers);
        }
        if (err.status === 503) log.error(JSON.stringify({ evt: 'portal.upstream', code: err.code }));
        return sendJson(res, err.status, { error: err.code });
      }
      log.error(JSON.stringify({ evt: 'portal.failed', action, error: err?.name || 'Error' }));
      if (!res.headersSent) return sendJson(res, 500, { error: 'server_error' });
      res.end();
    }
  }

  /** Sends what is queued (e.g. the access e-mail right after a paid checkout). */
  handler.drainNow = async function drainNow(limit = 10) {
    const cfg = configFor();
    if (missingConfig(cfg).length) return { skipped: true, sent: 0, failed: 0 };
    return { skipped: false, ...(await drain(cfg, 'https://blackpater.com', limit)) };
  };

  return handler;
}
