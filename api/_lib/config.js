import { LAUNCH_ENDS_AT, OFFERS, priceFor } from '../../shared/offers.js';
import { getStripe } from './stripe.js';
import { methodNotAllowed, sendJson } from './http.js';

/**
 * GET /api/stripe/config — lets the offer page show a neutral "payments
 * temporarily unavailable" state before the visitor clicks. No keys exposed.
 */
export function createConfigHandler(deps = {}) {
  const stripeFor = deps.getStripe || getStripe;
  return function handler(req, res) {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
    const offers = Object.fromEntries(
      Object.values(OFFERS).map((o) => {
        const p = priceFor(o);
        return [o.id, { amount: p.amount, regular: p.regular, launch: p.launch, currency: o.currency }];
      })
    );
    sendJson(res, 200, { available: Boolean(stripeFor()), offers, launchEndsAt: LAUNCH_ENDS_AT });
  };
}
