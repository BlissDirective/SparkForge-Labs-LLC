import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import type { SubscriptionTier } from '@/lib/tier-config';

// ═══ v2: TYPED ERROR CODES ═══

export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  TIER_LIMIT: 'TIER_LIMIT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  BAD_REQUEST: 'BAD_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ═══ STANDARD RESPONSE HELPERS ═══

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: message, code: code || ERROR_CODES.BAD_REQUEST },
    { status }
  );
}

export function apiValidationError(error: ZodError) {
  const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return NextResponse.json(
    { success: false, error: 'Validation failed', details: messages, code: ERROR_CODES.VALIDATION_ERROR },
    { status: 400 }
  );
}

// ═══ REQUEST PARSING ═══

export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const raw = await req.json();
    const result = schema.safeParse(raw);
    if (!result.success) {
      return { success: false, response: apiValidationError(result.error) };
    }
    return { success: true, data: result.data };
  } catch {
    return { success: false, response: apiError('Invalid JSON body', 400) };
  }
}

export function parseQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    return { success: false, response: apiValidationError(result.error) };
  }
  return { success: true, data: result.data };
}

// ═══ AUTHENTICATION ═══

// AUTH-CRIT-002 (2B): Demo sessions are Supabase anonymous users capped at
// 1 hour server-side. Client-side DemoGuard also enforces the limit, but
// this is the authoritative gate.
const DEMO_DURATION_MS = 60 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
  isAdmin: boolean;
  /** True when the session is a Supabase anonymous (demo) user. */
  isDemo: boolean;
}

export async function requireAuth(
  _req: NextRequest
): Promise<{ success: true; user: AuthenticatedUser } | { success: false; response: NextResponse }> {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      response: apiError('Not authenticated', 401, ERROR_CODES.AUTH_REQUIRED),
    };
  }

  // AUTH-CRIT-002 (2B): Enforce 1-hour cap on demo sessions server-side.
  // Supabase anonymous sessions don't auto-expire; this is our cap.
  if (user.is_anonymous) {
    const createdAt = new Date(user.created_at).getTime();
    if (Date.now() > createdAt + DEMO_DURATION_MS) {
      // Invalidate the session so subsequent requests also fail.
      await supabase.auth.signOut();
      return {
        success: false,
        response: apiError('Demo session expired', 401, ERROR_CODES.AUTH_REQUIRED),
      };
    }
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        tier: 'free',
        isAdmin: false,
        isDemo: true,
      },
    };
  }

  const { data: parent } = await supabase
    .from('parents')
    .select('subscription_tier, is_admin')
    .eq('id', user.id)
    .single();

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email || '',
      tier: (parent?.subscription_tier as SubscriptionTier) || 'free',
      isAdmin: parent?.is_admin || false,
      isDemo: false,
    },
  };
}

export async function requireAdmin(
  req: NextRequest
): Promise<{ success: true; user: AuthenticatedUser } | { success: false; response: NextResponse }> {
  const auth = await requireAuth(req);
  if (!auth.success) return auth;

  if (!auth.user.isAdmin) {
    return {
      success: false,
      response: apiError('Admin access required', 403, ERROR_CODES.FORBIDDEN),
    };
  }

  return auth;
}

// ═══ RATE LIMITING MIDDLEWARE ═══

export function applyRateLimit(
  req: NextRequest,
  prefix: string,
  userId?: string,
  config: { maxRequests: number; windowMs: number } = RATE_LIMITS.general
): NextResponse | null {
  const ip = getClientIP(req);
  const identifier = userId || ip;
  const key = rateLimitKey(prefix, identifier);
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        code: ERROR_CODES.RATE_LIMITED,
        retryAfter: result.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return null; // Not rate limited — proceed
}

// ═══ CHILD OWNERSHIP VERIFICATION ═══

export async function verifyChildOwnership(
  parentId: string,
  childId: string
): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', parentId)
    .single();

  return !!data;
}

// ═══ GET CLIENT IP ═══

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ═══ v2 [NEW-2B]: REQUEST DEDUPLICATION ═══
// Prevents duplicate rapid submissions (e.g., double-clicking
// "Award XP" button). Returns cached response for identical
// requests within a 500ms window.

const recentRequests = new Map<string, { response: NextResponse; timestamp: number }>();
const DEDUP_WINDOW_MS = 500;

// Clean up dedup cache every 30 seconds
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of recentRequests.entries()) {
      if (now - entry.timestamp > DEDUP_WINDOW_MS * 2) {
        recentRequests.delete(key);
      }
    }
  }, 30 * 1000);
}

/**
 * Check if an identical request was made within the dedup window.
 * Call at the start of mutating handlers (POST, PATCH, DELETE).
 * @param req - The incoming request
 * @param userId - Authenticated user ID
 * @returns NextResponse if duplicate, null if fresh
 *
 * Usage in route handler:
 *   const dup = checkDuplicate(req, auth.user.id);
 *   if (dup) return dup;
 */
export function checkDuplicate(req: NextRequest, userId: string): NextResponse | null {
  const body = req.headers.get('content-length') || '0';
  const key = `${userId}:${req.method}:${req.nextUrl.pathname}:${body}`;
  const now = Date.now();

  const recent = recentRequests.get(key);
  if (recent && now - recent.timestamp < DEDUP_WINDOW_MS) {
    return NextResponse.json(
      {
        success: false,
        error: 'Duplicate request detected. Please wait a moment.',
        code: ERROR_CODES.DUPLICATE_REQUEST,
      },
      { status: 409 }
    );
  }

  // Store this request (will be cleaned up automatically)
  recentRequests.set(key, {
    response: NextResponse.json({ success: true }),
    timestamp: now,
  });

  return null; // Not a duplicate
}
