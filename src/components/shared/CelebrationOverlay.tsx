'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';

// CelebrationOverlay — Confetti, Badge Flips, Level-Up Modals
// v2: Physics confetti, badge flip, sound hooks, LevelUpCeremony wiring
// v3: R3F particle burst readiness, station-aesthetic colors

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

export function CelebrationOverlay() {
  const { celebrationType, celebrationData, dismissCelebration } = useUIStore();
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const animFrame = useRef<number>(0);

  // v2 [ENH]: Sound event hook points (actual audio in Stage 5)
  const playSound = useCallback((event: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sparkforge:sound', { detail: { event } })
      );
    }
  }, []);

  // Physics confetti engine
  useEffect(() => {
    if (!celebrationType) {
      setConfetti([]);
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
  }, [celebrationType, playSound]);

  if (!celebrationType) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Confetti layer */}
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

        {/* Badge Earned Modal */}
        {celebrationType === 'badge' && celebrationData && (
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-auto"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={dismissCelebration}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              className="relative glass-card rounded-3xl p-8 max-w-sm mx-4 text-center"
              variants={modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="text-6xl mb-4"
                variants={badgeFlip}
                initial="initial"
                animate="animate"
              >
                {(celebrationData.icon as string) || '🏅'}
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
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
        )}

        {/* Level Up Modal */}
        {celebrationType === 'level' && (
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-auto"
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={dismissCelebration}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              className="relative glass-card rounded-3xl p-8 max-w-sm mx-4 text-center"
              variants={modalContent}
              onClick={(e) => e.stopPropagation()}
            >
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
              <h2 className="font-display text-3xl font-bold text-white mb-2">
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
        )}

        {/* XP Gain Toast */}
        {celebrationType === 'xp' && (
          <motion.div
            className="fixed top-6 right-6 z-[101] pointer-events-auto"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
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
      </div>
    </AnimatePresence>
  );
}
