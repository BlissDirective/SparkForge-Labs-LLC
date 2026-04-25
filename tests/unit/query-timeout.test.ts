// ════════════════════════════════════════════════════════════════
// P2 §8.9 — withQueryTimeout wrapper
// ════════════════════════════════════════════════════════════════
// Verifies the AbortController-based timeout fires + cleans up.

import { describe, expect, it, vi } from 'vitest';
import { withQueryTimeout } from '@/components/providers/QueryProvider';

describe('P2 §8.9 — withQueryTimeout', () => {
  it('resolves with the queryFn result when within budget', async () => {
    const fn = withQueryTimeout(async () => 'ok', 100);
    expect(await fn()).toBe('ok');
  });

  it('aborts when the queryFn exceeds the timeout', async () => {
    const fn = withQueryTimeout(
      (signal) =>
        new Promise<string>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason));
          // intentionally never resolve
        }),
      50,
    );
    await expect(fn()).rejects.toThrow(/50ms timeout/);
  });

  it('clears the timer after resolution (no dangling setTimeout)', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const fn = withQueryTimeout(async () => 42, 200);
    await fn();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('uses the default 30s timeout when not specified', async () => {
    const fn = withQueryTimeout(async () => 'default');
    expect(await fn()).toBe('default');
  });
});
