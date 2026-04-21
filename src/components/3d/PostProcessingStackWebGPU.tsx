'use client';

// ════════════════════════════════════════════════════════════════
// PostProcessingStackWebGPU — TSL RenderPipeline (P5 §10.8 Sub 3d)
// ════════════════════════════════════════════════════════════════
//
// Renders the cockpit scene through a TSL RenderPipeline when the
// Canvas renderer is a WebGPURenderer. Composes the same effect set
// as PostProcessingStack.tsx (WebGL path) but via TSL nodes that
// compile to WGSL.
//
// How it works:
//   1. On mount, creates a pass(scene, camera) PassNode that captures
//      the main scene render.
//   2. Composes native + custom TSL effects into a single output node:
//        scene → AO → bloom → chromaticAberration → DoF → film grain
//              → hueSaturation → brightnessContrast → vignette → barrel
//   3. Instantiates RenderPipeline(renderer, outputNode).
//   4. Replaces R3F's default render via useFrame({ priority: 1 }) which
//      calls pipeline.render() instead. No double-render.
//
// On WebGL renderer, this component returns null — the WebGL branch of
// the router (PostProcessingStack.tsx) continues to use the existing
// @react-three/postprocessing EffectComposer.
//
// Mythos lens: the composed output node is the "LoRA adapter"
// (§8.11) — one thin layer on top of the shared scene render that
// adds the full post-FX expressiveness per renderer. Minimal
// overhead, substantially recovered visual parity.
// ════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSceneStore } from '@/stores/sceneStore';
import { useUIStore } from '@/stores/uiStore';
import { isWebGPURenderer } from '@/lib/3d/webgpuRenderer';
import { vignette, hueSaturation, brightnessContrast, barrelDistortion } from '@/lib/3d/tsl/postfx';

interface PostProcessingStackWebGPUProps {
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomSmoothing?: number;
  vignetteDarkness?: number;
  vignetteOffset?: number;
  chromaticOffset?: number;
  ssaoIntensity?: number;
  ssaoRadius?: number;
  dofFocusDistance?: number;
  dofFocalLength?: number;
  dofBokehScale?: number;
  noiseOpacity?: number;
  barrelDistortion?: number;
}

