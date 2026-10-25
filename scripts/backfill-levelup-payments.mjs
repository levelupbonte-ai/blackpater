#!/usr/bin/env node
/**
 * One-off backfill: sends past Stripe Checkout Sessions of this site to the
 * owner's LevelUp dashboard, with exactly the same contract as the webhook
 * (api/_lib/levelup.js). Safe to run more than once: LevelUp de-duplicates on
 * provider_event_id, and the ids used here are stable between runs.
 *
 *   STRIPE_SECRET_KEY=sk_live_… LEVELUP_SITE_KEY=… \
 *     node scripts/backfill-levelup-payments.mjs --since 2026-01-01 [--until 2026-10-31] [--dry-run]
 *
 * - Only sessions of the catalog offers (shared/offers.js) are sent; open
 *   sessions are skipped (nothing to record yet).
 * - Event ids: the real Stripe event id when Stripe still has the event (it
 *   keeps 30 days of events), otherwise a stable `evt_backfill_<session>_<status>`.
 * - Refunded payments are sent as `paid` and then `refunded`.
 * - Output lists session ids, statuses and amounts only (no names, no emails).
 */
import Stripe from 'stripe';
import { pathToFileURL } from 'node:url';
import { buildPaymentEvent, createLevelUpForwarder, getLevelUpConfig, paymentStatusFor } from '../api/_lib/levelup.js';
import { readEnv } from '../api/_lib/stripe.js';
import { getOffer } from '../shared/offers.js';

function parseArgs(argv) {
  const args = { dryRun: false, since: '', until: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--since') args.since = argv[++i] || '';
    else if (a === '--until') args.until = argv[++i] || '';
    else if (a.startsWith('--since=')) args.since = a.slice(8);
    else if (a.startsWith('--until=')) args.until = a.slice(8);
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

function toUnix(date, name) {
  if (!date) return null;
  const ms = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date);
  if (!Number.isFinite(ms)) throw new Error(`${name} must be a date like 2026-01-31`);
  return Math.floor(ms / 1000);
}

const CHECKOUT_TYPES = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired'
];

/** Real event ids still available in Stripe (last 30 days), keyed by session/status or payment intent. */
async function indexEvents(stripe, created) {
  const bySessionStatus = new Map();
  const refundsByPaymentIntent = new Map();
  for await (const ev of stripe.events.list({ types: CHECKOUT_TYPES, created, limit: 100 })) {
    const s = ev.data.object;
    const status = paymentStatusFor(ev.type, s);
    const key = `${s.id}:${status}`;
    // Keep the earliest event for each session + status.
    const prev = bySessionStatus.get(key);
    if (!prev || ev.created < prev.created) bySessionStatus.set(key, { id: ev.id, created: ev.created });
  }
  for await (const ev of stripe.events.list({ type: 'charge.refunded', created, limit: 100 })) {
    const pi = typeof ev.data.object.payment_intent === 'string' ? ev.data.object.payment_intent : ev.data.object.payment_intent?.id;
    if (!pi) continue;
    const prev = refundsByPaymentIntent.get(pi);
    // Keep the latest refund event (the final refunded state).
    if (!prev || ev.created > prev.created) refundsByPaymentIntent.set(pi, { id: ev.id, created: ev.created, charge: ev.data.object });
  }
  return { bySessionStatus, refundsByPaymentIntent };
}

