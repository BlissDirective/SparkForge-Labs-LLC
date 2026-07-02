'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const BRAND_COLORS = ['#4DE9FF', '#E945F5', '#4F6EF7', '#FFD93D', '#2ECC71'];

/** Pieces live ~1.6s; keep the overlay a little longer for stragglers. */
const LIFETIME_MS = 1900;
const POP_LIFETIME_MS = 900;

interface ConfettiBurstProps {
  /**
   * Increment this number to fire a burst. The initial value never fires
   * (no spawn at first render — no hydration risk).
   */
  trigger: number;
  /** Burst origin as a fraction of the viewport width (0–1). Default 0.5. */
  originX?: number;
  /** Burst origin as a fraction of the viewport height (0–1). Default 0.4. */
  originY?: number;
  colors?: string[];
  count?: number;
}

interface Piece {
  id: string;
  color: string;
  size: number;
  circle: boolean;
  dx: number;
  upY: number;
  fallY: number;
  rotate: number;
  delay: number;
  duration: number;
}

function makePieces(burst: number, count: number, colors: string[]): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 190;
    return {
      id: `${burst}-${i}`,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      circle: Math.random() < 0.35,
      dx: Math.cos(angle) * speed,
      upY: 40 + Math.random() * 150,
      fallY: 230 + Math.random() * 280,
      rotate: (Math.random() - 0.5) * 720,
      delay: Math.random() * 0.12,
      duration: 1.3 + Math.random() * 0.35,
    };
  });
}

/**
 * ConfettiBurst — earned-win celebration burst, pure DOM + motion
 * (no canvas dependency).
 *
 * When `trigger` increments, spawns `count` rectangles/circles that launch
 * outward, arc up, then fall with gravity easing over ~1.6s and clean up.
 * Client-only, spawned strictly post-interaction, so Math.random here is
 * hydration-safe.
 *
 * Reduced motion: a single scale/opacity "pop" badge instead of particles.
 */
export default function ConfettiBurst({
  trigger,
  originX = 0.5,
  originY = 0.4,
  colors = BRAND_COLORS,
  count = 40,
}: ConfettiBurstProps) {
  const prefersReducedMotion = useReducedMotion();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [pops, setPops] = useState<number[]>([]);
  // Initialized to the mount-time value, so the first render never fires.
  const lastTrigger = useRef(trigger);
  const timeouts = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    if (trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    const burst = trigger;

    if (prefersReducedMotion) {
      setPops((prev) => [...prev, burst]);
      timeouts.current.push(
        setTimeout(
          () => setPops((prev) => prev.filter((b) => b !== burst)),
          POP_LIFETIME_MS,
        ),
      );
      return;
    }

    setPieces((prev) => [...prev, ...makePieces(burst, count, colors)]);
    timeouts.current.push(
      setTimeout(
        () =>
          setPieces((prev) =>
            prev.filter((piece) => !piece.id.startsWith(`${burst}-`)),
          ),
        LIFETIME_MS,
      ),
    );
  }, [trigger, prefersReducedMotion, count, colors]);

  useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  if (pieces.length === 0 && pops.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 60,
      }}
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${originX * 100}%`,
            top: `${originY * 100}%`,
            width: p.size,
            height: p.circle ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.circle ? '50%' : 2,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.dx * 0.7, p.dx],
            y: [0, -p.upY, p.fallY],
            rotate: p.rotate,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            times: [0, 0.32, 1],
            ease: ['easeOut', 'easeIn'],
          }}
        />
      ))}

      <AnimatePresence>
        {pops.map((b) => (
          <motion.div
            key={b}
            style={{
              position: 'absolute',
              left: `${originX * 100}%`,
              top: `${originY * 100}%`,
              width: 56,
              height: 56,
              marginLeft: -28,
              marginTop: -28,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors[0]} 0%, ${
                colors[1 % colors.length]
              } 70%, transparent 100%)`,
              boxShadow: `0 0 24px ${colors[0]}`,
            }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.6, 1.15, 1], opacity: [0, 1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, times: [0, 0.6, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
