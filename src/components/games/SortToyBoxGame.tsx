// ════════════════════════════════════════════════════════════════════════
// SORT THE TOY BOX v5 — Lab 2 Flagship (Honest k-means Redesign)
// ════════════════════════════════════════════════════════════════════════
// The child drags toys into groups. Then the "AI" reveal runs a REAL
// k-means clustering on the toys' declared feature vectors — initialise k
// centroids, assign each toy to its nearest centroid, move centroids to the
// mean of their members, repeat to convergence — and animates the centroids
// MOVING live across every iteration on a 2D projection of the feature space.
//
// Scoring is honest: the child's grouping is compared to the AI's clusters
// via permutation-matched agreement (the best matching between the child's
// group labels and the AI's cluster labels is found first), so a correct
// grouping with different group numbers still scores as correct.
//
// No Math.random feature theatre. No index-modulo fake clustering. No claim
// of an algorithm the game does not run.

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
import { motion, useReducedMotion } from 'motion/react';
import {
  Brain, ChevronRight, Sparkles, RotateCcw, Target, GraduationCap,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, { type LevelConfig, type LevelResult } from '@/components/games/shared/GameLevelSystem';
import {
  ToyItem, TOY_STYLES, ScoreDisplay,
  GlowingTitle, FeedbackPopup, ComboCounter, TimerDisplay,
} from '@/components/games/shared/GameVisualKit';
import type { AgeBand } from '@/types';
import type { SortToy } from '@/components/games/pixi/PixiSortStage';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiSortStage = dynamic(() => import('@/components/games/pixi/PixiSortStage'), {
  ssr: false,
  loading: () => <PixiStageSkeleton />,
});

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════
type Phase = 'welcome' | 'sort' | 'reveal' | 'level-complete';
type FeatureKey = 'type' | 'colorHue' | 'size' | 'roundness';

interface ToyItemData {
  id: string;
  type: string;
  features: Record<FeatureKey, number>; // every feature normalised 0..1
  jitter: number;                       // deterministic 0..1 for 1-D display spread
}

interface LevelData {
  title: string;
  description: string;
  concept: string;
  toyTypes: string[];
  featureKeys: FeatureKey[];
  maxGroups: number;
  timeLimit: number | null;
  challenge?: string;
}

// Effective, age-band-adjusted level configuration.
interface EffectiveConfig {
  toyTypes: string[];
  featureKeys: FeatureKey[];
  maxGroups: number;
  toyCount: number;
  timeLimit: number | null;
}

const FEATURE_LABELS: Record<FeatureKey, string> = {
  type: 'Type', colorHue: 'Color', size: 'Size', roundness: 'Shape',
};

// Distinct, high-contrast cluster palette (max 6 clusters).
const CLUSTER_COLORS = ['#B67BFF', '#4F6EF7', '#2ECC71', '#FDCB6E', '#FF6B35', '#E945F5'];

const LAB_COLOR = '#B67BFF';

// ════════════════════════════════════════════════════════════════════════
// REAL K-MEANS (pure, deterministic, no randomness)
// ════════════════════════════════════════════════════════════════════════
type Vec = number[];

function dist2(a: Vec, b: Vec): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return s;
}

