// ════════════════════════════════════════════════════
// GET  /api/ugc — my creations + community library + creator badges
// POST /api/ugc — create a quiz (pre-approved bank only) for moderation
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  apiSuccess, apiError, requireAuth, verifyChildOwnership,
  applyRateLimit, checkDuplicate,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import {
  validateQuiz,
  validatePromptText,
  validateAgentPublish,
  averageRating,
  earnedCreatorBadges,
  type UserQuiz,
  type ModerationStatus,
  type ContentKind,
} from '@/lib/ugc/UgcEngine';
import { checkBlocklist, checkHaikuModeration } from '@/lib/agent/moderation';

interface Row {
  id: string;
  creator_child_id: string;
  title: string;
  question_ids: string[] | null;
  kind: ContentKind | null;
  payload: Record<string, unknown> | null;
  status: ModerationStatus;
  rating_sum: number;
  rating_count: number;
  created_at: string;
}

type ContentDto = UserQuiz & {
  averageRating: number;
  kind: ContentKind;
  payload: Record<string, unknown>;
};

function toContent(r: Row): ContentDto {
  return {
    id: r.id,
    creatorChildId: r.creator_child_id,
    title: r.title,
    questionIds: r.question_ids ?? [],
    kind: r.kind ?? 'quiz',
    payload: r.payload ?? {},
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

    const myCreations = (mine ?? []).map((r: Row) => toContent(r));
    const published = myCreations.filter((q) => q.status === 'approved').length;
    const totalRatings = myCreations.reduce((s, q) => s + q.ratingCount, 0);

    return apiSuccess({
      myCreations,
      community: (community ?? []).map((r: Row) => toContent(r)),
      badges: earnedCreatorBadges({ published, totalRatings }),
      stats: { published, totalRatings },
    });
  } catch (err) {
    console.error('[ugc:get]', err);
    return apiError('Failed to fetch content', 500);
  }
}

// ─── POST: create a quiz / agent / prompt (submitted for moderation) ───
// Back-compat: an omitted `kind` is treated as a quiz, so existing quiz
// clients keep working unchanged.
const CreateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('quiz'),
    childId: z.string().uuid(),
    title: z.string().min(1).max(64),
    questionIds: z.array(z.string().max(64)).min(1).max(8),
  }),
  z.object({
    kind: z.literal('agent'),
    childId: z.string().uuid(),
    title: z.string().min(1).max(64),
    compositionId: z.string().min(1).max(64),
    summary: z.string().max(160).optional(),
  }),
  z.object({
    kind: z.literal('prompt'),
    childId: z.string().uuid(),
    title: z.string().min(1).max(64),
    text: z.string().min(1).max(400),
    band: z.enum(['A', 'B', 'C']),
  }),
]);
// Tolerate a missing `kind` (legacy quiz clients) by defaulting before parse.
const LegacyOrKinded = z.preprocess(
  (v) => (v && typeof v === 'object' && !('kind' in v) ? { ...v, kind: 'quiz' } : v),
  CreateSchema,
);

/**
 * Child-safety screen for free-text prompts: fast blocklist (always) then
 * Haiku LLM moderation (when configured). Returns a reason when unsafe.
 */
async function screenPromptText(text: string, band: 'A' | 'B' | 'C'): Promise<string | null> {
  const blocked = checkBlocklist(text);
  if (blocked) return blocked.reason ?? 'That prompt can’t be shared.';
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const result = await checkHaikuModeration(text, band, anthropic);
    if (!result.safe) return result.reason ?? 'That prompt can’t be shared.';
  }
  return null;
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'ugc-create', undefined, RATE_LIMITS.ugcWrite);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const dup = await checkDuplicate(req, auth.user.id);
  if (dup) return dup;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = LegacyOrKinded.safeParse(body);
  if (!parsed.success) return apiError('Invalid creation payload', 400);

  const data = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, data.childId))) {
    return apiError('Child not found', 404);
  }

  // Build the row per kind, applying the right safety gate before insert.
  let row: Record<string, unknown>;

  if (data.kind === 'quiz') {
    // COPPA gate: title from the safe generator, questions from the bank only.
    const check = validateQuiz(data.title, data.questionIds);
    if (!check.valid) return apiError(check.reason ?? 'Invalid quiz', 422, 'INVALID_QUIZ');
    row = { kind: 'quiz', title: data.title, question_ids: data.questionIds, payload: {} };
  } else if (data.kind === 'agent') {
    const check = validateAgentPublish({ compositionId: data.compositionId, name: data.title });
    if (!check.valid) return apiError(check.reason ?? 'Invalid agent', 422, 'INVALID_AGENT');
    row = {
      kind: 'agent',
      title: data.title,
      question_ids: [],
      payload: { compositionId: data.compositionId, name: data.title, summary: data.summary ?? '' },
    };
  } else {
    // prompt — the only child-authored free-text kind.
    const structural = validatePromptText(data.text);
    if (!structural.valid) return apiError(structural.reason ?? 'Invalid prompt', 422, 'INVALID_PROMPT');
    const unsafe = await screenPromptText(data.text.trim(), data.band);
    if (unsafe) return apiError(unsafe, 422, 'UNSAFE_PROMPT');
    row = {
      kind: 'prompt',
      title: data.title,
      question_ids: [],
      payload: { text: data.text.trim(), band: data.band },
    };
  }

  const supabase = createAdminClient();

  try {
    // Everything lands as 'pending' — nothing is world-readable until a
    // parent approves it via /api/ugc/moderate (RLS enforces this too).
    const { data: inserted, error } = await supabase
      .from('user_content')
      .insert({ creator_child_id: data.childId, status: 'pending', ...row })
      .select('id')
      .single();

    if (error) {
      console.error('[ugc:create:insert]', error);
      return apiError('Failed to create', 500);
    }

    return apiSuccess({
      id: inserted.id,
      status: 'pending',
      kind: data.kind,
      message: 'Submitted for a grown-up to review',
    });
  } catch (err) {
    console.error('[ugc:create]', err);
    return apiError('Failed to create', 500);
  }
}
