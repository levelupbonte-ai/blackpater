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
shared/offers.js       Offer catalog — the only place where prices live
shared/routes.js       Routes, page titles/descriptions, legacy 301 redirects
src/app/               App shell + small client router
src/layout/            Navigation, footer, LevelUp credit (shared by every page)
src/styles/            Design tokens, base styles, shared components
src/components/        Shared UI (page header, FAQ, article card, trust row, icons)
src/pages/<page>/      One folder per page, with its own components and CSS
src/i18n/*.ts          All strings, French + English (tests check both exist)
src/lib/               Checkout client (duplicate-safe), contact details
public/js/levelup*.js  LevelUp runtime (unchanged)
```

| URL | Page |
| --- | --- |
| `/` | Home |
| `/articles` | Press & articles |
| `/abonnements` | Offers |
| `/abonnements/accompagnement-voyage` | Product page — the only place with a pay button |
| `/paiement/confirmation?session_id=…` | Verified confirmation (noindex) |
| `/paiement/annule` | Cancelled (noindex) |
| `/legal/conditions-de-vente`, `/legal/remboursement`, `/legal/confidentialite` | Legal |

Old URLs (`/abonnements.html`, `/articles.html`, `/index.html`, `/biographie`, `/medias`,
`/contact`, …) answer **301** to their new address (`vercel.json`, generated from
`shared/routes.js`; a test checks they stay in sync). Old Stripe return links
`/abonnements?payment=…` are forwarded to the new payment pages.

## Payment flow

1. The visitor clicks **Payer 1 $** on the product page. The button locks immediately
   (“Redirection vers le paiement sécurisé…”), further taps are ignored.
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

If `STRIPE_SECRET_KEY` is missing, the product page shows a neutral “Paiement
momentanément indisponible” state (nothing else is shown to visitors). Stripe error
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

## What the owner must do

### 1. Vercel environment variables (Project → Settings → Environment Variables)

| Name | Status | Where to find it | Mark as |
| --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | already set (Production) | Stripe Dashboard → Developers → API keys → *Secret key* (`sk_live_…`; `sk_test_…` in test mode) | Sensitive |
| `STRIPE_WEBHOOK_SECRET` | **new** | Stripe Dashboard → Developers → Webhooks → your endpoint → *Signing secret* (`whsec_…`) | Sensitive |

`STRIPE_PUBLISHABLE_KEY` is already set but **no longer used** (the site redirects to
Stripe Checkout, it needs no browser key); it can stay or be deleted.
After adding or changing a variable, **redeploy** production.

To try payments on a Preview deployment, add `sk_test_…` / test `whsec_…` values with
the *Preview* environment only (today the keys exist for Production only, so previews
show the “temporarily unavailable” state — that is expected).

### 2. Stripe webhook (Dashboard → Developers → Webhooks → Add endpoint)

- **Endpoint URL**: `https://blackpater.com/api/stripe/webhook`
- **Events**: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`
- Copy the *Signing secret* into `STRIPE_WEBHOOK_SECRET` (Sensitive), redeploy.
- Do it once in **live** mode (and once in test mode if you test with test keys — each
  mode has its own secret). Without the secret the endpoint answers 503 and payments
  still work; only the webhook log is skipped.

### 3. Stripe settings worth checking

- Settings → Customer emails → **Successful payments: on** (the site tells customers
  Stripe emails a receipt).
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
  LevelUp Ecosystem; adjust if that changes.
- Social follower counts and fictional phone-mockup statistics were removed; add real,
  dated figures only if you want them back.
