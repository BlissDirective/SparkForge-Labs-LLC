// ════════════════════════════════════════════════════════════════════════
// REAL OR FAKE? v4 — Lab 6 (AI & Ethics) — REVEAL archetype migration (Wave 2)
// ════════════════════════════════════════════════════════════════════════
// Was a media-literacy quiz on QuizLevelRenderer. Now an INSPECTION hunt: a
// board of media snippets is shown; tap the ones you judge FAKE. Tapping
// reveals the verdict plus the tell (sensational headline, lip-sync drift,
// invented sources). Real items reveal why they are trustworthy. Pixi REVEAL
// scene inside GameShell.
//
// Teaches: the tells of misinformation — and what real journalism looks like.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Sparkles, Search, GraduationCap, Target, RotateCcw,
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
import type { RevealTile } from '@/components/games/pixi/PixiRevealStage';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiRevealStage = dynamic(() => import('@/components/games/pixi/PixiRevealStage'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl" style={{ background: '#0E1428' }} />
  ),
});

const LAB_COLOR = '#FF7050';

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'News Basics', description: 'Catch the fake headlines.', emoji: '📰', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Source Check', description: 'Who wrote this — can you trust them?', emoji: '🔍', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Image Tricks', description: 'Spot manipulated photos.', emoji: '📸', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Video Fakes', description: 'Find the deepfakes.', emoji: '🎬', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Social Media', description: 'Viral posts: true or false?', emoji: '📱', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'AI-Generated Text', description: 'Spot AI-written articles.', emoji: '🤖', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Scientific Claims', description: 'Real science vs pseudoscience.', emoji: '🔬', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Emotional Bait', description: 'See how fakes play on feelings.', emoji: '🎭', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Fact Check Pro', description: 'Advanced verification.', emoji: '✅', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Truth Champion', description: 'The ultimate media-literacy test!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Real news is reported carefully. Sensational, too-good-to-be-true headlines are a red flag for fakes.',
  2: 'Check who published it. Reputable outlets have bylines, editors, and correction policies.',
  3: 'Manipulated photos show cropping, pixelation, or missing context. A reverse-image search reveals the original.',
  4: 'Deepfakes betray themselves with lip-sync drift, odd blinking, and flickering edges.',
  5: 'Viral posts spread on emotion. Pause and verify before you believe — or share.',
  6: 'AI-written text is grammatically perfect but vague, repetitive, and can invent facts.',
  7: 'Real science is published and peer-reviewed. "They don\'t want you to know" is a conspiracy trope.',
  8: 'Fakes trigger fear, anger, or excitement to bypass your critical thinking.',
  9: 'Pro fact-checking: confirm the source, the study, and the context all check out.',
  10: 'Master test: across every medium, separate the trustworthy from the fake.',
};

// ════════════════════════════════════════════════════════════════════════
// MEDIA ITEM BANK — short caption + fake/real + the tell (faithful to v3)
// (interleaved so any window holds both fakes and reals)
// ════════════════════════════════════════════════════════════════════════
interface MediaItem { id: string; label: string; isFake: boolean; why: string; }

const BANK: MediaItem[] = [
  { id: 'cure-all', label: "'Cure for ALL diseases!'", isFake: true, why: 'Real breakthroughs are reported cautiously. Sensational headlines signal misinformation.' },
  { id: 'bylined', label: 'Bylined report, named editor', isFake: false, why: 'A named author and editor from a reputable outlet is a sign of real journalism.' },
  { id: 'pixel-shock', label: 'Pixelated shock photo', isFake: true, why: 'Poor quality, cropping, and missing context are common signs of a manipulated image.' },
  { id: 'reverse-checked', label: 'Verified by reverse search', isFake: false, why: 'A reverse-image search traced it to its true source and context — it checks out.' },
  { id: 'lip-sync', label: 'Lip-sync does not match', isFake: true, why: 'Lip-sync mismatch is a classic deepfake tell. Verify shocking video claims.' },
  { id: 'caps-clickbait', label: 'ALL CAPS clickbait', isFake: true, why: 'Caps, urgency, and outrage are clickbait. Real journalism is measured and specific.' },
  { id: 'cites-study', label: 'Cites a real, linked study', isFake: false, why: 'A claim you can trace to a real peer-reviewed study is far more trustworthy.' },
  { id: 'doctors-hate', label: "'Doctors hate this trick'", isFake: true, why: '"They don\'t want you to know" is a conspiracy trope, not real medicine.' },
  { id: 'polished-ai', label: 'Polished but repetitive', isFake: true, why: 'Overly polished, repetitive, vague-on-specifics text is a sign of AI-generated content.' },
  { id: 'calm-facts', label: 'Calm, specific facts', isFake: false, why: 'Measured, specific language with verifiable detail is the mark of real reporting.' },
  { id: 'no-source', label: 'No byline, no sources', isFake: true, why: 'No author and no sources means nothing can be verified — treat it as fake.' },
  { id: 'exif-photo', label: 'Photo has EXIF data', isFake: false, why: 'Authentic camera metadata (EXIF) is strong evidence of a real photograph.' },
  { id: 'theyre-hiding', label: "'They are hiding the truth!'", isFake: true, why: 'Hidden-truth conspiracy framing is designed to bypass your critical thinking.' },
  { id: 'dates-links', label: 'Names, dates, and links', isFake: false, why: 'Verifiable sources, dates, and links are what real journalism provides.' },
  { id: 'six-fingers', label: 'Hand has six fingers', isFake: true, why: 'Extra fingers and melting features are classic AI-image generation artifacts.' },
  { id: 'peer-reviewed', label: 'Peer-reviewed and replicated', isFake: false, why: 'Published, peer-reviewed, and replicated findings are the gold standard for real science.' },
];

