// ════════════════════════════════════════════════════
// GAME GENERATOR — Phase 9: Admin-triggered new game creation
// POST /api/agent/game-generator — Generate complete new games
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, applyRateLimit } from '@/lib/api-helpers';
import { runGameGeneratorPipeline } from '@/lib/agent/game-generator-pipeline';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const GameGeneratorSchema = z.object({
  targetLab: z.number().int().min(1).max(10).optional(),
  targetTier: z.enum(['flagship', 'fl-lite', 'standard']).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit (2/hr — same as content agent)
  const limited = applyRateLimit(req, 'game-generator', undefined, RATE_LIMITS.contentAgent);
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError('Game generator not configured. Add ANTHROPIC_API_KEY.', 503, 'AGENT_NOT_CONFIGURED');
  }

  // Admin auth
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiError('Unauthorized', 401, 'AUTH_REQUIRED');

  const { data: parent } = await supabase
    .from('parents')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!parent?.is_admin) return apiError('Admin access required', 403, 'FORBIDDEN');

  // Parse body
  let body: z.infer<typeof GameGeneratorSchema> = {};
  try {
    const raw = await req.json();
    const parsed = GameGeneratorSchema.safeParse(raw);
    if (parsed.success) body = parsed.data;
  } catch {
    // Empty body is OK — generates with no constraints
  }

  try {
    const result = await runGameGeneratorPipeline(body.targetLab, body.targetTier);
    return apiSuccess(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return apiError(`Game generator failed: ${message}`, 500, 'SERVER_ERROR');
  }
}
