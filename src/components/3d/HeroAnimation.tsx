'use client';

// ================================================================
// HeroAnimation — Hero v3 (8-beat 19.5 s sequence)
// ================================================================
//
// REWRITTEN for Hero v3 (Phase 5c.6).
//
// Architecture (preserved from v2):
//   - Outer <HeroAnimation> manages skip/fast-forward UI overlay,
//     GPU detection, keyboard shortcuts, and lifecycle wiring.
//   - <HeroScene> renders as a <group> inside CockpitCanvas (CPA v2
//     single-canvas) — no Canvas swap; cockpit takes over when
//     setHeroPhase('complete') fires.
//
// What changed vs v2:
//   - Scene content fully replaced with the 8 v3 beat components
//     (Beat1VoidAwakening → Beat8AtomicHandoff). Each beat owns its
//     own subjects, materials, and per-frame animation.
//   - GSAP timeline simplified — drives a single `currentTime` clock
//     (0 → 19.5 s) and emits onComplete at the end. Per-beat curves
//     live inside each beat component (driven from progress prop).
//   - Camera path interpolated from a 9-waypoint table (storyboard
//     §3-§10), driven per-frame from `tl.time()`.
//   - Audio remap fully wired in heroAudio.ts:syncToProgress (5c.4)
//     — same HeroAudioTimeline singleton used.
//   - Atomic handoff: Beat 8's onHandoffComplete callback fires the
//     cockpitStore lifecycle transitions (setHeroPhase('complete') +
//     setCockpitReady(true)) which match v2's behavior at GSAP
//     onComplete. Both still wired for redundancy.
//
// Storyboard authority: docs/hero-v3/Storyboard.md v1.2 (19.5 s).
// Sign-off Q1-Q10 + runtime override RECORDED 2026-04-29.

import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type PerspectiveCamera } from 'three';
import gsap from 'gsap';

import {
  useHeroAnimation,
  type HeroAnimationState,
  type HeroAnimationActions,
} from '@/hooks/useHeroAnimation';
import { useDeviceStore } from '@/stores/deviceStore';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { detectGPUTier } from '@/lib/webgpuDetection';
import { HeroAudioTimeline } from '@/lib/audio/heroAudio';

// V3 beat components
import { Beat1VoidAwakening } from '@/components/3d/hero/v3/Beat1VoidAwakening';
import { Beat2IgnitionSpark } from '@/components/3d/hero/v3/Beat2IgnitionSpark';
import { Beat3SCrystallization } from '@/components/3d/hero/v3/Beat3SCrystallization';
import { Beat4FMirrorAndShardBurst } from '@/components/3d/hero/v3/Beat4FMirrorAndShardBurst';
import { Beat5WordmarkCascade } from '@/components/3d/hero/v3/Beat5WordmarkCascade';
import { Beat6DichroicBloom } from '@/components/3d/hero/v3/Beat6DichroicBloom';
import { Beat7CockpitMaterialization } from '@/components/3d/hero/v3/Beat7CockpitMaterialization';
import { Beat8AtomicHandoff } from '@/components/3d/hero/v3/Beat8AtomicHandoff';

// ── Props ────────────────────────────────────────────────────────

interface HeroAnimationProps {
  /** Cockpit handoff — dashboard renders on top */
  onComplete: () => void;
  /** Optional phase tracking callback (0..7) */
  onPhaseChange?: (phase: number) => void;
}

// ── Beat boundaries (storyboard v1.2 19.5 s) ─────────────────────

const BEAT_BOUNDS = [
  { id: 0, start: 0.0,  end: 2.5  }, // Beat 1: Void Awakening
  { id: 1, start: 2.5,  end: 5.0  }, // Beat 2: Ignition Spark
  { id: 2, start: 5.0,  end: 8.0  }, // Beat 3: S Crystallization
  { id: 3, start: 8.0,  end: 11.0 }, // Beat 4: F Mirror + Shard Burst
  { id: 4, start: 11.0, end: 14.0 }, // Beat 5: Wordmark Cascade
  { id: 5, start: 14.0, end: 16.5 }, // Beat 6: Dichroic Bloom
  { id: 6, start: 16.5, end: 18.5 }, // Beat 7: Cockpit Materialization
  { id: 7, start: 18.5, end: 19.5 }, // Beat 8: Atomic Handoff
] as const;

