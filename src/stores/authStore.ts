// ════════════════════════════════════════════════════
// Auth Store
// Final-Audit 04-15-2026 findings AUTH-CRIT-002 (B) + STATE-MED-002 (B)
//
// Supabase is the authoritative source for auth state:
//   - parent (authenticated Supabase user with is_anonymous = false)
//   - demoSession (derived from user.is_anonymous === true)
// AuthProvider populates both on mount via supabase.auth.getUser().
//
// STATE-MED-002 (B): the demo slice is persisted via Zustand's persist
// middleware so a page refresh reflects the prior demo state
// instantly — avoiding the first-paint flash where isDemoMode === false
// while the Supabase session fetch is still in flight. Persisted state
// is a CACHE; the Supabase getSession() result wins on every mount and
// can clear or update the cache.
//
// Security note: only isDemoMode + demoSession are persisted. `parent`
// is NEVER persisted — it's reloaded from Supabase on every mount so
// RLS changes, admin toggles, and subscription tier updates propagate
// immediately. Attacker-controlled localStorage values cannot grant
// non-demo access because requireAuth() on the server still validates
// the Supabase JWT.
// ════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Parent } from '@/types';
import type { DemoSession } from '@/lib/demo-session';

interface AuthState {
  parent: Parent | null;
  isLoading: boolean;
  isDemoMode: boolean;
  demoSession: DemoSession | null;
  /** STATE-MED-002 (B): set to true after persist middleware has
   *  hydrated from localStorage. Consumers that MUST wait for the
   *  authoritative read before rendering can watch this flag. */
  hasHydratedDemoSlice: boolean;
  setParent: (parent: Parent | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  /** Populated by AuthProvider when a Supabase anonymous user is detected. */
  setDemoSession: (session: DemoSession | null) => void;
  /** Clears demo-mode state locally. Caller must also call
   *  supabase.auth.signOut() to invalidate the session server-side. */
  endDemoSession: () => void;
  /** Internal — used by persist middleware `onRehydrateStorage`. */
  _setHasHydratedDemoSlice: (hydrated: boolean) => void;
}

const PERSIST_NAME = 'sparkforge-auth-demo';
const PERSIST_VERSION = 1;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      parent: null,
      isLoading: true,
      isDemoMode: false,
      demoSession: null,
      hasHydratedDemoSlice: false,

      setParent: (parent) => set({ parent }),
      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () =>
        set({
          parent: null,
          isLoading: false,
          isDemoMode: false,
          demoSession: null,
        }),

      setDemoSession: (session) =>
        set({
          isDemoMode: session !== null,
          demoSession: session,
        }),

      endDemoSession: () =>
        set({
          isDemoMode: false,
          demoSession: null,
        }),

      _setHasHydratedDemoSlice: (hydrated) =>
        set({ hasHydratedDemoSlice: hydrated }),
    }),
    {
      name: PERSIST_NAME,
      version: PERSIST_VERSION,
      // Only persist the demo slice. Parent identity must come fresh
      // from Supabase every mount.
      partialize: (state) => ({
        isDemoMode: state.isDemoMode,
        demoSession: state.demoSession,
      }),
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // SSR — return an inert storage so the persist middleware
          // doesn't attempt to read. Zustand still calls this factory
          // on server renders.
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      // STATE-MED-002 (B): skip automatic hydration. AuthProvider
      // triggers rehydrate() explicitly so the persist read happens
      // AFTER the Supabase validation — if Supabase says the session
      // is gone, we clear localStorage before any component observes
      // the stale cached value.
      skipHydration: true,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.warn('[authStore] demo-slice rehydrate error:', error);
        }
        // Always flip the flag, even on error, so consumers aren't
        // blocked waiting for a rehydrate that failed.
        state?._setHasHydratedDemoSlice(true);
      },
    },
  ),
);
