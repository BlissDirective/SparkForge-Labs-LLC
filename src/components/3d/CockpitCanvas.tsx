'use client';

// ================================================================
// CockpitCanvas — Unified Persistent R3F Canvas (CPA2-1 + D3D-B1)
// ================================================================
// SINGLE persistent R3F Canvas for the entire app lifecycle.
// NEVER unmounts — scene visibility is controlled by SceneRouter.
//
// D3D Part B refactor:
//   - Removed mobile/WebGL detection (D3D-1)
//   - Removed CSS fallback branches (D3D-1)
//   - Removed game-mode Canvas unmount (D3D-B1)
//   - Added SceneRouter for centralized visibility management
//   - Added MechanicalIris integration (D3D-B2)
//   - Postprocessing always-on (D3D-5)
//   - logarithmicDepthBuffer for deep scene support
//
// Scene groups (managed by SceneRouter):
//   Hero Scene Group     — visible during 8-phase hero animation
//   Cockpit Shell Group  — visible post-hero, fades to 20% during game (D3D-B6)
//   Spatial Content Group — visible on dashboard routes
//   Game Scene Group     — visible during gameplay
//   Iris Overlay Group   — visible during transitions

import React, { Suspense, lazy, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';

// Dev-only R3F performance monitor (tree-shaken in production)
const PerfMonitor =
  process.env.NODE_ENV === 'development'
    ? lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })))
    : null;
import { Environment, AdaptiveDpr, Stars } from '@react-three/drei';

// 3D Components — Station Shell
import { AuroraBackground } from './AuroraBackground';
import { AmbientParticles } from './AmbientParticles';
import { CockpitPanels } from './CockpitPanels';
import { LEDRim } from './LEDRim';
import { SidePanels } from './SidePanels';
import { HolographicHUD } from './HolographicHUD';
import { StatusBar3D } from './StatusBar3D';
import { PostProcessingStack } from './PostProcessingStack';

// 3D Components — Spatial Dashboard
import { HolographicLabMap } from './HolographicLabMap';
import { CinematicCamera } from './CinematicCamera';
import { DynamicEnvironment } from './DynamicEnvironment';
import { InteractiveConsole3D, CONSOLE_POSITIONS } from './InteractiveConsole3D';
import { AmbientNPCs } from './AmbientNPCs';

// Scene Management (D3D-B5)
import { SceneRouter } from './SceneRouter';
import { MechanicalIris } from './MechanicalIris';
import { CeremonyFXBridge } from './CeremonyFXBridge';
import { ParentDashboardBridge } from './ParentDashboardBridge';
import { CameraSystem, type CameraMode } from './CameraSystem';

// Hooks (D3D-C4)
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
// Frame-time monitoring (Audit Section 4.4, Plan B1: non-invasive, dev-only)
import { useFrameTimeMonitor } from '@/hooks/useFrameTimeMonitor';
// Note: Iris audio is now managed by useIrisTransition hook (Section 4.1-C)

// Game registry (Section 4.1-B: per-game camera presets)
import { getGameBySlug } from '@/config/gameRegistry';

// Stores
import { useSceneStore } from '@/stores/sceneStore';
// useDeviceStore available for future per-device tuning
// import { useDeviceStore } from '@/stores/deviceStore';
import { useCockpitStore, LAB_POSITIONS, type ConsoleType } from '@/stores/cockpitStore';
import { useChildStore } from '@/stores/childStore';
import { FROST_PRISMATIC_HDR_PATH } from '@/lib/3d/materials';
// Module-level asset preloading (Audit Section 4.5)
import '@/lib/3d/preloadAssets';
import type { SidePanelContent, StationModeKey } from '@/lib/3d/cockpitConfig';

// ── Props ────────────────────────────────────────────────────────

interface CockpitCanvasProps {
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

  // Game scene (D3D-B3)
  gameSceneContent?: React.ReactNode;
}

// ── Spatial Dashboard Scene Content ──────────────────────────────

