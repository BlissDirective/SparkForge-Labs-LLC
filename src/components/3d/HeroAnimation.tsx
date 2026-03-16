'use client';

// ================================================================
// HeroAnimation — 8-Phase Cinematic Hero Sequence
// ================================================================
// Replaces standalone CrystalShatter.tsx usage on landing page.
// Orchestrates: GSAP timeline, particle system, camera, audio, handoff.
//
// Architecture:
//   - Renders inside R3F Canvas — same canvas persists post-animation
//   - GSAP master timeline with 8 labeled sections for scrub/skip
//   - WebGPU TSL particle system (1B+ lifetime via multi-stripe)
//   - Tone.js spatial audio synchronized to timeline progress
//   - Seamless handoff: animation's final frame IS the app's first frame
//
// Lifecycle:
//   1. Mount → detect GPU tier, allocate buffers, compile shaders
//   2. Phase 1-7 → GSAP timeline drives animation
//   3. Phase 8 → onComplete callback, dispose hero resources
//   4. Cockpit components continue their normal reactive behavior
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Sections 3-9

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';

import {
  useHeroAnimation,
  type HeroAnimationState,
  type HeroAnimationActions,
} from '@/hooks/useHeroAnimation';
import { useDeviceStore } from '@/stores/deviceStore';
import { useUIStore } from '@/stores/uiStore';
import { detectGPUTier } from '@/lib/webgpuDetection';
import { generateVoronoiShards, assignShardsToTargets, SHARD_COUNTS } from '@/lib/3d/voronoiFracture';
import { generateSplineTimings } from '@/lib/3d/heroSplines';
import { HeroAudioTimeline } from '@/lib/audio/heroAudio';

// ── Props ────────────────────────────────────────────────────────

interface HeroAnimationProps {
  /** Cockpit handoff — dashboard renders on top */
  onComplete: () => void;
  /** Optional phase tracking callback */
  onPhaseChange?: (phase: number) => void;
}

// ── GSAP Timeline Labels ─────────────────────────────────────────

const PHASE_LABELS = {
  void: 0,        // Phase 1: 0.0 – 2.0s
  assembly: 2,    // Phase 2: 2.0 – 4.5s
  showcase: 4.5,  // Phase 3: 4.5 – 7.5s
  surge: 7.5,     // Phase 4: 7.5 – 10.0s
  shatter: 10,    // Phase 5: 10.0 – 11.5s
  regroup: 11.5,  // Phase 6: 11.5 – 14.0s
  materialize: 14, // Phase 7: 14.0 – 17.0s
  online: 17,     // Phase 8: 17.0 – 19.0s
} as const;

const TOTAL_DURATION = 19.0;

// ── Phase index ← current time lookup ────────────────────────────

function timeToPhase(time: number): number {
  if (time < 2.0) return 0;
  if (time < 4.5) return 1;
  if (time < 7.5) return 2;
  if (time < 10.0) return 3;
  if (time < 11.5) return 4;
  if (time < 14.0) return 5;
  if (time < 17.0) return 6;
  return 7;
}

// ════════════════════════════════════════════════════════════════
// Inner Scene — runs inside R3F Canvas
// ════════════════════════════════════════════════════════════════

interface HeroSceneProps {
  state: HeroAnimationState;
  actions: HeroAnimationActions;
}

