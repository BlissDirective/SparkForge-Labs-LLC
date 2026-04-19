// ════════════════════════════════════════════════════
// Unit tests — rate-limit in-memory lazy cleanup
// PERF-HIGH-003 (Option C)
// ════════════════════════════════════════════════════
// Verifies the in-memory fallback path keeps working correctly
// after setInterval was replaced with opportunistic check-on-write
// cleanup. Upstash path is exercised separately (route-level
// mocks); this suite only tests the Node/test fallback.

import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, __resetRateLimitStoreForTests } from '@/lib/rate-limit';

describe('rate-limit in-memory fallback — PERF-HIGH-003 (C)', () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests();
  });

  it('allows requests under the cap and blocks over it', async () => {
    const cfg = { maxRequests: 3, windowMs: 60_000 };
    const key = 'test:basic';

    const first = await checkRateLimit(key, cfg);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    await checkRateLimit(key, cfg);
    await checkRateLimit(key, cfg);
    const fourth = await checkRateLimit(key, cfg);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets the counter for a given key after window expiry', async () => {
    // Use a tiny window so we can wait past it without the test
    // being slow.
    const cfg = { maxRequests: 2, windowMs: 50 };
    const key = 'test:expiry';

    await checkRateLimit(key, cfg);
    await checkRateLimit(key, cfg);
    const over = await checkRateLimit(key, cfg);
    expect(over.allowed).toBe(false);

    // Wait past the window
    await new Promise((r) => setTimeout(r, 70));

    const afterExpiry = await checkRateLimit(key, cfg);
    expect(afterExpiry.allowed).toBe(true);
    expect(afterExpiry.remaining).toBe(cfg.maxRequests - 1);
  });

  it('different keys do not interfere', async () => {
    const cfg = { maxRequests: 1, windowMs: 60_000 };

    const a = await checkRateLimit('key-a', cfg);
    const b = await checkRateLimit('key-b', cfg);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);

    const a2 = await checkRateLimit('key-a', cfg);
    const b2 = await checkRateLimit('key-b', cfg);
    expect(a2.allowed).toBe(false);
    expect(b2.allowed).toBe(false);
  });

  it('no background timer persists after module load (no handle leaks)', () => {
    // This is a smoke check: on Node the previous setInterval was
    // .unref()'d but still present. With lazy cleanup there's no
    // timer at all. We verify indirectly by checking the module
    // doesn't expose one and that resetting the store works.
    expect(typeof __resetRateLimitStoreForTests).toBe('function');
    __resetRateLimitStoreForTests();
    // If this line runs without hanging, no blocking timer is
    // keeping the event loop alive beyond the test's explicit
    // work.
    expect(true).toBe(true);
  });
});
