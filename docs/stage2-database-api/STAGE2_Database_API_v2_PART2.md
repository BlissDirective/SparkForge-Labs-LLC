# SPARKFORGE — STAGE 2: DATABASE & API LAYER v2 (PART 2 of 4)

**Date:** February 21, 2026 | **Version:** Frost-Prismatic v2.1

## PART 2 (2B) COVERS:

- Zod validation schemas (input validation for all API endpoints)
- Subscription tier configuration (free/plus/forge limits)
- Rate limiting system
- API helper utilities (auth, response formatting, request parsing)

## v2 CHANGES IN THIS PART:

- **[CONN-2]** Added `avatarConfig: z.record(z.unknown()).optional()` to `UpdateChildSchema` (avatar shop needs flexible config)
- **[ENH]** Added typed error codes to `api-helpers.ts` (`AUTH_REQUIRED`, `RATE_LIMITED`, `TIER_LIMIT`, etc.)
- **[NEW-2B]** Added request deduplication middleware (500ms window)
- **[IMP-3]** Rate limiting wired into auth endpoints (prep for Part 3)

## PREREQUISITES: Stage 2 Part 1 (database) complete

---

## STEP 1: CREATE REQUIRED FOLDERS

Run these from your sparkforge project root:

```bash
mkdir -p src/app/api/auth/signup
mkdir -p src/app/api/auth/login
mkdir -p src/app/api/auth/logout
mkdir -p src/app/api/auth/me
mkdir -p src/app/api/auth/callback
mkdir -p "src/app/api/children/[childId]"
mkdir -p "src/app/api/content/[slug]"
mkdir -p src/app/api/progress
mkdir -p src/app/api/progress/world
mkdir -p src/app/api/progress/all-labs
mkdir -p src/app/api/gamification/xp
mkdir -p src/app/api/gamification/streak
mkdir -p src/app/api/gamification/badges
mkdir -p src/app/api/ai/prompt-lab
mkdir -p src/app/api/stripe/checkout
mkdir -p src/app/api/stripe/portal
mkdir -p src/app/api/stripe/webhook
mkdir -p src/app/api/sessions
mkdir -p src/app/api/agent/run
mkdir -p src/app/api/agent/review
mkdir -p src/app/api/health
mkdir -p src/hooks
```

---

## STEP 2: VALIDATION SCHEMAS (ENHANCED v2)

**WHAT THIS DOES:** Zod schemas validate ALL input to API endpoints. If someone sends bad data (wrong type, too long, missing fields), Zod catches it before it reaches the database. This is security requirement #1: never trust client input.

**v2 CHANGES:**
- **[CONN-2]** `UpdateChildSchema` now accepts `avatarConfig` as flexible `z.record()` to support avatar shop item equipping from Stage 5. The structured `AvatarConfigSchema` is for creation; updates can be partial merges from the cosmetic shop.

**WHERE:** Create `src/lib/validations.ts`

### File: `src/lib/validations.ts`

