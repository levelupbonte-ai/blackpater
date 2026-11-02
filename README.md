# blackpater.com

Official website of Black Pater — Jean-Pierre Lofumbwa, « Le Prof ». Bilingual (FR / EN),
React + Vite static site, payment by **Stripe Checkout only**, deployed on Vercel.

## Run it

```bash
npm install          # Vercel uses bun.lock; npm works locally too
npm run dev          # http://localhost:3000 — site + API (reads STRIPE_* from .env)
npm test             # node:test suite (payments, webhook, routes, i18n)
npm run lint         # syntax check of server.js + TypeScript check
npm run build        # dist/ : one HTML file per route + 404.html + sitemap.xml
npm start            # Express server for dist/ + API (self-hosting / local prod check)
```

Copy `.env.example` to `.env` for local payments with **test** keys. Never commit keys.

## Structure

```
api/stripe/*.js        Vercel Functions (thin entry points)
api/_lib/              Payment logic shared by Vercel, server.js and `vite dev`
api/_lib/levelup.js    Payment records sent to the owner's LevelUp dashboard
scripts/backfill-levelup-payments.mjs  One-off: past Stripe payments → LevelUp dashboard
shared/offers.js       Offer catalog — the only place where prices live
shared/routes.js       Routes, page titles/descriptions, legacy 301 redirects
shared/validation.js   Input rules shared by the browser and the API
shared/security-headers.js  CSP and security headers (copied into vercel.json)
src/app/               App shell + small client router
src/layout/            Navigation, footer, LevelUp credit (shared by every page)
src/styles/            Design tokens, base styles, shared components
src/components/        Shared UI (page header, FAQ, article card, trust row, icons)
src/pages/<page>/      One folder per page, with its own components and CSS
src/i18n/*.ts          All strings, French + English (tests check both exist)
src/lib/               Checkout client (duplicate-safe), contact details
public/js/levelup*.js  LevelUp runtime: dashboard media / texts, credit, cookie-free page views
public/payment/        Accepted-payment marks (Simple Icons, CC0 — see NOTICE.txt)
```

| URL | Page |
| --- | --- |
| `/` | Home |
| `/articles` | Press & articles |
| `/abonnements` | Offers |
| `/abonnements/accompagnement-voyage` | Product page — the only place with a pay button |
| `/paiement/confirmation?session_id=…` | Verified confirmation (noindex) |
| `/paiement/annule` | Cancelled (noindex) |
| `/espace-client` (`/client`, `/my-space` → 301) | Client space: sign-in, booking, updates, trip, documents, checklist, messages, account (noindex) |
| `/legal/conditions-de-vente`, `/legal/remboursement`, `/legal/confidentialite` | Legal |

Old URLs (`/abonnements.html`, `/articles.html`, `/index.html`, `/biographie`, `/medias`,
`/contact`, …) answer **301** to their new address (`vercel.json`, generated from
`shared/routes.js`; a test checks they stay in sync). Old Stripe return links
`/abonnements?payment=…` are forwarded to the new payment pages.

## Payment flow

1. The visitor clicks **Payer 1 $** on the product page. The button locks immediately
   (“Redirection…”), further taps are ignored.
2. The browser sends `{ offerId, attemptId, sessionId? }` to
   `POST /api/stripe/create-checkout-session`. **No price is sent**: the server reads the
   amount from `shared/offers.js`.
3. The server creates a Stripe Checkout Session (mode `payment`, payment methods chosen
   by Stripe from the Dashboard: cards, Apple Pay, Google Pay, Link…) and the browser is
   redirected to Stripe. Stripe collects the email (receipt) and card holder name.
4. Stripe sends the customer back to `/paiement/confirmation?session_id=…`. That page
   **never trusts the URL**: it calls `GET /api/stripe/session-status`, which retrieves
   the session from Stripe and answers `paid`, `processing`, `open` or `expired` (no
   personal data). “Adhésion confirmée” is shown only for `paid`; `processing` is
   polled for ~30 s. The next step is a pre-filled WhatsApp message with the order
   reference (onboarding — WhatsApp is never a payment channel).
5. Stripe also calls `POST /api/stripe/webhook` (signature verified). The paid session
   is logged (`checkout.paid` in Vercel → Logs); `api/_lib/fulfilment.js` is the place
   to add automatic fulfilment later.
6. The webhook then sends the payment record to the owner's **LevelUp dashboard**
   (see *Payments in the LevelUp dashboard* below).

