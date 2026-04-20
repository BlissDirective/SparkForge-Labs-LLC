'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusTrap from 'focus-trap-react';
// R2: a11y state merged into uiStore (was accessibilityStore)
import { useUIStore } from '@/stores/uiStore';
// Phase 2 audit fix (Section 5.6): Consolidated ConfettiEngine
import { ConfettiEngine } from '@/components/shared/ConfettiEngine';

// CelebrationOverlay — Confetti, Badge Flips, Level-Up Modals, Streak, XP
// v2: Physics confetti, badge flip, sound hooks, LevelUpCeremony wiring
// v3: R3F particle burst readiness, station-aesthetic colors
// v3.1: S5-HIGH-002 streak+confetti types, S5-HIGH-003 XP auto-dismiss,
//       S5-HIGH-004 reducedMotion, S5-HIGH-005 ARIA, S5-WARN-002 unmount guard

// Animation presets
const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalContent = {
  initial: { scale: 0.8, opacity: 0, y: 20 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { scale: 0.8, opacity: 0, y: 20 },
};

// Reduced-motion variant: simple opacity fade, no spring
const modalContentReduced = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: { opacity: 0 },
};

const badgeFlip = {
  initial: { rotateY: 0, scale: 0.5, opacity: 0 },
  animate: {
    rotateY: [0, 180, 360],
    scale: [0.5, 1.2, 1],
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeOut' as const },
  },
};

// Phase 2 audit fix (Section 5.6): Consolidated ConfettiEngine
// Physics confetti particle system + CONFETTI_COLORS palette moved to
// src/components/shared/ConfettiEngine.tsx for reuse across all celebration
// surfaces (GameCompleteCelebration + CelebrationOverlay).

// Streak tier names based on streak count
function getStreakTier(count: number): string {
  if (count >= 30) return 'Legendary';
  if (count >= 14) return 'Blazing';
  if (count >= 7) return 'On Fire';
  if (count >= 3) return 'Warming Up';
  return 'Spark';
}

