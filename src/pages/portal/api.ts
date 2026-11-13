// Browser side of the client space: same-origin calls to /api/portal/*. The
// session lives in an HttpOnly cookie the page never sees; no key, token or
// third-party address is ever handled here.

export interface PortalBooking {
  id: string;
  offer_id: string | null;
  offer_name: string | null;
  status: 'paid' | 'refunded';
  amount: number;
  currency: string;
  paid_at: string | null;
  refunded_at: string | null;
  occurred_at: string;
  amount_refunded: number | null;
  refund: 'full' | 'partial' | null;
  receipt: boolean;
  kind?: 'membership' | 'plan';
  period_end?: string | null;
}

export interface PortalTrip {
  start_date: string | null;
  end_date: string | null;
  meeting_point: string | null;
  meeting_time: string | null;
  steps: { date: string | null; title: string; detail: string | null }[];
}

export interface PortalItem {
  id: string;
  kind: 'update' | 'trip' | 'document' | 'checklist';
  title: string;
  body: string | null;
  trip: PortalTrip | null;
  checklist: string[] | null;
  published_at: string;
  min_level: number;
  document: { name: string | null; size: number | null; type: string | null } | null;
  read: boolean;
  checked: number[];
}

/** Information above the member's plan: its title only. */
export interface PortalLocked {
  id: string;
  kind: PortalItem['kind'];
  title: string;
  published_at: string;
  min_level: number;
}

export interface PortalPlan {
  level: number;
  name: string;
  description: string | null;
  features: string[];
  amount: number;
  currency: string;
}

