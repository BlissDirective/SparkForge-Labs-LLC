'use client';

// ════════════════════════════════════════════════════════════════
// useCeremonyCompute — WebGPU TSL Compute Dispatch (P5 §10.8 Sub 4)
// ════════════════════════════════════════════════════════════════
//
// Hook that creates and drives a CeremonyComputeSystem each frame
// when the Canvas renderer is WebGPU. Handles:
//   1. Lazy system creation on first `active` = true.
//   2. One-time init kernel dispatch (seeds particle buffers).
//   3. Per-frame step kernel dispatch for each archetype.
//   4. Uniform updates (elapsed, labColor, duration).
//   5. Graceful teardown when ceremony ends.
//   6. Automatic bypass on WebGL2 (returns null — caller uses CPU).
//
// Caller pattern:
//
//   const system = useCeremonyCompute({
//     active,
//     labColor,
//     duration,
//     elapsedRef,
//     archetypes: ['confetti', 'trophy'],
//   });
//   if (system) {
//     // Render GPU-driven InstancedMeshes using system.<archetype>.buffers
//   } else {
//     // Fallback to existing CPU physics useFrame loops
//   }
//
// Mythos ACT-halting note: when the renderer is WebGL2, the hook
// "halts early" — no system creation, no kernel compilation. Caller
// transparently falls through to the CPU path.
// ════════════════════════════════════════════════════════════════

import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  createCeremonyComputeSystem,
  updateCeremonyUniforms,
  type CeremonyArchetype,
  type CeremonyComputeSystem,
} from '@/lib/3d/ceremonyFXCompute';
import { isWebGPURenderer } from '@/lib/3d/webgpuRenderer';

export interface UseCeremonyComputeOptions {
  /** Ceremony is actively running — drives system lifecycle. */
  active: boolean;
  /** Lab color hex — passed to labColor uniform. */
  labColor: string;
  /** Ceremony duration in seconds. */
  duration: number;
  /** Elapsed-time ref updated by the parent. Read per frame. */
  elapsedRef: RefObject<number>;
  /** Which archetype kernels to dispatch. Others skipped. */
  archetypes: CeremonyArchetype[];
}

/** Minimal shape of a WebGPURenderer-like object with computeAsync. */
interface WebGPURendererLike {
  computeAsync: (kernel: unknown) => Promise<void>;
  isWebGPURenderer?: boolean;
}

/**
 * Create + drive a ceremony compute system keyed to the current
 * ceremony. Returns the system (or null when on WebGL2).
 */
export function useCeremonyCompute(opts: UseCeremonyComputeOptions): CeremonyComputeSystem | null {
  const { active, labColor, duration, elapsedRef, archetypes } = opts;
  const systemRef = useRef<CeremonyComputeSystem | null>(null);
  const initializedRef = useRef(false);

  const gl = useThree((s) => s.gl);
  const isGpu = isWebGPURenderer(gl);

  // ── Lifecycle: create system on active + WebGPU, dispose on !active ──
  useEffect(() => {
    if (!active || !isGpu) {
      if (systemRef.current) {
        systemRef.current.dispose();
        systemRef.current = null;
      }
      initializedRef.current = false;
      return;
    }
    // Lazy instantiate — deferred import keeps three/webgpu out of the
    // WebGL user path's bundle.
    if (!systemRef.current) {
      systemRef.current = createCeremonyComputeSystem(labColor);
      initializedRef.current = false;
    }
    // Capture ref for cleanup — ESLint exhaustive-deps guard
    const snapshot = systemRef.current;
    return () => {
      // Teardown happens on the next inactive/renderer-change cycle.
      // The system holds GPU buffers released by Three.js GC when refs
      // go out of scope. Explicit dispose() is idempotent.
      if (snapshot && snapshot !== systemRef.current) {
        snapshot.dispose();
      }
    };
  }, [active, isGpu, labColor]);

  // ── Per-frame kernel dispatch ──
  useFrame(() => {
    const system = systemRef.current;
    if (!system || !active || !isGpu) return;

    // Update uniforms once per frame
    const elapsed = elapsedRef.current;
    updateCeremonyUniforms(system.uniforms, elapsed, duration);

    const renderer = gl as unknown as WebGPURendererLike;

    // One-time init pass: seed per-particle positions / colors / rotations.
    if (!initializedRef.current) {
      for (const name of archetypes) {
        const slot = system[name];
        // computeAsync returns a promise — fire & forget; init is a
        // one-shot and any error surfaces via the renderer's error
        // handling (browser console).
        renderer.computeAsync?.(slot.kernels.init);
      }
      initializedRef.current = true;
    }

    // Per-frame step pass for each active archetype
    for (const name of archetypes) {
      const slot = system[name];
      renderer.computeAsync?.(slot.kernels.step);
    }
  });

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (systemRef.current) {
        systemRef.current.dispose();
        systemRef.current = null;
      }
    };
  }, []);

  return isGpu && active ? systemRef.current : null;
}
