'use client';

// R3F wrapper for the Forge Stage POC scene. Mounts the imperative
// scene graph, eases the single `stage` clock toward its target each
// frame, and layers a gentle Bloom on top of the baked material glow.

import { useEffect, useMemo, type MutableRefObject, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Canvas3DErrorBoundary } from '@/components/3d/Canvas3DErrorBoundary';
import { samplePocPose } from '@/lib/forge-hub/poc/pocStage';
import { buildPocScene } from './pocScene';

export interface PocState {
  target: number;
  stage: number;
  auto: boolean;
  beams: boolean;
  rm: boolean;
  baked: boolean;
  dragging: boolean;
}

export interface PocReadoutRefs {
  stage: RefObject<HTMLElement | null>;
  cw: RefObject<HTMLElement | null>;
  side: RefObject<HTMLElement | null>;
  emit: RefObject<HTMLElement | null>;
  beam: RefObject<HTMLElement | null>;
  dim: RefObject<HTMLElement | null>;
  slider: RefObject<HTMLInputElement | null>;
}

interface StageProps {
  stateRef: MutableRefObject<PocState>;
  readouts: PocReadoutRefs;
}

function fmt(n: number, d = 2) {
  return n.toFixed(d);
}

function PocScene({ stateRef, readouts }: StageProps) {
  const scene = useMemo(() => buildPocScene(), []);
  const { camera, size } = useThree();

  useEffect(() => () => scene.dispose(), [scene]);

  useFrame((_, deltaRaw) => {
    const st = stateRef.current;
    const dt = Math.min(0.05, deltaRaw);
    const t = performance.now() / 1000;

    // ease `stage` toward target (interruptible); reduced-motion snaps faster
    if (!st.dragging) {
      const k = st.rm ? 0.35 : 0.1;
      st.stage += (st.target - st.stage) * (1 - Math.pow(1 - k, dt * 60));
      if (Math.abs(st.target - st.stage) < 0.0005) st.stage = st.target;
    }
    if (st.auto) st.target = Math.sin(t * 0.28) * 0.5 + 0.5;

    const pose = samplePocPose(st.stage);
    const r = scene.update(pose, t, { beams: st.beams, baked: st.baked, rm: st.rm });

    // responsive dolly so the trio stays framed on narrow viewports
    const asp = size.width / Math.max(1, size.height);
    camera.position.set(0, 0.25, 13.5 * Math.min(2.2, Math.max(1, 1.35 / asp)));
    camera.lookAt(0, 0.15, 0);

    const ro = readouts;
    if (ro.slider.current && !st.dragging) ro.slider.current.value = String(st.stage);
    if (ro.stage.current) ro.stage.current.textContent = fmt(st.stage);
    if (ro.cw.current) ro.cw.current.textContent = fmt(r.cw, 1);
    if (ro.side.current) ro.side.current.textContent = fmt(r.side);
    if (ro.emit.current) ro.emit.current.textContent = fmt(r.emit);
    if (ro.beam.current) ro.beam.current.textContent = fmt(r.beam);
    if (ro.dim.current) ro.dim.current.textContent = fmt(r.dim);
  });

  return <primitive object={scene.group} />;
}

export function ForgePocStage({ stateRef, readouts }: StageProps) {
  return (
    <Canvas3DErrorBoundary
      fallback={
        <div className="grid h-full w-full place-items-center bg-[#1a120d] text-sm text-cyan-100/70">
          3D stage unavailable on this device.
        </div>
      }
    >
      <Canvas
        frameloop="always"
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.25, 13.5], fov: 36, near: 0.1, far: 100 }}
      >
        <color attach="background" args={[0x241a14]} />
        <PocScene stateRef={stateRef} readouts={readouts} />
        <EffectComposer>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.28}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </Canvas3DErrorBoundary>
  );
}

export default ForgePocStage;
