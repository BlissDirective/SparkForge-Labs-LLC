// ════════════════════════════════════════════════════
// RATE LIMITER — AUTH-HIGH-003 (Option B, wrapped signature)
//
// Primary backend: Upstash Redis (@upstash/ratelimit) — sliding window.
// Fallback:       in-memory Map (dev/test/when Upstash is not configured).
//
// The public surface is intentionally unchanged from the previous
// in-memory-only implementation:
//
//   - RATE_LIMITS (config constants, same keys + shapes)
//   - RateLimitResult { allowed, remaining, resetAt, retryAfterSeconds }
//   - rateLimitKey(prefix, identifier): string
//
// …with ONE necessary change: `checkRateLimit` is now async and
// returns `Promise<RateLimitResult>`. All callers are inside async
// route handlers (or the async `applyRateLimit` helper), so this is a
// trivial `await` at every call site.
//
// Why the change:
//   The in-memory `Map` store was module-scoped, meaning on Vercel
//   serverless (and any horizontally-scaled runtime) every isolate
//   held its own independent counter. A determined attacker could
//   defeat the 5/min auth rate limit by simply spreading requests
//   across cold-started instances. Upstash provides a single shared
//   counter at the edge.
//
// Setup (production):
//   1. Create a free Upstash Redis database: https://console.upstash.com
//   2. Copy the REST URL + REST token from the database dashboard.
//   3. Add to your environment (e.g. Vercel Dashboard → Env Vars):
//        UPSTASH_REDIS_REST_URL=https://<your-db>.upstash.io
//        UPSTASH_REDIS_REST_TOKEN=<your-token>
//
// When neither env var is set (local dev, CI, tests), the limiter
// transparently falls back to the legacy in-memory Map. A one-time
// warning is logged to stderr so production misconfigurations are
// noisy instead of silent.
// ════════════════════════════════════════════════════

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Public types ──────────────────────────────────────

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  general: { maxRequests: 60, windowMs: 60 * 1000 },          // 60/min
  auth: { maxRequests: 5, windowMs: 60 * 1000 },              // 5/min
  promptLab: { maxRequests: 20, windowMs: 60 * 60 * 1000 },   // 20/hr
  contentAgent: { maxRequests: 2, windowMs: 60 * 60 * 1000 }, // 2/hr
  // PAY-MED-001 (B): cap at 100 events/min across the whole Stripe
  // webhook endpoint (single global key, not per-IP). Legitimate
  // traffic from Stripe rarely exceeds this; exceeding it almost
  // certainly means a leaked secret is being abused.
  stripeWebhook: { maxRequests: 100, windowMs: 60 * 1000 },   // 100/min
  // API-MED-003 (B): public content endpoints cap. Non-authed reads
  // of published content are legitimate (marketing crawl, lab
  // preview), but anything past 100/min per IP is scraping behaviour.
  contentRead: { maxRequests: 100, windowMs: 60 * 1000 },     // 100/min
  // Kid-facing social mutations (preset messages, invite redemptions,
  // buddy-quest assigns, quiz ratings). Legitimate play never needs
  // more than this; past it is spam — a safety issue on a kids'
  // platform, not just a cost issue.
  social: { maxRequests: 10, windowMs: 60 * 1000 },           // 10/min
  // UGC quiz creation is deliberate, slow work — cap submissions hard.
  ugcWrite: { maxRequests: 10, windowMs: 60 * 60 * 1000 },    // 10/hr
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;          // epoch ms
  retryAfterSeconds: number;
}

export function rateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

// ─── Backend selection ────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

let warnedAboutFallback = false;
function warnFallbackOnce() {
  if (warnedAboutFallback) return;
  warnedAboutFallback = true;
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured. ' +
        'Falling back to in-memory rate limiting — ineffective across serverless ' +
        'instances. See SETUP_CHECKLIST.md §3.4 (Upstash) to enable.'
    );
  }
}

// ─── Upstash backend ──────────────────────────────────

type UpstashLimiter = ReturnType<typeof Ratelimit.slidingWindow> extends infer _
  ? Ratelimit
  : never;

const upstashRedis = USE_UPSTASH
  ? new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! })
  : null;

// Cache limiter instances per (maxRequests, windowMs) pair so we don't
// recreate them on every call.
const limiterCache = new Map<string, UpstashLimiter>();

function getUpstashLimiter(config: RateLimitConfig): UpstashLimiter {
  const cacheKey = `${config.maxRequests}:${config.windowMs}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: upstashRedis!,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
      analytics: false,
      prefix: 'sparkforge-rl',
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

async function checkViaUpstash(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(config);
  const { success, remaining, reset } = await limiter.limit(key);
  const now = Date.now();
  return {
    allowed: success,
    remaining: Math.max(0, remaining),
    resetAt: reset,
    retryAfterSeconds: success ? 0 : Math.max(0, Math.ceil((reset - now) / 1000)),
  };
}

// ─── In-memory fallback ───────────────────────────────

interface MemEntry {
  count: number;
  resetAt: number;
}
const memStore = new Map<string, MemEntry>();

// PERF-HIGH-003 (C): Lazy cleanup. Prior implementation ran a 5-min
// setInterval — even with .unref() that's a live timer per isolate
// and an unnecessary allocation on serverless. Primary backend is
// Upstash (authoritative TTL server-side); the in-memory fallback
// is only active locally / in CI, where per-request opportunistic
// pruning keeps the Map bounded without any background work.
//
// Probability gate (~1/256) amortizes the O(n) scan across many
// requests so no single call pays the full cost; on fallback
// traffic that means a scan roughly every 250 calls.
function maybeLazyCleanup(now: number): void {
  if ((now & 0xff) !== 0) return;
  for (const [k, entry] of memStore.entries()) {
    if (entry.resetAt < now) memStore.delete(k);
  }
}

function checkViaMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  maybeLazyCleanup(now);
  const entry = memStore.get(key);

  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: 0,
  };
}

// ─── Public API ───────────────────────────────────────

/**
 * Check whether a given key is within its rate-limit budget.
 *
 * Uses Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 * are configured (required for production). Falls back to an in-memory Map
 * when not configured — suitable for local dev, tests, and CI.
 *
 * The return shape is the same as the legacy implementation, so callers
 * only need to `await` the result.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.general
): Promise<RateLimitResult> {
  if (USE_UPSTASH && upstashRedis) {
    try {
      return await checkViaUpstash(key, config);
    } catch (err) {
      // Never let a Redis blip 500 a user-facing request — fall back.
      console.error('[rate-limit] Upstash call failed, using in-memory fallback:', err);
      return checkViaMemory(key, config);
    }
  }
  warnFallbackOnce();
  return checkViaMemory(key, config);
}

// Internal only — exposed for unit tests to reset state between cases.
export function __resetRateLimitStoreForTests() {
  memStore.clear();
  limiterCache.clear();
  warnedAboutFallback = false;
}
