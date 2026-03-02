// POST /api/stripe/portal — Customer portal for subscription management
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = createServerSupabase();

  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id')
    .eq('id', auth.user.id)
    .single();

  if (!parent?.stripe_customer_id) return apiError('No subscription found', 404);

  const session = await stripe.billingPortal.sessions.create({
    customer: parent.stripe_customer_id,
    return_url: `${req.nextUrl.origin}/parent/subscription`,
  });

  return apiSuccess({ url: session.url });
}
