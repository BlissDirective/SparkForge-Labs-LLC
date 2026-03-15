// POST /api/ai/prompt-lab — Moderated AI chat for kids
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabase } from '@/lib/supabase/server';
import { PromptLabSchema } from '@/lib/validations';
import {
  apiSuccess, apiError, parseBody, requireAuth,
  verifyChildOwnership, applyRateLimit,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { TIER_CONFIG } from '@/lib/tier-config';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  A: `You are Sparky, a friendly AI tutor for kids ages 7-10. Use simple words, fun analogies, and lots of encouragement. Keep responses under 150 words. If asked about anything inappropriate, gently redirect to a fun science or technology topic.`,
  B: `You are Sparky, an AI tutor for kids ages 11-13. Explain concepts clearly with good examples. Keep responses under 200 words. Encourage curiosity and deeper thinking. If asked about anything inappropriate, gently redirect to an interesting STEM topic.`,
  C: `You are Sparky, an AI tutor for teens ages 14-16. You can discuss complex topics at an appropriate level. Keep responses under 250 words. Encourage critical thinking and exploration. If asked about anything inappropriate, redirect to a relevant educational topic.`,
};

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'prompt-lab', undefined, RATE_LIMITS.promptLab);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, PromptLabSchema);
  if (!parsed.success) return parsed.response;

  const { childId, prompt, temperature, ageBand } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();

  const { data: child } = await supabase
    .from('children')
    .select('prompts_used_today, prompts_reset_date')
    .eq('id', childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  const today = new Date().toISOString().split('T')[0];
  const usedToday = child.prompts_reset_date === today ? child.prompts_used_today : 0;
  const dailyLimit = TIER_CONFIG[auth.user.tier].promptsPerDay;

  if (usedToday >= dailyLimit) {
    return apiError(
      `You've used all ${dailyLimit} prompts for today. Come back tomorrow!`,
      429, 'TIER_LIMIT'
    );
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature,
      system: SYSTEM_PROMPTS[ageBand] || SYSTEM_PROMPTS.A,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = message.content
      .filter(block => block.type === 'text')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(block => (block as any).text)
      .join('');

    await supabase.from('prompt_history').insert({
      child_id: childId, prompt, response: reply,
      temperature, age_band: ageBand, moderation_passed: true,
    });

    await supabase.from('children').update({
      prompts_used_today: usedToday + 1, prompts_reset_date: today,
    }).eq('id', childId);

    return apiSuccess({ reply, promptsRemaining: dailyLimit - usedToday - 1 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.status === 429) return apiError('Sparky is taking a quick break. Try again in a moment!', 429);
    return apiError('Sparky had a hiccup. Please try again!', 500);
  }
}