export interface PortalSubscription {
  plan_name: string;
  level: number;
  amount: number;
  currency: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/** Monthly membership: paid month by month, nothing automatic. */
export interface PortalMembership {
  monthly: boolean;
  until: string | null;
  active: boolean;
  reminders: boolean;
  period_days: number;
  offer_id: string | null;
}

/** The member's monthly plan now (or the last one). */
export interface PortalPlanPeriod {
  plan_name: string | null;
  level: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
  amount: number | null;
  currency: string | null;
}

export interface PortalAccess {
  level: number;
  trial_ends_at: string | null;
  trial_active: boolean;
  trial_days: number;
  subscription: PortalSubscription | null;
  plan: PortalPlanPeriod | null;
}

export interface PortalMessage {
  id: string;
  sender: 'customer' | 'owner';
  body: string;
  created_at: string;
  read: boolean;
  /** The member's own message has been read by Black Pater. */
  seen?: boolean;
  /** Sent with "Ask Black Pater" from the AI assistant. */
  via?: 'assistant' | null;
  /** Black Pater's answer to a question from the assistant. */
  validated?: boolean;
}

/** One line of the conversation with the AI assistant. */
export interface AssistantMessage {
  id: string;
  /** user: the member; assistant: the AI; owner: Black Pater's validated answer. */
  role: 'user' | 'assistant' | 'owner';
  body: string;
  sources: { url: string; title: string }[];
  /** On an AI answer: the question it answers. */
  question_id: string | null;
  /** On a question: sent to Black Pater. */
  handed_off: boolean;
  /** Images joined to a question (kept on the device only). */
  images?: number;
  created_at: string;
}

export interface AssistantThread {
  enabled: boolean;
  /** Membership active (the assistant is for active members). */
  active: boolean;
  daily: number;
  used: number;
  images: { daily: number; used: number };
  /** The member has a dossier or a note: the assistant knows their project. */
  has_profile: boolean;
  messages: AssistantMessage[];
}

/** The member's dossier: questionnaire answers saved before paying, and their note. */
export interface MemberProfile {
  profile: Record<string, unknown> | null;
  updated_at: string | null;
  note: string | null;
}

export interface PortalHome {
  customer: { name: string | null; email: string; locale: 'en' | 'fr'; since: string; has_password: boolean; sessions: number };
  offers: string[];
  bookings: PortalBooking[];
  items: PortalItem[];
  locked: PortalLocked[];
  messages: PortalMessage[];
  access: PortalAccess;
  membership: PortalMembership;
  plans: PortalPlan[];
  contact: { phone?: string; whatsapp?: string; note?: string };
}

export interface NewsItem {
  id: string;
  url: string;
  title: string;
  source: string;
  topics: string[];
  important: boolean;
  at: string;
  summary: string | null;
  image_url: string | null;
  /** Members of this site who found it useful / opened the article. */
  helpful: number;
  reads: number;
  /** This member's vote: true useful, false not useful, null none. */
  mine: boolean | null;
}

export interface GuideLink {
  name: string;
  url: string;
  kind: string;
}

export interface NewsFeed {
  country: string | null;
  dossier_country: string | null;
  access: 'full' | 'preview';
  covered: string[];
  items: NewsItem[];
  total: number;
  sources: { name: string; url: string }[];
  guide: GuideLink[] | null;
  updated_at: string | null;
}

export class PortalError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function call<T>(action: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/portal/${action}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new PortalError('network', 0);
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new PortalError(data?.error || 'generic', res.status);
  return data as T;
}

export const portalApi = {
  me: () => call<PortalHome>('me'),
  requestCode: (email: string, lang: string) => call<{ ok: true }>('request-code', { email, lang }),
  verifyCode: (email: string, code: string) => call<{ ok: true }>('verify-code', { email, code }),
  passwordSignIn: (email: string, password: string) => call<{ ok: true }>('password-sign-in', { email, password }),
  read: (itemId: string | null, messages = false) => call<{ ok: true }>('read', { itemId, messages }),
  checklist: (itemId: string, index: number, checked: boolean) =>
    call<{ ok: true; checked: number[] }>('checklist', { itemId, index, checked }),
  message: (body: string) => call<{ ok: true; id: string; created_at: string }>('message', { body }),
  receipt: (paymentId: string) => call<{ url: string }>('receipt', { paymentId }),
  passwordCode: () => call<{ ok: true }>('password-code', {}),
  setPassword: (code: string, password: string) => call<{ ok: true }>('set-password', { code, password }),
  emailStart: (email: string) => call<{ ok: true }>('email-start', { email }),
  emailConfirm: (oldCode: string, newCode: string) => call<{ ok: true; email: string }>('email-confirm', { oldCode, newCode }),
  signOut: (all: boolean) => call<{ ok: true }>('sign-out', { all }),
  messagesSince: (after: string | null) => call<{ messages: PortalMessage[]; seen: string[] }>('messages-since', { after }),
  renew: () => call<{ url: string }>('renew', {}),
  planBuy: (level: number) => call<{ url: string }>('plan-buy', { level }),
  reminders: (on: boolean) => call<{ ok: true; reminders: boolean }>('reminders', { on }),
  deleteCode: () => call<{ ok: true }>('delete-code', {}),
  deleteAccount: (code: string) => call<{ ok: true }>('delete-account', { code }),
  pushKey: () => call<{ key: string | null }>('push-key'),
  pushSubscribe: (sub: { endpoint: string; p256dh: string; auth: string; lang?: string }) =>
    call<{ ok: true; welcome?: boolean }>('push-subscribe', sub),
  locale: (lang: string) => call<{ ok: true }>('locale', { lang }),
  pushUnsubscribe: (endpoint: string) => call<{ ok: true }>('push-unsubscribe', { endpoint }),
  assistant: () => call<AssistantThread>('assistant'),
  assistantAsk: (question: string, images: string[], lang: string) =>
    call<{ answer: AssistantMessage | null }>('assistant-ask', { question, lang, ...(images.length ? { images } : {}) }),
  profile: () => call<MemberProfile>('profile'),
  profileNote: (note: string) => call<{ ok: true; note: string | null }>('profile-note', { note }),
  dossierSave: (dossier: Record<string, unknown>) =>
    call<{ ok: true; profile: Record<string, unknown>; updated_at: string | null }>('dossier-save', { dossier }),
  assistantHandoff: (questionId: string) => call<{ ok: true; id: string | null }>('assistant-handoff', { questionId }),
  news: (country: string | null, lang: string) => call<NewsFeed>('news', { country, lang }),
  newsReact: (item: string, helpful: boolean | null) =>
    call<{ mine: boolean | null; helpful: number }>('news-react', { item, helpful }),
  newsRead: (item: string) => call<{ ok: true }>('news-read', { item }),
  newsGuide: (country: string, lang: string) => call<{ country: string; links: GuideLink[] }>('news-guide', { country, lang }),
  fileUrl: (itemId: string) => `/api/portal/file?item=${encodeURIComponent(itemId)}`
};

/** Same rules as the server, for instant feedback. */
export const isEmail = (v: string) =>
  /^[A-Za-z0-9._%+-]{1,64}@([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(v.trim()) && !v.includes('..');
export const isCode = (v: string) => /^[0-9]{6}$/.test(v);
/** Keeps digits only (pasted "123 456" or "123-456" works). */
export const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

export function formatMoney(amount: number, currency: string, lang: string) {
  const value = amount / 100;
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(iso: string | null, lang: string, withTime = false) {
  if (!iso) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'long',
    ...(withTime ? { timeStyle: 'short' } : {}),
    ...(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? { timeZone: 'UTC' } : {})
  }).format(d);
}

export function formatSize(bytes: number | null, lang: string) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  const nf = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 });
  return mb >= 1 ? `${nf.format(mb)} MB` : `${nf.format(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

/** Whole days left before a date (0 on the last day). */
export function daysLeft(iso: string | null, now = Date.now()) {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - now;
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
}

/** "+1 720…" → "tel:+1720…"; WhatsApp wants digits only. */
export const telHref = (v: string) => `tel:${v.replace(/[^\d+]/g, '')}`;
export const whatsappHref = (v: string) => `https://wa.me/${v.replace(/\D/g, '')}`;

export function unreadCount(home: PortalHome) {
  return home.items.filter((i) => !i.read).length + home.messages.filter((m) => !m.read).length;
}