const TOTAL_DURATION = 19.5;

function timeToPhase(time: number): number {
  for (let i = 0; i < BEAT_BOUNDS.length; i++) {
    if (time < BEAT_BOUNDS[i].end) return i;
  }
  return BEAT_BOUNDS.length - 1;
}

// ── Camera waypoints (storyboard §3-§10) ─────────────────────────

interface CameraWaypoint {
  time: number;
  pos: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

const CAMERA_WAYPOINTS: CameraWaypoint[] = [
  { time: 0.0,  pos: [0, 0, 16],       lookAt: [0, 0, 0],     fov: 35 },
  { time: 2.5,  pos: [0, 0, 12],       lookAt: [0, 0, 0],     fov: 35 },
  { time: 5.0,  pos: [-1.4, 0.6, 9.2], lookAt: [-0.2, 0.1, 0], fov: 38 },
  { time: 8.0,  pos: [-0.4, 0.2, 7.5], lookAt: [-0.4, 0.2, 0], fov: 40 },
  { time: 11.0, pos: [0.4, 0.2, 7.5],  lookAt: [0.4, 0.2, 0],  fov: 40 },
  { time: 14.0, pos: [0, 0.4, 9.5],    lookAt: [0, 0, 0],      fov: 42 },
  { time: 16.5, pos: [0, 0.6, 10.5],   lookAt: [0, 0, 0],      fov: 44 },
  { time: 18.5, pos: [0, 6.0, 7.5],    lookAt: [0, 3.0, 0],    fov: 58 },
  { time: 19.5, pos: [0, 6.0, 7.5],    lookAt: [0, 3.0, 0],    fov: 58 },
];

function lerpVec3(a: readonly number[], b: readonly number[], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function sampleCamera(time: number) {
  if (time <= CAMERA_WAYPOINTS[0].time) {
    return {
      pos: [...CAMERA_WAYPOINTS[0].pos] as [number, number, number],
      lookAt: [...CAMERA_WAYPOINTS[0].lookAt] as [number, number, number],
      fov: CAMERA_WAYPOINTS[0].fov,
    };
  }
  for (let i = 0; i < CAMERA_WAYPOINTS.length - 1; i++) {
    const a = CAMERA_WAYPOINTS[i];
    const b = CAMERA_WAYPOINTS[i + 1];
    if (time >= a.time && time <= b.time) {
      const t = (time - a.time) / (b.time - a.time);
      const u = t * t * (3 - 2 * t); // smoothstep
      return {
        pos: lerpVec3(a.pos, b.pos, u),
        lookAt: lerpVec3(a.lookAt, b.lookAt, u),
        fov: a.fov + (b.fov - a.fov) * u,
      };
    }
  }
  const last = CAMERA_WAYPOINTS[CAMERA_WAYPOINTS.length - 1];
  return {
    pos: [...last.pos] as [number, number, number],
    lookAt: [...last.lookAt] as [number, number, number],
    fov: last.fov,
  };
}

// ════════════════════════════════════════════════════════════════
// HeroScene — renders v3 beats inside CockpitCanvas
// ════════════════════════════════════════════════════════════════

interface HeroSceneProps {
  state: HeroAnimationState;
  actions: HeroAnimationActions;
}

export function HeroScene({ state, actions }: HeroSceneProps) {
  const { camera } = useThree();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const audioRef = useRef<HeroAudioTimeline | null>(null);
  const setHeroPhase = useCockpitStore((s) => s.setHeroPhase);
  const setCockpitReady = useCockpitStore((s) => s.setCockpitReady);
  const lookAtVec = useRef(new Vector3());

  // Per-beat state (throttled re-render to ~30 Hz to avoid storm)
  const [beatStates, setBeatStates] = useState(() =>
    BEAT_BOUNDS.map((b) => ({ id: b.id, progress: 0, active: b.id === 0 })),
  );
  const lastBeatUpdateRef = useRef(-1);

  // ── Initialize GSAP timeline (single empty 19.5 s clock) ──
  useEffect(() => {
    if (state.shouldSkip) {
      actions.skipToEnd();
      return;
    }

    setHeroPhase('animating');

    // Single empty timeline — its only job is to advance time and fire
    // onComplete at the end. All per-beat animation is driven from
    // tl.time() inside the per-frame useFrame below + the beat
    // components themselves.
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        setHeroPhase('complete');
        setCockpitReady(true);
        actions.setComplete();
      },
    });
    tl.to({}, { duration: TOTAL_DURATION });

    timelineRef.current = tl;
    tl.play();

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shouldSkip]);

  // ── Sync GSAP timeScale (OD-2 fast-forward) ──
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.timeScale(state.timeScale);
    }
    if (audioRef.current) {
      audioRef.current.setTimeScale(state.timeScale);
    }
  }, [state.timeScale]);

  // ── Audio (OD-1) — full v3 remap lives in heroAudio.ts ──
  const soundEnabled = useUIStore((s) => s.soundEnabled);

  useEffect(() => {
    if (state.shouldSkip) return;
    const audio = new HeroAudioTimeline(soundEnabled);
    audioRef.current = audio;
    void audio.initialize().catch(() => { /* graceful — no audio */ });
    return () => {
      audio.dispose();
      audioRef.current = null;
    };
  }, [soundEnabled, state.shouldSkip]);

  // ── Per-frame: camera + audio sync + beat state update ──
  useFrame(() => {
    if (state.isComplete || state.shouldSkip) return;
    const tl = timelineRef.current;
    if (!tl) return;

    const currentTime = tl.time();
    const progress = currentTime / TOTAL_DURATION;
    const phase = timeToPhase(currentTime);

    actions.setProgress(Math.min(progress, 1.0));
    actions.setPhase(phase);

    if (audioRef.current) {
      audioRef.current.syncToProgress(progress);
    }

    // Camera path interpolation (smoothstep between 9 waypoints)
    const wp = sampleCamera(currentTime);
    camera.position.set(wp.pos[0], wp.pos[1], wp.pos[2]);
    if ('fov' in camera) {
      const persp = camera as PerspectiveCamera;
      if (Math.abs(persp.fov - wp.fov) > 0.01) {
        persp.fov = wp.fov;
        persp.updateProjectionMatrix();
      }
    }
    lookAtVec.current.set(wp.lookAt[0], wp.lookAt[1], wp.lookAt[2]);
    camera.lookAt(lookAtVec.current);

    // Throttled beat-state update (~30 Hz)
    if (Math.abs(currentTime - lastBeatUpdateRef.current) >= 0.033) {
      lastBeatUpdateRef.current = currentTime;
      setBeatStates(
        BEAT_BOUNDS.map((b) => {
          const active = currentTime >= b.start && currentTime < b.end;
          const beatProgress = active
            ? Math.max(0, Math.min(1, (currentTime - b.start) / (b.end - b.start)))
            : currentTime >= b.end ? 1 : 0;
          return { id: b.id, progress: beatProgress, active };
        }),
      );
    }
  });

  // Beat 7 cockpit-signal callback — fires setHeroPhase('materializing')
  // exactly once when Beat 7 opens.
  const onMaterializeStart = useMemo(
    () => () => setHeroPhase('materializing'),
    [setHeroPhase],
  );

  // Beat 8 atomic-handoff callback — fires the cockpit-complete
  // transitions (mirrors GSAP onComplete; both wired for redundancy
  // since GSAP onComplete may fire ~1 frame later than Beat 8's
  // progress >= 0.99 trigger).
  const onHandoffComplete = useMemo(
    () => () => {
      setHeroPhase('complete');
      setCockpitReady(true);
    },
    [setHeroPhase, setCockpitReady],
  );

  if (state.shouldSkip || state.isComplete) return null;

  return (
    <Suspense fallback={null}>
      <Beat1VoidAwakening progress={beatStates[0].progress} active={beatStates[0].active} />
      <Beat2IgnitionSpark progress={beatStates[1].progress} active={beatStates[1].active} />
      <Beat3SCrystallization progress={beatStates[2].progress} active={beatStates[2].active} />
      <Beat4FMirrorAndShardBurst progress={beatStates[3].progress} active={beatStates[3].active} />
      <Beat5WordmarkCascade progress={beatStates[4].progress} active={beatStates[4].active} />
      <Beat6DichroicBloom progress={beatStates[5].progress} active={beatStates[5].active} />
      <Beat7CockpitMaterialization
        progress={beatStates[6].progress}
        active={beatStates[6].active}
        signalCockpit
        onMaterializeStart={onMaterializeStart}
      />
      <Beat8AtomicHandoff
        progress={beatStates[7].progress}
        active={beatStates[7].active}
        onHandoffComplete={onHandoffComplete}
      />
    </Suspense>
  );
}

