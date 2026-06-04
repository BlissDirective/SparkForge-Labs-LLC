// ════════════════════════════════════════════════════
// POST /api/mastery/certificate — parent approves (or revokes) sharing
// of a child's mastery certificate. Body: { childId, labId, approve }
// COPPA: certificates are only shareable after explicit parent approval.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const Schema = z.object({
  childId: z.string().uuid(),
  labId: z.number().int().min(1).max(11),
  approve: z.boolean(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId, labId and approve required', 400);

  const { childId, labId, approve } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const admin = createAdminClient();

  try {
    const { data: existing } = await admin
      .from('mastery_paths')
      .select('certificate_issued')
      .eq('child_id', childId)
      .eq('lab_id', labId)
      .maybeSingle();

    if (!existing?.certificate_issued) {
      return apiError('No certificate to approve', 404);
    }

    const { error } = await admin
      .from('mastery_paths')
      .update({
        certificate_approved: approve,
        certificate_approved_at: approve ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('child_id', childId)
      .eq('lab_id', labId);

    if (error) {
      console.error('[mastery:certificate:update]', error);
      return apiError('Failed to update certificate', 500);
    }

    return apiSuccess({ labId, approved: approve });
  } catch (err) {
    console.error('[mastery:certificate]', err);
    return apiError('Failed to update certificate', 500);
  }
}
