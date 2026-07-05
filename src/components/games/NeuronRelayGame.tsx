// ════════════════════════════════════════════════════════════════════════
// NEURON RELAY v4 — Lab 3 (The Brain Inside) — CONNECT archetype (Wave 1)
// ════════════════════════════════════════════════════════════════════════
// Was a four-slider simulation. Now you WIRE the signal path: drag edges from
// the input neuron, through the hidden layers, to the output. Correct wires
// light green and carry the signal; wrong wires glow red. Build the full path
// to fire the network. Pixi CONNECT scene inside GameShell.
//
// Teaches: neurons pass signals along weighted connections; routing a path
// through layers is how a network turns input into output.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Zap, GraduationCap, Target, RotateCcw, Sparkles,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import {
  GlowingTitle, ScoreDisplay, ComboCounter, FeedbackPopup,
} from '@/components/games/shared/GameVisualKit';
import type { BoardNode } from '@/components/games/pixi/PixiConnectStage';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiConnectStage = dynamic(() => import('@/components/games/pixi/PixiConnectStage'), {
  ssr: false,
  loading: () => <PixiStageSkeleton />,
});

const LAB_COLOR = '#FF70AF';
const GOOD = 0x2ecc71;
const BAD = 0xff4d4d;

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Single Signal', description: 'Send one signal through a neuron!', emoji: '⚡', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 50 },
  { id: 2, name: 'Two Paths', description: 'Choose the path that reaches the output.', emoji: '🔀', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 60 },
  { id: 3, name: 'Signal Boost', description: 'Route through the booster neuron.', emoji: '🔋', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 70 },
  { id: 4, name: 'Hidden Layer', description: 'Wire across a full hidden layer.', emoji: '🚦', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 80 },
  { id: 5, name: 'Skip Connection', description: 'Find the path that carries the signal.', emoji: '📉', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 90 },
  { id: 6, name: 'Backprop Path', description: 'Trace the signal back to the start.', emoji: '↩️', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'Deep Network', description: 'Navigate four layers to the output.', emoji: '🏗️', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'Parallel Paths', description: 'Split and merge two signal routes.', emoji: '🔀', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'Noise Filter', description: 'Avoid the dead-end noise neurons.', emoji: '🔇', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'Neural Master', description: 'Wire the deepest network of all.', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'A neuron passes its signal along a connection. Wire input → neuron → output to fire it.',
  2: 'Networks route signals through paths. Only some paths actually reach the output.',
  3: 'Some neurons amplify weak signals. Routing through a booster strengthens the relay.',
  4: 'A hidden layer sits between input and output. The signal must cross it to arrive.',
  5: 'A skip connection is a shortcut path. Pick the route that genuinely carries the signal.',
  6: 'Backpropagation traces signals backward through the same connections to learn.',
  7: 'Deep networks stack many layers — each one a hop the signal must take in order.',
  8: 'Parallel paths split the signal and merge it again, processing inputs together.',
  9: 'Regularization ignores noisy neurons. Wire around the dead ends to stay clean.',
  10: 'Master relay: route the signal across every layer, cleanly, to the output.',
};

// ════════════════════════════════════════════════════════════════════════
// NETWORK SPECS — layered nodes + the correct signal path
// ════════════════════════════════════════════════════════════════════════
interface Network { nodes: BoardNode[]; correct: [string, string][]; pathLabels: string; }

// Build a layered network from columns of {id,label}; the path is the list of
// node ids that must be wired in order. Decoy nodes are columns members not on
// the path. Positions are derived as percentages within the stage.
function layered(cols: { id: string; label: string }[][], pathIds: string[]): Network {
  const nodes: BoardNode[] = [];
  const nCols = cols.length;
  cols.forEach((col, ci) => {
    const x = nCols === 1 ? 50 : (ci / (nCols - 1)) * 82 + 9;
    col.forEach((n, ri) => {
      const y = col.length === 1 ? 50 : (ri / (col.length - 1)) * 70 + 15;
      nodes.push({ id: n.id, label: n.label, x, y, color: undefined });
    });
  });
  const correct: [string, string][] = [];
  for (let i = 0; i < pathIds.length - 1; i++) correct.push([pathIds[i], pathIds[i + 1]]);
  const pathLabels = pathIds
    .map((id) => cols.flat().find((n) => n.id === id)?.label ?? id)
    .join(' → ');
  return { nodes, correct, pathLabels };
}

