// POST /api/stripe/checkout — Create Stripe Checkout session
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { CheckoutSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, requireAuth } from '@/lib/api-helpers';
import { STRIPE_PRICES } from '@/lib/tier-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CheckoutSchema);
  if (!parsed.success) return parsed.response;

  const { tier, interval } = parsed.data;
  const priceId = STRIPE_PRICES[tier][interval];

  if (!priceId) return apiError('Invalid price configuration', 500);

  const supabase = createServerSupabase();

  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id, email')
    .eq('id', auth.user.id)
    .single();

  let customerId = parent?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: parent?.email || auth.user.email,
      metadata: { supabase_user_id: auth.user.id },
    });
    customerId = customer.id;

    await supabase.from('parents')
      .update({ stripe_customer_id: customerId })
      .eq('id', auth.user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/parent/subscription?success=true`,
    cancel_url: `${req.nextUrl.origin}/parent/subscription?canceled=true`,
    metadata: { supabase_user_id: auth.user.id, tier },
  });

  return apiSuccess({ url: session.url });
}
