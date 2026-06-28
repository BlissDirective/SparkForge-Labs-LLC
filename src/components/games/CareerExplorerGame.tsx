// ════════════════════════════════════════════════════════════════════════
// CAREER EXPLORER v4 — Lab 9 — CONNECT archetype (matching)
// ════════════════════════════════════════════════════════════════════════
// Was a drag-drop "sort skills into job buckets" game. Now you WIRE matches:
// left column lists skills, right column lists AI careers — draw an edge from
// each skill to the career that needs it. Correct matches light green; wrong
// wires glow red. Match every pair to staff the AI lab. Pixi CONNECT scene
// inside GameShell.
//
// Teaches: real AI job roles and the core skill each one is built on — which
// careers need statistics, which need frameworks, which need ethics, and more.

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

const LAB_COLOR = '#E68E28';
const GOOD = 0x2ecc71;
const BAD = 0xff4d4d;

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Data Scientist', description: 'Match the skills the data detective needs!', emoji: '🔢', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 50 },
  { id: 2, name: 'ML Engineer', description: 'Wire each skill to the model builder.', emoji: '🧠', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 60 },
  { id: 3, name: 'AI Ethics Officer', description: 'Connect the skills that keep AI fair.', emoji: '⚖️', difficulty: 'easy', starThresholds: [50, 75, 95], xpReward: 70 },
  { id: 4, name: 'Computer Vision Expert', description: 'Match the eyes-of-the-machine skills.', emoji: '👁️', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 80 },
  { id: 5, name: 'NLP Engineer', description: 'Wire skills to the language specialist.', emoji: '🗣️', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 90 },
  { id: 6, name: 'Robotics Engineer', description: 'Match skills across two robot roles.', emoji: '🤖', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'AI Research Scientist', description: 'Connect skills to four research roles.', emoji: '🔬', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'AI Product Manager', description: 'Wire the bridge-builder skills.', emoji: '📊', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'AI Designer', description: 'Match the skills that make AI loved.', emoji: '🎨', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'Career Master', description: 'Staff the whole AI lab — match them all!', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Data Scientists find patterns in data using statistics, SQL, and visualization.',
  2: 'ML Engineers build and deploy models — Python, frameworks, and MLOps are their core.',
  3: 'AI Ethics Officers keep AI fair using bias analysis, privacy law, and clear communication.',
  4: 'Computer Vision experts teach machines to see with image processing and neural networks.',
  5: 'NLP Engineers make machines understand language — tokens, transformers, and embeddings.',
  6: 'Robotics Engineers fuse AI with hardware: sensors, control, and motion planning.',
  7: 'AI Research Scientists invent the future, blending math, novel models, and experiments.',
  8: 'AI Product Managers connect tech to business with roadmaps, metrics, and stakeholders.',
  9: 'AI Designers craft trustworthy experiences — UX, prototyping, and human-centered design.',
  10: 'Every AI career is built on a core skill. Match each role to the skill it runs on.',
};

// ════════════════════════════════════════════════════════════════════════
// MATCHING SPECS — bipartite board: skills (left) ↔ careers (right)
// ════════════════════════════════════════════════════════════════════════
interface Network { nodes: BoardNode[]; correct: [string, string][]; }

// Build a bipartite matching board from a list of {skill,career} pairs.
// Left nodes (skills) sit at x=15, right nodes (careers) at x=85. The two
// columns use DIFFERENT y-orderings so it stays a real matching puzzle.
function matching(
  pairs: { skillId: string; skill: string; careerId: string; career: string }[],
): Network {
  const n = pairs.length;
  const spread = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 60 + 15);
  // Right column rendered in a rotated order so y-positions don't line up.
  const rightOrder = pairs.map((_, i) => (i + Math.floor(n / 2) + 1) % n);

  const nodes: BoardNode[] = [];
  pairs.forEach((p, i) => {
    nodes.push({ id: p.skillId, label: p.skill, x: 15, y: spread(i) });
  });
  rightOrder.forEach((pairIdx, slot) => {
    const p = pairs[pairIdx];
    nodes.push({ id: p.careerId, label: p.career, x: 85, y: spread(slot), color: LAB_COLOR });
  });

  const correct: [string, string][] = pairs.map((p) => [p.skillId, p.careerId]);
  return { nodes, correct };
}

