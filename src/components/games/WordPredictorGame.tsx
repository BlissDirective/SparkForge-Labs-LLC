// ════════════════════════════════════════════════════════════════════════
// WORD PREDICTOR v4 — Lab 4 (AI That Creates) — REACT archetype (Wave 3)
// ════════════════════════════════════════════════════════════════════════
// Was a next-word multiple-choice quiz. Now a timed REACT drill: candidate
// next-words rise as cards, each with a probability bar; tap the LIKELIEST one
// before it fades. Teaches that a language model outputs a probability
// distribution — and you learn to read it under time pressure. Pixi REACT scene
// (labeled ReactionArena) inside GameShell.
//
// Teaches: token probability — the most likely next word wins.

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, Timer, Crosshair,
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
  GlowingTitle, ScoreDisplay, ComboCounter,
} from '@/components/games/shared/GameVisualKit';
import type { TargetContent } from '@/components/games/pixi/scenes/ReactionArena';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiReactStage = dynamic(() => import('@/components/games/pixi/PixiReactStage'), {
  ssr: false,
  loading: () => <PixiStageSkeleton />,
});

const LAB_COLOR = '#D9A430';
const ROUND_SEC = 26;

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Simple Sentences', description: 'Tap the word that fits — easy mode!', emoji: '📝', difficulty: 'easy', starThresholds: [70, 120, 180], xpReward: 50 },
  { id: 2, name: 'Rhyme Time', description: 'What rhymes and fits?', emoji: '🎵', difficulty: 'easy', starThresholds: [70, 120, 180], xpReward: 60 },
  { id: 3, name: 'Context Clues', description: 'Use the sentence context!', emoji: '🔍', difficulty: 'easy', starThresholds: [70, 120, 180], xpReward: 70 },
  { id: 4, name: 'Famous Phrases', description: 'Complete well-known sayings.', emoji: '📚', difficulty: 'medium', starThresholds: [80, 130, 190], xpReward: 80 },
  { id: 5, name: 'Science Words', description: 'Technical term predictions.', emoji: '🔬', difficulty: 'medium', starThresholds: [80, 130, 190], xpReward: 90 },
  { id: 6, name: 'Ambiguous Context', description: 'Trickier distributions!', emoji: '🤔', difficulty: 'medium', starThresholds: [80, 140, 200], xpReward: 100 },
  { id: 7, name: 'Long Context', description: 'Remember earlier in the line.', emoji: '📖', difficulty: 'hard', starThresholds: [90, 150, 210], xpReward: 120 },
  { id: 8, name: 'Creative Writing', description: 'Predict story continuations.', emoji: '✍️', difficulty: 'hard', starThresholds: [90, 150, 210], xpReward: 130 },
  { id: 9, name: 'Code Completion', description: 'Predict the next code token!', emoji: '💻', difficulty: 'expert', starThresholds: [100, 160, 220], xpReward: 150 },
  { id: 10, name: 'Grand Predictor', description: 'The ultimate prediction drill.', emoji: '👑', difficulty: 'expert', starThresholds: [100, 170, 230], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'A language model scores every possible next word. The one with the highest probability is its prediction.',
  2: 'Rhyme and rhythm raise a word\'s probability. The model learned these patterns from huge amounts of text.',
  3: 'Context shifts the odds. The same blank can have a different likeliest word depending on the sentence.',
  4: 'Famous phrases are very high-probability — the model has seen them thousands of times.',
  5: 'Even technical terms have predictable contexts. "Mitochondria is the ___ of the cell" → powerhouse.',
  6: 'When meanings are ambiguous, the distribution flattens — several words become almost equally likely.',
  7: 'Long context lets the model use earlier words to sharpen its prediction of the next one.',
  8: 'In creative text the distribution is wide — many continuations are plausible, but some are likelier.',
  9: 'Code is highly predictable: syntax constrains what token can legally come next.',
  10: 'Master test: read each distribution fast and tap the most probable next word.',
};

// ════════════════════════════════════════════════════════════════════════
// PREDICTION PROMPTS — sentence with a blank + candidate words with prob (0–1)
// (faithful to v3 facts; the highest-prob word is the correct prediction)
// ════════════════════════════════════════════════════════════════════════
interface Prompt { text: string; candidates: { word: string; prob: number }[]; }

