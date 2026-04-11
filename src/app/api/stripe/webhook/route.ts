// ════════════════════════════════════════════════════
// STRIPE WEBHOOK — Handle subscription lifecycle events
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Logs events to subscription_events table
// v2: Uses createAdminClient for webhook (no user auth)
// v3 (Gap 1): Persists stripe_subscription_id for programmatic control
// v3 (Gap 2): Persists trial_ends_at + subscription_period_end
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import type { SubscriptionTier } from '@/lib/tier-config';

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs';

// Convert Stripe's unix-seconds timestamp to ISO 8601 string (or null)
function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
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
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Log all events to subscription_events table (upsert to handle replays)
  await supabase.from('subscription_events').upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data.object as unknown as Record<string, unknown>,
      parent_id: null, // filled below if identifiable
    },
    { onConflict: 'stripe_event_id', ignoreDuplicates: true }
  );

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
            periodEnd = toIso(sub.current_period_end);
          } catch (err) {
            console.error('[webhook] Failed to retrieve subscription:', err);
          }
        }

        await supabase
          .from('parents')
          .update({
            subscription_tier: tier,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: stripeSubscriptionId,
            trial_ends_at: trialEndsAt,
            subscription_period_end: periodEnd,
          })
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
      const customerId = sub.customer as string;
      const status = STRIPE_STATUS_MAP[sub.status] ?? 'active';

      // v3 Gap 1+2: persist subscription ID, trial end, period end, and
      // derive tier from the price if metadata drifted.
      const priceId = sub.items.data[0]?.price.id;
      const derivedTier = tierFromPriceId(priceId);

      const updates: Record<string, unknown> = {
        subscription_status: status,
        stripe_subscription_id: sub.id,
        trial_ends_at: toIso(sub.trial_end),
        subscription_period_end: toIso(sub.current_period_end),
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
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from('parents')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
