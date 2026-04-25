// ════════════════════════════════════════════════════
// AI GUIDE — Phase 5: SSE streaming conversation endpoint
// POST /api/ai/guide — Streamed Claude response for guide avatar
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiError, requireAuth, verifyChildOwnership, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { MODELS } from '@/lib/agent/prompts';
import { assembleGuidePrompt } from '@/lib/guide/prompts';


export const runtime = 'nodejs';

const GuideMessageSchema = z.object({
  childId: z.string().uuid(),
  message: z.string().min(1).max(1000),
  context: z.enum(['cockpit', 'lab', 'game', 'profile', 'settings']),
  ageBand: z.enum(['A', 'B', 'C']),
  labId: z.number().int().min(1).max(10).optional(),
  gameId: z.string().optional(),
  conversationId: z.string().uuid().optional(),
  childName: z.string().max(50).optional(),
  childProgress: z.object({
    xp: z.number(),
    level: z.number(),
    streak: z.number(),
  }).optional(),
});

// Guide turn limits by tier
const GUIDE_LIMITS: Record<string, number> = {
  free: 10,
  plus: 50,
  forge: 200,
};

export async function POST(req: NextRequest) {
  // Graceful 503 if API key missing
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError('AI Guide not configured. Add ANTHROPIC_API_KEY.', 503, 'SERVICE_UNAVAILABLE');
  }

  // Rate limit
  const limited = await applyRateLimit(req, 'guide', undefined, RATE_LIMITS.promptLab);
  if (limited) return limited;

  // Auth
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  // Parse body
  let body: z.infer<typeof GuideMessageSchema>;
  try {
    const raw = await req.json();
    const parsed = GuideMessageSchema.safeParse(raw);
    if (!parsed.success) {
      return apiError(`Validation error: ${parsed.error.issues.map(i => i.message).join(', ')}`, 400, 'VALIDATION_ERROR');
    }
    body = parsed.data;
  } catch {
    return apiError('Invalid request body', 400, 'PARSE_ERROR');
  }

  // Verify child ownership
  if (!(await verifyChildOwnership(auth.user.id, body.childId))) {
    return apiError('Child not found', 404);
  }

  // Check tier-based turn limit
  const dailyLimit = GUIDE_LIMITS[auth.user.tier] || GUIDE_LIMITS.free;
  const supabase = await createServerSupabase();

  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', body.childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  // Assemble system prompt
  const systemPrompt = assembleGuidePrompt(
    body.ageBand,
    body.context,
    body.labId,
    body.gameId,
    body.childName,
    body.childProgress
  );

  // Create Anthropic client (lazy)
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Stream response via SSE
  const encoder = new TextEncoder();
  const conversationId = body.conversationId || crypto.randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send conversation start event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'start', conversationId })}\n\n`)
        );

        const response = await anthropic.messages.create({
          model: MODELS.moderation, // Haiku for fast, cost-effective guide responses
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: 'user', content: body.message }],
          stream: true,
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta') {
            const delta = event.delta;
            if ('text' in delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: delta.text })}\n\n`)
              );
            }
          }
        }

        // Send completion event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done', turnsRemaining: Math.max(0, dailyLimit - 1) })}\n\n`)
        );

        controller.close();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Stream error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
