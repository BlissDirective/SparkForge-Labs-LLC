// ════════════════════════════════════════════════════
// GAME GENERATOR — Phase 9: Admin-triggered new game creation
// POST /api/agent/game-generator — Generate complete new games
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  apiSuccess,
  apiError,
  applyRateLimit,
  requireAdmin,
  sanitizeErrorMessage,
} from '@/lib/api-helpers';
import { runGameGeneratorPipeline } from '@/lib/agent/game-generator-pipeline';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const GameGeneratorSchema = z.object({
  targetLab: z.number().int().min(1).max(10).optional(),
  targetTier: z.enum(['flagship', 'fl-lite', 'standard']).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit (2/hr — same as content agent)
  const limited = await applyRateLimit(req, 'game-generator', undefined, RATE_LIMITS.contentAgent);
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError('Game generator not configured. Add ANTHROPIC_API_KEY.', 503, 'AGENT_NOT_CONFIGURED');
  }

  // API-CRIT-002 (8B): Centralized admin check via requireAdmin().
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

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
    // API-MED-002 (B): log full error server-side; sanitize response.
    console.error('[agent/game-generator] failed:', e);
    return apiError(
      sanitizeErrorMessage(e, 'Game generator failed'),
      500,
      'SERVER_ERROR',
    );
  }
}