function nearest(p: Vec, centroids: Vec[]): number {
  let best = 0, bestD = Infinity;
  for (let c = 0; c < centroids.length; c++) {
    const d = dist2(p, centroids[c]);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// Farthest-first (maximin) seeding — fully deterministic, spreads centroids
// so the demo shows clean separation without any random initial state.
function seedCentroids(points: Vec[], k: number): Vec[] {
  const chosen: number[] = [0];
  while (chosen.length < k && chosen.length < points.length) {
    let best = -1, bestD = -1;
    for (let i = 0; i < points.length; i++) {
      if (chosen.includes(i)) continue;
      let minD = Infinity;
      for (const ci of chosen) minD = Math.min(minD, dist2(points[i], points[ci]));
      if (minD > bestD) { bestD = minD; best = i; }
    }
    if (best < 0) break;
    chosen.push(best);
  }
  // If there are fewer distinct points than k, pad by cloning the last point.
  while (chosen.length < k) chosen.push(chosen[chosen.length - 1] ?? 0);
  return chosen.map((ci) => [...points[ci]]);
}

export interface KMeansFrame {
  centroids: Vec[];
  assignments: number[]; // cluster index per point (-1 = unassigned)
  note: string;
}

export interface KMeansResult {
  frames: KMeansFrame[];
  finalAssignments: number[];
  iterations: number;
}

// One assign-step frame + one move-step frame per iteration, so the child
// literally watches "reassign … then move the centers …" play out.
export function runKMeans(points: Vec[], k: number, maxIter = 10): KMeansResult {
  const n = points.length;
  const dim = points[0]?.length ?? 1;
  let centroids = seedCentroids(points, k);
  let assignments = new Array<number>(n).fill(-1);
  const frames: KMeansFrame[] = [
    { centroids: centroids.map((c) => [...c]), assignments: [...assignments], note: 'Dropping the cluster centers to start.' },
  ];

  let iterations = 0;
  for (let iter = 0; iter < maxIter; iter++) {
    // ── Assign step ──
    const next = points.map((p) => nearest(p, centroids));
    const changed = next.some((a, i) => a !== assignments[i]);
    assignments = next;
    frames.push({ centroids: centroids.map((c) => [...c]), assignments: [...assignments], note: 'Reassigning each toy to its nearest center.' });

    // ── Update step (mean of members; empty clusters keep their center) ──
    const sums = Array.from({ length: k }, () => new Array<number>(dim).fill(0));
    const counts = new Array<number>(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let d = 0; d < dim; d++) sums[c][d] += points[i][d];
    }
    let moved = 0;
    const updated = centroids.map((c, ci) => {
      if (counts[ci] === 0) return [...c];
      const mean = sums[ci].map((v) => v / counts[ci]);
      moved = Math.max(moved, dist2(mean, c));
      return mean;
    });
    centroids = updated;
    frames.push({ centroids: centroids.map((c) => [...c]), assignments: [...assignments], note: 'Moving each center to the middle of its toys.' });

    iterations = iter + 1;
    if (!changed && moved < 1e-6) break; // converged
  }

  frames[frames.length - 1].note = 'Converged! The clusters are stable.';
  return { frames, finalAssignments: assignments, iterations };
}

// ════════════════════════════════════════════════════════════════════════
// PERMUTATION-MATCHED AGREEMENT (label-invariant scoring)
// ════════════════════════════════════════════════════════════════════════
// Finds the best matching between the child's group labels and the AI's
// cluster labels, then returns the fraction of toys the two agree on. A
// correct grouping numbered differently still scores as fully correct.
export function bestMatchAgreement(
  childAssign: number[], aiAssign: number[], nGroups: number, k: number,
): { matched: number; total: number; agreement: number } {
  const M = Array.from({ length: nGroups }, () => new Array<number>(k).fill(0));
  let total = 0;
  for (let i = 0; i < childAssign.length; i++) {
    const g = childAssign[i], c = aiAssign[i];
    if (g >= 0 && g < nGroups && c >= 0 && c < k) { M[g][c]++; total++; }
  }

  // Max-weight bipartite matching (clusters → distinct groups). k ≤ 6 so a
  // small backtracking search is exact and cheap.
  const usedRow = new Array<boolean>(nGroups).fill(false);
  let best = 0;
  const bt = (c: number, sum: number): void => {
    if (c === k) { best = Math.max(best, sum); return; }
    bt(c + 1, sum); // allow this cluster to stay unmatched
    for (let g = 0; g < nGroups; g++) {
      if (!usedRow[g] && M[g][c] > 0) {
        usedRow[g] = true;
        bt(c + 1, sum + M[g][c]);
        usedRow[g] = false;
      }
    }
  };
  bt(0, 0);

  return { matched: best, total, agreement: total ? best / total : 0 };
}

// ════════════════════════════════════════════════════════════════════════
// LEVELS
// ════════════════════════════════════════════════════════════════════════
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Toy Sorting 101', description: 'Sort toys by their type', emoji: '🧸', difficulty: 'easy', starThresholds: [55, 75, 92], xpReward: 50 },
  { id: 2, name: 'Color Clues', description: 'Group by color', emoji: '🎨', difficulty: 'easy', starThresholds: [55, 75, 92], xpReward: 60 },
  { id: 3, name: 'Size Matters', description: 'Sort by two features', emoji: '📏', difficulty: 'easy', starThresholds: [55, 75, 90], xpReward: 70 },
  { id: 4, name: 'Shape & Form', description: 'Three features to weigh', emoji: '🔷', difficulty: 'medium', starThresholds: [50, 72, 88], xpReward: 80 },
  { id: 5, name: 'Speed Sort', description: 'Sort under time pressure', emoji: '⏱️', difficulty: 'medium', starThresholds: [50, 70, 88], xpReward: 90 },
  { id: 6, name: 'Hidden Features', description: 'Group by what you can see', emoji: '👁️', difficulty: 'medium', starThresholds: [50, 70, 86], xpReward: 100 },
  { id: 7, name: 'AI vs Human', description: 'Match the AI clusters', emoji: '🤖', difficulty: 'hard', starThresholds: [48, 68, 84], xpReward: 120 },
  { id: 8, name: 'Confusing Toys', description: 'Toys that fit many groups', emoji: '😵', difficulty: 'hard', starThresholds: [48, 66, 82], xpReward: 130 },
  { id: 9, name: 'Master Sorter', description: 'All features, all toys', emoji: '🏆', difficulty: 'expert', starThresholds: [46, 64, 80], xpReward: 150 },
  { id: 10, name: 'Cluster Champion', description: 'The ultimate sorting test', emoji: '👑', difficulty: 'expert', starThresholds: [46, 64, 80], xpReward: 200, isBonus: true },
];

