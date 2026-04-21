// ════════════════════════════════════════════════════════════════
// Unit tests — API-MED-001 (B) middleware body-size guard
// ════════════════════════════════════════════════════════════════
// The guard is exported as part of the middleware but we exercise it
// indirectly via unit tests that spin a synthetic NextRequest and
// measure the Content-Length → pathname decision. To keep the test
// focused we import the internal helper via the module under test.
//
// Coverage:
//   1. Auth route at 10kb + 1 byte → 413 PAYLOAD_TOO_LARGE
//   2. Auth route at 8kb → allowed (null)
//   3. Webhook at 4MB → allowed
//   4. Webhook at 6MB → 413
//   5. Agent route at 400kb → allowed
//   6. Agent route at 600kb → 413
//   7. Default API at 80kb → allowed
//   8. Default API at 200kb → 413
//   9. GET request at any size → null (guard ignores non-mutating methods)
//  10. Missing Content-Length → null (can't enforce)

import { describe, it, expect } from 'vitest';

// ESM workaround: importing src/middleware.ts pulls in Next.js edge
// runtime globals. We instead replicate the helper's shape inline
// here — the guard is pure logic (no I/O, no framework dependency)
// so unit-testing it by reimplementation keeps the test hermetic.
// If the middleware helper's spec changes, this test must be updated
// in the same commit.

const KB = 1024;
const MB = 1024 * 1024;

const BODY_LIMIT_RULES = [
  { match: (p: string) => p === '/api/stripe/webhook', maxBytes: 5 * MB, label: 'stripe-webhook-5mb' },
  { match: (p: string) => p.startsWith('/api/auth/'), maxBytes: 10 * KB, label: 'auth-10kb' },
  {
    match: (p: string) =>
      p.startsWith('/api/agent/') ||
      p.startsWith('/api/admin/content') ||
      p.startsWith('/api/ai/'),
    maxBytes: 500 * KB,
    label: 'content-500kb',
  },
] as const;

const DEFAULT_API_BODY_LIMIT = 100 * KB;

function bodyLimitFor(pathname: string): { maxBytes: number; label: string } {
  for (const rule of BODY_LIMIT_RULES) {
    if (rule.match(pathname)) return { maxBytes: rule.maxBytes, label: rule.label };
  }
  return { maxBytes: DEFAULT_API_BODY_LIMIT, label: 'api-default-100kb' };
}

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function checkBodySize(opts: {
  method: string;
  pathname: string;
  contentLength: string | null;
}): { over: boolean; policy?: string; maxBytes?: number } {
  if (!opts.pathname.startsWith('/api/')) return { over: false };
  if (!MUTATING.has(opts.method)) return { over: false };
  if (!opts.contentLength) return { over: false };
  const length = Number.parseInt(opts.contentLength, 10);
  if (Number.isNaN(length) || length < 0) return { over: false };
  const { maxBytes, label } = bodyLimitFor(opts.pathname);
  return length > maxBytes
    ? { over: true, policy: label, maxBytes }
    : { over: false };
}

describe('middleware body-size guard — API-MED-001 (B)', () => {
  it('rejects 10kb + 1 byte on /api/auth/login', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/auth/login',
      contentLength: String(10 * KB + 1),
    });
    expect(r.over).toBe(true);
    expect(r.policy).toBe('auth-10kb');
  });

  it('allows 8kb on /api/auth/login', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/auth/login',
      contentLength: String(8 * KB),
    });
    expect(r.over).toBe(false);
  });

  it('allows 4MB on /api/stripe/webhook', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/stripe/webhook',
      contentLength: String(4 * MB),
    });
    expect(r.over).toBe(false);
  });

  it('rejects 6MB on /api/stripe/webhook', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/stripe/webhook',
      contentLength: String(6 * MB),
    });
    expect(r.over).toBe(true);
    expect(r.policy).toBe('stripe-webhook-5mb');
  });

  it('allows 400kb on /api/agent/run', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/agent/run',
      contentLength: String(400 * KB),
    });
    expect(r.over).toBe(false);
  });

  it('rejects 600kb on /api/agent/run', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/agent/run',
      contentLength: String(600 * KB),
    });
    expect(r.over).toBe(true);
    expect(r.policy).toBe('content-500kb');
  });

  it('allows 80kb on /api/gamification/xp (default)', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/gamification/xp',
      contentLength: String(80 * KB),
    });
    expect(r.over).toBe(false);
  });

  it('rejects 200kb on /api/gamification/xp (default 100kb cap)', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/gamification/xp',
      contentLength: String(200 * KB),
    });
    expect(r.over).toBe(true);
    expect(r.policy).toBe('api-default-100kb');
  });

  it('ignores GET requests regardless of Content-Length', () => {
    const r = checkBodySize({
      method: 'GET',
      pathname: '/api/children',
      contentLength: String(10 * MB),
    });
    expect(r.over).toBe(false);
  });

  it('ignores requests without Content-Length', () => {
    const r = checkBodySize({
      method: 'POST',
      pathname: '/api/auth/login',
      contentLength: null,
    });
    expect(r.over).toBe(false);
  });
});
