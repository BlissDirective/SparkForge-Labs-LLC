// ════════════════════════════════════════════════════
// OFFLINE PAGE — branded offline identity (DESIGN.md §8/§2)
// S10-HIGH-005: Branded offline experience instead of a browser error.
// 'use client' required — the retry button reloads the window.
// ════════════════════════════════════════════════════
'use client';

import { motion } from 'motion/react';
import { RotateCcw, WifiOff } from 'lucide-react';
import { SparkyCore } from '@/components/sparky/SparkyCore';

export default function OfflinePage() {
  return (
    <div className="relative min-h-screen bg-surface-deep flex items-center justify-center px-4 overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          width: 'min(520px, 80vw)',
          height: 'min(520px, 80vw)',
          background:
            'radial-gradient(circle, rgba(139,159,255,0.10) 0%, rgba(79,110,247,0.05) 45%, transparent 72%)',
        }}
      />

      <motion.div
        className="relative text-center max-w-md"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Sparky — dozing while the connection is out */}
        <div aria-hidden="true" className="flex justify-center mb-4">
          <SparkyCore expression="sleepy" size="xl" />
        </div>

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
          style={{ backgroundColor: 'rgba(139,159,255,0.10)', border: '1px solid rgba(139,159,255,0.22)' }}
        >
          <WifiOff className="w-4 h-4" style={{ color: '#8B9FFF' }} aria-hidden="true" />
          <span className="text-sm font-semibold" style={{ color: '#8B9FFF' }}>
            No Connection
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-3">
          You&apos;re Offline
        </h1>
        <p
          className="font-body text-base mb-2 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.72)' }}
        >
          Looks like your connection dropped. SparkForge needs the internet to
          load labs and sync your progress.
        </p>
        <p
          className="font-body text-sm mb-8"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Check your Wi-Fi or cellular connection and try again.
        </p>

        <motion.button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-display font-bold text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{
            background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
            boxShadow: '0 4px 20px rgba(233,69,245,0.30)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </motion.button>
      </motion.div>
    </div>
  );
}
