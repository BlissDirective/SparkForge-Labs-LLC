'use client';

import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface BentoItem {
  id: string;
  /** Grid columns this cell spans. */
  colSpan?: number;
  /** Grid rows this cell spans. */
  rowSpan?: number;
  /** Optional border/glow tint for this cell (hex). */
  glowColor?: string;
  content: React.ReactNode;
}

interface MagicBentoProps {
  items: BentoItem[];
  className?: string;
  /** Minimum cell width in px (auto-fit column basis). */
  minCell?: number;
}

/**
 * MagicBento — bento grid wrapper.
 *
 * Renders items in a dense auto-fit CSS grid. Each cell gets a soft border,
 * a hover lift (y -3 + shadow), and an optional per-cell `glowColor` border
 * tint. Purely structural — cell content is caller-provided.
 *
 * Reduced motion: no hover lift.
 */
export default function MagicBento({
  items,
  className = '',
  minCell = 180,
}: MagicBentoProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${minCell}px, 1fr))`,
        gridAutoFlow: 'dense',
        gap: 16,
      }}
    >
      {items.map((item) => {
        const border = item.glowColor
          ? `1px solid ${item.glowColor}66`
          : '1px solid rgba(128,128,128,0.3)';
        const hoverShadow = item.glowColor
          ? `0 12px 28px rgba(0,0,0,0.28), 0 0 18px ${item.glowColor}44`
          : '0 12px 28px rgba(0,0,0,0.28)';

        return (
          <motion.div
            key={item.id}
            className="overflow-hidden"
            style={{
              gridColumn: item.colSpan ? `span ${item.colSpan}` : undefined,
              gridRow: item.rowSpan ? `span ${item.rowSpan}` : undefined,
              borderRadius: 16,
              border,
            }}
            whileHover={
              prefersReducedMotion ? undefined : { y: -3, boxShadow: hoverShadow }
            }
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            {item.content}
          </motion.div>
        );
      })}
    </div>
  );
}
