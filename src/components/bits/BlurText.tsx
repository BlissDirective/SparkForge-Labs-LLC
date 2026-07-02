'use client';

import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface BlurTextProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  /** Delay in seconds once in view. */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
}

/**
 * BlurText — soft reveal. The whole text blurs in (blur 12→0, fade,
 * y 8→0) once it enters the viewport (fires once). Reduced motion
 * renders the text statically.
 */
export default function BlurText({
  text,
  children,
  className = '',
  delay = 0,
  duration = 0.8,
}: BlurTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const content = text ?? children;

  if (prefersReducedMotion) {
    return <span className={`inline-block ${className}`}>{content}</span>;
  }

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ willChange: 'transform, opacity, filter' }}
      initial={{ opacity: 0, y: 8, filter: 'blur(12px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px 25% 0px' }}
      transition={{ delay, duration, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {content}
    </motion.span>
  );
}
