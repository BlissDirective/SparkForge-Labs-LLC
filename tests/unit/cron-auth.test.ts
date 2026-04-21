// ════════════════════════════════════════════════════════════════
// T17 DEPLOY-MED-003 — verifyCronBearer
// ════════════════════════════════════════════════════════════════
// Covers the 4 decision paths in cron-auth.ts:
//   1. No secret in production → 500
//   2. No secret in dev        → warn + pass through
//   3. Secret set + valid bearer → null (proceed)
//   4. Secret set + invalid / missing bearer → 401
//
// Also verifies that a timing-safe comparison is used by checking
// the helper doesn't throw on differing string lengths (native
// crypto.timingSafeEqual does throw on length mismatch; our wrapper
// must pre-check).

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyCronBearer } from '@/lib/cron-auth';

const ORIGINAL_ENV = { ...process.env };

function makeReq(authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader) headers.set('authorization', authHeader);
  return new NextRequest('http://localhost/api/cron/trial-reminders', {
    method: 'GET',
    headers,
  });
}

beforeEach(() => {
  delete process.env.CRON_SECRET;
  (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('T17 — verifyCronBearer', () => {
  it('returns 500 when secret missing in production', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const res = verifyCronBearer(makeReq(), { routeName: 'x' });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(500);
    const body = await res!.json();
    expect(body.code).toBe('CONFIG_ERROR');
  });

  it('passes through when secret missing in dev (noisy warn)', () => {
    const res = verifyCronBearer(makeReq(), { routeName: 'x' });
    expect(res).toBeNull();
  });

  it('accepts the correct Bearer token', () => {
    process.env.CRON_SECRET = 's3cret';
    const res = verifyCronBearer(makeReq('Bearer s3cret'), { routeName: 'x' });
    expect(res).toBeNull();
  });

  it('rejects a wrong token with 401', async () => {
    process.env.CRON_SECRET = 's3cret';
    const res = verifyCronBearer(makeReq('Bearer wrong'), { routeName: 'x' });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('rejects a missing header with 401', () => {
    process.env.CRON_SECRET = 's3cret';
    const res = verifyCronBearer(makeReq(), { routeName: 'x' });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('rejects a malformed header (no Bearer prefix)', () => {
    process.env.CRON_SECRET = 's3cret';
    const res = verifyCronBearer(makeReq('s3cret'), { routeName: 'x' });
    expect(res!.status).toBe(401);
  });

  it('handles length mismatch without throwing (timing-safe)', () => {
    process.env.CRON_SECRET = 'long-secret-value';
    // Differing lengths would make raw crypto.timingSafeEqual throw.
    const res = verifyCronBearer(makeReq('Bearer short'), { routeName: 'x' });
    expect(res!.status).toBe(401);
  });
});
