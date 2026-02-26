import { create } from 'zustand';
import type { Parent } from '@/types';

interface AuthState {
  parent: Parent | null;
  isLoading: boolean;
  setParent: (parent: Parent | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  parent: null,
  isLoading: true,
  setParent: (parent) => set({ parent }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ parent: null, isLoading: false }),
}));
