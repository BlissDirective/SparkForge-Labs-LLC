'use client';

// ================================================================
// CockpitCanvas — Unified Single R3F Canvas (CPA2-1)
// ================================================================
// CRITICAL ARCHITECTURE FIX: Replaces triple-Canvas anti-pattern.
//
// Previously, StationFrame, SpatialDashboard, and HeroAnimation
// each created their own <Canvas>, causing 2-3 simultaneous WebGL
// contexts with doubled GPU overhead.
//
// This component provides a SINGLE persistent R3F Canvas for the
// entire app lifecycle. Scene groups toggle visibility based on
// application state:
//
//   Hero Scene Group    — visible during 8-phase hero animation
//   Station Shell Group — visible post-hero (cockpit panels, HUD, etc.)
//   Spatial Content Group — visible on dashboard routes
//
// CPA2-1: Single Canvas decision lock
// CPA2-3: Seamless hero-to-cockpit handoff (zero Canvas swap)
// FIX-DUAL-CANVAS v3: Games keep their own Canvas; CockpitCanvas
//   unmounts R3F when gameActive=true (existing pattern preserved)

import { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, AdaptiveDpr, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
// 3D Components — Station Shell
import { AuroraBackground } from './AuroraBackground';
import { AmbientParticles } from './AmbientParticles';
import { CockpitPanels } from './CockpitPanels';
import { LEDRim } from './LEDRim';
import { SidePanels } from './SidePanels';
import { HolographicHUD } from './HolographicHUD';
import { StatusBar3D } from './StatusBar3D';
import { BarrelDistortion } from './BarrelDistortion';

// 3D Components — Spatial Dashboard
import { HolographicLabMap } from './HolographicLabMap';
import { CinematicCamera } from './CinematicCamera';
import { DynamicEnvironment } from './DynamicEnvironment';
import { InteractiveConsole3D, CONSOLE_POSITIONS } from './InteractiveConsole3D';
import { AmbientNPCs } from './AmbientNPCs';

// Camera System
import { CameraSystem, type CameraMode } from './CameraSystem';

// Stores
import { useUIStore } from '@/stores/uiStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useCockpitStore, LAB_POSITIONS, type ConsoleType } from '@/stores/cockpitStore';
import { useChildStore } from '@/stores/childStore';
import { HDR_FALLBACK_PRESET } from '@/lib/3d/materials';
import type { SidePanelContent, StationModeKey } from '@/lib/3d/cockpitConfig';

// ── Props ────────────────────────────────────────────────────────

interface CockpitCanvasProps {
  /** Station mode controls bloom, vignette, camera, panels */
  mode?: StationModeKey;
  ledColor?: string;
  bgIntensity?: number;
  activeLabColor?: string;
  particleIntensity?: 'off' | 'low' | 'medium' | 'high';
  scanlineEnabled?: boolean;
  spikeEvent?: boolean;
  frameDimmed?: boolean;

  // CPA preset overrides
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

  // Spatial dashboard
  labCompletions?: Record<number, number>;
  onLabEnter?: (labId: number) => void;
  showSpatialDashboard?: boolean;

  // Hero animation
  heroSceneContent?: React.ReactNode;
}

// ── Postprocessing Stack ─────────────────────────────────────────

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
  const barrelRef = useRef(null);
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
      <BarrelDistortion ref={barrelRef} strength={barrelDist} />
    </EffectComposer>
  );
}

// ── Spatial Dashboard Scene Content ──────────────────────────────

