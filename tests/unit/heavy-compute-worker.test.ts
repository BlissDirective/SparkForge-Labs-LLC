// ════════════════════════════════════════════════════════════════
// T12 PERF-MED-004 — heavyCompute worker pure-function surface
// ════════════════════════════════════════════════════════════════
// Tests the *shape* of the worker API. We import the module under
// a non-worker global (jsdom), so the `expose()` call is a no-op
// and every exported function behaves identically to the main-
// thread fallback used by heavyCompute.client when Worker is
// unavailable.

import { describe, expect, it } from 'vitest';
import {
  filterContentSafety,
  filterContentSafetyBatch,
  computeScoreBreakdown,
  hashStrings,
} from '@/lib/workers/heavyCompute.worker';

describe('heavyCompute.worker — filterContentSafety', () => {
  it('redacts emails', () => {
    const r = filterContentSafety('contact me at alex@example.com');
    expect(r.sanitized).toContain('[REDACTED]');
    expect(r.sanitized).not.toContain('alex@example.com');
    expect(r.safe).toBe(true);
  });

  it('redacts phone numbers and street addresses', () => {
    const r = filterContentSafety('call 555-123-4567 at 123 Main St');
    expect(r.sanitized).toContain('[REDACTED]');
    expect(r.safe).toBe(true);
  });

  it('flags forbidden topics', () => {
    const r = filterContentSafety('content about weapons training');
    expect(r.safe).toBe(false);
    expect(r.reason).toMatch(/weapon/i);
  });

  it('leaves clean text intact', () => {
    const r = filterContentSafety('Learn how AI helps doctors diagnose images.');
    expect(r.sanitized).toBe('Learn how AI helps doctors diagnose images.');
    expect(r.safe).toBe(true);
  });

  it('batch mode returns per-item results in order', () => {
    const results = filterContentSafetyBatch([
      'safe line',
      'violence is bad',
      'email x@y.co',
    ]);
    expect(results).toHaveLength(3);
    expect(results[0].safe).toBe(true);
    expect(results[1].safe).toBe(false);
    expect(results[2].sanitized).toContain('[REDACTED]');
  });
});

describe('heavyCompute.worker — computeScoreBreakdown', () => {
  it('returns zero for an empty round list', () => {
    const r = computeScoreBreakdown([]);
    expect(r.total).toBe(0);
    expect(r.base).toBe(0);
  });

  it('skips incorrect rounds entirely', () => {
    const r = computeScoreBreakdown([
      { correct: false, basePoints: 10 },
      { correct: false, basePoints: 10 },
    ]);
    expect(r.total).toBe(0);
  });

  it('sums base points across correct rounds', () => {
    const r = computeScoreBreakdown([
      { correct: true, basePoints: 10 },
      { correct: true, basePoints: 20 },
    ]);
    expect(r.base).toBe(30);
  });

  it('awards streak bonuses, capped at 5-in-a-row', () => {
    const r = computeScoreBreakdown([
      { correct: true, basePoints: 10, streak: 1 }, // no bonus
      { correct: true, basePoints: 10, streak: 2 }, // +2
      { correct: true, basePoints: 10, streak: 3 }, // +4
      { correct: true, basePoints: 10, streak: 7 }, // capped at 5 → +10
    ]);
    expect(r.streakBonus).toBe(2 + 4 + 10);
  });

  it('deducts hint penalty from total', () => {
    const r = computeScoreBreakdown([
      { correct: true, basePoints: 100, hintsUsed: 2 },
    ]);
    // penalty = 2 * floor(100 * 0.15) = 30
    expect(r.hintPenalty).toBe(30);
    expect(r.total).toBe(100 - 30);
  });

  it('awards time bonus proportional to remaining time', () => {
    const r = computeScoreBreakdown([
      { correct: true, basePoints: 100, timeMs: 0, maxTimeMs: 10_000 },
    ]);
    // ratio = 1.0 → bonus = floor(1 * 100 * 0.3) = 30
    expect(r.timeBonus).toBe(30);
  });

  it('total never goes negative', () => {
    const r = computeScoreBreakdown([
      { correct: true, basePoints: 10, hintsUsed: 100 },
    ]);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });
});

describe('heavyCompute.worker — hashStrings', () => {
  it('returns a stable SHA-256 hex digest per input', async () => {
    const [a, b] = await hashStrings(['hello', 'hello']);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns different digests for different inputs', async () => {
    const [a, b] = await hashStrings(['one', 'two']);
    expect(a).not.toBe(b);
  });
});
