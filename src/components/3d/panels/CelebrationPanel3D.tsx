'use client';

// ════════════════════════════════════════════════════════════════
// CelebrationPanel3D — Center Viewport Celebration Display (Phase 4)
// ════════════════════════════════════════════════════════════════
// Replaces the HTML CelebrationOverlay modal with a 3D panel that
// renders in the center viewport during major/epic celebrations.
//
// Per JSON spec §mode_presets.celebration + Design Decision 18:
//   - Badge earn: Metallic badge card with name + rarity + category
//   - Level up: Large level number with title + "abilities unlocked"
//   - Streak milestone: Streak count with tier indicator
//   - Lab complete: Lab name + completion summary
//
// Per UI-12: Modals = center screen takeover (no overlay dimming)
// Per Decision 4.4: Celebrations — Full spectacle, 3 tiers

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from 'three';
import { useCockpitUIStore } from '@/stores/cockpitUIStore';
import {
  CHROME_BORDER,
  _HOVER_GLOW,
  TYPE_SCALE,
  TEXT_COLORS,
  NUMERIC_FONT,
  _CELEBRATION_TIERS,
  EMISSIVE_SCALE,
} from '@/lib/3d/cockpitDesignTokens';
import type { CelebrationTier } from '@/lib/3d/cockpitDesignTokens';
import type { CelebrationType } from '@/types';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PANEL_WIDTH = 1.2;
const PANEL_HEIGHT = 1.0;
const PANEL_DEPTH = 0.006;
const GOLD = '#FFD700';
const ACCENT_PURPLE = '#AA66FF';
const GREEN = '#00FF88';

// Badge rarity colors
const RARITY_COLORS: Record<string, string> = {
  common: '#a8b5c8',
  uncommon: '#00FF88',
  rare: '#00BBFF',
  epic: '#AA66FF',
  legendary: '#FFD700',
};

// ═══════════════════════════════════════════════════════════════
// DISPLAY CONFIGS
// ═══════════════════════════════════════════════════════════════

interface CelebrationDisplayData {
  celebrationType?: CelebrationType;
  celebrationData?: Record<string, unknown>;
  tier?: CelebrationTier;
}

// ═══════════════════════════════════════════════════════════════
// BADGE DISPLAY
// ═══════════════════════════════════════════════════════════════

