'use client';

// ================================================================
// HeroAnimation — 8-Phase Cinematic Hero Sequence
// ================================================================
// 20M COCKPIT UPGRADE: Now renders inside the unified CockpitCanvas
// (CPA2-1) instead of creating its own R3F Canvas. The hero scene
// content is a <group> within the persistent Canvas, enabling
// seamless handoff to the cockpit (CPA2-3) with zero Canvas swap.
//
// Architecture (revised):
//   - HeroAnimation manages GSAP timeline, UI overlay (skip button, progress)
//   - HeroScene renders as <group> inside CockpitCanvas
//   - On Phase 7 (materialize): cockpit groups begin fading in
//   - On Phase 8 (online): hero group fades out, cockpit takes over
//   - No Canvas unmount — heroPhase transitions via cockpitStore
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Sections 3-9

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
// EffectComposer, Bloom, ChromaticAberration reserved for future post-processing passes
import {
  BoxGeometry,
  BufferGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three';
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
import { generateVoronoiShards, assignShardsToTargets, SHARD_COUNTS } from '@/lib/3d/voronoiFracture';
import { generateSplineTimings, seededRandom } from '@/lib/3d/heroSplines';
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
  void: 0,
  assembly: 2,
  showcase: 4.5,
  surge: 7.5,
  shatter: 10,
  regroup: 11.5,
  materialize: 14,
  online: 17,
} as const;

