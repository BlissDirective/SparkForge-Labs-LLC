// POST /api/auth/demo — Initialize demo session (no auth required)
// S3-HIGH-002: Sets cookie for middleware to recognize demo users
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  // Rate limit demo creation (3 per hour per IP)
  const limited = applyRateLimit(req, 'demo-session', undefined, {
    maxRequests: 3,
    windowMs: 3600000,
  });
  if (limited) return limited;

  const demoId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  const response = NextResponse.json({
    success: true,
    data: {
      demoId,
      expiresAt,
      message: 'Demo session started. You have 1 hour to explore SparkForge.',
    },
  });

  // Set a cookie so middleware can recognize demo users on dashboard routes
  response.cookies.set('sparkforge-demo-active', '1', {
    path: '/',
    maxAge: 3600, // 1 hour — matches demo duration
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