export function CelebrationOverlay() {
  const { celebrationType, celebrationData, dismissCelebration } = useUIStore();
  const { reduceMotion } = useUIStore((s) => s.a11y);

  // v2 [ENH]: Sound event hook points (actual audio in Stage 5)
  const playSound = useCallback((event: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sparkforge:sound', { detail: { event } })
      );
    }
  }, []);

  // Phase 2 audit fix (Section 5.6): Consolidated ConfettiEngine
  // The per-frame physics loop + unmount guard previously lived here has
  // moved into ConfettiEngine.tsx (Motion-driven fall). Sound is still
  // triggered on initial celebration kick-off below, preserving behavior.
  useEffect(() => {
    if (!celebrationType || reduceMotion) return;
    playSound('celebration');
  }, [celebrationType, reduceMotion, playSound]);

  // S5-HIGH-003: XP toast auto-dismiss after 3 seconds
  useEffect(() => {
    if (celebrationType === 'xp') {
      const timer = setTimeout(() => {
        dismissCelebration();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [celebrationType, dismissCelebration]);

  // S5-HIGH-002: Streak toast auto-dismiss after 4 seconds
  useEffect(() => {
    if (celebrationType === 'streak') {
      const timer = setTimeout(() => {
        dismissCelebration();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [celebrationType, dismissCelebration]);

  // S5-HIGH-002: Confetti-only auto-dismiss after 5 seconds
  useEffect(() => {
    if (celebrationType === 'confetti') {
      const timer = setTimeout(() => {
        dismissCelebration();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [celebrationType, dismissCelebration]);

  if (!celebrationType) return null;

  // S5-HIGH-004: Choose animation variants based on reduceMotion
  const activeModalContent = reduceMotion ? modalContentReduced : modalContent;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Confetti layer — Phase 2 audit fix (Section 5.6): Consolidated ConfettiEngine */}
        {/* S5-HIGH-005: aria-hidden applied inside ConfettiEngine */}
        {/* S5-HIGH-004: reduceMotion short-circuits the engine (show=false) */}
        <ConfettiEngine
          count={30}
          duration={5000}
          show={!!celebrationType && !reduceMotion}
        />

        {/* Badge Earned Modal — S5-HIGH-005: role="dialog", aria-modal, aria-label */}
        {/* Phase 1 audit fix (Section 8.1): FocusTrap + Escape key dismiss */}
        {celebrationType === 'badge' && celebrationData && (
          <FocusTrap focusTrapOptions={{ escapeDeactivates: true, onDeactivate: dismissCelebration, allowOutsideClick: true }}>
            <motion.div
              className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-auto"
              variants={modalBackdrop}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={dismissCelebration}
              onKeyDown={(e) => { if (e.key === 'Escape') dismissCelebration(); }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="badge-celebration-title"
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <motion.div
                className="relative glass-card-v2-elevated rounded-3xl p-8 max-w-sm mx-4 text-center"
                variants={activeModalContent}
                onClick={(e) => e.stopPropagation()}
              >
                {reduceMotion ? (
                  <div className="text-6xl mb-4">
                    {(celebrationData.icon as string) || '🏅'}
                  </div>
                ) : (
                  <motion.div
                    className="text-6xl mb-4"
                    variants={badgeFlip}
                    initial="initial"
                    animate="animate"
                  >
                    {(celebrationData.icon as string) || '🏅'}
                  </motion.div>
                )}
                <h2 id="badge-celebration-title" className="font-display text-2xl font-bold text-white mb-2">
                  Badge Earned!
                </h2>
                <p className="font-display text-lg text-spark-purple font-semibold mb-1">
                  {(celebrationData.name as string) || 'Achievement Unlocked'}
                </p>
                <p className="font-body text-white/50 text-sm mb-6">
                  {(celebrationData.description as string) || 'You earned a new badge!'}
                </p>
                <button
                  onClick={dismissCelebration}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm emissive-glow"
                  style={
                    { '--glow-color': '#8B5CF6' } as React.CSSProperties
                  }
                >
                  Awesome!
                </button>
              </motion.div>
            </motion.div>
          </FocusTrap>
        )}

        {/* Level Up Modal — S5-HIGH-005: role="dialog", aria-modal, aria-label */}
        {/* Phase 1 audit fix (Section 8.1): FocusTrap + Escape key dismiss */}
        {celebrationType === 'level' && (
          <FocusTrap focusTrapOptions={{ escapeDeactivates: true, onDeactivate: dismissCelebration, allowOutsideClick: true }}>
            <motion.div
              className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-auto"
              variants={modalBackdrop}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={dismissCelebration}
              onKeyDown={(e) => { if (e.key === 'Escape') dismissCelebration(); }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="levelup-celebration-title"
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <motion.div
                className="relative glass-card-v2-elevated rounded-3xl p-8 max-w-sm mx-4 text-center"
                variants={activeModalContent}
                onClick={(e) => e.stopPropagation()}
              >
              {reduceMotion ? (
                <div className="text-7xl mb-4">⭐</div>
              ) : (
                <motion.div
                  className="text-7xl mb-4"
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ⭐
                </motion.div>
              )}
              <h2 id="levelup-celebration-title" className="font-display text-3xl font-bold text-white mb-2">
                Level Up!
              </h2>
              <p className="font-display text-xl text-spark-purple font-semibold mb-1">
                Level {(celebrationData?.level as number) || '?'}
              </p>
              <p className="font-body text-white/50 text-sm mb-2">
                {(celebrationData?.title as string) || 'Keep exploring!'}
              </p>
              {typeof celebrationData?.xpGained === 'number' && (
                <p className="font-mono text-spark-green text-sm mb-6">
                  +{celebrationData.xpGained} XP
                </p>
              )}
              <button
                onClick={dismissCelebration}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm emissive-glow"
                style={
                  { '--glow-color': '#00BBFF' } as React.CSSProperties
                }
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
          </FocusTrap>
        )}

        {/* XP Gain Toast — S5-HIGH-003: auto-dismiss 3s, S5-HIGH-005: role="status" */}
        {celebrationType === 'xp' && (
          <motion.div
            className="fixed top-6 right-6 z-[101] pointer-events-auto"
            initial={reduceMotion ? { opacity: 0 } : { x: 100, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: 100, opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <div className="glass-card-v2 px-5 py-3 flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-display text-lg font-bold text-white">
                  +{(celebrationData?.xp as number) || 0} XP
                </p>
                <p className="font-body text-white/40 text-xs">
                  {(celebrationData?.reason as string) || 'Great work!'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* S5-HIGH-002: Streak Milestone Toast — auto-dismiss 4s */}
        {celebrationType === 'streak' && celebrationData && (
          <motion.div
            className="fixed top-6 left-1/2 z-[101] pointer-events-auto -translate-x-1/2"
            initial={reduceMotion ? { opacity: 0 } : { y: -60, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: -60, opacity: 0 }}
            transition={reduceMotion ? { duration: 0.3 } : { type: 'spring', stiffness: 300, damping: 25 }}
            role="status"
            aria-live="polite"
          >
            <div className="glass-card-v2 px-6 py-4 flex items-center gap-4 border border-orange-500/20">
              {reduceMotion ? (
                <span className="text-3xl">🔥</span>
              ) : (
                <motion.span
                  className="text-3xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  🔥
                </motion.span>
              )}
              <div>
                <p className="font-display text-lg font-bold text-white">
                  {(celebrationData.count as number) || 0} Day Streak!
                </p>
                <p className="font-data text-sm text-orange-400 font-semibold">
                  {getStreakTier((celebrationData.count as number) || 0)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* S5-HIGH-002: Confetti-only celebration — no modal/toast, auto-dismiss 5s */}
        {celebrationType === 'confetti' && reduceMotion && (
          <motion.div
            className="fixed top-6 left-1/2 z-[101] -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <div className="glass-card-v2 px-5 py-3">
              <p className="font-display text-sm font-bold text-white">
                🎉 Celebration!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
