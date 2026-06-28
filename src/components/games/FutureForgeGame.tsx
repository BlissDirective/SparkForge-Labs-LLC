// ════════════════════════════════════════════════════════════════════════
// FUTURE FORGE v4 — Lab 10 (Future of AI) — CONNECT archetype (Wave 1)
// ════════════════════════════════════════════════════════════════════════
// Was a four-slider future simulation. Now you ASSEMBLE the blueprint: drag
// edges from one invention module to the next, building the chain that brings
// a future AI invention to life. Correct modules light green and lock into the
// build; wrong wires glow red. Complete the chain to forge the invention.
// Pixi CONNECT scene inside GameShell.
//
// Teaches: AI inventions are systems — they combine modules (power, sensors,
// an AI brain, an action) into a chain, and the order you connect them in is
// what turns an idea into something real that changes society.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl" style={{ background: '#0E1428' }} />
  ),
});

const LAB_COLOR = '#E945F5';
const GOOD = 0x2ecc71;
const BAD = 0xff4d4d;

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Smart Home Bot', description: 'Forge an AI that runs a home!', emoji: '🏠', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 50 },
  { id: 2, name: 'AI Tutor', description: 'Build a tutor that personalizes lessons.', emoji: '🏫', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 60 },
  { id: 3, name: 'Health Helper', description: 'Chain sensors to an AI diagnosis.', emoji: '🏥', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 70 },
  { id: 4, name: 'Self-Driving Car', description: 'Wire perception to safe action.', emoji: '🚗', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 80 },
  { id: 5, name: 'Creative Studio', description: 'Turn a prompt into a finished work.', emoji: '🎨', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 90 },
  { id: 6, name: 'Climate Engine', description: 'Forge an AI that models the planet.', emoji: '🌍', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'Space Explorer', description: 'Build an AI probe for deep space.', emoji: '🚀', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'Idea to Launch', description: 'Take an idea through to launch.', emoji: '💡', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'AGI Safeguard', description: 'Forge a superintelligence with brakes.', emoji: '🧠', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'Future Architect', description: 'Assemble the ultimate AI invention.', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Every AI invention is a chain of modules. A smart home needs Power → a Sensor → an AI Brain → an Action.',
  2: 'AI tutors take a Student input, run it through an AI Brain, and produce a personalized Lesson — but a human still inspires.',
  3: 'Health AI chains a Sensor to a Data step to an AI Brain to a Diagnosis. Doctors add empathy the chain cannot.',
  4: 'Self-driving cars wire Cameras → Perception → Planning → safe Steering. Each module must testably hand off to the next.',
  5: 'Creative AI turns a Prompt into a Model into a draft into a finished Work — the chain decides who the author is.',
  6: 'A climate engine pulls Data into a Model into a Forecast into Action. Good inventions help society act wisely.',
  7: 'Space probes need Power → Sensors → an onboard AI Brain → an Action, because they are too far away for humans to drive.',
  8: 'Inventions follow Idea → Prototype → Test → Launch. Skipping Test is how a future AI invention harms people.',
  9: 'Powerful AI needs a safety chain: a Goal → an AI Brain → a Monitor → an Action — the Monitor is the brake society relies on.',
  10: 'Master forge: connect every module — Power, Sensor, AI Brain, Safety, Action — into one invention that helps the world.',
};

// ════════════════════════════════════════════════════════════════════════
// BLUEPRINT SPECS — layered modules + the correct build chain
// ════════════════════════════════════════════════════════════════════════
interface Network { nodes: BoardNode[]; correct: [string, string][]; pathLabels: string; }

