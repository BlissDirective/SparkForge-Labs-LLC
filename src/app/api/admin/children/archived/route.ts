// ════════════════════════════════════════════════════
// GET /api/admin/children/archived
// v3 Gap 3 / Restore tool: Admin-only list of soft-archived
// children across all parents. Joins on the parents table so
// the admin UI can show which parent each archived child
// belonged to.
//
// Returns rows sorted by deactivated_at DESC (most recent
// archives first). Only returns rows where deactivated_at IS
// NOT NULL — active children are visible via /api/children.
//
// Companion endpoint: POST /api/admin/children/[childId]/restore
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAdmin } from '@/lib/api-helpers';
import type { SubscriptionTier } from '@/lib/tier-config';
import { TIER_CONFIG } from '@/lib/tier-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ArchivedChildRow {
  id: string;
  display_name: string;
  age: number;
  age_band: string;
  avatar_config: Record<string, unknown> | null;
  deactivated_at: string;
  created_at: string;
  parent_id: string;
  parents: {
    id: string;
    email: string;
    full_name: string | null;
    subscription_tier: SubscriptionTier;
  } | null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

  // Use the admin client so we bypass parent-scoped RLS — admins
  // need to see archived children across every account.
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('children')
    .select(
      `
      id,
      display_name,
      age,
      age_band,
      avatar_config,
      deactivated_at,
      created_at,
      parent_id,
      parents:parents!inner (
        id,
        email,
        full_name,
        subscription_tier
      )
      `
    )
    .not('deactivated_at', 'is', null)
    .order('deactivated_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[admin/children/archived] DB error:', error);
    return apiError('Failed to list archived children', 500);
  }

  // For each archived row compute whether restoring it would push
  // the parent over their current tier's maxChildren limit. This
  // lets the UI show a warning + disable the Restore button.
  const rows = (data ?? []) as unknown as ArchivedChildRow[];

  // Group by parent so we only count once per parent.
  const parentIds = Array.from(new Set(rows.map((r) => r.parent_id)));

  // Count current active children for each parent in a single query
  const activeCountsByParent = new Map<string, number>();
  if (parentIds.length > 0) {
    const { data: active } = await supabase
      .from('children')
      .select('parent_id')
      .in('parent_id', parentIds)
      .is('deactivated_at', null);

    for (const row of (active ?? []) as { parent_id: string }[]) {
      activeCountsByParent.set(
        row.parent_id,
        (activeCountsByParent.get(row.parent_id) ?? 0) + 1
      );
    }
  }

  const result = rows.map((row) => {
    const parent = row.parents;
    const tier = (parent?.subscription_tier ?? 'free') as SubscriptionTier;
    const activeCount = activeCountsByParent.get(row.parent_id) ?? 0;
    const maxChildren = TIER_CONFIG[tier].maxChildren;
    const wouldExceedLimit = activeCount >= maxChildren;

    return {
      id: row.id,
      displayName: row.display_name,
      age: row.age,
      ageBand: row.age_band,
      avatarConfig: row.avatar_config,
      deactivatedAt: row.deactivated_at,
      createdAt: row.created_at,
      parent: parent
        ? {
            id: parent.id,
            email: parent.email,
            fullName: parent.full_name,
            tier,
            activeChildCount: activeCount,
            maxChildren,
          }
        : null,
      wouldExceedLimit,
    };
  });

  return apiSuccess({
    archivedChildren: result,
    total: result.length,
  });
}
