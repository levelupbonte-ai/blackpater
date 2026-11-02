import { createCheckoutHandler } from './checkout.js';
import { createSessionStatusHandler } from './session-status.js';
import { createWebhookHandler } from './webhook.js';
import { createConfigHandler } from './config.js';
import { PORTAL_ACTIONS, createPortalHandler } from './portal/handler.js';

/**
 * API routes for the local servers (Express in server.js, Vite dev server).
 * On Vercel each file in api/stripe/ is its own function with the same code, and
 * api/portal/[action].js serves every /api/portal/<action>.
 */
export function createApiRoutes() {
  const portal = createPortalHandler();
  return {
    ...Object.fromEntries(PORTAL_ACTIONS.map((a) => [`/api/portal/${a}`, portal])),
    '/api/stripe/config': createConfigHandler(),
    '/api/stripe/create-checkout-session': createCheckoutHandler(),
    '/api/stripe/session-status': createSessionStatusHandler(),
    '/api/stripe/webhook': createWebhookHandler()
  };
}