// Build a layered blueprint from columns of {id,label}; the chain is the list
// of module ids that must be wired in order. Decoy modules are column members
// not on the chain. Positions are derived as percentages within the stage.
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
  const POWER = { id: 'in', label: 'Power' };
  const ACTION = { id: 'out', label: 'Action' };
  switch (levelId) {
    case 1:
      return layered(
        [[POWER], [{ id: 'sensor', label: 'Sensor' }], [{ id: 'brain', label: 'AI Brain' }], [ACTION]],
        ['in', 'sensor', 'brain', 'out'],
      );
    case 2:
      return layered(
        [[{ id: 'in', label: 'Student' }], [{ id: 'brain', label: 'AI Brain' }, { id: 'random', label: 'Random (dead)' }], [{ id: 'out', label: 'Lesson' }]],
        ['in', 'brain', 'out'],
      );
    case 3:
      return layered(
        [[{ id: 'in', label: 'Sensor' }], [{ id: 'data', label: 'Data' }, { id: 'guess', label: 'Guess (dead)' }], [{ id: 'brain', label: 'AI Brain' }], [{ id: 'out', label: 'Diagnosis' }]],
        ['in', 'data', 'brain', 'out'],
      );
    case 4:
      return layered(
        [[{ id: 'in', label: 'Cameras' }], [{ id: 'percept', label: 'Perception' }, { id: 'h2', label: 'Radio (dead)' }, { id: 'h3', label: 'Horn (dead)' }], [{ id: 'plan', label: 'Planning' }], [{ id: 'out', label: 'Steering' }]],
        ['in', 'percept', 'plan', 'out'],
      );
    case 5:
      return layered(
        [[{ id: 'in', label: 'Prompt' }], [{ id: 'model', label: 'Model' }, { id: 'noise', label: 'Noise (dead)' }], [{ id: 'draft', label: 'Draft' }, { id: 'w', label: 'Spam (dead)' }], [{ id: 'out', label: 'Work' }]],
        ['in', 'model', 'draft', 'out'],
      );
    case 6:
      return layered(
        [[{ id: 'in', label: 'Data' }], [{ id: 'model', label: 'Model' }, { id: 'q', label: 'Hunch (dead)' }], [{ id: 'forecast', label: 'Forecast' }], [{ id: 'out', label: 'Action' }]],
        ['in', 'model', 'forecast', 'out'],
      );
    case 7:
      return layered(
        [[POWER], [{ id: 'sensor', label: 'Sensors' }, { id: 'l1b', label: 'Antenna (dead)' }], [{ id: 'brain', label: 'AI Brain' }, { id: 'l2b', label: 'Camera (dead)' }], [{ id: 'thrust', label: 'Thruster' }], [ACTION]],
        ['in', 'sensor', 'brain', 'thrust', 'out'],
      );
    case 8:
      return layered(
        [[{ id: 'in', label: 'Idea' }], [{ id: 'proto', label: 'Prototype' }, { id: 's2', label: 'Hype (dead)' }], [{ id: 'test', label: 'Test' }], [{ id: 'out', label: 'Launch' }]],
        ['in', 'proto', 'test', 'out'],
      );
    case 9:
      return layered(
        [[{ id: 'in', label: 'Goal' }], [{ id: 'brain', label: 'AI Brain' }, { id: 'noise', label: 'Bias (dead)' }], [{ id: 'monitor', label: 'Monitor' }, { id: 'noise2', label: 'Override (dead)' }], [{ id: 'out', label: 'Action' }]],
        ['in', 'brain', 'monitor', 'out'],
      );
    case 10:
    default:
      return layered(
        [[POWER], [{ id: 'sensor', label: 'Sensor' }, { id: 'd1b', label: 'Light (dead)' }], [{ id: 'brain', label: 'AI Brain' }], [{ id: 'safety', label: 'Safety' }, { id: 'd3b', label: 'Speaker (dead)' }], [ACTION]],
        ['in', 'sensor', 'brain', 'safety', 'out'],
      );
  }
}

const edgeKey = (a: string, b: string) => [a, b].sort().join('-');

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the CONNECT blueprint board
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Module locked in! +${gained}` });
      juice.onCorrect(correctPlaced + 1, nextScore);
    } else {
      setCombo(0);
      setWrongWires((w) => w + 1);
      setFeedback({
        type: 'wrong',
        message: 'Those modules do not connect.',
        explanation: 'This pairing breaks the build chain — remove it and wire a module that comes next in the blueprint.',
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
    setFeedback({ type: allWired ? 'correct' : 'info', message: allWired ? 'Invention forged!' : 'Partial blueprint assembled.' });
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
        <GlowingTitle emoji="🔮" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Goal:</strong> Assemble the invention from start to finish. Drag from one module to the next in the build chain.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('wire')}>
          Start Building <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ WIRE ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🔮" color={LAB_COLOR}>Assemble the Blueprint</GlowingTitle>
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
          {allWired ? 'Forge Invention' : 'Forge what I have'}
        </SFButton>
        <SFButton variant="outline" onClick={resetWires} aria-label="Reset blueprint">
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
export default function FutureForgeGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('future-forge', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Future Forge" color="#E945F5" labNum={10}>
      <GameLevelSystem
        gameTitle="Future Forge"
        gameEmoji="🔮"
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
