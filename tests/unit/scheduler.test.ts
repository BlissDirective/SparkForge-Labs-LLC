// ════════════════════════════════════════════════════════════════
// T12 PERF-MED-004 — Scheduler fallback chain + yieldingForEach
// ════════════════════════════════════════════════════════════════
// Verifies the cooperative scheduler runs tasks, honors AbortSignal,
// and that yieldingForEach processes every item in chunks.
//
// The chain (postTask → rIC → queueMicrotask → setTimeout) is
// tricky to unit-test in-place because jsdom exposes some of these.
// We therefore assert outcomes (fn ran, abort rejected) rather
// than which tier fired.

import { describe, expect, it, vi } from 'vitest';
import {
  schedule,
  scheduleIdle,
  scheduleBackground,
  yieldingForEach,
  SchedulerCapabilities,
} from '@/lib/scheduler';

describe('scheduler.ts — T12', () => {
  it('schedule runs the function and resolves with its value', async () => {
    const result = await schedule(() => 42);
    expect(result).toBe(42);
  });

  it('schedule propagates async return values', async () => {
    const result = await schedule(async () => {
      await Promise.resolve();
      return 'ok';
    });
    expect(result).toBe('ok');
  });

  it('schedule rejects when signal is pre-aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(schedule(() => 1, { signal: ctrl.signal })).rejects.toThrow(
      /Aborted/i,
    );
  });

  it('schedule rejects when signal aborts after scheduling', async () => {
    const ctrl = new AbortController();
    const promise = schedule(() => 1, { signal: ctrl.signal });
    ctrl.abort();
    await expect(promise).rejects.toThrow(/Aborted/i);
  });

  it('scheduleIdle + scheduleBackground run the function', async () => {
    expect(await scheduleIdle(() => 'idle')).toBe('idle');
    expect(await scheduleBackground(() => 'bg')).toBe('bg');
  });

  it('yieldingForEach visits every item in order', async () => {
    const items = Array.from({ length: 120 }, (_, i) => i);
    const seen: number[] = [];
    await yieldingForEach(
      items,
      (n) => {
        seen.push(n);
      },
      { chunkSize: 25 },
    );
    expect(seen).toEqual(items);
  });

  it('yieldingForEach aborts mid-stream when signal fires', async () => {
    const items = Array.from({ length: 200 }, (_, i) => i);
    const seen: number[] = [];
    const ctrl = new AbortController();

    const promise = yieldingForEach(
      items,
      (n) => {
        seen.push(n);
        if (n === 30) ctrl.abort();
      },
      { chunkSize: 10, signal: ctrl.signal },
    );

    await expect(promise).rejects.toThrow(/Aborted/i);
    // Should have stopped somewhere shortly after 30, far before 200.
    expect(seen.length).toBeLessThan(100);
    expect(seen.length).toBeGreaterThan(30);
  });

  it('SchedulerCapabilities returns booleans', () => {
    expect(typeof SchedulerCapabilities.hasPostTask()).toBe('boolean');
    expect(typeof SchedulerCapabilities.hasRequestIdleCallback()).toBe('boolean');
  });

  it('schedule surfaces thrown errors as rejections', async () => {
    const err = new Error('kaboom');
    await expect(
      schedule(() => {
        throw err;
      }),
    ).rejects.toBe(err);
  });

  it('does not double-invoke the callback', async () => {
    const fn = vi.fn(() => 'x');
    await schedule(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