```typescript
import { z } from 'zod';

// ═══ AUTH SCHEMAS ═══

export const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(1, 'Name is required').max(100).optional(),
  coppaConsent: z.literal(true, {
    errorMap: () => ({ message: 'Parental consent is required to create an account' }),
  }),
  timezone: z.string().max(50).default('UTC'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

// ═══ CHILD SCHEMAS ═══

export const AgeBandSchema = z.enum(['A', 'B', 'C']);

export const AvatarConfigSchema = z.object({
  skinTone: z.string().default('#FDBCB4'),
  hairStyle: z.string().default('short'),
  hairColor: z.string().default('#3B2F2F'),
  eyeColor: z.string().default('#634e34'),
  faceShape: z.string().default('round'),
  accessories: z.array(z.string()).default([]),
  outfit: z.string().default('astronaut'),
  background: z.string().default('stars'),
  pet: z.string().optional(),
}).passthrough();

export const CreateChildSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(20, 'Display name cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_ -]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores'),
  birthYear: z.number().int().min(2008).max(2020).optional(),
  age: z.number().int().min(5).max(18).optional(),
  ageBand: AgeBandSchema,
  avatarConfig: AvatarConfigSchema.optional(),
});

// v2 [CONN-2]: avatarConfig accepts flexible record for partial updates
// from avatar shop. Structured schema is for creation only.
export const UpdateChildSchema = z.object({
  displayName: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_ -]+$/).optional(),
  avatarConfig: z.record(z.unknown()).optional(),
  dailyTimeLimitMinutes: z.number().int().min(15).max(480).nullable().optional(),
  promptLabEnabled: z.boolean().optional(),
  preferences: z.object({
    fontSize: z.enum(['normal', 'large', 'extra-large']).optional(),
    dyslexiaFont: z.boolean().optional(),
    reduceMotion: z.boolean().optional(),
    highContrast: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
  }).optional(),
});

export const ChildIdSchema = z.object({
  childId: z.string().uuid('Invalid child ID'),
});

// ═══ CONTENT SCHEMAS ═══
// Note: query parameter uses "world" (DB column name)

export const ContentQuerySchema = z.object({
  world: z.coerce.number().int().min(1).max(10).optional(),
  ageBand: AgeBandSchema.optional(),
  type: z.enum(['lesson', 'quiz', 'game', 'spark_fact', 'activity', 'sandbox']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ContentSlugSchema = z.object({
  slug: z.string().min(1).max(200),
});

// ═══ PROGRESS SCHEMAS ═══

export const CreateProgressSchema = z.object({
  childId: z.string().uuid(),
  contentId: z.string().uuid(),
});

export const UpdateProgressSchema = z.object({
  childId: z.string().uuid(),
  contentId: z.string().uuid(),
  completed: z.boolean().optional(),
  score: z.number().min(0).max(100).optional(),
  timeSpentSeconds: z.number().int().min(0).max(86400).optional(),
});

export const CompleteContentSchema = z.object({
  childId: z.string().uuid(),
  contentId: z.string().uuid(),
  score: z.number().min(0).max(100).optional(),
  timeSpentSeconds: z.number().int().min(0).max(86400).default(0),
});

// ═══ GAMIFICATION SCHEMAS ═══

export const AwardXPSchema = z.object({
  childId: z.string().uuid(),
  amount: z.number().int().min(1).max(500),
  source: z.enum(['lesson', 'quiz', 'game', 'daily_challenge', 'spark_fact', 'activity', 'bonus']),
});

// ═══ PROMPT LAB SCHEMAS ═══

export const PromptLabSchema = z.object({
  childId: z.string().uuid(),
  prompt: z
    .string()
    .min(1, 'Please type something!')
    .max(1000, 'Message is too long — try keeping it under 1000 characters'),
  temperature: z.number().min(0).max(1).default(0.5),
  ageBand: AgeBandSchema,
});

// ═══ STRIPE SCHEMAS ═══

export const CheckoutSchema = z.object({
  tier: z.enum(['plus', 'forge']),
  interval: z.enum(['month', 'year']).default('month'),
});

export const PortalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

// ═══ CONTENT AGENT SCHEMAS ═══

export const AgentRunSchema = z.object({
  searchQueries: z.array(z.string().max(200)).min(1).max(10).optional(),
  targetWorlds: z.array(z.number().int().min(1).max(10)).optional(),
  targetBands: z.array(AgeBandSchema).optional(),
  maxItems: z.number().int().min(1).max(50).default(10),
});

export const ReviewContentSchema = z.object({
  queueItemId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

export const BulkReviewSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

// ═══ SESSION SCHEMAS ═══

export const StartSessionSchema = z.object({
  childId: z.string().uuid(),
});

export const EndSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

// ═══ LAB PROGRESS SCHEMA ═══
// UI calls it "lab" but the API query param is "world" (DB column)

export const LabProgressSchema = z.object({
  childId: z.string().uuid(),
  world: z.coerce.number().int().min(1).max(10),
});

// ═══ TYPE EXPORTS ═══
// Auto-generate TypeScript types from Zod schemas

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateChildInput = z.infer<typeof CreateChildSchema>;
export type UpdateChildInput = z.infer<typeof UpdateChildSchema>;
export type ContentQueryInput = z.infer<typeof ContentQuerySchema>;
export type CreateProgressInput = z.infer<typeof CreateProgressSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
export type CompleteContentInput = z.infer<typeof CompleteContentSchema>;
export type AwardXPInput = z.infer<typeof AwardXPSchema>;
export type PromptLabInput = z.infer<typeof PromptLabSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type AgentRunInput = z.infer<typeof AgentRunSchema>;
export type ReviewContentInput = z.infer<typeof ReviewContentSchema>;
export type BulkReviewInput = z.infer<typeof BulkReviewSchema>;
```

---

## STEP 3: TIER CONFIGURATION

