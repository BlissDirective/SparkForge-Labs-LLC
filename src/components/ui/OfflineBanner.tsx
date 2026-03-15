// ════════════════════════════════════════════════════
// OFFLINE BANNER — Shows when internet is disconnected
// v2 [BUG-10B]: Proper event listener cleanup
// ════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // [BUG-10B] Proper cleanup
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] bg-spark-orange/90 backdrop-blur-sm px-4 py-2 text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          role="alert"
          aria-live="assertive"
        >
          <p className="font-body text-xs text-white font-semibold flex items-center justify-center gap-2">
            <WifiOff className="w-3 h-3" aria-hidden="true" />
            You&apos;re offline — some features may be unavailable
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
