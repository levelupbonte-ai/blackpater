import { createWebhookHandler } from '../_lib/webhook.js';

// The Stripe signature is computed over the exact raw body: the handler reads
// the request stream itself and never uses a parsed body.
export const config = { api: { bodyParser: false } };

export default createWebhookHandler();
