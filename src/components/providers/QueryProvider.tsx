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
// Per-query overrides remain available — child data uses these
// defaults, but heavier reads (content lists, parent dashboards) can
// pass `staleTime: Infinity` or `refetchOnWindowFocus: false` to
// opt out where appropriate.
// ════════════════════════════════════════════════════════════════

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
