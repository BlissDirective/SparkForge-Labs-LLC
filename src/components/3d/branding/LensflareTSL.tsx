'use client';

/**
 * LensflareTSL — Custom TSL anamorphic lensflare shader
 *
 * Authority:
 *   - Visual target: public/branding/IMG_4607.png (the two visible flares —
 *     amber lower-left, cyan upper-right)
 *   - Source of truth: src/lib/branding/sf-material.config.ts → LENS_FLARES
 *   - Mandate: CLAUDE.md v6.6 "Tech Quality Mandate" — WebGPU + TSL only
 *   - Decision N3 lensflare = c (custom TSL — `@react-three/lensflare-effect`
 *     does not exist on npm; postprocessing's lens-flare doesn't honour our
 *     anamorphic streak shape)
 *
 * Architecture: two billboard meshes per flare instance
 *   1. Hot core — small square plane, radial falloff, multiplied by color
 *   2. Anamorphic streak — wide thin plane rotated to streakAngle, with
 *      strong horizontal gradient + chromatic tint at the tips
 *
 * Both use MeshBasicNodeMaterial + AdditiveBlending so flares stack on top
 * of the scene without darkening.
 *
 * Animation hooks (Phase 5b/c per Storyboard.md):
 *   - intensityMul: 0 → 1.4 → 1.0 (Beat 2 ignition); → 2.2 → 1.0 (Beat 4
 *     detonation); → 2.0 → 1.0 (Beat 6 dichroic bloom — user pick Q5)
 *   - coreScale: 0 → 1.0 → 1.0 (Beat 2); → 1.4 → 1.0 (Beat 6)
 *   - streakScale: 0 → 1.4 → 1.2 (Beat 2); → 1.7 → 1.2 (Beat 6)
 */

import React, { useMemo, useEffect } from 'react';
import { Color, AdditiveBlending } from 'three';
import { Billboard } from '@react-three/drei';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  Fn,
  vec3,
  vec4,
  float,
  uniform,
  uv,
  length,
  oneMinus,
  pow,
  smoothstep,
  mix,
  abs,
  sub,
} from 'three/tsl';

type UniformNode = ReturnType<typeof uniform>;

import { LENS_FLARES, PALETTE } from '@/lib/branding/sf-material.config';

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export interface LensflareConfig {
  id: string;
  position: readonly [number, number, number];
  /** Hot-core color — also tints the streak center. */
  color: string;
  /** Base intensity multiplier (sf-material.config defaults: 1.8 amber, 1.2 cyan). */
  intensity: number;
  /** Streak rotation in radians (0 = horizontal). */
  streakAngle: number;
  /** Streak length in world units. */
  streakLength: number;
  /** Streak width in world units (thin — anamorphic). */
  streakWidth: number;
}

export interface LensflareTSLProps {
  /**
   * Either an index into SF_BRAND.LENS_FLARES (0 = amber lower-left,
   * 1 = cyan upper-right) or a fully custom flare config.
   */
  flare?: number | LensflareConfig;

  /**
   * Live multiplier on the flare's base intensity. Phase 5b animates this
   * 0 → 1.4 → 1.0 during ignition (Beat 2), spikes to 2.2 at detonation
   * (Beat 4), peaks at 2.0 during the dichroic bloom (Beat 6).
   * Default 1.0.
   */
  intensityMul?: number;

  /**
   * Live multiplier on the hot-core size. Phase 5b animates 0 → 1.0 during
   * ignition (Beat 2). Default 1.0.
   */
  coreScale?: number;

  /**
   * Live multiplier on the streak length. Phase 5b animates 0 → 1.4 during
   * ignition. Default 1.0.
   */
  streakScale?: number;
}

// ─────────────────────────────────────────────────────────────────────
// Resolve flare config
// ─────────────────────────────────────────────────────────────────────

function resolveFlare(flare: LensflareTSLProps['flare']): LensflareConfig {
  if (typeof flare === 'number') {
    const cfg = LENS_FLARES[flare];
    if (!cfg) {
      throw new Error(
        `LensflareTSL: invalid flare index ${flare}. ` +
          `LENS_FLARES has ${LENS_FLARES.length} entries.`,
      );
    }
    return { ...cfg };
  }
  if (flare) return flare;
  // Default: the amber lower-left flare (index 0)
  return { ...LENS_FLARES[0] };
}

// ─────────────────────────────────────────────────────────────────────
// Hot-core material — small square plane with radial falloff
// ─────────────────────────────────────────────────────────────────────

interface CoreUniforms {
  uColor: UniformNode;
  uIntensity: UniformNode;
}

function createHotCoreMaterial(
  color: Color,
  initialIntensity: number,
): { material: MeshBasicNodeMaterial; uniforms: CoreUniforms } {
  const m = new MeshBasicNodeMaterial();
  m.transparent = true;
  m.depthWrite = false;
  m.blending = AdditiveBlending;
  m.toneMapped = false;
  m.name = 'LensflareTSL.HotCore';

  const uColor = uniform(color);
  const uIntensity = uniform(initialIntensity);

  const colorNode = Fn(() => {
    // UV from 0..1 → centered −1..1
    const centered = uv().sub(vec3(0.5, 0.5, 0)).mul(2.0);
    const r = length(centered);
    // Soft radial falloff — sharp center, smooth fade to 0 at r=1
    const core = pow(oneMinus(smoothstep(float(0.0), float(1.0), r)), float(2.4));
    // Inner hot point: extra brightness at the very center (r < 0.15)
    const hotPoint = oneMinus(smoothstep(float(0.0), float(0.15), r)).mul(0.6);
    const total = core.add(hotPoint).mul(uIntensity);
    // Slight white-shift at hottest: blend color toward `hotWhite` near center
    const tinted = mix(uColor, vec3(1.0, 1.0, 1.0), hotPoint.mul(0.55));
    return vec4(tinted.mul(total), total);
  });

  m.colorNode = colorNode();

  return { material: m, uniforms: { uColor, uIntensity } };
}

