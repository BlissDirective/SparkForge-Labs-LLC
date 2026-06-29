// ════════════════════════════════════════════════════════════════════════
// CODE BLOCKS v4 — Lab 9 (Code Lab) — CONNECT archetype (Wave 1)
// ════════════════════════════════════════════════════════════════════════
// Was a drag-into-zones sorter. Now you WIRE the program: drag edges from the
// Start block, through each statement in execution order, to the End block.
// Correct wires light green and carry the flow; wrong (out-of-order) wires glow
// red. Build the full sequence to run the program. Pixi CONNECT scene in GameShell.
//
// Teaches: programs run top-to-bottom in sequence; loops, conditions, and
// event handlers chain blocks in a specific order to produce a result.

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

const LAB_COLOR = '#E68E28';
const GOOD = 0x2ecc71;
const BAD = 0xff4d4d;

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Hello World', description: 'Run your first program in order!', emoji: '👋', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 50 },
  { id: 2, name: 'Variables', description: 'Declare, assign, then print.', emoji: '📦', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 60 },
  { id: 3, name: 'If Statements', description: 'Set up, check, then act.', emoji: '❓', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 70 },
  { id: 4, name: 'Loops', description: 'Init, check, body, update — repeat!', emoji: '🔄', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 80 },
  { id: 5, name: 'Functions', description: 'Define a function, then call it.', emoji: '⚙️', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 90 },
  { id: 6, name: 'Lists', description: 'Create, add, then access an item.', emoji: '📋', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'Events', description: 'Listen, then handle the click.', emoji: '🖱️', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'Error Handling', description: 'Try, catch, then recover.', emoji: '🛡️', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'Algorithms', description: 'Wire the sort+search recipe in order.', emoji: '🔍', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'Code Master', description: 'Build the deepest program of all.', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Programs run top-to-bottom in sequence. Wire Start → setup → print → End in order.',
  2: 'Variables store data. You must declare and assign a value before you can use it.',
  3: 'An if-statement checks a condition first, then runs its action only if it is true.',
  4: 'A loop initializes a counter, checks it, runs its body, then updates — then repeats.',
  5: 'A function is reusable code. Define it first, then call it to run the body.',
  6: 'A list holds many items. Create it, add to it, then access an item by its index.',
  7: 'Event handlers wait for something. Register the listener, then run the handler on the event.',
  8: 'Error handling guards risky code: try the action, catch the error, then recover.',
  9: 'Algorithms are ordered recipes. Sort the data first so the search can run correctly.',
  10: 'Master program: chain every block — setup, loop, condition, action — cleanly to the End.',
};

// ════════════════════════════════════════════════════════════════════════
// PROGRAM SPECS — layered blocks + the correct execution sequence
// ════════════════════════════════════════════════════════════════════════
interface Network { nodes: BoardNode[]; correct: [string, string][]; pathLabels: string; }

