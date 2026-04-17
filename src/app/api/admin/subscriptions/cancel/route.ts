// ════════════════════════════════════════════════════
// POST /api/admin/subscriptions/cancel
// v3 Gap 1: Admin-gated programmatic cancellation
// Body: { parentId, immediate?, reason? }
// - immediate=false (default): cancel at period end
// - immediate=true: cancel right now (no refund — prorate
//   is Stripe's default for unused time)
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireAdmin,
  parseBody,
} from '@/lib/api-helpers';
import { AdminCancelSubscriptionSchema } from '@/lib/validations';
import { getStripe } from '@/lib/stripe';
import { logSubscriptionEvent } from '@/lib/subscription-events';

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

  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, AdminCancelSubscriptionSchema);
  if (!parsed.success) return parsed.response;

  const { parentId, immediate, reason } = parsed.data;

  // Admin client — cross-parent read.
  const supabase = createAdminClient();

  const { data: parent, error: fetchError } = await supabase
    .from('parents')
    .select('id, email, stripe_subscription_id, subscription_tier')
    .eq('id', parentId)
    .single();

  if (fetchError || !parent) {
    return apiError('Parent not found', 404);
  }

  if (!parent.stripe_subscription_id) {
    return apiError(
      'Parent has no active Stripe subscription. They may already be on the free tier.',
      400
    );
  }

  try {
    let result;
    if (immediate) {
      result = await stripe.subscriptions.cancel(parent.stripe_subscription_id);
    } else {
      result = await stripe.subscriptions.update(parent.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // Audit log (DB-CRIT-001 4C: dual-write via centralized helper)
    await logSubscriptionEvent(supabase, {
      stripeEventId: `admin_cancel_${Date.now()}_${parentId}`,
      eventType: 'admin.subscription.cancel',
      parentId,
      data: {
        admin_id: auth.user.id,
        admin_email: auth.user.email,
        immediate,
        reason: reason || null,
        stripe_result_status: result.status,
      },
    });

    return apiSuccess({
      subscriptionId: result.id,
      status: result.status,
      cancelAtPeriodEnd: result.cancel_at_period_end,
      canceledAt: result.canceled_at,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/subscriptions/cancel] Stripe error:', message);
    return apiError(`Stripe error: ${message}`, 500);
  }
}
