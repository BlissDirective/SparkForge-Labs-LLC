// ════════════════════════════════════════════════════
// POST /api/mastery/claim — record lab mastery for a child.
// Body: { childId, labId }
// Verifies the lab is mastered (>= MASTERY_PERCENT) server-side, then
// issues a (pending-approval) certificate and unlocks Expert Mode.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { isMastered } from '@/lib/mastery/MasteryEngine';

const Schema = z.object({ childId: z.string().uuid(), labId: z.number().int().min(1).max(11) });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId and labId required', 400);

  const { childId, labId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  try {
    const { data: child } = await supabase
      .from('children').select('age_band').eq('id', childId).single();
    if (!child) return apiError('Child not found', 404);

    // Verify mastery server-side (never trust the client).
    const { data } = await supabase.rpc('get_lab_progress', {
      p_child_id: childId, p_world: labId, p_age_band: child.age_band,
    });
    const percent = Number(data?.[0]?.percent ?? 0);
    if (!isMastered(percent)) {
      return apiError('Lab not yet mastered', 409, 'NOT_MASTERED');
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Idempotent: only set mastered_at the first time.
    const { data: existing } = await admin
      .from('mastery_paths')
      .select('mastered_at')
      .eq('child_id', childId)
      .eq('lab_id', labId)
      .maybeSingle();

    const { error } = await admin
      .from('mastery_paths')
      .upsert(
        {
          child_id: childId,
          lab_id: labId,
          mastered_at: existing?.mastered_at ?? now,
          expert_unlocked: true,
          certificate_issued: true,
          updated_at: now,
        },
        { onConflict: 'child_id,lab_id' },
      );

    if (error) {
      console.error('[mastery:claim:upsert]', error);
      return apiError('Failed to record mastery', 500);
    }

    return apiSuccess({ labId, mastered: true, expertUnlocked: true, certificateIssued: true });
  } catch (err) {
    console.error('[mastery:claim]', err);
    return apiError('Failed to claim mastery', 500);
  }
}