const LEVEL_DATA: Record<number, LevelData> = {
  1: { title: 'Toy Sorting 101', description: 'Drag toys into groups. Then watch the AI cluster the very same toys!', concept: 'Grouping means putting similar things together by what they have in common. You decide what makes two toys belong side by side.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot'], featureKeys: ['type'], maxGroups: 3, timeLimit: null },
  2: { title: 'Color Clues', description: 'Toys come in different colors now. Try grouping by color!', concept: 'Color is a feature — a property we can measure as a number. The AI compares features to decide what goes together.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car'], featureKeys: ['colorHue'], maxGroups: 4, timeLimit: null },
  3: { title: 'Size Matters', description: 'Sort by size AND type. Two features at once!', concept: 'Two features means two dimensions. A toy can match on size but differ on type — the AI measures distance across every feature.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block'], featureKeys: ['type', 'size'], maxGroups: 4, timeLimit: null },
  4: { title: 'Shape & Form', description: 'Three features to weigh at the same time.', concept: 'The more features, the trickier grouping gets. k-means puts toys that are close on all features into the same cluster.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'size', 'roundness'], maxGroups: 5, timeLimit: null },
  5: { title: 'Speed Sort', description: 'A time limit! Sort every toy before the clock runs out.', concept: 'Real k-means runs in milliseconds. Sort fast — the AI never rushes.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue'], maxGroups: 4, timeLimit: 40, challenge: 'Sort every toy before time runs out!' },
  6: { title: 'Hidden Features', description: 'Some traits are hard to spot. Group by the ones you can see.', concept: 'Not every trait is easy to notice. The AI can compare features people find hard to eyeball, like exact size.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'size'], maxGroups: 4, timeLimit: null, challenge: 'Group by the traits you can spot!' },
  7: { title: 'AI vs Human', description: 'Try to match the clusters the AI will find.', concept: 'k-means starts with rough guesses and improves them step by step. Can your groups line up with its clusters?', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue', 'size'], maxGroups: 5, timeLimit: 50, challenge: 'Agree with the AI clusterer as much as you can!' },
  8: { title: 'Confusing Toys', description: 'Some toys sit right between two groups. Ambiguity!', concept: 'Some things could fit more than one cluster. Even k-means has to pick the nearest center for the tricky ones.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue', 'size', 'roundness'], maxGroups: 5, timeLimit: null },
  9: { title: 'Master Sorter', description: 'Every feature, every toy, maximum complexity.', concept: 'The more traits you compare, the more ways to group. k-means compares all of them at once to find neat clusters.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue', 'size', 'roundness'], maxGroups: 6, timeLimit: 60 },
  10: { title: 'Cluster Champion', description: 'The ultimate test of sorting mastery.', concept: 'Bring it all together: speed, many features at once, and the tightest clusters you can find.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue', 'size', 'roundness'], maxGroups: 6, timeLimit: 50, challenge: 'The ultimate sorting test!' },
};

