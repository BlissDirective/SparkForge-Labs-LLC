// ════════════════════════════════════════════════════════════════
// Unit tests — STATE-MED-001 (B-full/T5a) useActiveChild + defaults
// ════════════════════════════════════════════════════════════════
// Verifies:
//   1. useActiveChild() resolves the active child against the live
//      React Query cache (NOT a stale childStore snapshot)
//   2. useActiveChild() returns undefined when no child is selected
//   3. useActiveChild() returns undefined while children are loading
//   4. useActiveChild() reflects updates pushed to the React Query
//      cache without an intervening childStore mutation
//   5. QueryProvider default options match STATE-MED-001 (B-full)
//      prescription: staleTime 30s, refetchOnWindowFocus true

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  csrfHeader: vi.fn(() => ({})),
}));

import { useActiveChild, useChildren } from '@/hooks/useChildren';
import { useChildStore } from '@/stores/childStore';
import { apiFetch } from '@/lib/api';
import type { Child } from '@/types';

const mockApiFetch = vi.mocked(apiFetch);

function makeChild(id: string, overrides: Partial<Child> = {}): Child {
  return {
    id,
    parent_id: 'p1',
    display_name: `Child ${id}`,
    age: 10,
    age_band: 'B',
    avatar_config: null,
    xp: 100,
    level: 2,
    level_title: 'Apprentice',
    streak_count: 1,
    spark_coins: 0,
    daily_time_limit_minutes: null,
    deactivated_at: null,
    created_at: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...overrides,
  } as any;
}

function wrapper(client: QueryClient) {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.resetAllMocks();
  useChildStore.setState({ activeChildId: null });
});

afterEach(() => {
  useChildStore.setState({ activeChildId: null });
});

describe('useActiveChild — STATE-MED-001 (B-full)', () => {
  it('returns undefined when no child is selected', async () => {
    mockApiFetch.mockResolvedValueOnce([] as never);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useActiveChild(), {
      wrapper: wrapper(client),
    });
    expect(result.current).toBeUndefined();
  });

  it('returns undefined while children are loading', async () => {
    // Resolve apiFetch with a promise that never resolves so the query
    // stays in "loading" state for the assertion window.
    mockApiFetch.mockImplementationOnce(
      () => new Promise(() => undefined) as never,
    );

    const childA = makeChild('a');
    useChildStore.setState({ activeChildId: childA.id });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useActiveChild(), {
      wrapper: wrapper(client),
    });
    expect(result.current).toBeUndefined();
  });

  it('resolves active child from React Query cache', async () => {
    const a = makeChild('a', { xp: 200 });
    const b = makeChild('b', { xp: 999 });
    mockApiFetch.mockResolvedValueOnce([a, b] as never);

    useChildStore.setState({ activeChildId: a.id });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Mount useChildren first so the cache is populated.
    const { result: childrenHook } = renderHook(() => useChildren(), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(childrenHook.current.data).toBeDefined());

    const { result } = renderHook(() => useActiveChild(), {
      wrapper: wrapper(client),
    });
    expect(result.current?.id).toBe('a');
    expect(result.current?.xp).toBe(200);
  });

  it('reflects React Query cache updates without childStore mutation', async () => {
    const a = makeChild('a', { xp: 100 });
    mockApiFetch.mockResolvedValue([a] as never);

    useChildStore.setState({ activeChildId: a.id });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Mount BOTH hooks in the same renderHook so they share a single
    // React tree — keeps the cache subscription wiring intact when we
    // dispatch setQueryData below.
    const { result } = renderHook(
      () => ({
        children: useChildren(),
        active: useActiveChild(),
      }),
      { wrapper: wrapper(client) },
    );
    await waitFor(() => expect(result.current.children.data).toBeDefined());
    expect(result.current.active?.xp).toBe(100);

    // Mutate the React Query cache directly (simulates an
    // invalidateQueries refetch returning fresh server data) WITHOUT
    // touching childStore.
    const updated = makeChild('a', { xp: 250 });
    client.setQueryData(['children'], [updated]);

    await waitFor(() => {
      expect(result.current.active?.xp).toBe(250);
    });
  });

  it('falls back to the first child when the stored id is stale', async () => {
    // Edge case: stale activeChild id pointing at a child that has been
    // deleted server-side. useActiveChild degrades to the first real
    // child instead of dead-ending the whole app on "pick a profile"
    // (the account demonstrably has a child).
    const ghost = makeChild('ghost-id');
    const real = makeChild('real-id');
    mockApiFetch.mockResolvedValueOnce([real] as never);

    useChildStore.setState({ activeChildId: ghost.id });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result: childrenHook } = renderHook(() => useChildren(), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(childrenHook.current.data).toBeDefined());

    const { result } = renderHook(() => useActiveChild(), {
      wrapper: wrapper(client),
    });
    expect(result.current?.id).toBe(real.id);
  });

  it('falls back to the first child when nothing is selected', async () => {
    const only = makeChild('only-id');
    mockApiFetch.mockResolvedValueOnce([only] as never);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result: childrenHook } = renderHook(() => useChildren(), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(childrenHook.current.data).toBeDefined());

    const { result } = renderHook(() => useActiveChild(), {
      wrapper: wrapper(client),
    });
    expect(result.current?.id).toBe(only.id);
  });
});

describe('QueryProvider defaults — STATE-MED-001 (B-full)', () => {
  it('source code declares staleTime 30s + refetchOnWindowFocus true', async () => {
    // Lightweight source-level invariant check — keeps the runtime
    // QueryProvider out of the test environment (it pulls in
    // ReactQueryDevtools which doesn't render under happy-dom). If
    // either default is regressed, this assertion fails immediately.
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/providers/QueryProvider.tsx'),
      'utf8',
    );
    expect(src).toMatch(/staleTime:\s*30\s*\*\s*1000/);
    expect(src).toMatch(/refetchOnWindowFocus:\s*true/);
  });
});
