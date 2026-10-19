/**
 * Security headers for every response, used by the local Express server and
 * copied into vercel.json (a test checks they stay identical).
 *
 * Content-Security-Policy, origin by origin:
 *  - scripts: this site only (the app bundle and /js/levelup*.js); the JSON-LD
 *    block in index.html is data, not a script, so it needs no exception;
 *  - styles: this site + Google Fonts CSS ('unsafe-inline' is needed for the
 *    style attributes React and the LevelUp runtime set);
 *  - fonts: Google Fonts files;
 *  - images / video: this site, data: URIs, and https media managed from the
 *    LevelUp dashboard (the runtime only accepts https URLs);
 *  - connections: this site's API and the LevelUp database (public content);
 *  - Stripe: payment is a full-page redirect to checkout.stripe.com, which a
 *    page CSP does not restrict; form-action allows it in case a form is used.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "connect-src 'self' https://rncuhmvykrmtxfzqpitc.supabase.co",
  "frame-src 'none'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests'
].join('; ');

export const SECURITY_HEADERS = Object.freeze([
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()'
  }
]);