function BadgeDisplay({ data }: { data: Record<string, unknown> }) {
  const name = (data.name as string) || 'New Badge';
  const rarity = (data.rarity as string) || 'common';
  const category = (data.category as string) || 'progress';
  const description = (data.description as string) || 'Achievement unlocked!';
  const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  return (
    <group>
      {/* Badge icon — hexagonal frame */}
      <mesh position={[0, 0.2, 0.005]}>
        <circleGeometry args={[0.12, 6]} />
        <meshStandardMaterial
          color={new Color(rarityColor)}
          emissive={new Color(rarityColor)}
          emissiveIntensity={EMISSIVE_SCALE.bright}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.2, 0.003]}>
        <ringGeometry args={[0.12, 0.14, 6]} />
        <meshStandardMaterial
          color={new Color(CHROME_BORDER.colorHex)}
          metalness={0.95}
          roughness={0.1}
          emissive={new Color(rarityColor)}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Title */}
      <Text position={[0, 0.02, 0.005]} fontSize={TYPE_SCALE.h2.fontSize}
        color={TEXT_COLORS.primary.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.h2.fontPath}
      >BADGE EARNED!</Text>

      {/* Badge name */}
      <Text position={[0, -0.06, 0.005]} fontSize={TYPE_SCALE.h3.fontSize}
        color={rarityColor} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.h3.fontPath}
      >{name}</Text>

      {/* Rarity + Category */}
      <Text position={[0, -0.12, 0.005]} fontSize={TYPE_SCALE.caption.fontSize}
        color={TEXT_COLORS.muted.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
      >{`${rarity.toUpperCase()} · ${category.toUpperCase()}`}</Text>

      {/* Description */}
      <Text position={[0, -0.2, 0.005]} fontSize={TYPE_SCALE.caption.fontSize}
        color={TEXT_COLORS.secondary.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.body.fontPath} fillOpacity={TEXT_COLORS.secondary.opacity}
        maxWidth={0.9} textAlign="center"
      >{description}</Text>

      {/* Glow */}
      <pointLight color={rarityColor} intensity={2} distance={2} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEVEL UP DISPLAY
// ═══════════════════════════════════════════════════════════════

function LevelUpDisplay({ data }: { data: Record<string, unknown> }) {
  const level = (data.level as number) || 1;
  const title = (data.title as string) || 'Explorer';
  const groupRef = useRef<Group>(null);

  // Slow rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Big level number */}
      <Text position={[0, 0.15, 0.005]} fontSize={0.15}
        color={GOLD} anchorX="center" anchorY="middle"
        font={NUMERIC_FONT}
        outlineWidth={0.003} outlineColor="#000000"
      >{`${level}`}</Text>

      {/* "LEVEL UP!" */}
      <Text position={[0, -0.02, 0.005]} fontSize={TYPE_SCALE.h1.fontSize}
        color={TEXT_COLORS.primary.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.h1.fontPath}
      >LEVEL UP!</Text>

      {/* Title */}
      <Text position={[0, -0.1, 0.005]} fontSize={TYPE_SCALE.h3.fontSize}
        color={ACCENT_PURPLE} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.h3.fontPath}
      >{title}</Text>

      {/* Subtitle */}
      <Text position={[0, -0.18, 0.005]} fontSize={TYPE_SCALE.caption.fontSize}
        color={TEXT_COLORS.muted.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
      >New abilities unlocked</Text>

      <pointLight color={GOLD} intensity={3} distance={2.5} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// STREAK DISPLAY
// ═══════════════════════════════════════════════════════════════

function StreakDisplay({ data }: { data: Record<string, unknown> }) {
  const count = (data.count as number) || (data.streak as number) || 1;
  const tier = count >= 30 ? 'LEGENDARY' : count >= 14 ? 'BLAZING' : count >= 7 ? 'HOT' : 'BUILDING';
  const tierColor = count >= 30 ? GOLD : count >= 14 ? '#FF6644' : count >= 7 ? '#FF9922' : GREEN;

  return (
    <group>
      <Text position={[0, 0.15, 0.005]} fontSize={0.1}
        color={tierColor} anchorX="center" anchorY="middle" font={NUMERIC_FONT}
        outlineWidth={0.002} outlineColor="#000000"
      >{`${count}`}</Text>

      <Text position={[0, 0, 0.005]} fontSize={TYPE_SCALE.h2.fontSize}
        color={TEXT_COLORS.primary.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.h2.fontPath}
      >DAY STREAK!</Text>

      <Text position={[0, -0.08, 0.005]} fontSize={TYPE_SCALE.label.fontSize}
        color={tierColor} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.label.fontPath}
      >{tier}</Text>

      <Text position={[0, -0.16, 0.005]} fontSize={TYPE_SCALE.caption.fontSize}
        color={TEXT_COLORS.muted.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
      >Keep it going!</Text>

      <pointLight color={tierColor} intensity={2} distance={2} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAB COMPLETE DISPLAY
// ═══════════════════════════════════════════════════════════════

function LabCompleteDisplay({ data }: { data: Record<string, unknown> }) {
  const labName = (data.labName as string) || (data.name as string) || 'Lab';
  const labColor = (data.labColor as string) || (data.color as string) || '#00BBFF';

  return (
    <group>
      <Text position={[0, 0.12, 0.005]} fontSize={TYPE_SCALE.h1.fontSize}
        color={TEXT_COLORS.primary.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.h1.fontPath}
      >LAB COMPLETE!</Text>

      <Text position={[0, 0.02, 0.005]} fontSize={TYPE_SCALE.h2.fontSize}
        color={labColor} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.h2.fontPath}
      >{labName}</Text>

      <Text position={[0, -0.08, 0.005]} fontSize={TYPE_SCALE.caption.fontSize}
        color={TEXT_COLORS.muted.hex} anchorX="center" anchorY="middle"
        font={TYPE_SCALE.caption.fontPath} fillOpacity={TEXT_COLORS.muted.opacity}
      >All games mastered</Text>

      <pointLight color={labColor} intensity={2.5} distance={2} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CelebrationPanel3D() {
  const centerData = useCockpitUIStore((s) => s.centerData) as CelebrationDisplayData;
  const glowRef = useRef<Mesh>(null);

  const celebrationType = centerData?.celebrationType;
  const celebrationData = (centerData?.celebrationData || {}) as Record<string, unknown>;
  const _tier = centerData?.tier || 'minor';

  const goldColor = useMemo(() => new Color(GOLD), []);
  const chromeColor = useMemo(() => new Color(CHROME_BORDER.colorHex), []);

  const panelMat = useMemo(() => new MeshStandardMaterial({
    color: new Color('#0A0F1F'), metalness: 0.85, roughness: 0.35,
    transparent: true, opacity: 0.88,
  }), []);
  const chromeMat = useMemo(() => new MeshStandardMaterial({
    color: chromeColor, metalness: 0.95, roughness: 0.1,
    emissive: goldColor, emissiveIntensity: 0.3,
  }), [chromeColor, goldColor]);
  const glowMat = useMemo(() => new MeshBasicMaterial({
    color: goldColor, transparent: true, opacity: 0.1,
    blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false,
  }), [goldColor]);

  // Pulsing glow
  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
      (glowRef.current.material as MeshBasicMaterial).opacity = 0.08 + pulse * 0.06;
    }
  });

  return (
    <group name="celebration-panel">
      {/* Glow */}
      <mesh ref={glowRef} position={[0, 0, -0.003]}>
        <planeGeometry args={[PANEL_WIDTH + 0.08, PANEL_HEIGHT + 0.08]} />
        <primitive object={glowMat} />
      </mesh>

      {/* Panel */}
      <mesh>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
        <primitive object={panelMat} />
      </mesh>

      {/* Gold chrome frame */}
      <mesh position={[0, PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.004, 0.004]} />
      </mesh>
      <mesh position={[0, -PANEL_HEIGHT / 2, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[PANEL_WIDTH, 0.004, 0.004]} />
      </mesh>
      <mesh position={[-PANEL_WIDTH / 2, 0, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[0.004, PANEL_HEIGHT, 0.004]} />
      </mesh>
      <mesh position={[PANEL_WIDTH / 2, 0, PANEL_DEPTH / 2 + 0.001]} material={chromeMat}>
        <boxGeometry args={[0.004, PANEL_HEIGHT, 0.004]} />
      </mesh>

      {/* Content — type-specific display */}
      <group position={[0, 0, PANEL_DEPTH / 2 + 0.002]}>
        {celebrationType === 'badge' && <BadgeDisplay data={celebrationData} />}
        {celebrationType === 'level' && <LevelUpDisplay data={celebrationData} />}
        {celebrationType === 'streak' && <StreakDisplay data={celebrationData} />}
        {celebrationType === 'confetti' && <LabCompleteDisplay data={celebrationData} />}
        {/* XP celebrations don't show a panel — just the XPPopup3D */}
      </group>
    </group>
  );
}
