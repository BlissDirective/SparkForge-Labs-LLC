// ════════════════════════════════════════════════════
// STRIPE PORTAL — Customer portal for subscription management
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Uses createServerSupabase (BUG-8C fix)
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import { getStripe } from '@/lib/stripe';

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

  const supabase = await createServerSupabase();
  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id')
    .eq('id', auth.user.id)
    .single();

  if (!parent?.stripe_customer_id) {
    return apiError('No subscription found. Subscribe first to manage billing.', 404);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: parent.stripe_customer_id,
    return_url: `${appUrl}/parent/subscription`,
  });

  return apiSuccess({ url: session.url });
}