function getTiles(levelId: number): MediaItem[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 tiles
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: MediaItem[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  const seen = new Set<string>();
  const deduped = out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
  // Guarantee at least one fake to catch.
  if (!deduped.some((it) => it.isFake)) deduped[0] = BANK.find((b) => b.isFake)!;
  return deduped;
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the REVEAL inspection hunt
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'hunt'>('welcome');
  const tiles = useMemo(() => getTiles(level.id), [level.id]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const fakeTotal = useMemo(() => tiles.filter((t) => t.isFake).length, [tiles]);
  const maxScore = fakeTotal * 10 + 20;

  const sceneTiles = useMemo<RevealTile[]>(
    () => tiles.map((t) => ({ id: t.id, isPrize: t.isFake, label: t.label })),
    [tiles],
  );

  const finishLevel = useCallback((finalScore: number, finalWrong: number, finalRevealed: Record<string, boolean>) => {
    const all: Record<string, boolean> = { ...finalRevealed };
    tiles.forEach((t) => { all[t.id] = true; });
    setRevealed(all);

    const accuracyBonus = Math.max(0, 20 - finalWrong * 5);
    const total = finalScore + accuracyBonus;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 1400);
  }, [tiles, level, maxScore, onComplete]);

  const handleReveal = useCallback((id: string, isPrize: boolean) => {
    if (revealed[id]) return;
    const tile = tiles.find((t) => t.id === id);
    if (!tile) return;

    const nextRevealed = { ...revealed, [id]: true };
    setRevealed(nextRevealed);

    if (isPrize) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setFeedback({
        type: 'correct',
        message: nextCombo > 2 ? `${nextCombo}x combo! Fake caught +${gained}` : `Fake caught! +${gained}`,
        explanation: tile.why,
      });
      const foundNow = tiles.filter((t) => t.isFake && nextRevealed[t.id]).length;
      juice.onCorrect(foundNow, nextScore);
      if (foundNow >= fakeTotal) finishLevel(nextScore, wrongTaps, nextRevealed);
    } else {
      setCombo(0);
      const nextWrong = wrongTaps + 1;
      setWrongTaps(nextWrong);
      setFeedback({ type: 'info', message: 'That one is real.', explanation: tile.why });
      juice.onWrong(0, score);
    }
  }, [revealed, tiles, combo, score, wrongTaps, fakeTotal, juice, finishLevel]);

  const found = tiles.filter((t) => t.isFake && revealed[t.id]).length;

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🔍" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Inspect:</strong> Tap every snippet you judge <strong>fake</strong>. Catch all {fakeTotal} fakes!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('hunt')}>
          Start Inspecting <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ HUNT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🔍" color={LAB_COLOR}>Spot the Fakes</GlowingTitle>
        <span className="text-sm font-bold" style={{ color: LAB_COLOR }}>
          <Search className="w-4 h-4 inline mr-1" />{found} / {fakeTotal}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <PixiRevealStage
        tiles={sceneTiles}
        columns={4}
        revealed={revealed}
        onReveal={handleReveal}
        labColor={LAB_COLOR}
        actionLabel="Flag as fake"
        showLabelsCovered
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={() => finishLevel(score, wrongTaps, revealed)}>
          <Sparkles className="w-4 h-4 mr-2" />
          {found >= fakeTotal ? 'All fakes caught!' : 'Finish inspection'}
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
export default function RealOrFakeGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('real-or-fake', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Real or Fake?" color={LAB_COLOR} labNum={6}>
      <GameLevelSystem
        gameTitle="Real or Fake?"
        gameEmoji="🔍"
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