If `STRIPE_SECRET_KEY` is missing, the pay button is simply disabled and reads
“Bientôt disponible” / “Coming soon” (nothing else is shown to visitors). Stripe error
messages are never sent to the browser; logs contain no keys and no personal data.

### Payment safety (slow networks, impatient taps)

- **One attempt id per purchase** (`crypto.randomUUID()`, kept in `sessionStorage` per
  offer). Every tap and every retry reuses it. It is sent to Stripe as
  `client_reference_id`.
- **Client lock**: while a request runs or the redirect is under way, more taps return
  the same promise. Requests time out after 15 s (AbortController); only then a calm
  “Réessayer” appears — with the same attempt id. Coming back with the browser’s Back
  button (back/forward cache) unlocks the button, again with the same attempt.
- **Server, layer 1**: an in-memory map attempt → session answers rapid repeats without
  calling Stripe.
- **Server, layer 2 (the guarantee)**: the session is created with a Stripe
  **idempotency key** built from offer + attempt + 20-min window + exact parameters, so
  any number of retries return *the same* Checkout Session. When the browser already has
  a session for this attempt, it is reused while open; if it is already paid the
  customer goes straight to the confirmation page instead of a new checkout.
- Sessions expire after 31–51 min (`expires_at`), so stale checkouts do not pile up.
- **Inside Stripe Checkout** the pay button is single-submit, and one Checkout Session
  can only ever be paid once.
- **Webhook**: each event id is processed once and each session is fulfilled once.
  *Limitation*: these de-duplication sets live in memory (no database on this site), so
  they reset on a cold start; Stripe may redeliver an event. Today fulfilment only logs,
  so a repeat is harmless. Any future durable action (email, CRM, access) must be keyed on
  `session.id` in a database (or a marker in the PaymentIntent metadata) to stay
  idempotent. Rate limits are also per warm instance.

### Payments in the LevelUp dashboard

`api/_lib/levelup.js` sends every outcome of a Checkout Session to the LevelUp
database (`POST https://rncuhmvykrmtxfzqpitc.supabase.co/rest/v1/rpc/site_ingest_payment`,
public publishable key in the headers, the per-site secret `LEVELUP_SITE_KEY` in the
body), so the owner sees each payment in his LevelUp dashboard:

| Stripe event | Dashboard status |
| --- | --- |
| `checkout.session.completed` | `paid` (or `pending` for delayed payment methods) |
| `checkout.session.async_payment_succeeded` | `paid` |
| `checkout.session.async_payment_failed` | `failed` |
| `checkout.session.expired` | `expired` |
| `charge.refunded` | `refunded` (the session is found from the payment intent) |

Each record holds: Stripe event / session / payment-intent ids, status, amount (cents),
currency, offer id and name (from `shared/offers.js`), customer name and email (from
Stripe Checkout), the event date and the attempt id. Only sessions of this site's offers
are sent.

- **Server only**, inside the webhook, after the local processing. Forwarding is best
  effort: 5 s timeout per try, one retry (network error, timeout, 429, 5xx), under 10 s
  in total. If it fails, Stripe still receives its 200 and a `levelup.forward_failed`
  warning (event id and HTTP status only) appears in Vercel → Logs.
- Without `LEVELUP_SITE_KEY` nothing is sent (one `levelup.forward_skipped` log line).
- Logs never contain keys, names or emails. LevelUp de-duplicates on the Stripe event id.

**Backfill past payments** (once, from your computer, after `npm install`):

```bash
STRIPE_SECRET_KEY=sk_live_… LEVELUP_SITE_KEY=… \
  node scripts/backfill-levelup-payments.mjs --since 2026-01-01 --dry-run   # list only
STRIPE_SECRET_KEY=sk_live_… LEVELUP_SITE_KEY=… \
  node scripts/backfill-levelup-payments.mjs --since 2026-01-01             # send
```

It lists the Checkout Sessions created since that date (`--until` optional), skips open
sessions and other products, adds a `refunded` record for refunded payments, and uses the
real Stripe event id when Stripe still has it (30 days) or a stable
`evt_backfill_<session>_<status>` id otherwise — running it twice is harmless.

### Input validation and security headers

- The site has no free-text form: the only things a visitor can send are the checkout
  request and the `session_id` in the confirmation URL. Both are checked with the same
  rules in the browser (before sending) and on the server (`shared/validation.js`).
- `create-checkout-session` accepts exactly `{ offerId, attemptId, sessionId? }`: a known
  offer id, a UUID and a Stripe session id. Any other key (a price, `__proto__`…), a wrong
  type, a body over 2 KB or a non-JSON content type is refused with a generic
  `invalid_request`; Stripe is never called.
