// ════════════════════════════════════════════════════
// POST /api/adaptive/record — fold a game-performance sample into the
// per-lab adaptive difficulty state. Body:
//   { childId, labId, accuracy, speedScore, hintRate, retryRate }
// Returns the updated recommended difficulty level.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { applySample, defaultState, type AdaptiveState, type DifficultyLevel, type LearningPoint } from '@/lib/adaptive/AdaptiveEngine';

const Schema = z.object({
  childId: z.string().uuid(),
  labId: z.number().int().min(1).max(11),
  accuracy: z.number().min(0).max(1),
  speedScore: z.number().min(0).max(1).default(0.5),
  hintRate: z.number().min(0).max(1).default(0),
  retryRate: z.number().min(0).max(1).default(0),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId, labId and accuracy required', 400);

  const { childId, labId, accuracy, speedScore, hintRate, retryRate } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = createAdminClient();

  try {
    const { data: row } = await supabase
      .from('adaptive_difficulty')
      .select('level, performance, samples, history')
      .eq('child_id', childId)
      .eq('lab_id', labId)
      .maybeSingle();

    const prev: AdaptiveState = row
      ? {
          level: row.level as DifficultyLevel,
          performance: Number(row.performance),
          samples: row.samples,
          history: (row.history as LearningPoint[]) ?? [],
        }
      : defaultState();

    const next = applySample(prev, { accuracy, speedScore, hintRate, retryRate });

    const { error } = await supabase
      .from('adaptive_difficulty')
      .upsert(
        {
          child_id: childId,
          lab_id: labId,
          level: next.level,
          performance: next.performance,
          samples: next.samples,
          history: next.history,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'child_id,lab_id' },
      );

    if (error) {
      console.error('[adaptive:record:upsert]', error);
      return apiError('Failed to record sample', 500);
    }

    return apiSuccess({ level: next.level, performance: next.performance, samples: next.samples });
  } catch (err) {
    console.error('[adaptive:record]', err);
    return apiError('Failed to record sample', 500);
  }
}
