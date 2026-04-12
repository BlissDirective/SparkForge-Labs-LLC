// ════════════════════════════════════════════════════
// GET /api/admin/subscriptions
// v3 Gap 1: Admin-gated list of all parent subscriptions
// Returns every parent row with Stripe-relevant columns so
// the admin UI can render a management table.
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAdmin } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('parents')
    .select(
      'id, email, full_name, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, subscription_period_end, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[admin/subscriptions] DB error:', error);
    return apiError('Failed to list subscriptions', 500);
  }

  return apiSuccess({
    subscriptions: (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      tier: row.subscription_tier,
      status: row.subscription_status,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      trialEndsAt: row.trial_ends_at,
      subscriptionPeriodEnd: row.subscription_period_end,
      createdAt: row.created_at,
    })),
  });
}
