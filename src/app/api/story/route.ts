// ════════════════════════════════════════════════════
// GET /api/story — campaigns + this child's narrative progress
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import {
  STORY_CAMPAIGNS, emptyProgress, storyPercent, type StoryProgress, type ChoicePath,
} from '@/lib/story/StoryEngine';

interface Row {
  campaign_id: string;
  current_chapter: number;
  choices: ChoicePath[] | null;
  completed: boolean;
  ending_id: string | null;
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
    const { data: rows } = await supabase
      .from('story_progress')
      .select('campaign_id, current_chapter, choices, completed, ending_id')
      .eq('child_id', childId);

    const byId = new Map<string, Row>((rows ?? []).map((r: Row) => [r.campaign_id, r]));

    const campaigns = STORY_CAMPAIGNS.map((c) => {
      const row = byId.get(c.id);
      const progress: StoryProgress = row
        ? {
            campaignId: c.id,
            childId,
            currentChapter: row.current_chapter,
            choices: row.choices ?? [],
            completed: row.completed,
            endingId: row.ending_id,
          }
        : emptyProgress(c.id, childId);
      return { campaign: c, progress, percent: storyPercent(c, progress) };
    });

    return apiSuccess({ campaigns });
  } catch (err) {
    console.error('[story:get]', err);
    return apiError('Failed to fetch story', 500);
  }
}
