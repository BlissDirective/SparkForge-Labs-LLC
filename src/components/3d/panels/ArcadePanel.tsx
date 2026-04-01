'use client';

// ════════════════════════════════════════════════════════════════
// ArcadePanel — Game Arcade Center Content
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §center_console["/arcade"]:
//   - 35-game scrollable grid on CenterViewportScreen surface
//   - Filterable by lab (LED rim changes color)
//   - Shows tier badge, completion star, play count per tile
//
// Renders game tiles as HolographicButton instances arranged in a grid.

import { useMemo, useState } from 'react';
import { Text } from '@react-three/drei';
import { HolographicButton } from '../ui/HolographicButton';
import { GAME_REGISTRY, type GameRegistryEntry } from '@/config/gameRegistry';
import { LAB_COLORS } from '@/config/labs';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

const COLS = 4;
const TILE_W = 0.2;
const TILE_H = 0.05;
const GAP_X = 0.22;
const GAP_Y = 0.065;

export default function ArcadePanel() {
  const [filterLab, setFilterLab] = useState<number | null>(null);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const filteredGames = useMemo(() => {
    if (filterLab === null) return GAME_REGISTRY;
    return GAME_REGISTRY.filter((g) => g.lab === filterLab);
  }, [filterLab]);

  const handleGameClick = (game: GameRegistryEntry) => {
    broadcast({
      type: 'game-enter',
      source: `arcade-${game.slug}`,
      color: LAB_COLORS[game.lab] ?? '#00BBFF',
      label: game.name,
    });
  };

  return (
    <group name="arcade">
      {/* ═══ Title ═══ */}
      <group position={[0, 0.8, 0.4]}>
        <Text
          fontSize={0.045}
          color="#F0F0F4"
          anchorX="center"
          font="/fonts/Exo2-Bold.woff2"
        >
          Game Arcade
        </Text>
        <Text
          position={[0, -0.055, 0]}
          fontSize={0.02}
          color="#F0F0F460"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          {`${filteredGames.length} games${filterLab ? ` · Lab ${filterLab}` : ''}`}
        </Text>
      </group>

      {/* ═══ Lab Filter Buttons ═══ */}
      <group position={[-0.45, 0.6, 0.3]}>
        <HolographicButton
          id="filter-all"
          label="All"
          color={filterLab === null ? '#00BBFF' : '#444444'}
          active={filterLab === null}
          onClick={() => setFilterLab(null)}
          position={[0, 0, 0]}
          scale={0.4}
          width={0.06}
          height={0.03}
        />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lab) => (
          <HolographicButton
            key={lab}
            id={`filter-lab-${lab}`}
            label={`${lab}`}
            color={filterLab === lab ? (LAB_COLORS[lab] ?? '#00BBFF') : '#444444'}
            active={filterLab === lab}
            onClick={() => setFilterLab(lab)}
            position={[lab * 0.065 + 0.04, 0, 0]}
            scale={0.4}
            width={0.05}
            height={0.03}
          />
        ))}
      </group>

      {/* ═══ Game Grid ═══ */}
      <group position={[-0.33, 0.35, 0.3]}>
        {filteredGames.slice(0, 24).map((game, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const labColor = LAB_COLORS[game.lab] ?? '#00BBFF';
          return (
            <HolographicButton
              key={game.slug}
              id={`game-${game.slug}`}
              label={game.name}
              color={labColor}
              onClick={() => handleGameClick(game)}
              position={[col * GAP_X, -row * GAP_Y, 0]}
              scale={0.5}
              width={TILE_W}
              height={TILE_H}
            />
          );
        })}
      </group>
    </group>
  );
}
