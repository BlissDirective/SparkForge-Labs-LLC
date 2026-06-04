// ════════════════════════════════════════════════════
// POST /api/ugc/rate — rate an approved community quiz (1-5 stars).
// Body: { childId, contentId, stars }. One rating per child per quiz.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { isRatingValid } from '@/lib/ugc/UgcEngine';

const Schema = z.object({
  childId: z.string().uuid(),
  contentId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId, contentId and stars required', 400);

  const { childId, contentId, stars } = parsed.data;
  if (!isRatingValid(stars)) return apiError('Stars must be 1-5', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const admin = createAdminClient();

  try {
    // Only approved content can be rated; can't rate your own quiz.
    const { data: content } = await admin
      .from('user_content')
      .select('id, creator_child_id, status, rating_sum, rating_count')
      .eq('id', contentId)
      .maybeSingle();

    if (!content || content.status !== 'approved') return apiError('Quiz not available', 404);
    if (content.creator_child_id === childId) return apiError('You cannot rate your own quiz', 403);

    // One rating per child (upsert the rating row; recompute aggregates).
    const { data: existing } = await admin
      .from('content_ratings')
      .select('stars')
      .eq('content_id', contentId)
      .eq('rater_child_id', childId)
      .maybeSingle();

    await admin
      .from('content_ratings')
      .upsert({ content_id: contentId, rater_child_id: childId, stars }, { onConflict: 'content_id,rater_child_id' });

    const newSum = content.rating_sum - (existing?.stars ?? 0) + stars;
    const newCount = content.rating_count + (existing ? 0 : 1);

    const { error } = await admin
      .from('user_content')
      .update({ rating_sum: newSum, rating_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', contentId);

    if (error) {
      console.error('[ugc:rate:update]', error);
      return apiError('Failed to rate', 500);
    }

    return apiSuccess({ contentId, stars, average: Math.round((newSum / Math.max(newCount, 1)) * 10) / 10 });
  } catch (err) {
    console.error('[ugc:rate]', err);
    return apiError('Failed to rate', 500);
  }
}
