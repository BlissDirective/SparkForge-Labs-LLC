// ════════════════════════════════════════════════════
// STRIPE WEBHOOK — Handle subscription lifecycle events
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Logs events to subscription_events table
// v2: Uses createAdminClient for webhook (no user auth)
// v3 (Gap 1): Persists stripe_subscription_id for programmatic control
// v3 (Gap 2): Persists trial_ends_at + subscription_period_end
// PAY-CRIT-001 (6B): Idempotency guard via subscription_events.processed
//   flag. Replayed events short-circuit before re-running business logic.
//   Requires migration sql/008_subscription_events_processed.sql.
// DB-CRIT-001 (4C): Sensitive Stripe payload lives in
//   subscription_events_detail (admin-only). Metadata-only data in
//   subscription_events is parent-readable.
//   Requires migration sql/009_subscription_events_split.sql.
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe, getCustomerId } from '@/lib/stripe';
import { logSubscriptionEvent } from '@/lib/subscription-events';
import { checkRateLimit, RATE_LIMITS, rateLimitKey } from '@/lib/rate-limit';
import type { SubscriptionTier } from '@/lib/tier-config';

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs';

// Convert Stripe's unix-seconds timestamp to ISO 8601 string (or null)
function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

// Stripe API 2026-02-25+: current_period_end moved from Subscription
// to SubscriptionItem. Read it from the first item (all items on a
// single subscription share the same period window).
function getPeriodEnd(sub: Stripe.Subscription): number | null | undefined {
  return sub.items.data[0]?.current_period_end;
}

// Map Stripe statuses to application statuses (S8-WARN-002 fix)
const STRIPE_STATUS_MAP: Record<string, string> = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'canceled',
  canceled: 'canceled',
  incomplete: 'active',
  incomplete_expired: 'canceled',
  paused: 'paused',
};

