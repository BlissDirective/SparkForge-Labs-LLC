'use client';

import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StickerPeelProps {
  /** The sticker face. */
  children: React.ReactNode;
  /** What is revealed underneath once peeled. */
  revealContent: React.ReactNode;
  onPeeled?: () => void;
  /** Square sticker size in px. */
  size?: number;
}

type PeelStatus = 'idle' | 'peeling' | 'peeled';

/** Pointer movement below this (px) counts as a plain click. */
const CLICK_SLOP = 6;

/**
 * StickerPeel — badge-reveal interaction.
 *
 * The sticker starts with a folded corner (a triangular gradient flap at the
 * top-right). Dragging the flap toward the bottom-left past the threshold —
 * or a plain click/tap, or Enter/Space while focused — peels the whole
 * sticker away with a curl-ish rotate/scale animation, revealing
 * `revealContent` underneath (with a subtle inset shadow). A partial drag
 * that is released early springs back.
 *
 * Reduced motion: a simple crossfade reveal.
 */
export default function StickerPeel({
  children,
  revealContent,
  onPeeled,
  size = 160,
}: StickerPeelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [status, setStatus] = useState<PeelStatus>('idle');
  const [progress, setProgress] = useState(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const threshold = size * 0.45;

  const startPeel = () => {
    setStatus((s) => (s === 'idle' ? 'peeling' : s));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (status !== 'idle') return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || status !== 'idle') return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // Peel direction: from the top-right flap toward the bottom-left.
    const toward = Math.max(0, (-dx + dy) / 2);
    const p = Math.min(1, toward / threshold);
    setProgress(p);
    if (p >= 1) {
      dragStart.current = null;
      startPeel();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;
    if (Math.hypot(dx, dy) < CLICK_SLOP) {
      startPeel(); // plain click, no drag
    } else {
      setProgress(0); // released early — spring back
    }
  };

  const flapSize = 26 + progress * size * 0.35;

  const peelPose = prefersReducedMotion
    ? { opacity: 0 }
    : {
        x: -size * 0.7,
        y: size * 0.5,
        rotate: -26,
        scale: 0.5,
        opacity: 0,
      };

  const idlePose = prefersReducedMotion
    ? { opacity: 1 }
    : {
        x: -progress * size * 0.12,
        y: progress * size * 0.08,
        rotate: -progress * 8,
        scale: 1 - progress * 0.04,
        opacity: 1,
      };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Revealed layer underneath. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: 14,
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        {revealContent}
      </div>

      {status !== 'peeled' && (
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="Peel the sticker to reveal what is underneath"
          className="absolute inset-0 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          style={{
            borderRadius: 14,
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
            cursor: status === 'idle' ? 'grab' : 'default',
            touchAction: 'none',
            userSelect: 'none',
          }}
          animate={status === 'peeling' ? peelPose : idlePose}
          transition={
            status === 'peeling'
              ? { duration: prefersReducedMotion ? 0.35 : 0.55, ease: 'easeIn' }
              : { type: 'spring', stiffness: 300, damping: 26 }
          }
          onAnimationComplete={() => {
            if (status === 'peeling') {
              setStatus('peeled');
              onPeeled?.();
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            dragStart.current = null;
            setProgress(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              startPeel();
            }
          }}
        >
          {children}

          {/* Folded-corner flap (grows as you drag). */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: flapSize,
              height: flapSize,
              clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
              background:
                'linear-gradient(225deg, rgba(255,255,255,0.92) 0%, rgba(226,232,240,0.75) 45%, rgba(15,23,42,0.3) 100%)',
              filter: 'drop-shadow(-2px 2px 3px rgba(0,0,0,0.35))',
              borderBottomLeftRadius: 4,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