function getNetwork(levelId: number): Network {
  const IN = { id: 'in', label: 'Input' };
  const OUT = { id: 'out', label: 'Output' };
  switch (levelId) {
    case 1:
      return layered([[IN], [{ id: 'n1', label: 'Neuron' }], [OUT]], ['in', 'n1', 'out']);
    case 2:
      return layered(
        [[IN], [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], [OUT]],
        ['in', 'a', 'out'],
      );
    case 3:
      return layered(
        [[IN], [{ id: 'weak', label: 'Weak' }, { id: 'boost', label: 'Booster' }], [OUT]],
        ['in', 'boost', 'out'],
      );
    case 4:
      return layered(
        [[IN], [{ id: 'h1', label: 'H1' }, { id: 'h2', label: 'H2' }, { id: 'h3', label: 'H3' }], [OUT]],
        ['in', 'h2', 'out'],
      );
    case 5:
      return layered(
        [[IN], [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }], [{ id: 'z', label: 'Z' }, { id: 'w', label: 'W' }], [OUT]],
        ['in', 'x', 'z', 'out'],
      );
    case 6:
      return layered(
        [[IN], [{ id: 'p', label: 'P' }, { id: 'q', label: 'Q' }], [{ id: 'r', label: 'R' }], [OUT]],
        ['in', 'q', 'r', 'out'],
      );
    case 7:
      return layered(
        [[IN], [{ id: 'l1', label: 'L1' }, { id: 'l1b', label: 'L1b' }], [{ id: 'l2', label: 'L2' }, { id: 'l2b', label: 'L2b' }], [{ id: 'l3', label: 'L3' }], [OUT]],
        ['in', 'l1', 'l2', 'l3', 'out'],
      );
    case 8:
      return layered(
        [[IN], [{ id: 's1', label: 'Split-1' }, { id: 's2', label: 'Split-2' }], [{ id: 'm', label: 'Merge' }], [OUT]],
        ['in', 's1', 'm', 'out'],
      );
    case 9:
      return layered(
        [[IN], [{ id: 'c', label: 'Clean' }, { id: 'noise', label: 'Noise' }], [{ id: 'f', label: 'Filter' }, { id: 'noise2', label: 'Noise2' }], [OUT]],
        ['in', 'c', 'f', 'out'],
      );
    case 10:
    default:
      return layered(
        [[IN], [{ id: 'd1', label: 'D1' }, { id: 'd1b', label: 'D1b' }], [{ id: 'd2', label: 'D2' }], [{ id: 'd3', label: 'D3' }, { id: 'd3b', label: 'D3b' }], [OUT]],
        ['in', 'd1', 'd2', 'd3', 'out'],
      );
  }
}

const edgeKey = (a: string, b: string) => [a, b].sort().join('-');

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the CONNECT wiring board
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'wire'>('welcome');
  const net = useMemo(() => getNetwork(level.id), [level.id]);
  const correctSet = useMemo(() => new Set(net.correct.map(([a, b]) => edgeKey(a, b))), [net]);
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrongWires, setWrongWires] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const correctTotal = net.correct.length;
  const maxScore = correctTotal * 10 + 20;

  const correctPlaced = useMemo(
    () => connections.filter(([a, b]) => correctSet.has(edgeKey(a, b))).length,
    [connections, correctSet],
  );
  const allWired = correctPlaced >= correctTotal;

  const edgeColors = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [a, b] of connections) {
      const k = edgeKey(a, b);
      map[k] = correctSet.has(k) ? GOOD : BAD;
    }
    return map;
  }, [connections, correctSet]);

  const handleConnect = useCallback((a: string, b: string) => {
    const k = edgeKey(a, b);
    if (connections.some(([c, d]) => edgeKey(c, d) === k)) return;
    const next: [string, string][] = [...connections, [a, b]];
    setConnections(next);

    if (correctSet.has(k)) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Signal flows! +${gained}` });
      juice.onCorrect(correctPlaced + 1, nextScore);
    } else {
      setCombo(0);
      setWrongWires((w) => w + 1);
      setFeedback({
        type: 'wrong',
        message: 'That wire is a dead end.',
        explanation: 'No signal travels this path — remove it and try a neuron on the route.',
      });
      juice.onWrong(0, score);
    }
  }, [connections, correctSet, combo, score, correctPlaced, juice]);

  const handleRun = useCallback(() => {
    const completion = allWired ? 20 : Math.round((correctPlaced / correctTotal) * 10);
    const penalty = Math.min(score, wrongWires * 4);
    const total = Math.max(0, score + completion - penalty);
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    setFeedback({ type: allWired ? 'correct' : 'info', message: allWired ? 'Network fired!' : 'Partial signal reached the output.' });
    setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 1200);
  }, [allWired, correctPlaced, correctTotal, score, wrongWires, level, maxScore, onComplete]);

  const resetWires = useCallback(() => {
    setConnections([]);
    setScore(0);
    setCombo(0);
    setWrongWires(0);
    setFeedback(null);
  }, []);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="⚡" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Goal:</strong> Wire the signal from Input to Output. Drag from one neuron to the next.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('wire')}>
          Start Wiring <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ WIRE ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="⚡" color={LAB_COLOR}>Wire the Signal</GlowingTitle>
        <span className="text-sm font-bold" style={{ color: LAB_COLOR }}>
          <Zap className="w-4 h-4 inline mr-1" />{correctPlaced} / {correctTotal}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <PixiConnectStage
        nodes={net.nodes}
        connections={connections}
        onConnect={handleConnect}
        edgeColors={edgeColors}
        labColor={LAB_COLOR}
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={handleRun} disabled={correctPlaced === 0}>
          <Sparkles className="w-4 h-4 mr-2" />
          {allWired ? 'Run Network' : 'Fire what I have'}
        </SFButton>
        <SFButton variant="outline" onClick={resetWires} aria-label="Reset wiring">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">✕</SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function NeuronRelayGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('neuron-relay', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Neuron Relay" color={LAB_COLOR} labNum={3}>
      <GameLevelSystem
        gameTitle="Neuron Relay"
        gameEmoji="⚡"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
