// ════════════════════════════════════════════════════
// POST /api/story/reset — reset a campaign to replay it for a
// different ending. Body: { childId, campaignId }
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { getCampaign } from '@/lib/story/StoryEngine';

const Schema = z.object({ childId: z.string().uuid(), campaignId: z.string().max(64) });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId and campaignId required', 400);

  const { childId, campaignId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }
  if (!getCampaign(campaignId)) return apiError('Campaign not found', 404);

  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from('story_progress')
      .upsert(
        {
          child_id: childId,
          campaign_id: campaignId,
          current_chapter: 1,
          choices: [],
          completed: false,
          ending_id: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'child_id,campaign_id' },
      );

    if (error) {
      console.error('[story:reset:upsert]', error);
      return apiError('Failed to reset story', 500);
    }

    return apiSuccess({ reset: true });
  } catch (err) {
    console.error('[story:reset]', err);
    return apiError('Failed to reset story', 500);
  }
}