function SpatialDashboardContent({
  labCompletions = {},
  onLabEnter,
}: {
  labCompletions: Record<number, number>;
  onLabEnter?: (labId: number) => void;
}) {
  const {
    focusedLabId,
    hoveredLabId,
    cameraTarget,
    orbitSpeed,
    npcsVisible,
    activeConsole,
    focusLab,
    setHoveredLab,
    openConsole,
    closeConsole,
  } = useCockpitStore();

  const child = useChildStore((s) => s.activeChild);
  const badges = useChildStore((s) => s.badges);
  const profile = useDeviceStore((s) => s.profile);

  const consoleData = useMemo(
    () => ({
      xp: child?.xp ?? 0,
      xpMax: 500,
      level: child?.level ?? 1,
      levelTitle: child?.level_title ?? 'Spark Starter',
      streak: child?.streak_count ?? 0,
      badgeCount: badges.length,
      recentBadge: badges[badges.length - 1]?.badge?.name,
      labsCompleted: Object.values(labCompletions).filter((v) => v >= 1).length,
      totalLabs: 10,
    }),
    [child, badges, labCompletions]
  );

  const focusedLabPos = focusedLabId ? LAB_POSITIONS[focusedLabId] || null : null;

  const handleConsoleClick = (type: ConsoleType) => {
    if (activeConsole === type) {
      closeConsole();
    } else {
      openConsole(type);
    }
  };

  return (
    <>
      {/* Cinematic camera for spatial navigation */}
      <CinematicCamera
        target={cameraTarget}
        damping={0.04}
        enableOrbitDrift={focusedLabId === null}
      />

      {/* Starfield */}
      <Stars
        radius={50}
        depth={30}
        count={profile.lodBias === 'high' || profile.lodBias === 'ultra' ? 2000 : 800}
        factor={3}
        saturation={0.2}
        fade
        speed={0.5}
      />

      {/* Dynamic environment */}
      <DynamicEnvironment activeLabId={focusedLabId} intensity={0.6} />

      {/* Holographic Lab Map */}
      <HolographicLabMap
        focusedLabId={focusedLabId}
        hoveredLabId={hoveredLabId}
        labCompletions={labCompletions}
        orbitSpeed={orbitSpeed}
        onLabClick={(labId) => focusLab(labId)}
        onLabHover={(labId) => setHoveredLab(labId)}
        onLabDoubleClick={(labId) => onLabEnter?.(labId)}
      />

      {/* Interactive consoles */}
      {(['xp', 'badges', 'streak', 'progress'] as const).map((variant) => {
        const config = CONSOLE_POSITIONS[variant];
        return (
          <InteractiveConsole3D
            key={variant}
            variant={variant}
            position={config.position}
            rotation={config.rotation}
            data={consoleData}
            isActive={activeConsole === variant}
            onClick={() => handleConsoleClick(variant)}
          />
        );
      })}

      {/* Ambient NPCs */}
      <AmbientNPCs visible={npcsVisible} focusedLabPosition={focusedLabPos} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// CockpitCanvas — Main Export
// ════════════════════════════════════════════════════════════════

export function CockpitCanvas({
  mode: _mode = 'dashboard',
  ledColor = '#00BBFF',
  bgIntensity = 0.15,
  activeLabColor = '#00BBFF',
  particleIntensity = 'medium',
  scanlineEnabled = true,
  spikeEvent = false,
  frameDimmed = false,
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
  xp = 0,
  xpMax = 500,
  streak = 0,
  sessionTime = 0,
  labProgress = { done: 0, total: 5 },
  labCompletions = {},
  onLabEnter,
  showSpatialDashboard = false,
  heroSceneContent,
}: CockpitCanvasProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isWebGLAvailable, setWebGLAvailable] = useState(true);

  const profile = useDeviceStore((s) => s.profile);
  const gameActive = useUIStore((s) => s.gameActive);
  const heroPhase = useCockpitStore((s) => s.heroPhase);

  const isGameMode = _mode === 'game' || gameActive;
  const isHeroActive = heroPhase === 'animating' || heroPhase === 'materializing';
  const heroComplete = heroPhase === 'complete' || heroPhase === 'idle';

  // Determine camera mode
  const cameraMode: CameraMode = isHeroActive ? 'hero'
    : isGameMode ? 'game'
    : showSpatialDashboard ? 'spatial'
    : 'station';

  // Detect mobile and WebGL
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebGLAvailable(false);
    } catch {
      setWebGLAvailable(false);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── CSS-only fallbacks ──

  if (!isWebGLAvailable || isMobile) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div
          className="station-frame-css"
          style={{ '--glow-color': ledColor, opacity: frameDimmed ? 0.3 : 1 } as React.CSSProperties}
          aria-hidden="true"
        />
        <div className="cockpit-side-indicator left" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
        <div className="cockpit-side-indicator right" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
        <div className="status-bar-mobile" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
        {scanlineEnabled && <div className="scanline-overlay" style={{ opacity: 0.03 }} aria-hidden="true" />}
        <div className="vignette-overlay" aria-hidden="true" />
      </div>
    );
  }

  // ── Game mode: unmount R3F Canvas, keep CSS frame (FIX-DUAL-CANVAS) ──
  if (isGameMode && !isHeroActive) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        {scanlineEnabled && <div className="scanline-overlay" style={{ opacity: 0.03 }} aria-hidden="true" />}
        <div className="vignette-overlay" aria-hidden="true" />
        <div
          className="station-frame-css"
          style={{ '--glow-color': ledColor, opacity: 0.3 } as React.CSSProperties}
          aria-hidden="true"
        />
        <div className="cockpit-side-indicator left" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
        <div className="cockpit-side-indicator right" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
        <div className="status-bar-mobile" style={{ '--glow-color': ledColor } as React.CSSProperties} aria-hidden="true" />
      </div>
    );
  }

  // ── Single Persistent R3F Canvas (CPA2-1) ──
  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none ${isWebGLAvailable ? 'r3f-vignette-active' : ''}`}
      style={{ opacity: frameDimmed ? 0.4 : 1 }}
      aria-hidden="true"
    >
      <Canvas
        frameloop="always"
        dpr={[1, profile.pixelRatio]}
        camera={{
          position: [0, 6.5, 7],
          fov: 58,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: profile.antialias,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Adaptive DPR */}
          <AdaptiveDpr pixelated />

          {/* Unified Camera System */}
          <CameraSystem
            mode={cameraMode}
            stationFov={cameraFov}
            spatialDamping={0.04}
            enableOrbitDrift
          />

          {/* HDR Environment */}
          <Environment preset={HDR_FALLBACK_PRESET} />

          {/* ═══ Hero Scene Group (CPA2-3) ═══ */}
          {isHeroActive && heroSceneContent && (
            <group>
              {heroSceneContent}
            </group>
          )}

          {/* ═══ Station Shell Group ═══ */}
          {/* Visible when hero is complete and not in full spatial mode */}
          <group visible={heroComplete && !showSpatialDashboard}>
            {/* Aurora background */}
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
              isMobile={false}
            />

            {/* Cockpit Panels */}
            <CockpitPanels
              curvature={panelCurvature}
              opacity={panelOpacity}
              labColor={activeLabColor}
              frameDimmed={frameDimmed}
            />

            {/* LED Rim */}
            <LEDRim
              color={ledColor}
              intensity={0.5}
              spikeActive={spikeEvent}
              curved
            />

            {/* Side Panels */}
            <SidePanels
              leftContent={sidePanelLeftContent}
              rightContent={sidePanelRightContent}
              opacity={sidePanelOpacity}
              labColor={activeLabColor}
              dimmed={frameDimmed}
            />

            {/* Holographic HUD */}
            <HolographicHUD
              opacity={hudOpacity}
              color={activeLabColor}
              rotationSpeed={hudRotationSpeed}
              pulseIntensity={hudPulseIntensity}
              active={hudOpacity > 0}
            />

            {/* Status Bar */}
            <StatusBar3D
              xp={xp}
              xpMax={xpMax}
              streak={streak}
              sessionTime={sessionTime}
              labProgress={labProgress}
              labColor={activeLabColor}
              opacity={statusBarOpacity}
            />
          </group>

          {/* ═══ Spatial Dashboard Group ═══ */}
          {heroComplete && showSpatialDashboard && (
            <SpatialDashboardContent
              labCompletions={labCompletions}
              onLabEnter={onLabEnter}
            />
          )}

          {/* ═══ Postprocessing (single stack) ═══ */}
          {profile.bloomEnabled && (
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

      {/* CSS overlays */}
      {scanlineEnabled && <div className="scanline-overlay" style={{ opacity: 0.03 }} aria-hidden="true" />}
      <div className="vignette-overlay" aria-hidden="true" />
      <div
        className="station-frame-css"
        style={{ '--glow-color': ledColor, opacity: 0.3 } as React.CSSProperties}
        aria-hidden="true"
      />
    </div>
  );
}
