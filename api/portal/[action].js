import { createPortalHandler } from '../_lib/portal/handler.js';

// Every /api/portal/<action> route in one function (the handler reads the action).
// The outbox route verifies a signature over the raw body, so no body parser.
export const config = { api: { bodyParser: false } };

export default createPortalHandler();