/** Lists the records to send (no network call to LevelUp). */
export async function collectRecords(stripe, created) {
  const { bySessionStatus, refundsByPaymentIntent } = await indexEvents(stripe, created).catch((err) => {
    console.warn(`Could not list Stripe events (${err?.type || err?.name}); using stable backfill ids only.`);
    return { bySessionStatus: new Map(), refundsByPaymentIntent: new Map() };
  });

  const records = [];
  for await (const session of stripe.checkout.sessions.list({ created, limit: 100 })) {
    if (!getOffer(session.metadata?.offer_id)) continue;
    const status = paymentStatusFor(undefined, session);
    if (!status) continue;
    const known = bySessionStatus.get(`${session.id}:${status}`);
    const occurred = known?.created || (status === 'expired' ? session.expires_at : session.created);
    records.push({ session, status, eventId: known?.id || `evt_backfill_${session.id}_${status}`, eventCreated: occurred });

    if (status === 'paid' && session.payment_intent) {
      const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
      let refund = refundsByPaymentIntent.get(pi);
      if (!refund) {
        const intent = await stripe.paymentIntents.retrieve(pi, { expand: ['latest_charge'] });
        const charge = intent.latest_charge && typeof intent.latest_charge === 'object' ? intent.latest_charge : null;
        if (charge && charge.amount_refunded > 0) {
          const last = (await stripe.refunds.list({ payment_intent: pi, limit: 1 })).data[0];
          refund = { id: `evt_backfill_${session.id}_refunded`, created: last?.created || charge.created, charge };
        }
      }
      if (refund) {
        records.push({
          session,
          status: 'refunded',
          eventId: refund.id,
          eventCreated: refund.created,
          extraMetadata: { amount_refunded: refund.charge.amount_refunded ?? null, refund: refund.charge.refunded ? 'full' : 'partial' }
        });
      }
    }
  }
  return records.map((r) =>
    buildPaymentEvent({
      eventId: r.eventId,
      eventCreated: r.eventCreated,
      session: r.session,
      status: r.status,
      extraMetadata: { livemode: Boolean(r.session.livemode), backfill: true, ...r.extraMetadata }
    })
  ).filter(Boolean);
}

/** Sends the records; returns counts. Prints ids, statuses and amounts only. */
export async function sendRecords(pEvents, { forward, dryRun = false, out = console } = {}) {
  const counts = {};
  let sent = 0;
  let failed = 0;
  for (const pEvent of pEvents) {
    counts[pEvent.status] = (counts[pEvent.status] || 0) + 1;
    const line = `${pEvent.occurred_at}  ${pEvent.provider_session_id}  ${pEvent.status.padEnd(8)}  ${pEvent.amount} ${pEvent.currency}  ${pEvent.offer_id}`;
    if (dryRun) {
      out.log(`[dry-run] ${line}`);
      continue;
    }
    const result = await forward(pEvent);
    if (result.ok) {
      sent += 1;
      out.log(`sent     ${line}`);
    } else {
      failed += 1;
      out.log(`FAILED   ${line}  (${result.reason}${result.status ? ` ${result.status}` : ''})`);
    }
  }
  return { counts, sent, failed };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.since) {
    console.log('Usage: STRIPE_SECRET_KEY=… LEVELUP_SITE_KEY=… node scripts/backfill-levelup-payments.mjs --since YYYY-MM-DD [--until YYYY-MM-DD] [--dry-run]');
    process.exit(args.help ? 0 : 1);
  }
  const stripeKey = readEnv('STRIPE_SECRET_KEY');
  if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');
  if (!args.dryRun && !getLevelUpConfig().siteKey) throw new Error('LEVELUP_SITE_KEY is not set (use --dry-run to only list)');

  const created = { gte: toUnix(args.since, '--since') };
  const until = toUnix(args.until, '--until');
  if (until) created.lte = until;

  const stripe = new Stripe(stripeKey, { maxNetworkRetries: 2, timeout: 20000, appInfo: { name: 'blackpater.com backfill' } });
  const pEvents = await collectRecords(stripe, created);
  const { counts, sent, failed } = await sendRecords(pEvents, { forward: createLevelUpForwarder(), dryRun: args.dryRun });
  console.log(`\n${pEvents.length} record(s): ${JSON.stringify(counts)}${args.dryRun ? ' — dry run, nothing sent' : ` — sent ${sent}, failed ${failed}`}`);
  if (failed) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`Backfill stopped: ${err?.message || err}`);
    process.exit(1);
  });
}
