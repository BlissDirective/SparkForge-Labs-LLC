// ════════════════════════════════════════════════════
// GET /api/adaptive — per-lab adaptive difficulty + learning curves
// Query: childId [, labId]
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { defaultState, curveTrend, type AdaptiveState, type DifficultyLevel, type LearningPoint } from '@/lib/adaptive/AdaptiveEngine';

interface Row {
  lab_id: number;
  level: DifficultyLevel;
  performance: number;
  samples: number;
  history: LearningPoint[] | null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  const labParam = req.nextUrl.searchParams.get('labId');
  if (!childId) return apiError('childId required', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = createAdminClient();

  try {
    let query = supabase
      .from('adaptive_difficulty')
      .select('lab_id, level, performance, samples, history')
      .eq('child_id', childId);
    if (labParam) query = query.eq('lab_id', Number(labParam));

    const { data: rows } = await query;

    const labs = (rows ?? []).map((r: Row) => {
      const state: AdaptiveState = {
        level: r.level,
        performance: Number(r.performance),
        samples: r.samples,
        history: r.history ?? [],
      };
      return { labId: r.lab_id, ...state, trend: curveTrend(state.history) };
    });

    return apiSuccess({ labs, defaults: defaultState() });
  } catch (err) {
    console.error('[adaptive:get]', err);
    return apiError('Failed to fetch adaptive difficulty', 500);
  }
}
