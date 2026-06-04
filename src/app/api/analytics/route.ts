// ════════════════════════════════════════════════════
// GET /api/analytics — advanced parent analytics for a child:
// learning velocity, topic-strength heatmap, time-on-task, anonymous
// percentile benchmark, and a template-generated weekly insight.
// Also captures/refreshes the current week's snapshot.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { LAB_NAMES } from '@/config/labs';
import {
  topicHeatmap, computeVelocity, xpPercentile, timeOnTaskSummary,
  generateInsight, getWeekMonday, type AnalyticsSnapshot,
} from '@/lib/analytics/AnalyticsEngine';

const LAB_IDS = Object.keys(LAB_NAMES).map(Number).sort((a, b) => a - b);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId required', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = createAdminClient();

  try {
    const { data: child } = await supabase
      .from('children')
      .select('display_name, age_band, xp, games_played_this_week')
      .eq('id', childId)
      .single();
    if (!child) return apiError('Child not found', 404);

    // Per-lab completion percent (heatmap).
    const perLab: Record<number, number> = {};
    await Promise.all(
      LAB_IDS.map(async (lab) => {
        const { data } = await supabase.rpc('get_lab_progress', {
          p_child_id: childId, p_world: lab, p_age_band: child.age_band,
        });
        perLab[lab] = Number(data?.[0]?.percent ?? 0);
      }),
    );

    // Refresh this week's snapshot so the velocity series keeps growing.
    const week = getWeekMonday();
    await supabase
      .from('analytics_snapshots')
      .upsert(
        {
          child_id: childId,
          week_starting: week,
          xp: child.xp ?? 0,
          games_played: child.games_played_this_week ?? 0,
          per_lab: perLab,
        },
        { onConflict: 'child_id,week_starting' },
      );

    const { data: snapRows } = await supabase
      .from('analytics_snapshots')
      .select('week_starting, xp, time_minutes, games_played')
      .eq('child_id', childId)
      .order('week_starting', { ascending: true })
      .limit(26);

    const snapshots: AnalyticsSnapshot[] = (snapRows ?? []).map((r) => ({
      weekStarting: r.week_starting,
      xp: r.xp,
      timeMinutes: r.time_minutes,
      gamesPlayed: r.games_played,
    }));

    const heatmap = topicHeatmap(perLab);
    const velocity = computeVelocity(snapshots);
    const percentile = xpPercentile(child.xp ?? 0);
    const timeOnTask = timeOnTaskSummary(snapshots);
    const insight = generateInsight({
      childName: child.display_name ?? 'Your child',
      velocity, heatmap, percentile, labNames: LAB_NAMES,
    });

    return apiSuccess({ heatmap, velocity, percentile, timeOnTask, insight, weeks: snapshots.length });
  } catch (err) {
    console.error('[analytics:get]', err);
    return apiError('Failed to fetch analytics', 500);
  }
}