function getNetwork(levelId: number): Network {
  switch (levelId) {
    case 1:
      return matching([
        { skillId: 'sk-stats', skill: 'Statistics', careerId: 'cr-data', career: 'Data Scientist' },
        { skillId: 'sk-sql', skill: 'SQL Queries', careerId: 'cr-analyst', career: 'Data Analyst' },
        { skillId: 'sk-viz', skill: 'Data Viz', careerId: 'cr-bi', career: 'BI Specialist' },
      ]);
    case 2:
      return matching([
        { skillId: 'sk-py', skill: 'Python', careerId: 'cr-ml', career: 'ML Engineer' },
        { skillId: 'sk-fw', skill: 'PyTorch', careerId: 'cr-dl', career: 'Deep Learning Eng' },
        { skillId: 'sk-mlops', skill: 'MLOps', careerId: 'cr-platform', career: 'ML Platform Eng' },
      ]);
    case 3:
      return matching([
        { skillId: 'sk-bias', skill: 'Bias Analysis', careerId: 'cr-ethics', career: 'AI Ethics Officer' },
        { skillId: 'sk-law', skill: 'Privacy Law', careerId: 'cr-policy', career: 'AI Policy Lead' },
        { skillId: 'sk-comm', skill: 'Communication', careerId: 'cr-trust', career: 'Trust & Safety' },
      ]);
    case 4:
      return matching([
        { skillId: 'sk-img', skill: 'Image Processing', careerId: 'cr-cv', career: 'CV Engineer' },
        { skillId: 'sk-cnn', skill: 'CNNs', careerId: 'cr-recog', career: 'Recognition Eng' },
        { skillId: 'sk-det', skill: 'Object Detection', careerId: 'cr-auto', career: 'Autonomy Eng' },
      ]);
    case 5:
      return matching([
        { skillId: 'sk-tok', skill: 'Tokenization', careerId: 'cr-nlp', career: 'NLP Engineer' },
        { skillId: 'sk-tfm', skill: 'Transformers', careerId: 'cr-llm', career: 'LLM Engineer' },
        { skillId: 'sk-emb', skill: 'Embeddings', careerId: 'cr-search', career: 'Search Engineer' },
      ]);
    case 6:
      return matching([
        { skillId: 'sk-sensor', skill: 'Sensor Fusion', careerId: 'cr-robot', career: 'Robotics Engineer' },
        { skillId: 'sk-ctrl', skill: 'Control Systems', careerId: 'cr-motion', career: 'Motion Planner' },
        { skillId: 'sk-rl', skill: 'Reinforcement L.', careerId: 'cr-agent', career: 'Agent Engineer' },
        { skillId: 'sk-embed', skill: 'Embedded C++', careerId: 'cr-firmware', career: 'Firmware Engineer' },
      ]);
    case 7:
      return matching([
        { skillId: 'sk-math', skill: 'Advanced Math', careerId: 'cr-research', career: 'Research Scientist' },
        { skillId: 'sk-paper', skill: 'Paper Writing', careerId: 'cr-applied', career: 'Applied Scientist' },
        { skillId: 'sk-exp', skill: 'Experiments', careerId: 'cr-lab', career: 'Lab Lead' },
        { skillId: 'sk-novel', skill: 'Novel Models', careerId: 'cr-arch', career: 'Model Architect' },
      ]);
    case 8:
      return matching([
        { skillId: 'sk-road', skill: 'Roadmapping', careerId: 'cr-pm', career: 'AI Product Mgr' },
        { skillId: 'sk-metric', skill: 'Metrics', careerId: 'cr-growth', career: 'Growth PM' },
        { skillId: 'sk-stake', skill: 'Stakeholders', careerId: 'cr-program', career: 'Program Mgr' },
        { skillId: 'sk-strat', skill: 'Strategy', careerId: 'cr-lead', career: 'Product Lead' },
      ]);
    case 9:
      return matching([
        { skillId: 'sk-ux', skill: 'UX Research', careerId: 'cr-design', career: 'AI Designer' },
        { skillId: 'sk-proto', skill: 'Prototyping', careerId: 'cr-interact', career: 'Interaction Designer' },
        { skillId: 'sk-hci', skill: 'Human-Centered', careerId: 'cr-uxai', career: 'UX-AI Specialist' },
        { skillId: 'sk-vis', skill: 'Visual Design', careerId: 'cr-brand', career: 'Brand Designer' },
      ]);
    case 10:
    default:
      return matching([
        { skillId: 'sk-stats2', skill: 'Statistics', careerId: 'cr-data2', career: 'Data Scientist' },
        { skillId: 'sk-py2', skill: 'Python', careerId: 'cr-ml2', career: 'ML Engineer' },
        { skillId: 'sk-bias2', skill: 'Bias Analysis', careerId: 'cr-ethics2', career: 'Ethics Officer' },
        { skillId: 'sk-cnn2', skill: 'CNNs', careerId: 'cr-cv2', career: 'CV Engineer' },
        { skillId: 'sk-tfm2', skill: 'Transformers', careerId: 'cr-nlp2', career: 'NLP Engineer' },
      ]);
  }
}

const edgeKey = (a: string, b: string) => [a, b].sort().join('-');

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the CONNECT matching board
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Perfect match! +${gained}` });
      juice.onCorrect(correctPlaced + 1, nextScore);
    } else {
      setCombo(0);
      setWrongWires((w) => w + 1);
      setFeedback({
        type: 'wrong',
        message: 'That skill does not fit this role.',
        explanation: 'Remove the wire and match the skill to the career that actually needs it.',
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
    setFeedback({ type: allWired ? 'correct' : 'info', message: allWired ? 'Lab fully staffed!' : 'Some roles still need the right skill.' });
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
        <GlowingTitle emoji="💼" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Goal:</strong> Match each skill on the left to the AI career on the right that needs it. Drag from a skill to a career.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('wire')}>
          Start Matching <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ WIRE ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="💼" color={LAB_COLOR}>Match Skills to Careers</GlowingTitle>
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
          {allWired ? 'Staff the Lab' : 'Submit what I have'}
        </SFButton>
        <SFButton variant="outline" onClick={resetWires} aria-label="Reset matches">
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
export default function CareerExplorerGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('career-explorer', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Career Explorer" color="#E68E28" labNum={9}>
      <GameLevelSystem
        gameTitle="Career Explorer"
        gameEmoji="💼"
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