const SpatialDashboardContent = React.memo(function SpatialDashboardContent({
  labCompletions = {},
  onLabEnter,
}: {
  labCompletions: Record<number, number>;
  onLabEnter?: (labId: number) => void;
}) {
  // Critical Fix #4: Individual selectors to avoid full-store re-renders in 3D path
  const focusedLabId = useCockpitStore((s) => s.focusedLabId);
  const hoveredLabId = useCockpitStore((s) => s.hoveredLabId);
  const cameraTarget = useCockpitStore((s) => s.cameraTarget);
  const orbitSpeed = useCockpitStore((s) => s.orbitSpeed);
  const npcsVisible = useCockpitStore((s) => s.npcsVisible);
  const activeConsole = useCockpitStore((s) => s.activeConsole);
  const focusLab = useCockpitStore((s) => s.focusLab);
  const setHoveredLab = useCockpitStore((s) => s.setHoveredLab);
  const openConsole = useCockpitStore((s) => s.openConsole);
  const closeConsole = useCockpitStore((s) => s.closeConsole);

  const child = useChildStore((s) => s.activeChild);
  const badges = useChildStore((s) => s.badges);

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
      <CinematicCamera
        target={cameraTarget}
        damping={0.04}
        enableOrbitDrift={focusedLabId === null}
      />

      <Stars radius={50} depth={30} count={2000} factor={3} saturation={0.2} fade speed={0.5} />

      <DynamicEnvironment activeLabId={focusedLabId} intensity={0.6} />

      <HolographicLabMap
        focusedLabId={focusedLabId}
        hoveredLabId={hoveredLabId}
        labCompletions={labCompletions}
        orbitSpeed={orbitSpeed}
        onLabClick={(labId) => focusLab(labId)}
        onLabHover={(labId) => setHoveredLab(labId)}
        onLabDoubleClick={(labId) => onLabEnter?.(labId)}
      />

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

      <AmbientNPCs visible={npcsVisible} focusedLabPosition={focusedLabPos} />
    </>
  );
});

// ── Frame Time Monitor (dev-only, Audit Section 4.4 Plan B1) ─────

function FrameTimeMonitorInner() {
  useFrameTimeMonitor({ enabled: process.env.NODE_ENV === 'development' });
  return null;
}

// ════════════════════════════════════════════════════════════════
// CockpitCanvas — Main Export (D3D-B1: Persistent, never unmounts)
// ════════════════════════════════════════════════════════════════

