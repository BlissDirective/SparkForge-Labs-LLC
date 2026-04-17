// ════════════════════════════════════════════════════
// POST /api/admin/subscriptions/change
// v3 Gap 1: Admin-gated programmatic plan change
// Body: { parentId, targetTier, interval?, reason? }
// - targetTier='free' → schedule cancel at period end
// - targetTier='plus'|'forge' → swap price on the existing
//   subscription with prorated billing
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireAdmin,
  parseBody,
} from '@/lib/api-helpers';
import { AdminChangeSubscriptionSchema } from '@/lib/validations';
import { getStripe } from '@/lib/stripe';
import { STRIPE_PRICES } from '@/lib/tier-config';
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

  const parsed = await parseBody(req, AdminChangeSubscriptionSchema);
  if (!parsed.success) return parsed.response;

  const { parentId, targetTier, interval, reason } = parsed.data;

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
      'Parent has no active Stripe subscription. Use the signup flow to start one.',
      400
    );
  }

  if (parent.subscription_tier === targetTier) {
    return apiError(`Parent is already on the ${targetTier} tier.`, 400);
  }

  try {
    let result;

    if (targetTier === 'free') {
      // Downgrade to free = cancel at period end
      result = await stripe.subscriptions.update(parent.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } else {
      // Change plan — swap the price on the existing subscription item
      const tierPrices = STRIPE_PRICES[targetTier as 'plus' | 'forge'];
      const newPriceId = tierPrices?.[interval as keyof typeof tierPrices];
      if (!newPriceId || newPriceId.startsWith('price_placeholder')) {
        return apiError(
          'Stripe price IDs not configured. Create products in Stripe Dashboard first.',
          503
        );
      }

      // Retrieve current subscription to get the item ID we need to replace
      const current = await stripe.subscriptions.retrieve(parent.stripe_subscription_id);
      const itemId = current.items.data[0]?.id;
      if (!itemId) {
        return apiError('Stripe subscription has no line items', 500);
      }

      result = await stripe.subscriptions.update(parent.stripe_subscription_id, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: 'create_prorations',
      });
    }

    // Audit log (DB-CRIT-001 4C: dual-write via centralized helper)
    await logSubscriptionEvent(supabase, {
      stripeEventId: `admin_change_${Date.now()}_${parentId}`,
      eventType: 'admin.subscription.change',
      parentId,
      data: {
        admin_id: auth.user.id,
        admin_email: auth.user.email,
        from_tier: parent.subscription_tier,
        to_tier: targetTier,
        interval,
        reason: reason || null,
        stripe_result_status: result.status,
      },
    });

    // Stripe API 2026-02-25+: current_period_end lives on SubscriptionItem
    const periodEndUnix = result.items.data[0]?.current_period_end ?? null;

    return apiSuccess({
      subscriptionId: result.id,
      status: result.status,
      targetTier,
      cancelAtPeriodEnd: result.cancel_at_period_end,
      currentPeriodEnd: periodEndUnix,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/subscriptions/change] Stripe error:', message);
    return apiError(`Stripe error: ${message}`, 500);
  }
}
