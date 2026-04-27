// POST /api/ai/prompt-lab — Moderated AI chat for kids
// v2 [BUG-9A]: Lazy Anthropic init — no top-level crash if key missing
// v2 [BUG-9B]: Uses centralized MODELS config from prompts.ts
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
import { MODELS } from '@/lib/agent/prompts';
import { moderateResponse } from '@/lib/agent/moderation';

// COPPA-PRD-B (C1): age ranges aligned to canonical bands in src/lib/utils.ts
// (A=7-9, B=10-12, C=13-16). The under-13 cutoff falls between B and C, which
// matters for the "13+ can use Prompt Lab" gate elsewhere in the codebase.
const SYSTEM_PROMPTS: Record<string, string> = {
  A: `You are Sparky, a friendly AI tutor for kids ages 7-9. Use simple words, fun analogies, and lots of encouragement. Keep responses under 150 words. If asked about anything inappropriate, gently redirect to a fun science or technology topic.`,
  B: `You are Sparky, an AI tutor for kids ages 10-12. Explain concepts clearly with good examples. Keep responses under 200 words. Encourage curiosity and deeper thinking. If asked about anything inappropriate, gently redirect to an interesting STEM topic.`,
  C: `You are Sparky, an AI tutor for teens ages 13-16. You can discuss complex topics at an appropriate level. Keep responses under 250 words. Encourage critical thinking and exploration. If asked about anything inappropriate, redirect to a relevant educational topic.`,
};

export async function POST(req: NextRequest) {
  // v2 [ENH-9A]: Graceful 503 if ANTHROPIC_API_KEY missing
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(
      'Prompt Lab is not configured. Add ANTHROPIC_API_KEY to .env.local.',
      503, 'SERVICE_UNAVAILABLE'
    );
  }

  const limited = await applyRateLimit(req, 'prompt-lab', undefined, RATE_LIMITS.promptLab);
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

  // v2 [BUG-9A]: Lazy init — SDK instantiated per-request, not at module level
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await anthropic.messages.create({
      // v2 [BUG-9B]: Centralized model string from MODELS config
      model: MODELS.moderation,
      max_tokens: 300,
      temperature,
      system: SYSTEM_PROMPTS[ageBand] || SYSTEM_PROMPTS.A,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    // v2 [S9-WARN-004]: Post-response safety moderation (Option C: blocklist + Haiku)
    const moderation = await moderateResponse(reply, ageBand, anthropic);

    // Always count toward daily limit (prevents abuse via moderation bypass)
    await supabase.from('children').update({
      prompts_used_today: usedToday + 1, prompts_reset_date: today,
    }).eq('id', childId);

    if (!moderation.safe) {
      // Log the blocked response for safety audit trail
      await supabase.from('prompt_history').insert({
        child_id: childId, prompt, response: reply,
        temperature, age_band: ageBand, moderation_passed: false,
      });

      const safeReply = ageBand === 'A'
        ? "Oops! Sparky got a little confused there. Let's talk about something fun instead! What do you want to learn about AI today?"
        : "Hmm, let me try a different approach! Ask me something about AI, machine learning, or technology.";

      return apiSuccess({ reply: safeReply, promptsRemaining: dailyLimit - usedToday - 1, moderated: true });
    }

    await supabase.from('prompt_history').insert({
      child_id: childId, prompt, response: reply,
      temperature, age_band: ageBand, moderation_passed: true,
    });

    return apiSuccess({ reply, promptsRemaining: dailyLimit - usedToday - 1 });
  } catch (error: unknown) {
    const status = error instanceof Error && 'status' in error ? (error as { status: number }).status : undefined;
    if (status === 429) return apiError('Sparky is taking a quick break. Try again in a moment!', 429);
    return apiError('Sparky had a hiccup. Please try again!', 500);
  }
}
