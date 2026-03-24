'use client';

// ════════════════════════════════════════════════════════════════════════════
// ProceduralEnvironmentGenerator — Main orchestrator for procedural 3D
// environments. Composes terrain, sky, fog, lighting, and props sub-generators
// driven by lab theme profiles and game tier budgets.
// ════════════════════════════════════════════════════════════════════════════

import React, { type ReactNode, useMemo } from 'react';
import { Environment } from '@react-three/drei';

import {
  ProceduralTerrain,
  ProceduralSkyDome,
  ProceduralFog,
  ProceduralLighting,
  ProceduralProps,
} from './procedural';

import {
  getLabTheme,
  getTierConfig,
  type GameTier,
  type LabThemeProfile,
  type TierConfig,
} from '@/lib/3d/proceduralConfig';

// ---------------------------------------------------------------------------
// Lab Color → ID Lookup (backwards compat with existing wrappers)
// ---------------------------------------------------------------------------

const LAB_COLOR_TO_ID: Record<string, number> = {
  '#00BBFF': 1, '#00bbff': 1,
  '#AA66FF': 2, '#aa66ff': 2,
  '#FF66AA': 3, '#ff66aa': 3,
  '#FFAA44': 4, '#ffaa44': 4,
  '#00FF88': 5, '#00ff88': 5,
  '#FF6644': 6, '#ff6644': 6,
  '#06B6D4': 7, '#06b6d4': 7,
  '#818CF8': 8, '#818cf8': 8,
  '#10B981': 9, '#10b981': 9,
  '#D946EF': 10, '#d946ef': 10,
};

/**
 * Resolve a lab hex color string to a lab ID (1–10).
 * Falls back to lab 1 if the color is unrecognized.
 */
export function labColorToId(color: string): number {
  return LAB_COLOR_TO_ID[color] || LAB_COLOR_TO_ID[color.toLowerCase()] || 1;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProceduralEnvironmentGeneratorProps {
  /** Lab ID (1-10). If not provided, resolved from labColor. */
  labId?: number;
  /** Lab color hex string. Used as fallback for labId resolution. */
  labColor?: string;
  /** Game tier controls triangle budget and visual complexity. */
  tier: GameTier;
  /** Game-specific content rendered inside the environment. */
  children: ReactNode;
  /** Override terrain color (backwards compat with existing wrappers). */
  terrainColor?: string;
  /** Override sky top color. */
  skyTopColor?: string;
  /** Override sky horizon color. */
  skyHorizonColor?: string;
  /** Override fog color. */
  fogColor?: string;
  /** Override height scale. */
  heightScale?: number;
  /** Override terrain size. */
  terrainSize?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProceduralEnvironmentGenerator({
  labId: labIdProp,
  labColor,
  tier,
  children,
  terrainColor,
  skyTopColor,
  skyHorizonColor,
  fogColor,
  heightScale,
  terrainSize,
}: ProceduralEnvironmentGeneratorProps) {
  // Resolve lab ID — prefer explicit prop, fall back to color lookup
  const labId = labIdProp ?? labColorToId(labColor || '#00BBFF');

  // Build effective theme with optional overrides
  const effectiveTheme: LabThemeProfile = useMemo(() => {
    const base = getLabTheme(labId);

    return {
      ...base,
      ...(terrainColor != null && { terrainColor }),
      sky: {
        ...base.sky,
        ...(skyTopColor != null && { topColor: skyTopColor }),
        ...(skyHorizonColor != null && { horizonColor: skyHorizonColor }),
      },
      fog: {
        ...base.fog,
        ...(fogColor != null && { fogColor }),
      },
    };
  }, [labId, terrainColor, skyTopColor, skyHorizonColor, fogColor]);

  // Build effective tier config with optional overrides
  const effectiveTierConfig: TierConfig = useMemo(() => {
    const base = getTierConfig(tier);

    return {
      ...base,
      ...(heightScale != null && { heightScale }),
      ...(terrainSize != null && { terrainSize }),
    };
  }, [tier, heightScale, terrainSize]);

  return (
    <group>
      <ProceduralLighting
        theme={effectiveTheme}
        tierConfig={effectiveTierConfig}
      />
      <ProceduralTerrain
        theme={effectiveTheme}
        tierConfig={effectiveTierConfig}
      />
      <ProceduralSkyDome
        theme={effectiveTheme}
        tierConfig={effectiveTierConfig}
      />
      <ProceduralFog
        theme={effectiveTheme}
        tierConfig={effectiveTierConfig}
      />
      <ProceduralProps
        theme={effectiveTheme}
        tierConfig={effectiveTierConfig}
      />
      <Environment preset="night" />
      {children}
    </group>
  );
}

export default ProceduralEnvironmentGenerator;
