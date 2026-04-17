// ════════════════════════════════════════════════════
// STRIPE CHECKOUT — Create subscription checkout session
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Uses createServerSupabase (BUG-8C fix)
// v2: apiVersion matches installed stripe@20.4.0
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { STRIPE_PRICES, TRIAL_DAYS } from '@/lib/tier-config';
import { apiSuccess, apiError, requireAuth, parseBody } from '@/lib/api-helpers';
import { CheckoutSchema } from '@/lib/validations';
import { getStripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

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

  // S8-HIGH-001 fix: Zod validation on checkout request body
  const parsed = await parseBody(req, CheckoutSchema);
  if (!parsed.success) return parsed.response;

  const { tier, interval } = parsed.data;

  const tierPrices = STRIPE_PRICES[tier as keyof typeof STRIPE_PRICES];
  const priceId = tierPrices?.[interval as keyof typeof tierPrices];
  if (!priceId || priceId.startsWith('price_placeholder')) {
    return apiError(
      'Stripe price IDs not configured. Create products in Stripe Dashboard first.',
      503
    );
  }

  const supabase = await createServerSupabase();
  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id, stripe_subscription_id, email, email_verified_at')
    .eq('id', auth.user.id)
    .single();

  // AUTH-HIGH-004 (4A): Gate only the act of subscribing. Free and paid
  // features elsewhere remain accessible; we only block the Stripe
  // checkout until the parent confirms they own the email. This
  // prevents someone from completing a purchase with an email they
  // don't actually control.
  if (!parent?.email_verified_at) {
    return apiError(
      'Please verify your email before subscribing. Check your inbox for the confirmation link.',
      403,
      'EMAIL_VERIFICATION_REQUIRED',
    );
  }

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

  // v3 Gap 2: Only grant trial days to first-time subscribers.
  // If stripe_subscription_id is already set, this parent has
  // subscribed before — no trial (prevents trial abuse).
  const isFirstTimeSubscriber = !parent?.stripe_subscription_id;
  const trialDays = isFirstTimeSubscriber ? TRIAL_DAYS[tier] ?? 0 : 0;

  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: {
      supabase_id: auth.user.id,
      tier,
    },
  };
  if (trialDays > 0) {
    subscriptionData.trial_period_days = trialDays;
  }

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
    subscription_data: subscriptionData,
  });

  return apiSuccess({ url: session.url });
}
