// ════════════════════════════════════════════════════════════════════════
// CHATBOT BUILDER v5 — Lab 8 Flagship — CONNECT archetype (Wave 1)
// ════════════════════════════════════════════════════════════════════════
// Was a four-slider NLP simulation. Now you WIRE the dialogue flow: drag edges
// from User Input, through the correct Intent classifier, to the right Response
// branch, and out to the Reply. Correct wires light green and carry the message;
// wrong wires glow red. Build the full path to ship the chatbot. Pixi CONNECT
// scene inside GameShell.
//
// Teaches: a chatbot maps user input → intent → response → reply. Classify the
// message correctly, then route it to the matching response to answer well.

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

const LAB_COLOR = '#FF6B35';
const GOOD = 0x2ecc71;
const BAD = 0xff4d4d;

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Hello Bot', description: 'Wire a greeting straight to its reply!', emoji: '👋', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 50 },
  { id: 2, name: 'FAQ Bot', description: 'Pick the intent that answers the question.', emoji: '❓', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 60 },
  { id: 3, name: 'Intent Matcher', description: 'Classify the message, then reply.', emoji: '🎯', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 70 },
  { id: 4, name: 'Response Branch', description: 'Route through the matching response.', emoji: '🌿', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 80 },
  { id: 5, name: 'Context Memory', description: 'Thread input through intent and context.', emoji: '🧠', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 90 },
  { id: 6, name: 'Personality', description: 'Add a tone stage before the reply.', emoji: '🎭', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'Emotion Aware', description: 'Detect the mood across four stages.', emoji: '❤️', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'Multi-Intent', description: 'Split and merge two intents into one reply.', emoji: '🔀', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'Safety Filter', description: 'Avoid the unsafe response branches.', emoji: '🛡️', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'Bot Master', description: 'Wire the deepest dialogue flow of all.', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'A chatbot maps input to a reply. The simplest just wires a greeting straight to its answer.',
  2: 'FAQ bots classify a question into an intent, then return the matching pre-written answer.',
  3: 'Intent recognition uses NLP to figure out what the user wants — route to the right intent.',
  4: 'Each intent leads to a response branch. Pick the branch that actually answers the message.',
  5: 'Context memory adds a stage that remembers the conversation before forming the reply.',
  6: 'A personality/tone stage shapes how the reply sounds before it reaches the user.',
  7: 'Emotion detection reads the mood, then routes the reply through a feeling-aware stage.',
  8: 'Multi-intent messages split into parallel intents and merge back into one reply.',
  9: 'Safety filters skip unsafe responses. Wire around the blocked branches to stay safe.',
  10: 'Master bot: classify, remember, choose tone, and reply — thread every stage cleanly.',
};

// ════════════════════════════════════════════════════════════════════════
// FLOW SPECS — layered nodes + the correct dialogue path
// ════════════════════════════════════════════════════════════════════════
interface Network { nodes: BoardNode[]; correct: [string, string][]; pathLabels: string; }

// Build a layered flow from columns of {id,label}; the path is the list of
// node ids that must be wired in order. Decoy nodes are column members not on
// the path. Positions are derived as percentages within the stage.
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
  const IN = { id: 'in', label: 'User Input' };
  const OUT = { id: 'out', label: 'Reply' };
  switch (levelId) {
    case 1:
      return layered([[IN], [{ id: 'greet', label: 'Greeting' }], [OUT]], ['in', 'greet', 'out']);
    case 2:
      return layered(
        [[IN], [{ id: 'faq', label: 'FAQ Intent' }, { id: 'off', label: 'Off-topic' }], [OUT]],
        ['in', 'faq', 'out'],
      );
    case 3:
      return layered(
        [[IN], [{ id: 'help', label: 'Help Intent' }, { id: 'wrong', label: 'Wrong Intent' }], [OUT]],
        ['in', 'help', 'out'],
      );
    case 4:
      return layered(
        [[IN], [{ id: 'i1', label: 'Order Intent' }, { id: 'i2', label: 'Status Intent' }, { id: 'i3', label: 'Cancel Intent' }], [OUT]],
        ['in', 'i2', 'out'],
      );
    case 5:
      return layered(
        [[IN], [{ id: 'intent', label: 'Intent' }, { id: 'noise', label: 'No Match' }], [{ id: 'ctx', label: 'Context' }, { id: 'stale', label: 'Stale Ctx' }], [OUT]],
        ['in', 'intent', 'ctx', 'out'],
      );
    case 6:
      return layered(
        [[IN], [{ id: 'cls', label: 'Classify' }, { id: 'miss', label: 'Misread' }], [{ id: 'tone', label: 'Tone' }], [OUT]],
        ['in', 'cls', 'tone', 'out'],
      );
    case 7:
      return layered(
        [[IN], [{ id: 'mood', label: 'Mood' }, { id: 'moodb', label: 'Flat' }], [{ id: 'resp', label: 'Response' }, { id: 'respb', label: 'Generic' }], [{ id: 'empathy', label: 'Empathy' }], [OUT]],
        ['in', 'mood', 'resp', 'empathy', 'out'],
      );
    case 8:
      return layered(
        [[IN], [{ id: 'in1', label: 'Intent-1' }, { id: 'in2', label: 'Intent-2' }], [{ id: 'merge', label: 'Merge' }], [OUT]],
        ['in', 'in1', 'merge', 'out'],
      );
    case 9:
      return layered(
        [[IN], [{ id: 'safe', label: 'Safe Intent' }, { id: 'unsafe', label: 'Unsafe' }], [{ id: 'filt', label: 'Filtered' }, { id: 'block', label: 'Blocked' }], [OUT]],
        ['in', 'safe', 'filt', 'out'],
      );
    case 10:
    default:
      return layered(
        [[IN], [{ id: 'm1', label: 'Classify' }, { id: 'm1b', label: 'Misread' }], [{ id: 'm2', label: 'Memory' }], [{ id: 'm3', label: 'Tone' }, { id: 'm3b', label: 'Robotic' }], [OUT]],
        ['in', 'm1', 'm2', 'm3', 'out'],
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Message flows! +${gained}` });
      juice.onCorrect(correctPlaced + 1, nextScore);
    } else {
      setCombo(0);
      setWrongWires((w) => w + 1);
      setFeedback({
        type: 'wrong',
        message: 'That wire misroutes the message.',
        explanation: 'The bot can\'t answer down this path — remove it and route through the right intent.',
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
    setFeedback({ type: allWired ? 'correct' : 'info', message: allWired ? 'Bot replied!' : 'Partial message reached the reply.' });
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
        <GlowingTitle emoji="💬" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Goal:</strong> Wire the message from User Input to Reply. Drag from one stage to the next.</span>
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
        <GlowingTitle emoji="💬" color={LAB_COLOR}>Wire the Dialogue</GlowingTitle>
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
          {allWired ? 'Run Bot' : 'Reply with what I have'}
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
export default function ChatbotBuilderGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('chatbot-builder', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Chatbot Builder" color="#FF6B35" labNum={8}>
      <GameLevelSystem
        gameTitle="Chatbot Builder"
        gameEmoji="💬"
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
