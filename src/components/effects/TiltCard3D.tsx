'use client';

// ═══════════════════════════════════════════════════════════════════
// TiltCard3D — Perspective-based card tilt on hover
// ═══════════════════════════════════════════════════════════════════
// Phase 4 §10.5: Copy-paste pattern from React Bits / Magic UI.
// For game cards in the arcade grid, featured lab cards, and any
// surface we want to feel "pickable". Cursor position within the card
// drives rotateX/rotateY.
//
// Technique: motion/react spring with onMouseMove tracking cursor NDC
// within bounds. Applies transform-origin: center and perspective.
// No JS animation frame loop — spring physics are GPU-driven via CSS
// 3D transform. Respects prefers-reduced-motion (disables tilt).
//
// Usage:
//   <TiltCard3D className="glass-card-v2 p-6" maxTilt={10}>
//     <h3>Pet Trainer</h3>
//     <p>Ages 7-9 · Flagship</p>
//   </TiltCard3D>
// ═══════════════════════════════════════════════════════════════════

import { useRef, type ReactNode, type CSSProperties } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

interface TiltCard3DProps {
  children: ReactNode;
  /** Max rotation in degrees (applied at the card edge). Default: 8. */
  maxTilt?: number;
  /** Additional scale on hover. Default: 1.02. */
  hoverScale?: number;
  /** Perspective depth in px. Higher = flatter. Default: 800. */
  perspective?: number;
  /** Enable a subtle glare/highlight following cursor. Default: true. */
  withGlare?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function TiltCard3D({
  children,
  maxTilt = 8,
  hoverScale = 1.02,
  perspective = 800,
  withGlare = true,
  className,
  style,
  onClick,
}: TiltCard3DProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Normalized cursor position within the card (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring-damped so motion feels natural (not snappy)
  const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };
  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]),
    springConfig
  );

  // Glare position (0-100%) — always computed to preserve hooks order
  const glareX = useTransform(x, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(y, [-0.5, 0.5], [0, 100]);
  const glareBackground = useTransform(
    [glareX, glareY] as const,
    (latest: number[]) =>
      `radial-gradient(circle at ${latest[0]}% ${latest[1]}%, rgba(255,255,255,0.14) 0%, transparent 55%)`
  );

  const onMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(relX);
    y.set(relY);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      whileHover={prefersReducedMotion ? undefined : { scale: hoverScale }}
      transition={{ duration: 0.2 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {children}
      {withGlare && !prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: glareBackground,
          }}
        />
      )}
    </motion.div>
  );
}
