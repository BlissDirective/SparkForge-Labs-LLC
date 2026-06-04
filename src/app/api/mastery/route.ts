// ════════════════════════════════════════════════════
// GET /api/mastery — topic mastery tree for a child
// ════════════════════════════════════════════════════
// Derives per-lab mastery status from completion percent and overlays
// the persisted mastery_paths state (certificates, expert unlock).

import { NextRequest } from 'next/server';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { LAB_NAMES } from '@/config/labs';
import { buildMasteryTree, countMastered, type MasteryOverlay } from '@/lib/mastery/MasteryEngine';

const LAB_IDS = Object.keys(LAB_NAMES).map(Number).sort((a, b) => a - b);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId required', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  try {
    const { data: child } = await supabase
      .from('children').select('age_band').eq('id', childId).single();
    if (!child) return apiError('Child not found', 404);

    // Per-lab completion percent via the shared RPC.
    const percents: Record<number, number> = {};
    await Promise.all(
      LAB_IDS.map(async (lab) => {
        const { data } = await supabase.rpc('get_lab_progress', {
          p_child_id: childId, p_world: lab, p_age_band: child.age_band,
        });
        percents[lab] = Number(data?.[0]?.percent ?? 0);
      }),
    );

    // Persisted overlay (admin client — read is fine either way).
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from('mastery_paths')
      .select('lab_id, mastered_at, expert_unlocked, certificate_issued, certificate_approved')
      .eq('child_id', childId);

    const overlays: Record<number, MasteryOverlay> = {};
    for (const r of rows ?? []) {
      overlays[r.lab_id] = {
        labId: r.lab_id,
        masteredAt: r.mastered_at,
        expertUnlocked: r.expert_unlocked,
        certificateIssued: r.certificate_issued,
        certificateApproved: r.certificate_approved,
      };
    }

    const topics = buildMasteryTree(percents, overlays, LAB_NAMES);

    return apiSuccess({
      topics,
      masteredCount: countMastered(topics),
      total: topics.length,
    });
  } catch (err) {
    console.error('[mastery:get]', err);
    return apiError('Failed to fetch mastery', 500);
  }
}