export function CockpitCanvas({
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
  gameSceneContent,
}: CockpitCanvasProps) {
  // Scene state from centralized store (D3D-B5)
  const activeScene = useSceneStore((s) => s.activeScene);
  const activeGameId = useSceneStore((s) => s.activeGameId);
  const activeGameLabColor = useSceneStore((s) => s.activeGameLabColor);
  // Game 3D scene content — registered by games via sceneStore (D3D-B3)
  const storeGameSceneContent = useSceneStore((s) => s.gameSceneContent);
  const resolvedGameSceneContent = gameSceneContent ?? storeGameSceneContent;

  // Per-game camera preset lookup (Section 4.1-B)
  const gameCameraPreset = useMemo(() => {
    if (!activeGameId) return null;
    const game = getGameBySlug(activeGameId);
    return game?.cameraPreset ?? null;
  }, [activeGameId]);

  // Determine camera mode from active scene
  const cameraMode: CameraMode = activeScene === 'hero'
    ? 'hero'
    : activeScene === 'game'
      ? 'game'
      : activeScene === 'spatial' || showSpatialDashboard
        ? 'spatial'
        : 'station';

  // Effective lab color (game lab color during gameplay)
  const effectiveLabColor = activeScene === 'game' ? activeGameLabColor : activeLabColor;

  // Mouse parallax for subtle depth movement (D3D-C4)
  const parallaxRef = useParallaxMouse({ smoothing: 0.05, intensity: 1.0 });
  // Iris audio is now managed by useIrisTransition hook (Section 4.1-C)

  // ── Single Persistent R3F Canvas (D3D-B1: NEVER unmounts) ──
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none r3f-vignette-active"
      style={{ opacity: frameDimmed ? 0.4 : 1 }}
      aria-hidden="true"
    >
      <Canvas
        frameloop="always"
        dpr={[1, 3]}
        camera={{
          position: [0, 0.65, 1.1],  // v3: tight-focus cockpit seat (was [0, 6.5, 7])
          fov: 58,
          near: 0.1,
          far: 200,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: true,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Adaptive DPR */}
          <AdaptiveDpr pixelated />

          {/* Dev-only performance monitoring (Audit Section 4.4, Plan B1) */}
          {PerfMonitor && (
            <Suspense fallback={null}>
              <PerfMonitor position="top-right" minimal />
            </Suspense>
          )}
          <FrameTimeMonitorInner />

          {/* Unified Camera System (D3D-C4: parallax, Section 4.1-B: per-game presets) */}
          <CameraSystem
            mode={cameraMode}
            stationFov={cameraFov}
            spatialDamping={0.04}
            enableOrbitDrift
            parallaxRef={parallaxRef}
            gameCameraPreset={gameCameraPreset}
          />

          {/* HDR Environment */}
          {/* HDR Environment — custom Frost-Prismatic HDRI with drei preset fallback */}
          <Environment files={FROST_PRISMATIC_HDR_PATH} />

          {/* ═══ SceneRouter — Centralized Visibility (D3D-B5) ═══ */}
          <SceneRouter
            heroContent={heroSceneContent}
            cockpitContent={
              <>
                <AuroraBackground
                  intensity={bgIntensity}
                  speed={1.0}
                  color1={effectiveLabColor}
                  color2="#8B5CF6"
                  color3="#06B6D4"
                />

                <AmbientParticles
                  intensity={particleIntensity}
                  color={effectiveLabColor}
                />

                <CockpitPanels
                  curvature={panelCurvature}
                  opacity={panelOpacity}
                  labColor={effectiveLabColor}
                  frameDimmed={frameDimmed}
                />

                <LEDRim
                  color={ledColor}
                  intensity={0.5}
                  spikeActive={spikeEvent}
                  curved
                />

                <SidePanels
                  leftContent={sidePanelLeftContent}
                  rightContent={sidePanelRightContent}
                  opacity={sidePanelOpacity}
                  labColor={effectiveLabColor}
                  dimmed={frameDimmed}
                />

                <HolographicHUD
                  opacity={hudOpacity}
                  color={effectiveLabColor}
                  rotationSpeed={hudRotationSpeed}
                  pulseIntensity={hudPulseIntensity}
                  active={hudOpacity > 0}
                />

                <StatusBar3D
                  xp={xp}
                  xpMax={xpMax}
                  streak={streak}
                  sessionTime={sessionTime}
                  labProgress={labProgress}
                  labColor={effectiveLabColor}
                  opacity={statusBarOpacity}
                />

                {/* ═══ Ceremony FX — 3D celebration effects (S5-HIGH-007) ═══ */}
                <CeremonyFXBridge />

                {/* ═══ Parent Dashboard — 3D stat hologram (Stage 8 Enhancement A1) ═══ */}
                <ParentDashboardBridge />
              </>
            }
            spatialContent={
              <SpatialDashboardContent
                labCompletions={labCompletions}
                onLabEnter={onLabEnter}
              />
            }
            gameContent={resolvedGameSceneContent}
            irisContent={<MechanicalIris labColor={effectiveLabColor} />}
          />

          {/* ═══ Postprocessing (D3D-C1: 7 always-on effects) ═══ */}
          <PostProcessingStack
            bloomIntensity={bloomIntensity}
            bloomThreshold={bloomThreshold}
            bloomSmoothing={bloomSmoothing}
            vignetteDarkness={vignetteDarkness}
            vignetteOffset={vignetteOffset}
            barrelDistortion={barrelDist}
          />
        </Suspense>
      </Canvas>

      {/* CSS overlays */}
      {scanlineEnabled && <div className="scanline-overlay" style={{ opacity: 0.03 }} aria-hidden="true" />}
      <div className="vignette-overlay" aria-hidden="true" />
    </div>
  );
}