// Map a Stripe Price ID back to the app's tier slug by comparing against env.
function tierFromPriceId(priceId: string | null | undefined): SubscriptionTier | null {
  if (!priceId) return null;
  if (
    priceId === process.env.STRIPE_PLUS_MONTHLY_ID ||
    priceId === process.env.STRIPE_PLUS_YEARLY_ID
  ) {
    return 'plus';
  }
  if (
    priceId === process.env.STRIPE_FORGE_MONTHLY_ID ||
    priceId === process.env.STRIPE_FORGE_YEARLY_ID
  ) {
    return 'forge';
  }
  return null;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    );
  }

  // PAY-MED-001 (B): Global 100/min throttle before signature
  // verification. Stripe's legitimate delivery rate is well under this
  // threshold; exceeding it almost certainly means a leaked webhook
  // secret is being abused to flood the CPU-intensive constructEvent
  // call. Single global key (no per-IP partition) so an attacker
  // can't bypass by rotating sources.
  const rlResult = await checkRateLimit(
    rateLimitKey('stripe-webhook', 'global'),
    RATE_LIMITS.stripeWebhook,
  );
  if (!rlResult.allowed) {
    const msg = `[stripe-webhook] rate limit hit — ${RATE_LIMITS.stripeWebhook.maxRequests} req/min exceeded; retry after ${rlResult.retryAfterSeconds}s`;
    console.warn(msg);
    Sentry.captureMessage(msg, { level: 'warning' });
    return NextResponse.json(
      { error: 'Too many webhook events' },
      {
        status: 429,
        headers: { 'Retry-After': String(rlResult.retryAfterSeconds) },
      },
    );
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      {
        error:
          'Webhook secret not configured. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook',
      },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    // PAY-HIGH-001 (B): Explicit 60s replay-tolerance window.
    // Stripe defaults to 5 minutes, which combined with the
    // `processed` idempotency column still leaves a 5-minute window
    // where a captured payload could be resubmitted before the DB
    // short-circuit fires. 60s matches Stripe's recommendation for
    // high-security webhooks and is well within the handful of
    // seconds that legitimate Stripe retries take.
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
      60,
    );
  } catch (err: unknown) {
    // API-MED-002 (B): log full signature-verification error
    // server-side, but DO NOT leak it in the 400 body — Stripe
    // diagnostics can reveal timing / secret-comparison internals.
    console.error('[stripe-webhook] signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // DB-CRIT-001 (4C): Dual-write metadata + detail via centralized helper.
  // Metadata in subscription_events (parent-readable via RLS), raw payload
  // in subscription_events_detail (admin-only).
  await logSubscriptionEvent(supabase, {
    stripeEventId: event.id,
    eventType: event.type,
    parentId: null, // filled below if identifiable
    data: event.data.object as unknown as Record<string, unknown>,
  });

  // PAY-CRIT-001 (6B): Idempotency guard. Stripe delivers webhooks at
  // least once. Without this check, a replayed `checkout.session.completed`
  // could re-upgrade a parent who has since downgraded. Stripe expects
  // 2xx for replays — return 200 instead of erroring.
  const { data: existingEvent } = await supabase
    .from('subscription_events')
    .select('processed')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent?.processed === true) {
    return NextResponse.json({ received: true, replay: true, skipped: true });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const supabaseId = session.metadata?.supabase_id;
      const tier = session.metadata?.tier ?? 'plus';

      if (supabaseId) {
        // v3 Gap 1: Retrieve the full subscription to capture ID + trial info
        let stripeSubscriptionId: string | null = null;
        let trialEndsAt: string | null = null;
        let periodEnd: string | null = null;

        if (session.subscription) {
          stripeSubscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;

          try {
            const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            trialEndsAt = toIso(sub.trial_end);
            periodEnd = toIso(getPeriodEnd(sub));
          } catch (err) {
            console.error('[webhook] Failed to retrieve subscription:', err);
          }
        }

        // PAY-HIGH-002 (B): defensive customer-id resolution. Falls
        // back to the existing value on the parents row if the webhook
        // payload somehow lacks a resolvable customer (deleted /
        // expanded-but-null / string edge cases).
        const resolvedCustomerId = getCustomerId(session.customer);
        if (!resolvedCustomerId) {
          console.warn(
            '[webhook] checkout.session.completed missing customer id; event=%s',
            event.id,
          );
        }

        const checkoutUpdate: Record<string, unknown> = {
          subscription_tier: tier,
          subscription_status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
          trial_ends_at: trialEndsAt,
          subscription_period_end: periodEnd,
        };
        if (resolvedCustomerId) {
          checkoutUpdate.stripe_customer_id = resolvedCustomerId;
        }

        await supabase
          .from('parents')
          .update(checkoutUpdate)
          .eq('id', supabaseId);

        // Update event with parent_id for audit trail
        await supabase
          .from('subscription_events')
          .update({ parent_id: supabaseId })
          .eq('stripe_event_id', event.id);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      // PAY-HIGH-002 (B): skip if customer can't be resolved rather
      // than issuing an UPDATE against `'[object Object]'`.
      const customerId = getCustomerId(sub.customer);
      if (!customerId) {
        console.warn(
          '[webhook] %s missing customer id; event=%s',
          event.type,
          event.id,
        );
        break;
      }
      const status = STRIPE_STATUS_MAP[sub.status] ?? 'active';

      // v3 Gap 1+2: persist subscription ID, trial end, period end, and
      // derive tier from the price if metadata drifted.
      const priceId = sub.items.data[0]?.price.id;
      const derivedTier = tierFromPriceId(priceId);

      const updates: Record<string, unknown> = {
        subscription_status: status,
        stripe_subscription_id: sub.id,
        trial_ends_at: toIso(sub.trial_end),
        subscription_period_end: toIso(getPeriodEnd(sub)),
      };

      // Only overwrite tier if we can derive it from the active price.
      // (Avoids clobbering on transient events that don't change the plan.)
      if (derivedTier) {
        updates.subscription_tier = derivedTier;
      }

      await supabase
        .from('parents')
        .update(updates)
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      // PAY-HIGH-002 (B): guard the customer-id lookup.
      const deletedCustomerId = getCustomerId(sub.customer);
      if (!deletedCustomerId) {
        console.warn(
          '[webhook] customer.subscription.deleted missing customer id; event=%s',
          event.id,
        );
        break;
      }
      // v3 Gap 1: Clear stripe_subscription_id so a re-subscribe creates a
      // fresh row without tripping the UNIQUE constraint.
      await supabase
        .from('parents')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          trial_ends_at: null,
          subscription_period_end: null,
        })
        .eq('stripe_customer_id', deletedCustomerId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // PAY-HIGH-002 (B): guard the customer-id lookup.
      const invoiceCustomerId = getCustomerId(invoice.customer);
      if (!invoiceCustomerId) {
        console.warn(
          '[webhook] invoice.payment_failed missing customer id; event=%s',
          event.id,
        );
        break;
      }
      await supabase
        .from('parents')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoiceCustomerId);
      break;
    }
  }

  // PAY-CRIT-001 (6B): Mark processed AFTER business logic completes.
  // If any handler throws above, this UPDATE is skipped and the event
  // remains processable on the next delivery attempt. Unknown event types
  // are also marked processed to prevent indefinite Stripe retries on
  // events we have no handler for.
  await supabase
    .from('subscription_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id);

  return NextResponse.json({ received: true });
}
