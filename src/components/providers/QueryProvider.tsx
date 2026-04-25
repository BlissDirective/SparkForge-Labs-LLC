'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del, createStore } from 'idb-keyval';
import { useEffect, useState } from 'react';
import { ConflictResolver } from '@/components/ui/ConflictResolver';
import { wireOfflineReplay } from '@/lib/state/offlineMutationQueue';
import { isFeatureEnabled } from '@/lib/feature-flags';

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
// "loading" state forever. 30s is a deliberate ceiling — long
// enough for slow mobile connections on Supabase, short enough that
// a user sees an error toast instead of an infinite spinner if
// something hangs.
//
// Phase 5 #10 STATE-ENH Optimistic Update Primitives (Max):
//   - IndexedDB-backed persistQueryClient for offline-first reads.
//   - Conflict resolver mounted at provider scope.
//   - wireOfflineReplay() drains queued mutations on reconnect.
// Behind OPTIMISTIC_OFFLINE_CACHE feature flag so rollout is safe.
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

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
        networkMode: 'online',
      },
    },
  });
}

function buildPersister() {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const store = createStore('sparkforge', 'react-query-cache');
    return createAsyncStoragePersister({
      storage: {
        getItem: async (key: string) => {
          const v = (await get(key, store)) as string | undefined;
          return v ?? null;
        },
        setItem: async (key: string, value: string) => {
          await set(key, value, store);
        },
        removeItem: async (key: string) => {
          await del(key, store);
        },
      },
      key: 'sparkforge-query-cache-v1',
      throttleTime: 1000,
    });
  } catch {
    return null;
  }
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(buildQueryClient);
  const [offlineFlag, setOfflineFlag] = useState(false);
  const [persister] = useState(() => {
    // Built lazily on the client; SSR returns null.
    if (typeof window === 'undefined') return null;
    if (!isFeatureEnabled('OPTIMISTIC_OFFLINE_CACHE')) return null;
    return buildPersister();
  });

  useEffect(() => {
    setOfflineFlag(isFeatureEnabled('OPTIMISTIC_OFFLINE_CACHE'));
  }, []);

  useEffect(() => {
    if (!offlineFlag) return;
    const detach = wireOfflineReplay({
      onDrainComplete: (result) => {
        if (result.replayed > 0 || result.failed > 0) {
          console.info(
            '[QueryProvider] offline queue drained:',
            `replayed=${result.replayed} failed=${result.failed} queued=${result.queued}`,
          );
        }
      },
    });
    return detach;
  }, [offlineFlag]);

  const body = (
    <>
      {children}
      {/* Phase 5 #10: conflict dialog mounted globally */}
      <ConflictResolver />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );

  // When the feature flag + persister are present, use the persist
  // provider. Otherwise fall back to the vanilla provider so we don't
  // affect non-opt-in users.
  if (offlineFlag && persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
          dehydrateOptions: {
            // Don't persist mutation state — offline queue handles that.
            shouldDehydrateMutation: () => false,
          },
        }}
      >
        {body}
      </PersistQueryClientProvider>
    );
  }

  return <QueryClientProvider client={queryClient}>{body}</QueryClientProvider>;
}