- `session-status` accepts only `?session_id=cs_test_…|cs_live_…`, once; anything else is
  refused before Stripe is called.
- Redirects: the browser only follows `https://checkout.stripe.com/…` or
  `/paiement/confirmation?session_id=<valid id>`; the in-site router ignores anything that
  is not a plain `/path` (no `//host`, no `javascript:`). If a custom Checkout domain is
  ever set up in Stripe, add it to `STRIPE_CHECKOUT_ORIGINS`.
- No visitor or database text is inserted as HTML (React escapes it; the LevelUp runtime
  uses `textContent`). The only raw HTML is the fixed LevelUp credit.
- `shared/security-headers.js` sets the Content-Security-Policy (scripts from this site
  only; Google Fonts; https images/video from the LevelUp dashboard; the LevelUp
  database), HSTS, `nosniff`, framing protection and a Permissions-Policy. A test checks
  `vercel.json` carries the same headers. When adding a third-party script, font or API,
  add its origin there and in `vercel.json`.

## What the owner must do

### 1. Vercel environment variables (Project → Settings → Environment Variables)

| Name | Status | Where to find it | Mark as |
| --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | already set (Production) | Stripe Dashboard → Developers → API keys → *Secret key* (`sk_live_…`; `sk_test_…` in test mode) | Sensitive |
| `STRIPE_WEBHOOK_SECRET` | required for the webhook | Stripe Dashboard → Developers → Webhooks → your endpoint → *Signing secret* (`whsec_…`) | Sensitive |
| `LEVELUP_SITE_KEY` | **new** | LevelUp dashboard → this website → payments / site key | Sensitive |

`SUPABASE_PUBLISHABLE_KEY` is optional (the public LevelUp key is the default, in
`api/_lib/levelup.js`).

`STRIPE_PUBLISHABLE_KEY` is already set but **no longer used** (the site redirects to
Stripe Checkout, it needs no browser key); it can stay or be deleted.
After adding or changing a variable, **redeploy** production.

To try payments on a Preview deployment, add `sk_test_…` / test `whsec_…` values with
the *Preview* environment only (today the keys exist for Production only, so previews
show the “temporarily unavailable” state — that is expected).

### 2. Stripe webhook (Dashboard → Developers → Webhooks → Add endpoint)

- **Endpoint URL**: `https://blackpater.com/api/stripe/webhook`
- **Events**: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`
  (if the endpoint already exists: *Update details* → add the last two events)
- Copy the *Signing secret* into `STRIPE_WEBHOOK_SECRET` (Sensitive), redeploy.
- Do it once in **live** mode (and once in test mode if you test with test keys — each
  mode has its own secret). Without the secret the endpoint answers 503 and payments
  still work; only the webhook log is skipped.

### 3. Stripe settings worth checking

- Settings → Customer emails → **Successful payments: on** (the site tells customers
  a receipt is emailed).
- Settings → Payment methods: keep cards, Apple Pay, Google Pay (Link optional).
- Settings → Business → Public details: business name, support email
  (lofumbwapater@gmail.com), and the URLs of the terms
  (`https://blackpater.com/legal/conditions-de-vente`) and privacy
  (`https://blackpater.com/legal/confidentialite`) pages; Branding: logo and colours.

### 4. Content to confirm (not shown as “to confirm” on the site)

- **Refund policy**: the 14-day full refund window when the guidance has not started is a
  proposal — confirm or change it in `src/pages/legal/RefundPage.tsx` and in the FAQ
  (`offer_faq_6_a` in `src/i18n/offer.ts`).
- **What is included**: the six inclusions come from the site’s original offer card;
  confirm them (and add any duration or response-time commitment you want to make).
  The earlier “private members group”, “guides delivered by email”, “$15 regular
  price” and countdown were removed because they could not be verified.
- **Legal identity**: the pages name Jean-Pierre Lofumbwa (« Black Pater »), Salt Lake
  City, Utah, the email and WhatsApp number. If payments are made through a registered
  business, add its legal name/address to the terms and to Stripe.
- **Privacy**: providers listed are Stripe, Vercel, WhatsApp/Meta, Google Fonts and
  LevelUp Ecosystem (site content and the payments dashboard: name, email, amount,
  offer); adjust if that changes.
- Social follower counts and fictional phone-mockup statistics were removed; add real,
  dated figures only if you want them back.

## Client space (`/espace-client`)

