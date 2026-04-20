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
  // AUTH-MED-002 (B): parent is authenticated but hasn't recorded COPPA
  // consent yet. Client interceptor routes to /onboarding/consent.
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
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

// ═══ API-MED-002 (B): ERROR MESSAGE SANITIZATION ═══

/**
 * Convert an arbitrary thrown value into a response-safe message.
 *
 * In production, ALWAYS returns `fallback` verbatim — raw error
 * messages often leak stack frames, file paths, or internal service
 * names. In development we append the raw message so debugging is
 * still fast.
 *
 * Sentry / console.error still receive the full error server-side;
 * this helper is only about what we ship in response bodies.
 *
 * @example
 *   } catch (err) {
 *     console.error('[agent] pipeline failed:', err);
 *     return apiError(
 *       sanitizeErrorMessage(err, 'Agent pipeline failed'),
 *       500,
 *       ERROR_CODES.SERVER_ERROR,
 *     );
 *   }
 */
export function sanitizeErrorMessage(err: unknown, fallback: string): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : '';
  if (process.env.NODE_ENV === 'production') return fallback;
  return raw ? `${fallback}: ${raw}` : fallback;
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
  /**
   * AUTH-MED-002 (B): True once the parent has submitted COPPA consent
   * (parents.coppa_consent_at IS NOT NULL). Demo users always read as
   * `true` because demo sessions cannot create child profiles anyway.
   * Admin users also read as `true` — admin tooling precedes parent
   * onboarding and is not kid-facing.
   */
  hasCoppaConsent: boolean;
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
        hasCoppaConsent: true,
      },
    };
  }

  // AUTH-MED-002 (B): fetch coppa_consent_at alongside tier + admin so any
  // caller can branch on hasCoppaConsent without a second round-trip.
  const { data: parent } = await supabase
    .from('parents')
    .select('subscription_tier, is_admin, coppa_consent_at')
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
      hasCoppaConsent:
        parent?.is_admin === true || parent?.coppa_consent_at != null,
    },
  };
}

// ═══ AUTH-MED-002 (B): CONSENT-GATED AUTH ═══

/**
 * Same as `requireAuth`, plus rejects non-admin, non-demo parents who
 * have not yet recorded COPPA consent. Use on routes that create or
 * modify child-facing resources (child profiles, progress, XP, sessions,
 * prompts, game content).
 *
 * Returns `CONSENT_REQUIRED` 403 when consent is missing — the client
 * `apiFetch` interceptor (src/lib/api.ts) redirects to
 * `/onboarding/consent` on this code.
 *
 * Admin and demo users bypass the check.
 */
export async function requireAuthWithConsent(
  req: NextRequest,
): Promise<{ success: true; user: AuthenticatedUser } | { success: false; response: NextResponse }> {
  const auth = await requireAuth(req);
  if (!auth.success) return auth;

  if (!auth.user.hasCoppaConsent) {
    return {
      success: false,
      response: apiError(
        'Parental consent required. Please complete COPPA consent before using child profiles.',
        403,
        ERROR_CODES.CONSENT_REQUIRED,
      ),
    };
  }

  return auth;
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

// AUTH-HIGH-003: `checkRateLimit` is now async (Upstash-backed), so
// `applyRateLimit` is async as well. All call sites `await` it.
export async function applyRateLimit(
  req: NextRequest,
  prefix: string,
  userId?: string,
  config: { maxRequests: number; windowMs: number } = RATE_LIMITS.general
): Promise<NextResponse | null> {
  const ip = getClientIP(req);
  const identifier = userId || ip;
  const key = rateLimitKey(prefix, identifier);
  const result = await checkRateLimit(key, config);

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
// requests within DEDUP_WINDOW_MS.
//
// API-HIGH-002 (B): Dedup key is now a SHA-256 hash of the request
// body (truncated to 16 hex chars / 64 bits of entropy). Previous
// implementation used only Content-Length, which meant two different
// requests that happened to have the same byte length shared a dedup
// key and legitimate consecutive submissions were dropped.

const recentRequests = new Map<string, { response: NextResponse; timestamp: number }>();
const DEDUP_WINDOW_MS = 500;

// PERF-HIGH-003 (C): Lazy dedup-cache cleanup. The prior 30-second
// setInterval has been removed — even with .unref() it's a live
// timer per serverless isolate and the Map is already bounded by
// the DEDUP_WINDOW_MS expiry check at read time. We prune
// probabilistically on each call (≈1/64 of calls pay the O(n)
// scan, amortizing cost across traffic) so stale entries never
// accumulate indefinitely on long-lived Node processes either.
function maybePurgeRecentRequests(now: number): void {
  if ((now & 0x3f) !== 0) return;
  for (const [k, entry] of recentRequests.entries()) {
    if (now - entry.timestamp > DEDUP_WINDOW_MS * 2) {
      recentRequests.delete(k);
    }
  }
}

async function hashBody(body: string): Promise<string> {
  // Web Crypto API — available in both Edge and Node runtimes.
  const bytes = new TextEncoder().encode(body);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  // 64 bits of entropy is ample for a 500 ms anti-double-click window.
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if an identical request was made within the dedup window.
 * Call at the start of mutating handlers (POST, PATCH, DELETE).
 *
 * Usage in route handler:
 *   const dup = await checkDuplicate(req, auth.user.id);
 *   if (dup) return dup;
 *
 * @param req - The incoming request
 * @param userId - Authenticated user ID
 * @returns NextResponse if duplicate, null if fresh
 */
export async function checkDuplicate(
  req: NextRequest,
  userId: string,
): Promise<NextResponse | null> {
  // Read body off a clone so the original request stream is still
  // consumable by downstream parseBody() / req.json() calls.
  let bodyHash = 'empty';
  try {
    const cloned = req.clone();
    const bodyText = await cloned.text();
    if (bodyText) bodyHash = await hashBody(bodyText);
  } catch {
    // If clone fails for some reason (unlikely), fall back to
    // content-length. Still narrows the attack surface vs. the
    // previous 'length-only' impl because non-empty requests at
    // least differ by method+path.
    bodyHash = `cl${req.headers.get('content-length') ?? '0'}`;
  }

  const key = `${userId}:${req.method}:${req.nextUrl.pathname}:${bodyHash}`;
  const now = Date.now();
  // PERF-HIGH-003 (C): opportunistic lazy cleanup replaces the
  // former setInterval. Amortized across traffic; no background
  // timer, no .unref() to miss.
  maybePurgeRecentRequests(now);

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
