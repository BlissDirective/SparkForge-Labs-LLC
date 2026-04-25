'use client';

// ════════════════════════════════════════════════════════════════
// useHeroCompute — WebGPU Hero Particle Compute Dispatch (Sub 8)
// ════════════════════════════════════════════════════════════════
//
// Companion hook to useCeremonyCompute. Activates the dormant
// hero-animation TSL compute kernels defined in
// `src/lib/3d/heroParticleCompute.ts`.
//
// Before §10.8, these kernels compiled but never ran because
// CockpitCanvas only had a WebGLRenderer. With the Sub 2 renderer
// migration + this hook, HeroAnimation can now dispatch real GPU
// compute for the 8-phase hero sequence.
//
// HeroAnimation.tsx is not yet wired to call this hook — adoption
// is a follow-up. The hook lives here so the integration point is
// discoverable and identical in shape to `useCeremonyCompute`.
//
// Mythos lens: this closes the "LTI stability" gap the original §10.8
// feasibility doc called out — infrastructure that existed but whose
// spectral radius was > 1 because the renderer half of the system
// was missing. Both halves now coexist.
// ════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { createParticleSystem, type HeroParticleSystem } from '@/lib/3d/heroParticleCompute';
import { isWebGPURenderer } from '@/lib/3d/webgpuRenderer';
import { useDeviceStore } from '@/stores/deviceStore';

export interface UseHeroComputeOptions {
  /** Hero animation is active — drives lifecycle. */
  active: boolean;
  /** Current hero phase (0-7). Passed to uniforms.phase each frame. */
  phase: number;
}

interface WebGPURendererLike {
  computeAsync: (kernel: unknown) => Promise<void>;
  isWebGPURenderer?: boolean;
}

export function useHeroCompute({ active, phase }: UseHeroComputeOptions): HeroParticleSystem | null {
  const systemRef = useRef<HeroParticleSystem | null>(null);
  const gl = useThree((s) => s.gl);
  const gpuTier = useDeviceStore((s) => s.gpuTier);
  const stripeCount = useDeviceStore((s) => s.stripeCount);
  const isGpu = isWebGPURenderer(gl);

  // Instantiate on active + WebGPU
  useEffect(() => {
    if (!active || !isGpu) {
      if (systemRef.current) {
        systemRef.current.dispose();
        systemRef.current = null;
      }
      return;
    }
    if (!systemRef.current) {
      systemRef.current = createParticleSystem(stripeCount || 1, gpuTier);
    }
  }, [active, isGpu, gpuTier, stripeCount]);

  // Per-frame dispatch
  useFrame((_, dt) => {
    const system = systemRef.current;
    if (!system || !active || !isGpu) return;
    system.update(phase, dt);
    const renderer = gl as unknown as WebGPURendererLike;
    // One kernel per stripe per frame
    for (let i = 0; i < system.stripes.length; i++) {
      renderer.computeAsync?.(system.computeKernel);
    }
  });

  useEffect(() => {
    return () => {
      systemRef.current?.dispose();
      systemRef.current = null;
    };
  }, []);

  return isGpu && active ? systemRef.current : null;
}
