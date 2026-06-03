// ════════════════════════════════════════════════════
// GET /api/quests — Fetch today's active quests
// POST /api/quests — Generate and assign daily quests
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import {
  selectDailyQuests,
  QUEST_TEMPLATES,
  createWeeklyChain,
  WEEKLY_CHAIN_TEMPLATES,
} from '@/lib/quests/QuestEngine';
import type { ActiveQuest, WeeklyQuestChain } from '@/lib/quests/QuestEngine';

// ─── GET: Fetch active quests for today ───
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');

  if (!childId) return apiError('childId required', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Fetch active quests
    const { data: questRows } = await supabase
      .from('active_quests')
      .select('*')
      .eq('child_id', childId)
      .eq('assigned_date', today)
      .order('created_at', { ascending: true });

    // Fetch weekly chain
    const { data: chainRows } = await supabase
      .from('weekly_quest_chains')
      .select('*, weekly_chain_steps(*)')
      .eq('child_id', childId)
      .eq('week_starting', getWeekMonday(today))
      .single();

    // Get streak days for bonus calculation
    const { data: childRow } = await supabase
      .from('children')
      .select('streak_count')
      .eq('id', childId)
      .single();

    const quests: ActiveQuest[] = (questRows ?? []).map((r) => ({
      id: r.id,
      templateId: r.template_id,
      childId: r.child_id,
      status: r.status,
      progress: r.progress,
      requirementCount: r.requirement_count,
      assignedDate: r.assigned_date,
      expiresAt: r.expires_at,
      claimedAt: r.claimed_at,
      createdAt: r.created_at,
      title: r.title,
      description: r.description,
      emoji: r.emoji,
      difficulty: r.difficulty,
      rarity: r.rarity,
      type: r.type,
      xpReward: r.xp_reward,
      gemReward: r.gem_reward,
      sparkyExpression: r.sparky_expression,
    }));

    const weeklyChain: WeeklyQuestChain | null = chainRows
      ? {
          id: chainRows.id,
          childId: chainRows.child_id,
          weekStarting: chainRows.week_starting,
          steps: (chainRows.weekly_chain_steps ?? []).map((s: Record<string, unknown>) => ({
            stepNumber: s.step_number,
            title: s.title,
            description: s.description,
            emoji: s.emoji,
            requirementCount: s.requirement_count,
            progress: s.progress,
            xpReward: s.xp_reward,
            gemReward: s.gem_reward,
            status: s.status,
          })),
          currentStep: chainRows.current_step,
          status: chainRows.status,
          totalSteps: chainRows.total_steps,
        }
      : null;

    return apiSuccess({
      quests,
      weeklyChain,
      streakDays: childRow?.streak_count ?? 0,
    });
  } catch (err) {
    console.error('[quests:get]', err);
    return apiError('Failed to fetch quests', 500);
  }
}

// ─── POST: Generate and assign daily quests ───
const AssignSchema = z.object({ childId: z.string().uuid() });

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
  if (!parsed.success) {
    // Try query param fallback
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');
    if (!childId) return apiError('childId required', 400);
    if (!(await verifyChildOwnership(auth.user.id, childId))) {
      return apiError('Child not found', 404);
    }
    return assignQuests(childId);
  }

  const { childId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  return assignQuests(childId);
}

// ─── Helper: Generate and insert quests ───
async function assignQuests(childId: string) {
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split('T')[0];
  const seed = `${childId}-${today}`;

  // Check if already assigned today
  const { data: existing } = await supabase
    .from('active_quests')
    .select('id')
    .eq('child_id', childId)
    .eq('assigned_date', today);

  if ((existing ?? []).length > 0) {
    return apiError('Quests already assigned for today', 409);
  }

  // Select daily quests
  const selected = selectDailyQuests(QUEST_TEMPLATES, seed);

  // Insert active quests
  const questInserts = selected.map((t) => ({
    child_id: childId,
    template_id: t.id,
    status: 'active' as const,
    progress: 0,
    requirement_count: t.requirementCount,
    assigned_date: today,
    expires_at: today,
    claimed_at: null,
    title: t.title,
    description: t.description,
    emoji: t.emoji,
    difficulty: t.difficulty,
    rarity: t.rarity,
    type: t.type,
    xp_reward: t.xpReward,
    gem_reward: t.gemReward,
    sparky_expression: t.sparkyExpression,
  }));

  const { data: insertedQuests, error: questError } = await supabase
    .from('active_quests')
    .insert(questInserts)
    .select();

  if (questError) {
    console.error('[quests:assign:insert]', questError);
    return apiError('Failed to assign quests', 500);
  }

  // Assign weekly chain if none active for this week
  const weekMonday = getWeekMonday(today);
  const { data: existingChain } = await supabase
    .from('weekly_quest_chains')
    .select('id')
    .eq('child_id', childId)
    .eq('week_starting', weekMonday)
    .single();

  if (!existingChain) {
    // Pick a random chain template
    const chainIndex = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % WEEKLY_CHAIN_TEMPLATES.length;
    const chainTemplate = WEEKLY_CHAIN_TEMPLATES[chainIndex];
    const chain = createWeeklyChain(chainTemplate, childId, weekMonday);

    const { data: insertedChain, error: chainError } = await supabase
      .from('weekly_quest_chains')
      .insert({
        id: chain.id,
        child_id: childId,
        week_starting: weekMonday,
        current_step: 1,
        status: 'active',
        total_steps: chain.totalSteps,
      })
      .select()
      .single();

    if (!chainError && insertedChain) {
      await supabase.from('weekly_chain_steps').insert(
        chain.steps.map((s) => ({
          chain_id: insertedChain.id,
          step_number: s.stepNumber,
          title: s.title,
          description: s.description,
          emoji: s.emoji,
          requirement_count: s.requirementCount,
          progress: 0,
          xp_reward: s.xpReward,
          gem_reward: s.gemReward,
          status: s.status,
        }))
      );
    }
  }

  return apiSuccess({
    quests: insertedQuests ?? [],
    message: 'Quests assigned successfully',
  });
}

// ─── Helper: Get Monday of current week ───
function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}
