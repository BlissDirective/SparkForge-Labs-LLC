'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusTrap from 'focus-trap-react';
import { useUIStore } from '@/stores/uiStore';
import { useA11yStore } from '@/stores/accessibilityStore';

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

// Physics confetti particle
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  size: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

// v3: Station-aesthetic confetti colors (Frost-Prismatic palette)
const CONFETTI_COLORS = [
  '#00BBFF', // Primary blue
  '#8B5CF6', // Purple
  '#00FF88', // Neon green
  '#FFD700', // Gold
  '#FF6B6B', // Coral
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#AA66FF', // REO purple
];

function createConfettiParticle(id: number): ConfettiParticle {
  return {
    id,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 2 + 1,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 15,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 8 + 4,
    opacity: 1,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  };
}

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
  const { reduceMotion } = useA11yStore();
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const animFrame = useRef<number>(0);
  const isMounted = useRef<boolean>(true); // S5-WARN-002: unmount guard

  // v2 [ENH]: Sound event hook points (actual audio in Stage 5)
  const playSound = useCallback((event: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sparkforge:sound', { detail: { event } })
      );
    }
  }, []);

  // S5-WARN-002: Set isMounted on mount/unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Physics confetti engine — S5-HIGH-004: skip when reduceMotion, S5-WARN-002: unmount guard
  useEffect(() => {
    if (!celebrationType) {
      setConfetti([]);
      return;
    }

    // S5-HIGH-004: Skip confetti physics entirely when reduceMotion is true
    if (reduceMotion) {
      return;
    }

    // Create initial burst
    const particles = Array.from({ length: 60 }, (_, i) =>
      createConfettiParticle(i)
    );
    setConfetti(particles);
    playSound('celebration');

    // Animate with physics
    let frameCount = 0;
    function animate() {
      frameCount++;

      // S5-WARN-002: Check isMounted before each setConfetti call
      if (!isMounted.current) return;

      setConfetti((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.3,
            y: p.y + p.vy,
            vy: p.vy + 0.08, // gravity
            rotation: p.rotation + p.rotSpeed,
            opacity: Math.max(0, p.opacity - 0.003),
          }))
          .filter((p) => p.y < 120 && p.opacity > 0)
      );

      // Add new particles in waves
      if (frameCount % 8 === 0 && frameCount < 120) {
        if (!isMounted.current) return;
        setConfetti((prev) => [
          ...prev,
          ...Array.from({ length: 5 }, (_, i) =>
            createConfettiParticle(prev.length + i)
          ),
        ]);
      }

      if (frameCount < 300) {
        animFrame.current = requestAnimationFrame(animate);
      }
    }

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
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
        {/* Confetti layer — S5-HIGH-005: aria-hidden on confetti */}
        {!reduceMotion && (
          <div aria-hidden="true">
            {confetti.map((p) => (
              <div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.shape === 'rect' ? p.size * 0.6 : p.size,
                  backgroundColor: p.color,
                  borderRadius: p.shape === 'circle' ? '50%' : '2px',
                  transform: `rotate(${p.rotation}deg)`,
                  opacity: p.opacity,
                  boxShadow: `0 0 ${p.size}px ${p.color}40`,
                }}
              />
            ))}
          </div>
        )}

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
                className="relative glass-card rounded-3xl p-8 max-w-sm mx-4 text-center"
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
                className="relative glass-card rounded-3xl p-8 max-w-sm mx-4 text-center"
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
            <div className="glass-card rounded-2xl px-5 py-3 flex items-center gap-3">
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
            <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-4 border border-orange-500/20">
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
            <div className="glass-card rounded-2xl px-5 py-3">
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
