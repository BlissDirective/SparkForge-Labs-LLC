'use client';

// ================================================================
// SparkForge StationFrame — Cockpit Panoramic Architecture Orchestrator
// ================================================================
// CPA v1.0: Major rewrite from flat CSS border to curved panoramic cockpit.
//
// REPLACES: Part 3A CSS placeholder (Step 14) + Part 3B flat frame
// Decision 2.1: ALL dashboard pages
// Decision 2.4: Simplified 3D on mobile (all CPA components return null)
// Decision 2.5: Edge-to-edge, frame as border overlay
// Decision 3.4: Game mode dims/hides cockpit elements
// Decision 7.3: PBR desktop, CSS mobile
// CPA-1: CylinderGeometry panoramic wrap
// CPA-7: Mode-dependent bloom
// CPA-8: R3F Vignette replaces CSS on desktop
// CPA-9: Wider FOV (56°)
// CPA-10: Barrel distortion (0.02 strength)
// CPA-11: 3000 tri budget
//
// Architecture (revised):
// z-index 0: R3F Canvas (fixed position, full viewport)
//   - AdaptiveDpr, Environment (HDR)
//   - AuroraBackground (unchanged)
//   - AmbientParticles (unchanged)
//   - CockpitPanels (NEW — curved panels + hex sub-panels)
//   - LEDRim (modified — curved arc path)
//   - SidePanels (NEW — left radar + right terminal)
//   - HolographicHUD (NEW — concentric rings overlay)
//   - StatusBar3D (NEW — bottom gauge strip)
//   - EffectComposer
//     - Bloom (mode-dependent intensity)
//     - Vignette (NEW — replaces CSS on desktop)
//     - BarrelDistortion (NEW — subtle fisheye)
// z-index 5: CSS scanline overlay (unchanged)
// z-index 4: CSS vignette fallback (conditionally hidden on desktop)
// z-index 1: CSS station-frame-css (fallback, unchanged)
// z-index 2: CSS cockpit-side-indicator (NEW — mobile)
// z-index 2: CSS status-bar-mobile (NEW — mobile)

import { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AuroraBackground } from './AuroraBackground';
import { AmbientParticles } from './AmbientParticles';
import { LEDRim } from './LEDRim';
import { CockpitPanels } from './CockpitPanels';
import { HolographicHUD } from './HolographicHUD';
import { SidePanels } from './SidePanels';
import { StatusBar3D } from './StatusBar3D';
import { HDR_FALLBACK_PRESET } from '@/lib/3d/materials';
import type { SidePanelContent } from '@/lib/3d/cockpitConfig';

// BarrelDistortion is a custom postprocessing effect — import the wrapper
// We use a primitive approach since @react-three/postprocessing expects Effect instances
import { BarrelDistortion } from './BarrelDistortion';

interface StationFrameProps {
  mode?: string;
  ledColor?: string;
  bgIntensity?: number;
  particleCount?: number;
  particleSpeed?: number;
  frameGlow?: number;
  frameDimmed?: boolean;
  activeLabColor?: string;
  particleIntensity?: 'off' | 'low' | 'medium' | 'high';
  scanlineEnabled?: boolean;
  spikeEvent?: boolean;
  // CPA v1.0 props
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomSmoothing?: number;
  vignetteDarkness?: number;
  vignetteOffset?: number;
  cameraFov?: number;
  barrelDistortion?: number;
  hudOpacity?: number;
  hudRotationSpeed?: number;
  hudPulseIntensity?: number;
  sidePanelOpacity?: number;
  sidePanelLeftContent?: SidePanelContent;
  sidePanelRightContent?: SidePanelContent;
  statusBarOpacity?: number;
  panelCurvature?: number;
  panelOpacity?: number;
  // Data for StatusBar3D
  xp?: number;
  xpMax?: number;
  streak?: number;
  sessionTime?: number;
  labProgress?: { done: number; total: number };
}

// ■■ Camera FOV Controller — Smoothly interpolates FOV changes ■■
function CameraController({ targetFov }: { targetFov: number }) {
  const { camera } = useThree();

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - targetFov) > 0.01) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 0.05);
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

// ■■ BarrelDistortion wrapper for EffectComposer ■■
function BarrelDistortionPass({ strength }: { strength: number }) {
  const ref = useRef(null);
  return <BarrelDistortion ref={ref} strength={strength} />;
}

// ■■ Postprocessing Stack — isolates EffectComposer children typing ■■
function PostprocessingStack({
  bloomIntensity,
  bloomThreshold,
  bloomSmoothing,
  vignetteDarkness,
  vignetteOffset,
  barrelDistortion: barrelDist,
}: {
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  vignetteDarkness: number;
  vignetteOffset: number;
  barrelDistortion: number;
}) {
  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        mipmapBlur
      />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Vignette darkness={vignetteDarkness} offset={vignetteOffset} eskil={false} {...({} as any)} />
      {barrelDist > 0 ? <BarrelDistortionPass strength={barrelDist} /> : <></>}
    </EffectComposer>
  );
}

