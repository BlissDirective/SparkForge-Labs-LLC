// ════════════════════════════════════════════════════════════════
// Unit tests — STATE-MED-002 (B) authStore demo-slice persistence
// ════════════════════════════════════════════════════════════════
// Verifies:
//   1. Only isDemoMode + demoSession are persisted — parent / isLoading
//      are NEVER written to localStorage
//   2. rehydrate() reads from localStorage into the store
//   3. endDemoSession() + clearAuth() both update the persisted value
//   4. Switching to a non-demo parent clears the persisted demo slice
//   5. hasHydratedDemoSlice flips to true after rehydrate resolves
//   6. Setting a demoSession writes it through to localStorage
//
// Runs in happy-dom which provides a localStorage implementation. The
// persist middleware reads `typeof window` to decide the storage
// backend, and happy-dom sets window on module load.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import type { DemoSession } from '@/lib/demo-session';

const PERSIST_KEY = 'sparkforge-auth-demo';

function readPersisted(): Record<string, unknown> | null {
  const raw = window.localStorage.getItem(PERSIST_KEY);
  return raw ? JSON.parse(raw) : null;
}

function makeDemoSession(overrides?: Partial<DemoSession>): DemoSession {
  const startedAt = Date.now();
  return {
    id: 'anon-1',
    startedAt,
    expiresAt: startedAt + 60 * 60 * 1000,
    deviceType: 'desktop',
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  // Reset the store to its initial shape.
  useAuthStore.setState({
    parent: null,
    isLoading: true,
    isDemoMode: false,
    demoSession: null,
    hasHydratedDemoSlice: false,
  });
});

afterEach(() => {
  window.localStorage.clear();
});

describe('authStore demo-slice persist — STATE-MED-002 (B)', () => {
  it('persists isDemoMode + demoSession to localStorage', () => {
    const session = makeDemoSession();
    useAuthStore.getState().setDemoSession(session);

    const stored = readPersisted();
    expect(stored).not.toBeNull();
    expect(stored!.state).toMatchObject({
      isDemoMode: true,
      demoSession: {
        id: 'anon-1',
        deviceType: 'desktop',
      },
    });
  });

  it('does NOT persist parent identity', () => {
    useAuthStore.setState({
      parent: {
        id: 'parent-1',
        email: 'secret@example.com',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    // Touch a persist-covered field so partialize runs.
    useAuthStore.getState().setDemoSession(null);

    const stored = readPersisted();
    const stateShape = stored!.state as Record<string, unknown>;
    // parent key should NOT be present in the persisted blob
    expect('parent' in stateShape).toBe(false);
    // nor should isLoading / hasHydratedDemoSlice
    expect('isLoading' in stateShape).toBe(false);
    expect('hasHydratedDemoSlice' in stateShape).toBe(false);
  });

  it('rehydrates cached demo state from localStorage', async () => {
    // Seed localStorage as if a previous session wrote these values.
    window.localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        version: 1,
        state: {
          isDemoMode: true,
          demoSession: makeDemoSession(),
        },
      }),
    );

    expect(useAuthStore.getState().isDemoMode).toBe(false);

    await useAuthStore.persist.rehydrate();

    const s = useAuthStore.getState();
    expect(s.isDemoMode).toBe(true);
    expect(s.demoSession?.id).toBe('anon-1');
  });

  it('flips hasHydratedDemoSlice to true after rehydrate', async () => {
    expect(useAuthStore.getState().hasHydratedDemoSlice).toBe(false);
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState().hasHydratedDemoSlice).toBe(true);
  });

  it('endDemoSession() clears the persisted value', () => {
    useAuthStore.getState().setDemoSession(makeDemoSession());
    expect(readPersisted()!.state).toMatchObject({ isDemoMode: true });

    useAuthStore.getState().endDemoSession();

    const stored = readPersisted();
    expect(stored!.state).toMatchObject({
      isDemoMode: false,
      demoSession: null,
    });
  });

  it('clearAuth() clears the persisted demo slice', () => {
    useAuthStore.getState().setDemoSession(makeDemoSession());
    useAuthStore.getState().clearAuth();

    const stored = readPersisted();
    expect(stored!.state).toMatchObject({
      isDemoMode: false,
      demoSession: null,
    });
  });
});
