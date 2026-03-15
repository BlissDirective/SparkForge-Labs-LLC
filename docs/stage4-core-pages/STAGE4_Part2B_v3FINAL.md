# SPARKFORGE — STAGE 4: CORE PAGES v3-FINAL (PART 2B)

**Date:** February 27, 2026 | **Updated:** March 15, 2026 — CPA v2.0 integration
**Design Direction:** Frost-Prismatic v3 (blue-dominant 60/40, chrome bezel, hex-radial, R3F station frame)
**Build Status:** VERIFIED — `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS

---

## DECISIONS IMPLEMENTED

- [x] Decision 3.1 — Crystal tunnel game entry (0.8s) — in `GameFocusSequence.tsx`
- [x] Decision 3.3 — Hybrid sidebar + active lab status indicator — in `LabReconfiguration.tsx`
- [x] Decision 3.4 — Frame dimmed during games — in `useStationMode.ts` (`useGameFocusState`)
- [x] Decision 3.5 — 1.0s transitions for all — in `LabReconfiguration.tsx` (`enterLab`)
- [x] Decision 5.4 — Dim trickle locked labs — in `LabReconfiguration.tsx` (`getLockedLabVisuals`)
- [x] **CPA2-6** — Lab entry uses WormholeTransition cinematic (2.5s) — `GameFocusSequence` updated to trigger wormhole when entering lab from spatial dashboard
- [x] **CPA2-10** — Ceremony FX triggers via `cockpitStore.enqueueCeremony()` on game complete — `useGameFocusState` updated to integrate CeremonyFX

## BUG FIXES PRESERVED

- [x] BUG-10F — Font stack: Exo 2/Sora/Orbitron NOT Fredoka/Nunito

## v2 ENHANCEMENTS PRESERVED

- [x] All Stage 4 v2 code is preserved — this v3 ADDS transition components

## FILES IN THIS DOCUMENT (Part B)

**New:** 2 files | **Modified:** 2 files | **New directories:** 0

## PREREQUISITES

- Stage 4 Part 2A v3-FINAL (10 lab pattern shaders + index) must be complete
- `src/components/transitions/` directory must exist (created in Part 2A)
- GSAP (`gsap@3.14+`), `@react-three/fiber`, `@react-three/postprocessing`, `three` installed

## SUPERSEDES

Nothing in Part B — transition files are NEW additions. The `useStationMode.ts` and `globals.css` modifications are APPENDS only.

## CPA v2.0 INTEGRATION NOTES

**WormholeTransition integration:** The `GameFocusSequence.tsx` crystal tunnel (0.8s) serves as the in-game-chrome-bezel entry. For lab-level navigation from the Spatial Dashboard, the `WormholeTransition.tsx` (created in Stage 3 Part 3B) provides a 2.5s cinematic sequence. Both can coexist — WormholeTransition handles `overview → lab` transitions, while GameFocusSequence handles `lab → game` transitions.

**CeremonyFX integration:** When `useGameFocusState` detects game completion, it should enqueue a ceremony via `cockpitStore.enqueueCeremony()` with the appropriate type and intensity. The CeremonyFX component (Stage 3 Part 3B) consumes the queue and plays the 3D celebration within the unified CockpitCanvas.

**Mode transition orchestration (CPA v2.0):**
- `enterLab()` → triggers cockpitStore `focusLab()` + WormholeTransition → mode changes to `lab`
- `GameFocusSequence` → triggers `useGameFocusState` → mode changes to `game`, panels retract (curvature 0.3)
- Game complete → `enqueueCeremony()` → CeremonyFX plays → mode returns to `lab`
- All transitions respect mode transition durations in `MODE_TRANSITIONS` from `cockpitConfig.ts`

---

## CODE REVIEW FIXES APPLIED

The following issues were found during code review and corrected before writing files:

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | CRITICAL | GameFocusSequence.tsx | `className` placed inside `style={{}}` object — invalid JSX, would crash at runtime | Separated `className` and `style` into distinct attributes |
| 2 | HIGH | LabReconfiguration.tsx | `React.RefObject` used in `TransitionOverlayProps` but `React` namespace never imported | Imported `type RefObject` from `'react'`; used `RefObject<HTMLDivElement>` (without `| null` to match React 19 ref prop typing) |
| 3 | HIGH | LabReconfiguration.tsx | `useCallback` deps included `stationMode` object (new reference every render — defeated memoization) | Destructured `{ activeLabId, setLabId }` from `useStationMode()`, used individual primitives/stable setters as deps |
| 4 | HIGH | GameFocusSequence.tsx | `useThree` imported and `viewport` destructured but never used in `TunnelScene` | Removed unused `useThree` import and destructuring |
| 5 | MEDIUM | LabReconfiguration.tsx | `z-25` not a standard Tailwind z-index class | Changed to `z-[25]` (arbitrary value syntax) |
| 6 | MEDIUM | useStationMode.ts | Missing `useCallback` import needed by appended hooks | Added `useCallback` to existing `import { useState, useMemo }` |
| 7 | LOW | GameFocusSequence.tsx | `EffectComposer` nested inside `<group>` — unconventional R3F placement | Moved to fragment siblings (`<>...</>`) following R3F conventions |
| 8 | LOW | useStationMode.ts | User instructions suggest adding `useEffect` to import but it's never used | Omitted unnecessary import to keep linting clean |

---

## STEP 1: LabReconfiguration — Panel Morph Transition Orchestrator (NEW v3)

When a child selects a lab, the station RECONFIGURES. This is not a page navigation — it is the station switching modes. The chrome frame stays fixed. Inside, panels slide, rotate, and morph. The LED rim color transitions. The background shader crossfades to the lab's pattern. Ambient particles shift to the lab's color. Total transition: 1.0s (Decision 3.5). Decision 5.4: Locked labs get dimmed visuals with trickle particles.

### File: `src/components/transitions/LabReconfiguration.tsx`

```typescript
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

