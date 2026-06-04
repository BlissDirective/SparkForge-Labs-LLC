// ════════════════════════════════════════════════════
// POST /api/ugc/moderate — parent approves/rejects their child's quiz
// before it joins the community library. Body: { childId, contentId, approve }
// COPPA: nothing is shared publicly without explicit parent approval.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const Schema = z.object({
  childId: z.string().uuid(),
  contentId: z.string().uuid(),
  approve: z.boolean(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId, contentId and approve required', 400);

  const { childId, contentId, approve } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const admin = createAdminClient();

  try {
    // The content must belong to this parent's child.
    const { data: content } = await admin
      .from('user_content')
      .select('id, creator_child_id, status')
      .eq('id', contentId)
      .eq('creator_child_id', childId)
      .maybeSingle();

    if (!content) return apiError('Content not found', 404);

    const now = new Date().toISOString();
    const { error } = await admin
      .from('user_content')
      .update({
        status: approve ? 'approved' : 'rejected',
        moderated_at: now,
        published_at: approve ? now : null,
        updated_at: now,
      })
      .eq('id', contentId);

    if (error) {
      console.error('[ugc:moderate:update]', error);
      return apiError('Failed to moderate', 500);
    }

    return apiSuccess({ contentId, status: approve ? 'approved' : 'rejected' });
  } catch (err) {
    console.error('[ugc:moderate]', err);
    return apiError('Failed to moderate', 500);
  }
}
