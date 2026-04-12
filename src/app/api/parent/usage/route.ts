// ════════════════════════════════════════════════════
// GET /api/parent/usage
// v3 Gap 4: Returns per-child usage vs tier limits so the
// parent dashboard can render live consumption meters.
//
// Source of truth matches middleware/tierCheck.ts:
//   prompts_used_today  ← count(prompt_history where today)
//   games_played_this_week ← count(progress where completed in last 7d)
//
// This is intentionally not a materialized count on children table
// (those are write-side hints) because tierCheck.ts reads from the
// raw tables and we want displayed values to match enforced values.
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import { getTierLimits } from '@/lib/tier-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UsageResponse {
  tier: string;
  limits: {
    promptsPerDay: number;
    gamesPerWeek: number | null; // null = unlimited
    maxChildren: number;
  };
  totals: {
    childrenCount: number;
    maxChildren: number;
    promptsUsedToday: number;
    promptsLimitToday: number; // per-child * children count for convenience
    gamesPlayedThisWeek: number;
    gamesLimitThisWeek: number | null;
  };
  perChild: Array<{
    id: string;
    displayName: string;
    ageBand: 'A' | 'B' | 'C';
    promptsUsedToday: number;
    promptsRemaining: number;
    gamesPlayedThisWeek: number;
    gamesRemaining: number | null; // null = unlimited
  }>;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = await createServerSupabase();
  const limits = getTierLimits(auth.user.tier);

  // Fetch all active (non-archived) children for this parent.
  // v3 Gap 3: deactivated_at filter keeps usage meters in sync with what
  // the parent actually sees in their dashboard child list.
  const { data: children, error: childError } = await supabase
    .from('children')
    .select('id, display_name, age_band')
    .eq('parent_id', auth.user.id)
    .is('deactivated_at', null);

  if (childError) {
    console.error('[parent/usage] children query failed:', childError);
    return apiError('Failed to load usage', 500);
  }

  const childRows = children ?? [];

  // Compute time windows
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Fetch prompts + games for all children in parallel
  const perChild = await Promise.all(
    childRows.map(async (child) => {
      const [promptsResult, gamesResult] = await Promise.all([
        supabase
          .from('prompt_history')
          .select('id', { count: 'exact', head: true })
          .eq('child_id', child.id)
          .gte('created_at', todayStart.toISOString()),
        supabase
          .from('progress')
          .select('id', { count: 'exact', head: true })
          .eq('child_id', child.id)
          .eq('completed', true)
          .gte('completed_at', weekAgo.toISOString()),
      ]);

      const promptsUsedToday = promptsResult.count ?? 0;
      const gamesPlayedThisWeek = gamesResult.count ?? 0;

      return {
        id: child.id,
        displayName: child.display_name,
        ageBand: child.age_band as 'A' | 'B' | 'C',
        promptsUsedToday,
        promptsRemaining: Math.max(0, limits.promptsPerDay - promptsUsedToday),
        gamesPlayedThisWeek,
        gamesRemaining:
          limits.gamesPerWeek === null
            ? null
            : Math.max(0, limits.gamesPerWeek - gamesPlayedThisWeek),
      };
    })
  );

  const totalPromptsToday = perChild.reduce((sum, c) => sum + c.promptsUsedToday, 0);
  const totalGamesWeek = perChild.reduce((sum, c) => sum + c.gamesPlayedThisWeek, 0);

  const response: UsageResponse = {
    tier: auth.user.tier,
    limits: {
      promptsPerDay: limits.promptsPerDay,
      gamesPerWeek: limits.gamesPerWeek,
      maxChildren: limits.maxChildren,
    },
    totals: {
      childrenCount: childRows.length,
      maxChildren: limits.maxChildren,
      promptsUsedToday: totalPromptsToday,
      // Aggregate quota = per-child limit × children (soft guideline only;
      // the per-child limit is what enforcement checks).
      promptsLimitToday: limits.promptsPerDay * Math.max(1, childRows.length),
      gamesPlayedThisWeek: totalGamesWeek,
      gamesLimitThisWeek:
        limits.gamesPerWeek === null
          ? null
          : limits.gamesPerWeek * Math.max(1, childRows.length),
    },
    perChild,
  };

  return apiSuccess(response);
}
