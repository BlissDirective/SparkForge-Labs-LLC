'use client';

// ================================================================
// SparkForge LabReconfiguration — Panel Morph Transition Orchestrator
// ================================================================
// Decision 3.1-3.5: Lab entry/exit transitions
// Decision 5.4: Dim trickle locked labs
//
// Phase 1 — Activation (0-0.2s): Hex tile pulses, LED flashes white
// Phase 2 — Content Swap (0.2-0.6s): Content slides out, glow sweeps
// Phase 3 — Instrument Update (0.4-0.8s): Sidebar updates, title appears
// Phase 4 — Environment Reveal (0.6-1.0s): New content slides in
//
// Total: 1.0s (Decision 3.5: same for all users)
// Uses GSAP for CSS transforms (GPU-composited, ~0ms overhead)

import { useCallback, useRef, useState, useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { useStationMode } from '@/hooks/useStationMode';
import { LAB_COLORS, LAB_NAMES } from '@/config/labs';

// Transition State Types
export type TransitionPhase =
  | 'idle'
  | 'activation'
  | 'content-swap'
  | 'instrument-update'
  | 'environment-reveal'
  | 'complete';

export interface LabTransitionState {
  phase: TransitionPhase;
  fromLabId: number | null;
  toLabId: number | null;
  progress: number;
  isTransitioning: boolean;
}

// Decision 5.4: Dim State for Locked Labs
export interface LockedLabVisuals {
  labId: number;
  isLocked: boolean;
  dimLevel: number; // 0.0 = visible, 1.0 = fully dimmed
  particleTrickle: boolean; // Minimal particles for locked labs
}

export function getLockedLabVisuals(
  labId: number,
  isUnlocked: boolean,
  hasStarted: boolean
): LockedLabVisuals {
  if (isUnlocked) {
    return { labId, isLocked: false, dimLevel: 0, particleTrickle: false };
  }
  return {
    labId,
    isLocked: true,
    dimLevel: hasStarted ? 0.4 : 0.7,
    particleTrickle: true,
  };
}

// Main Hook: useLabReconfiguration
export function useLabReconfiguration() {
  const { activeLabId, setLabId } = useStationMode();

  const [transitionState, setTransitionState] = useState<LabTransitionState>({
    phase: 'idle',
    fromLabId: null,
    toLabId: null,
    progress: 0,
    isTransitioning: false,
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Enter Lab Transition (1.0s — Decision 3.5)
  const enterLab = useCallback(
    (targetLabId: number, contentElement?: HTMLDivElement | null) => {
      if (transitionState.isTransitioning) return;

      const fromLab = activeLabId;
      const labColor = LAB_COLORS[targetLabId] || '#3B82F6';

      setTransitionState({
        phase: 'activation',
        fromLabId: fromLab,
        toLabId: targetLabId,
        progress: 0,
        isTransitioning: true,
      });

      if (timelineRef.current) timelineRef.current.kill();

      const tl = gsap.timeline({
        onComplete: () => {
          setTransitionState((prev) => ({
            ...prev,
            phase: 'complete',
            progress: 1.0,
            isTransitioning: false,
          }));
          setLabId(targetLabId);
        },
      });

      timelineRef.current = tl;
      const target = contentElement || contentRef.current;

      // Phase 1: Activation (0 - 0.2s)
      tl.call(() => {
        setTransitionState((prev) => ({
          ...prev, phase: 'activation', progress: 0.1,
        }));
      }, [], 0);

      // Phase 2: Content Swap (0.2 - 0.6s)
      if (target) {
        tl.to(target, {
          x: '-100%', opacity: 0, duration: 0.4, ease: 'power2.in',
          onStart: () => {
            setTransitionState((prev) => ({
              ...prev, phase: 'content-swap', progress: 0.3,
            }));
          },
        }, 0.2);
      }

      // Glow sweep overlay
      if (glowRef.current) {
        glowRef.current.style.background =
          `linear-gradient(90deg, transparent, ${labColor}40, transparent)`;
        tl.fromTo(glowRef.current,
          { x: '100%', opacity: 0.6 },
          { x: '-100%', opacity: 0, duration: 0.4, ease: 'power2.inOut' },
          0.2
        );
      }

      // Phase 3: Instrument Update (0.4 - 0.8s)
      tl.call(() => {
        setTransitionState((prev) => ({
          ...prev, phase: 'instrument-update', progress: 0.6,
        }));
      }, [], 0.4);

      // Title plate appear
      if (titleRef.current) {
        tl.fromTo(titleRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
          0.5
        );
      }

      // Phase 4: Environment Reveal (0.6 - 1.0s)
      if (target) {
        tl.set(target, { x: '100%', opacity: 0 }, 0.6);
        tl.to(target, {
          x: '0%', opacity: 1, duration: 0.4, ease: 'power2.out',
          onStart: () => {
            setTransitionState((prev) => ({
              ...prev, phase: 'environment-reveal', progress: 0.8,
            }));
          },
        }, 0.6);
      }

      return tl;
    },
    [transitionState.isTransitioning, activeLabId, setLabId]
  );

  // Exit Lab (Return to Dashboard) — 0.8s (slightly faster)
  const exitLab = useCallback(
    (contentElement?: HTMLDivElement | null) => {
      if (transitionState.isTransitioning) return;

      setTransitionState({
        phase: 'content-swap',
        fromLabId: activeLabId,
        toLabId: null,
        progress: 0,
        isTransitioning: true,
      });

      if (timelineRef.current) timelineRef.current.kill();

      const tl = gsap.timeline({
        onComplete: () => {
          setTransitionState({
            phase: 'idle', fromLabId: null, toLabId: null,
            progress: 0, isTransitioning: false,
          });
          setLabId(null);
        },
      });

      timelineRef.current = tl;
      const target = contentElement || contentRef.current;

      // Slide current content RIGHT
      if (target) {
        tl.to(target, {
          x: '100%', opacity: 0, duration: 0.35, ease: 'power2.in',
        });
        // Restore dashboard content from LEFT
        tl.set(target, { x: '-100%', opacity: 0 });
        tl.to(target, {
          x: '0%', opacity: 1, duration: 0.35, ease: 'power2.out',
        });
      }

      return tl;
    },
    [transitionState.isTransitioning, activeLabId, setLabId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, []);

  return {
    transitionState,
    enterLab,
    exitLab,
    contentRef,
    titleRef,
    glowRef,
    getLockedLabVisuals,
    labColors: LAB_COLORS,
    labNames: LAB_NAMES,
  };
}

// Transition Overlay Component
// Renders the glow sweep and title plate overlays
interface TransitionOverlayProps {
  glowRef: RefObject<HTMLDivElement>;
  titleRef: RefObject<HTMLDivElement>;
  transitionState: LabTransitionState;
}

export function TransitionOverlay({
  glowRef,
  titleRef,
  transitionState,
}: TransitionOverlayProps) {
  const labName = transitionState.toLabId
    ? LAB_NAMES[transitionState.toLabId] || ''
    : '';
  const labColor = transitionState.toLabId
    ? LAB_COLORS[transitionState.toLabId] || '#3B82F6'
    : '#3B82F6';

  return (
    <>
      {/* Glow sweep overlay */}
      <div
        ref={glowRef}
        className="fixed inset-0 z-30 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${labColor}40, transparent)`,
          transform: 'translateX(100%)',
          opacity: 0,
        }}
        aria-hidden="true"
      />

      {/* Lab title plate — appears during Phase 3 */}
      {transitionState.isTransitioning && transitionState.toLabId && (
        <div
          ref={titleRef}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div
            className="px-6 py-2 rounded-lg backdrop-blur-md border"
            style={{
              backgroundColor: `${labColor}20`,
              borderColor: `${labColor}40`,
            }}
          >
            <p
              className="font-display text-sm font-bold tracking-wider text-white/90"
              style={{ textShadow: `0 0 10px ${labColor}` }}
            >
              {labName}
            </p>
          </div>
        </div>
      )}

      {/* Particle burst — 50 particles stream inward during Phase 4 */}
      {transitionState.phase === 'environment-reveal' && (
        <div className="fixed inset-0 z-[25] pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: 50 }).map((_, i) => {
            const side = i % 4;
            const startX = side === 0 ? '-5%' : side === 1 ? '105%' : `${Math.random() * 100}%`;
            const startY = side === 2 ? '-5%' : side === 3 ? '105%' : `${Math.random() * 100}%`;
            return (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: startX,
                  top: startY,
                  backgroundColor: labColor,
                  boxShadow: `0 0 4px ${labColor}`,
                  animation: `particle-inward 0.4s ease-out ${i * 0.008}s forwards`,
                  opacity: 0.6,
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
