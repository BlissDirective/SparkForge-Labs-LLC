// ════════════════════════════════════════════════════
// AGENT SCHEDULE — Vercel cron trigger (daily 6 AM UTC)
// Secured by CRON_SECRET header verification
// v2 [S9-WARN-003]: CRON_SECRET required in production
// v2 [S9-INFO-001]: Uses apiSuccess/apiError helpers
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, sanitizeErrorMessage } from '@/lib/api-helpers';
import { runAgentPipeline, type PipelineMode } from '@/lib/agent/pipeline';
import { verifyCronBearer } from '@/lib/cron-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // T17 DEPLOY-MED-003: shared verifyCronBearer helper (timing-safe).
  const denial = verifyCronBearer(req, { routeName: 'agent-schedule' });
  if (denial) return denial;

  // Skip if API key not configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return apiSuccess({ skipped: true, reason: 'ANTHROPIC_API_KEY not configured' });
  }

  // Skip if feature flag disabled
  if (process.env.ENABLE_CONTENT_AGENT === 'false') {
    return apiSuccess({
      skipped: true,
      reason: 'Content agent disabled via ENABLE_CONTENT_AGENT=false',
    });
  }

  // Phase 3: Schedule runs in 'enhanced' mode (includes game scenarios + challenges)
  const url = new URL(req.url);
  const mode = (url.searchParams.get('mode') || 'enhanced') as PipelineMode;

  try {
    const result = await runAgentPipeline(mode);
    return apiSuccess(result);
  } catch (e: unknown) {
    // API-MED-002 (B): log full error server-side; sanitize response.
    console.error('[agent/schedule] pipeline failed:', e);
    return apiError(
      sanitizeErrorMessage(e, 'Agent pipeline failed'),
      500,
      'SERVER_ERROR',
    );
  }
}
