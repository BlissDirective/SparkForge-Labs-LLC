'use client';

// ════════════════════════════════════════════════════════════════
// ArcadePanel — Game Arcade Center Content
// ════════════════════════════════════════════════════════════════
// Decision 26.1: Curved grid — tiles follow CenterViewportScreen surface, paginated (12/page)
// Decision 26.2: Filter in HUD frame — lab filters in top segment of peripheral HUD
// Decision 26.3: Tile content — name + tier indicator (F/FL/S) + completion dot

import { useMemo, useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { Color, Mesh, MeshStandardMaterial } from 'three';
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

// ═══ Search Field sub-component ═══════════════════════════════

const SEARCH_WIDTH = 0.6;
const SEARCH_HEIGHT = 0.06;
const SEARCH_ACCENT = '#00BBFF';

function SearchField3D({
  value, onChange, focused, onFocus,
}: {
  value: string; onChange: (v: string) => void; focused: boolean; onFocus: () => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const accentC = useMemo(() => new Color(SEARCH_ACCENT), []);
  const chromeC = useMemo(() => new Color('#a8b5c8'), []);

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      mat.emissive = focused ? accentC : chromeC;
      mat.emissiveIntensity = focused ? 0.35 : 0.1;
    }
  });

  useEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
  }, [focused]);

  return (
    <group position={[0.2, 0.62, 0.3]}>
      {/* Border */}
      <mesh ref={meshRef} onClick={onFocus}>
        <boxGeometry args={[SEARCH_WIDTH + 0.004, SEARCH_HEIGHT + 0.004, 0.002]} />
        <meshStandardMaterial color={chromeC} metalness={0.95} roughness={0.1} emissive={chromeC} emissiveIntensity={0.1} />
      </mesh>
      {/* Background */}
      <mesh position={[0, 0, 0.001]} onClick={onFocus}>
        <boxGeometry args={[SEARCH_WIDTH, SEARCH_HEIGHT, 0.002]} />
        <meshStandardMaterial color={new Color('#0a1625')} metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Text */}
      <Text
        position={[-SEARCH_WIDTH / 2 + 0.03, 0, 0.003]}
        fontSize={TYPE_SCALE.caption.fontSize}
        color={value ? TEXT_COLORS.primary.hex : TEXT_COLORS.dim.hex}
        anchorX="left" anchorY="middle"
        font={TYPE_SCALE.caption.fontPath}
        fillOpacity={value ? 1.0 : 0.3}
        maxWidth={SEARCH_WIDTH - 0.06}
      >{value || 'Search games...'}</Text>
      {/* Hidden proxy */}
      <Html position={[0, 0, -10]} style={{ opacity: 0, position: 'absolute', pointerEvents: focused ? 'auto' : 'none' }}>
        <input ref={inputRef} type="text" value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
          onBlur={() => { if (focused) inputRef.current?.focus(); }}
        />
      </Html>
    </group>
  );
}

const COLS = 4;
const _ROWS = 3;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [page, setPage] = useState(0);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  const filteredGames = useMemo(() => {
    let games = GAME_REGISTRY;
    if (filterLab !== null) games = games.filter((g) => g.lab === filterLab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      games = games.filter((g) => g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q));
    }
    return games;
  }, [filterLab, searchQuery]);

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

      {/* ═══ Search Field — 3D input for game filtering ═══ */}
      <SearchField3D
        value={searchQuery}
        onChange={(v) => { setSearchQuery(v); setPage(0); }}
        focused={searchFocused}
        onFocus={() => setSearchFocused(true)}
      />

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
