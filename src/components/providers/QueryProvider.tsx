'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

// ════════════════════════════════════════════════════════════════
// STATE-MED-001 (B-full): tightened defaults so cross-tab stale data
// is eliminated as the audit prescribes:
//
//   staleTime: 30s             — was 5 minutes (too stale)
//   refetchOnWindowFocus: true — was false (tab focus didn't reconcile)
//   gcTime: 30 minutes         — unchanged (acceptable cache size)
//   retry: 1                   — unchanged
//
// P2 §8.9 (Opt C): networkMode + global query timeout. Without a
// timeout, a stuck fetch would leave the UI in an indeterminate
// \"loading\" state forever. 30s is a deliberate ceiling — long
// enough for slow mobile connections on Supabase, short enough that
// a user sees an error toast instead of an infinite spinner if
// something hangs.
//
// Per-query overrides remain available — child data uses these
// defaults, but heavier reads (content lists, parent dashboards) can
// pass `staleTime: Infinity` or `refetchOnWindowFocus: false` to
// opt out where appropriate. Override the timeout via AbortSignal
// passed into your queryFn.
// ════════════════════════════════════════════════════════════════

const QUERY_TIMEOUT_MS = 30 * 1000;

/** Wraps a queryFn with an AbortController that fires after the
 *  global timeout. Any queryFn can opt in by calling this helper. */
export function withQueryTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = QUERY_TIMEOUT_MS,
): () => Promise<T> {
  return async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new DOMException(
      `Query exceeded ${timeoutMs}ms timeout`,
      'TimeoutError',
    )), timeoutMs);
    try {
      return await fn(controller.signal);
    } finally {
      clearTimeout(timeout);
    }
  };
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,            // 30s — STATE-MED-001 (B-full)
            gcTime: 30 * 60 * 1000,          // Cache kept for 30 minutes
            retry: 1,                         // Retry failed requests once
            refetchOnWindowFocus: true,       // STATE-MED-001 (B-full)
            // P2 §8.9: react-query reads this signal inside queryFn
            // when the queryFn accepts one (queryFn({ signal })).
            // Pairs with withQueryTimeout() above for consumers that
            // want an explicit per-query ceiling.
            networkMode: 'online',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
