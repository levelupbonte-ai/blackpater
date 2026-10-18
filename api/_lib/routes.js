import { createCheckoutHandler } from './checkout.js';
import { createSessionStatusHandler } from './session-status.js';
import { createWebhookHandler } from './webhook.js';
import { createConfigHandler } from './config.js';

/**
 * API routes for the local servers (Express in server.js, Vite dev server).
 * On Vercel each file in api/stripe/ is its own function with the same code.
 */
export function createApiRoutes() {
  return {
    '/api/stripe/config': createConfigHandler(),
    '/api/stripe/create-checkout-session': createCheckoutHandler(),
    '/api/stripe/session-status': createSessionStatusHandler(),
    '/api/stripe/webhook': createWebhookHandler()
  };
}
