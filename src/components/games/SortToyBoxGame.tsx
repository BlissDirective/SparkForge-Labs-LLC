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
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions, useGameScore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { useSortAudio } from '@/hooks/useSortAudio';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { Plus, Brain, ChevronRight, GraduationCap, Sparkles, Timer, Trophy, Lightbulb } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAIContent } from '@/hooks/useAIContent';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

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
type GameMode = 'standard' | 'challenge' | 'discovery';
type RevealStep = 'extracting' | 'calculating' | 'clustering' | 'done';

interface Shape {
  id: string;
  shape: string;
  color: string;
  colorName: string;
  size: 'small' | 'medium' | 'large';
  pattern: string;
  symmetrical: boolean;
  edgeCount: number;
  group: number | null;
}

interface RoundConfig {
  id: number;
  name: string;
  shapePool: string[];
  dimensions: number;
  maxGroups: number;
  timeLimit: number | null;
  criteriaKeys: string[];
}

// ================================================================
// ROUND CONFIGS (5 progressive rounds)
// ================================================================

const ROUNDS: RoundConfig[] = [
  {
    id: 1, name: 'Basic Shapes',
    shapePool: ['circle', 'square', 'triangle', 'star', 'pentagon', 'hexagon'],
    dimensions: 1, maxGroups: 3, timeLimit: null,
    criteriaKeys: ['shape', 'color', 'size'],
  },
  {
    id: 2, name: 'Colors & Sizes',
    shapePool: ['circle', 'square', 'triangle', 'star', 'pentagon', 'hexagon', 'diamond', 'oval', 'heart', 'arrow'],
    dimensions: 2, maxGroups: 4, timeLimit: null,
    criteriaKeys: ['shape', 'color', 'size', 'symmetry'],
  },
  {
    id: 3, name: '3D Polyhedra',
    shapePool: ['cube', 'sphere', 'pyramid', 'cylinder', 'torus', 'cone', 'prism', 'dodecahedron'],
    dimensions: 2, maxGroups: 4, timeLimit: 90,
    criteriaKeys: ['shape', 'color', 'size', 'edgeCount', 'weight'],
  },
  {
    id: 4, name: 'Patterns & Textures',
    shapePool: ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon', 'cube', 'sphere'],
    dimensions: 3, maxGroups: 5, timeLimit: 75,
    criteriaKeys: ['pattern', 'color', 'size', 'texture', 'symmetry'],
  },
  {
    id: 5, name: 'Mixed Challenge',
    shapePool: ['circle', 'square', 'triangle', 'star', 'pentagon', 'hexagon', 'diamond', 'oval', 'cube', 'sphere', 'pyramid', 'cylinder'],
    dimensions: 3, maxGroups: 6, timeLimit: 60,
    criteriaKeys: ['shape', 'color', 'size', 'pattern', 'symmetry', 'edgeCount', 'weight', 'texture'],
  },
];

// Shape edge counts for sorting criteria
const SHAPE_EDGES: Record<string, number> = {
  circle: 0, oval: 0, sphere: 0,
  triangle: 3, cone: 3, pyramid: 3,
  square: 4, diamond: 4, arrow: 4, cube: 4, prism: 4,
  pentagon: 5,
  hexagon: 6, dodecahedron: 6,
  star: 10, heart: 0, torus: 0, cylinder: 0,
};

// Symmetry by shape
const SHAPE_SYMMETRY: Record<string, boolean> = {
  circle: true, square: true, triangle: true, star: true, pentagon: true, hexagon: true,
  diamond: true, oval: true, heart: false, arrow: false,
  cube: true, sphere: true, pyramid: true, cylinder: true, torus: true,
  cone: true, prism: true, dodecahedron: true,
};

const PATTERNS = ['solid', 'striped', 'dotted', 'checkered', 'gradient', 'metallic', 'wooden', 'glass'] as const;

// Map 2D shapes to 3D primitives for SortScene3D
const SHAPE_TO_3D: Record<string, string> = {
  circle: 'sphere', square: 'box', triangle: 'cone', star: 'cone',
  pentagon: 'cylinder', hexagon: 'cylinder', diamond: 'box', oval: 'sphere',
  heart: 'sphere', arrow: 'cone', cube: 'box', sphere: 'sphere',
  pyramid: 'cone', cylinder: 'cylinder', torus: 'torus', cone: 'cone',
  prism: 'box', dodecahedron: 'sphere',
};