// ════════════════════════════════════════════════════════════════
// HeroAnimation — outer wrapper (UI overlay only — preserved from v2)
// ════════════════════════════════════════════════════════════════

export default function HeroAnimation({ onComplete, onPhaseChange }: HeroAnimationProps) {
  const [state, actions] = useHeroAnimation(onComplete, onPhaseChange);
  const [skipVisible, setSkipVisible] = useState(false);
  const setHeroPhase = useCockpitStore((s) => s.setHeroPhase);
  const setCockpitReady = useCockpitStore((s) => s.setCockpitReady);

  // GPU detection (shared with cockpit auto-quality)
  useEffect(() => {
    const detect = async () => {
      const result = await detectGPUTier();
      // P2 §3.6: action setter, not snapshot read.
      // eslint-disable-next-line no-restricted-syntax
      useDeviceStore.getState().setGpuTier(result.tier, result.stripeCount);
    };
    detect();
  }, []);

  // Skip button shows after 2s
  useEffect(() => {
    if (state.shouldSkip || state.isComplete) return;
    const timer = setTimeout(() => setSkipVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [state.shouldSkip, state.isComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    if (state.shouldSkip || state.isComplete) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        actions.skipToEnd();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!state.isFastForwarding) {
          actions.fastForward();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.shouldSkip, state.isComplete, state.isFastForwarding, actions]);

  // Cockpit state on skip
  useEffect(() => {
    if (state.shouldSkip) {
      setHeroPhase('complete');
      setCockpitReady(true);
    }
  }, [state.shouldSkip, setHeroPhase, setCockpitReady]);

  if (state.shouldSkip) return null;
  if (state.isComplete) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ background: '#0A0E16' }}
      aria-label="SparkForge hero animation"
    >
      <div role="status" aria-live="polite" className="sr-only">
        SparkForge is loading your command station...
      </div>

      {skipVisible && (
        <button
          onClick={() => actions.fastForward()}
          className="pointer-events-auto fixed bottom-6 right-6 px-4 py-2 rounded-full
            backdrop-blur-md bg-white/5 border border-white/10
            font-body text-sm text-white/70 hover:text-white/80
            transition-opacity duration-300 focus:outline-none
            focus:ring-2 focus:ring-[#00BBFF]/50"
          aria-label="Skip intro animation"
        >
          Skip &gt;
        </button>
      )}

      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full bg-[#00BBFF]/30 transition-all duration-300"
          style={{ width: `${state.progress * 100}%` }}
        />
      </div>
    </div>
  );
}
