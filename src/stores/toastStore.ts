import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * UX-HIGH-003 (B): Optional inline action (e.g., "Retry"). When
 * present the ToastContainer renders a clickable button next to the
 * dismiss X. The handler fires in addition to the toast auto-
 * dismissing, so a retry can happen without manual dismissal.
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  createdAt: number;
  action?: ToastAction;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, durationOrOptions?: number | ToastOptions) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastCounter = 0;

function resolveOptions(arg?: number | ToastOptions): { duration: number; action?: ToastAction } {
  if (arg === undefined) return { duration: 4000 };
  if (typeof arg === 'number') return { duration: arg };
  return {
    duration: arg.duration ?? 4000,
    action: arg.action,
  };
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, durationOrOptions) => {
    const { duration, action } = resolveOptions(durationOrOptions);
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const toast: Toast = { id, type, message, duration, action, createdAt: Date.now() };

    set((state) => ({
      toasts: [...state.toasts.slice(-2), toast],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  clearAll: () => set({ toasts: [] }),
}));

// ═══ SELECTOR HOOKS (PERF-HIGH-001 Opt C) ═══
// Narrow subscription to the `toasts` array only. Consumers that only
// render the list (ToastContainer) subscribe here.
export function useToasts(): Toast[] {
  return useToastStore((s) => s.toasts);
}

// Shallow-stable bundle of the 3 action methods. Actions never change
// identity in Zustand, so re-renders effectively never happen here.
export function useToastActions() {
  return useToastStore(
    useShallow((s) => ({
      addToast: s.addToast,
      removeToast: s.removeToast,
      clearAll: s.clearAll,
    })),
  ) as Pick<ToastState, 'addToast' | 'removeToast' | 'clearAll'>;
}

// ═══ CONVENIENCE FUNCTIONS ═══
export const toast = {
  success: (message: string, arg?: number | ToastOptions) =>
    useToastStore.getState().addToast('success', message, arg),
  error: (message: string, arg?: number | ToastOptions) =>
    useToastStore.getState().addToast('error', message, arg),
  info: (message: string, arg?: number | ToastOptions) =>
    useToastStore.getState().addToast('info', message, arg),
  warning: (message: string, arg?: number | ToastOptions) =>
    useToastStore.getState().addToast('warning', message, arg),
};
