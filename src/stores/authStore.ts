// ════════════════════════════════════════════════════
// Auth Store
// Final-Audit 04-15-2026 finding AUTH-CRIT-002 (Option B)
//
// Demo mode state is now hydrated from the authenticated Supabase user
// (user.is_anonymous === true) by AuthProvider, not from localStorage.
// The store's isDemoMode/demoSession fields are a cached view — the
// source of truth is Supabase auth.
// ════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Parent } from '@/types';
import type { DemoSession } from '@/lib/demo-session';

interface AuthState {
  parent: Parent | null;
  isLoading: boolean;
  isDemoMode: boolean;
  demoSession: DemoSession | null;
  setParent: (parent: Parent | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  /** Populated by AuthProvider when a Supabase anonymous user is detected. */
  setDemoSession: (session: DemoSession | null) => void;
  /** Clears demo-mode state locally. Caller must also call
   *  supabase.auth.signOut() to invalidate the session server-side. */
  endDemoSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  parent: null,
  isLoading: true,
  isDemoMode: false,
  demoSession: null,

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
}));
