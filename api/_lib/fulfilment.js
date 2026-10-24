/**
 * Fulfilment hooks, called by the webhook once per paid Checkout Session.
 *
 * Today the onboarding happens on WhatsApp (the confirmation page invites the
 * customer to write with their order reference), so these hooks only log a
 * minimal, non-personal trace visible in Vercel → Logs.
 *
 * To automate fulfilment later (email, CRM, access to resources), do it here.
 * Keep it idempotent: the same session can be delivered more than once by
 * Stripe (retries) and the in-memory de-duplication does not survive cold
 * starts — key any durable action on `session.id`.
 */
export async function onCheckoutPaid(session, event, log = console) {
  log.info(
    JSON.stringify({
      evt: 'checkout.paid',
      eventId: event.id,
      session: session.id,
      offer: session.metadata?.offer_id || null,
      amount: session.amount_total,
      currency: session.currency,
      livemode: Boolean(session.livemode)
    })
  );
}

export async function onCheckoutPending(session, event, log = console) {
  log.info(JSON.stringify({ evt: 'checkout.awaiting_payment', eventId: event.id, session: session.id }));
}

export async function onCheckoutPaymentFailed(session, event, log = console) {
  log.warn(JSON.stringify({ evt: 'checkout.payment_failed', eventId: event.id, session: session.id }));
}

export async function onCheckoutExpired(session, event, log = console) {
  log.info(JSON.stringify({ evt: 'checkout.expired', eventId: event.id, session: session.id }));
}

export async function onCheckoutRefunded(session, event, log = console) {
  log.info(JSON.stringify({ evt: 'checkout.refunded', eventId: event.id, session: session.id }));
}
