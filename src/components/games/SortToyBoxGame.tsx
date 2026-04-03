// ================================================================
// SORT THE TOY BOX V3 — Lab 2 (Teaching AI)
// Group shapes however you want, then compare with AI.
// Teaches: unsupervised learning, clustering, features.
//
// S6-HIGH-001: Full ARIA labels on all interactive elements
// S6-HIGH-002: Added learn + complete phases (CLAUDE.md Section 7)
// S6-HIGH-006: Full A/B/C age band differentiation
// S6-WARN-003: Removed dead code (_ShapeIcon, _assignGroup)
// S6-WARN-005: Removed redundant nested phase check
// ================================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { useSortAudio } from '@/hooks/useSortAudio';
import { Plus, Brain, ChevronRight, GraduationCap, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy-load 3D scene (desktop only)
const SortScene3D = dynamic(
  () => import('@/components/3d/SortScene3D').then((m) => m.SortScene3D),
  { ssr: false }
);
// P6-D: 3D AI feature-distance visualization
const SortFeatureViz3D = dynamic(
  () => import('@/components/3d/SortFeatureViz3D'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'sort' | 'reveal' | 'complete';

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
    descA: 'The AI put all the circles together, all the squares together, and all the triangles together!',
    desc: 'I sorted by shape: circles, squares, and triangles each got their own group!',
    descC: 'Unsupervised clustering by geometric feature: the algorithm identified shape as the highest-variance attribute and partitioned accordingly.',
  },
  {
    key: 'color',
    label: 'Color',
    descA: 'The AI put all the blue ones together, all the red ones together, and all the green ones together!',
    desc: 'I sorted by color: all blues together, all reds together, all greens together!',
    descC: 'Color-channel clustering: the algorithm used RGB distance metrics to group objects with similar hue values.',
  },
  {
    key: 'size',
    label: 'Size',
    descA: 'The AI made two groups: big shapes and small shapes!',
    desc: 'I sorted by size: big shapes and small shapes into two groups!',
    descC: 'Binary partitioning on the size feature: objects above the median bounding-box area form one cluster, below form another.',
  },
];

// Age-band differentiated learn content
const LEARN_CONTENT = {
  A: [
    {
      title: 'Sorting is Learning!',
      emoji: '\u{1F9F8}',
      text: 'When you sort your toys, you look at them and decide which ones go together. AI does the same thing!',
    },
    {
      title: 'What Makes Things Similar?',
      emoji: '\u{1F50D}',
      text: 'You might group toys by color, size, or shape. These are called "features" \u2014 the things you look at to decide.',
    },
    {
      title: 'AI Sorts Too!',
      emoji: '\u{1F916}',
      text: 'AI can look at features and sort things into groups all by itself. Let\'s see if you and the AI sort the same way!',
    },
  ],
  B: [
    {
      title: 'Unsupervised Learning',
      emoji: '\u{1F9E0}',
      text: 'When AI sorts things into groups without being told the "right answer," it\'s called unsupervised learning. The AI discovers patterns on its own!',
    },
    {
      title: 'Features & Clusters',
      emoji: '\u{1F4CA}',
      text: 'Features are the properties AI looks at (color, shape, size). A cluster is a group of similar items. Different features create different clusters!',
    },
    {
      title: 'Your Turn vs AI',
      emoji: '\u2696\uFE0F',
      text: 'There\'s no single "correct" way to cluster. Your sorting and the AI\'s sorting might be different \u2014 and both can be valid!',
    },
  ],
  C: [
    {
      title: 'Unsupervised Clustering Algorithms',
      emoji: '\u{1F9EC}',
      text: 'K-means, DBSCAN, and hierarchical clustering are algorithms that partition data without labels. They optimize for intra-cluster similarity and inter-cluster distance.',
    },
    {
      title: 'Feature Space & Distance Metrics',
      emoji: '\u{1F4D0}',
      text: 'Each object is a point in feature space (color, shape, size as dimensions). Clustering algorithms use distance metrics (Euclidean, Manhattan, cosine) to measure similarity.',
    },
    {
      title: 'No Ground Truth',
      emoji: '\u{1F52C}',
      text: 'Unlike supervised learning, there\'s no labeled "correct answer." Different feature weightings produce different but equally valid partitions. This is a core ML insight.',
    },
  ],
};

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

export function SortToyBoxGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('sort-toy-box', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [shapes, setShapes] = useState<Shape[]>(() => generateShapes());
  const [groupCount, setGroupCount] = useState(2);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [aiCriterion, setAiCriterion] = useState<(typeof AI_CRITERIA)[0] | null>(null);

  // P1: Cockpit broadcast integration
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  // P2: Audio integration
  const audio = useSortAudio();
  const [soundEnabled] = useState(false);
  // P4: CeremonyFX milestones
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);

  const allGrouped = shapes.every((s) => s.group !== null);
  const learnContent = LEARN_CONTENT[ageBand];

  // S6-CRIT-002: Register 3D scene content with sceneStore (D3D-B1)
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  useEffect(() => {
    if (phase === 'sort') {
      setGameSceneContent(
        <SortScene3D
          items={items3D}
          bins={bins3D}
          onItemDrop={handle3DDrop}
          onItemMiss={() => {}}
          activeItemId={selectedShape}
          onSelectItem={setSelectedShape}
        />
      );
    } else if ((phase === 'reveal' || phase === 'complete') && aiCriterion) {
      // P6-D: Show AI feature-distance visualization during reveal
      setGameSceneContent(
        <SortFeatureViz3D
          items={shapes.map((s) => ({
            id: s.id,
            color: s.color,
            shape: s.shape,
            size: s.size,
            group: s.group ?? 0,
            position: [0, 0, 0] as [number, number, number],
          }))}
          criterion={aiCriterion.key}
          labColor="#AA66FF"
        />
      );
    }
    return () => setGameSceneContent(null);
  }, [phase, shapes, groupCount, selectedShape, aiCriterion, setGameSceneContent]);

  // Complete game when reaching complete phase
  useEffect(() => {
    if (phase === 'complete') {
      game.completeGame();
    }
  }, [phase, game]);

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

  // 3D scene data mapping
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
        color: GROUP_COLORS[g] || '#AA66FF',
        label: `Group ${g + 1}`,
      })),
    [groupCount]
  );

  function handle3DDrop(itemId: string, binId: number) {
    setShapes((prev) =>
      prev.map((s) => (s.id === itemId ? { ...s, group: binId } : s))
    );
    game.updateScore(2);
    broadcast({ type: 'button-press', source: 'sort-toy-box', value: 1, color: '#AA66FF' });
    if (soundEnabled) { audio.playThrow(); setTimeout(() => audio.playLand(binId), 400); }
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
    if (soundEnabled) audio.playAIReveal();
    triggerCelebration('confetti');
    broadcast({ type: 'celebration-start', source: 'sort-toy-box', value: 1, color: '#AA66FF' });
    broadcast({ type: 'dial-rotate', source: 'sort-toy-box', value: 1.0, color: '#AA66FF' });
    setPhase('reveal');
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
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
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
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" aria-hidden="true" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* ===== WELCOME PHASE ===== */}
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                    role="region"
                    aria-label="Welcome to Sort the Toy Box"
                  >
                    <span className="text-5xl" aria-hidden="true">{'\u{1F9F8}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Sort the Toy Box
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'A'
                        ? 'Sort these fun shapes into groups! Then see how the AI sorts them differently.'
                        : ageBand === 'B'
                          ? 'Sort these shapes into groups however YOU want! Then see how the AI sorts them differently using unsupervised learning.'
                          : 'Explore unsupervised learning \u2014 group objects by any feature, then compare your clustering with the AI\'s approach.'}
                    </p>
                    <div className="flex gap-2 justify-center flex-wrap" aria-label="Concepts covered">
                      {(ageBand === 'A'
                        ? ['Sorting', 'Patterns', 'AI']
                        : ageBand === 'B'
                          ? ['Clustering', 'Features', 'Unsupervised Learning']
                          : ['K-means Clustering', 'Feature Space', 'Distance Metrics']
                      ).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-2xs text-purple-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #AA66FF, #8B5CF6)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Start learning about sorting and clustering"
                    >
                      {ageBand === 'A' ? "Let's Learn!" : 'Start Learning'}{' '}
                      <ChevronRight className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ===== LEARN PHASE (S6-HIGH-002) ===== */}
                {phase === 'learn' && (
                  <motion.div
                    key="learn"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-5"
                    role="region"
                    aria-label={`Learning step ${learnIdx + 1} of ${learnContent.length}`}
                  >
                    <span className="text-5xl" aria-hidden="true">{learnContent[learnIdx].emoji}</span>
                    <h3 className="font-display text-xl font-bold text-white">
                      {learnContent[learnIdx].title}
                    </h3>
                    <p className="font-body text-sm text-white/50 max-w-md leading-relaxed">
                      {learnContent[learnIdx].text}
                    </p>

                    {/* Progress dots */}
                    <div className="flex gap-2" aria-label={`Step ${learnIdx + 1} of ${learnContent.length}`}>
                      {learnContent.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i <= learnIdx ? 'bg-purple-400' : 'bg-white/10'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => {
                          if (learnIdx < learnContent.length - 1) {
                            setLearnIdx((i) => i + 1);
                          } else {
                            setPhase('sort');
                          }
                        }}
                        className="px-8 py-3 rounded-xl font-display font-bold text-sm text-white"
                        style={{
                          background: 'linear-gradient(135deg, #AA66FF, #8B5CF6)',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label={learnIdx < learnContent.length - 1 ? 'Next lesson' : 'Start sorting shapes'}
                      >
                        {learnIdx < learnContent.length - 1
                          ? 'Next \u2192'
                          : 'Open the Toy Box! \u{1F4E6}'}
                      </motion.button>
                    </div>
                    <button
                      onClick={() => setPhase('sort')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                      aria-label="Skip learning and start sorting"
                    >
                      Skip intro {'\u2192'}
                    </button>
                  </motion.div>
                )}

                {/* ===== SORT PHASE ===== */}
                {phase === 'sort' && (
                  <motion.div
                    key="sort"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                    role="region"
                    aria-label="Sort shapes into groups"
                  >
                    <p className="font-body text-xs text-white/30 mb-3 text-center">
                      {ageBand === 'A'
                        ? 'Tap a shape, then tap a group to put it there!'
                        : ageBand === 'B'
                          ? 'Click a shape, then click a bin to sort it. Group by any feature you want!'
                          : 'Partition objects into clusters by selecting features. Click a shape, then a bin.'}
                    </p>

                    {/* 3D scene renders in CockpitCanvas background (D3D-B1) */}
                    <div
                      className="flex-1 rounded-xl overflow-hidden border border-purple-500/10 min-h-[300px] flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.1)' }}
                      aria-label="3D sorting area — shapes visible in background"
                    >
                      <p className="font-body text-2xs text-white/20">
                        {'\u{1F3AE}'} {shapes.filter((s) => s.group !== null).length}/{shapes.length} sorted
                      </p>
                    </div>

                    {/* Add Group / Reveal buttons */}
                    <div className="mt-3 flex gap-2">
                      {groupCount < 4 && (
                        <button
                          onClick={() => setGroupCount((c) => c + 1)}
                          className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 font-display text-xs text-white/40 hover:text-white/60"
                          aria-label={`Add group ${groupCount + 1}. Currently ${groupCount} groups.`}
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
                          aria-label="Reveal how the AI sorted the shapes"
                        >
                          <Brain className="inline w-4 h-4 mr-1" /> See How AI Sorts!
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ===== REVEAL PHASE ===== */}
                {phase === 'reveal' && aiCriterion && (
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                    role="region"
                    aria-label={`AI sorted by ${aiCriterion.label}`}
                  >
                    <Brain className="w-8 h-8 text-purple-400" aria-hidden="true" />
                    <h3 className="font-display text-lg font-bold text-white">
                      AI sorted by: {aiCriterion.label}
                    </h3>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'A'
                        ? aiCriterion.descA
                        : ageBand === 'C'
                          ? aiCriterion.descC
                          : aiCriterion.desc}
                    </p>
                    <div className="rounded-xl p-3 border border-purple-500/20 bg-purple-500/5 max-w-sm">
                      <p className="font-body text-xs text-white/40">
                        {ageBand === 'A'
                          ? 'You and the AI might sort things differently \u2014 and that\'s okay! There\'s no wrong way to sort.'
                          : ageBand === 'B'
                            ? 'There\'s no "wrong" way to sort! AI just picks different features to focus on. Your sorting is just as valid!'
                            : 'In unsupervised learning, the algorithm discovers structure without labeled examples. Different feature weightings produce different but equally valid clusterings.'}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setPhase('complete')}
                      className="px-8 py-3 rounded-xl font-display font-bold text-sm text-white mt-2"
                      style={{
                        background: 'linear-gradient(135deg, #AA66FF, #8B5CF6)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Continue to summary"
                    >
                      See What You Learned! <Sparkles className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ===== COMPLETE PHASE (S6-HIGH-002) ===== */}
                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-5"
                    role="region"
                    aria-label="Game complete — here's what you learned"
                  >
                    <span className="text-6xl" aria-hidden="true">{'\u{1F389}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      {ageBand === 'A' ? 'Great Sorting!' : 'Sort Complete!'}
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-md">
                      {ageBand === 'A'
                        ? 'You\'re a sorting superstar! You learned how AI thinks about grouping things.'
                        : ageBand === 'B'
                          ? 'Nice work! You explored how unsupervised learning finds patterns in data.'
                          : 'You demonstrated hands-on understanding of unsupervised clustering and feature-based partitioning.'}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 max-w-xs w-full">
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="font-data text-2xl text-purple-400">{game.score}</p>
                        <p className="font-body text-2xs text-white/30">Points</p>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="font-data text-2xl text-purple-400">{groupCount}</p>
                        <p className="font-body text-2xs text-white/30">Groups Used</p>
                      </div>
                    </div>

                    {/* What you learned */}
                    <div className="max-w-sm w-full rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="font-display text-sm font-bold text-white mb-2">
                        <GraduationCap className="inline w-4 h-4 mr-1" aria-hidden="true" />
                        What You Learned
                      </p>
                      <ul className="space-y-1.5 text-left">
                        <li className="font-body text-xs text-white/40 flex items-start gap-2">
                          <span className="text-purple-400 mt-0.5" aria-hidden="true">{'\u2713'}</span>
                          {ageBand === 'A'
                            ? 'AI can sort things into groups just like you do'
                            : 'Unsupervised learning finds patterns without labeled data'}
                        </li>
                        <li className="font-body text-xs text-white/40 flex items-start gap-2">
                          <span className="text-purple-400 mt-0.5" aria-hidden="true">{'\u2713'}</span>
                          {ageBand === 'A'
                            ? 'There are many ways to sort the same things'
                            : ageBand === 'B'
                              ? 'Different features lead to different valid clusterings'
                              : 'Feature selection determines cluster boundaries and partition quality'}
                        </li>
                        <li className="font-body text-xs text-white/40 flex items-start gap-2">
                          <span className="text-purple-400 mt-0.5" aria-hidden="true">{'\u2713'}</span>
                          {ageBand === 'A'
                            ? 'Features are the things you look at when sorting'
                            : ageBand === 'B'
                              ? 'No single "correct" clustering exists in unsupervised learning'
                              : 'Intra-cluster similarity vs inter-cluster distance defines clustering quality'}
                        </li>
                      </ul>
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
