'use client';

// ════════════════════════════════════════════════════
// SpatialDashboard — Immersive 3D Command Bridge
// ════════════════════════════════════════════════════
// Enhancement 1.1: Replaces flat dashboard grid with a fully immersive
// 3D spatial environment where labs are physical locations on a curved
// holographic map. Children rotate/zoom to explore.
//
// Architecture:
// - R3F Canvas (full viewport, behind HTML content)
// - CinematicCamera (spring-interpolated transitions)
// - HolographicLabMap (10 lab structures in ring)
// - DynamicEnvironment (lab-reactive particles + lighting)
// - InteractiveConsole3D (XP, badges, streak, progress)
// - AmbientNPCs (floating robot assistants)
//
// Integrates with: cockpitStore, childStore, deviceStore, useSpatialNavigation

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, AdaptiveDpr, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { HolographicLabMap } from './HolographicLabMap';
import { CinematicCamera } from './CinematicCamera';
import { DynamicEnvironment } from './DynamicEnvironment';
import { InteractiveConsole3D, CONSOLE_POSITIONS } from './InteractiveConsole3D';
import { AmbientNPCs } from './AmbientNPCs';
import { useCockpitStore, LAB_POSITIONS } from '@/stores/cockpitStore';
import { useChildStore } from '@/stores/childStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { HDR_FALLBACK_PRESET } from '@/lib/3d/materials';
import type { ConsoleType } from '@/stores/cockpitStore';

interface SpatialDashboardProps {
  labCompletions?: Record<number, number>;
  onLabEnter?: (labId: number) => void;
}

function SpatialDashboardScene({
  labCompletions = {},
  onLabEnter,
}: SpatialDashboardProps) {
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

  // Console data from child state
  const consoleData = useMemo(
    () => ({
      xp: child?.xp ?? 0,
      xpMax: 500, // Would be calculated from LEVEL_THRESHOLDS
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

  // Focused lab position for NPC awareness
  const focusedLabPos = focusedLabId ? LAB_POSITIONS[focusedLabId] || null : null;

  // Handle console click
  const handleConsoleClick = (type: ConsoleType) => {
    if (activeConsole === type) {
      closeConsole();
    } else {
      openConsole(type);
    }
  };

  return (
    <>
      {/* Cinematic camera system */}
      <CinematicCamera
        target={cameraTarget}
        damping={0.04}
        enableOrbitDrift={focusedLabId === null}
      />

      {/* Adaptive performance */}
      <AdaptiveDpr pixelated />

      {/* HDR environment for reflections */}
      <Environment preset={HDR_FALLBACK_PRESET} />

      {/* Starfield background */}
      <Stars
        radius={50}
        depth={30}
        count={profile.lodBias === 'high' ? 2000 : 800}
        factor={3}
        saturation={0.2}
        fade
        speed={0.5}
      />

      {/* Dynamic lab-reactive environment */}
      <DynamicEnvironment
        activeLabId={focusedLabId}
        intensity={0.6}
      />

      {/* Holographic Lab Map — the central 3D experience */}
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

      {/* Ambient robot NPCs */}
      <AmbientNPCs
        visible={npcsVisible}
        focusedLabPosition={focusedLabPos}
      />

      {/* Postprocessing */}
      {profile.bloomEnabled && (
        <EffectComposer>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Vignette darkness={0.4} offset={0.3} eskil={false} {...({} as any)} />
        </EffectComposer>
      )}
    </>
  );
}

export function SpatialDashboard(props: SpatialDashboardProps) {
  const profile = useDeviceStore((s) => s.profile);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ pointerEvents: 'auto' }}
      aria-label="3D Spatial Dashboard — Navigate labs using arrow keys or click"
      role="application"
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
          <SpatialDashboardScene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
