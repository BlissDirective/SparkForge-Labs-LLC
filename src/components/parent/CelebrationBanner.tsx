// ════════════════════════════════════════════════════
// CELEBRATION BANNER — CSS-only celebration fallback
// v3 Gap 5: Guaranteed to render anywhere (mobile, desktop,
// cockpit-loading, WebGPU unavailable). Complements the 3D
// CeremonyFX path in CockpitCanvas rather than replacing it.
//
// - Chrome-bezel glass card with gradient border
// - CSS confetti pieces (12 particles, pure transform/opacity)
// - 5s auto-dismiss with graceful fade
// - role="status" + aria-live="polite"
// ════════════════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface CelebrationBannerProps {
  /** Controlled visibility. */
  show: boolean;
  /** Headline. */
  title: string;
  /** Optional second line. */
  subtitle?: string;
  /** Accent color for chrome glow + confetti. */
  color?: string;
  /** Milliseconds before auto-dismiss. 0 = never. */
  duration?: number;
  /** Fired when the banner auto-dismisses or is closed. */
  onDismiss?: () => void;
}

// 12 evenly-distributed confetti slots
const CONFETTI_SEEDS = Array.from({ length: 12 }, (_, i) => ({
  x: (i / 12 - 0.5) * 320,
  delay: i * 0.04,
  rotate: (i % 2 === 0 ? 1 : -1) * (180 + (i * 13) % 180),
}));

export function CelebrationBanner({
  show,
  title,
  subtitle,
  color = '#FFD700',
  duration = 5000,
  onDismiss,
}: CelebrationBannerProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
  }, [show]);

  useEffect(() => {
    if (!visible || duration <= 0) return;
    const id = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(id);
  }, [visible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto"
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', damping: 20, stiffness: 300 },
          }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
          role="status"
          aria-live="polite"
        >
          {/* Confetti layer — absolute-positioned behind card */}
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            aria-hidden="true"
          >
            {CONFETTI_SEEDS.map((seed, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-3 rounded-sm"
                style={{
                  backgroundColor: i % 3 === 0 ? color : i % 3 === 1 ? '#00BBFF' : '#AA66FF',
                  boxShadow: `0 0 4px ${color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: seed.x,
                  y: [0, -40, 180],
                  opacity: [1, 1, 0],
                  rotate: seed.rotate,
                  transition: {
                    duration: 1.8,
                    delay: seed.delay,
                    ease: [0.34, 1.56, 0.64, 1],
                  },
                }}
              />
            ))}
          </div>

          {/* Chrome-bezel card */}
          <div
            className="relative glass-card rounded-2xl px-6 py-4 min-w-[280px] max-w-[480px] overflow-hidden"
            style={{
              boxShadow: `0 0 32px ${color}40, 0 0 64px ${color}20, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            {/* Animated sweep */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative flex items-center gap-3">
              <motion.div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: `${color}20`,
                  boxShadow: `0 0 16px ${color}60`,
                }}
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-5 h-5" style={{ color }} />
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="font-display text-base font-bold text-white">
                  {title}
                </div>
                {subtitle && (
                  <div className="font-body text-xs text-white/60 mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setVisible(false);
                  onDismiss?.();
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all flex-shrink-0"
                aria-label="Dismiss celebration"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