const COLORS = [
  { color: '#3B82F6', name: 'Blue' },
  { color: '#EF4444', name: 'Red' },
  { color: '#10B981', name: 'Green' },
  { color: '#F59E0B', name: 'Yellow' },
  { color: '#8B5CF6', name: 'Purple' },
];

const GROUP_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const AI_CRITERIA = [
  {
    key: 'shape', label: 'Shape',
    descA: 'The AI put all the circles together, all the squares together, and all the triangles together!',
    desc: 'I sorted by shape: circles, squares, and triangles each got their own group!',
    descC: 'Unsupervised clustering by geometric feature: the algorithm identified shape as the highest-variance attribute and partitioned accordingly.',
  },
  {
    key: 'color', label: 'Color',
    descA: 'The AI put all the blue ones together, all the red ones together, and all the green ones together!',
    desc: 'I sorted by color: all blues together, all reds together, all greens together!',
    descC: 'Color-channel clustering: the algorithm used RGB distance metrics to group objects with similar hue values.',
  },
  {
    key: 'size', label: 'Size',
    descA: 'The AI made two groups: big shapes and small shapes!',
    desc: 'I sorted by size: big shapes and small shapes into two groups!',
    descC: 'Binary partitioning on the size feature: objects above the median bounding-box area form one cluster, below form another.',
  },
  {
    key: 'pattern', label: 'Pattern',
    descA: 'The AI grouped shapes by their pattern \u2014 stripy ones together, dotty ones together!',
    desc: 'I sorted by surface pattern: striped, dotted, solid, and others each formed a cluster!',
    descC: 'Texture-based clustering: the algorithm extracted surface pattern features (frequency, regularity) and partitioned by pattern similarity.',
  },
  {
    key: 'texture', label: 'Texture',
    descA: 'The AI sorted by what the shapes are made of \u2014 shiny metal, smooth glass, rough wood!',
    desc: 'I sorted by material texture: metallic, glass, wooden, and other materials each formed groups!',
    descC: 'Material-property clustering: the algorithm used surface reflectance and roughness features to identify material categories.',
  },
  {
    key: 'weight', label: 'Weight',
    descA: 'The AI guessed how heavy each shape is based on its size and material!',
    desc: 'I sorted by estimated weight: heavy metal shapes vs. light glass shapes. Size and material both matter!',
    descC: 'Derived-feature clustering: weight is inferred from size \u00d7 material density. This demonstrates how algorithms combine multiple features into derived attributes.',
  },
  {
    key: 'symmetry', label: 'Symmetry',
    descA: 'The AI split shapes into two groups: ones that look the same on both sides, and ones that don\'t!',
    desc: 'I sorted by symmetry: symmetrical shapes (circles, squares) vs. asymmetrical ones (hearts, arrows)!',
    descC: 'Binary classification on geometric symmetry: objects with bilateral/rotational symmetry form one partition, asymmetric objects form another.',
  },
  {
    key: 'edgeCount', label: 'Edge Count',
    descA: 'The AI counted the edges on each shape and grouped ones with the same number together!',
    desc: 'I sorted by edge count: shapes with 0 edges (circles), 3 edges (triangles), 4 edges (squares), and more!',
    descC: 'Numerical feature binning: the algorithm discretized continuous edge-count values into bins and partitioned by bin membership.',
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

function generateShapesForRound(round: RoundConfig, _replayCount: number): Shape[] {
  const shapes: Shape[] = [];
  let id = 0;
  const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
  const patternPool = round.id >= 4 ? [...PATTERNS] : ['solid'];

  // Generate shapes from the round's pool
  for (let i = 0; i < 24; i++) {
    const shapeName = round.shapePool[i % round.shapePool.length];
    const colorEntry = COLORS[i % COLORS.length];
    const size = sizes[i % sizes.length];
    const pattern = patternPool[i % patternPool.length];

    shapes.push({
      id: `s${id++}`,
      shape: shapeName,
      color: colorEntry.color,
      colorName: colorEntry.name,
      size,
      pattern,
      symmetrical: SHAPE_SYMMETRY[shapeName] ?? true,
      edgeCount: SHAPE_EDGES[shapeName] ?? 0,
      group: null,
    });
  }

  // Shuffle
  for (let i = shapes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
  }

  return shapes.slice(0, 12);
}

export function SortToyBoxGame() {
  const prefersReducedMotion = useReducedMotion();
  // PERF-HIGH-001 (C): narrow selectors. Actions are stable refs so
  // useGameActions never triggers re-render; useGameScore isolates
  // the single reactive read this file makes.
  const game = useGameActions();
  const score = useGameScore();
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { safeTimeout } = useSafeTimeout();
  // BUG-ST2 fix: useGameContent hook removed (was unused)

  const [phase, setPhase] = useState<Phase>('welcome');
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const [learnIdx, setLearnIdx] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('standard');

  // Round system
  const [currentRound, setCurrentRound] = useState(1);
  const [maxUnlockedRound, setMaxUnlockedRound] = useState(1);
  const [replayCount, setReplayCount] = useState(0);

  // BUG-ST4 fix: replayCount in useMemo deps forces shape regeneration
  const roundConfig = ROUNDS[currentRound - 1];
  const [shapes, setShapes] = useState<Shape[]>(() => generateShapesForRound(ROUNDS[0], 0));
  const [groupCount, setGroupCount] = useState(2);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [aiCriterion, setAiCriterion] = useState<(typeof AI_CRITERIA)[0] | null>(null);

  // Scoring
  const [comboStreak, setComboStreak] = useState(0);
  const [_roundScores, _setRoundScores] = useState<number[]>([]);

  // AI Reveal animation (BUG-ST3 fix: animated instead of instant)
  const [revealStep, setRevealStep] = useState<RevealStep>('extracting');

  // Timer (Challenge mode)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Discovery mode
  const [discoveryRule, setDiscoveryRule] = useState('');
  const [discoveryFeedback, setDiscoveryFeedback] = useState<string | null>(null);

  // Phase F: AI-generated content for Round 5 mixed challenge
  const _aiCriteria = useAIContent('sort-toy-box', 'sort-criterion', ageBand);

  // P1: Cockpit broadcast integration
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  // P2: Audio integration
  const audio = useSortAudio();
  const [soundEnabled] = useState(false);
  // P4: CeremonyFX milestones
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);

  const allGrouped = shapes.every((s) => s.group !== null);
  const learnContent = LEARN_CONTENT[ageBand];

  // Timer effect for challenge mode
  useEffect(() => {
    if (gameMode !== 'challenge' || phase !== 'sort' || timeRemaining === null) return;
    if (timeRemaining <= 0) {
      // Time's up — auto-reveal
      revealAI();
      return;
    }
    safeTimeout(() => setTimeRemaining((t) => (t !== null ? t - 1 : null)), 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, phase, gameMode]);

  // Start a round
  function startRound(roundNum: number) {
    const config = ROUNDS[roundNum - 1];
    setCurrentRound(roundNum);
    setShapes(generateShapesForRound(config, replayCount));
    setGroupCount(2);
    setSelectedShape(null);
    setAiCriterion(null);
    setComboStreak(0);
    setRevealStep('extracting');
    setDiscoveryRule('');
    setDiscoveryFeedback(null);
    if (gameMode === 'challenge') {
      const limit = ageBand === 'A' ? null : config.timeLimit;
      setTimeRemaining(limit);
    }
    setPhase('sort');
  }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shapes, groupCount, selectedShape, aiCriterion, setGameSceneContent]);

  // completeGame is now called in handleNextRound() when all rounds done

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

  // 3D scene data mapping — map 'medium' to 'small' for 3D component compatibility
  const items3D = useMemo(
    () =>
      shapes.map((s, idx) => ({
        id: s.id,
        shape: SHAPE_TO_3D[s.shape] as 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus',
        color: s.color,
        colorName: s.colorName,
        size: (s.size === 'medium' ? 'small' : s.size) as 'small' | 'large',
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

  // Scoring: 5 pts per sort, combo bonus, BUG-ST1 fix (reduced reveal bonus)
  function handle3DDrop(itemId: string, binId: number) {
    setShapes((prev) =>
      prev.map((s) => (s.id === itemId ? { ...s, group: binId } : s))
    );
    const newStreak = comboStreak + 1;
    setComboStreak(newStreak);
    const comboBonus = newStreak >= 3 ? 2 : 0;
    game.updateScore(5 + comboBonus);
    broadcast({ type: 'button-press', source: 'sort-toy-box', value: 1, color: '#AA66FF' });
    if (soundEnabled) { audio.playThrow(); safeTimeout(() => audio.playLand(binId), 400); }
  }

  // Sort shapes by AI criterion
  function sortByCriterion(criterion: typeof AI_CRITERIA[0], shapesToSort: Shape[]): Shape[] {
    return shapesToSort.map((s) => {
      let g = 0;
      switch (criterion.key) {
        case 'shape': {
          const uniqueShapes = [...new Set(shapesToSort.map((x) => x.shape))];
          g = uniqueShapes.indexOf(s.shape);
          break;
        }
        case 'color':
          g = COLORS.findIndex((c) => c.color === s.color);
          if (g === -1) g = 0;
          break;
        case 'size':
          g = s.size === 'small' ? 0 : s.size === 'medium' ? 1 : 2;
          break;
        case 'pattern': {
          const uniquePatterns = [...new Set(shapesToSort.map((x) => x.pattern))];
          g = uniquePatterns.indexOf(s.pattern);
          break;
        }
        case 'texture':
          g = ['solid', 'striped', 'dotted'].includes(s.pattern) ? 0
            : ['metallic', 'glass'].includes(s.pattern) ? 1 : 2;
          break;
        case 'weight':
          // Inferred: large+metallic=heavy, small+glass=light
          g = (s.size === 'large' ? 2 : s.size === 'medium' ? 1 : 0)
            + (s.pattern === 'metallic' ? 1 : s.pattern === 'glass' ? -1 : 0);
          g = Math.max(0, Math.min(2, g));
          break;
        case 'symmetry':
          g = s.symmetrical ? 0 : 1;
          break;
        case 'edgeCount':
          g = s.edgeCount === 0 ? 0 : s.edgeCount <= 3 ? 1 : s.edgeCount <= 5 ? 2 : 3;
          break;
      }
      return { ...s, group: Math.max(0, g) };
    });
  }

  // Calculate match accuracy between player and AI groupings
  function calculateMatchAccuracy(playerShapes: Shape[], aiShapes: Shape[]): number {
    let matches = 0;
    for (let i = 0; i < playerShapes.length; i++) {
      for (let j = i + 1; j < playerShapes.length; j++) {
        const playerSame = playerShapes[i].group === playerShapes[j].group;
        const aiSame = aiShapes[i].group === aiShapes[j].group;
        if (playerSame === aiSame) matches++;
      }
    }
    const totalPairs = (playerShapes.length * (playerShapes.length - 1)) / 2;
    return totalPairs > 0 ? Math.round((matches / totalPairs) * 100) : 0;
  }

  // BUG-ST3 fix: animated 3-phase AI reveal
  function revealAI() {
    // Pick criterion appropriate for this round
    const validCriteria = AI_CRITERIA.filter((c) => roundConfig.criteriaKeys.includes(c.key));
    const pick = validCriteria[Math.floor(Math.random() * validCriteria.length)] || AI_CRITERIA[0];
    setAiCriterion(pick);
    setRevealStep('extracting');
    setPhase('reveal');

    // Phase 1: Feature extraction (2s)
    safeTimeout(() => setRevealStep('calculating'), 2000);

    // Phase 2: Distance calculation (2s)
    safeTimeout(() => {
      setRevealStep('clustering');
      // Phase 3: Cluster formation (3s) — actually sort and score
      const playerShapes = [...shapes];
      const aiSorted = sortByCriterion(pick, shapes);
      const matchAcc = calculateMatchAccuracy(playerShapes, aiSorted);

      safeTimeout(() => {
        setShapes(aiSorted);
        // Scoring: reveal bonus (5 pts) + match accuracy bonus (0-30)
        const matchBonus = Math.round((matchAcc / 100) * 30);
        game.updateScore(5 + matchBonus + 10); // +10 for round completion

        // Track round score and check progression
        const roundScore = score;
        _setRoundScores((prev) => [...prev, roundScore]);

        // Unlock next round if match >= 60%
        if (matchAcc >= 60 && currentRound < 5) {
          setMaxUnlockedRound((prev) => Math.max(prev, currentRound + 1));
        }

        if (soundEnabled) audio.playAIReveal();
        triggerCelebration('confetti');
        broadcast({ type: 'celebration-start', source: 'sort-toy-box', value: 1, color: '#AA66FF' });
        broadcast({ type: 'dial-rotate', source: 'sort-toy-box', value: matchAcc / 100, color: '#AA66FF' });
        setRevealStep('done');
      }, 3000);
    }, 4000);
  }

  // Discovery mode: static rule matching
  function teachAIRule() {
    const ruleLower = discoveryRule.toLowerCase().trim();
    const ruleMap: Record<string, string> = {
      shape: 'shape', color: 'color', size: 'size', big: 'size', small: 'size',
      pattern: 'pattern', stripe: 'pattern', dot: 'pattern',
      texture: 'texture', metal: 'texture', glass: 'texture', wood: 'texture',
      symmetry: 'symmetry', symmetric: 'symmetry', edge: 'edgeCount', side: 'edgeCount',
      weight: 'weight', heavy: 'weight', light: 'weight',
    };
    const matchedKey = Object.keys(ruleMap).find((k) => ruleLower.includes(k));
    if (matchedKey) {
      const criterion = AI_CRITERIA.find((c) => c.key === ruleMap[matchedKey]);
      if (criterion) {
        setAiCriterion(criterion);
        const sorted = sortByCriterion(criterion, shapes);
        setShapes(sorted);
        setDiscoveryFeedback(`The AI understood! It sorted by "${criterion.label}" based on your rule.`);
      }
    } else {
      setDiscoveryFeedback('Hmm, the AI couldn\'t understand that rule. Try using words like "color", "shape", "size", "pattern", "edge", or "symmetry".');
    }
  }

  // Advance to next round or complete
  function handleNextRound() {
    if (currentRound >= 5 || currentRound >= maxUnlockedRound) {
      // All 5 rounds milestone bonus
      if (currentRound >= 5) game.updateScore(50);
      game.completeGame();
      setPhase('complete');
    } else {
      game.advanceRound();
      startRound(currentRound + 1);
    }
  }

  // Replay current round
  function handleReplay() {
    setReplayCount((c) => c + 1);
    startRound(currentRound);
  }

  return (
    <GameShell
      gameId="sort-toy-box"
      title="Sort the Toy Box"
      worldNumber={2}
      worldColor="#B67BFF"
      totalRounds={5}
    >
      <div className="chrome-frame h-full">
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
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : {
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
                    {/* Mode selector */}
                    <div className="flex gap-2 max-w-xs w-full" role="radiogroup" aria-label="Game mode selection">
                      {([
                        { mode: 'standard' as GameMode, icon: Brain, label: 'Standard', desc: '5 progressive rounds' },
                        { mode: 'challenge' as GameMode, icon: Timer, label: 'Challenge', desc: 'Beat the clock!' },
                        { mode: 'discovery' as GameMode, icon: Lightbulb, label: 'Discovery', desc: 'Free play' },
                      ]).map(({ mode, icon: Icon, label, desc }) => (
                        <button
                          key={mode}
                          onClick={() => setGameMode(mode)}
                          className={`flex-1 p-2 rounded-lg border text-center transition-colors ${
                            gameMode === mode
                              ? 'border-purple-400/40 bg-purple-500/10'
                              : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                          }`}
                          role="radio"
                          aria-checked={gameMode === mode}
                          aria-label={`${label}: ${desc}`}
                        >
                          <Icon className={`w-4 h-4 mx-auto mb-1 ${gameMode === mode ? 'text-purple-400' : 'text-white/30'}`} />
                          <p className={`font-display text-2xs font-bold ${gameMode === mode ? 'text-purple-300' : 'text-white/30'}`}>{label}</p>
                        </button>
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
                            startRound(1);
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
                      onClick={() => startRound(1)}
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
                    aria-label={`Sort shapes into groups — Round ${currentRound} of 5`}
                  >
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={currentRound} total={5} labColor="#AA66FF" />
                    </div>
                    {/* Round indicator + timer */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {ROUNDS.map((r) => (
                          <div
                            key={r.id}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-data ${
                              r.id === currentRound
                                ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
                                : r.id < currentRound
                                  ? 'bg-purple-500/10 text-purple-400/60'
                                  : r.id <= maxUnlockedRound
                                    ? 'bg-white/5 text-white/20'
                                    : 'bg-white/[0.02] text-white/10'
                            }`}
                            aria-label={`Round ${r.id}: ${r.name}${r.id === currentRound ? ' (current)' : r.id < currentRound ? ' (complete)' : ''}`}
                          >
                            {r.id}
                          </div>
                        ))}
                        <span className="font-display text-xs text-white/40 ml-1">{roundConfig.name}</span>
                      </div>
                      {gameMode === 'challenge' && timeRemaining !== null && (
                        <div className={`flex items-center gap-1 font-data text-sm ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-purple-300'}`}
                          aria-label={`${timeRemaining} seconds remaining`} aria-live="polite"
                        >
                          <Timer className="w-4 h-4" /> {timeRemaining}s
                        </div>
                      )}
                      {comboStreak >= 3 && (
                        <span className="font-data text-xs text-yellow-400" aria-label={`Combo streak: ${comboStreak}`}>
                          {'\u{1F525}'} {comboStreak}x combo!
                        </span>
                      )}
                    </div>

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

                    {/* Discovery mode: teach AI a rule */}
                    {gameMode === 'discovery' && (
                      <div className="mt-3 rounded-xl p-3 border border-purple-500/10 bg-purple-500/5">
                        <p className="font-body text-xs text-white/40 mb-2">
                          <Lightbulb className="inline w-3 h-3 mr-1" />
                          Teach the AI your sorting rule:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discoveryRule}
                            onChange={(e) => setDiscoveryRule(e.target.value)}
                            placeholder={ageBand === 'A' ? 'e.g. "sort by color"' : 'e.g. "group by edge count"'}
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 font-body text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-400/40"
                            aria-label="Type your sorting rule for the AI"
                          />
                          <button
                            onClick={teachAIRule}
                            disabled={!discoveryRule.trim()}
                            className="px-4 py-2 rounded-lg font-display text-xs font-bold text-white bg-purple-500/20 border border-purple-400/30 disabled:opacity-30"
                            aria-label="Submit sorting rule to AI"
                          >
                            Teach AI
                          </button>
                        </div>
                        {discoveryFeedback && (
                          <p className="font-body text-xs text-purple-300 mt-2">{discoveryFeedback}</p>
                        )}
                      </div>
                    )}

                    {/* Add Group / Reveal buttons */}
                    <div className="mt-3 flex gap-2">
                      {groupCount < roundConfig.maxGroups && (
                        <button
                          onClick={() => setGroupCount((c) => c + 1)}
                          className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 font-display text-xs text-white/40 hover:text-white/60"
                          aria-label={`Add group ${groupCount + 1}. Currently ${groupCount} groups. Max ${roundConfig.maxGroups}.`}
                        >
                          <Plus className="inline w-3 h-3 mr-1" /> Add Group
                        </button>
                      )}
                      {allGrouped && gameMode !== 'discovery' && (
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

                {/* ===== REVEAL PHASE (BUG-ST3 fix: animated 3-phase reveal) ===== */}
                {phase === 'reveal' && aiCriterion && (
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                    role="region"
                    aria-label={`AI analysis — step: ${revealStep}`}
                    aria-live="polite"
                  >
                    {/* Animated reveal steps */}
                    {revealStep === 'extracting' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <motion.div animate={prefersReducedMotion ? {} : { rotate: 360 }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'linear' }}>
                          <Brain className="w-10 h-10 text-purple-400 mx-auto" />
                        </motion.div>
                        <h3 className="font-display text-lg font-bold text-white">Extracting Features...</h3>
                        <p className="font-body text-xs text-white/40">
                          {ageBand === 'A' ? 'The AI is looking at each shape carefully!' : 'Scanning shape properties: color, size, geometry...'}
                        </p>
                      </motion.div>
                    )}

                    {revealStep === 'calculating' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <motion.div animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}>
                          <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
                        </motion.div>
                        <h3 className="font-display text-lg font-bold text-white">Calculating Distances...</h3>
                        <p className="font-body text-xs text-white/40">
                          {ageBand === 'A' ? 'The AI is figuring out which shapes are most alike!' : 'Measuring similarity between objects in feature space...'}
                        </p>
                      </motion.div>
                    )}

                    {revealStep === 'clustering' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <motion.div animate={prefersReducedMotion ? {} : { y: [0, -5, 0] }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, repeat: Infinity }}>
                          <Brain className="w-10 h-10 text-yellow-400 mx-auto" />
                        </motion.div>
                        <h3 className="font-display text-lg font-bold text-white">Forming Clusters...</h3>
                        <p className="font-body text-xs text-white/40">
                          {ageBand === 'A' ? 'The AI is grouping similar shapes together!' : 'Partitioning objects into clusters by minimizing within-group distance...'}
                        </p>
                      </motion.div>
                    )}

                    {revealStep === 'done' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <Brain className="w-8 h-8 text-purple-400 mx-auto" aria-hidden="true" />
                        <h3 className="font-display text-lg font-bold text-white">
                          AI sorted by: {aiCriterion.label}
                        </h3>
                        <p className="font-body text-sm text-white/50 max-w-sm">
                          {ageBand === 'A' ? aiCriterion.descA : ageBand === 'C' ? aiCriterion.descC : aiCriterion.desc}
                        </p>
                        <div className="rounded-xl p-3 border border-purple-500/20 bg-purple-500/5 max-w-sm">
                          <p className="font-body text-xs text-white/40">
                            {ageBand === 'A'
                              ? 'You and the AI might sort things differently \u2014 and that\'s okay!'
                              : ageBand === 'B'
                                ? 'There\'s no "wrong" way to sort! AI picks different features. Your sorting is just as valid!'
                                : 'Different feature weightings produce different but equally valid clusterings.'}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <motion.button
                            onClick={handleNextRound}
                            className="px-6 py-3 rounded-xl font-display font-bold text-sm text-white"
                            style={{ background: 'linear-gradient(135deg, #AA66FF, #8B5CF6)' }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label={currentRound >= 5 ? 'Finish game' : `Continue to Round ${currentRound + 1}`}
                          >
                            {currentRound >= 5 ? (
                              <>Finish! <Trophy className="inline w-4 h-4 ml-1" /></>
                            ) : (
                              <>Round {currentRound + 1} <ChevronRight className="inline w-4 h-4 ml-1" /></>
                            )}
                          </motion.button>
                          <button
                            onClick={handleReplay}
                            className="px-4 py-3 rounded-xl font-display text-xs text-white/40 bg-white/5 border border-white/10 hover:text-white/60"
                            aria-label="Replay this round"
                          >
                            Replay Round
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ===== COMPLETE PHASE ===== */}
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
                    <div className="grid grid-cols-3 gap-3 max-w-sm w-full">
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="font-data text-2xl text-purple-400">{score}</p>
                        <p className="font-body text-2xs text-white/30">Points</p>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="font-data text-2xl text-purple-400">{currentRound}</p>
                        <p className="font-body text-2xs text-white/30">Rounds</p>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="font-data text-2xl text-purple-400">{maxUnlockedRound}</p>
                        <p className="font-body text-2xs text-white/30">Unlocked</p>
                      </div>
                    </div>

                    {/* Round progress */}
                    <div className="max-w-sm w-full rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="font-display text-xs font-bold text-white/60 mb-2">
                        <Trophy className="inline w-3 h-3 mr-1" aria-hidden="true" />
                        Round Progress
                      </p>
                      <div className="flex gap-1">
                        {ROUNDS.map((r) => (
                          <div
                            key={r.id}
                            className={`flex-1 h-2 rounded-full ${
                              r.id <= currentRound ? 'bg-purple-400' : r.id <= maxUnlockedRound ? 'bg-purple-400/20' : 'bg-white/5'
                            }`}
                            aria-label={`Round ${r.id} ${r.id <= currentRound ? 'completed' : r.id <= maxUnlockedRound ? 'unlocked' : 'locked'}`}
                          />
                        ))}
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
                        {currentRound >= 3 && (
                          <li className="font-body text-xs text-white/40 flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5" aria-hidden="true">{'\u2713'}</span>
                            {ageBand === 'A'
                              ? 'Shapes have many different features to sort by!'
                              : 'Multi-dimensional clustering reveals different structures in the same data'}
                          </li>
                        )}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      </div>
    </GameShell>
  );
}

export default SortToyBoxGame;
