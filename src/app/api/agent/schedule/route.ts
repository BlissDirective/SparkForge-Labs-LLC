// ════════════════════════════════════════════════════
// AGENT SCHEDULE — Vercel cron trigger (daily 6 AM UTC)
// Secured by CRON_SECRET header verification
// ════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agent/pipeline';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this as Bearer token)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Skip if API key not configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { skipped: true, reason: 'ANTHROPIC_API_KEY not configured' },
      { status: 200 }
    );
  }

  // Skip if feature flag disabled
  if (process.env.ENABLE_CONTENT_AGENT === 'false') {
    return NextResponse.json(
      {
        skipped: true,
        reason: 'Content agent disabled via ENABLE_CONTENT_AGENT=false',
      },
      { status: 200 }
    );
  }

  try {
    const result = await runAgentPipeline();
    return NextResponse.json({ success: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Cron agent run failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
