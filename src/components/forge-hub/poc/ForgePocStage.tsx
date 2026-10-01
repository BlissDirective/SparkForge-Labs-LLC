'use client';

// R3F wrapper for the Forge Stage POC. The single `stage` clock is driven
// by the real forge slice: HUD buttons call applyForgeRoute (store), and
// each frame the scene eases toward modeToStage(forge.mode) and mirrors its
// progress into the shared forge.morphProgress — so the POC is a genuine
// store/Director consumer, not a private widget. The scrubber + auto-cycle
// are local overrides that sync the store mode when they settle.
//
// `source` swaps the procedural stand-ins for authored GLBs (same clock,
// same glass shader) the moment the assets exist.

import {
  Suspense,
  useEffect,
  useMemo,
  type MutableRefObject,
  type RefObject,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Canvas3DErrorBoundary } from '@/components/3d/Canvas3DErrorBoundary';
import {
  clamp01,
  modeToStage,
  samplePocPose,
  stageToMode,
} from '@/lib/forge-hub/poc/pocStage';
import { forgeRouteForDevMode } from '@/lib/forge-hub/devHud';
import { useForgeStore } from '@/stores/sceneStore';
import { buildPocScene } from './pocScene';
import { ForgePocGltfObjects } from './ForgePocGltfObjects';

export type PocSource = 'procedural' | 'glb';

export interface PocState {
  stage: number;
  auto: boolean;
  beams: boolean;
  rm: boolean;
  baked: boolean;
  dragging: boolean;
}

export interface PocReadoutRefs {
  mode: RefObject<HTMLElement | null>;
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
  source: PocSource;
}

const fmt = (n: number, d = 2) => n.toFixed(d);

function PocScene({ stateRef, readouts, source }: StageProps) {
  const scene = useMemo(
    () => buildPocScene({ includeObjects: source === 'procedural' }),
    [source],
  );
  const { camera, size } = useThree();
  const applyForgeRoute = useForgeStore((s) => s.applyForgeRoute);
  const setForgeMorphProgress = useForgeStore((s) => s.setForgeMorphProgress);

  useEffect(() => () => scene.dispose(), [scene]);

  useFrame((_, deltaRaw) => {
    const st = stateRef.current;
    const dt = Math.min(0.05, deltaRaw);
    const t = performance.now() / 1000;
    const forge = useForgeStore.getState().forge;

    // target: scrubber (dragging) > auto-cycle > store mode (Director/route)
    let target: number;
    if (st.dragging) target = st.stage;
    else if (st.auto) target = Math.sin(t * 0.28) * 0.5 + 0.5;
    else target = modeToStage(forge.mode);

    const from = modeToStage(forge.previousMode ?? forge.mode);
    if (st.dragging) {
      st.stage = clamp01(st.stage);
    } else {
      const k = st.rm ? 0.35 : 0.1;
      st.stage += (target - st.stage) * (1 - Math.pow(1 - k, dt * 60));
      if (Math.abs(target - st.stage) < 0.0005) st.stage = target;
    }

    // mirror the POC progress into the shared forge clock
    const span = Math.abs(target - from) || 1;
    setForgeMorphProgress(clamp01(Math.abs(st.stage - from) / span));

    // keep store mode consistent when auto/scrub settle on a stop
    if ((st.auto || st.dragging) && Math.abs(target - st.stage) < 0.02) {
      const m = stageToMode(st.stage);
      if (m !== forge.mode) applyForgeRoute(forgeRouteForDevMode(m, st.rm));
    }

    const pose = samplePocPose(st.stage);
    const r = scene.update(pose, t, { beams: st.beams, baked: st.baked, rm: st.rm });

    const asp = size.width / Math.max(1, size.height);
    camera.position.set(0, 0.25, 13.5 * Math.min(2.2, Math.max(1, 1.35 / asp)));
    camera.lookAt(0, 0.15, 0);

    const ro = readouts;
    if (ro.slider.current && !st.dragging) ro.slider.current.value = String(st.stage);
    if (ro.mode.current) ro.mode.current.textContent = forge.mode;
    if (ro.stage.current) ro.stage.current.textContent = fmt(st.stage);
    if (ro.cw.current) ro.cw.current.textContent = fmt(r.cw, 1);
    if (ro.side.current) ro.side.current.textContent = fmt(r.side);
    if (ro.emit.current) ro.emit.current.textContent = fmt(r.emit);
    if (ro.beam.current) ro.beam.current.textContent = fmt(r.beam);
    if (ro.dim.current) ro.dim.current.textContent = fmt(r.dim);
  });

  return (
    <>
      <primitive object={scene.group} />
      {source === 'glb' ? (
        <Suspense fallback={null}>
          <ForgePocGltfObjects controller={scene} />
        </Suspense>
      ) : null}
    </>
  );
}

export function ForgePocStage({ stateRef, readouts, source }: StageProps) {
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
        <PocScene stateRef={stateRef} readouts={readouts} source={source} />
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
