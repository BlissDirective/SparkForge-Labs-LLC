// ════════════════════════════════════════════════════
// GET  /api/buddy-quests — list this week's collaborative quests
// POST /api/buddy-quests — assign weekly buddy quests with a buddy
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { BUDDY_QUEST_TEMPLATES, type BuddyQuest } from '@/lib/social/SocialEngine';

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

// ─── GET ───
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = new URL(req.url).searchParams.get('childId');
  if (!childId) return apiError('childId required', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();
  const week = getWeekMonday(new Date().toISOString().split('T')[0]);

  try {
    const { data: rows } = await supabase
      .from('buddy_quests')
      .select('*')
      .eq('child_id', childId)
      .eq('week_starting', week)
      .order('created_at', { ascending: true });

    const quests: BuddyQuest[] = (rows ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      emoji: r.emoji,
      childId: r.child_id,
      buddyId: r.buddy_id,
      requirementCount: r.requirement_count,
      myProgress: r.my_progress,
      buddyProgress: r.buddy_progress,
      status: r.status,
      xpReward: r.xp_reward,
      gemReward: r.gem_reward,
      weekStarting: r.week_starting,
      createdAt: r.created_at,
    }));

    return apiSuccess({ quests });
  } catch (err) {
    console.error('[buddy-quests:get]', err);
    return apiError('Failed to fetch buddy quests', 500);
  }
}

// ─── POST: assign weekly buddy quests with a buddy ───
const AssignSchema = z.object({
  childId: z.string().uuid(),
  buddyId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) return apiError('childId and buddyId required', 400);

  const { childId, buddyId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();
  const week = getWeekMonday(new Date().toISOString().split('T')[0]);
  const pk = pairKey(childId, buddyId);

  try {
    // Must be active buddies.
    const { data: conn } = await supabase
      .from('friend_connections')
      .select('status')
      .eq('child_id', childId)
      .eq('buddy_id', buddyId)
      .single();
    if (!conn || conn.status !== 'active') {
      return apiError('Buddy connection is not active', 403);
    }

    // Idempotent per week + pair.
    const { data: existing } = await supabase
      .from('buddy_quests')
      .select('id')
      .eq('pair_key', pk)
      .eq('week_starting', week)
      .limit(1);
    if ((existing ?? []).length > 0) {
      return apiError('Buddy quests already assigned this week', 409);
    }

    // Pick 2 templates deterministically from the pair+week seed.
    const seed = `${pk}-${week}`.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const t1 = BUDDY_QUEST_TEMPLATES[seed % BUDDY_QUEST_TEMPLATES.length];
    const t2 = BUDDY_QUEST_TEMPLATES[(seed + 1) % BUDDY_QUEST_TEMPLATES.length];
    const chosen = [t1, t2];

    // Insert mirrored rows for both children so each sees their own view.
    const rows = chosen.flatMap((t) => [
      {
        pair_key: pk, child_id: childId, buddy_id: buddyId, template_key: t.key,
        title: t.title, description: t.description, emoji: t.emoji,
        requirement_count: t.requirementCount, my_progress: 0, buddy_progress: 0,
        status: 'active' as const, xp_reward: t.xpReward, gem_reward: t.gemReward, week_starting: week,
      },
      {
        pair_key: pk, child_id: buddyId, buddy_id: childId, template_key: t.key,
        title: t.title, description: t.description, emoji: t.emoji,
        requirement_count: t.requirementCount, my_progress: 0, buddy_progress: 0,
        status: 'active' as const, xp_reward: t.xpReward, gem_reward: t.gemReward, week_starting: week,
      },
    ]);

    const { error } = await supabase.from('buddy_quests').insert(rows);
    if (error) {
      console.error('[buddy-quests:assign:insert]', error);
      return apiError('Failed to assign buddy quests', 500);
    }

    return apiSuccess({ assigned: chosen.length, message: 'Buddy quests assigned' });
  } catch (err) {
    console.error('[buddy-quests:assign]', err);
    return apiError('Failed to assign buddy quests', 500);
  }
}
