'use client';

// ════════════════════════════════════════════════════════════════
// CockpitUILayer — Master 3D UI Orchestrator (Phase 2)
// ════════════════════════════════════════════════════════════════
// Renders Left, Center, Right, and Bottom UI quadrants inside the
// cockpit scene. Reads cockpitUIStore to swap center content per route.
// Reacts to the active CockpitMode for opacity, scale, and offset.
//
// Per SparkForge-Full-ControlScreen.json §quadrant_layout:
//   Left  25% [-2.35, 0.25, -1.65] — Player Identity Hub (FIXED)
//   Center 45% [0, 0.35, -3.3]     — Swaps per page (VARIABLE)
//   Right 25% [2.35, 0.25, -1.65]  — Control & Monitoring (FIXED)
//   Bottom 15% [0, -0.6, -1.85]    — Fixed Instruments
//
// Game mode: center scales 1.75x, panels slide 30% outward, dim to 40%.
// Non-game transitions: 400ms crossfade via lerp.

import React, { useRef, Suspense, lazy } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { MathUtils } from 'three';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCockpitUIStore, type CenterContentKey } from '@/stores/cockpitUIStore';
import { COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';
import { COCKPIT_MODE_PRESETS, type CockpitMode } from '@/lib/3d/cockpitModePresets';

// ── Quadrant positions from JSON spec ──────────────

const LEFT_POSITION = COCKPIT_GEOMETRY.leftConsolePosition;
const LEFT_ROTATION = COCKPIT_GEOMETRY.leftConsoleRotation;
const RIGHT_POSITION = COCKPIT_GEOMETRY.rightConsolePosition;
const RIGHT_ROTATION = COCKPIT_GEOMETRY.rightConsoleRotation;
const CENTER_POSITION: [number, number, number] = [0, 0.35, -3.3];
const BOTTOM_POSITION: [number, number, number] = [0, -0.6, -1.85];

// ── Lazy-loaded panel components ──────────────────
// Each center panel is lazy-loaded to keep initial bundle lean.
// Left/Right are always loaded (fixed, always visible).

const DashboardCenter = lazy(() => import('./panels/DashboardCenter'));
const LabsCenter = lazy(() => import('./panels/LabsCenter'));
const LabDetailPanel = lazy(() => import('./panels/LabDetailPanel'));
const ArcadePanel = lazy(() => import('./panels/ArcadePanel'));
const ProfileCenter = lazy(() => import('./panels/ProfileCenter'));
const SettingsPanel = lazy(() => import('./panels/SettingsPanel'));
const ParentPanel = lazy(() => import('./panels/ParentPanel'));
const ChatPanel3D = lazy(() => import('./panels/ChatPanel3D'));
const CelebrationPanel3D = lazy(() => import('./panels/CelebrationPanel3D'));
const DashboardLeft = lazy(() => import('./panels/DashboardLeft'));
const DashboardRight = lazy(() => import('./panels/DashboardRight'));

// ── Center content router ─────────────────────────

function CenterContentRouter({ contentKey }: { contentKey: CenterContentKey }) {
  switch (contentKey) {
    case 'home':
      return <DashboardCenter />;
    case 'labs':
      return <LabsCenter />;
    case 'lab_detail':
      return <LabDetailPanel />;
    case 'arcade':
      return <ArcadePanel />;
    case 'profile':
      return <ProfileCenter />;
    case 'settings':
      return <SettingsPanel />;
    case 'parent':
      return <ParentPanel />;
    case 'chat':
      return <ChatPanel3D />;
    case 'celebration':
      return <CelebrationPanel3D />;
    case 'game':
      // Game mode — no center panel, game scene fills via SceneRouter
      return null;
    default:
      return <DashboardCenter />;
  }
}

// ── Lerp targets per mode ──────────────────────────

function getModeTargets(mode: CockpitMode) {
  const preset = COCKPIT_MODE_PRESETS[mode];
  return {
    centerScale: preset.centerScale,
    panelOffset: preset.panelOffset,
    panelOpacity: preset.panels.opacity,
    sidePanelOpacity: preset.sidePanels.opacity,
    statusBarOpacity: preset.statusBar.opacity,
  };
}

// ── Component ──────────────────────────────────────

export function CockpitUILayer() {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const centerRef = useRef<Group>(null);
  const bottomRef = useRef<Group>(null);

  const activeMode = useCockpitStore((s) => s.activeMode);
  const centerContent = useCockpitUIStore((s) => s.centerContent);

  // Smoothly interpolate quadrant transforms per frame
  useFrame((_, delta) => {
    const targets = getModeTargets(activeMode);
    const lerpSpeed = Math.min(delta * 5, 1);

    // Center: scale by centerScale
    if (centerRef.current) {
      const cs = centerRef.current.scale;
      const t = targets.centerScale;
      cs.x = MathUtils.lerp(cs.x, t, lerpSpeed);
      cs.y = MathUtils.lerp(cs.y, t, lerpSpeed);
      cs.z = MathUtils.lerp(cs.z, t, lerpSpeed);
    }

    // Left panel: slide outward by panelOffset
    if (leftRef.current) {
      const offset = targets.panelOffset;
      leftRef.current.position.x = MathUtils.lerp(
        leftRef.current.position.x,
        LEFT_POSITION[0] - offset * 0.8,
        lerpSpeed,
      );
    }

    // Right panel: slide outward by panelOffset
    if (rightRef.current) {
      const offset = targets.panelOffset;
      rightRef.current.position.x = MathUtils.lerp(
        rightRef.current.position.x,
        RIGHT_POSITION[0] + offset * 0.8,
        lerpSpeed,
      );
    }

    // Bottom: slide down by panelOffset
    if (bottomRef.current) {
      const offset = targets.panelOffset;
      bottomRef.current.position.y = MathUtils.lerp(
        bottomRef.current.position.y,
        BOTTOM_POSITION[1] - offset * 0.4,
        lerpSpeed,
      );
    }
  });

  return (
    <group name="cockpit-ui-layer">
      {/* ═══ LEFT QUADRANT — Player Identity Hub (FIXED) ═══ */}
      <group
        ref={leftRef}
        name="quadrant-left"
        position={[LEFT_POSITION[0], LEFT_POSITION[1], LEFT_POSITION[2]]}
        rotation={[LEFT_ROTATION[0], LEFT_ROTATION[1], LEFT_ROTATION[2]]}
      >
        <Suspense fallback={null}>
          <DashboardLeft />
        </Suspense>
      </group>

      {/* ═══ CENTER QUADRANT — Swaps per page ═══ */}
      <group
        ref={centerRef}
        name="quadrant-center"
        position={CENTER_POSITION}
      >
        <Suspense fallback={null}>
          <CenterContentRouter contentKey={centerContent} />
        </Suspense>
      </group>

      {/* ═══ RIGHT QUADRANT — Control & Monitoring Hub (FIXED) ═══ */}
      <group
        ref={rightRef}
        name="quadrant-right"
        position={[RIGHT_POSITION[0], RIGHT_POSITION[1], RIGHT_POSITION[2]]}
        rotation={[RIGHT_ROTATION[0], RIGHT_ROTATION[1], RIGHT_ROTATION[2]]}
      >
        <Suspense fallback={null}>
          <DashboardRight />
        </Suspense>
      </group>

      {/* ═══ BOTTOM QUADRANT — Fixed Instruments ═══ */}
      {/* NavigationButtonGrid, VariableDialCluster, StatusBar3D are
          already rendered directly in CockpitCanvas cockpitContent.
          This group is reserved for additional bottom UI if needed. */}
      <group
        ref={bottomRef}
        name="quadrant-bottom"
        position={BOTTOM_POSITION}
      />
    </group>
  );
}
