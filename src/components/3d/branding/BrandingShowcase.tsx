'use client';

/**
 * BrandingShowcase — the canvas + capability-gate + lighting host for
 * any branding-surface render (live hero, dev showcase, offline render).
 *
 * Capability gate (CLAUDE.md v6.6 Tech Quality Mandate):
 *   - WebGPU available → render the live R3F + TSL canvas at full quality.
 *   - WebGPU absent     → render the thin MP4-poster fallback. The poster
 *                         is IMG_4607 itself; Phase 4 produces the looped
 *                         MP4 derived from this exact same shader.
 *
 * Lighting rig (E2 — palette-locked procedural HDRI):
 *   - drei <Environment> rendered once from <Lightformer> children placed
 *     per LIGHTING.{key,rim,fill}. No external HDRI bundle. Same palette
 *     anchors as the rest of the brand surface.
 *
 * Geometry: passed in as children, so the same showcase wraps any
 * branding subject (cube, sphere, SF mark, full SparkForge wordmark).
 */

import { Suspense, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { WebGPURenderer } from 'three/webgpu';
import { Color } from 'three';

import {
  SF_BRAND,
  PALETTE,
  LIGHTING,
  BACKGROUND,
} from '@/lib/branding/sf-material.config';

// ─────────────────────────────────────────────────────────────────────
// Capability detection — pure client-side
// ─────────────────────────────────────────────────────────────────────

type CapabilityState = 'pending' | 'webgpu' | 'fallback';

function useWebGPUCapability(): CapabilityState {
  const [state, setState] = useState<CapabilityState>('pending');

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      try {
        const gpu = (navigator as unknown as { gpu?: GPU }).gpu;
        if (!gpu) {
          if (!cancelled) setState('fallback');
          return;
        }
        const adapter = await gpu.requestAdapter();
        if (cancelled) return;
        setState(adapter ? 'webgpu' : 'fallback');
      } catch {
        if (!cancelled) setState('fallback');
      }
    }
    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// ─────────────────────────────────────────────────────────────────────
// Procedural HDRI — palette-locked Lightformer rig (E2)
// ─────────────────────────────────────────────────────────────────────

function BrandingEnvironment({
  showSceneBackground = true,
}: {
  /** Whether the env-map also sets the visible scene background. */
  showSceneBackground?: boolean;
}) {
  return (
    <Environment frames={1} resolution={SF_BRAND.HDRI.cubeSize}>
      {/* Background fill — deep navy void */}
      {showSceneBackground && (
        <color attach="background" args={[PALETTE.voidNavy]} />
      )}

      {/* Lower-left warm amber spot (the IMG_4607 key direction) */}
      <Lightformer
        form="circle"
        position={[-3.4, -2.1, 2.6]}
        scale={[3.0, 3.0, 1]}
        intensity={SF_BRAND.HDRI.amberSpotIntensity}
        color={PALETTE.keyAmber}
      />

      {/* Upper-right cool cyan halo */}
      <Lightformer
        form="circle"
        position={[3.6, 2.4, 1.8]}
        scale={[2.4, 2.4, 1]}
        intensity={SF_BRAND.HDRI.cyanSpotIntensity}
        color={PALETTE.rimCyan}
      />

      {/* Wide ambient navy lift — keeps shadows from crushing */}
      <Lightformer
        form="rect"
        position={[0, 0, -4]}
        scale={[12, 8, 1]}
        intensity={0.45}
        color={PALETTE.voidNavyLift}
      />

      {/* Subtle magenta accent — extends the dichroic palette into env */}
      <Lightformer
        form="circle"
        position={[2.0, -2.6, 1.5]}
        scale={[1.4, 1.4, 1]}
        intensity={0.6}
        color={PALETTE.dispersionMag}
      />
    </Environment>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Three-light rig from LIGHTING config
// ─────────────────────────────────────────────────────────────────────

function BrandingLights() {
  return (
    <>
      <pointLight
        position={LIGHTING.key.position as unknown as [number, number, number]}
        color={LIGHTING.key.color}
        intensity={LIGHTING.key.intensity}
        distance={12}
        decay={1.4}
      />
      <pointLight
        position={LIGHTING.rim.position as unknown as [number, number, number]}
        color={LIGHTING.rim.color}
        intensity={LIGHTING.rim.intensity}
        distance={12}
        decay={1.4}
      />
      <pointLight
        position={LIGHTING.fill.position as unknown as [number, number, number]}
        color={LIGHTING.fill.color}
        intensity={LIGHTING.fill.intensity}
        distance={20}
        decay={1.0}
      />
      {/* Faint global ambient — prevents pure black in occluded cavities */}
      <ambientLight intensity={0.08} color={PALETTE.voidNavyLift} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Fallback element — MP4-poster for non-WebGPU devices
// ─────────────────────────────────────────────────────────────────────

interface FallbackProps {
  posterSrc: string;
  videoSrc?: string;
  alt: string;
}

function BrandingFallback({ posterSrc, videoSrc, alt }: FallbackProps) {
  // If a Phase-4 MP4 is provided, autoplay it muted & looped.
  // Otherwise we render the poster image as-is — IMG_4607 itself.
  if (videoSrc) {
    return (
      <video
        className="w-full h-full object-contain"
        poster={posterSrc}
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        aria-label={alt}
      />
    );
  }
  return (
    <Image
      className="w-full h-full object-contain"
      src={posterSrc}
      alt={alt}
      fill
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// <BrandingShowcase> — public component
// ─────────────────────────────────────────────────────────────────────

export interface BrandingShowcaseProps {
  /** The geometry to apply BrandingMaterial to. Use <BrandingMesh>. */
  children: React.ReactNode;
  /** Camera distance from origin. */
  cameraDistance?: number;
  /** Enable orbit controls (dev showcase only). */
  enableControls?: boolean;
  /** Vignette opacity overlay (0..1). Default from BACKGROUND.vignetteStrength. */
  vignetteStrength?: number;
  /**
   * MP4 fallback for non-WebGPU devices. Defaults to the Phase-4
   * `brand-fallback.mp4` loop (slow rotation of SF mark, 2s @ 30fps).
   * Pass an empty string to disable the video fallback entirely (poster only).
   */
  fallbackVideoSrc?: string;
  /** Poster fallback. Defaults to IMG_4607.png. */
  fallbackPosterSrc?: string;
  /** Aria label for the canvas. */
  ariaLabel?: string;
  /**
   * Render with a transparent background (alpha=true on the WebGPU canvas,
   * scene.background=null, no vignette overlay). Used by the offline
   * render route (Phase 4) to produce composable 4K PNGs.
   */
  transparent?: boolean;
}

export function BrandingShowcase({
  children,
  cameraDistance = 5,
  enableControls = false,
  vignetteStrength = BACKGROUND.vignetteStrength,
  fallbackVideoSrc = '/branding/brand-fallback.mp4',
  fallbackPosterSrc = '/branding/IMG_4607.png',
  ariaLabel = 'SparkForge branding canvas',
  transparent = false,
}: BrandingShowcaseProps) {
  const capability = useWebGPUCapability();

  const sceneBg = useMemo(
    () => (transparent ? null : new Color(PALETTE.voidNavy)),
    [transparent],
  );

  if (capability === 'pending') {
    // SSR-safe + first paint: poster only. Swap in <Canvas> once detected.
    return (
      <div className="relative w-full h-full bg-[#02050d]">
        <BrandingFallback
          posterSrc={fallbackPosterSrc}
          alt={ariaLabel}
        />
      </div>
    );
  }

  if (capability === 'fallback') {
    return (
      <div className="relative w-full h-full bg-[#02050d]">
        <BrandingFallback
          posterSrc={fallbackPosterSrc}
          videoSrc={fallbackVideoSrc}
          alt={ariaLabel}
        />
        {/* Vignette overlay for poster path */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignetteStrength}) 100%)`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full ${transparent ? '' : 'bg-[#02050d]'}`}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ position: [0, 0, cameraDistance], fov: 32 }}
        scene={{ background: sceneBg }}
        gl={async (props) => {
          const renderer = new WebGPURenderer({
            // R3F passes canvas + antialias prefs in props
            ...(props as Record<string, unknown>),
            antialias: true,
            alpha: transparent,
          });
          await renderer.init();
          return renderer as unknown as never;
        }}
        aria-label={ariaLabel}
      >
        <Suspense fallback={null}>
          <BrandingEnvironment showSceneBackground={!transparent} />
          <BrandingLights />
          {children}
          {enableControls && <OrbitControls makeDefault enableDamping />}
        </Suspense>
      </Canvas>
      {/* Vignette overlay — DOM, not 3D, so it survives canvas swaps.
          Skipped in transparent mode so offline PNGs composite cleanly. */}
      {!transparent && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignetteStrength}) 100%)`,
          }}
        />
      )}
    </div>
  );
}
