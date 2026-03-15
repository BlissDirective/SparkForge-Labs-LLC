// ════════════════════════════════════════════════════
// STRIPE CHECKOUT — Create subscription checkout session
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Uses createServerSupabase (BUG-8C fix)
// v2: apiVersion matches installed stripe@20.4.0
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { STRIPE_PRICES, type SubscriptionTier } from '@/lib/tier-config';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';

export const runtime = 'nodejs';

// v2 [ENH-8A]: Lazy Stripe init with graceful fallback
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-02-25.clover' });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your .env.local file.',
        setup_url: 'https://dashboard.stripe.com/apikeys',
      },
      { status: 503 }
    );
  }

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: { tier?: string; interval?: string };
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid request body', 400);
  }

  const tier = (body.tier ?? 'plus') as SubscriptionTier;
  const interval = (body.interval ?? 'month') as 'month' | 'year';

  if (tier === 'free') return apiError('Cannot checkout for free tier', 400);

  const priceId = STRIPE_PRICES[tier as keyof typeof STRIPE_PRICES]?.[interval];
  if (!priceId || priceId.startsWith('price_placeholder')) {
    return apiError(
      'Stripe price IDs not configured. Create products in Stripe Dashboard first.',
      503
    );
  }

  const supabase = await createServerSupabase();
  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id, email')
    .eq('id', auth.user.id)
    .single();

  let customerId = parent?.stripe_customer_id;

  // Create Stripe customer if none exists
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user.email || parent?.email,
      metadata: { supabase_id: auth.user.id },
    });
    customerId = customer.id;

    await supabase
      .from('parents')
      .update({ stripe_customer_id: customerId })
      .eq('id', auth.user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/parent/subscription?success=true`,
    cancel_url: `${appUrl}/parent/subscription?canceled=true`,
    metadata: {
      supabase_id: auth.user.id,
      tier,
    },
  });

  return apiSuccess({ url: session.url });
}