// ════════════════════════════════════════════════════════════════════════
// AGE-BAND CONFIG — A: few toys / 1 feature / 2-3 groups. C: more of everything.
// ════════════════════════════════════════════════════════════════════════
function effectiveConfig(levelId: number, band: AgeBand): EffectiveConfig {
  const base = LEVEL_DATA[levelId];
  if (band === 'A') {
    return {
      toyTypes: base.toyTypes.slice(0, Math.min(base.toyTypes.length, 4)),
      featureKeys: [base.featureKeys[0]],
      maxGroups: Math.min(Math.max(base.maxGroups, 2), 3),
      toyCount: Math.min(4 + levelId, 8),
      timeLimit: null, // gentler: no clock for the youngest band
    };
  }
  if (band === 'C') {
    const rich = Array.from(new Set<FeatureKey>([...base.featureKeys, 'type', 'colorHue', 'size', 'roundness'])).slice(0, 4);
    return {
      toyTypes: base.toyTypes,
      featureKeys: rich,
      maxGroups: Math.min(base.maxGroups + 1, 6),
      toyCount: Math.min(8 + levelId, 18),
      timeLimit: base.timeLimit,
    };
  }
  return {
    toyTypes: base.toyTypes,
    featureKeys: base.featureKeys,
    maxGroups: base.maxGroups,
    toyCount: Math.min(6 + levelId, 14),
    timeLimit: base.timeLimit,
  };
}

// Deterministic 0..1 hash from a string (for 1-D display spread only).
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

function generateToys(cfg: EffectiveConfig): ToyItemData[] {
  const toys: ToyItemData[] = [];
  for (let i = 0; i < cfg.toyCount; i++) {
    const type = cfg.toyTypes[i % cfg.toyTypes.length];
    const toyDef = TOY_STYLES[type] || TOY_STYLES.block;
    toys.push({
      id: `toy-${i}`,
      type,
      features: {
        type: cfg.toyTypes.indexOf(type) / Math.max(cfg.toyTypes.length - 1, 1),
        colorHue: (parseInt(toyDef.color.slice(1), 16) % 360) / 360,
        size: type === 'chest' || type === 'train' ? 0.85 : type === 'dice' || type === 'ball' ? 0.35 : 0.6,
        roundness: ['ball', 'dice'].includes(type) ? 1 : ['rocket', 'plane'].includes(type) ? 0.25 : 0.5,
      },
      jitter: hash01(`${type}-${i}`),
    });
  }
  return toys;
}

// ════════════════════════════════════════════════════════════════════════
// 2D PROJECTION SCATTER — points fixed, centroids move each k-means frame
// ════════════════════════════════════════════════════════════════════════
const PAD = 12;
const sx = (v: number) => PAD + v * (100 - 2 * PAD);
const sy = (v: number) => 100 - PAD - v * (100 - 2 * PAD);

