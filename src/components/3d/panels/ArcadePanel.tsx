'use client';

// ════════════════════════════════════════════════════════════════
// ArcadePanel — Game Arcade Center Content
// ════════════════════════════════════════════════════════════════
// Decision 26.1: Curved grid — tiles follow CenterViewportScreen surface, paginated (12/page)
// Decision 26.2: Filter in HUD frame — lab filters in top segment of peripheral HUD
// Decision 26.3: Tile content — name + tier indicator (F/FL/S) + completion dot

import { useMemo, useState } from 'react';
import { Text } from '@react-three/drei';
import { HolographicButton } from '../ui/HolographicButton';
import { HolographicCard } from '../ui/HolographicCard';
import { GAME_REGISTRY, type GameRegistryEntry } from '@/config/gameRegistry';
import { LAB_COLORS } from '@/config/labs';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import {
  TYPE_SCALE,
  TEXT_COLORS,
  MAX_VISIBLE_ITEMS,
  NUMERIC_FONT,
} from '@/lib/3d/cockpitDesignTokens';

const COLS = 4;
const ROWS = 3;
const PAGE_SIZE = MAX_VISIBLE_ITEMS.gameGrid; // 12
const GAP_X = 0.22;
const GAP_Y = 0.12;

// Tier label map
const TIER_LABEL: Record<string, string> = {
  flagship: 'F',
  'fl-lite': 'FL',
  standard: 'S',
};

export default function ArcadePanel() {
  const [filterLab, setFilterLab] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const filteredGames = useMemo(() => {
    if (filterLab === null) return GAME_REGISTRY;
    return GAME_REGISTRY.filter((g) => g.lab === filterLab);
  }, [filterLab]);

  const totalPages = Math.ceil(filteredGames.length / PAGE_SIZE);
  const pagedGames = filteredGames.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
          fontSize={TYPE_SCALE.h1.fontSize}
          color={TEXT_COLORS.primary.hex}
          anchorX="center"
          font={TYPE_SCALE.h1.fontPath}
        >
          Game Arcade
        </Text>
        <Text
          position={[0, -0.055, 0]}
          fontSize={TYPE_SCALE.caption.fontSize}
          color={TEXT_COLORS.muted.hex}
          anchorX="center"
          font={TYPE_SCALE.caption.fontPath}
          fillOpacity={TEXT_COLORS.muted.opacity}
        >
          {`${filteredGames.length} games${filterLab ? ` · Lab ${filterLab}` : ''} · Page ${page + 1}/${totalPages || 1}`}
        </Text>
      </group>

      {/* ═══ Lab Filter Buttons — HUD Frame Area (Decision 26.2) ═══ */}
      <group position={[-0.45, 0.62, 0.3]}>
        <HolographicButton
          id="filter-all"
          label="All"
          color={filterLab === null ? '#00BBFF' : '#444444'}
          active={filterLab === null}
          onClick={() => { setFilterLab(null); setPage(0); }}
          position={[0, 0, 0]}
          size="sm"
          scale={0.5}
        />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lab) => (
          <HolographicButton
            key={lab}
            id={`filter-lab-${lab}`}
            label={`${lab}`}
            color={filterLab === lab ? (LAB_COLORS[lab] ?? '#00BBFF') : '#444444'}
            active={filterLab === lab}
            onClick={() => { setFilterLab(lab); setPage(0); }}
            position={[lab * 0.065 + 0.04, 0, 0]}
            size="sm"
            scale={0.5}
          />
        ))}
      </group>

      {/* ═══ Game Grid — Paginated 12/page (Decision 26.1) ═══ */}
      <group position={[-0.33, 0.4, 0.3]}>
        {pagedGames.map((game, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const labColor = LAB_COLORS[game.lab] ?? '#00BBFF';
          const tierLabel = TIER_LABEL[game.tier] ?? 'S';
          return (
            <HolographicCard
              key={game.slug}
              color={labColor}
              title={game.name}
              subtitle={tierLabel}
              onClick={() => handleGameClick(game)}
              position={[col * GAP_X, -row * GAP_Y, 0]}
              width={0.18}
              height={0.09}
              scale={0.9}
            />
          );
        })}
      </group>

      {/* ═══ Pagination Controls ═══ */}
      {totalPages > 1 && (
        <group position={[0, -0.6, 0.4]}>
          <HolographicButton
            id="arcade-prev"
            label="Prev"
            color="#FFAA44"
            size="sm"
            position={[-0.1, 0, 0]}
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          />
          <Text
            fontSize={TYPE_SCALE.caption.fontSize}
            color={TEXT_COLORS.secondary.hex}
            anchorX="center"
            font={NUMERIC_FONT}
          >
            {`${page + 1} / ${totalPages}`}
          </Text>
          <HolographicButton
            id="arcade-next"
            label="Next"
            color="#FFAA44"
            size="sm"
            position={[0.1, 0, 0]}
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          />
        </group>
      )}
    </group>
  );
}
