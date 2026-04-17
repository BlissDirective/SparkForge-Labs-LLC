// ════════════════════════════════════════════════════
// AGENT RUN — Manual trigger (admin-only)
// v2 [ENH-9A]: Graceful 503 if API key missing
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, applyRateLimit, requireAdmin } from '@/lib/api-helpers';
import { runAgentPipeline, type PipelineMode } from '@/lib/agent/pipeline';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // v2 [S9-WARN-001]: Rate limit expensive pipeline runs (2/hr)
  const limited = await applyRateLimit(req, 'agent-run', undefined, RATE_LIMITS.contentAgent);
  if (limited) return limited;

  // v2 [ENH-9A]: Check for API key before proceeding
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(
      'Content Agent is not configured. Add ANTHROPIC_API_KEY to your .env.local file.',
      503,
      'AGENT_NOT_CONFIGURED'
    );
  }

  // API-CRIT-002 (8B): Use centralized requireAdmin(). Do not re-implement
  // admin checks — all routes must go through api-helpers so policy changes
  // (e.g. adding COPPA gating) apply consistently. Error message is generic;
  // NEVER leak SQL instructions or schema hints to clients.
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

  // Phase 1: Support pipeline mode via query param (?mode=standard|enhanced|full)
  const url = new URL(req.url);
  const mode = (url.searchParams.get('mode') || 'enhanced') as PipelineMode;
  const validModes: PipelineMode[] = ['standard', 'enhanced', 'full'];
  const pipelineMode = validModes.includes(mode) ? mode : 'enhanced';

  try {
    const result = await runAgentPipeline(pipelineMode);
    return apiSuccess(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return apiError(`Agent pipeline failed: ${message}`, 500, 'SERVER_ERROR');
  }
}
