'use client';

// ================================================================
// SparkForge StationFrame — Persistent Laboratory Control Station
// ================================================================
// REPLACES: Part 3A CSS placeholder (Step 14)
// Decision 2.1: ALL dashboard pages
// Decision 2.4: Simplified 3D on mobile
// Decision 2.5: Edge-to-edge, frame as border
// Decision 7.3: PBR desktop, CSS mobile
//
// Architecture:
// z-index 0: R3F Canvas (fixed position, full viewport)
//   - Aurora background shader (distant, behind frame)
//   - Ambient particles (mid-depth, around frame)
//   - Chrome bezel frame geometry (foreground)
//   - LED rim emissive mesh (on frame)
// z-index 10: HTML content layer (positioned above)

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AuroraBackground } from './AuroraBackground';
import { AmbientParticles } from './AmbientParticles';
import { LEDRim } from './LEDRim';
import { HDR_FALLBACK_PRESET } from '@/lib/3d/materials';

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
    );
  }

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: frameDimmed ? 0.4 : 1 }}
      aria-hidden="true"
    >
      <Canvas
        frameloop="demand"
        dpr={isMobile ? 1 : [1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
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

          {/* Environment map for PBR reflections */}
          <Environment preset={HDR_FALLBACK_PRESET} />

          {/* Aurora background void */}
          <AuroraBackground
            intensity={bgIntensity}
            speed={1.0}
            color1={activeLabColor}
            color2="#8B5CF6"
            color3="#06B6D4"
          />

          {/* Ambient particles */}
          <AmbientParticles
            intensity={particleIntensity}
            color={activeLabColor}
            isMobile={isMobile}
          />

          {/* LED status rim */}
          <LEDRim
            color={ledColor}
            intensity={frameGlow}
            spikeActive={spikeEvent}
          />

          {/* Bloom post-processing (desktop only) */}
          {!isMobile && (
            <EffectComposer>
              <Bloom
                intensity={0.4}
                luminanceThreshold={0.6}
                luminanceSmoothing={0.9}
                mipmapBlur
              />
            </EffectComposer>
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

      {/* CSS vignette corners */}
      <div className="vignette-overlay" aria-hidden="true" />

      {/* CSS chrome bezel border (always present, PBR replaced on desktop) */}
      <div
        className="station-frame-css"
        style={
          {
            '--glow-color': ledColor,
            opacity: isMobile ? 1 : 0.3, // Subtle on desktop (PBR handles it)
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
    </div>
  );
}