export function StationFrame({
  mode: _mode = 'dashboard',
  ledColor = '#00BBFF',
  bgIntensity = 0.15,
  frameGlow = 0.5,
  frameDimmed = false,
  activeLabColor = '#00BBFF',
  particleIntensity = 'medium',
  scanlineEnabled = true,
  spikeEvent = false,
  // CPA defaults
  bloomIntensity = 0.4,
  bloomThreshold = 0.6,
  bloomSmoothing = 0.9,
  vignetteDarkness = 0.5,
  vignetteOffset = 0.3,
  cameraFov = 56,
  barrelDistortion: barrelDist = 0.02,
  hudOpacity = 0.12,
  hudRotationSpeed = 0.1,
  hudPulseIntensity = 0.3,
  sidePanelOpacity = 0.6,
  sidePanelLeftContent = 'radar' as SidePanelContent,
  sidePanelRightContent = 'stats' as SidePanelContent,
  statusBarOpacity = 1.0,
  panelCurvature = 0.85,
  panelOpacity = 1.0,
  // Data defaults
  xp = 0,
  xpMax = 500,
  streak = 0,
  sessionTime = 0,
  labProgress = { done: 0, total: 5 },
}: StationFrameProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isWebGLAvailable, setWebGLAvailable] = useState(true);

  // Detect mobile and WebGL support
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebGLAvailable(false);
    } catch {
      setWebGLAvailable(false);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // CSS-only fallback for no WebGL
  if (!isWebGLAvailable) {
    return (
      <>
        <div
          className="station-frame-css"
          style={
            {
              '--glow-color': ledColor,
              opacity: frameDimmed ? 0.3 : 1,
            } as React.CSSProperties
          }
          aria-hidden="true"
        />
        {/* CPA: Mobile cockpit indicators */}
        <div className="cockpit-side-indicator left" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
        <div className="cockpit-side-indicator right" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
        <div className="status-bar-mobile" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
      </>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none ${!isMobile && isWebGLAvailable ? 'r3f-vignette-active' : ''}`}
      style={{ opacity: frameDimmed ? 0.4 : 1 }}
      aria-hidden="true"
    >
      <Canvas
        frameloop="demand"
        dpr={isMobile ? 1 : [1, 1.5]}
        camera={{ position: [0, 0, 5], fov: cameraFov }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Adaptive DPR for performance */}
          <AdaptiveDpr pixelated />

          {/* CPA: Camera FOV controller for smooth transitions */}
          <CameraController targetFov={cameraFov} />

          {/* Environment map for PBR reflections */}
          <Environment preset={HDR_FALLBACK_PRESET} />

          {/* Aurora background void (unchanged) */}
          <AuroraBackground
            intensity={bgIntensity}
            speed={1.0}
            color1={activeLabColor}
            color2="#8B5CF6"
            color3="#06B6D4"
          />

          {/* Ambient particles (unchanged) */}
          <AmbientParticles
            intensity={particleIntensity}
            color={activeLabColor}
            isMobile={isMobile}
          />

          {/* CPA: Cockpit Panels — curved panoramic wrap + hex sub-panels */}
          {!isMobile && (
            <CockpitPanels
              curvature={panelCurvature}
              opacity={panelOpacity}
              labColor={activeLabColor}
              frameDimmed={frameDimmed}
            />
          )}

          {/* LED status rim (CPA: curved arc) */}
          <LEDRim
            color={ledColor}
            intensity={frameGlow}
            spikeActive={spikeEvent}
            curved={!isMobile}
          />

          {/* CPA: Side Panels — left radar + right terminal */}
          {!isMobile && (
            <SidePanels
              leftContent={sidePanelLeftContent}
              rightContent={sidePanelRightContent}
              opacity={sidePanelOpacity}
              labColor={activeLabColor}
              dimmed={frameDimmed}
            />
          )}

          {/* CPA: Holographic HUD — concentric rings overlay */}
          {!isMobile && (
            <HolographicHUD
              opacity={hudOpacity}
              color={activeLabColor}
              rotationSpeed={hudRotationSpeed}
              pulseIntensity={hudPulseIntensity}
              active={hudOpacity > 0}
            />
          )}

          {/* CPA: Status Bar 3D — bottom gauge strip */}
          {!isMobile && (
            <StatusBar3D
              xp={xp}
              xpMax={xpMax}
              streak={streak}
              sessionTime={sessionTime}
              labProgress={labProgress}
              labColor={activeLabColor}
              opacity={statusBarOpacity}
            />
          )}

          {/* Postprocessing (desktop only) */}
          {!isMobile && (
            <PostprocessingStack
              bloomIntensity={bloomIntensity}
              bloomThreshold={bloomThreshold}
              bloomSmoothing={bloomSmoothing}
              vignetteDarkness={vignetteDarkness}
              vignetteOffset={vignetteOffset}
              barrelDistortion={barrelDist}
            />
          )}
        </Suspense>
      </Canvas>

      {/* CSS scanline overlay (Decision 2.3: toggleable) */}
      {scanlineEnabled && (
        <div
          className="scanline-overlay"
          style={{ opacity: 0.03 }}
          aria-hidden="true"
        />
      )}

      {/* CSS vignette corners — hidden on desktop when R3F vignette is active */}
      <div className="vignette-overlay" aria-hidden="true" />

      {/* CSS chrome bezel border (always present, PBR handles it on desktop) */}
      <div
        className="station-frame-css"
        style={
          {
            '--glow-color': ledColor,
            opacity: isMobile ? 1 : 0.3,
          } as React.CSSProperties
        }
        aria-hidden="true"
      />

      {/* CPA: Mobile cockpit indicators (CSS-only, zero WebGL) */}
      {isMobile && (
        <>
          <div className="cockpit-side-indicator left" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
          <div className="cockpit-side-indicator right" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
          <div className="status-bar-mobile" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
