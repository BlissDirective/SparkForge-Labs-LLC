// ════════════════════════════════════════════════════
// Unit tests — useDisposable
// Final-Audit 04-15-2026 finding PERF-CRIT-002 (Option C)
// ════════════════════════════════════════════════════

import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useDisposable,
  getDisposableStats,
  __resetDisposableStats,
} from '@/hooks/useDisposable';

afterEach(() => {
  __resetDisposableStats();
});

class MockResource {
  disposed = false;
  dispose = vi.fn(() => {
    this.disposed = true;
  });
}

describe('useDisposable', () => {
  it('creates the resource on first render', () => {
    const { result } = renderHook(() => useDisposable(() => new MockResource(), []));
    expect(result.current).toBeInstanceOf(MockResource);
    expect(result.current.disposed).toBe(false);
  });

  it('disposes the resource on unmount', () => {
    const { result, unmount } = renderHook(() => useDisposable(() => new MockResource(), []));
    const resource = result.current;
    unmount();
    expect(resource.disposed).toBe(true);
    expect(resource.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes the previous resource when deps change', () => {
    let depKey = 'a';
    const { result, rerender } = renderHook(() =>
      useDisposable(() => new MockResource(), [depKey]),
    );
    const first = result.current;

    depKey = 'b';
    rerender();

    expect(first.disposed).toBe(true);
    expect(result.current).not.toBe(first);
    expect(result.current.disposed).toBe(false);
  });

  it('disposes nested disposables in an object', () => {
    const a = new MockResource();
    const b = new MockResource();
    const { unmount } = renderHook(() =>
      useDisposable(() => ({ a, b, nonDisposable: 'just a string' }), []),
    );
    unmount();
    expect(a.disposed).toBe(true);
    expect(b.disposed).toBe(true);
  });

  it('disposes disposables inside arrays', () => {
    const resources = [new MockResource(), new MockResource(), new MockResource()];
    const { unmount } = renderHook(() => useDisposable(() => resources, []));
    unmount();
    expect(resources.every((r) => r.disposed)).toBe(true);
  });

  it('updates stats.currentLive on allocation and dispose', () => {
    const before = getDisposableStats();
    const { unmount } = renderHook(() => useDisposable(() => new MockResource(), []));
    const during = getDisposableStats();
    expect(during.currentLive).toBeGreaterThan(before.currentLive);
    expect(during.byType.MockResource).toBe(1);
    unmount();
    const after = getDisposableStats();
    expect(after.currentLive).toBe(before.currentLive);
    expect(after.totalDisposed).toBeGreaterThan(before.totalDisposed);
  });

  it('swallows dispose() exceptions without crashing React lifecycle', () => {
    class BadResource {
      dispose = vi.fn(() => {
        throw new Error('dispose failed');
      });
    }
    const { unmount } = renderHook(() => useDisposable(() => new BadResource(), []));
    expect(() => unmount()).not.toThrow();
  });

  it('does not over-dispose when React re-renders with same deps', () => {
    const { result, rerender } = renderHook(() => useDisposable(() => new MockResource(), []));
    const first = result.current;
    rerender();
    rerender();
    rerender();
    expect(result.current).toBe(first);
    expect(first.dispose).not.toHaveBeenCalled();
  });
});