function HeroScene({ state, actions }: HeroSceneProps) {
  const { camera } = useThree();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const audioRef = useRef<HeroAudioTimeline | null>(null);

  // ── Shard data (pre-computed at mount) ──
  const shardGeo = useRef<THREE.BufferGeometry[]>([]);
  const shardMeshRefs = useRef<THREE.Mesh[]>([]);
  const splineTimings = useRef<ReturnType<typeof generateSplineTimings>>([]);

  // ── Logo mesh ──
  const logoGroupRef = useRef<THREE.Group>(null);
  const logoMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

  // ── Emissive intensity for Phase 3→4 ramp ──
  const emissiveIntensity = useRef(0);

  // ── Camera shake state ──
  const shakeIntensity = useRef(0);

  // ── GPU tier for shard count selection ──
  const gpuTier = state.gpuTier;
  const shardCount = useMemo(() => {
    // Map GPUTier to SHARD_COUNTS keys (which have more granular WebGL2 tiers)
    const tierMap: Record<string, keyof typeof SHARD_COUNTS> = {
      'webgpu-high': 'webgpu-high',
      'webgpu-mid': 'webgpu-mid',
      'webgpu-low': 'webgl2-desktop',
      'webgl2': 'webgl2-desktop',
      'css': 'css',
    };
    const key = tierMap[gpuTier] ?? 'webgl2-desktop';
    return SHARD_COUNTS[key];
  }, [gpuTier]);

  // ── Initialize GSAP timeline ──
  useEffect(() => {
    if (state.shouldSkip) {
      actions.skipToEnd();
      return;
    }

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        actions.setComplete();
      },
    });

    // Add phase labels
    tl.addLabel('void', PHASE_LABELS.void);
    tl.addLabel('assembly', PHASE_LABELS.assembly);
    tl.addLabel('showcase', PHASE_LABELS.showcase);
    tl.addLabel('surge', PHASE_LABELS.surge);
    tl.addLabel('shatter', PHASE_LABELS.shatter);
    tl.addLabel('regroup', PHASE_LABELS.regroup);
    tl.addLabel('materialize', PHASE_LABELS.materialize);
    tl.addLabel('online', PHASE_LABELS.online);

    // ── Phase 1: Void Awakening (0.0 – 2.0s) ──
    // Camera drift from [0,0,1.5] → [0,0,2.5]
    const camProxy = { x: 0, y: 0, z: 1.5, fov: 35 };
    tl.to(camProxy, {
      z: 2.5,
      duration: 2.0,
      ease: 'power1.inOut',
      onUpdate: () => {
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        if ('fov' in camera) {
          (camera as THREE.PerspectiveCamera).fov = camProxy.fov;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 0);

    // ── Phase 2: Assembly (2.0 – 4.5s) ──
    // Camera pulls back to z=5, FOV opens to 50
    tl.to(camProxy, {
      z: 5.0,
      fov: 50,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: () => {
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        if ('fov' in camera) {
          (camera as THREE.PerspectiveCamera).fov = camProxy.fov;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 2.0);

    // Logo scale-in with overshoot
    if (logoGroupRef.current) {
      logoGroupRef.current.scale.set(0, 0, 0);
      tl.to(logoGroupRef.current.scale, {
        x: 1.0, y: 1.0, z: 1.0,
        duration: 2.0,
        ease: 'back.out(1.7)',
      }, 2.0);
    }

    // ── Phase 3: Showcase (4.5 – 7.5s) ──
    // 360° camera orbit at r=3.0
    const orbitProxy = { angle: 0 };
    tl.to(orbitProxy, {
      angle: Math.PI * 2,
      duration: 3.0,
      ease: 'none',
      onUpdate: () => {
        const r = 3.0;
        camProxy.x = Math.sin(orbitProxy.angle) * r;
        camProxy.z = Math.cos(orbitProxy.angle) * r + 2.0;
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        camera.lookAt(0, 0, 0);
      },
    }, 4.5);

    // Emissive ramp 0.0 → 0.5 over Phase 3
    const emissiveProxy = { intensity: 0 };
    tl.to(emissiveProxy, {
      intensity: 0.5,
      duration: 3.0,
      ease: 'power1.in',
      onUpdate: () => {
        emissiveIntensity.current = emissiveProxy.intensity;
      },
    }, 4.5);

    // ── Phase 4: Energy Surge (7.5 – 10.0s) ──
    // Emissive ramp 0.5 → 3.0, camera shake ramp
    tl.to(emissiveProxy, {
      intensity: 3.0,
      duration: 2.5,
      ease: 'power2.in',
      onUpdate: () => {
        emissiveIntensity.current = emissiveProxy.intensity;
      },
    }, 7.5);

    // Camera shake ramp 0 → 0.03
    const shakeProxy = { intensity: 0 };
    tl.to(shakeProxy, {
      intensity: 0.03,
      duration: 2.5,
      ease: 'power2.in',
      onUpdate: () => {
        shakeIntensity.current = shakeProxy.intensity;
      },
    }, 7.5);

    // ── Phase 5: Shatter (10.0 – 11.5s) ──
    // Shake spike 0.08, exponential decay
    tl.to(shakeProxy, {
      intensity: 0.08,
      duration: 0.1,
      ease: 'power4.out',
    }, 10.0);
    tl.to(shakeProxy, {
      intensity: 0.0,
      duration: 1.4,
      ease: 'expo.out',
      onUpdate: () => {
        shakeIntensity.current = shakeProxy.intensity;
      },
    }, 10.1);

    // Logo scale to 0 (shatters)
    if (logoGroupRef.current) {
      tl.to(logoGroupRef.current.scale, {
        x: 0, y: 0, z: 0,
        duration: 0.3,
        ease: 'power4.in',
      }, 10.0);
    }

    // FOV punch 50 → 55 → 53
    tl.to(camProxy, {
      fov: 55,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        if ('fov' in camera) {
          (camera as THREE.PerspectiveCamera).fov = camProxy.fov;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 10.0);
    tl.to(camProxy, {
      fov: 53,
      duration: 1.2,
      ease: 'power1.out',
      onUpdate: () => {
        if ('fov' in camera) {
          (camera as THREE.PerspectiveCamera).fov = camProxy.fov;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 10.3);

    // ── Phase 6: Regroup (11.5 – 14.0s) ──
    // FOV 53 → 56
    tl.to(camProxy, {
      fov: 56,
      duration: 2.5,
      ease: 'power1.inOut',
      onUpdate: () => {
        if ('fov' in camera) {
          (camera as THREE.PerspectiveCamera).fov = camProxy.fov;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 11.5);

    // Reset camera to front position
    tl.to(camProxy, {
      x: 0, y: 0, z: 5.0,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        camera.lookAt(0, 0, 0);
      },
    }, 11.5);

    // ── Phase 7: Materialize (14.0 – 17.0s) ──
    // Camera moves to cockpit viewing position
    tl.to(camProxy, {
      x: 0, y: 6.5, z: 7,
      fov: 58,
      duration: 3.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        if ('fov' in camera) {
          (camera as THREE.PerspectiveCamera).fov = camProxy.fov;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
        camera.lookAt(0, 3, 0);
      },
    }, 14.0);

    // ── Phase 8: Online (17.0 – 19.0s) ──
    // Camera locked, cockpit comes alive
    tl.to({}, {
      duration: 2.0,
      onComplete: () => {
        actions.setComplete();
      },
    }, 17.0);

    timelineRef.current = tl;
    tl.play();

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shouldSkip]);

  // ── Sync timeScale when fast-forwarding (OD-2) ──
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.timeScale(state.timeScale);
    }
    // Sync audio pitch compensation
    if (audioRef.current) {
      audioRef.current.setTimeScale(state.timeScale);
    }
  }, [state.timeScale]);

  // ── Initialize audio (OD-1) ──
  const soundEnabled = useUIStore((s) => s.soundEnabled);

  useEffect(() => {
    if (state.shouldSkip) return;

    const audio = new HeroAudioTimeline(soundEnabled);
    audioRef.current = audio;

    // Initialize on first user interaction (autoplay policy)
    const initAudio = async () => {
      try {
        await audio.initialize();
      } catch {
        // Audio init failed — animation continues silently
      }
    };

    // Attempt immediate init (may succeed if user already interacted)
    initAudio();

    return () => {
      audio.dispose();
      audioRef.current = null;
    };
  }, [soundEnabled, state.shouldSkip]);

  // ── Per-frame update ──
  useFrame(() => {
    if (state.isComplete || state.shouldSkip) return;

    const tl = timelineRef.current;
    if (!tl) return;

    const currentTime = tl.time();
    const progress = currentTime / TOTAL_DURATION;
    const phase = timeToPhase(currentTime);

    // Update hook state
    actions.setProgress(Math.min(progress, 1.0));
    actions.setPhase(phase);

    // Sync audio to timeline progress
    if (audioRef.current) {
      audioRef.current.syncToProgress(progress);
    }

    // Apply camera shake
    if (shakeIntensity.current > 0.001) {
      const shake = shakeIntensity.current;
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
    }

    // Update logo material emissive
    if (logoMaterialRef.current) {
      logoMaterialRef.current.emissiveIntensity = emissiveIntensity.current;
    }
  });

  // ── Pre-compute Voronoi shards at mount ──
  useEffect(() => {
    if (state.shouldSkip) return;

    const logoGeometry = new THREE.BoxGeometry(6, 1.5, 0.5, 4, 4, 4);
    const clampedShardCount = Math.min(shardCount, 500); // CPU path capped
    const shards = generateVoronoiShards(logoGeometry, clampedShardCount, 42);
    shardGeo.current = shards;

    // Generate shard assignments (placeholder cockpit targets)
    const targets = [
      { name: 'panel' as const, positions: [new THREE.Vector3(-3, 4, 0), new THREE.Vector3(3, 4, 0)], weight: 0.3 },
      { name: 'sidePanel' as const, positions: [new THREE.Vector3(-5, 2, 0), new THREE.Vector3(5, 2, 0)], weight: 0.2 },
      { name: 'hud' as const, positions: [new THREE.Vector3(0, 6, -1)], weight: 0.15 },
      { name: 'statusBar' as const, positions: [new THREE.Vector3(0, -2, 0)], weight: 0.15 },
      { name: 'ledRim' as const, positions: [new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0)], weight: 0.1 },
      { name: 'ambient' as const, positions: [new THREE.Vector3(0, 3, -3)], weight: 0.1 },
    ];
    const assignments = assignShardsToTargets(shards, targets);
    // Pre-compute spline timings
    const timings = generateSplineTimings(assignments.length, 42);
    splineTimings.current = timings;

    logoGeometry.dispose();
  }, [shardCount, state.shouldSkip]);

  // ── Pre-compute ambient particle positions ──
  const particlePositions = useMemo(() => {
    const arr = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  // ── Render ──
  if (state.shouldSkip || state.isComplete) return null;

  return (
    <>
      {/* Ambient light for void phase */}
      <ambientLight intensity={0.05} color="#00BBFF" />

      {/* Point light for crystalline showcase */}
      <pointLight
        position={[0, 2, 4]}
        intensity={2}
        color="#00BBFF"
        distance={15}
        decay={2}
      />

      {/* Logo group — Phases 2-5 */}
      <group ref={logoGroupRef}>
        {/* Placeholder logo mesh (TextGeometry requires font loading) */}
        <mesh>
          <boxGeometry args={[6, 1.5, 0.5]} />
          <meshPhysicalMaterial
            ref={logoMaterialRef}
            color="#1a1a2e"
            emissive="#00BBFF"
            emissiveIntensity={0}
            transmission={0.9}
            thickness={0.5}
            ior={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            roughness={0.05}
            metalness={0.1}
            envMapIntensity={1.2}
            transparent
          />
        </mesh>
      </group>

      {/* Shard meshes — Phases 5-6 */}
      {shardGeo.current.map((geo, i) => (
        <mesh
          key={i}
          geometry={geo}
          ref={(el) => {
            if (el) shardMeshRefs.current[i] = el;
          }}
          visible={false}
        >
          <meshPhysicalMaterial
            color="#1a1a2e"
            emissive="#00BBFF"
            emissiveIntensity={1.0}
            transmission={0.6}
            thickness={0.3}
            roughness={0.1}
            metalness={0.2}
            transparent
          />
        </mesh>
      ))}

      {/* Ambient particles (simple instanced points for background) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#00BBFF"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.001, 0.001)}
          radialModulation={false}
          modulationOffset={0.5}
        />
      </EffectComposer>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// HeroAnimation — Outer Wrapper (Canvas + UI Overlay)
// ════════════════════════════════════════════════════════════════

export default function HeroAnimation({ onComplete, onPhaseChange }: HeroAnimationProps) {
  const [state, actions] = useHeroAnimation(onComplete, onPhaseChange);
  const [skipVisible, setSkipVisible] = useState(false);

  // ── Run GPU detection on mount ──
  useEffect(() => {
    const detect = async () => {
      const result = await detectGPUTier();
      useDeviceStore.getState().setGpuTier(result.tier, result.stripeCount);
    };
    detect();
  }, []);

  // ── Show skip button after 2s ──
  useEffect(() => {
    if (state.shouldSkip || state.isComplete) return;
    const timer = setTimeout(() => setSkipVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [state.shouldSkip, state.isComplete]);

  // ── Keyboard shortcuts ──
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

  // ── Skip: render nothing, fire onComplete immediately ──
  if (state.shouldSkip) {
    return null;
  }

  // ── After complete, unmount the hero overlay ──
  if (state.isComplete) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: '#0A0E16' }}
      aria-label="SparkForge hero animation"
    >
      {/* R3F Canvas */}
      <Canvas
        camera={{ position: [0, 0, 1.5], fov: 35, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <HeroScene state={state} actions={actions} />
      </Canvas>

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        SparkForge is loading your command station...
      </div>

      {/* Skip button (OD-2) — appears after 2s */}
      {skipVisible && (
        <button
          onClick={() => actions.fastForward()}
          className="fixed bottom-6 right-6 px-4 py-2 rounded-full
            backdrop-blur-md bg-white/5 border border-white/10
            font-body text-sm text-white/40 hover:text-white/80
            transition-opacity duration-300 focus:outline-none
            focus:ring-2 focus:ring-[#00BBFF]/50"
          aria-label="Skip intro animation"
        >
          Skip &gt;
        </button>
      )}

      {/* Phase progress indicator (subtle) */}
      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full bg-[#00BBFF]/30 transition-all duration-300"
          style={{ width: `${state.progress * 100}%` }}
        />
      </div>
    </div>
  );
}
