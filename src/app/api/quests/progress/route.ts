// ════════════════════════════════════════════════════
// POST /api/quests/progress — Update quest progress
// Called by game sessions, pet care, etc. to advance quests
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const ProgressSchema = z.object({
  childId: z.string().uuid(),
  type: z.string(), // Event type: game_complete, xp_earned, pet_care, etc.
  amount: z.number().int().positive().default(1),
  metadata: z.record(z.unknown()).optional(),
});

// Map event types to quest types
const EVENT_TO_QUEST_TYPE: Record<string, string[]> = {
  game_complete: ['play_games'],
  game_start: ['play_games'],
  xp_earned: ['earn_xp'],
  streak_update: ['streak_maintain'],
  pet_care: ['pet_care'],
  pet_feed: ['pet_care'],
  pet_play: ['pet_care'],
  pet_clean: ['pet_care'],
  pet_trick: ['learn_tricks'],
  lab_visit: ['lab_explore'],
  perfect_score: ['perfect_score'],
  time_played: ['play_time'],
  gems_earned: ['earn_gems'],
};

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = ProgressSchema.safeParse(body);
  if (!parsed.success) return apiError('Invalid progress data', 400);

  const { childId, type, amount, metadata } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get quest types this event applies to
    const questTypes = EVENT_TO_QUEST_TYPE[type];
    if (!questTypes || questTypes.length === 0) {
      return apiSuccess({ updated: 0, message: 'No matching quest types' });
    }

    // Fetch active quests for today matching these types
    const { data: activeQuests } = await supabase
      .from('active_quests')
      .select('*')
      .eq('child_id', childId)
      .eq('assigned_date', today)
      .eq('status', 'active')
      .in('type', questTypes);

    if (!activeQuests || activeQuests.length === 0) {
      return apiSuccess({ updated: 0, message: 'No active quests for this event' });
    }

    const updatedQuests = [];

    for (const quest of activeQuests) {
      const newProgress = Math.min(
        quest.requirement_count,
        quest.progress + amount
      );
      const isComplete = newProgress >= quest.requirement_count;
      const newStatus = isComplete ? 'completed' : quest.status;

      const { error: updateError } = await supabase
        .from('active_quests')
        .update({
          progress: newProgress,
          status: newStatus,
          ...(isComplete ? {} : {}),
        })
        .eq('id', quest.id);

      if (!updateError) {
        updatedQuests.push({
          questId: quest.id,
          progress: newProgress,
          requirementCount: quest.requirement_count,
          completed: isComplete,
        });
      }
    }

    // Also update weekly chain steps if applicable
    const { data: chainRow } = await supabase
      .from('weekly_quest_chains')
      .select('id, current_step, status')
      .eq('child_id', childId)
      .eq('week_starting', getWeekMonday(today))
      .single();

    if (chainRow && chainRow.status === 'active') {
      const { data: steps } = await supabase
        .from('weekly_chain_steps')
        .select('*')
        .eq('chain_id', chainRow.id)
        .order('step_number', { ascending: true });

      if (steps) {
        const activeStep = steps[chainRow.current_step - 1];
        if (activeStep && activeStep.status === 'active') {
          const stepNewProgress = Math.min(
            activeStep.requirement_count,
            (activeStep.progress ?? 0) + amount
          );
          const stepComplete = stepNewProgress >= activeStep.requirement_count;

          await supabase
            .from('weekly_chain_steps')
            .update({
              progress: stepNewProgress,
              status: stepComplete ? 'completed' : 'active',
            })
            .eq('id', activeStep.id);

          if (stepComplete) {
            // Advance to next step or complete chain
            const nextStep = steps[chainRow.current_step];
            if (nextStep) {
              await supabase
                .from('weekly_chain_steps')
                .update({ status: 'active' })
                .eq('id', nextStep.id);

              await supabase
                .from('weekly_quest_chains')
                .update({ current_step: chainRow.current_step + 1 })
                .eq('id', chainRow.id);
            } else {
              await supabase
                .from('weekly_quest_chains')
                .update({ status: 'completed' })
                .eq('id', chainRow.id);
            }
          }
        }
      }
    }

    return apiSuccess({
      updated: updatedQuests.length,
      quests: updatedQuests,
    });
  } catch (err) {
    console.error('[quests:progress]', err);
    return apiError('Failed to update quest progress', 500);
  }
}

function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}
