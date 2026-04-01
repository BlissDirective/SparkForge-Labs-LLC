'use client';

// ════════════════════════════════════════════════════════════════
// LabDetailPanel — Individual Lab Detail Center Content
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §center_console["/labs/[labId]"]:
//   - LabStructure3D (focused single lab with interior)
//   - Orbiting game cards (HolographicCard array)
//
// Reads labId from cockpitUIStore.centerData or cockpitStore.focusedLabId.

import { Text } from '@react-three/drei';
import { HolographicButton } from '../ui/HolographicButton';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCockpitUIStore } from '@/stores/cockpitUIStore';
import { LAB_COLORS, LAB_NAMES } from '@/config/labs';
import { getGamesByLab } from '@/config/gameRegistry';

export default function LabDetailPanel() {
  const focusedLabId = useCockpitStore((s) => s.focusedLabId);
  const centerData = useCockpitUIStore((s) => s.centerData);
  const labId = (centerData.labId as number) ?? focusedLabId ?? 1;

  const labName = LAB_NAMES[labId] ?? `Lab ${labId}`;
  const labColor = LAB_COLORS[labId] ?? '#00BBFF';
  const games = getGamesByLab(labId);

  return (
    <group name="lab-detail">
      {/* ═══ Lab Title ═══ */}
      <group position={[0, 0.75, 0.4]}>
        <Text
          fontSize={0.05}
          color={labColor}
          anchorX="center"
          font="/fonts/Exo2-Bold.woff2"
        >
          {`Lab ${labId}: ${labName}`}
        </Text>
        <Text
          position={[0, -0.06, 0]}
          fontSize={0.022}
          color="#F0F0F460"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          {`${games.length} games`}
        </Text>
      </group>

      {/* ═══ Game Cards (orbital ring placeholder) ═══ */}
      <group position={[0, 0, 0]}>
        {games.slice(0, 8).map((game, i) => {
          const angle = (i / Math.min(games.length, 8)) * Math.PI * 2 - Math.PI / 2;
          const radius = 0.6;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius * 0.4;
          return (
            <group key={game.slug} position={[x, y, 0.2]}>
              <HolographicButton
                id={`game-${game.slug}`}
                label={game.name}
                color={labColor}
                scale={0.5}
                width={0.18}
                height={0.04}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
}
