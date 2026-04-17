// ════════════════════════════════════════════════════
// ARCHITECT PIPELINE — Phase 8: Admin-triggered 3D/UI generation
// POST /api/agent/architect — Generate R3F components for content
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, applyRateLimit, requireAdmin } from '@/lib/api-helpers';
import { runArchitectPipeline } from '@/lib/agent/architect-pipeline';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const ArchitectRequestSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.string(),
  contentTitle: z.string().min(1).max(500),
  contentBody: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  // Rate limit (shares contentAgent limit — 2/hr)
  const limited = await applyRateLimit(req, 'architect-run', undefined, RATE_LIMITS.contentAgent);
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError('Architect pipeline not configured. Add ANTHROPIC_API_KEY.', 503, 'AGENT_NOT_CONFIGURED');
  }

  // API-CRIT-002 (8B): Centralized admin check via requireAdmin().
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

  // Parse body
  let body: z.infer<typeof ArchitectRequestSchema>;
  try {
    const raw = await req.json();
    const parsed = ArchitectRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return apiError(`Validation: ${parsed.error.issues.map(i => i.message).join(', ')}`, 400, 'VALIDATION_ERROR');
    }
    body = parsed.data;
  } catch {
    return apiError('Invalid request body', 400, 'PARSE_ERROR');
  }

  try {
    const result = await runArchitectPipeline(
      body.contentId,
      body.contentType as Parameters<typeof runArchitectPipeline>[1],
      body.contentTitle,
      body.contentBody,
    );
    return apiSuccess(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return apiError(`Architect pipeline failed: ${message}`, 500, 'SERVER_ERROR');
  }
}
