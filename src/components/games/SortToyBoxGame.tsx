// ================================================================
// SORT THE TOY BOX V3 — Lab 2 (Teaching AI)
// Group shapes however you want, then compare with AI.
// Teaches: unsupervised learning, clustering, features.
//
// V3 ENHANCEMENTS (Decision 6.3):
// - Desktop: Full 3D throwable primitives via SortScene3D
// - Parabolic arcs on throw, 3D bins with ContactShadows
// - Mobile fallback: Original 2D CSS shapes (V2 behavior)
// - ~2K triangle budget within StationFrame canvas
//
// V2 RETAINED:
// - Chrome bezel, welcome phase, multiple rounds
// - AI explains sorting criteria, age-band depth
// - All game logic, scoring, phases
// ================================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useSceneStore } from '@/stores/sceneStore';
import { Plus, Boxes, Brain } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy-load 3D scene (desktop only)
const SortScene3D = dynamic(
  () => import('@/components/3d/SortScene3D').then((m) => m.SortScene3D),
  { ssr: false }
);

type Phase = 'welcome' | 'sort' | 'reveal';

interface Shape {
  id: string;
  shape: 'circle' | 'square' | 'triangle';
  color: string;
  colorName: string;
  size: 'small' | 'large';
  group: number | null;
}

// Map 2D shapes to 3D primitives for SortScene3D
const SHAPE_TO_3D: Record<string, string> = {
  circle: 'sphere',
  square: 'box',
  triangle: 'cone',
};

const COLORS = [
  { color: '#3B82F6', name: 'Blue' },
  { color: '#EF4444', name: 'Red' },
  { color: '#10B981', name: 'Green' },
];

const GROUP_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

const AI_CRITERIA = [
  {
    key: 'shape',
    label: 'Shape',
    desc: 'I sorted by shape: circles, squares, and triangles each got their own group!',
    descC: 'Unsupervised clustering by geometric feature: the algorithm identified shape as the highest-variance attribute and partitioned accordingly.',
  },
  {
    key: 'color',
    label: 'Color',
    desc: 'I sorted by color: all blues together, all reds together, all greens together!',
    descC: 'Color-channel clustering: the algorithm used RGB distance metrics to group objects with similar hue values.',
  },
  {
    key: 'size',
    label: 'Size',
    desc: 'I sorted by size: big shapes and small shapes into two groups!',
    descC: 'Binary partitioning on the size feature: objects above the median bounding-box area form one cluster, below form another.',
  },
];

function generateShapes(): Shape[] {
  const shapes: Shape[] = [];
  let id = 0;
  (['circle', 'square', 'triangle'] as const).forEach((shape) => {
    COLORS.forEach((c) => {
      (['small', 'large'] as const).forEach((size) => {
        shapes.push({
          id: `s${id++}`,
          shape,
          color: c.color,
          colorName: c.name,
          size,
          group: null,
        });
      });
    });
  });
  // Shuffle
  for (let i = shapes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
  }
  return shapes.slice(0, 12);
}

// ■■■ 2D Shape Icon (mobile fallback) ■■■
function _ShapeIcon({
  shape,
  color,
  size,
}: {
  shape: string;
  color: string;
  size: string;
}) {
  const s = size === 'small' ? 22 : 34;
  if (shape === 'circle')
    return (
      <div
        className="rounded-full"
        style={{ width: s, height: s, background: color }}
      />
    );
  if (shape === 'square')
    return (
      <div
        className="rounded-sm"
        style={{ width: s, height: s, background: color }}
      />
    );
  return (
    <div
      style={{ width: s, height: s }}
      className="flex items-end justify-center"
    >
      <div
        style={{
          borderLeft: `${s / 2}px solid transparent`,
          borderRight: `${s / 2}px solid transparent`,
          borderBottom: `${s}px solid ${color}`,
        }}
      />
    </div>
  );
}

