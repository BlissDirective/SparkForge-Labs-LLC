'use client';

// ════════════════════════════════════════════════════════════════
// LabDetailPanel — Individual Lab Detail Center Content
// ════════════════════════════════════════════════════════════════
// Decision 30.1: Radial fan — games fanned in semicircle below lab structure
// Decision 30.2: Full 3D lab model — LabStructure3D renders lab diorama

import { Text } from '@react-three/drei';
import { HolographicCard } from '../ui/HolographicCard';
import { useCockpitStore } from '@/stores/cockpitStore';
import { LAB_COLORS, LAB_NAMES } from '@/config/labs';
import { getGamesByLab } from '@/config/gameRegistry';
import {
  TYPE_SCALE,
  TEXT_COLORS,
  NUMERIC_FONT,
} from '@/lib/3d/cockpitDesignTokens';

// Tier label
const TIER_LABEL: Record<string, string> = {
  flagship: 'F', 'fl-lite': 'FL', standard: 'S',
};

export default function LabDetailPanel() {
  const focusedLabId = useCockpitStore((s) => s.focusedLabId);
  const centerData = useCockpitStore((s) => s.centerData);
  const labId = (centerData.labId as number) ?? focusedLabId ?? 1;

  const labName = LAB_NAMES[labId] ?? `Lab ${labId}`;
  const labColor = LAB_COLORS[labId] ?? '#00BBFF';
  const games = getGamesByLab(labId);

  return (
    <group name="lab-detail">
      {/* ═══ Lab Title ═══ */}
      <group position={[0, 0.75, 0.4]}>
        <Text
          fontSize={TYPE_SCALE.h1.fontSize}
          color={labColor}
          anchorX="center"
          font={TYPE_SCALE.h1.fontPath}
        >
          {`Lab ${labId}: ${labName}`}
        </Text>
        <Text
          position={[0, -0.06, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={NUMERIC_FONT}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          {`${games.length} games`}
        </Text>
      </group>

      {/* ═══ Game Cards — Radial Fan Semicircle (Decision 30.1) ═══ */}
      <group position={[0, -0.15, 0.2]}>
        {games.map((game, i) => {
          const totalGames = games.length;
          // Fan games in semicircle below center (180° arc)
          const arcSpan = Math.PI * 0.8; // 144° arc
          const startAngle = -arcSpan / 2;
          const angle = startAngle + (i / Math.max(totalGames - 1, 1)) * arcSpan;
          const radius = 0.55;
          const x = Math.sin(angle) * radius;
          const y = -Math.cos(angle) * radius * 0.3 - 0.1;
          const tierLabel = TIER_LABEL[game.tier] ?? 'S';

          return (
            <HolographicCard
              key={game.slug}
              title={game.name}
              subtitle={tierLabel}
              color={labColor}
              position={[x, y, i * 0.01]}
              width={0.14}
              height={0.07}
              scale={0.8}
            />
          );
        })}
      </group>
    </group>
  );
}
