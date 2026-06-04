// ════════════════════════════════════════════════════
// CRON — Weekly analytics snapshot
// Captures each child's current XP / games-played into
// analytics_snapshots for the current week, powering the parent
// dashboard's learning-velocity trend.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, sanitizeErrorMessage } from '@/lib/api-helpers';
import { verifyCronBearer } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { getWeekMonday } from '@/lib/analytics/AnalyticsEngine';

export async function GET(req: NextRequest) {
  const denied = verifyCronBearer(req, { routeName: 'analytics-snapshot' });
  if (denied) return denied;

  const supabase = createAdminClient();
  const week = getWeekMonday();

  try {
    const { data: children } = await supabase
      .from('children')
      .select('id, xp, games_played_this_week');

    let captured = 0;
    for (const c of children ?? []) {
      const { error } = await supabase
        .from('analytics_snapshots')
        .upsert(
          {
            child_id: c.id,
            week_starting: week,
            xp: c.xp ?? 0,
            games_played: c.games_played_this_week ?? 0,
          },
          { onConflict: 'child_id,week_starting' },
        );
      if (!error) captured++;
    }

    return apiSuccess({ week, captured, totalChildren: (children ?? []).length });
  } catch (err) {
    return apiError(sanitizeErrorMessage(err, 'Analytics snapshot cron failed'), 500);
  }
}
