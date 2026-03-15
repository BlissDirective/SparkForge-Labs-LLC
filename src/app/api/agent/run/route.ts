// ════════════════════════════════════════════════════
// AGENT RUN — Manual trigger (admin-only)
// v2 [ENH-9A]: Graceful 503 if API key missing
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { runAgentPipeline } from '@/lib/agent/pipeline';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest) {
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

  try {
    const result = await runAgentPipeline();
    return apiSuccess(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return apiError(`Agent pipeline failed: ${message}`, 500, 'SERVER_ERROR');
  }
}