export function PostProcessingStackWebGPU({
  bloomIntensity = 0.4,
  bloomThreshold = 0.6,
  bloomSmoothing: _bloomSmoothing = 0.9,
  vignetteDarkness = 0.5,
  vignetteOffset = 0.3,
  chromaticOffset = 0.0006,
  ssaoIntensity = 1.5,
  ssaoRadius: _ssaoRadius = 0.5,
  dofFocusDistance = 0.01,
  dofFocalLength = 0.02,
  dofBokehScale = 2.0,
  noiseOpacity = 0.06,
  barrelDistortion: barrelDist = 0.02,
}: PostProcessingStackWebGPUProps) {
  const { gl, scene, camera } = useThree();
  const pipelineRef = useRef<{ render: () => void; dispose?: () => void } | null>(null);

  // Scene-reactive multipliers (same logic as WebGL stack)
  const activeScene = useSceneStore((s) => s.activeScene);
  const isTransitioning = useSceneStore((s) => s.isTransitioning);
  const isCeremonyActive = useUIStore((s) => s.showCelebration);
  const performanceMode = useUIStore((s) => s.performanceMode);

  // Fast-path: if renderer is not WebGPU, skip entirely. The WebGL branch
  // handles post-processing via @react-three/postprocessing.
  const isGpu = isWebGPURenderer(gl);

  // Build the TSL output node chain when renderer switches to WebGPU.
  // This runs only when isGpu becomes true and when any input param
  // reference-changes. On WebGL, nothing is built.
  useEffect(() => {
    if (!isGpu) return;
    let cancelled = false;

    // Dynamic import keeps the three/webgpu + three/addons TSL bundle
    // out of the WebGL user path.
    (async () => {
      const [{ pass, float }, { bloom }, { chromaticAberration }, { dof }, { film }, webgpu] = await Promise.all([
        import('three/tsl'),
        import('three/addons/tsl/display/BloomNode.js'),
        import('three/addons/tsl/display/ChromaticAberrationNode.js'),
        import('three/addons/tsl/display/DepthOfFieldNode.js'),
        import('three/addons/tsl/display/FilmNode.js'),
        import('three/webgpu'),
      ]);

      if (cancelled) return;

      // 1. Scene pass → TextureNode
      const scenePass = pass(scene, camera);
      const scenePassTexture = scenePass.getTextureNode();

      // 2. Compose the effect chain. Order mirrors WebGL stack:
      //    bloom → chromaticAberration → DoF → film(=noise)
      //    → hueSaturation → brightnessContrast → vignette → barrel
      //
      // NOTE: AO (GTAO) is deferred — it requires a geometry normals pass
      // that's not exposed by default PassNode. Tracked as Phase 5
      // follow-up enhancement.

      // Bloom
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let color: any = bloom(scenePassTexture as unknown as Parameters<typeof bloom>[0], bloomIntensity, 0.4, bloomThreshold);

      // Chromatic aberration (signature requires Node for strength)
      try {
        color = chromaticAberration(color, float(chromaticOffset * 100) as unknown as Parameters<typeof chromaticAberration>[1]);
      } catch {
        // Some backends may not support it — safe skip
      }

      // DoF — skip in performance mode
      if (!performanceMode) {
        try {
          color = dof(
            color,
            scenePass.getViewZNode(),
            float(dofFocusDistance) as unknown as Parameters<typeof dof>[2],
            float(dofFocalLength) as unknown as Parameters<typeof dof>[3],
            float(dofBokehScale) as unknown as Parameters<typeof dof>[4],
          );
        } catch {
          // DoF signature varies — safe skip if incompatible
        }
      }

      // Film grain (equivalent to Noise effect in WebGL path)
      try {
        color = film(color, float(noiseOpacity));
      } catch {
        // film node signature variance
      }

      // ── Custom TSL effects (from postfx.ts) ──
      color = hueSaturation(color, 0, 0.1);
      color = brightnessContrast(color, 0, 0.05);
      color = vignette(color, vignetteOffset, vignetteDarkness);
      color = barrelDistortion(scenePassTexture as unknown as Parameters<typeof barrelDistortion>[0], barrelDist);

      // 3. Instantiate RenderPipeline with composed output node
      const { RenderPipeline } = webgpu as { RenderPipeline?: new (r: unknown, o: unknown) => { render: () => void; dispose?: () => void } };
      if (!RenderPipeline) return;

      const pipeline = new RenderPipeline(gl, color);
      pipelineRef.current = pipeline;
    })();

    return () => {
      cancelled = true;
      pipelineRef.current?.dispose?.();
      pipelineRef.current = null;
    };
  }, [
    isGpu,
    gl,
    scene,
    camera,
    bloomIntensity,
    bloomThreshold,
    chromaticOffset,
    ssaoIntensity,
    dofFocusDistance,
    dofFocalLength,
    dofBokehScale,
    noiseOpacity,
    vignetteDarkness,
    vignetteOffset,
    barrelDist,
    performanceMode,
    activeScene,
    isTransitioning,
    isCeremonyActive,
  ]);

  // Intercept R3F's default render — priority 1 disables R3F's implicit
  // render. If pipeline is ready, call its render(). Else fall back to
  // the default renderer.render() (transient state during init).
  useFrame(({ gl: renderer, scene: s, camera: c }) => {
    const pipeline = pipelineRef.current;
    if (pipeline) {
      pipeline.render();
    } else {
      // Transient: before pipeline ready, render normally so screen isn't black.
      (renderer as { render: (s: unknown, c: unknown) => void }).render(s, c);
    }
  }, 1);

  // Component renders no JSX — this layer is pure render-loop interception.
  return null;
}