function ClusterScatter({
  toys, featureKeys, frame, reducedMotion,
}: {
  toys: ToyItemData[];
  featureKeys: FeatureKey[];
  frame: KMeansFrame;
  reducedMotion: boolean;
}) {
  // Choose the two highest-variance feature dimensions as display axes so the
  // separation the AI actually used is what the child sees.
  const axes = useMemo(() => {
    const variance = featureKeys.map((k) => {
      const vals = toys.map((t) => t.features[k]);
      const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      return vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length || 1);
    });
    const order = featureKeys.map((_, i) => i).sort((a, b) => variance[b] - variance[a]);
    return { xIdx: order[0] ?? 0, yIdx: featureKeys.length >= 2 ? (order[1] ?? 0) : -1 };
  }, [toys, featureKeys]);

  // Static display coords for each toy (feature space → 2D).
  const pts = useMemo(() => toys.map((t) => {
    const vec = featureKeys.map((k) => t.features[k]);
    const x = sx(vec[axes.xIdx] ?? 0.5);
    const y = axes.yIdx >= 0 ? sy(vec[axes.yIdx] ?? 0.5) : sy(t.jitter);
    return { id: t.id, x, y };
  }), [toys, featureKeys, axes]);

  const xLabel = FEATURE_LABELS[featureKeys[axes.xIdx]] ?? 'Feature';
  const yLabel = axes.yIdx >= 0 ? FEATURE_LABELS[featureKeys[axes.yIdx]] : 'spread for clarity';

  // Centroid display coords for the current frame.
  const centroidPos = frame.centroids.map((c, ci) => {
    const cx = sx(c[axes.xIdx] ?? 0.5);
    let cy: number;
    if (axes.yIdx >= 0) {
      cy = sy(c[axes.yIdx] ?? 0.5);
    } else {
      const members = toys.filter((_, i) => frame.assignments[i] === ci);
      const my = members.length ? members.reduce((a, t) => a + t.jitter, 0) / members.length : 0.5;
      cy = sy(my);
    }
    return { cx, cy };
  });

  const spring = reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 120, damping: 18 };

  return (
    <div className="rounded-2xl p-3" style={{ background: '#171A28', border: '1px solid #2A2F45' }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: '#B8C0D8' }}>Feature space (k-means live)</span>
        <span className="text-xs" style={{ color: '#8C94AC' }}>× = cluster center</span>
      </div>
      <svg viewBox="0 0 100 100" width="100%" style={{ height: '18rem' }} role="img"
        aria-label={`Scatter plot of toys by ${xLabel} and ${yLabel}, with ${frame.centroids.length} moving cluster centers.`}>
        {/* axes */}
        <line x1={PAD} y1={100 - PAD} x2={100 - PAD} y2={100 - PAD} stroke="#3A4160" strokeWidth={0.5} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={100 - PAD} stroke="#3A4160" strokeWidth={0.5} />
        {/* points, coloured by current cluster */}
        {pts.map((p, i) => {
          const c = frame.assignments[i];
          const fill = c >= 0 ? CLUSTER_COLORS[c % CLUSTER_COLORS.length] : '#6B7280';
          return (
            <motion.circle
              key={p.id}
              cx={p.x} cy={p.y} r={2.3}
              animate={{ fill }}
              transition={{ duration: reducedMotion ? 0 : 0.4 }}
              stroke="#0D0F1A" strokeWidth={0.4}
            />
          );
        })}
        {/* centroids — animate their position frame to frame */}
        {centroidPos.map((cp, ci) => {
          const color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
          return (
            <motion.g key={ci} animate={{ x: cp.cx, y: cp.cy }} transition={spring}>
              <circle r={4.4} fill="none" stroke={color} strokeWidth={1} opacity={0.9} />
              <line x1={-2.6} y1={-2.6} x2={2.6} y2={2.6} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
              <line x1={-2.6} y1={2.6} x2={2.6} y2={-2.6} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
            </motion.g>
          );
        })}
      </svg>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs" style={{ color: '#8C94AC' }}>↑ {yLabel}</span>
        <span className="text-xs" style={{ color: '#8C94AC' }}>{xLabel} →</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig; band: AgeBand; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const data = LEVEL_DATA[level.id];
  const cfg = useMemo(() => effectiveConfig(level.id, band), [level.id, band]);
  const juice = useJuice();
  const prefersReducedMotion = !!useReducedMotion();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [toys] = useState(() => generateToys(cfg));
  const [groups, setGroups] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(cfg.timeLimit || 60);
  const [sortedCount, setSortedCount] = useState(0);

  // Reveal state
  const [kmeans, setKmeans] = useState<KMeansResult | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [reveal, setReveal] = useState<{ agreementPct: number; matched: number; total: number; stars: 0 | 1 | 2 | 3 } | null>(null);
  const completedRef = useRef(false);

  const labColor = LAB_COLOR;
  const maxScore = toys.length * 10 + 20;
  const allSorted = sortedCount >= toys.length;

  // Feature vectors used by the real clustering.
  const points = useMemo<Vec[]>(
    () => toys.map((t) => cfg.featureKeys.map((k) => t.features[k])),
    [toys, cfg.featureKeys],
  );

  // Toys shaped for the Pixi stage.
  const pixiToys = useMemo<SortToy[]>(
    () => toys.map((t) => {
      const def = TOY_STYLES[t.type] || TOY_STYLES.block;
      return { id: t.id, type: t.type, color: def.color, label: def.label };
    }),
    [toys],
  );

  // Timer — counts down once the sort phase begins.
  useEffect(() => {
    if (phase === 'sort' && cfg.timeLimit) {
      const interval = setInterval(() => {
        setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, cfg.timeLimit]);

  const handleAssign = useCallback((toyId: string, group: number) => {
    if (groups[toyId] !== undefined) return; // already sorted
    setGroups((prev) => ({ ...prev, [toyId]: group }));
    setSortedCount((c) => c + 1);

    // Engagement points only — these do NOT decide stars (agreement does).
    const gained = 10 + combo;
    const nextScore = score + gained;
    setScore(nextScore);
    setCombo((c) => c + 1);
    setFeedback({
      type: 'info',
      message: combo > 2 ? `Placed • ${combo}x streak! +${gained}` : `Placed • +${gained}`,
    });
    juice.onCorrect(sortedCount + 1, nextScore);
  }, [groups, combo, score, sortedCount, juice]);

  const handleReveal = useCallback(() => {
    // Run the REAL k-means on the toys' feature vectors.
    const km = runKMeans(points, cfg.maxGroups);
    const childAssign = toys.map((t) => (groups[t.id] ?? -1));
    const agg = bestMatchAgreement(childAssign, km.finalAssignments, cfg.maxGroups, cfg.maxGroups);
    const agreementPct = Math.round(agg.agreement * 100);
    const th = level.starThresholds;
    const stars: 0 | 1 | 2 | 3 = agreementPct >= th[2] ? 3 : agreementPct >= th[1] ? 2 : agreementPct >= th[0] ? 1 : 0;

    setKmeans(km);
    setFrameIndex(0);
    setReveal({ agreementPct, matched: agg.matched, total: agg.total, stars });
    setPhase('reveal');
  }, [points, cfg.maxGroups, toys, groups, level.starThresholds]);

  // Step through the k-means frames live (reduced-motion jumps to convergence).
  useEffect(() => {
    if (phase !== 'reveal' || !kmeans) return;
    const frames = kmeans.frames;
    if (prefersReducedMotion) { setFrameIndex(frames.length - 1); return; }
    let i = 0;
    setFrameIndex(0);
    const id = setInterval(() => {
      i++;
      if (i >= frames.length) { clearInterval(id); return; }
      setFrameIndex(i);
    }, 1100);
    return () => clearInterval(id);
  }, [phase, kmeans, prefersReducedMotion]);

  // Fire completion exactly once, after the clustering settles.
  useEffect(() => {
    if (phase !== 'reveal' || !kmeans || !reveal || completedRef.current) return;
    if (frameIndex < kmeans.frames.length - 1) return;
    completedRef.current = true;
    const t = setTimeout(() => {
      onComplete({
        score: reveal.agreementPct,
        maxScore: 100,
        stars: reveal.stars,
        xpEarned: level.xpReward * (reveal.stars / 3),
        timeMs: ((cfg.timeLimit || 60) - timeLeft) * 1000,
      });
    }, prefersReducedMotion ? 600 : 2000);
    return () => clearTimeout(t);
  }, [phase, kmeans, reveal, frameIndex, onComplete, level.xpReward, cfg.timeLimit, timeLeft, prefersReducedMotion]);

  const currentFrame = kmeans?.frames[Math.min(frameIndex, kmeans.frames.length - 1)] ?? null;
  const revealDone = !!kmeans && frameIndex >= kmeans.frames.length - 1;

  // ═══ WELCOME PHASE ═══
  if (phase === 'welcome') {
    return (
      <div className="relative">
        <div className="relative z-10 space-y-5">
          <GlowingTitle emoji="📦" color={labColor}>Level {level.id}: {data.title}</GlowingTitle>

          <SFCard variant="elevated" className="p-5">
            <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{data.description}</p>
            <div className="rounded-xl p-3 text-xs" style={{ background: `${labColor}10`, color: labColor }}>
              <GraduationCap className="w-4 h-4 inline mr-1" />
              <strong>Concept:</strong> {data.concept}
            </div>
            <div className="mt-3 rounded-xl p-3 text-xs" style={{ background: `${labColor}08`, color: '#5A6078' }}>
              <Brain className="w-4 h-4 inline mr-1" style={{ color: labColor }} />
              This level clusters on <strong>{cfg.featureKeys.map((k) => FEATURE_LABELS[k]).join(', ')}</strong> into <strong>{cfg.maxGroups}</strong> groups.
            </div>
            {data.challenge && (
              <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Challenge:</strong> {data.challenge}</span>
              </div>
            )}
          </SFCard>

          {/* Preview toys */}
          <div className="flex flex-wrap gap-2 justify-center">
            {cfg.toyTypes.slice(0, 6).map((t) => (
              <ToyItem key={t} toyKey={t} size="sm" />
            ))}
          </div>

          <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
            Start Sorting <ChevronRight className="w-5 h-5 ml-2" />
          </SFButton>
        </div>
      </div>
    );
  }

  // ═══ SORT PHASE ═══
  if (phase === 'sort') {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <GlowingTitle emoji="📦" color={labColor}>Sort Toys</GlowingTitle>
            {cfg.timeLimit && <TimerDisplay seconds={timeLeft} />}
          </div>

          <ScoreDisplay score={score} maxScore={maxScore} />
          <ComboCounter combo={combo} />

          {/* Pixi sort scene — drag toys into group bins (keyboard fallback built in). */}
          <PixiSortStage
            toys={pixiToys}
            groupCount={cfg.maxGroups}
            assignments={groups}
            onAssign={handleAssign}
            labColor={labColor}
            reducedMotion={prefersReducedMotion}
          />

          {feedback && <FeedbackPopup {...feedback} />}

          <div className="flex gap-2">
            <SFButton
              variant="primary"
              className="flex-1"
              onClick={handleReveal}
              disabled={!allSorted}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {allSorted ? 'Run the AI (k-means)' : `Sort ${toys.length - sortedCount} more...`}
            </SFButton>
            <SFButton variant="outline" onClick={onExit}>
              <RotateCcw className="w-4 h-4" />
            </SFButton>
          </div>
        </div>
      </div>
    );
  }

  // ═══ REVEAL PHASE ═══
  if (phase === 'reveal' && kmeans && currentFrame) {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <GlowingTitle emoji="🤖" color={labColor}>AI Clustering — k-means</GlowingTitle>

          {/* Sparky narration — live region announces each k-means step. */}
          <SFCard variant="elevated" className="p-4">
            <div className="flex items-start gap-3" aria-live="polite">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${labColor}18` }}>
                <Brain className="w-4 h-4" style={{ color: labColor }} />
              </div>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: labColor }}>Sparky</p>
                <p className="text-sm" style={{ color: '#1A1D2B' }}>{currentFrame.note}</p>
                <p className="text-xs mt-1" style={{ color: '#8C94AC' }}>
                  Step {Math.min(frameIndex + 1, kmeans.frames.length)} of {kmeans.frames.length}
                  {' • '}moving {currentFrame.centroids.length} centers over the toys' features.
                </p>
              </div>
            </div>
          </SFCard>

          {/* Live 2D projection with moving centroids. */}
          <ClusterScatter
            toys={toys}
            featureKeys={cfg.featureKeys}
            frame={currentFrame}
            reducedMotion={prefersReducedMotion}
          />

          {/* Result — clusters + honest permutation-matched agreement. */}
          {revealDone && reveal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3" aria-live="polite">
              <SFCard variant="elevated" className="p-4 text-center">
                <p className="text-sm" style={{ color: '#5A6078' }}>
                  Your grouping matched the AI's clusters on
                </p>
                <p className="text-3xl font-bold my-1" style={{ color: labColor }}>{reveal.agreementPct}%</p>
                <p className="text-xs" style={{ color: '#8C94AC' }}>
                  {reveal.matched} of {reveal.total} toys agreed — matched by best label pairing, so group numbers don't matter.
                </p>
              </SFCard>

              <p className="text-sm font-semibold" style={{ color: '#1A1D2B' }}>The AI found these clusters:</p>
              {Array.from({ length: cfg.maxGroups }).map((_, gi) => {
                const groupToys = toys.filter((_, i) => kmeans.finalAssignments[i] === gi);
                if (groupToys.length === 0) return null;
                const color = CLUSTER_COLORS[gi % CLUSTER_COLORS.length];
                return (
                  <div key={gi} className="rounded-xl p-3" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
                    <span className="text-xs font-bold mb-2 block" style={{ color }}>Cluster {gi + 1} ({groupToys.length} toys)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {groupToys.map((t) => (
                        <ToyItem key={t.id} toyKey={t.type} size="sm" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function SortToyBoxGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();
  const band: AgeBand = child?.age_band || 'B';

  const handleAllComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('sort-toy-box', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Sort the Toy Box" color="#B67BFF" labNum={2}>
      <GameLevelSystem
        gameTitle="Sort the Toy Box"
        gameEmoji="📦"
        labColor="#B67BFF"
        levels={LEVELS}
        onComplete={handleAllComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} band={band} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
