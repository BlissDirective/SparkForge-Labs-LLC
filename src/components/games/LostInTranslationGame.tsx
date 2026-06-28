// ════════════════════════════════════════════════════════════════════════
// LOST IN TRANSLATION v4 — Lab 8 — CONNECT archetype (Wave 1)
// ════════════════════════════════════════════════════════════════════════
// Was a four-slider translation simulation. Now you WIRE the translation relay:
// drag edges from the SOURCE language, through faithful PIVOT languages, to the
// TARGET. Correct hops preserve meaning and light green; decoy pivots distort
// meaning ("meaning drift") and glow red. Build the full chain to deliver the
// message. Pixi CONNECT scene inside GameShell.
//
// Teaches: machine translation often routes through pivot languages, and each
// hop can drift meaning. Choosing faithful pivots keeps the message intact.

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

const LAB_COLOR = '#8F96FA';
const GOOD = 0x2ecc71;
const BAD = 0xff4d4d;

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Hello World', description: 'Relay a simple greeting to the target.', emoji: '👋', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 50 },
  { id: 2, name: 'Lost Idioms', description: 'Pick the pivot that keeps the idiom.', emoji: '🗣️', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 60 },
  { id: 3, name: 'Food Words', description: 'Route around the literal mistranslation.', emoji: '🍜', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 70 },
  { id: 4, name: 'Formal vs Casual', description: 'Cross a full pivot layer faithfully.', emoji: '🙇', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 80 },
  { id: 5, name: 'Emoji Meanings', description: 'Find the chain that keeps the meaning.', emoji: '😂', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 90 },
  { id: 6, name: 'Sarcasm', description: 'Trace the tone through three hops.', emoji: '🙃', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'Cultural Context', description: 'Navigate four languages to the target.', emoji: '🌍', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'Poetry', description: 'Split and merge two faithful routes.', emoji: '📜', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'Code Switching', description: 'Avoid the meaning-drift pivots.', emoji: '🔀', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'Translation Master', description: 'Wire the longest relay of all.', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Machine translation passes a message from a source language to a target. Wire Source → pivot → Target to deliver it.',
  2: 'Idioms break when translated word-for-word. Only some pivots carry the meaning through.',
  3: 'A literal pivot mistranslates food words. Route through the faithful language instead.',
  4: 'A pivot layer sits between source and target. The message must cross it without losing politeness.',
  5: 'A pivot can distort an emoji or sign. Pick the chain that keeps the original intent.',
  6: 'Sarcasm relies on tone. Trace the relay through pivots that preserve it, not flatten it.',
  7: 'Long relays cross many languages — each hop a chance for meaning to drift or survive.',
  8: 'Poetry can route two faithful ways that merge. Both paths must keep sound and sense.',
  9: 'Code-switching adds noisy pivots. Wire around the meaning-drift nodes to stay faithful.',
  10: 'Master relay: route the message across every language, faithfully, to the target.',
};

// ════════════════════════════════════════════════════════════════════════
// RELAY SPECS — layered language nodes + the meaning-preserving chain
// ════════════════════════════════════════════════════════════════════════
interface Network { nodes: BoardNode[]; correct: [string, string][]; pathLabels: string; }

// Build a layered relay from columns of {id,label}; the path is the list of
// node ids that must be wired in order. Decoy nodes are columns members not on
// the path (meaning-drift pivots). Positions are percentages within the stage.
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
  const SRC = { id: 'src', label: 'Source' };
  const TGT = { id: 'tgt', label: 'Target' };
  switch (levelId) {
    case 1:
      return layered([[SRC], [{ id: 'p1', label: 'Pivot' }], [TGT]], ['src', 'p1', 'tgt']);
    case 2:
      return layered(
        [[SRC], [{ id: 'a', label: 'Faithful' }, { id: 'b', label: 'Literal (drift)' }], [TGT]],
        ['src', 'a', 'tgt'],
      );
    case 3:
      return layered(
        [[SRC], [{ id: 'lit', label: 'Literal (drift)' }, { id: 'ctx', label: 'Contextual' }], [TGT]],
        ['src', 'ctx', 'tgt'],
      );
    case 4:
      return layered(
        [[SRC], [{ id: 'f1', label: 'French' }, { id: 'f2', label: 'Spanish' }, { id: 'f3', label: 'Slang (drift)' }], [TGT]],
        ['src', 'f2', 'tgt'],
      );
    case 5:
      return layered(
        [[SRC], [{ id: 'x', label: 'German' }, { id: 'y', label: 'Garbled (drift)' }], [{ id: 'z', label: 'Latin' }, { id: 'w', label: 'Noise (drift)' }], [TGT]],
        ['src', 'x', 'z', 'tgt'],
      );
    case 6:
      return layered(
        [[SRC], [{ id: 'p', label: 'Flat (drift)' }, { id: 'q', label: 'Tonal' }], [{ id: 'r', label: 'Nuanced' }], [TGT]],
        ['src', 'q', 'r', 'tgt'],
      );
    case 7:
      return layered(
        [[SRC], [{ id: 'l1', label: 'Arabic' }, { id: 'l1b', label: 'Drift-A' }], [{ id: 'l2', label: 'Hindi' }, { id: 'l2b', label: 'Drift-B' }], [{ id: 'l3', label: 'Korean' }], [TGT]],
        ['src', 'l1', 'l2', 'l3', 'tgt'],
      );
    case 8:
      return layered(
        [[SRC], [{ id: 's1', label: 'Sound' }, { id: 's2', label: 'Sense' }], [{ id: 'm', label: 'Merge' }], [TGT]],
        ['src', 's1', 'm', 'tgt'],
      );
    case 9:
      return layered(
        [[SRC], [{ id: 'c', label: 'Clean' }, { id: 'mix', label: 'Mixed (drift)' }], [{ id: 'f', label: 'Faithful' }, { id: 'mix2', label: 'Slang (drift)' }], [TGT]],
        ['src', 'c', 'f', 'tgt'],
      );
    case 10:
    default:
      return layered(
        [[SRC], [{ id: 'd1', label: 'Pivot-1' }, { id: 'd1b', label: 'Drift-1' }], [{ id: 'd2', label: 'Pivot-2' }], [{ id: 'd3', label: 'Pivot-3' }, { id: 'd3b', label: 'Drift-3' }], [TGT]],
        ['src', 'd1', 'd2', 'd3', 'tgt'],
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Meaning preserved! +${gained}` });
      juice.onCorrect(correctPlaced + 1, nextScore);
    } else {
      setCombo(0);
      setWrongWires((w) => w + 1);
      setFeedback({
        type: 'wrong',
        message: 'Meaning drifted on that hop.',
        explanation: 'This pivot distorts the message — remove it and route through a faithful language.',
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
    setFeedback({ type: allWired ? 'correct' : 'info', message: allWired ? 'Message delivered!' : 'Partial meaning reached the target.' });
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
        <GlowingTitle emoji="🌍" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Goal:</strong> Relay the message from Source to Target. Drag from one language to the next.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('wire')}>
          Start Relaying <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ WIRE ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🌍" color={LAB_COLOR}>Wire the Relay</GlowingTitle>
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
          {allWired ? 'Deliver Message' : 'Send what I have'}
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
export default function LostInTranslationGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('lost-in-translation', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Lost in Translation" color="#8F96FA" labNum={8}>
      <GameLevelSystem
        gameTitle="Lost in Translation"
        gameEmoji="🌍"
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
