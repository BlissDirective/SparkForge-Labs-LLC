'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface CardSwapProps {
  items: React.ReactNode[];
  /** Auto-advance interval in ms. 0 (default) = manual only. */
  interval?: number;
  /** Height of the card stack in px. */
  height?: number;
  className?: string;
}

/** Front card + 2 peeking behind. */
const VISIBLE_DEPTH = 3;
const DEPTH_Y = 14;
const DEPTH_SCALE = 0.05;

/**
 * CardSwap — small stacked-gallery.
 *
 * Shows the active card in front with up to 2 behind, offset up and scaled
 * down. Clicking the stack (or auto-advance via `interval`) swaps with a
 * spring: the front card slides off to the right while the next promotes.
 * Dots + prev/next arrows with aria-labels; ArrowLeft/ArrowRight work while
 * the stack is focused.
 *
 * Reduced motion: crossfade between cards instead of the slide/spring.
 */
export default function CardSwap({
  items,
  interval = 0,
  height = 220,
  className = '',
}: CardSwapProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const n = items.length;

  const advance = useCallback(
    (dir: number) => {
      if (n < 2) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (interval <= 0 || n < 2) return;
    const timer = setInterval(() => advance(1), interval);
    return () => clearInterval(timer);
  }, [interval, n, advance]);

  if (n === 0) return null;

  const visible = Array.from(
    { length: Math.min(VISIBLE_DEPTH, n) },
    (_, depth) => ({ depth, itemIdx: (index + depth) % n }),
  );

  return (
    <div className={className}>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`Card gallery, card ${index + 1} of ${n}`}
        tabIndex={0}
        className="relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        style={{ height, borderRadius: 16 }}
        onClick={() => advance(1)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            advance(1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            advance(-1);
          }
        }}
      >
        {prefersReducedMotion ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {items[index]}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map(({ depth, itemIdx }) => (
              <motion.div
                key={itemIdx}
                className="absolute inset-0"
                style={{
                  zIndex: VISIBLE_DEPTH - depth,
                  transformOrigin: 'top center',
                }}
                initial={{
                  y: -VISIBLE_DEPTH * DEPTH_Y,
                  scale: 1 - VISIBLE_DEPTH * DEPTH_SCALE,
                  opacity: 0,
                }}
                animate={{
                  y: -depth * DEPTH_Y,
                  scale: 1 - depth * DEPTH_SCALE,
                  opacity: depth === VISIBLE_DEPTH - 1 && n > VISIBLE_DEPTH ? 0.65 : 1,
                }}
                exit={{ x: 160, rotate: 6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              >
                {items[itemIdx]}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous card"
          onClick={() => advance(-1)}
          className="flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
          style={{
            width: 32,
            height: 32,
            border: '1px solid rgba(128,128,128,0.45)',
          }}
        >
          <span aria-hidden="true">&larr;</span>
        </button>

        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
              className="rounded-full transition-colors"
              style={{
                width: 8,
                height: 8,
                background: i === index ? '#4DE9FF' : 'rgba(128,128,128,0.45)',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next card"
          onClick={() => advance(1)}
          className="flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
          style={{
            width: 32,
            height: 32,
            border: '1px solid rgba(128,128,128,0.45)',
          }}
        >
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  );
}
