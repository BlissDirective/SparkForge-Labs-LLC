'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { demoSessionFromUser } from '@/lib/demo-session';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import type { User } from '@supabase/supabase-js';
import type { Child } from '@/types';

const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  // PERF-HIGH-001 (Opt B): useShallow keeps the 4-action destructure
  // ergonomic while preventing re-renders on unrelated authStore writes
  // (parent object, isDemoMode flag, hasHydratedDemoSlice, demoSession).
  // Actions never change identity in Zustand → this bundle is effectively
  // 0-render after initial mount.
  const { setParent, setLoading: setAuthLoading, setDemoSession, clearAuth } = useAuthStore(
    useShallow((s) => ({
      setParent: s.setParent,
      setLoading: s.setLoading,
      setDemoSession: s.setDemoSession,
      clearAuth: s.clearAuth,
    })),
  );
  // STATE-MED-001 (B-full/T5c-C4): childStore is UI-only. children
  // list lives in React Query cache (['children']); AuthProvider
  // pre-populates it during hydrateUserData so useChildren() sees
  // data before its first network fetch resolves.
  const setActiveChildId = useChildStore((s) => s.setActiveChildId);
  const clearChild = useChildStore((s) => s.clearChild);
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        setAuthLoading(true);

        // STATE-MED-002 (B): rehydrate the persisted demo slice FIRST
        // so first-paint reflects the cached state. We then validate
        // against Supabase and clear the cache if the session is gone.
        // skipHydration=true in the store means this is an explicit
        // call (no automatic rehydrate on module load).
        await useAuthStore.persist.rehydrate();

        // AUTH-CRIT-002 (2B): Demo users now have real Supabase anonymous
        // sessions. `is_anonymous` is the authoritative signal; we no
        // longer read localStorage for demo state.
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          if (session.user.is_anonymous) {
            await hydrateDemoSession(session.user);
          } else {
            // STATE-MED-002 (B): non-anonymous session means any
            // persisted demo cache is stale — clear it.
            useAuthStore.getState().endDemoSession();
            await hydrateUserData(session.user.id);
          }
        } else if (mounted) {
          // No Supabase session at all — clear any cached demo state
          // so the login page doesn't show a phantom demo banner.
          const { isDemoMode } = useAuthStore.getState();
          if (isDemoMode) {
            useAuthStore.getState().endDemoSession();
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        if (mounted) {
          setAuthLoading(false);
          setIsInitialized(true);
        }
      }
    }

    function hydrateDemoSession(user: User) {
      const demoSession = demoSessionFromUser(user);
      if (demoSession && mounted) {
        setDemoSession(demoSession);
      }
    }

    async function hydrateUserData(userId: string) {
      // Fetch parent record
      const { data: parent } = await supabase
        .from('parents')
        .select('*')
        .eq('id', userId)
        .single();

      if (parent && mounted) {
        setParent(parent);

        // v2 [NEW-3A]: Redirect to onboarding if not complete
        // Only redirect if we're on a dashboard page (not auth pages)
        if (
          !parent.onboarding_complete &&
          !pathname?.startsWith('/onboarding') &&
          !pathname?.startsWith('/login') &&
          !pathname?.startsWith('/signup') &&
          !pathname?.startsWith('/reset-password')
        ) {
          router.push('/onboarding');
        }
      }

      // Fetch children + seed the React Query cache so useChildren()
      // subscribers render immediately without a second network trip.
      const { data: kids } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId)
        .order('created_at', { ascending: true });

      if (kids && mounted) {
        // T5c-C4: populate ['children'] cache (React Query owns the
        // list). Any consumer of useChildren() / useActiveChild() will
        // see this data on next render.
        qc.setQueryData<Child[]>(['children'], kids as Child[]);

        // Auto-select first child if none selected
        if (kids.length > 0) {
          const stored = typeof window !== 'undefined'
            ? localStorage.getItem('sparkforge-active-child')
            : null;
          const activeChild = stored
            ? kids.find((k: { id: string }) => k.id === stored) || kids[0]
            : kids[0];
          setActiveChildId(activeChild.id);
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (session.user.is_anonymous) {
            hydrateDemoSession(session.user);
          } else {
            await hydrateUserData(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          clearAuth();
          clearChild();
          // STATE-HIGH-001 (C): Broadcast to other open tabs so they
          // drop their cached session without waiting for their own
          // storage-event or focus-revalidation pass.
          broadcastAuthEvent('signed-out');
          router.push('/login');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Re-hydrate on token refresh to keep data fresh.
          // Demo sessions don't get their metadata re-checked here; the
          // DemoGuard is responsible for expiry enforcement.
          if (!session.user.is_anonymous) {
            await hydrateUserData(session.user.id);
          }
        }
      }
    );

    // STATE-HIGH-001 (C): Focus + visibility revalidation.
    // On tab focus (or tab becoming visible after minimize / app
    // switch), ask Supabase to validate the cached session with the
    // server via `auth.getUser()`. A 401 / missing user indicates
    // the session was invalidated (signed out in another tab, token
    // expired, revoked, etc.) — we then tear down the local store.
    async function revalidateSession() {
      if (!mounted) return;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          // Only clear if we THINK we have a parent; avoids spurious
          // clears when the user was never signed in.
          const hasParent = useAuthStore.getState().parent !== null;
          if (hasParent) {
            clearAuth();
            clearChild();
            broadcastAuthEvent('signed-out');
            router.push('/login?reason=session-expired');
          }
        }
      } catch {
        /* network hiccup — surface via OfflineBanner, do not clear */
      }
    }

    function handleFocus() { void revalidateSession(); }
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void revalidateSession();
    }
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // STATE-HIGH-001 (C): BroadcastChannel cross-tab. Supabase's
    // localStorage-backed auth already fires storage events cross-
    // tab; this is a belt-and-suspenders channel for setups where
    // localStorage events don't propagate (e.g., some privacy modes,
    // service-worker isolation).
    const channel: BroadcastChannel | null =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('sparkforge-auth')
        : null;

    channel?.addEventListener('message', (ev) => {
      if (!mounted) return;
      if (ev.data?.type === 'signed-out') {
        clearAuth();
        clearChild();
        router.push('/login');
      }
    });

    function broadcastAuthEvent(type: 'signed-out') {
      channel?.postMessage({ type });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      channel?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isInitialized) {
    return <LoadingScreen message="Loading SparkForge..." />;
  }

  return <>{children}</>;
}
