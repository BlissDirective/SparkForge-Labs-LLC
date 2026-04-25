'use client';

// ════════════════════════════════════════════════════════════════
// OfflineBanner — UX-HIGH-003 (B)
//
// Listens for the browser's online/offline events and renders a
// persistent banner when the user is disconnected. Once connectivity
// returns the banner shows a brief "Back online — syncing…" state
// then auto-dismisses so React Query's `refetchOnReconnect` gets the
// spotlight.
//
// Non-goals: offline-first data persistence. That's PERF-ENH-005
// service-worker territory. This banner is pure UX — it gives users
// a clear explanation for why their actions aren't landing instead
// of letting mutations fail silently.
// ════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi } from 'lucide-react';

type Phase = 'online' | 'offline' | 'reconnecting';

export function OfflineBanner() {
  const [phase, setPhase] = useState<Phase>('online');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sync initial state — navigator.onLine default is `true` when
    // API is missing, so safe.
    setPhase(navigator.onLine ? 'online' : 'offline');

    const goOffline = () => setPhase('offline');
    const goOnline = () => {
      setPhase((prev) => (prev === 'offline' ? 'reconnecting' : 'online'));
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // After we flip to 'reconnecting', fade out after a short delay
  // so the banner doesn't linger once network is back.
  useEffect(() => {
    if (phase !== 'reconnecting') return;
    const t = setTimeout(() => setPhase('online'), 1800);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <AnimatePresence>
      {phase === 'offline' && (
        <motion.div
          key="offline"
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-red-900/90 to-red-800/90 border-b border-red-500/30 backdrop-blur-md"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-2 px-4 py-2 text-sm font-body text-red-100">
            <WifiOff className="w-4 h-4 text-red-300" aria-hidden="true" />
            <span>
              You&apos;re offline — changes will save when you reconnect.
            </span>
          </div>
        </motion.div>
      )}
      {phase === 'reconnecting' && (
        <motion.div
          key="reconnecting"
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-emerald-900/90 to-emerald-800/90 border-b border-emerald-500/30 backdrop-blur-md"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-2 px-4 py-2 text-sm font-body text-emerald-100">
            <Wifi className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            <span>Back online — syncing…</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