const PROMPTS: Record<number, Prompt[]> = {
  1: [
    { text: 'The cat sat on the ___', candidates: [{ word: 'mat', prob: 0.82 }, { word: 'moon', prob: 0.05 }, { word: 'water', prob: 0.04 }] },
    { text: 'The sun is very ___', candidates: [{ word: 'hot', prob: 0.7 }, { word: 'blue', prob: 0.12 }, { word: 'tiny', prob: 0.05 }] },
    { text: 'I drink a glass of ___', candidates: [{ word: 'water', prob: 0.66 }, { word: 'rocks', prob: 0.04 }, { word: 'sky', prob: 0.03 }] },
  ],
  2: [
    { text: 'Twinkle, twinkle, little ___', candidates: [{ word: 'star', prob: 0.9 }, { word: 'light', prob: 0.06 }, { word: 'moon', prob: 0.03 }] },
    { text: 'Roses are red, violets are ___', candidates: [{ word: 'blue', prob: 0.85 }, { word: 'sweet', prob: 0.08 }, { word: 'green', prob: 0.03 }] },
    { text: 'Columbus sailed the ocean ___', candidates: [{ word: 'blue', prob: 0.8 }, { word: 'wide', prob: 0.1 }, { word: 'deep', prob: 0.06 }] },
  ],
  3: [
    { text: 'An apple a day keeps the ___ away', candidates: [{ word: 'doctor', prob: 0.88 }, { word: 'teacher', prob: 0.05 }, { word: 'chef', prob: 0.03 }] },
    { text: 'The quick brown fox jumps over the lazy ___', candidates: [{ word: 'dog', prob: 0.86 }, { word: 'cat', prob: 0.07 }, { word: 'horse', prob: 0.03 }] },
    { text: 'It is raining cats and ___', candidates: [{ word: 'dogs', prob: 0.92 }, { word: 'mice', prob: 0.03 }, { word: 'frogs', prob: 0.02 }] },
  ],
  4: [
    { text: 'To be or not to ___', candidates: [{ word: 'be', prob: 0.93 }, { word: 'see', prob: 0.04 }, { word: 'go', prob: 0.02 }] },
    { text: 'Better late than ___', candidates: [{ word: 'never', prob: 0.9 }, { word: 'sorry', prob: 0.06 }, { word: 'early', prob: 0.02 }] },
    { text: 'Practice makes ___', candidates: [{ word: 'perfect', prob: 0.91 }, { word: 'better', prob: 0.06 }, { word: 'noise', prob: 0.01 }] },
  ],
  5: [
    { text: 'The mitochondria is the ___ of the cell', candidates: [{ word: 'powerhouse', prob: 0.84 }, { word: 'brain', prob: 0.08 }, { word: 'heart', prob: 0.05 }] },
    { text: 'Water is made of hydrogen and ___', candidates: [{ word: 'oxygen', prob: 0.88 }, { word: 'carbon', prob: 0.06 }, { word: 'helium', prob: 0.03 }] },
    { text: 'The Earth orbits the ___', candidates: [{ word: 'Sun', prob: 0.9 }, { word: 'Moon', prob: 0.06 }, { word: 'Mars', prob: 0.02 }] },
  ],
  6: [
    { text: 'I went to the bank to fish by the ___', candidates: [{ word: 'river', prob: 0.6 }, { word: 'money', prob: 0.2 }, { word: 'road', prob: 0.12 }] },
    { text: 'She waved the bat to scare the ___', candidates: [{ word: 'animal', prob: 0.5 }, { word: 'ball', prob: 0.28 }, { word: 'crowd', prob: 0.14 }] },
    { text: 'The spring felt warm and ___', candidates: [{ word: 'bright', prob: 0.52 }, { word: 'bouncy', prob: 0.26 }, { word: 'wet', prob: 0.16 }] },
  ],
  7: [
    { text: 'Maria packed her bags because she was flying to ___', candidates: [{ word: 'Paris', prob: 0.55 }, { word: 'school', prob: 0.2 }, { word: 'bed', prob: 0.1 }] },
    { text: 'After the storm, the sky finally turned ___', candidates: [{ word: 'clear', prob: 0.58 }, { word: 'loud', prob: 0.16 }, { word: 'heavy', prob: 0.12 }] },
    { text: 'He studied all night so the test would feel ___', candidates: [{ word: 'easy', prob: 0.6 }, { word: 'scary', prob: 0.2 }, { word: 'loud', prob: 0.08 }] },
  ],
  8: [
    { text: 'The dragon opened its eyes and breathed ___', candidates: [{ word: 'fire', prob: 0.62 }, { word: 'bubbles', prob: 0.2 }, { word: 'snow', prob: 0.12 }] },
    { text: 'The robot beeped twice and then ___', candidates: [{ word: 'spoke', prob: 0.5 }, { word: 'danced', prob: 0.28 }, { word: 'melted', prob: 0.14 }] },
    { text: 'Behind the secret door was a glowing ___', candidates: [{ word: 'crystal', prob: 0.5 }, { word: 'staircase', prob: 0.3 }, { word: 'sandwich', prob: 0.08 }] },
  ],
  9: [
    { text: 'print(___)  # show Hello', candidates: [{ word: '"Hello"', prob: 0.8 }, { word: 'Hello', prob: 0.12 }, { word: 'echo', prob: 0.04 }] },
    { text: 'for i in ___(10):', candidates: [{ word: 'range', prob: 0.85 }, { word: 'list', prob: 0.08 }, { word: 'loop', prob: 0.04 }] },
    { text: 'if x == 5: return ___', candidates: [{ word: 'True', prob: 0.6 }, { word: 'five', prob: 0.22 }, { word: 'print', prob: 0.1 }] },
  ],
  10: [
    { text: 'GPT predicts the next ___', candidates: [{ word: 'token', prob: 0.78 }, { word: 'color', prob: 0.08 }, { word: 'sound', prob: 0.06 }] },
    { text: 'The model picks the highest ___', candidates: [{ word: 'probability', prob: 0.82 }, { word: 'letter', prob: 0.1 }, { word: 'volume', prob: 0.04 }] },
    { text: 'A pangram uses every ___', candidates: [{ word: 'letter', prob: 0.86 }, { word: 'word', prob: 0.08 }, { word: 'page', prob: 0.03 }] },
  ],
};

