// ════════════════════════════════════════════════════
// POST /api/admin/children/[childId]/restore
// v3 Gap 3 / Restore tool: Admin-only soft-archive reversal.
// Clears deactivated_at on a single child, putting them back
// into the parent's active list.
//
// Safety:
//   - Admin-gated (requireAdmin)
//   - Checks the parent's current active child count against
//     their tier's maxChildren limit. If restoring would exceed,
//     returns 400 CHILDREN_OVER_LIMIT so the admin UI can surface
//     a clear error (and prompt the admin to either archive a
//     different child first or upgrade the parent's tier).
//   - Writes an audit row to subscription_events with event_type
//     'admin.child.restored' so we have a trail.
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAdmin, parseBody } from '@/lib/api-helpers';
import { TIER_CONFIG, type SubscriptionTier } from '@/lib/tier-config';
import { logSubscriptionEvent } from '@/lib/subscription-events';
import { z } from 'zod';

export const runtime = 'nodejs';

const RestoreBodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

  const { childId } = await params;
  if (!childId) return apiError('Missing childId', 400);

  const parsed = await parseBody(req, RestoreBodySchema);
  if (!parsed.success) return parsed.response;

  const supabase = createAdminClient();

  // ── 1. Load the archived child + its parent ─────────
  const { data: child, error: childErr } = await supabase
    .from('children')
    .select('id, parent_id, display_name, deactivated_at')
    .eq('id', childId)
    .single();

  if (childErr || !child) {
    return apiError('Child not found', 404);
  }

  const archivedChild = child as {
    id: string;
    parent_id: string;
    display_name: string;
    deactivated_at: string | null;
  };

  if (!archivedChild.deactivated_at) {
    return apiError('Child is already active — nothing to restore.', 400);
  }

  // ── 2. Load parent + tier ─────────────────────────────
  const { data: parent, error: parentErr } = await supabase
    .from('parents')
    .select('id, email, subscription_tier')
    .eq('id', archivedChild.parent_id)
    .single();

  if (parentErr || !parent) {
    return apiError('Parent account not found', 404);
  }

  const parentRow = parent as {
    id: string;
    email: string;
    subscription_tier: SubscriptionTier;
  };

  // ── 3. Check tier limit ───────────────────────────────
  const tier = parentRow.subscription_tier ?? 'free';
  const maxChildren = TIER_CONFIG[tier].maxChildren;

  const { count: activeCount, error: countErr } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', parentRow.id)
    .is('deactivated_at', null);

  if (countErr) {
    return apiError('Failed to check tier limit', 500);
  }

  const currentActive = activeCount ?? 0;
  if (currentActive >= maxChildren) {
    return apiError(
      `Restoring ${archivedChild.display_name} would exceed the parent's ${tier.toUpperCase()} tier limit of ${maxChildren} child profile(s). They currently have ${currentActive} active. Archive another profile first, or upgrade the parent's tier.`,
      400,
      'CHILDREN_OVER_LIMIT'
    );
  }

  // ── 4. Clear deactivated_at ───────────────────────────
  const { error: restoreErr } = await supabase
    .from('children')
    .update({ deactivated_at: null })
    .eq('id', childId);

  if (restoreErr) {
    console.error('[admin/children/restore] Update failed:', restoreErr);
    return apiError('Failed to restore child', 500);
  }

  // ── 5. Audit trail ────────────────────────────────────
  // We use subscription_events as the audit log since it already
  // captures admin actions for the same parent. event_type is
  // namespaced so filtering in the admin dashboard is easy.
  // DB-CRIT-001 (4C): dual-write via centralized helper.
  await logSubscriptionEvent(supabase, {
    stripeEventId: `admin_restore_${childId}_${Date.now()}`,
    eventType: 'admin.child.restored',
    parentId: parentRow.id,
    data: {
      child_id: childId,
      child_name: archivedChild.display_name,
      admin_id: auth.user.id,
      admin_email: auth.user.email,
      reason: parsed.data.reason ?? null,
      restored_at: new Date().toISOString(),
      parent_tier: tier,
      active_count_after: currentActive + 1,
      max_children: maxChildren,
    },
  });

  return apiSuccess({
    childId,
    parentId: parentRow.id,
    parentEmail: parentRow.email,
    displayName: archivedChild.display_name,
    activeCountAfter: currentActive + 1,
    maxChildren,
  });
}
