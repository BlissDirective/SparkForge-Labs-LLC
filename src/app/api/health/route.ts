// GET /api/health — Health check endpoint
// v2 [NEW-2C]: Returns app status, DB connectivity, version, timestamp.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const start = Date.now();

  let dbStatus = 'ok';

  try {
    const supabase = createAdminClient();
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