const TOTAL_DURATION = 19.0;

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
// HeroScene — Renders as <group> inside CockpitCanvas
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

  const shardGeo = useRef<BufferGeometry[]>([]);
  const shardMeshRefs = useRef<Mesh[]>([]);
  const splineTimings = useRef<ReturnType<typeof generateSplineTimings>>([]);
  const logoGroupRef = useRef<Group>(null);
  const logoMaterialRef = useRef<MeshPhysicalMaterial | null>(null);
  const emissiveIntensity = useRef(0);
  const shakeIntensity = useRef(0);

  // Phase 4 §4.5: Per-shard physics state (parallel to shardGeo.current).
  // Initialized once per shardData generation. Integrated per-frame during
  // shatter (10.0-11.5s) + regroup (11.5-14.0s) window — shards burst
  // outward from origin, tumble with angular velocity, fall under gravity,
  // and fade to invisible by t=14.0s.
  const shardPhysics = useRef<
    { velocity: Vector3; angularVelocity: Vector3 }[]
  >([]);
  // Bloom flash emitter at shatter moment (10.0s peak, decays over 1s)
  const heroBloomFlashRef = useRef<Mesh>(null);
  const heroBloomMatRef = useRef<MeshPhysicalMaterial | null>(null);
  // Track last timeline time so we can compute true frame delta within the
  // GSAP paused timeline (since useFrame delta includes audio latency etc.)
  const prevTlTime = useRef(0);

  const gpuTier = state.gpuTier;
  const shardCount = useMemo(() => {
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

    // Signal hero is animating
    setHeroPhase('animating');

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        setHeroPhase('complete');
        setCockpitReady(true);
        actions.setComplete();
      },
    });

    // Phase labels
    tl.addLabel('void', PHASE_LABELS.void);
    tl.addLabel('assembly', PHASE_LABELS.assembly);
    tl.addLabel('showcase', PHASE_LABELS.showcase);
    tl.addLabel('surge', PHASE_LABELS.surge);
    tl.addLabel('shatter', PHASE_LABELS.shatter);
    tl.addLabel('regroup', PHASE_LABELS.regroup);
    tl.addLabel('materialize', PHASE_LABELS.materialize);
    tl.addLabel('online', PHASE_LABELS.online);

    // Phase 1: Void Awakening (0.0 – 2.0s)
    const camProxy = { x: 0, y: 0, z: 1.5, fov: 35 };
    tl.to(camProxy, {
      z: 2.5,
      duration: 2.0,
      ease: 'power1.inOut',
      onUpdate: () => {
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        if ('fov' in camera) {
          (camera as PerspectiveCamera).fov = camProxy.fov;
          (camera as PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 0);

    // Phase 2: Assembly (2.0 – 4.5s)
    tl.to(camProxy, {
      z: 5.0, fov: 50,
      duration: 2.5, ease: 'power2.out',
      onUpdate: () => {
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        if ('fov' in camera) {
          (camera as PerspectiveCamera).fov = camProxy.fov;
          (camera as PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 2.0);

    if (logoGroupRef.current) {
      logoGroupRef.current.scale.set(0, 0, 0);
      tl.to(logoGroupRef.current.scale, {
        x: 1.0, y: 1.0, z: 1.0,
        duration: 2.0, ease: 'back.out(1.7)',
      }, 2.0);
    }

    // Phase 3: Showcase (4.5 – 7.5s)
    const orbitProxy = { angle: 0 };
    tl.to(orbitProxy, {
      angle: Math.PI * 2,
      duration: 3.0, ease: 'none',
      onUpdate: () => {
        const r = 3.0;
        camProxy.x = Math.sin(orbitProxy.angle) * r;
        camProxy.z = Math.cos(orbitProxy.angle) * r + 2.0;
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        camera.lookAt(0, 0, 0);
      },
    }, 4.5);

    const emissiveProxy = { intensity: 0 };
    tl.to(emissiveProxy, {
      intensity: 0.5, duration: 3.0, ease: 'power1.in',
      onUpdate: () => { emissiveIntensity.current = emissiveProxy.intensity; },
    }, 4.5);

    // Phase 4: Energy Surge (7.5 – 10.0s)
    tl.to(emissiveProxy, {
      intensity: 3.0, duration: 2.5, ease: 'power2.in',
      onUpdate: () => { emissiveIntensity.current = emissiveProxy.intensity; },
    }, 7.5);

    const shakeProxy = { intensity: 0 };
    tl.to(shakeProxy, {
      intensity: 0.03, duration: 2.5, ease: 'power2.in',
      onUpdate: () => { shakeIntensity.current = shakeProxy.intensity; },
    }, 7.5);

    // Phase 5: Shatter (10.0 – 11.5s)
    tl.to(shakeProxy, { intensity: 0.08, duration: 0.1, ease: 'power4.out' }, 10.0);
    tl.to(shakeProxy, {
      intensity: 0.0, duration: 1.4, ease: 'expo.out',
      onUpdate: () => { shakeIntensity.current = shakeProxy.intensity; },
    }, 10.1);

    if (logoGroupRef.current) {
      tl.to(logoGroupRef.current.scale, {
        x: 0, y: 0, z: 0, duration: 0.3, ease: 'power4.in',
      }, 10.0);
    }

    tl.to(camProxy, {
      fov: 55, duration: 0.3, ease: 'power2.out',
      onUpdate: () => {
        if ('fov' in camera) {
          (camera as PerspectiveCamera).fov = camProxy.fov;
          (camera as PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 10.0);
    tl.to(camProxy, {
      fov: 53, duration: 1.2, ease: 'power1.out',
      onUpdate: () => {
        if ('fov' in camera) {
          (camera as PerspectiveCamera).fov = camProxy.fov;
          (camera as PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 10.3);

    // Phase 6: Regroup (11.5 – 14.0s)
    tl.to(camProxy, {
      fov: 56, duration: 2.5, ease: 'power1.inOut',
      onUpdate: () => {
        if ('fov' in camera) {
          (camera as PerspectiveCamera).fov = camProxy.fov;
          (camera as PerspectiveCamera).updateProjectionMatrix();
        }
      },
    }, 11.5);

    tl.to(camProxy, {
      x: 0, y: 0, z: 5.0,
      duration: 2.5, ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        camera.lookAt(0, 0, 0);
      },
    }, 11.5);

    // Phase 7: Materialize (14.0 – 17.0s) — cockpit begins fading in
    tl.to(camProxy, {
      x: 0, y: 6.5, z: 7, fov: 58,
      duration: 3.0, ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(camProxy.x, camProxy.y, camProxy.z);
        if ('fov' in camera) {
          (camera as PerspectiveCamera).fov = camProxy.fov;
          (camera as PerspectiveCamera).updateProjectionMatrix();
        }
        camera.lookAt(0, 3, 0);
      },
    }, 14.0);

    // At t=14s, signal materialization phase
    tl.call(() => setHeroPhase('materializing'), [], 14.0);

    // Phase 8: Online (17.0 – 19.0s) — cockpit alive
    tl.to({}, { duration: 2.0 }, 17.0);

    timelineRef.current = tl;
    tl.play();

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shouldSkip]);

  // ── Sync timeScale (OD-2) ──
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.timeScale(state.timeScale);
    }
    if (audioRef.current) {
      audioRef.current.setTimeScale(state.timeScale);
    }
  }, [state.timeScale]);

  // ── Audio (OD-1) ──
  const soundEnabled = useUIStore((s) => s.soundEnabled);

  useEffect(() => {
    if (state.shouldSkip) return;

    const audio = new HeroAudioTimeline(soundEnabled);
    audioRef.current = audio;

    const initAudio = async () => {
      try {
        await audio.initialize();
      } catch {
        // Audio init failed — animation continues silently
      }
    };
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

    actions.setProgress(Math.min(progress, 1.0));
    actions.setPhase(phase);

    if (audioRef.current) {
      audioRef.current.syncToProgress(progress);
    }

    if (shakeIntensity.current > 0.001) {
      const shake = shakeIntensity.current;
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
    }

    if (logoMaterialRef.current) {
      logoMaterialRef.current.emissiveIntensity = emissiveIntensity.current;
    }

    // Phase 4 §4.5: Per-shard physics + bloom flash during shatter→regroup.
    // Shatter starts at 10.0s (PHASE_LABELS.shatter). Shards burst outward
    // from origin, tumble under angular velocity, fall under light gravity,
    // and fade opacity to 0 by t=14.0s. Bloom flash sphere spikes at 10.0
    // and decays over 1s — reads through the existing post-processing
    // bloom pass as a visible impact burst.
    const tlTime = currentTime;
    const dt = Math.max(0, Math.min(0.05, tlTime - prevTlTime.current));
    prevTlTime.current = tlTime;

    if (tlTime >= 10.0 && tlTime < 14.0) {
      // Fade: full opacity 10.0-12.0, then linear fade to 0 by 14.0
      const fadeOut =
        tlTime > 12.0 ? Math.max(0, 1 - (tlTime - 12.0) / 2.0) : 1;
      const GRAVITY = -4.5; // gentler than real-world for artistic drift
      const DAMPING = 0.985;
      const ANGULAR_DAMPING = 0.99;

      for (let i = 0; i < shardMeshRefs.current.length; i++) {
        const mesh = shardMeshRefs.current[i];
        const phys = shardPhysics.current[i];
        if (!mesh || !phys) continue;

        mesh.visible = true;

        // Physics integration
        phys.velocity.y += GRAVITY * dt;
        phys.velocity.multiplyScalar(DAMPING);
        phys.angularVelocity.multiplyScalar(ANGULAR_DAMPING);

        mesh.position.addScaledVector(phys.velocity, dt);
        mesh.rotation.x += phys.angularVelocity.x * dt;
        mesh.rotation.y += phys.angularVelocity.y * dt;
        mesh.rotation.z += phys.angularVelocity.z * dt;

        // Fade opacity via material
        const mat = mesh.material as MeshPhysicalMaterial;
        if (mat) {
          mat.opacity = fadeOut;
          // Emissive tracks fade — dimmer shards at end
          mat.emissiveIntensity = fadeOut * 1.5;
        }
      }

      // Bloom flash at shatter moment (10.0-11.0s): spike to 4.0, decay to 0
      if (heroBloomMatRef.current && heroBloomFlashRef.current) {
        if (tlTime < 11.0) {
          const bloomT = (tlTime - 10.0) / 1.0; // 0..1 over 1s
          const intensity = Math.max(0, (1 - bloomT) * 4.0);
          heroBloomMatRef.current.emissiveIntensity = intensity;
          heroBloomMatRef.current.opacity = Math.min(intensity * 0.5, 0.7);
          heroBloomFlashRef.current.visible = intensity > 0.05;
          // Brief outward scale pulse during the flash (1.0→1.8)
          const s = 1.0 + (1 - bloomT) * 0.8;
          heroBloomFlashRef.current.scale.setScalar(s);
        } else {
          heroBloomFlashRef.current.visible = false;
          heroBloomMatRef.current.emissiveIntensity = 0;
          heroBloomMatRef.current.opacity = 0;
        }
      }
    } else if (tlTime >= 14.0) {
      // Ensure shards hidden after regroup ends (bloom flash already off)
      for (const mesh of shardMeshRefs.current) {
        if (mesh) mesh.visible = false;
      }
      if (heroBloomFlashRef.current) heroBloomFlashRef.current.visible = false;
    }
  });

  // ── Voronoi shards ──
  // Audit §9.3 fix (Phase 3 Task 2A): Geometry + spline timings generated
  // in useMemo instead of useEffect, so unrelated re-renders don't re-run
  // the expensive CPU-side Voronoi fracture + shard assignment. Memoized
  // result is keyed to [shardCount, shouldSkip] — exactly the dependencies
  // that invalidate the shard set.
  const shardData = useMemo(() => {
    if (state.shouldSkip) return null;

    const logoGeometry = new BoxGeometry(6, 1.5, 0.5, 4, 4, 4);
    const clampedShardCount = Math.min(shardCount, 500);
    const shards = generateVoronoiShards(logoGeometry, clampedShardCount, 42);

    const targets = [
      { name: 'panel' as const, positions: [new Vector3(-3, 4, 0), new Vector3(3, 4, 0)], weight: 0.3 },
      { name: 'sidePanel' as const, positions: [new Vector3(-5, 2, 0), new Vector3(5, 2, 0)], weight: 0.2 },
      { name: 'hud' as const, positions: [new Vector3(0, 6, -1)], weight: 0.15 },
      { name: 'statusBar' as const, positions: [new Vector3(0, -2, 0)], weight: 0.15 },
      { name: 'ledRim' as const, positions: [new Vector3(-4, 0, 0), new Vector3(4, 0, 0)], weight: 0.1 },
      { name: 'ambient' as const, positions: [new Vector3(0, 3, -3)], weight: 0.1 },
    ];
    const assignments = assignShardsToTargets(shards, targets);
    const timings = generateSplineTimings(assignments.length, 42);

    logoGeometry.dispose();
    return { shards, timings };
  }, [shardCount, state.shouldSkip]);

  // Sync memoized shard data into refs + dispose GPU memory on invalidation
  useEffect(() => {
    if (!shardData) return;
    shardGeo.current = shardData.shards;
    splineTimings.current = shardData.timings;

    // Phase 4 §4.5: Initialize per-shard physics once per shardData cycle.
    // Each shard gets a random outward velocity (biased upward) + angular
    // velocity for natural tumbling motion during shatter→regroup window.
    const rng = seededRandom(42);
    shardPhysics.current = shardData.shards.map(() => {
      const speed = 2.5 + rng() * 3.5; // 2.5-6.0 units/sec outward
      const theta = rng() * Math.PI * 2;
      const phi = (rng() - 0.35) * Math.PI * 0.9; // slight upward bias
      return {
        velocity: new Vector3(
          Math.sin(theta) * Math.cos(phi) * speed,
          Math.sin(phi) * speed + 1.5, // upward bias
          Math.cos(theta) * Math.cos(phi) * speed
        ),
        angularVelocity: new Vector3(
          (rng() - 0.5) * 6,
          (rng() - 0.5) * 6,
          (rng() - 0.5) * 6
        ),
      };
    });

    return () => {
      // Dispose BufferGeometry instances on unmount or shardData change
      shardData.shards.forEach((g) => g.dispose());
    };
  }, [shardData]);

  // ── Ambient particles ──
  const particlePositions = useMemo(() => {
    const arr = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  if (state.shouldSkip || state.isComplete) return null;

  return (
    <>
      <ambientLight intensity={0.05} color="#00BBFF" />
      <pointLight position={[0, 2, 4]} intensity={2} color="#00BBFF" distance={15} decay={2} />

      <group ref={logoGroupRef}>
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

      {shardGeo.current.map((geo, i) => (
        <mesh
          key={i}
          geometry={geo}
          ref={(el) => { if (el) shardMeshRefs.current[i] = el; }}
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

      {/* Phase 4 §4.5: Bloom flash emitter at shatter moment.
          Hidden by default; spikes to emissiveIntensity 4.0 at t=10.0
          and decays to 0 by t=11.0. Reads through the cockpit's bloom
          post-processing pass as a visible impact burst. */}
      <mesh ref={heroBloomFlashRef} visible={false}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshPhysicalMaterial
          ref={heroBloomMatRef}
          color="#00BBFF"
          emissive="#00BBFF"
          emissiveIntensity={0}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#00BBFF" transparent opacity={0.4} sizeAttenuation />
      </points>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// HeroAnimation — Outer Wrapper (UI Overlay only)
// ════════════════════════════════════════════════════════════════
// No longer creates its own Canvas. The HeroScene group renders
// inside CockpitCanvas. This component manages:
//   - GPU tier detection
//   - Skip/fast-forward UI
//   - Progress bar overlay
//   - Screen reader announcements
//   - heroPhase lifecycle via cockpitStore

export default function HeroAnimation({ onComplete, onPhaseChange }: HeroAnimationProps) {
  const [state, actions] = useHeroAnimation(onComplete, onPhaseChange);
  const [skipVisible, setSkipVisible] = useState(false);
  const setHeroPhase = useCockpitStore((s) => s.setHeroPhase);
  const setCockpitReady = useCockpitStore((s) => s.setCockpitReady);

  // GPU detection
  useEffect(() => {
    const detect = async () => {
      const result = await detectGPUTier();
      useDeviceStore.getState().setGpuTier(result.tier, result.stripeCount);
    };
    detect();
  }, []);

  // Skip button after 2s
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

  // When skip fires, ensure cockpit state is correct
  useEffect(() => {
    if (state.shouldSkip) {
      setHeroPhase('complete');
      setCockpitReady(true);
    }
  }, [state.shouldSkip, setHeroPhase, setCockpitReady]);

  // Skip: no overlay needed
  if (state.shouldSkip) return null;

  // Complete: remove overlay, cockpit continues in CockpitCanvas
  if (state.isComplete) return null;

  // Hero animation overlay (z-50 background + skip UI)
  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ background: '#0A0E16' }}
      aria-label="SparkForge hero animation"
    >
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        SparkForge is loading your command station...
      </div>

      {/* Skip button (OD-2) */}
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

      {/* Phase progress indicator */}
      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full bg-[#00BBFF]/30 transition-all duration-300"
          style={{ width: `${state.progress * 100}%` }}
        />
      </div>
    </div>
  );
}