// Build a layered program from columns of {id,label}; the path is the list of
// block ids that must be wired in execution order. Decoy blocks are column
// members not on the path. Positions are derived as percentages within the stage.
function layered(cols: { id: string; label: string }[][], pathIds: string[]): Network {
  const nodes: BoardNode[] = [];
  const nCols = cols.length;
  cols.forEach((col, ci) => {
    const x = nCols === 1 ? 50 : (ci / (nCols - 1)) * 82 + 9;
    col.forEach((n, ri) => {
      const y = col.length === 1 ? 50 : (ri / (col.length - 1)) * 70 + 15;
      const onPath = pathIds.includes(n.id);
      nodes.push({ id: n.id, label: n.label, x, y, color: onPath ? undefined : '#5A6078' });
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
  const START = { id: 'start', label: 'Start' };
  const END = { id: 'end', label: 'End' };
  switch (levelId) {
    case 1:
      // Hello World: setup → print
      return layered(
        [[START], [{ id: 'setup', label: 'setup' }], [{ id: 'print', label: 'print(msg)' }], [END]],
        ['start', 'setup', 'print', 'end'],
      );
    case 2:
      // Variables: declare → assign → print  (decoy: print before assign)
      return layered(
        [[START], [{ id: 'decl', label: 'x = 5' }], [{ id: 'assign', label: 'y = x + 3' }, { id: 'early', label: 'print(y) (early)' }], [{ id: 'print', label: 'print(y)' }], [END]],
        ['start', 'decl', 'assign', 'print', 'end'],
      );
    case 3:
      // If: set var → check condition → action  (decoy: action before check)
      return layered(
        [[START], [{ id: 'set', label: 'age = 15' }], [{ id: 'cond', label: 'if age >= 13' }, { id: 'act0', label: 'print (no check)' }], [{ id: 'act', label: 'print("Teen")' }], [END]],
        ['start', 'set', 'cond', 'act', 'end'],
      );
    case 4:
      // Loop: init → condition → body → update  (decoy: skip update)
      return layered(
        [[START], [{ id: 'init', label: 'count = 0' }], [{ id: 'check', label: 'while count<5' }], [{ id: 'body', label: 'print(count)' }, { id: 'noupd', label: 'pass (no update)' }], [{ id: 'upd', label: 'count += 1' }], [END]],
        ['start', 'init', 'check', 'body', 'upd', 'end'],
      );
    case 5:
      // Functions: define → call → body  (decoy: call before define)
      return layered(
        [[START], [{ id: 'def', label: 'def greet()' }, { id: 'callfirst', label: 'greet() (early)' }], [{ id: 'call', label: 'greet()' }], [{ id: 'body', label: 'return "hi"' }], [END]],
        ['start', 'def', 'call', 'body', 'end'],
      );
    case 6:
      // Lists: create → add → access  (decoy: access empty list)
      return layered(
        [[START], [{ id: 'create', label: 'nums = []' }], [{ id: 'add', label: 'nums.append(7)' }, { id: 'badaccess', label: 'nums[0] (empty)' }], [{ id: 'access', label: 'nums[0]' }], [END]],
        ['start', 'create', 'add', 'access', 'end'],
      );
    case 7:
      // Events: register listener → handler runs on event  (decoy: handler w/o listener)
      return layered(
        [[START], [{ id: 'listen', label: 'on("click")' }, { id: 'orphan', label: 'handler (no listen)' }], [{ id: 'event', label: 'click fires' }], [{ id: 'handle', label: 'handleClick()' }], [END]],
        ['start', 'listen', 'event', 'handle', 'end'],
      );
    case 8:
      // Error handling: try → catch → recover  (decoys: dead paths)
      return layered(
        [[START], [{ id: 'try', label: 'try: risky()' }, { id: 'norecover', label: 'no try (crash)' }], [{ id: 'catch', label: 'except Error' }, { id: 'ignore', label: 'pass (swallow)' }], [{ id: 'recover', label: 'recover()' }], [END]],
        ['start', 'try', 'catch', 'recover', 'end'],
      );
    case 9:
      // Algorithms: read → sort → search → output  (decoy: search before sort)
      return layered(
        [[START], [{ id: 'read', label: 'data = read()' }], [{ id: 'sort', label: 'sort(data)' }, { id: 'searchfirst', label: 'search (unsorted)' }], [{ id: 'search', label: 'binary_search' }, { id: 'noise', label: 'pass (dead)' }], [{ id: 'out', label: 'print(result)' }], [END]],
        ['start', 'read', 'sort', 'search', 'out', 'end'],
      );
    case 10:
    default:
      // Code Master: setup → loop → condition → action → output
      return layered(
        [[START], [{ id: 'm1', label: 'init data' }, { id: 'm1b', label: 'skip init' }], [{ id: 'm2', label: 'for item in data' }], [{ id: 'm3', label: 'if item.valid' }, { id: 'm3b', label: 'no check' }], [{ id: 'm4', label: 'process(item)' }], [{ id: 'm5', label: 'print(total)' }], [END]],
        ['start', 'm1', 'm2', 'm3', 'm4', 'm5', 'end'],
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Step runs! +${gained}` });
      juice.onCorrect(correctPlaced + 1, nextScore);
    } else {
      setCombo(0);
      setWrongWires((w) => w + 1);
      setFeedback({
        type: 'wrong',
        message: 'That step runs out of order.',
        explanation: 'The program would break here — remove it and wire the block that runs next in sequence.',
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
    setFeedback({ type: allWired ? 'correct' : 'info', message: allWired ? 'Program runs!' : 'Partial program reached the end.' });
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
        <GlowingTitle emoji="💻" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Goal:</strong> Wire the program from Start to End. Drag from one block to the next in execution order.</span>
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
        <GlowingTitle emoji="💻" color={LAB_COLOR}>Wire the Program</GlowingTitle>
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
          {allWired ? 'Run Program' : 'Run what I have'}
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
export default function CodeBlocksGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('code-blocks', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Code Blocks" color="#E68E28" labNum={9}>
      <GameLevelSystem
        gameTitle="Code Blocks"
        gameEmoji="💻"
        labColor="#E945F5"
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
