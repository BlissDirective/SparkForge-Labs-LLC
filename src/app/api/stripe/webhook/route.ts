// POST /api/stripe/webhook — Handle Stripe webhook events
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const tier = session.metadata?.tier as 'plus' | 'forge';

      if (userId && tier) {
        await supabase.from('parents').update({
          subscription_tier: tier, subscription_status: 'active',
          stripe_customer_id: session.customer as string,
        }).eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status === 'active' ? 'active'
        : sub.status === 'past_due' ? 'past_due' : 'canceled';

      await supabase.from('parents')
        .update({ subscription_status: status })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from('parents')
        .update({ subscription_tier: 'free', subscription_status: 'canceled' })
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase.from('parents')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
