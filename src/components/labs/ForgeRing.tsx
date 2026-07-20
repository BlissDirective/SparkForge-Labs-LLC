'use client';

// ════════════════════════════════════════════════════════════════
// FORGE RING — Forge F5 (Concept 10 Part 9) — lab selection ring
// ════════════════════════════════════════════════════════════════
// 11 crucible orbs on a CSS-3D carousel. ZERO canvas. Keyboard/ARIA
// contract: role=listbox, ←/→ rotate one slot, Enter expands the
// front orb, Escape collapses; aria-activedescendant tracks front.
// Reduced-motion: slot changes are instant. The Grid view remains
// the a11y-guaranteed baseline (page-level toggle).

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ForgePanel, ForgeButton, ForgeDial, HoloChip } from '@/components/forge';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface RingLab {
  num: number;
  name: string;
  color: string;
  icon: string;
  poetic?: string;
  gamesCount: number;
  progress: number; // 0..100
}

export interface ForgeRingProps {
  labs: RingLab[];
  onEnter: (labNum: number) => void;
  className?: string;
}

const RADIUS = 340;

export function ForgeRing({ labs, onEnter, className = '' }: ForgeRingProps) {
  const reducedMotion = useReducedMotion();
  const n = labs.length;
  const step = 360 / n;
  // rotation of the carrier in degrees; front slot = -rotation/step
  const [rotation, setRotation] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const frontIndex = useMemo(() => {
    const idx = Math.round(-rotation / step) % n;
    return (idx + n) % n;
  }, [rotation, step, n]);

  const rotateTo = useCallback(
    (index: number) => {
      setExpanded(false);
      // Choose the shortest rotation direction to the target slot.
      setRotation((prev) => {
        const current = -prev / step;
        let delta = index - (((Math.round(current) % n) + n) % n);
        if (delta > n / 2) delta -= n;
        if (delta < -n / 2) delta += n;
        return prev - delta * step;
      });
    },
    [step, n]
  );

  const rotateBy = useCallback(
    (slots: number) => {
      setExpanded(false);
      setRotation((prev) => prev - slots * step);
    },
    [step]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        rotateBy(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        rotateBy(-1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setExpanded((x) => !x);
      } else if (e.key === 'Escape') {
        setExpanded(false);
      }
    },
    [rotateBy]
  );

  const front = labs[frontIndex];

  return (
    <div className={`relative ${className}`}>
      {/* ── The ring stage ── */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Choose a lab"
        aria-activedescendant={`forge-ring-option-${front?.num}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative mx-auto outline-none focus-visible:ring-2 rounded-3xl"
        style={{
          width: '100%',
          maxWidth: 860,
          height: 420,
          perspective: 1200,
          ['--tw-ring-color' as string]: 'rgb(var(--sf-border-focus) / 1)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(-${RADIUS}px) rotateY(${rotation}deg)`,
            transition: reducedMotion ? 'none' : 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {labs.map((lab, i) => {
            const isFront = i === frontIndex;
            // Angular distance from front (0..n/2) for depth fading.
            const dist = Math.min(
              Math.abs(i - frontIndex),
              n - Math.abs(i - frontIndex)
            );
            const facingAway = dist > n / 4;
            return (
              <div
                key={lab.num}
                id={`forge-ring-option-${lab.num}`}
                role="option"
                aria-selected={isFront}
                aria-label={`Lab ${lab.num}, ${lab.name}, ${Math.round(lab.progress)} percent forged, ${lab.gamesCount} games`}
                className="absolute left-1/2 top-1/2 cursor-pointer"
                style={{
                  width: 150,
                  height: 190,
                  marginLeft: -75,
                  marginTop: -95,
                  transform: `rotateY(${i * step}deg) translateZ(${RADIUS}px) ${isFront ? 'scale(1.18)' : 'scale(1)'}`,
                  transition: reducedMotion ? 'none' : 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms',
                  opacity: facingAway ? 0.35 : 1,
                  pointerEvents: facingAway ? 'none' : 'auto',
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => (isFront ? setExpanded(true) : rotateTo(i))}
              >
                <ForgePanel
                  variant="alloy"
                  as="div"
                  glow={isFront ? 'active' : 'none'}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center"
                >
                  <ForgeDial
                    value={lab.progress / 100}
                    size={72}
                    thickness={5}
                    color={lab.color}
                    label={`${lab.name} completion`}
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {lab.icon}
                    </span>
                  </ForgeDial>
                  <span
                    className="text-xs font-semibold leading-tight"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'rgb(var(--sf-text-primary) / 1)',
                    }}
                  >
                    {lab.name}
                  </span>
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--sf-text-muted) / 1)' }}
                  >
                    {Math.round(lab.progress)}% · {lab.gamesCount} games
                  </span>
                </ForgePanel>
              </div>
            );
          })}
        </div>

        {/* prev/next controls (mouse users) */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3">
          <ForgeButton variant="alloy" size="sm" sparks={false} onClick={() => rotateBy(-1)} aria-label="Previous lab">
            ←
          </ForgeButton>
          <ForgeButton variant="alloy" size="sm" sparks={false} onClick={() => rotateBy(1)} aria-label="Next lab">
            →
          </ForgeButton>
        </div>
      </div>

      {/* ── Expanded front card ── */}
      <AnimatePresence>
        {expanded && front && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(22, 16, 11, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setExpanded(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${front.name} details`}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
              <ForgePanel variant="glass" glow="active" as="div" className="p-6 space-y-4 text-center">
                <div className="flex justify-center">
                  <ForgeDial value={front.progress / 100} size={88} thickness={7} color={front.color} label={`${front.name} completion`}>
                    <span className="text-4xl" aria-hidden="true">{front.icon}</span>
                  </ForgeDial>
                </div>
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: 'var(--font-display)', color: 'rgb(var(--sf-text-primary) / 1)', textShadow: 'var(--glow-text, none)' }}
                  >
                    {front.name}
                  </h2>
                  {front.poetic && (
                    <p className="text-sm mt-1" style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}>
                      {front.poetic}
                    </p>
                  )}
                </div>
                <div className="flex justify-center gap-2">
                  <HoloChip tone="amber">{front.gamesCount} games</HoloChip>
                  <HoloChip tone="green">{Math.round(front.progress)}% forged</HoloChip>
                </div>
                <div className="flex gap-2 justify-center pt-1">
                  <ForgeButton variant="molten" onClick={() => onEnter(front.num)}>
                    Enter Lab
                  </ForgeButton>
                  <ForgeButton variant="ghost" onClick={() => setExpanded(false)}>
                    Close
                  </ForgeButton>
                </div>
              </ForgePanel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SR guidance */}
      <p className="sr-only">
        Use left and right arrow keys to rotate the lab ring, Enter to open the
        selected lab, Escape to close. A grid view of all labs is available via
        the view toggle.
      </p>
    </div>
  );
}
