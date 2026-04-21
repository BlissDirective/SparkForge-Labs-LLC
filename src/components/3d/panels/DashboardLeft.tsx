'use client';

// ════════════════════════════════════════════════════════════════
// DashboardLeft — Player Identity Hub (Left Quadrant, FIXED)
// ════════════════════════════════════════════════════════════════
// Decision 22.1: Hexagonal avatar frame (chrome-bordered, matches floor hexagons)
// Decision 22.2: Vertical gauge stack (4 gauges stacked vertically, car instrument cluster)
// Decision 22.3: 5 recent badges in a row
//
// Always visible. Content is always about WHO YOU ARE.
// Position/rotation handled by CockpitUILayer parent group.

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { RadialDial3D } from '../ui/RadialDial3D';
import { useActiveChild } from '@/hooks/useChildren';
import {
  CHROME_BORDER,
  TYPE_SCALE,
  TEXT_COLORS,
  NUMERIC_FONT,
  EMISSIVE_IDLE_INDICATOR,
  GHOST_PLACEHOLDER_OPACITY,
} from '@/lib/3d/cockpitDesignTokens';

export default function DashboardLeft() {
  // STATE-MED-001 (B-full/T5c-C2): child via React Query cache.
  // `badges` is dead childStore field (always [] — setBadges is never
  // called). Recent-badge strip always renders empty; post-T5c follow-up
  // migrates to useBadges(childId).
  // T5c-C4: stubbed empty badges array preserves prior behavior
  // (strip renders empty). Follow-up: useBadges(childId) integration.
  const child = useActiveChild();
  const badges: Array<{ badge?: { icon?: string; rarity?: string } }> = [];

  const xp = child?.xp ?? 0;
  const xpMax = 500;
  const level = child?.level ?? 1;
  const streak = child?.streak_count ?? 0;

  // Decision 22.3: 5 recent badges
  const recentBadges = useMemo(() => {
    if (!badges || badges.length === 0) return [];
    return badges.slice(-5).reverse();
  }, [badges]);

  // Ghost placeholders for empty badge slots
  const emptySlots = Math.max(0, 5 - recentBadges.length);

  return (
    <group name="dashboard-left">
      {/* ═══ Avatar — Hexagonal Frame (Decision 22.1) ═══ */}
      <group position={[0.15, 0.55, 0.15]}>
        {/* Chrome hexagonal border */}
        <mesh rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.14, 0.14, 0.015, 6]} />
          <meshStandardMaterial
            color={CHROME_BORDER.colorHex}
            metalness={0.95}
            roughness={0.15}
            emissive="#223344"
            emissiveIntensity={CHROME_BORDER.glowIntensity}
          />
        </mesh>
        {/* Inner avatar surface (hexagonal) */}
        <mesh rotation={[0, 0, Math.PI / 6]} position={[0, 0.001, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.012, 6]} />
          <meshStandardMaterial
            color="#0A0F1F"
            metalness={0.6}
            roughness={0.4}
            emissive="#00BBFF"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Player name */}
        <Text
          position={[0, -0.19, 0.01]}
          fontSize={TYPE_SCALE.label.fontSize}
          color={TEXT_COLORS.primary.hex}
          anchorX="center"
          font={TYPE_SCALE.label.fontPath}
        >
          {child?.display_name ?? 'Explorer'}
        </Text>
        {/* Level badge */}
        <Text
          position={[0, -0.22, 0.01]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color="#AA66FF"
          anchorX="center"
          font={NUMERIC_FONT}
        >
          {`LV ${level}`}
        </Text>
      </group>

      {/* ═══ AI Guide Avatar (placeholder) ═══ */}
      <group position={[-0.15, 0.15, 0.35]}>
        <mesh>
          <octahedronGeometry args={[0.06, 2]} />
          <meshStandardMaterial
            color="#AA66FF"
            transparent
            opacity={0.6}
            emissive="#AA66FF"
            emissiveIntensity={EMISSIVE_IDLE_INDICATOR}
          />
        </mesh>
        <Text
          position={[0, -0.1, 0.01]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color="#AA66FF"
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
        >
          AI Guide
        </Text>
      </group>

      {/* ═══ Trophy Display — 5 Recent Badges (Decision 22.3) ═══ */}
      <group position={[0.15, -0.05, 0]}>
        <Text
          position={[0, 0.1, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          RECENT BADGES
        </Text>
        {/* Earned badges */}
        {recentBadges.map((_badge: unknown, i: number) => (
          <group key={i} position={[(i - 2) * 0.08, -0.02, 0]}>
            <mesh>
              <cylinderGeometry args={[0.025, 0.03, 0.015, 6]} />
              <meshStandardMaterial
                color={CHROME_BORDER.colorHex}
                metalness={0.95}
                roughness={0.1}
                emissive="#FFAA44"
                emissiveIntensity={EMISSIVE_IDLE_INDICATOR}
              />
            </mesh>
          </group>
        ))}
        {/* Ghost placeholders for empty slots */}
        {Array.from({ length: emptySlots }, (_, i) => (
          <group key={`ghost-${i}`} position={[(recentBadges.length + i - 2) * 0.08, -0.02, 0]}>
            <mesh>
              <cylinderGeometry args={[0.025, 0.03, 0.015, 6]} />
              <meshStandardMaterial
                color="#1a1e2e"
                metalness={0.5}
                roughness={0.5}
                transparent
                opacity={GHOST_PLACEHOLDER_OPACITY}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ═══ 4 Radial Gauges — Vertical Stack (Decision 22.2) ═══ */}
      <group position={[-0.3, -0.15, 0]}>
        <RadialDial3D
          id="xp_gauge"
          label="XP"
          value={xp}
          max={xpMax}
          onChange={() => {}}
          color="#00BBFF"
          position={[0, 0.33, 0]}
          scale={0.6}
          readOnly
        />
        <RadialDial3D
          id="level_gauge"
          label="LEVEL"
          value={level}
          max={100}
          onChange={() => {}}
          color="#AA66FF"
          position={[0, 0.11, 0]}
          scale={0.6}
          readOnly
        />
        <RadialDial3D
          id="streak_gauge"
          label="STREAK"
          value={streak}
          max={365}
          onChange={() => {}}
          color="#FF6644"
          position={[0, -0.11, 0]}
          scale={0.6}
          readOnly
        />
        <RadialDial3D
          id="progress_gauge"
          label="PROG"
          value={0}
          max={100}
          onChange={() => {}}
          color="#00FF88"
          position={[0, -0.33, 0]}
          scale={0.6}
          readOnly
          formatValue={(v) => `${v}%`}
        />
      </group>
    </group>
  );
}