// ─────────────────────────────────────────────────────────────────────
// Anamorphic streak material — wide thin plane with horizontal gradient
// ─────────────────────────────────────────────────────────────────────

interface StreakUniforms {
  uColor: UniformNode;
  uIntensity: UniformNode;
}

function createStreakMaterial(
  color: Color,
  initialIntensity: number,
): { material: MeshBasicNodeMaterial; uniforms: StreakUniforms } {
  const m = new MeshBasicNodeMaterial();
  m.transparent = true;
  m.depthWrite = false;
  m.blending = AdditiveBlending;
  m.toneMapped = false;
  m.name = 'LensflareTSL.Streak';

  const uColor = uniform(color);
  const uIntensity = uniform(initialIntensity);

  const colorNode = Fn(() => {
    // UV: x = 0..1 along streak length; y = 0..1 across streak width.
    // Convert to centered −1..1 for symmetric falloff.
    const centered = uv().sub(vec3(0.5, 0.5, 0)).mul(2.0);
    const x = centered.x;
    const y = centered.y;

    // Horizontal gradient: bright at center, fade toward tips
    // Use smoothstep for clean tip-fade — no harsh cutoff
    const horiz = oneMinus(smoothstep(float(0.0), float(1.0), abs(x)));
    // Anamorphic vertical falloff: very tight (thin streak)
    const vert = oneMinus(smoothstep(float(0.0), float(0.6), abs(y)));
    // Combine — vertical narrowing dominates the shape
    const baseAlpha = horiz.mul(pow(vert, float(1.8)));

    // Chromatic tint at tips: shift toward magenta on +x, cyan on −x.
    // This gives the lens-flare its "cinematic" rainbow streak edge.
    const magentaTint = vec3(1.0, 0.4, 0.8);
    const cyanTint = vec3(0.5, 0.95, 1.0);
    const tipBlend = abs(x); // 0 at center, 1 at tips
    const tipColor = mix(magentaTint, cyanTint, sub(float(0.5), x.mul(0.5)));
    const tinted = mix(uColor, tipColor, tipBlend.mul(0.4));

    const total = baseAlpha.mul(uIntensity);
    return vec4(tinted.mul(total), total);
  });

  m.colorNode = colorNode();

  return { material: m, uniforms: { uColor, uIntensity } };
}

// ─────────────────────────────────────────────────────────────────────
// LensflareTSL component
// ─────────────────────────────────────────────────────────────────────

export function LensflareTSL({
  flare,
  intensityMul = 1.0,
  coreScale = 1.0,
  streakScale = 1.0,
}: LensflareTSLProps): React.ReactElement {
  const cfg = useMemo(() => resolveFlare(flare), [flare]);

  // Both materials get fresh instances per LensflareTSL mount — TSL node
  // materials hold per-instance GPU pipelines and uniform isolation.
  const core = useMemo(() => {
    return createHotCoreMaterial(new Color(cfg.color), cfg.intensity);
  }, [cfg.color, cfg.intensity]);

  const streak = useMemo(() => {
    return createStreakMaterial(new Color(cfg.color), cfg.intensity);
  }, [cfg.color, cfg.intensity]);

  // Live-update intensity uniforms when intensityMul changes (avoids
  // material rebuild on every animation frame).
  useEffect(() => {
    core.uniforms.uIntensity.value = cfg.intensity * intensityMul;
    streak.uniforms.uIntensity.value = cfg.intensity * intensityMul;
  }, [cfg.intensity, intensityMul, core.uniforms, streak.uniforms]);

  // Dispose materials on unmount — TSL node materials hold per-instance
  // GPU pipelines that may still be compiling/in-flight when this cleanup
  // runs. Audit P2/D: dispose synchronously inline can race with the
  // renderer's compileAsync queue during a Suspense re-render, leaking
  // pipelines or warning about disposed resources still in the queue.
  // Defer to the next animation frame (or microtask in non-DOM tests)
  // so the current render loop's frame finishes before we tear them
  // down. Materials are still released in the same tick they would
  // have been; the only difference is one frame of latency, after which
  // they're no longer in the scene anyway.
  useEffect(() => {
    const c = core.material;
    const s = streak.material;
    return () => {
      const disposeNow = () => {
        c.dispose();
        s.dispose();
      };
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(disposeNow);
      } else {
        // SSR / test fallback — fire on next microtask.
        Promise.resolve().then(disposeNow);
      }
    };
  }, [core.material, streak.material]);

  // Base sizes — small core, wide thin streak. coreScale / streakScale
  // are applied as mesh-level scales so the geometry itself stays
  // shared across instances.
  const CORE_SIZE = 0.6; // billboard plane in world units
  const baseStreakLength = cfg.streakLength;
  const baseStreakWidth = cfg.streakWidth;

  return (
    <group position={cfg.position} renderOrder={999}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Hot core — radial falloff plane */}
        <mesh material={core.material} scale={coreScale}>
          <planeGeometry args={[CORE_SIZE, CORE_SIZE]} />
        </mesh>
        {/* Anamorphic streak — wide thin plane, rotated to streakAngle */}
        <mesh
          material={streak.material}
          rotation={[0, 0, cfg.streakAngle]}
          scale={[streakScale, 1, 1]}
        >
          <planeGeometry args={[baseStreakLength * 2.0, baseStreakWidth * 2.0]} />
        </mesh>
      </Billboard>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Re-exports
// ─────────────────────────────────────────────────────────────────────

export { LENS_FLARES, PALETTE };
