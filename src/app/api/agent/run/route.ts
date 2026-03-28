// ════════════════════════════════════════════════════
// AGENT RUN — Manual trigger (admin-only)
// v2 [ENH-9A]: Graceful 503 if API key missing
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, applyRateLimit } from '@/lib/api-helpers';
import { runAgentPipeline, type PipelineMode } from '@/lib/agent/pipeline';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest) {
  // v2 [S9-WARN-001]: Rate limit expensive pipeline runs (2/hr)
  const limited = applyRateLimit(_req, 'agent-run', undefined, RATE_LIMITS.contentAgent);
  if (limited) return limited;

  // v2 [ENH-9A]: Check for API key before proceeding
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(
      'Content Agent is not configured. Add ANTHROPIC_API_KEY to your .env.local file.',
      503,
      'AGENT_NOT_CONFIGURED'
    );
  }

  // Admin auth check
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError('Unauthorized', 401, 'AUTH_REQUIRED');
  }

  const { data: parent } = await supabase
    .from('parents')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!parent?.is_admin) {
    return apiError(
      'Admin access required. Run: UPDATE parents SET is_admin = true WHERE email = \'your@email.com\'; in Supabase SQL Editor.',
      403,
      'FORBIDDEN'
    );
  }

  // Phase 1: Support pipeline mode via query param (?mode=standard|enhanced|full)
  const url = new URL(_req.url);
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