function topWord(p: Prompt): string {
  return p.candidates.reduce((a, b) => (b.prob > a.prob ? b : a)).word;
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the REACT prediction drill
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const prompts = useMemo(() => PROMPTS[level.id] || PROMPTS[1], [level.id]);

  const [phase, setPhase] = useState<'welcome' | 'drill'>('welcome');
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [qIdx, setQIdx] = useState(0);

  const maxScore = 240;
  const active = phase === 'drill' && timeLeft > 0;
  const question = prompts[qIdx % prompts.length];
  const best = useMemo(() => topWord(question), [question]);

  const scoreRef = useRef(0);
  scoreRef.current = score;
  // Current question in a ref so makeTarget (stable identity) reads the latest.
  const questionRef = useRef(question);
  questionRef.current = question;

  // Round countdown + rotating prompt.
  useEffect(() => {
    if (phase !== 'drill') return;
    const tick = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    const rotate = setInterval(() => setQIdx((i) => i + 1), 3800);
    return () => { clearInterval(tick); clearInterval(rotate); };
  }, [phase]);

  // End of round → score it.
  useEffect(() => {
    if (phase !== 'drill' || timeLeft > 0) return;
    const total = scoreRef.current;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    const id = setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: ROUND_SEC * 1000 });
    }, 900);
    return () => clearTimeout(id);
  }, [phase, timeLeft, level, maxScore, onComplete]);

  // Labeled-target factory — one candidate per spawn from the live question.
  const makeTarget = useCallback((): TargetContent => {
    const q = questionRef.current;
    const cand = q.candidates[Math.floor(Math.random() * q.candidates.length)];
    const isBest = cand.word === q.candidates.reduce((a, b) => (b.prob > a.prob ? b : a)).word;
    return { label: cand.word, correct: isBest, prob: cand.prob, color: LAB_COLOR };
  }, []);

  const handleHit = useCallback((correct?: boolean) => {
    if (!active) return;
    if (correct) {
      setHits((h) => h + 1);
      setCombo((c) => {
        const nc = c + 1;
        setScore((s) => {
          const ns = s + 10 + c;
          juice.onCorrect(nc, ns);
          return ns;
        });
        return nc;
      });
    } else {
      setMisses((m) => m + 1);
      setCombo(0);
      juice.onWrong(0, scoreRef.current);
    }
  }, [active, juice]);

  // Letting a card expire is neutral here (no penalty) — only wrong taps hurt.
  const handleMiss = useCallback(() => {}, []);

  const choices = useMemo(
    () => question.candidates.map((c) => ({ label: c.word, correct: c.word === best })),
    [question, best],
  );

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="📝" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Drill:</strong> Words rise with a probability bar. Tap the <strong>likeliest</strong> next word before it fades!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => { setTimeLeft(ROUND_SEC); setPhase('drill'); }}>
          Start Drill <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ DRILL ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="📝" color={LAB_COLOR}>Predict the Word</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: timeLeft <= 5 ? '#FF4D4D' : LAB_COLOR }}>
          <Timer className="w-4 h-4" />{timeLeft}s
        </span>
      </div>

      <div className="rounded-xl px-3 py-2 text-sm font-semibold flex items-center gap-2" style={{ background: `${LAB_COLOR}12`, color: LAB_COLOR }}>
        <Crosshair className="w-4 h-4" /> <span style={{ color: '#1A1D2B' }}>{question.text}</span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <PixiReactStage
        active={active}
        makeTarget={makeTarget}
        choices={choices}
        onHit={handleHit}
        onMiss={handleMiss}
        labColor={LAB_COLOR}
        status={`${hits} correct, ${misses} wrong. Streak ${combo}.`}
        spawnEveryMs={900}
        lifeMs={1900}
        maxConcurrent={3}
        reducedMotion={!!prefersReducedMotion}
      />

      <div className="flex items-center justify-between text-xs" style={{ color: '#8C94AC' }}>
        <span>Correct: <strong style={{ color: '#2ECC71' }}>{hits}</strong> · Wrong: <strong style={{ color: '#FF4D4D' }}>{misses}</strong></span>
        <SFButton variant="outline" size="sm" onClick={onExit} aria-label="Exit level">Exit</SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function WordPredictorGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('word-predictor', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Word Predictor" color={LAB_COLOR} labNum={4}>
      <GameLevelSystem
        gameTitle="Word Predictor"
        gameEmoji="📝"
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
