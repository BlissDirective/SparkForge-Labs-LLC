'use client';

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { Canvas3DErrorBoundary } from '@/components/3d/Canvas3DErrorBoundary';
import { createRenderer } from '@/lib/3d/webgpuRenderer';
import { FORGE_HUB_CAMERA, FORGE_HUB_DPR } from '@/config/forgeHub';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import { useForgeStore } from '@/stores/sceneStore';
import { ForgeBloomOnly } from './ForgeBloomOnly';
import { ForgeFixedCamera } from './ForgeFixedCamera';
import { ForgePosterFallback } from './ForgePosterFallback';
import { ForgeRoom } from './ForgeRoom';

interface ForgeStageProps {
  onReady?: () => void;
  onFailure?: () => void;
}

function PosterFallback({ onFailure }: { onFailure?: () => void }) {
  useEffect(() => {
    onFailure?.();
  }, [onFailure]);
  return <ForgePosterFallback className="h-full w-full" withGlass />;
}

function ForgeStageInner({ onReady }: { onReady?: () => void }) {
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
      gl={(props) =>
        createRenderer({
          ...props,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        })
      }
      onCreated={() => {
        onReady?.();
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

export function ForgeStage({ onReady, onFailure }: ForgeStageProps) {
  return (
    <Canvas3DErrorBoundary fallback={<PosterFallback onFailure={onFailure} />}>
      <ForgeStageInner onReady={onReady} />
    </Canvas3DErrorBoundary>
  );
}

export default ForgeStage;
