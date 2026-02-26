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
