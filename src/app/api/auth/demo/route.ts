// POST /api/auth/demo — Initialize demo session (no auth required)
// Returns a temporary session token for demo access
import { NextRequest } from 'next/server';
import { apiSuccess, applyRateLimit } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  // Rate limit demo creation (3 per hour per IP)
  const limited = applyRateLimit(req, 'demo-session', undefined, {
    maxRequests: 3,
    windowMs: 3600000,
  });
  if (limited) return limited;

  const demoId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  return apiSuccess({
    demoId,
    expiresAt,
    message: 'Demo session started. You have 1 hour to explore SparkForge.',
  });
}
