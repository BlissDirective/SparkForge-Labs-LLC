'use client';

// ═══════════════════════════════════════════════════════════════════
// BlurText — Staggered blur-to-focus word entrance
// ═══════════════════════════════════════════════════════════════════
// Phase 4 §10.5: Copy-paste pattern from React Bits / Magic UI. Used
// for game phase transitions (welcome → learn → play → complete) and
// any prose moment where we want a cinematic word-by-word reveal.
//
// Technique: Motion (formerly Framer Motion) — each word animates
// from blur(8px) + opacity 0 + y(6px) to blur(0) + opacity 1 + y(0)
// with a stagger. Respects prefers-reduced-motion (instant reveal).
//
// Usage:
//   <BlurText>Welcome to the AI Lab</BlurText>
//   <BlurText staggerDelay={0.04} className="text-2xl font-display">
//     Phase 3 complete
//   </BlurText>
// ═══════════════════════════════════════════════════════════════════

import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';

interface BlurTextProps {
  children: string;
  /** Delay between each word in seconds. Default: 0.06. */
  staggerDelay?: number;
  /** Duration of each word's entrance in seconds. Default: 0.6. */
  duration?: number;
  /** Split by word (default) or by character. */
  splitBy?: 'word' | 'char';
  className?: string;
  style?: CSSProperties;
}

export function BlurText({
  children,
  staggerDelay = 0.06,
  duration = 0.6,
  splitBy = 'word',
  className,
  style,
}: BlurTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const parts =
    splitBy === 'word' ? children.split(/(\s+)/) : Array.from(children);

  return (
    <span className={clsx('inline-block', className)} style={style}>
      {parts.map((part, i) => {
        if (splitBy === 'word' && /^\s+$/.test(part)) {
          // Preserve whitespace without animating
          return <span key={i}>{part}</span>;
        }
        return (
          <motion.span
            key={i}
            className="inline-block"
            initial={
              prefersReducedMotion
                ? { opacity: 1, filter: 'blur(0)', y: 0 }
                : { opacity: 0, filter: 'blur(8px)', y: 6 }
            }
            animate={{ opacity: 1, filter: 'blur(0)', y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : duration,
              delay: prefersReducedMotion ? 0 : i * staggerDelay,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {part}
          </motion.span>
        );
      })}
    </span>
  );
}
