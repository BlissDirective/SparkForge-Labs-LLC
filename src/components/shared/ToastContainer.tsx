'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useToastStore, type ToastType } from '@/stores/toastStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-neon-green" />,
  error: <AlertCircle className="w-5 h-5 text-spark-coral" />,
  info: <Info className="w-5 h-5 text-neon-blue" />,
  warning: <AlertTriangle className="w-5 h-5 text-neon-amber" />,
};

const TOAST_BORDERS: Record<ToastType, string> = {
  success: 'border-l-neon-green/50',
  error: 'border-l-spark-coral/50',
  info: 'border-l-neon-blue/50',
  warning: 'border-l-neon-amber/50',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            role="alert"
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto frost-blur rounded-xl px-4 py-3 border-l-4 ${TOAST_BORDERS[t.type]} flex items-start gap-3 max-w-sm shadow-lg`}
          >
            <div className="flex-shrink-0 mt-0.5">{TOAST_ICONS[t.type]}</div>
            <p className="font-body text-sm text-white/90 flex-1">{t.message}</p>
            {/* UX-HIGH-003 (B): Optional inline action (e.g., "Retry"). */}
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  removeToast(t.id);
                }}
                className="flex-shrink-0 rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-spark-blue/60"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 text-white/60 hover:text-white/90 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
