// ════════════════════════════════════════════════════════════════════════
// MY FIRST AI APP v5 — Lab 1 Flagship — CONNECT archetype (Wave 1)
// ════════════════════════════════════════════════════════════════════════
// Was a four-slider simulation. Now you WIRE the app pipeline: drag edges from
// the user's Input, through the right AI service/model, to the Output the user
// sees. Correct wires light green and carry the data; wrong wires (broken
// service, missing step) glow red. Thread the full path to ship the app.
//
// Teaches: every AI app is Input → Model/API → Output. You connect components
// into a pipeline; picking the right service and not skipping a step is what
// makes the app actually work.

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
  { id: 1, name: 'Hello AI', description: 'Wire your first app: input to model to output!', emoji: '👋', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 50 },
  { id: 2, name: 'Image Labeler', description: 'Pick the vision model that labels photos.', emoji: '📸', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 60 },
  { id: 3, name: 'Spam Filter', description: 'Route email through the right classifier.', emoji: '📧', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 70 },
  { id: 4, name: 'Sentiment App', description: 'Add a preprocessing step before the model.', emoji: '😊', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 80 },
  { id: 5, name: 'Voice Command', description: 'Speech to text, then to the command model.', emoji: '🎤', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 90 },
  { id: 6, name: 'Recommender', description: 'Thread data through the right ranking model.', emoji: '⭐', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'Translator', description: 'Encode, translate, then decode the text.', emoji: '🌍', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'Code Helper', description: 'Wire a four-step coding-assistant pipeline.', emoji: '💻', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'Multi-Model', description: 'Avoid the offline service and broken APIs.', emoji: '🔀', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'App Master', description: 'Ship the deepest pipeline of all.', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Every AI app is a pipeline: User Input → AI Model → Output. Wire those three to ship it.',
  2: 'Different jobs need different models. A vision model labels images; pick the right one.',
  3: 'A classifier sorts inputs into buckets. Route the email through the spam classifier.',
  4: 'Raw input often needs preprocessing first — clean the text before the model reads it.',
  5: 'Pipelines chain services: speech-to-text turns audio into text the next model can use.',
  6: 'A recommender ranks items for a user. Feed its data through the ranking model.',
  7: 'Sequence models encode input, transform it, then decode it back into the output language.',
  8: 'Bigger apps add steps: parse the request, call the model, then format the response.',
  9: 'Real systems have dead services. Wire around the offline API and broken endpoints.',
  10: 'Master build: thread every stage — input, services, model, output — into one clean app.',
};

// ════════════════════════════════════════════════════════════════════════
// PIPELINE SPECS — layered nodes + the correct data path
// ════════════════════════════════════════════════════════════════════════
interface Network { nodes: BoardNode[]; correct: [string, string][]; pathLabels: string; }

// Build a layered pipeline from columns of {id,label}; the path is the list of
// node ids that must be wired in order. Decoy nodes are column members not on
// the path (wrong service, broken API). Positions are derived as percentages.
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
  const IN = { id: 'in', label: 'User Input' };
  const OUT = { id: 'out', label: 'Output' };
  switch (levelId) {
    case 1:
      return layered([[IN], [{ id: 'model', label: 'AI Model' }], [OUT]], ['in', 'model', 'out']);
    case 2:
      return layered(
        [[IN], [{ id: 'vision', label: 'Vision Model' }, { id: 'text', label: 'Text Model' }], [OUT]],
        ['in', 'vision', 'out'],
      );
    case 3:
      return layered(
        [[IN], [{ id: 'spam', label: 'Spam Classifier' }, { id: 'random', label: 'Random API' }], [OUT]],
        ['in', 'spam', 'out'],
      );
    case 4:
      return layered(
        [[IN], [{ id: 'clean', label: 'Preprocess' }, { id: 'skip', label: 'Skip Step' }], [{ id: 'sent', label: 'Sentiment Model' }], [OUT]],
        ['in', 'clean', 'sent', 'out'],
      );
    case 5:
      return layered(
        [[IN], [{ id: 'stt', label: 'Speech-to-Text' }, { id: 'tts', label: 'Text-to-Speech' }], [{ id: 'cmd', label: 'Command Model' }, { id: 'img', label: 'Image Model' }], [OUT]],
        ['in', 'stt', 'cmd', 'out'],
      );
    case 6:
      return layered(
        [[IN], [{ id: 'feats', label: 'Features' }, { id: 'noise', label: 'Noise' }], [{ id: 'rank', label: 'Ranker' }], [OUT]],
        ['in', 'feats', 'rank', 'out'],
      );
    case 7:
      return layered(
        [[IN], [{ id: 'enc', label: 'Encoder' }, { id: 'enc2', label: 'Bad Encoder' }], [{ id: 'mt', label: 'Translator' }, { id: 'mt2', label: 'Old MT' }], [{ id: 'dec', label: 'Decoder' }], [OUT]],
        ['in', 'enc', 'mt', 'dec', 'out'],
      );
    case 8:
      return layered(
        [[IN], [{ id: 'parse', label: 'Parser' }, { id: 'parse2', label: 'Lint' }], [{ id: 'llm', label: 'Code Model' }], [OUT]],
        ['in', 'parse', 'llm', 'out'],
      );
    case 9:
      return layered(
        [[IN], [{ id: 'live', label: 'Live API' }, { id: 'off', label: 'Offline API' }], [{ id: 'fuse', label: 'Fusion' }, { id: 'broke', label: 'Broken' }], [OUT]],
        ['in', 'live', 'fuse', 'out'],
      );
    case 10:
    default:
      return layered(
        [[IN], [{ id: 'p1', label: 'Ingest' }, { id: 'p1b', label: 'Stub' }], [{ id: 'p2', label: 'Embed' }], [{ id: 'p3', label: 'Reason' }, { id: 'p3b', label: 'Echo' }], [OUT]],
        ['in', 'p1', 'p2', 'p3', 'out'],
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Data flows! +${gained}` });
      juice.onCorrect(correctPlaced + 1, nextScore);
    } else {
      setCombo(0);
      setWrongWires((w) => w + 1);
      setFeedback({
        type: 'wrong',
        message: 'That wire breaks the app.',
        explanation: 'No data travels this path — remove it and route through the right service.',
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
    setFeedback({ type: allWired ? 'correct' : 'info', message: allWired ? 'App shipped!' : 'Partial pipeline reached the output.' });
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
        <GlowingTitle emoji="📱" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Goal:</strong> Wire the data from User Input to Output. Drag from one component to the next.</span>
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
        <GlowingTitle emoji="📱" color={LAB_COLOR}>Wire the App</GlowingTitle>
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
          {allWired ? 'Ship App' : 'Run what I have'}
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
export default function MyFirstAiAppGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('my-first-ai-app', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="My First AI App" color="#E68E28" labNum={9}>
      <GameLevelSystem
        gameTitle="My First AI App"
        gameEmoji="📱"
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
