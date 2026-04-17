// GET /api/health — Health check endpoint
// v2 [NEW-2C]: Returns app status, DB connectivity, version, timestamp.
// API-CRIT-001 (7B): Uses anon Supabase client, NOT admin. The badges table
// has a public SELECT RLS policy (`badges_read` in sql/002_rls.sql) so the
// connectivity probe works without elevated privileges.
//
// NEVER use createAdminClient() in public route handlers. The service-role
// key bypasses ALL RLS policies — reserved strictly for Stripe webhooks,
// cron jobs, and the admin-gated agent pipeline.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(_req: NextRequest) {
  const start = Date.now();

  let dbStatus = 'ok';

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from('badges')
      .select('id', { count: 'exact', head: true });
    if (error) dbStatus = 'error';
  } catch {
    dbStatus = 'error';
  }

  const responseTime = Date.now() - start;

  return NextResponse.json({
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    responseTimeMs: responseTime,
    environment: process.env.NODE_ENV || 'development',
  }, {
    status: dbStatus === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-cache, no-store' },
  });
}
