// ════════════════════════════════════════════════════
// POST /api/stripe/subscription/change
// v3 Gap 3: User-initiated plan change / downgrade
// Body: { targetTier, interval?, archiveChildIds? }
//
// Paths:
//   current=plus/forge → target=free     → cancel_at_period_end
//   current=plus/forge → target=paid     → prorated price swap
//   current=free       → target=paid     → redirect to checkout flow
//
// Over-limit safety: if the new tier's maxChildren is lower than the
// current count, the client must provide archiveChildIds listing the
// children to soft-archive. We mark them with deactivated_at so RLS
// can exclude them from active lists without losing their data.
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireAuth,
  parseBody,
} from '@/lib/api-helpers';
import { ChangeSubscriptionSchema } from '@/lib/validations';
import {
  STRIPE_PRICES,
  TIER_CONFIG,
  type SubscriptionTier,
} from '@/lib/tier-config';
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

  const parsed = await parseBody(req, ChangeSubscriptionSchema);
  if (!parsed.success) return parsed.response;

  const { targetTier, interval, archiveChildIds } = parsed.data;
  const currentTier = auth.user.tier;

  if (currentTier === targetTier) {
    return apiError(`You're already on the ${targetTier} tier.`, 400);
  }

  const supabase = await createServerSupabase();

  // Fetch parent's subscription state
  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_subscription_id, subscription_tier')
    .eq('id', auth.user.id)
    .single();

  // ── Upgrade from free: redirect client to checkout ──
  if (currentTier === 'free' && targetTier !== 'free') {
    return apiSuccess({
      action: 'checkout_required',
      message: 'Use /api/stripe/checkout to start a new subscription.',
    });
  }

  if (!parent?.stripe_subscription_id) {
    return apiError(
      'No active Stripe subscription found. Try starting one via /api/stripe/checkout.',
      400
    );
  }

  // ── Over-limit children check ──
  // v3 Gap 3: Only count ACTIVE children. Previously-archived profiles
  // from an earlier downgrade don't count against the new target limit.
  const targetLimits = TIER_CONFIG[targetTier as SubscriptionTier];
  const { count: childCount } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', auth.user.id)
    .is('deactivated_at', null);

  const currentChildCount = childCount ?? 0;
  const overLimit = currentChildCount - targetLimits.maxChildren;

  if (overLimit > 0) {
    if (!archiveChildIds || archiveChildIds.length < overLimit) {
      return apiError(
        `Downgrading to ${targetTier} allows at most ${targetLimits.maxChildren} child profile(s). You currently have ${currentChildCount}. Please select ${overLimit} to archive.`,
        400,
        'CHILDREN_OVER_LIMIT'
      );
    }

    // Verify the provided children belong to this parent AND are
    // currently active (can't archive something that's already archived).
    const { data: ownedChildren } = await supabase
      .from('children')
      .select('id')
      .eq('parent_id', auth.user.id)
      .is('deactivated_at', null)
      .in('id', archiveChildIds);

    if (!ownedChildren || ownedChildren.length !== archiveChildIds.length) {
      return apiError(
        'One or more selected profiles do not belong to your account or are already archived.',
        403
      );
    }

    // v3 Gap 3: Soft-archive via the deactivated_at column from
    // sql/schema-stage8-patch-children-archive.sql. The column is required
    // for this branch — if missing, run that migration in Supabase first.
    const { error: archiveError } = await supabase
      .from('children')
      .update({ deactivated_at: new Date().toISOString() })
      .in('id', archiveChildIds);

    if (archiveError) {
      console.error('[subscription/change] Failed to soft-archive children:', archiveError);
      return apiError(
        'Unable to archive the selected profiles. Ensure schema-stage8-patch-children-archive.sql has been applied.',
        500
      );
    }
  }

  try {
    let result;

    if (targetTier === 'free') {
      // Cancel at period end — user keeps access until then
      result = await stripe.subscriptions.update(parent.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } else {
      // Swap price on the existing subscription item
      const tierPrices = STRIPE_PRICES[targetTier as 'plus' | 'forge'];
      const newPriceId = tierPrices?.[interval as keyof typeof tierPrices];
      if (!newPriceId || newPriceId.startsWith('price_placeholder')) {
        return apiError(
          'Stripe price IDs not configured. Contact support.',
          503
        );
      }

      const current = await stripe.subscriptions.retrieve(parent.stripe_subscription_id);
      const itemId = current.items.data[0]?.id;
      if (!itemId) {
        return apiError('Subscription has no line items', 500);
      }

      result = await stripe.subscriptions.update(parent.stripe_subscription_id, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: 'create_prorations',
      });
    }

    // Stripe API 2026-02-25+: current_period_end is now on SubscriptionItem
    const periodEndUnix = result.items.data[0]?.current_period_end;

    return apiSuccess({
      action: targetTier === 'free' ? 'cancel_scheduled' : 'plan_changed',
      subscriptionId: result.id,
      status: result.status,
      targetTier,
      currentPeriodEnd: periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: result.cancel_at_period_end,
      archivedChildCount: archiveChildIds?.length ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[subscription/change] Stripe error:', message);
    return apiError(`Stripe error: ${message}`, 500);
  }
}
