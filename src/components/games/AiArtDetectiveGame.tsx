// ════════════════════════════════════════════════════════════════════════
// AI ART DETECTIVE v4 — Lab 4 (AI That Creates) — SORT archetype (Wave 3)
// ════════════════════════════════════════════════════════════════════════
// Was an AI-vs-human-art quiz. Now you SORT the evidence: drag each tell-tale
// clue into Human-made or AI-made. On a correct call the why-card zooms in on
// the artifact (six-fingered hand, melting background) or the authentic mark
// (brush texture, signature). Pixi SORT scene (two bins) inside GameShell.
//
// Teaches: the visual tells that separate AI-generated art from human art.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Brush, GraduationCap, Target, RotateCcw, Sparkles,
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
import type { BinSortItem } from '@/components/games/pixi/PixiBinSortStage';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiBinSortStage = dynamic(() => import('@/components/games/pixi/PixiBinSortStage'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl" style={{ background: '#0E1428' }} />
  ),
});

const LAB_COLOR = '#D9A430';
const BINS = ['Human-made', 'AI-made']; // bin index 0 / 1
const CHIP_PALETTE = ['#4F6EF7', '#2ECC71', '#F59E0B', '#10BAD2', '#8F96FA', '#FF7050'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Paint or Pixel?', description: 'Sort the human and AI tells.', emoji: '🎨', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Style Tells', description: 'Brush marks vs generated style.', emoji: '🖼️', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Hands & Faces', description: 'The classic AI giveaways.', emoji: '👤', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Texture Check', description: 'Canvas grain vs smooth render.', emoji: '⚔️', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Prompt Artifacts', description: 'What text-to-image leaves behind.', emoji: '✨', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Detail Hunt', description: 'Small tells, big difference.', emoji: '🔬', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Mixed Media', description: 'Sort across art styles.', emoji: '🎬', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Tricky Cases', description: 'The hardest evidence yet.', emoji: '🧊', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Forensics', description: 'Metadata and watermarks.', emoji: '🛠️', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Art Critic', description: 'The ultimate detective sort!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'AI art and human art leave different tells. Sort each clue into who most likely made it.',
  2: 'Visible brush strokes and canvas texture point to a human; a too-smooth blended style points to AI.',
  3: 'AI struggles with hands and symmetry — extra fingers and mismatched details are classic AI tells.',
  4: 'Real paint has grain and ridges. AI renders are often flawlessly smooth — a giveaway.',
  5: 'Text-to-image leaves artifacts: warped backgrounds, garbled text, impossible geometry.',
  6: 'Small details decide it — a signature and consistent lighting say human; melting edges say AI.',
  7: 'Across styles the same logic holds: physical, imperfect marks vs generated, uncanny ones.',
  8: 'Some clues are subtle. Weigh the evidence: which tells point to a person, which to a model?',
  9: 'Forensics help: EXIF data and brush layers suggest human; hidden AI watermarks suggest a model.',
  10: 'Master test: sort every clue correctly into Human-made or AI-made.',
};

// ════════════════════════════════════════════════════════════════════════
// EVIDENCE BANK — a tell + who it points to (bin) + why (interleaved)
// ════════════════════════════════════════════════════════════════════════
interface Clue { id: string; label: string; bin: number; why: string; }