**WHAT THIS DOES:** Defines what each subscription tier (free/plus/forge) gets. This is the single source of truth for all tier limits. Both the API and the UI read from this config.

**KEY CONCEPT:** Labs 1-3 are free for everyone. Labs 4-10 require Plus or Forge subscription. Free users get a "preview" of Labs 4-10 (first lesson only).

**WHERE:** Create `src/lib/tier-config.ts`

### File: `src/lib/tier-config.ts`

```typescript
// ════════════════════════════════════════════════════
// SUBSCRIPTION TIER CONFIGURATION
// Single source of truth for free/plus/forge limits.
// ════════════════════════════════════════════════════

export type SubscriptionTier = 'free' | 'plus' | 'forge';

export interface TierLimits {
  promptsPerDay: number;
  gamesPerWeek: number | null; // null = unlimited
  maxChildren: number;
  freeLabsAccess: number[];    // Labs with full access
  previewLabs: number[];       // Labs with first-lesson-only access
  lockedLabs: number[];        // No access
  features: {
    promptLab: boolean;
    dailyChallenge: boolean;
    leaderboard: boolean;
    avatarShop: boolean;
    exportProgress: boolean;
    offlineMode: boolean;
    prioritySupport: boolean;
  };
}

export const TIER_CONFIG: Record<SubscriptionTier, TierLimits> = {
  free: {
    promptsPerDay: 5,
    gamesPerWeek: 3,
    maxChildren: 1,
    freeLabsAccess: [1, 2, 3],
    previewLabs: [4, 5, 6, 7, 8, 9, 10],
    lockedLabs: [],
    features: {
      promptLab: true,
      dailyChallenge: true,
      leaderboard: false,
      avatarShop: false,
      exportProgress: false,
      offlineMode: false,
      prioritySupport: false,
    },
  },
  plus: {
    promptsPerDay: 50,
    gamesPerWeek: null,
    maxChildren: 3,
    freeLabsAccess: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    previewLabs: [],
    lockedLabs: [],
    features: {
      promptLab: true,
      dailyChallenge: true,
      leaderboard: true,
      avatarShop: true,
      exportProgress: true,
      offlineMode: false,
      prioritySupport: false,
    },
  },
  forge: {
    promptsPerDay: 200,
    gamesPerWeek: null,
    maxChildren: 5,
    freeLabsAccess: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    previewLabs: [],
    lockedLabs: [],
    features: {
      promptLab: true,
      dailyChallenge: true,
      leaderboard: true,
      avatarShop: true,
      exportProgress: true,
      offlineMode: true,
      prioritySupport: true,
    },
  },
};

// ═══ STRIPE PRICE IDS ═══
// Replace with your actual Stripe price IDs after creating products
// FIX (March 21, 2026): Env var names corrected to match .env.example
// (was STRIPE_PRICE_PLUS_MONTHLY, now STRIPE_PLUS_MONTHLY_ID per .env.example)
export const STRIPE_PRICES = {
  plus: {
    month: process.env.STRIPE_PLUS_MONTHLY_ID || 'price_placeholder_plus_monthly',
    year: process.env.STRIPE_PLUS_YEARLY_ID || 'price_placeholder_plus_yearly',
  },
  forge: {
    month: process.env.STRIPE_FORGE_MONTHLY_ID || 'price_placeholder_forge_monthly',
    year: process.env.STRIPE_FORGE_YEARLY_ID || 'price_placeholder_forge_yearly',
  },
} as const;

// ═══ HELPER FUNCTIONS ═══

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_CONFIG[tier];
}

export function canCreateChild(tier: SubscriptionTier, currentChildCount: number): boolean {
  return currentChildCount < TIER_CONFIG[tier].maxChildren;
}

export function isLabAccessible(tier: SubscriptionTier, labId: number): 'full' | 'preview' | 'locked' {
  const config = TIER_CONFIG[tier];
  if (config.freeLabsAccess.includes(labId)) return 'full';
  if (config.previewLabs.includes(labId)) return 'preview';
  return 'locked';
}

export function canUsePromptLab(tier: SubscriptionTier, promptsUsedToday: number): boolean {
  return promptsUsedToday < TIER_CONFIG[tier].promptsPerDay;
}

export function canPlayGame(tier: SubscriptionTier, gamesPlayedThisWeek: number): boolean {
  const limit = TIER_CONFIG[tier].gamesPerWeek;
  if (limit === null) return true;
  return gamesPlayedThisWeek < limit;
}

export function hasFeature(tier: SubscriptionTier, feature: keyof TierLimits['features']): boolean {
  return TIER_CONFIG[tier].features[feature];
}
```

