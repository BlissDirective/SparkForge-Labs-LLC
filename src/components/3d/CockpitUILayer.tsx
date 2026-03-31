'use client';

// ════════════════════════════════════════════════════════════════
// CockpitUILayer — Master 3D UI Orchestrator
// ════════════════════════════════════════════════════════════════
// Renders Left, Center, Right, and Bottom UI quadrants inside the
// cockpit scene. Positions each quadrant per the JSON spec. Reacts
// to the active CockpitMode for opacity, scale, and offset changes.
//
// Per SparkForge-Full-ControlScreen.json §quadrant_layout:
//   Left  25% [-2.35, 0.25, -1.65] — Player Identity Hub (FIXED)
//   Center 45% [0, 0.35, -3.3]     — Swaps per page (VARIABLE)
//   Right 25% [2.35, 0.25, -1.65]  — Control & Monitoring (FIXED)
//   Bottom 15% [0, -0.6, -1.85]    — Fixed Instruments
//
// Game mode: center scales 1.75x, panels slide 30% outward, dim to 40%.
// Non-game transitions: 400ms crossfade.
//
// This component renders PLACEHOLDER groups for each quadrant.
// Phase 2 will populate them with actual panel components.

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { MathUtils } from 'three';
import { useCockpitStore } from '@/stores/cockpitStore';
import { COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';
import { COCKPIT_MODE_PRESETS, type CockpitMode } from '@/lib/3d/cockpitModePresets';

// ── Quadrant positions from JSON spec ──────────────

const LEFT_POSITION = COCKPIT_GEOMETRY.leftConsolePosition;
const LEFT_ROTATION = COCKPIT_GEOMETRY.leftConsoleRotation;
const RIGHT_POSITION = COCKPIT_GEOMETRY.rightConsolePosition;
const RIGHT_ROTATION = COCKPIT_GEOMETRY.rightConsoleRotation;
const CENTER_POSITION: [number, number, number] = [0, 0.35, -3.3];
const BOTTOM_POSITION: [number, number, number] = [0, -0.6, -1.85];

// ── Props ──────────────────────────────────────────

interface CockpitUILayerProps {
  /** Content for the left quadrant (Player Identity Hub) */
  leftContent?: ReactNode;
  /** Content for the center quadrant (swaps per page) */
  centerContent?: ReactNode;
  /** Content for the right quadrant (Control & Monitoring Hub) */
  rightContent?: ReactNode;
  /** Content for the bottom quadrant (Fixed Instruments) */
  bottomContent?: ReactNode;
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

export function CockpitUILayer({
  leftContent,
  centerContent,
  rightContent,
  bottomContent,
}: CockpitUILayerProps) {
  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);
  const centerRef = useRef<Group>(null);
  const bottomRef = useRef<Group>(null);

  const activeMode = useCockpitStore((s) => s.activeMode);

  // Smoothly interpolate quadrant transforms per frame
  useFrame((_, delta) => {
    const targets = getModeTargets(activeMode);
    const lerpSpeed = Math.min(delta * 5, 1); // ~5 units/sec convergence

    // Center: scale by centerScale
    if (centerRef.current) {
      const cs = centerRef.current.scale;
      const t = targets.centerScale;
      cs.x = MathUtils.lerp(cs.x, t, lerpSpeed);
      cs.y = MathUtils.lerp(cs.y, t, lerpSpeed);
      cs.z = MathUtils.lerp(cs.z, t, lerpSpeed);
    }

    // Left panel: slide outward by panelOffset, adjust opacity
    if (leftRef.current) {
      const offset = targets.panelOffset;
      leftRef.current.position.x = MathUtils.lerp(
        leftRef.current.position.x,
        LEFT_POSITION[0] - offset * 0.8, // Slide further left
        lerpSpeed,
      );
    }

    // Right panel: slide outward by panelOffset
    if (rightRef.current) {
      const offset = targets.panelOffset;
      rightRef.current.position.x = MathUtils.lerp(
        rightRef.current.position.x,
        RIGHT_POSITION[0] + offset * 0.8, // Slide further right
        lerpSpeed,
      );
    }

    // Bottom: slide down by panelOffset
    if (bottomRef.current) {
      const offset = targets.panelOffset;
      bottomRef.current.position.y = MathUtils.lerp(
        bottomRef.current.position.y,
        BOTTOM_POSITION[1] - offset * 0.4, // Slide lower
        lerpSpeed,
      );
    }
  });

  return (
    <group name="cockpit-ui-layer">
      {/* ═══ LEFT QUADRANT — Player Identity Hub ═══ */}
      <group
        ref={leftRef}
        name="quadrant-left"
        position={[LEFT_POSITION[0], LEFT_POSITION[1], LEFT_POSITION[2]]}
        rotation={[LEFT_ROTATION[0], LEFT_ROTATION[1], LEFT_ROTATION[2]]}
      >
        {leftContent}
      </group>

      {/* ═══ CENTER QUADRANT — Swaps per page ═══ */}
      <group
        ref={centerRef}
        name="quadrant-center"
        position={CENTER_POSITION}
      >
        {centerContent}
      </group>

      {/* ═══ RIGHT QUADRANT — Control & Monitoring Hub ═══ */}
      <group
        ref={rightRef}
        name="quadrant-right"
        position={[RIGHT_POSITION[0], RIGHT_POSITION[1], RIGHT_POSITION[2]]}
        rotation={[RIGHT_ROTATION[0], RIGHT_ROTATION[1], RIGHT_ROTATION[2]]}
      >
        {rightContent}
      </group>

      {/* ═══ BOTTOM QUADRANT — Fixed Instruments ═══ */}
      <group
        ref={bottomRef}
        name="quadrant-bottom"
        position={BOTTOM_POSITION}
      >
        {bottomContent}
      </group>
    </group>
  );
}