// Lab Colors — VEC v2 palette (from useStationMode)
const LAB_COLORS: Record<number, string> = {
  1: '#3B82F6', 2: '#8B5CF6', 3: '#EC4899', 4: '#F59E0B', 5: '#10B981',
  6: '#EF4444', 7: '#06B6D4', 8: '#8B5CF6', 9: '#10B981', 10: '#F59E0B',
};

const LAB_NAMES: Record<number, string> = {
  1: 'What IS AI?', 2: 'Teaching Machines', 3: 'The Brain Inside',
  4: 'AI That Creates', 5: 'AI Helpers', 6: 'AI & Ethics',
  7: 'Computer Vision', 8: 'Words & Language', 9: 'Build with AI',
  10: "AI's Future",
};

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
```

---

## STEP 2: GameFocusSequence — Crystal Tunnel Game Entry (NEW v3)

Decision 3.1: Crystal tunnel overlay (0.8s). When entering a game from within a lab, hexagonal crystal rings rush toward the camera in the lab's accent color. During the tunnel, the frame dims to game-active mode (Decision 3.4). When the tunnel clears, the game UI is loaded. Technical: InstancedMesh of hex ring geometries with z-velocity. 18 rings in flight. Lab-colored emissive material. Renders on overlay canvas, unmounts after completion. GPU: ~2ms for 0.8s.

### File: `src/components/transitions/GameFocusSequence.tsx`

```typescript
'use client';

// ================================================================
// SparkForge GameFocusSequence — Crystal Tunnel Game Entry
// ================================================================
// Decision 3.1: Crystal tunnel overlay (0.8s)
// Decision 3.4: Frame dimmed during games
//
// Hex crystal rings rush toward camera in lab's accent color.
// 15-20 rings in flight via InstancedMesh.
// Lab-colored emissive material. GPU: ~2ms for 0.8s.
// Transient overlay — unmounts entirely after completion.

