// ════════════════════════════════════════════════════
// STRIPE WEBHOOK — Handle subscription lifecycle events
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Logs events to subscription_events table
// v2: Uses createAdminClient for webhook (no user auth)
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
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
      data: event.data.object as Record<string, unknown>,
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
        await supabase
          .from('parents')
          .update({
            subscription_tier: tier,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
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

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status =
        sub.status === 'active'
          ? 'active'
          : sub.status === 'past_due'
            ? 'past_due'
            : sub.status;

      await supabase
        .from('parents')
        .update({ subscription_status: status })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('parents')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
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
