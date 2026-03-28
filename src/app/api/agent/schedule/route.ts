// ════════════════════════════════════════════════════
// AGENT SCHEDULE — Vercel cron trigger (daily 6 AM UTC)
// Secured by CRON_SECRET header verification
// v2 [S9-WARN-003]: CRON_SECRET required in production
// v2 [S9-INFO-001]: Uses apiSuccess/apiError helpers
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { runAgentPipeline } from '@/lib/agent/pipeline';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this as Bearer token)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // v2 [S9-WARN-003]: Require CRON_SECRET in production
  if (!cronSecret && process.env.NODE_ENV === 'production') {
    console.error('CRON_SECRET is not set in production — schedule endpoint blocked');
    return apiError('CRON_SECRET required in production', 500, 'CONFIG_ERROR');
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401, 'AUTH_REQUIRED');
  }

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

  try {
    const result = await runAgentPipeline();
    return apiSuccess(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Cron agent run failed:', message);
    return apiError(`Agent pipeline failed: ${message}`, 500, 'SERVER_ERROR');
  }
}