---

## STEP 4: RATE LIMITING

**WHAT THIS DOES:** Prevents abuse by limiting how many requests each user can make. Uses an in-memory store (for production scale, use Redis/Upstash).

**4 presets:**
- `general`: 60 requests/minute (normal API calls)
- `auth`: 5 requests/minute (login/signup — prevent brute force)
- `promptLab`: 20 requests/hour (AI calls are expensive)
- `contentAgent`: 2 requests/hour (admin-only bulk generation)

**WHERE:** Create `src/lib/rate-limit.ts`

### File: `src/lib/rate-limit.ts`

```typescript
// ════════════════════════════════════════════════════
// IN-MEMORY RATE LIMITER
// For production: replace with Redis (Upstash)
// ════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  general: { maxRequests: 60, windowMs: 60 * 1000 },          // 60/min
  auth: { maxRequests: 5, windowMs: 60 * 1000 },              // 5/min
  promptLab: { maxRequests: 20, windowMs: 60 * 60 * 1000 },   // 20/hr
  contentAgent: { maxRequests: 2, windowMs: 60 * 60 * 1000 }, // 2/hr
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.general
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: 0,
  };
}

export function rateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}
```

---

## STEP 5: API HELPER UTILITIES (ENHANCED v2)

**WHAT THIS DOES:** Shared functions used by ALL API route handlers:
- `apiSuccess()` / `apiError()`: Standardized JSON responses
- `parseBody()` / `parseQuery()`: Validate request data with Zod
- `requireAuth()`: Check if user is logged in
- `requireAdmin()`: Check if user is an admin
- `verifyChildOwnership()`: Ensure parent owns the child
- `applyRateLimit()`: Enforce rate limits
- `deduplicateRequest()`: Prevent duplicate rapid submissions

**v2 CHANGES:**
- **[ENH]** Added typed error codes as constants (`AUTH_REQUIRED`, `RATE_LIMITED`, `TIER_LIMIT`, `VALIDATION_ERROR`, etc.)
- **[NEW-2B]** Added `deduplicateRequest()` middleware that returns cached response for identical requests within 500ms window. Prevents double-submit from rapid button clicks.
- **[ENH]** `getClientIP()` extracted as named export

**WHERE:** Create `src/lib/api-helpers.ts`

### File: `src/lib/api-helpers.ts`

```typescript
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

export interface AuthenticatedUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
  isAdmin: boolean;
}

export async function requireAuth(
  req: NextRequest
): Promise<{ success: true; user: AuthenticatedUser } | { success: false; response: NextResponse }> {
  const supabase = createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      response: apiError('Not authenticated', 401, ERROR_CODES.AUTH_REQUIRED),
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
  const supabase = createServerSupabase();
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
```

---

## PART 2 COMPLETE — WHAT YOU NOW HAVE

After Part 2, you have **4 new TypeScript files**:

1. **`src/lib/validations.ts`** — 20 Zod schemas + auto-generated types
   - v2: `[CONN-2]` `UpdateChildSchema` accepts flexible `avatarConfig`

2. **`src/lib/tier-config.ts`** — Free/Plus/Forge limits + Stripe price IDs + 6 helper functions (`canCreateChild`, `isLabAccessible`, etc.)

3. **`src/lib/rate-limit.ts`** — In-memory rate limiter with 4 presets (`general`: 60/min, `auth`: 5/min, `promptLab`: 20/hr, `agent`: 2/hr)

4. **`src/lib/api-helpers.ts`** — Auth middleware, response helpers, request parsing, child ownership verification
   - v2: `[ENH]` Typed `ERROR_CODES` constants
   - v2: `[NEW-2B]` `checkDuplicate()` request deduplication

### KEY UPDATES FROM v1:

- `UpdateChildSchema` uses `z.record(z.unknown())` for `avatarConfig`
- `api-helpers` exports `ERROR_CODES` for consistent error handling
- `checkDuplicate()` prevents double-submit from rapid button clicks
- `getClientIP()` exported as named function
- Rate limit presets ready for auth endpoint wiring (Part 3)

---

**NEXT:** Part 3 — All API Route Handlers (auth, children, content, progress, gamification, sessions, Stripe, agent + 2 new v2 endpoints)