export function SortToyBoxGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  // S6-CRIT-003: Removed redundant startGame call — GameShell already calls
  // startGame("sort-toy-box", 12) on mount with correct totalRounds

  const [phase, setPhase] = useState<Phase>('welcome');
  const [shapes, setShapes] = useState<Shape[]>(() => generateShapes());
  const [groupCount, setGroupCount] = useState(2);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [aiCriterion, setAiCriterion] = useState<(typeof AI_CRITERIA)[0] | null>(null);

  const allGrouped = shapes.every((s) => s.group !== null);

  // S6-CRIT-002: Register 3D scene content with sceneStore (D3D-B1)
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  useEffect(() => {
    if (phase === 'sort') {
      const items = shapes.map((s) => ({
        id: s.id,
        shape: s.shape as 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus',
        color: s.color,
        colorName: s.colorName,
        size: s.size as 'small' | 'large',
        group: s.group,
        position: [0, 0, 0] as [number, number, number],
      }));
      const bins = Array.from({ length: groupCount }, (_, i) => ({
        id: i + 1,
        position: [((i - (groupCount - 1) / 2) * 3), 0, 3] as [number, number, number],
        color: GROUP_COLORS[i] || '#888',
        label: `Group ${i + 1}`,
      }));
      setGameSceneContent(
        <SortScene3D
          items={items}
          bins={bins}
          onItemDrop={(itemId, binId) => {
            setShapes((prev) => prev.map((s) => s.id === itemId ? { ...s, group: binId } : s));
          }}
          onItemMiss={() => {}}
          activeItemId={selectedShape}
          onSelectItem={setSelectedShape}
        />
      );
    }
    return () => setGameSceneContent(null);
  }, [phase, shapes, groupCount, selectedShape, setGameSceneContent]);

  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  // ■■■ 3D scene data mapping ■■■
  const items3D = useMemo(
    () =>
      shapes.map((s, idx) => ({
        id: s.id,
        shape: SHAPE_TO_3D[s.shape] as 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus',
        color: s.color,
        colorName: s.colorName,
        size: s.size,
        group: s.group,
        position: [
          ((idx % 4) - 1.5) * 1.2,
          0.3,
          (Math.floor(idx / 4) - 1) * 1.2 - 1.5,
        ] as [number, number, number],
      })),
    [shapes]
  );

  const bins3D = useMemo(
    () =>
      Array.from({ length: groupCount }, (_, g) => ({
        id: g,
        position: [((g - (groupCount - 1) / 2) * 2), 0, 2] as [number, number, number],
        color: ['#AA66FF', '#3B82F6', '#10B981', '#F59E0B'][g] || '#AA66FF',
        label: `Group ${g + 1}`,
      })),
    [groupCount]
  );

  function _assignGroup(g: number) {
    if (!selectedShape) return;
    setShapes((prev) =>
      prev.map((s) =>
        s.id === selectedShape ? { ...s, group: g } : s
      )
    );
    setSelectedShape(null);
    game.updateScore(2);
  }

  function handle3DDrop(itemId: string, binId: number) {
    setShapes((prev) =>
      prev.map((s) => (s.id === itemId ? { ...s, group: binId } : s))
    );
    game.updateScore(2);
  }

  function revealAI() {
    const pick = AI_CRITERIA[Math.floor(Math.random() * AI_CRITERIA.length)];
    setAiCriterion(pick);
    const sorted = shapes.map((s) => {
      let g = 0;
      if (pick.key === 'shape')
        g = ['circle', 'square', 'triangle'].indexOf(s.shape);
      else if (pick.key === 'color')
        g = COLORS.findIndex((c) => c.color === s.color);
      else g = s.size === 'small' ? 0 : 1;
      return { ...s, group: g };
    });
    setShapes(sorted);
    game.updateScore(20);
    setPhase('reveal');
    setTimeout(() => game.completeGame(), 4000);
  }

  return (
    <GameShell
      gameId="sort-toy-box"
      title="Sort the Toy Box"
      worldNumber={2}
      worldColor="#AA66FF"
      totalRounds={12}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(170,102,255,${
                  0.15 + p.size * 0.06
                }), transparent)`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(170,102,255,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(170,102,255,0.1)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* ■■■ WELCOME PHASE ■■■ */}
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <span className="text-5xl">🧸</span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Sort the Toy Box
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Explore unsupervised learning \u2014 group objects by any feature, then compare your clustering with the AI\'s approach.'
                        : 'Sort these shapes into groups however YOU want! Then see how the AI sorts them differently.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Clustering', 'Features', 'Unsupervised Learning'].map(
                        (t) => (
                          <span
                            key={t}
                            className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-2xs text-purple-300"
                          >
                            {t}
                          </span>
                        )
                      )}
                    </div>
                    <motion.button
                      onClick={() => setPhase('sort')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #AA66FF, #8B5CF6)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Open the Toy Box!{' '}
                      <Boxes className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ■■■ SORT PHASE ■■■ */}
                {phase === 'sort' && (
                  <motion.div
                    key="sort"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    <p className="font-body text-xs text-white/30 mb-3 text-center">
                      Click a shape, then click a bin to throw it!
                    </p>

                    {/* ■■■ 3D VIEW ■■■ */}
                    {phase === 'sort' && (
                      <div className="flex-1 rounded-xl overflow-hidden border border-purple-500/10 min-h-[300px]">
                        <SortScene3D
                          items={items3D}
                          bins={bins3D}
                          onItemDrop={handle3DDrop}
                          onItemMiss={() => {}}
                          activeItemId={selectedShape}
                          onSelectItem={setSelectedShape}
                        />
                      </div>
                    )}

                    {/* Add Group / Reveal buttons */}
                    <div className="mt-3 flex gap-2">
                      {groupCount < 4 && (
                        <button
                          onClick={() => setGroupCount((c) => c + 1)}
                          className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 font-display text-xs text-white/40 hover:text-white/60"
                        >
                          <Plus className="inline w-3 h-3 mr-1" /> Add Group
                        </button>
                      )}
                      {allGrouped && (
                        <motion.button
                          onClick={revealAI}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex-1 py-3 rounded-xl font-display font-bold text-sm text-white"
                          style={{
                            background: 'linear-gradient(135deg, #AA66FF, #8B5CF6)',
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          See How AI Sorts!
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ■■■ REVEAL PHASE ■■■ */}
                {phase === 'reveal' && aiCriterion && (
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <Brain className="w-8 h-8 text-purple-400" />
                    <h3 className="font-display text-lg font-bold text-white">
                      AI sorted by: {aiCriterion.label}
                    </h3>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? aiCriterion.descC
                        : aiCriterion.desc}
                    </p>
                    <div className="rounded-xl p-3 border border-purple-500/20 bg-purple-500/5 max-w-sm">
                      <p className="font-body text-xs text-white/40">
                        {ageBand === 'C'
                          ? 'In unsupervised learning, the algorithm discovers structure without labeled examples. Different feature weightings produce different but equally valid clusterings.'
                          : 'There\'s no "wrong" way to sort! AI just picks different features to focus on. Your sorting is just as valid!'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}

export default SortToyBoxGame;
