import { create } from 'zustand';
import type { Parent } from '@/types';
import {
  getDemoSession,
  createDemoSession,
  clearDemoSession,
  createDemoChild,
  type DemoSession,
} from '@/lib/demo-session';
import { useChildStore } from '@/stores/childStore';

interface AuthState {
  parent: Parent | null;
  isLoading: boolean;
  // Demo session state
  isDemoMode: boolean;
  demoSession: DemoSession | null;
  setParent: (parent: Parent | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  // Demo actions
  startDemoSession: () => DemoSession;
  endDemoSession: () => void;
  checkDemoStatus: () => boolean; // returns true if still valid
}

export const useAuthStore = create<AuthState>((set, get) => ({
  parent: null,
  isLoading: true,
  isDemoMode: false,
  demoSession: null,

  setParent: (parent) => set({ parent }),
  setLoading: (isLoading) => set({ isLoading }),

  clearAuth: () => set({
    parent: null,
    isLoading: false,
    isDemoMode: false,
    demoSession: null,
  }),

  startDemoSession: () => {
    const session = createDemoSession();
    // Seed a synthetic child so the dashboard renders for demo users, who have
    // no Supabase row backing them.
    const demoChild = createDemoChild();
    useChildStore.getState().setChildren([demoChild]);
    useChildStore.getState().setActiveChild(demoChild);
    set({ isDemoMode: true, demoSession: session });
    return session;
  },

  endDemoSession: () => {
    clearDemoSession();
    useChildStore.getState().clearChild();
    set({ isDemoMode: false, demoSession: null });
  },

  checkDemoStatus: () => {
    const session = getDemoSession();
    if (!session) {
      if (get().isDemoMode) {
        set({ isDemoMode: false, demoSession: null });
      }
      return false;
    }
    return true;
  },
}));