After paying, a customer has a private space on this site. It is served by
`api/portal/[action].js` (one function, `api/_lib/portal/`) and the LevelUp
database functions `portal_*` (see the LevelUp dashboard repo,
`supabase/migrations/20261101120000_client_portal.sql`).

- **Who gets access.** A paid payment recorded in LevelUp (the webhook already
  forwards it) creates the customer and queues an invitation e-mail; the owner can
  also invite someone from the LevelUp dashboard (*Client portal*). Anyone else who
  asks for a code sees the same message: “If you have a booking, check your email.”
- **Sign-in.** A 6-digit code sent by e-mail: 10 minutes, works once, replaced by a
  newer code, 5 wrong tries at most, rate-limited per address, per IP and per site
  (database) plus a per-IP limiter here. Optional password (Account page): at least
  10 characters, refused if common, personal or found in known breaches (Have I Been
  Pwned range API, only 5 characters of a SHA-1 leave the server), bcrypt cost 12 in
  the database; creating or changing it needs a fresh e-mailed code; “Forgot password”
  is simply the code sign-in. Changing the e-mail needs a code sent to the old **and**
  the new address. Same neutral error for an unknown e-mail and a wrong password.
- **Sessions.** A random token in an `HttpOnly; Secure; SameSite=Strict` cookie
  (`__Host-bp_portal`), stored as SHA-256 only, 7 days, never readable by page
  scripts. “Sign out of all devices” revokes every session. Each new sign-in e-mails
  the customer (browser and OS, minute, UTC).
- **E-mails** are sent from this server with **Black Pater's own Resend key**
  (never LevelUp's): codes right away; access, new update, new message and sign-in
  alerts from the LevelUp queue, drained after each sign-in and paid webhook, when
  the dashboard signs a “send now” call (`PORTAL_NOTIFY_SECRET`) and once a day by
  Vercel Cron (`/api/portal/outbox`, `CRON_SECRET`). Without the keys the space fails
  closed (`503`, “opens very soon”) and the log says which variable is missing.
- **Documents** are streamed by this server after a 60-second ticket (no storage link
  ever reaches the browser). Receipts are looked up live from the payment provider.

### Owner setup for the client space

1. **Resend** (resend.com, Black Pater's own account): *Domains → Add domain* →
   `blackpater.com` (or a subdomain such as `mail.blackpater.com`), add the DNS
   records it shows (SPF `TXT`, DKIM `TXT`/`CNAME`, optional DMARC `TXT
   _dmarc v=DMARC1; p=none;`) at the domain's DNS host, wait for *Verified*, then
   *API Keys → Create* with **Sending access** only, restricted to that domain.
2. **LevelUp dashboard** → Developers → Server keys → *Create*: name “Client portal”,
   **Live**, scope **Client portal** only (shown once).
3. **Vercel → blackpater → Settings → Environment Variables** (Production, all
   **Sensitive**), then redeploy:

| Name | Value |
| --- | --- |
| `LEVELUP_PORTAL_KEY` | the `lu_live_…` key from step 2 |
| `BLACKPATER_RESEND_API_KEY` | the `re_…` key from step 1 |
| `BLACKPATER_EMAIL_FROM` | e.g. `Black Pater <espace@blackpater.com>` (verified domain) |
| `BLACKPATER_EMAIL_REPLY_TO` | optional, default `lofumbwapater@gmail.com` |
| `PORTAL_NOTIFY_SECRET` | optional: `openssl rand -hex 32`; the same value in the LevelUp dashboard's Vercel project |
| `CRON_SECRET` | optional but recommended: `openssl rand -hex 32` (Vercel sends it to the daily cron) |

## Search engines

Every public page is prerendered at build time (`src/entry-server.tsx`, English,
light theme) into its own HTML file with its title, description, canonical URL and
the JSON-LD built from the offer catalog (`shared/structured-data.js`:
`ProfessionalService` — the site says it is not a travel agency — with the three
real prices). The browser hydrates that HTML. `robots.txt` allows everything but
`/api/`; `sitemap.xml` lists the indexable pages. After deploying, add the site in
Google Search Console (domain property `blackpater.com`) and submit
`https://blackpater.com/sitemap.xml`.

## Copy principles

Less is more: the product page shows the price, one pay button, the accepted payment
brands (Visa, Mastercard, American Express, Apple Pay, Google Pay) and the terms line —
no security or reassurance paragraphs. Stripe is named only on the legal pages, where
the privacy policy has to list it as payment processor.
