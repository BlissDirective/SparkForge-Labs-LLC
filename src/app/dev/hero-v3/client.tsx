'use client';

/**
 * Hero v3 — Standalone scrubber + 4-beat visualization
 *
 * Master clock: 0 → 11.0 s (covers Beats 1-4 of the 19.5 s storyboard;
 * Beats 5-8 added in Phase 5c). Play/pause + speed (1×/2×/4×) +
 * slider scrub. Each beat mounts unconditionally; the `active` prop
 * gates per-frame work to whichever beat is currently in-window.
 *
 * Camera path (storyboard §3-§6) drives via <HeroV3CameraController>
 * which uses useFrame from inside the Canvas to interpolate between
 * beat-boundary waypoints.
 *
 * Theatre.js studio auto-mounts at first import per Q8 sign-off.
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { WebGPURenderer } from 'three/webgpu';
import { Color, MathUtils, type PerspectiveCamera, Vector3 } from 'three';

import { Beat1VoidAwakening } from '@/components/3d/hero/v3/Beat1VoidAwakening';
import { Beat2IgnitionSpark } from '@/components/3d/hero/v3/Beat2IgnitionSpark';
import { Beat3SCrystallization } from '@/components/3d/hero/v3/Beat3SCrystallization';
import { Beat4FMirrorAndShardBurst } from '@/components/3d/hero/v3/Beat4FMirrorAndShardBurst';
import { Beat5WordmarkCascade } from '@/components/3d/hero/v3/Beat5WordmarkCascade';
import { Beat6DichroicBloom } from '@/components/3d/hero/v3/Beat6DichroicBloom';
import { Beat7CockpitMaterialization } from '@/components/3d/hero/v3/Beat7CockpitMaterialization';
import { Beat8AtomicHandoff } from '@/components/3d/hero/v3/Beat8AtomicHandoff';
import { ensureHeroStudio } from '@/lib/hero/heroTheatreProject';
import { LIGHTING, PALETTE, SF_BRAND } from '@/lib/branding/sf-material.config';

// ─────────────────────────────────────────────────────────────────────
// Beat boundaries (storyboard §2 + runtime extension)
// ─────────────────────────────────────────────────────────────────────

const BEAT_BOUNDS = [
  { id: 1, start: 0.0,  end: 2.5,  label: 'Void Awakening' },
  { id: 2, start: 2.5,  end: 5.0,  label: 'Ignition Spark' },
  { id: 3, start: 5.0,  end: 8.0,  label: 'S Crystallization' },
  { id: 4, start: 8.0,  end: 11.0, label: 'F Mirror + Shard Burst' },
  { id: 5, start: 11.0, end: 14.0, label: 'Wordmark Cascade' },
  { id: 6, start: 14.0, end: 16.5, label: 'Dichroic Bloom' },
  { id: 7, start: 16.5, end: 18.5, label: 'Cockpit Materialization' },
  { id: 8, start: 18.5, end: 19.5, label: 'Shatter-into-UI' },
] as const;

const SCRUB_END = 19.5;

// ─────────────────────────────────────────────────────────────────────
// Camera waypoints (storyboard §3-§6)
// ─────────────────────────────────────────────────────────────────────

interface CameraWaypoint {
  time: number;
  pos: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

const CAMERA_WAYPOINTS: CameraWaypoint[] = [
  // Beat 1 start: void, far back, dolly-in
  { time: 0.0,  pos: [0, 0, 16],   lookAt: [0, 0, 0],     fov: 35 },
  { time: 2.5,  pos: [0, 0, 12],   lookAt: [0, 0, 0],     fov: 35 },
  // Beat 2: parallax dolly to lower-left S anchor
  { time: 5.0,  pos: [-1.4, 0.6, 9.2], lookAt: [-0.2, 0.1, 0], fov: 38 },
  // Beat 3: pull in to S
  { time: 8.0,  pos: [-0.4, 0.2, 7.5], lookAt: [-0.4, 0.2, 0], fov: 40 },
  // Beat 4 end: lateral dolly across to F position; slight tilt up
  { time: 11.0, pos: [0.4, 0.2, 7.5],  lookAt: [0.4, 0.2, 0],  fov: 40 },
  // Beat 5 end: pull-back + recenter for full-word framing
  { time: 14.0, pos: [0, 0.4, 9.5],   lookAt: [0, 0, 0],      fov: 42 },
  // Beat 6 end: gentle pull-back; breathing float
  { time: 16.5, pos: [0, 0.6, 10.5],  lookAt: [0, 0, 0],      fov: 44 },
  // Beat 7 end: strong upward + forward arc; lookAt cockpit horizon
  { time: 18.5, pos: [0, 6.0, 7.5],   lookAt: [0, 3.0, 0],    fov: 58 },
  // Beat 8: hold at Beat 7 end pose (no further movement — atomic handoff)
  { time: 19.5, pos: [0, 6.0, 7.5],   lookAt: [0, 3.0, 0],    fov: 58 },
];

function lerpVec3(a: readonly number[], b: readonly number[], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function sampleCameraAt(time: number): { pos: [number, number, number]; lookAt: [number, number, number]; fov: number } {
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
      // smoothstep for ease-in/out between waypoints
      const u = t * t * (3 - 2 * t);
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

// ─────────────────────────────────────────────────────────────────────
// Camera controller (lives inside Canvas; reads timeRef each frame)
// ─────────────────────────────────────────────────────────────────────

function HeroV3CameraController({ timeRef }: { timeRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const lookAtVec = useRef(new Vector3());

  useFrame(() => {
    const t = timeRef.current;
    const wp = sampleCameraAt(t);
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
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Beat dispatcher — mounts all 4 beats, gates active by current time
// ─────────────────────────────────────────────────────────────────────

function HeroV3Beats({ timeRef }: { timeRef: React.MutableRefObject<number> }) {
  // Per-frame compute of per-beat progress + active. Throttled to ~30 Hz
  // to avoid React re-render storm.
  const [beatState, setBeatState] = useState(() => ({
    beat1: { progress: 0, active: true },
    beat2: { progress: 0, active: false },
    beat3: { progress: 0, active: false },
    beat4: { progress: 0, active: false },
    beat5: { progress: 0, active: false },
    beat6: { progress: 0, active: false },
    beat7: { progress: 0, active: false },
    beat8: { progress: 0, active: false },
  }));
  const lastUpdateRef = useRef(-1);

  useFrame(() => {
    const t = timeRef.current;
    if (Math.abs(t - lastUpdateRef.current) < 0.033) return;
    lastUpdateRef.current = t;

    const beats = BEAT_BOUNDS.map((b) => {
      const active = t >= b.start && t < b.end;
      const progress = active
        ? Math.max(0, Math.min(1, (t - b.start) / (b.end - b.start)))
        : t >= b.end ? 1 : 0;
      return { active, progress };
    });

    setBeatState({
      beat1: beats[0],
      beat2: beats[1],
      beat3: beats[2],
      beat4: beats[3],
      beat5: beats[4],
      beat6: beats[5],
      beat7: beats[6],
      beat8: beats[7],
    });
  });

  return (
    <>
      <Beat1VoidAwakening progress={beatState.beat1.progress} active={beatState.beat1.active} />
      <Beat2IgnitionSpark progress={beatState.beat2.progress} active={beatState.beat2.active} />
      <Beat3SCrystallization progress={beatState.beat3.progress} active={beatState.beat3.active} />
      <Beat4FMirrorAndShardBurst progress={beatState.beat4.progress} active={beatState.beat4.active} />
      <Beat5WordmarkCascade progress={beatState.beat5.progress} active={beatState.beat5.active} />
      <Beat6DichroicBloom progress={beatState.beat6.progress} active={beatState.beat6.active} />
      <Beat7CockpitMaterialization progress={beatState.beat7.progress} active={beatState.beat7.active} />
      <Beat8AtomicHandoff
        progress={beatState.beat8.progress}
        active={beatState.beat8.active}
        onHandoffComplete={() => {
          // Dev scrubber log only — HeroAnimation v3 (5c.6) wires this
          // to cockpitStore.setHeroPhase('complete') + setCockpitReady(true)
          if (typeof console !== 'undefined') {
            console.info('[hero v3 dev] Atomic handoff complete @ t=19.5');
          }
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Lighting rig — mirrors BrandingShowcase
// ─────────────────────────────────────────────────────────────────────

function HeroV3Lighting() {
  return (
    <>
      <Environment frames={1} resolution={SF_BRAND.HDRI.cubeSize}>
        <Lightformer position={[-3.4, -2.1, 2.6]} intensity={LIGHTING.key.intensity * 0.7} color={LIGHTING.key.color} scale={[6, 6, 6]} form="rect" />
        <Lightformer position={[3.6, 2.4, 1.8]} intensity={LIGHTING.rim.intensity * 0.7} color={LIGHTING.rim.color} scale={[6, 6, 6]} form="rect" />
        <Lightformer position={[0, -0.5, 4.0]} intensity={LIGHTING.fill.intensity * 0.7} color={LIGHTING.fill.color} scale={[3, 3, 3]} form="rect" />
      </Environment>
      <pointLight position={[-3.4, -2.1, 2.6]} color={LIGHTING.key.color} intensity={LIGHTING.key.intensity} distance={12} decay={1.4} />
      <pointLight position={[3.6, 2.4, 1.8]} color={LIGHTING.rim.color} intensity={LIGHTING.rim.intensity} distance={12} decay={1.4} />
      <pointLight position={[0, -0.5, 4.0]} color={LIGHTING.fill.color} intensity={LIGHTING.fill.intensity} distance={20} decay={1.0} />
      <ambientLight intensity={0.08} color={PALETTE.voidNavyLift} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Top-level client component
// ─────────────────────────────────────────────────────────────────────

export function HeroV3Client() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const timeRef = useRef(0);

  // Mount Theatre.js studio on first render (Q8)
  useEffect(() => {
    void ensureHeroStudio();
  }, []);

  // Keep refs synchronized with state
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // Master clock tick when playing
  useEffect(() => {
    if (!playing) return;
    let lastT = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;
      setTime((t) => {
        const next = t + dt * speed;
        if (next >= SCRUB_END) {
          setPlaying(false);
          return SCRUB_END;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  // Determine active beat for label display
  const activeBeat = BEAT_BOUNDS.find((b) => time >= b.start && time < b.end) ?? BEAT_BOUNDS[BEAT_BOUNDS.length - 1];

  return (
    <main className="min-h-screen bg-[#02050d] text-white/90">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Hero v3 · Dev Lab</h1>
          <p className="mt-1 text-sm text-white/60">
            Beat-by-beat scrubber for the Hero v3 storyboard. Beats 1-4 implemented in Phase 5b;
            Beats 5-8 land in Phase 5c. Theatre.js studio auto-mounted (per Q8) — tune any beat
            object in the panel that appears in the bottom-right.
          </p>
        </header>

        {/* Transport controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-md border border-cyan-300/40 bg-cyan-300/10 px-4 py-1.5 text-sm font-medium text-cyan-100 hover:bg-cyan-300/20"
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => { setTime(0); setPlaying(false); }}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            ⏮ Rewind
          </button>
          <div className="flex gap-1">
            {[1.0, 2.0, 4.0].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  speed === s
                    ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100'
                    : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {s.toFixed(0)}×
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs tabular-nums text-white/70">
            t = <span className="text-white">{time.toFixed(2)}s</span>
            <span className="mx-2 text-white/30">·</span>
            Beat {activeBeat.id}: <span className="text-cyan-200">{activeBeat.label}</span>
          </div>
        </div>

        {/* Master scrubber */}
        <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <input
            type="range"
            min={0}
            max={SCRUB_END}
            step={0.01}
            value={time}
            onChange={(e) => { setTime(parseFloat(e.target.value)); setPlaying(false); }}
            className="h-2 w-full cursor-pointer accent-cyan-300"
          />
          <div className="mt-2 flex justify-between text-[10px] text-white/40 tabular-nums">
            {BEAT_BOUNDS.map((b) => (
              <span key={b.id}>
                <span className="text-white/60">{b.start.toFixed(1)}s</span>{' '}
                <span className="text-white/40">{b.label.split(' ')[0]}</span>
              </span>
            ))}
            <span className="text-white/60">{SCRUB_END.toFixed(1)}s</span>
          </div>
        </div>

        {/* Canvas */}
        <section className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#02050d]">
          <Canvas
            camera={{ position: [0, 0, 16], fov: 35, near: 0.1, far: 200 }}
            gl={async (props) => {
              const renderer = new WebGPURenderer({
                ...(props as Record<string, unknown>),
                antialias: true,
                alpha: false,
              });
              await renderer.init();
              return renderer as unknown as never;
            }}
            onCreated={({ scene, gl }) => {
              scene.background = new Color(PALETTE.voidNavy);
              gl.toneMappingExposure = 1.1;
            }}
            aria-label="Hero v3 dev canvas"
            className="h-full w-full"
          >
            <HeroV3Lighting />
            <HeroV3CameraController timeRef={timeRef} />
            <HeroV3Beats timeRef={timeRef} />
          </Canvas>
          <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-white/80">
            Hero v3 · all 8 beats ({MathUtils.clamp((time / SCRUB_END) * 100, 0, 100).toFixed(0)}%)
          </div>
        </section>

        <footer className="mt-6 space-y-1 text-xs text-white/40">
          <p>Storyboard: <code>docs/hero-v3/Storyboard.md</code> v1.2 (19.5 s total). This route covers all 8 beats (0 → 19.5 s) — Phase 5c.</p>
          <p>Audio: heroAudio.ts:syncToProgress fully remapped per storyboard §11. Theatre.js studio auto-mounted (Q8) — tune any beat's exposed objects in the bottom-right panel.</p>
          <p>Live homepage hero (/) stays on v2 until 5c.6 wires v3 into HeroAnimation.tsx wholesale (visual sign-off via HS-9 hard stop after 5c.6).</p>
        </footer>
      </div>
    </main>
  );
}
