// ════════════════════════════════════════════════════════════════
// T16 DEPLOY-MED-002 — Sentry env/release + perf-transaction helpers
// ════════════════════════════════════════════════════════════════
// Verifies:
//   - sentryReleaseEnv() returns {environment}, with {release} added
//     only when a Vercel/Sentry SHA env var is present.
//   - The 4 trace helpers (withSpan, traceStripeWebhook,
//     traceAiApiCall, traceGameCompletion, withDbSpan) return the
//     wrapped function's result and propagate exceptions.
// Sentry itself is mocked — we test our wrapper contract, not the
// upstream SDK.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub out @sentry/nextjs so Sentry.startSpan invokes the callback
// without needing a real hub.
vi.mock('@sentry/nextjs', () => ({
  startSpan: (
    _opts: unknown,
    fn: (span: { setStatus: (s: unknown) => void }) => unknown,
  ) => fn({ setStatus: vi.fn() }),
}));

import {
  sentryReleaseEnv,
  withSpan,
  traceStripeWebhook,
  traceAiApiCall,
  traceGameCompletion,
  withDbSpan,
} from '@/lib/sentry-transactions';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.SENTRY_RELEASE;
  delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  delete process.env.VERCEL_GIT_COMMIT_SHA;
  delete process.env.SENTRY_ENVIRONMENT;
  delete process.env.VERCEL_ENV;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('T16 — sentryReleaseEnv', () => {
  it('returns environment only when no SHA env vars exist', () => {
    (process.env as Record<string, string>).NODE_ENV = 'test';
    const res = sentryReleaseEnv();
    expect(res.environment).toBe('test');
    expect(res.release).toBeUndefined();
  });

  it('populates release from VERCEL_GIT_COMMIT_SHA', () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'abc123';
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const res = sentryReleaseEnv();
    expect(res.release).toBe('abc123');
    expect(res.environment).toBe('production');
  });

  it('SENTRY_RELEASE takes precedence over VERCEL vars', () => {
    process.env.SENTRY_RELEASE = 'v1.2.3';
    process.env.VERCEL_GIT_COMMIT_SHA = 'abc';
    expect(sentryReleaseEnv().release).toBe('v1.2.3');
  });

  it('VERCEL_ENV takes precedence over NODE_ENV', () => {
    process.env.VERCEL_ENV = 'preview';
    (process.env as Record<string, string>).NODE_ENV = 'production';
    expect(sentryReleaseEnv().environment).toBe('preview');
  });

  it('falls back to "development" when nothing set', () => {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    expect(sentryReleaseEnv().environment).toBe('development');
  });
});

describe('T16 — span helpers', () => {
  it('withSpan resolves with the fn return value', async () => {
    expect(await withSpan('n', 'op', () => 42)).toBe(42);
  });

  it('withSpan propagates async results', async () => {
    expect(await withSpan('n', 'op', async () => 'ok')).toBe('ok');
  });

  it('withSpan rethrows exceptions', async () => {
    const err = new Error('boom');
    await expect(
      withSpan('n', 'op', () => {
        throw err;
      }),
    ).rejects.toBe(err);
  });

  it('traceStripeWebhook / traceAiApiCall / traceGameCompletion all wrap', async () => {
    expect(await traceStripeWebhook('checkout.session.completed', () => 'a')).toBe('a');
    expect(await traceAiApiCall('quiz', 'ai-spy', () => 'b')).toBe('b');
    expect(await traceGameCompletion('game', 'child-uuid-12345678-abc', () => 'c')).toBe('c');
  });

  it('withDbSpan wraps + resolves', async () => {
    expect(await withDbSpan('SELECT parents', () => 'parents-row')).toBe('parents-row');
  });
});
