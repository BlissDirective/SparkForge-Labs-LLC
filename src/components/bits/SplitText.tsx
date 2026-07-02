'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Start delay in seconds before the first unit animates. */
  delay?: number;
  /** Stagger between units in seconds. */
  stagger?: number;
  /** Split granularity. */
  by?: 'word' | 'char';
}

/**
 * SplitText — heading reveal. Splits text into words or characters and
 * staggers each in with a spring (y 14→0, fade, slight blur clear).
 * Screen readers get the full text once via aria-label; the split spans
 * are aria-hidden. Reduced motion renders plain text instantly.
 */
export default function SplitText({
  text,
  className = '',
  delay = 0,
  stagger = 0.04,
  by = 'word',
}: SplitTextProps) {
  const prefersReducedMotion = useReducedMotion();

  const units = useMemo(() => {
    if (by === 'char') return Array.from(text);
    // Keep whitespace as its own units so spacing is preserved exactly.
    return text.split(/(\s+)/).filter((s) => s.length > 0);
  }, [text, by]);

  if (prefersReducedMotion) {
    return <span className={`inline-block ${className}`}>{text}</span>;
  }

  return (
    <span aria-label={text} className={`inline-block ${className}`}>
      <span className="sr-only">{text}</span>
      {units.map((unit, i) => (
        <motion.span
          key={`${unit}-${i}`}
          aria-hidden="true"
          className="inline-block"
          style={{ whiteSpace: 'pre', willChange: 'transform, opacity, filter' }}
          initial={{ y: 14, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{
            delay: delay + i * stagger,
            type: 'spring',
            stiffness: 320,
            damping: 26,
            filter: { delay: delay + i * stagger, duration: 0.35, ease: 'easeOut' },
            opacity: { delay: delay + i * stagger, duration: 0.3, ease: 'easeOut' },
          }}
        >
          {unit}
        </motion.span>
      ))}
    </span>
  );
}
