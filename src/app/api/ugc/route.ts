// ════════════════════════════════════════════════════
// GET  /api/ugc — my creations + community library + creator badges
// POST /api/ugc — create a quiz (pre-approved bank only) for moderation
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import {
  validateQuiz,
  averageRating,
  earnedCreatorBadges,
  type UserQuiz,
  type ModerationStatus,
} from '@/lib/ugc/UgcEngine';

interface Row {
  id: string;
  creator_child_id: string;
  title: string;
  question_ids: string[];
  status: ModerationStatus;
  rating_sum: number;
  rating_count: number;
  created_at: string;
}

function toQuiz(r: Row): UserQuiz & { averageRating: number } {
  return {
    id: r.id,
    creatorChildId: r.creator_child_id,
    title: r.title,
    questionIds: r.question_ids ?? [],
    status: r.status,
    ratingSum: r.rating_sum,
    ratingCount: r.rating_count,
    createdAt: r.created_at,
    averageRating: averageRating({ ratingSum: r.rating_sum, ratingCount: r.rating_count }),
  };
}

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
    const { data: mine } = await supabase
      .from('user_content')
      .select('*')
      .eq('creator_child_id', childId)
      .order('created_at', { ascending: false });

    const { data: community } = await supabase
      .from('user_content')
      .select('*')
      .eq('status', 'approved')
      .order('published_at', { ascending: false })
      .limit(30);

    const myQuizzes = (mine ?? []).map((r: Row) => toQuiz(r));
    const published = myQuizzes.filter((q) => q.status === 'approved').length;
    const totalRatings = myQuizzes.reduce((s, q) => s + q.ratingCount, 0);

    return apiSuccess({
      myCreations: myQuizzes,
      community: (community ?? []).map((r: Row) => toQuiz(r)),
      badges: earnedCreatorBadges({ published, totalRatings }),
      stats: { published, totalRatings },
    });
  } catch (err) {
    console.error('[ugc:get]', err);
    return apiError('Failed to fetch content', 500);
  }
}

// ─── POST: create a quiz (submitted for parent moderation) ───
const CreateSchema = z.object({
  childId: z.string().uuid(),
  title: z.string().min(1).max(64),
  questionIds: z.array(z.string().max(64)).min(1).max(8),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return apiError('childId, title and questionIds required', 400);

  const { childId, title, questionIds } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  // COPPA gate: title from the safe generator, questions from the bank only.
  const check = validateQuiz(title, questionIds);
  if (!check.valid) return apiError(check.reason ?? 'Invalid quiz', 422, 'INVALID_QUIZ');

  const supabase = createAdminClient();

  try {
    const { data: inserted, error } = await supabase
      .from('user_content')
      .insert({ creator_child_id: childId, title, question_ids: questionIds, status: 'pending' })
      .select('id')
      .single();

    if (error) {
      console.error('[ugc:create:insert]', error);
      return apiError('Failed to create quiz', 500);
    }

    return apiSuccess({ id: inserted.id, status: 'pending', message: 'Submitted for a grown-up to review' });
  } catch (err) {
    console.error('[ugc:create]', err);
    return apiError('Failed to create quiz', 500);
  }
}