const BANK: Clue[] = [
  { id: 'brush', label: 'Visible brush strokes', bin: 0, why: 'Physical brush texture is a strong sign of human-made art.' },
  { id: 'sixfingers', label: 'Six-fingered hand', bin: 1, why: 'Extra fingers are a classic AI image-generation artifact.' },
  { id: 'signature', label: 'Artist signature', bin: 0, why: 'A signed canvas points to a human artist.' },
  { id: 'melting', label: 'Melting background', bin: 1, why: 'Warped, melting backgrounds are typical of AI generation.' },
  { id: 'canvas', label: 'Canvas grain texture', bin: 0, why: 'Real canvas grain comes from a physical surface — human-made.' },
  { id: 'symmetry', label: 'Impossible symmetry', bin: 1, why: 'Unnaturally perfect symmetry is suspicious for AI.' },
  { id: 'pencil', label: 'Pencil under-sketch', bin: 0, why: 'Visible construction lines show a human planning the piece.' },
  { id: 'garbled', label: 'Garbled text in image', bin: 1, why: 'AI often renders nonsense letters — a giveaway.' },
  { id: 'fingerprint', label: 'Smudge / fingerprint', bin: 0, why: 'Smudges from a hand point to physical, human work.' },
  { id: 'extralimb', label: 'Extra limb', bin: 1, why: 'Duplicated or extra limbs are common AI errors.' },
  { id: 'layers', label: 'Visible paint layers', bin: 0, why: 'Built-up paint layers (impasto) are a human technique.' },
  { id: 'watermark', label: 'Hidden AI watermark', bin: 1, why: 'Some AI tools embed invisible watermarks in their output.' },
  { id: 'exif', label: 'Photo has EXIF data', bin: 0, why: 'Camera metadata suggests a real photograph, not AI.' },
  { id: 'uncanny', label: 'Uncanny-valley face', bin: 1, why: 'Almost-real-but-off faces are a hallmark of AI generation.' },
  { id: 'mistake', label: 'A visible mistake fixed', bin: 0, why: 'Corrections and pentimenti reveal a human at work.' },
  { id: 'noise', label: 'Diffusion noise pattern', bin: 1, why: 'Faint denoising texture is left by diffusion models.' },
];

function getItems(levelId: number): Clue[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: Clue[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT board (Human / AI)
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'sort'>('welcome');
  const items = useMemo(() => getItems(level.id), [level.id]);
  const [assignments, setAssignments] = useState<Record<string, number | undefined>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const maxScore = items.length * 10 + 20;
  const sortedCount = items.filter((t) => assignments[t.id] !== undefined).length;
  const allSorted = sortedCount >= items.length;

  const sceneItems = useMemo<BinSortItem[]>(
    () => items.map((it, i) => ({ id: it.id, label: it.label, name: it.label, color: CHIP_PALETTE[i % CHIP_PALETTE.length] })),
    [items],
  );

  const finishLevel = useCallback((finalScore: number, finalWrong: number) => {
    const accuracyBonus = Math.max(0, 20 - finalWrong * 5);
    const total = finalScore + accuracyBonus;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 1300);
  }, [level, maxScore, onComplete]);

  const handleAssign = useCallback((id: string, bin: number) => {
    if (assignments[id] !== undefined) return;
    const item = items.find((t) => t.id === id);
    if (!item) return;
    const nextAssign = { ...assignments, [id]: bin };
    setAssignments(nextAssign);
    const correct = item.bin === bin;
    const doneCount = Object.keys(nextAssign).length;

    if (correct) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Case solved! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `That clue points to ${BINS[item.bin]}.`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🎨" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each clue into <strong>Human-made</strong> or <strong>AI-made</strong>. Crack every case!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Investigating <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🎨" color={LAB_COLOR}>Sort the Evidence</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Brush className="w-4 h-4" />{sortedCount} / {items.length}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <PixiBinSortStage
        items={sceneItems}
        bins={BINS}
        assignments={assignments}
        onAssign={handleAssign}
        labColor={LAB_COLOR}
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={() => finishLevel(score, wrong)} disabled={!allSorted}>
          <Sparkles className="w-4 h-4 mr-2" />
          {allSorted ? 'Verdict!' : `Sort ${items.length - sortedCount} more…`}
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function AiArtDetectiveGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('ai-art-detective', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Art Detective" color={LAB_COLOR} labNum={4}>
      <GameLevelSystem
        gameTitle="AI Art Detective"
        gameEmoji="🎨"
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
