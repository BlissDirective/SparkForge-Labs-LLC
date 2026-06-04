// ════════════════════════════════════════════════════
// POST /api/story/advance — record a chapter choice and advance.
// Body: { childId, campaignId, chapterIndex, choice }
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { getCampaign, emptyProgress, advanceChapter, type ChoicePath, type StoryProgress } from '@/lib/story/StoryEngine';

const Schema = z.object({
  childId: z.string().uuid(),
  campaignId: z.string().max(64),
  chapterIndex: z.number().int().min(1).max(10),
  choice: z.enum(['explore', 'guard']),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId, campaignId, chapterIndex and choice required', 400);

  const { childId, campaignId, chapterIndex, choice } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const campaign = getCampaign(campaignId);
  if (!campaign) return apiError('Campaign not found', 404);

  const supabase = createAdminClient();

  try {
    const { data: row } = await supabase
      .from('story_progress')
      .select('current_chapter, choices, completed, ending_id')
      .eq('child_id', childId)
      .eq('campaign_id', campaignId)
      .maybeSingle();

    const progress: StoryProgress = row
      ? {
          campaignId, childId,
          currentChapter: row.current_chapter,
          choices: (row.choices as ChoicePath[]) ?? [],
          completed: row.completed,
          endingId: row.ending_id,
        }
      : emptyProgress(campaignId, childId);

    if (chapterIndex !== progress.currentChapter) {
      return apiError('Not the current chapter', 409, 'OUT_OF_ORDER');
    }

    const next = advanceChapter(campaign, progress, chapterIndex, choice as ChoicePath);

    const { error } = await supabase
      .from('story_progress')
      .upsert(
        {
          child_id: childId,
          campaign_id: campaignId,
          current_chapter: next.currentChapter,
          choices: next.choices,
          completed: next.completed,
          ending_id: next.endingId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'child_id,campaign_id' },
      );

    if (error) {
      console.error('[story:advance:upsert]', error);
      return apiError('Failed to advance story', 500);
    }

    return apiSuccess({
      currentChapter: next.currentChapter,
      completed: next.completed,
      endingId: next.endingId,
    });
  } catch (err) {
    console.error('[story:advance]', err);
    return apiError('Failed to advance story', 500);
  }
}
