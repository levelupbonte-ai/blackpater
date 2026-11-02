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
  document: { name: string | null; size: number | null; type: string | null } | null;
  read: boolean;
  checked: number[];
}

export interface PortalMessage {
  id: string;
  sender: 'customer' | 'owner';
  body: string;
  created_at: string;
  read: boolean;
}

export interface PortalHome {
  customer: { name: string | null; email: string; locale: 'en' | 'fr'; since: string; has_password: boolean; sessions: number };
  offers: string[];
  bookings: PortalBooking[];
  items: PortalItem[];
  messages: PortalMessage[];
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

export function unreadCount(home: PortalHome) {
  return home.items.filter((i) => !i.read).length + home.messages.filter((m) => !m.read).length;
}