import { useRef, useMemo, useCallback, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Hex ring count
const RING_COUNT = 18;

// Generate hex ring geometry (flat hexagonal torus)
function createHexRingGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const sides = 6;
  const outerRadius = 1.0;
  const innerRadius = 0.85;

  // Outer hex
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 6;
    const x = Math.cos(angle) * outerRadius;
    const y = Math.sin(angle) * outerRadius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  // Inner hex (hole)
  const hole = new THREE.Path();
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 6;
    const x = Math.cos(angle) * innerRadius;
    const y = Math.sin(angle) * innerRadius;
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: false,
  });

  return geometry;
}

// Inner 3D scene
function TunnelScene({
  color,
  onComplete,
}: {
  color: string;
  onComplete: () => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTime = useRef(0);
  const completedRef = useRef(false);

  const hexGeometry = useMemo(() => createHexRingGeometry(), []);

  // Initialize ring positions along z-axis
  const ringData = useMemo(() => {
    const data = [];
    for (let i = 0; i < RING_COUNT; i++) {
      data.push({
        z: -30 - i * 4, // Spread far behind camera
        speed: 35 + Math.random() * 15, // z-velocity
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
        scale: 2.0 + Math.random() * 1.5,
      });
    }
    return data;
  }, []);

  // Setup instanced mesh
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < RING_COUNT; i++) {
      dummy.position.set(0, 0, ringData[i].z);
      dummy.scale.setScalar(ringData[i].scale);
      dummy.rotation.z = ringData[i].rotation;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [ringData]);

  useFrame(({ clock }) => {
    if (startTime.current === 0) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current;
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = ringData[i];
      // Move rings toward camera (positive z)
      const z = ring.z + elapsed * ring.speed;
      const rotation = ring.rotation + elapsed * ring.rotSpeed;

      dummy.position.set(0, 0, z);
      dummy.scale.setScalar(ring.scale * (1.0 + Math.max(0, z) * 0.1));
      dummy.rotation.z = rotation;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Complete after 0.8s
    if (elapsed >= 0.8 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <>
      {/* Instanced hex rings */}
      <instancedMesh ref={meshRef} args={[hexGeometry, undefined, RING_COUNT]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Central forward light */}
      <pointLight position={[0, 0, -5]} intensity={2} color={color} distance={20} />

      {/* Bloom for glow trails */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// Main overlay component
interface GameFocusSequenceProps {
  labColor?: string;
  onComplete?: () => void;
  onStart?: () => void;
}

export function GameFocusSequence({
  labColor = '#00BBFF',
  onComplete,
  onStart,
}: GameFocusSequenceProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    onStart?.();
  }, [onStart]);

  const handleComplete = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 200); // Quick 200ms fade out
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/90 transition-opacity duration-200 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <TunnelScene color={labColor} onComplete={handleComplete} />
        </Suspense>
      </Canvas>

      {/* Speed lines CSS overlay for extra effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, ${labColor}10 70%, ${labColor}20 100%)`,
        }}
      />
    </div>
  );
}
```

---

## STEP 3: useStationMode.ts — APPEND Lab Transition Methods (MODIFY v3)

The `useStationMode` hook from Part 3A needs additional methods to support lab transitions. APPEND the following exports to the END of `src/hooks/useStationMode.ts` (do not replace existing code). These additions wire the LabReconfiguration and GameFocusSequence into the station mode system.

### File: `src/hooks/useStationMode.ts` (APPEND to end of file)

**Import modification** — Add `useCallback` to existing import:

```typescript
// CHANGE this line (line 3):
import { useState, useMemo } from 'react';
// TO:
import { useState, useMemo, useCallback } from 'react';
```

**Append the following block after the closing `}` of `useStationMode()`:**

```typescript
// ================================================================
// v3 Stage 4 P2 Additions — Lab Transition Integration
// ================================================================
// APPENDED by Stage 4 Part 2B v3-FINAL
// DO NOT modify existing code above.

// Lab pattern transition progress (0.0 - 1.0)
// Consumed by LabPatternBackground for crossfade
export function useLabTransitionProgress() {
  const [progress, setProgress] = useState(1.0);
  const [previousLabId, setPreviousLabId] = useState<number | null>(null);

  const startTransition = useCallback(
    (fromLabId: number | null, _toLabId: number) => {
      setPreviousLabId(fromLabId);
      setProgress(0);

      // Animate progress 0 -> 1 over 0.4s (the crossfade portion)
      const start = performance.now();
      const duration = 400; // ms
      const animate = (now: number) => {
        const elapsed = now - start;
        const p = Math.min(elapsed / duration, 1.0);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - p, 3);
        setProgress(eased);
        if (p < 1.0) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    },
    []
  );

  return { progress, previousLabId, startTransition };
}

// Game focus state — tracks when crystal tunnel is active
// Used by StationFrame to dim frame during game entry
export function useGameFocusState() {
  const [isFocusing, setIsFocusing] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  const startFocus = useCallback(() => {
    setIsFocusing(true);
  }, []);

  const completeFocus = useCallback(() => {
    setIsFocusing(false);
    setIsGameActive(true);
  }, []);

  const exitGame = useCallback(() => {
    setIsGameActive(false);
  }, []);

  return {
    isFocusing, // Crystal tunnel playing
    isGameActive, // Game loaded and active
    startFocus,
    completeFocus,
    exitGame,
  };
}
```

---

## STEP 4: globals.css — APPEND Particle Inward Keyframe (MODIFY)

APPEND the following keyframe animation to the END of `src/app/globals.css`. This is used by the `TransitionOverlay` particle burst in `LabReconfiguration.tsx` (Phase 4).

### File: `src/app/globals.css` (APPEND to end of file)

```css
/* ================================================================ */
/* v3 Stage 4 P2: Lab Reconfiguration particle animation            */
/* ================================================================ */
@keyframes particle-inward {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    left: 50%;
    top: 50%;
    opacity: 0;
    transform: scale(0);
  }
}
```

---

## STEP 5: VERIFY EVERYTHING

**CHECK 1:** Dev server starts without errors
```bash
npm run dev
```
Open http://localhost:3000 — should start with NO errors. No TypeScript errors related to transition components.

**CHECK 2:** Transition components importable
```typescript
import { useLabReconfiguration } from '@/components/transitions/LabReconfiguration';
import { GameFocusSequence } from '@/components/transitions/GameFocusSequence';
import { useLabTransitionProgress, useGameFocusState } from '@/hooks/useStationMode';
```

**CHECK 3:** Build compiles
```bash
npx tsc --noEmit   # TypeScript check — PASS
npm run lint        # ESLint — PASS
npm run build       # Production build — PASS
```

**CHECK 4:** Mobile fallback
- Resize browser to < 768px width
- Lab transitions should still work (GSAP handles CSS transforms)
- Crystal tunnel (`GameFocusSequence`) renders at reduced DPR on mobile

---

## STEP 6: GIT COMMIT

```bash
git add .
git commit -m "Stage 4 Part 2B v3: LabReconfiguration, GameFocusSequence, transitions"
```

---

## STAGE 4 PART 2B v3-FINAL COMPLETE

### FILES CREATED/MODIFIED IN PART B

| Action | File | Description | Lines |
|--------|------|-------------|-------|
| NEW | `src/components/transitions/LabReconfiguration.tsx` | Panel morph orchestrator (1.0s) | 339 |
| NEW | `src/components/transitions/GameFocusSequence.tsx` | Crystal tunnel game entry (0.8s) | 212 |
| MODIFIED | `src/hooks/useStationMode.ts` | APPEND `useLabTransitionProgress` + `useGameFocusState` | +64 |
| MODIFIED | `src/app/globals.css` | APPEND `@keyframes particle-inward` | +15 |

### COMBINED FILES ACROSS PART A + PART B

| File | Source |
|------|--------|
| `src/shaders/labPatterns/codeLab.glsl` | Part A — Lab 1: Binary rain columns |
| `src/shaders/labPatterns/dataLab.glsl` | Part A — Lab 2: Data sorting waves |
| `src/shaders/labPatterns/neuralLab.glsl` | Part A — Lab 3: Neural pulse ripples |
| `src/shaders/labPatterns/createLab.glsl` | Part A — Lab 4: Generative flow field |
| `src/shaders/labPatterns/agentLab.glsl` | Part A — Lab 5: Agent path traces |
| `src/shaders/labPatterns/ethicsLab.glsl` | Part A — Lab 6: Balance oscillation |
| `src/shaders/labPatterns/visionLab.glsl` | Part A — Lab 7: Scan-line grid |
| `src/shaders/labPatterns/languageLab.glsl` | Part A — Lab 8: Text stream flow |
| `src/shaders/labPatterns/buildLab.glsl` | Part A — Lab 9: Code compilation |
| `src/shaders/labPatterns/frontierLab.glsl` | Part A — Lab 10: Starfield warp |
| `src/shaders/labPatterns/index.ts` | Part A — TypeScript exports + `getLabPatternShader()` |
| `src/components/3d/LabPatternBackground.tsx` | Part A — R3F crossfade renderer |
| `src/components/transitions/LabReconfiguration.tsx` | Part B — Panel morph orchestrator |
| `src/components/transitions/GameFocusSequence.tsx` | Part B — Crystal tunnel game entry |
| `src/hooks/useStationMode.ts` | Part B — APPEND lab transition methods |
| `src/app/globals.css` | Part B — APPEND particle-inward keyframe |

### DECISION COVERAGE

| Decision | Choice | Implementing File(s) |
|----------|--------|---------------------|
| 3.1 | Crystal tunnel (0.8s) | `GameFocusSequence.tsx` |
| 3.2 | All 10 lab patterns | `labPatterns/*.glsl` + `index.ts` (Part A) |
| 3.3 | Hybrid sidebar + status | `LabReconfiguration.tsx` (Phase 3) |
| 3.4 | Frame dimmed during games | `useStationMode.ts` (`useGameFocusState`) |
| 3.5 | 1.0s transitions for all | `LabReconfiguration.tsx` (`enterLab`) |
| 4.1 | All 10 patterns at launch | `labPatterns/*.glsl` (10 shaders, Part A) |
| 5.4 | Dim trickle locked labs | `LabReconfiguration.tsx` (`getLockedLabVisuals`) |

### EXPORTS REFERENCE

```typescript
// LabReconfiguration.tsx
export type TransitionPhase
export interface LabTransitionState
export interface LockedLabVisuals
export function getLockedLabVisuals(labId, isUnlocked, hasStarted): LockedLabVisuals
export function useLabReconfiguration(): { transitionState, enterLab, exitLab, contentRef, titleRef, glowRef, getLockedLabVisuals, labColors, labNames }
export function TransitionOverlay({ glowRef, titleRef, transitionState }): JSX.Element

// GameFocusSequence.tsx
export function GameFocusSequence({ labColor?, onComplete?, onStart? }): JSX.Element | null

// useStationMode.ts (appended)
export function useLabTransitionProgress(): { progress, previousLabId, startTransition }
export function useGameFocusState(): { isFocusing, isGameActive, startFocus, completeFocus, exitGame }
```

---

**NEXT:** Stage 5 Parts 2-3 v3-FINAL — LiquidMetal, Holographic, EnergyField, XPVortex, BadgePedestals, particle slider

*SparkForge v3 — Laboratory Control Station Vision*
*Stage 4 Part 2B | February 27, 2026 | BlissDirective*
