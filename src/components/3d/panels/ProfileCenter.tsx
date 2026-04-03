'use client';

// ════════════════════════════════════════════════════════════════
// ProfileCenter — Profile Page Center Content
// ════════════════════════════════════════════════════════════════
// Decision 27.1: Pedestal grid — 3×3 badge pedestals (9 categories), earned=glow, locked=dim
// Decision 27.2: Expanded 1.5x avatar on profile page

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useChildStore } from '@/stores/childStore';
import {
  CHROME_BORDER,
  TYPE_SCALE,
  TEXT_COLORS,
  NUMERIC_FONT,
  EMISSIVE_IDLE_INDICATOR,
  GHOST_PLACEHOLDER_OPACITY,
  MAX_VISIBLE_ITEMS,
} from '@/lib/3d/cockpitDesignTokens';

const BADGE_CATEGORIES = [
  'progress', 'streak', 'lab', 'game_master', 'knowledge',
  'explorer', 'creator', 'secret', 'prestige',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  progress: '#00BBFF', streak: '#FF6644', lab: '#AA66FF',
  game_master: '#FFAA44', knowledge: '#00FF88', explorer: '#06B6D4',
  creator: '#FF66AA', secret: '#818CF8', prestige: '#D946EF',
};

export default function ProfileCenter() {
  const child = useChildStore((s) => s.activeChild);
  const badges = useChildStore((s) => s.badges);

  const displayName = child?.display_name ?? 'Explorer';
  const level = child?.level ?? 1;
  const xp = child?.xp ?? 0;
  const earnedCount = badges?.length ?? 0;

  return (
    <group name="profile-center">
      {/* ═══ Expanded Avatar 1.5x (Decision 27.2) ═══ */}
      <group position={[0, 0.6, 0.3]}>
        {/* Hexagonal avatar frame scaled 1.5x */}
        <mesh rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.21, 0.21, 0.015, 6]} />
          <meshStandardMaterial
            color={CHROME_BORDER.colorHex}
            metalness={0.95}
            roughness={0.15}
            emissive="#223344"
            emissiveIntensity={CHROME_BORDER.glowIntensity}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 6]} position={[0, 0.001, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.012, 6]} />
          <meshStandardMaterial
            color="#0A0F1F"
            metalness={0.6}
            roughness={0.4}
            emissive="#AA66FF"
            emissiveIntensity={0.4}
          />
        </mesh>
        <Text
          position={[0, -0.28, 0]}
          fontSize={TYPE_SCALE.h2.fontSize}
          color={TEXT_COLORS.primary.hex}
          anchorX="center"
          font={TYPE_SCALE.h2.fontPath}
        >
          {displayName}
        </Text>
        <Text
          position={[0, -0.33, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color="#AA66FF"
          anchorX="center"
          font={NUMERIC_FONT}
        >
          {`Level ${level}  ·  ${xp.toLocaleString()} XP  ·  ${earnedCount} Badges`}
        </Text>
      </group>

      {/* ═══ Trophy Room — 3×3 Pedestal Grid (Decision 27.1) ═══ */}
      <group position={[-0.28, -0.2, 0.2]}>
        <Text
          position={[0.28, 0.15, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          TROPHY ROOM
        </Text>

        {BADGE_CATEGORIES.map((cat, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const color = CATEGORY_COLORS[cat] ?? '#00BBFF';
          // Check if any earned badge matches this category
          const earned = badges?.some((b: { category?: string }) => b.category === cat) ?? false;

          return (
            <group key={cat} position={[col * 0.22, -row * 0.18, 0]}>
              {/* Pedestal */}
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 0.025, 8]} />
                <meshStandardMaterial
                  color={earned ? CHROME_BORDER.colorHex : '#1a1e2e'}
                  metalness={earned ? 0.95 : 0.5}
                  roughness={earned ? 0.1 : 0.5}
                  emissive={color}
                  emissiveIntensity={earned ? EMISSIVE_IDLE_INDICATOR : 0}
                  transparent={!earned}
                  opacity={earned ? 1.0 : GHOST_PLACEHOLDER_OPACITY * 4}
                />
              </mesh>
              {/* Badge icon */}
              <mesh position={[0, 0.03, 0]}>
                <icosahedronGeometry args={[0.025, 1]} />
                <meshStandardMaterial
                  color={earned ? color : '#1a1e2e'}
                  emissive={color}
                  emissiveIntensity={earned ? 0.6 : 0}
                  metalness={earned ? 0.7 : 0.3}
                  roughness={earned ? 0.3 : 0.7}
                  transparent={!earned}
                  opacity={earned ? 1.0 : GHOST_PLACEHOLDER_OPACITY * 3}
                />
              </mesh>
              <Text
                position={[0, -0.05, 0]}
                fontSize={TYPE_SCALE.caption.fontSize * 0.8}
                color={TEXT_COLORS.dim.hex}
                anchorX="center"
                font={TYPE_SCALE.caption.fontPath}
                fillOpacity={earned ? TEXT_COLORS.muted.opacity : TEXT_COLORS.dim.opacity}
              >
                {cat.replace('_', ' ')}
              </Text>
            </group>
          );
        })}
      </group>
    </group>
  );
}
