'use client';

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { Canvas3DErrorBoundary } from '@/components/3d/Canvas3DErrorBoundary';
import {
  createRenderer,
  rendererBackendOf,
  type CanvasRendererBackend,
  type CreateRendererPrefer,
} from '@/lib/3d/webgpuRenderer';
import { FORGE_HUB_CAMERA, FORGE_HUB_DPR } from '@/config/forgeHub';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import { useForgeStore } from '@/stores/sceneStore';
import { ForgeBloomOnly } from './ForgeBloomOnly';
import { ForgeFixedCamera } from './ForgeFixedCamera';
import { ForgePosterFallback } from './ForgePosterFallback';
import { ForgeRoom } from './ForgeRoom';

interface ForgeStageProps {
  onReady?: (backend: CanvasRendererBackend) => void;
  onFailure?: () => void;
  /** `webgl2` skips WebGPU (`?fallback=webgl2`). */
  prefer?: CreateRendererPrefer;
}

function PosterFallback({ onFailure }: { onFailure?: () => void }) {
  useEffect(() => {
    onFailure?.();
  }, [onFailure]);
  return <ForgePosterFallback className="h-full w-full" withGlass />;
}

function ForgeStageInner({
  onReady,
  onFailure,
  prefer = 'auto',
}: {
  onReady?: (backend: CanvasRendererBackend) => void;
  onFailure?: () => void;
  prefer?: CreateRendererPrefer;
}) {
  const frameloop = useForgeStore((s) => s.forge.frameloop);
  const reduced = useForgeReducedMotion();

  return (
    <Canvas
      frameloop={frameloop}
      dpr={FORGE_HUB_DPR}
      camera={{
        position: [...FORGE_HUB_CAMERA.position],
        fov: FORGE_HUB_CAMERA.fov,
        near: FORGE_HUB_CAMERA.near,
        far: FORGE_HUB_CAMERA.far,
      }}
      gl={async (props) => {
        try {
          return await createRenderer(
            {
              ...props,
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              stencil: false,
              depth: true,
            },
            { prefer },
          );
        } catch (err) {
          onFailure?.();
          throw err;
        }
      }}
      onCreated={(state) => {
        onReady?.(rendererBackendOf(state.gl));
      }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <AdaptiveDpr pixelated />
        <ForgeFixedCamera reducedMotion={reduced} />
        <ForgeRoom reducedMotion={reduced} />
        <ForgeBloomOnly />
      </Suspense>
    </Canvas>
  );
}

export function ForgeStage({
  onReady,
  onFailure,
  prefer = 'auto',
}: ForgeStageProps) {
  return (
    <Canvas3DErrorBoundary fallback={<PosterFallback onFailure={onFailure} />}>
      <ForgeStageInner
        onReady={onReady}
        onFailure={onFailure}
        prefer={prefer}
      />
    </Canvas3DErrorBoundary>
  );
}

export default ForgeStage;
