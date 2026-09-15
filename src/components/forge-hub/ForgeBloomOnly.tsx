'use client';

// Bloom-only post for the hub (TAP v2.2 §2.10 / W1).
// WebGPU path reuses PostProcessingStackWebGPU with every non-bloom
// input zeroed. WebGL2 path mounts EffectComposer + Bloom only.
// D3D-5: performanceMode omits DoF/SSAO — already omitted here.
// pose=lock skips post so Inspector's still is the plate.

import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useThree } from '@react-three/fiber';
import { PostProcessingStackWebGPU } from '@/components/3d/PostProcessingStackWebGPU';
import { isWebGPURenderer } from '@/lib/3d/webgpuRenderer';
import { FORGE_HUB_BLOOM } from '@/config/forgeHub';
import { useDirectorClock } from '@/lib/forge-hub/useForgeDirector';
import { useForgeStore } from '@/stores/sceneStore';
import { useUIStore } from '@/stores/uiStore';

export function ForgeBloomOnly() {
  const gl = useThree((s) => s.gl);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const performanceMode = useUIStore((s) => s.performanceMode);
  const directorBloom = useDirectorClock().bloom;

  if (poseLock) return null;

  const intensity =
    (performanceMode
      ? FORGE_HUB_BLOOM.intensity * 0.7
      : FORGE_HUB_BLOOM.intensity) *
    (1 + directorBloom);


  if (isWebGPURenderer(gl)) {
    return (
      <PostProcessingStackWebGPU
        bloomIntensity={intensity}
        bloomThreshold={FORGE_HUB_BLOOM.threshold}
        bloomSmoothing={FORGE_HUB_BLOOM.smoothing}
        vignetteDarkness={0}
        vignetteOffset={0}
        chromaticOffset={0}
        ssaoIntensity={0}
        ssaoRadius={0}
        dofBokehScale={0}
        dofFocalLength={0}
        dofFocusDistance={0}
        noiseOpacity={0}
        barrelDistortion={0}
      />
    );
  }

  return (
    <EffectComposer>
      <Bloom
        intensity={intensity}
        luminanceThreshold={FORGE_HUB_BLOOM.threshold}
        luminanceSmoothing={FORGE_HUB_BLOOM.smoothing}
        mipmapBlur
      />
    </EffectComposer>
  );
}
