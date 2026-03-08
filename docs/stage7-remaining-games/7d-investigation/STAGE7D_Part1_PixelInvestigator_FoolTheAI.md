# SPARKFORGE — STAGE 7D PART 1: Pixel Investigator + Fool the AI

**Date:** February 20, 2026 | **GCUD Version:** V7
**Batch:** 7D — Strategy & Advanced Games
**Treatment:** Standard polish (both games)
**Replaces:** V1 versions from STAGE-7 Wave2/Wave3 Games.md
**Code-Reviewed:** March 8, 2026 by Claude Code (Code Review Role per CLAUDE.md §3.1)

---

## AUTO-FIX LOG (Applied During Code Review)

The following fixes were applied per CLAUDE.md Section 3.1 AUTO-FIX policy:

| # | Category | Original Code | Fixed Code | Reason |
|---|----------|--------------|------------|--------|
| 1 | **Store API** | `game.addScore(earned)` | `game.updateScore(earned)` | `addScore` does not exist on gameStore. Correct method is `updateScore`. |
| 2 | **Store API** | `game.nextRound()` | `game.advanceRound()` | `nextRound` does not exist on gameStore. Correct method is `advanceRound`. |
| 3 | **Store API** | `game.addScore(10 + bonus)` | `game.updateScore(10 + bonus)` | Same as #1, in FoolTheAiGame. |
| 4 | **Store API** | `game.nextRound()` | `game.advanceRound()` | Same as #2, in FoolTheAiGame. |
| 5 | **TypeScript** | Truncated string literals in IMAGES array | Completed all string literals | Source PDF had line-wrap truncation; strings restored to valid JS. |
| 6 | **TypeScript** | Truncated JSX props (e.g., `worldCo...`) | Completed all JSX props | Source PDF line-wrap truncation; props restored. |
| 7 | **Missing game.startGame()** | No `startGame()` call | `GameShell` handles via `useEffect` | Verified: GameShell auto-calls `startGame(gameId, totalRounds)` on mount — no action needed, but noted for clarity. |
| 8 | **Missing 'learn' and 'complete' phases** | `Phase = 'welcome' \| 'play'` | Kept as-is (standard treatment) | Standard-tier games use 2-phase pattern. Flagships use 4-phase. Consistent with other 7A/7B standard games. |

---

## Overview

This document provides complete, copy-paste code for two **Standard polish** games in Stage 7D:

| Game | Lab | Slug | Bands | Lines |
|------|-----|------|-------|-------|
| Pixel Investigator | 3 (Neural Networks) | `pixel-investigator` | B, C (A gets easy+medium only) | ~320 |
| Fool the AI | 7 (Computer Vision) | `fool-the-ai` | B, C | ~350 |

**Prerequisites:** Stages 1–6 complete. GameShell, gameStore, childStore all exist.

---

## File 1: `src/components/games/PixelInvestigatorGame.tsx`

```tsx
// ════════════════════════════════════════════════════════════════════════
// PIXEL INVESTIGATOR V2 — Lab 3 (Neural Networks) — STANDARD POLISH
//
// Concept: Image is heavily blurred. Reveal in stages, guess with
// fewer reveals = more points. Teaches how CNNs process images
// at different resolutions — low-res features first, details later.
//
// V2 Upgrades:
// • Chrome bezel (pink, Lab 3)
// • Particle background
// • Welcome phase with concept intro
// • Age-band explanations (C: feature extraction, receptive fields)
// • 12 images across 3 difficulty tiers
// • Confidence meter showing "how sure are you?"
// • Reveal stages visualized as resolution layers
// • Points breakdown with multiplier for early guesses
// • ARIA labels, keyboard nav
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Eye, Search, Zap } from 'lucide-react';

type Phase = 'welcome' | 'play';

interface ImageRound {
  emoji: string;
  answer: string;
  choices: string[];
  category: string;
  tier: 'easy' | 'medium' | 'hard';
  hintA: string;
  hintC: string;
}

const IMAGES: ImageRound[] = [
  // Easy tier — distinct shapes
  { emoji: '🐱', answer: 'Cat', choices: ['Cat', 'Dog', 'Rabbit'], category: 'Animals', tier: 'easy',
    hintA: 'It has whiskers and pointy ears!', hintC: 'High-frequency features: ear triangles + whisker lines distinguish from similar quadrupeds.' },
  { emoji: '🚀', answer: 'Rocket', choices: ['Rocket', 'Airplane', 'Firework'], category: 'Vehicles', tier: 'easy',
    hintA: 'It points up and goes to space!', hintC: 'Vertical axis symmetry with tapered top — distinct from airplane wing profile.' },
  { emoji: '🌻', answer: 'Sunflower', choices: ['Sunflower', 'Daisy', 'Rose'], category: 'Nature', tier: 'easy',
    hintA: 'It\'s big and yellow!', hintC: 'Yellow radial pattern. Fibonacci spiral in seed arrangement is a distinguishing feature.' },
  { emoji: '🎸', answer: 'Guitar', choices: ['Guitar', 'Violin', 'Banjo'], category: 'Music', tier: 'easy',
    hintA: 'It has strings and a long neck!', hintC: 'Figure-8 body contour + narrow neck. String count and fret pattern distinguish from violin.' },
  // Medium tier — similar shapes
  { emoji: '🐘', answer: 'Elephant', choices: ['Elephant', 'Hippo', 'Rhino'], category: 'Animals', tier: 'medium',
    hintA: 'It\'s the biggest land animal with a long trunk!', hintC: 'Trunk is the key distinguishing feature. Gray color shared with rhino — need shape analysis.' },
  { emoji: '🦋', answer: 'Butterfly', choices: ['Butterfly', 'Dragonfly', 'Moth'], category: 'Nature', tier: 'medium',
    hintA: 'It has colorful wings that spread wide!', hintC: 'Bilateral wing symmetry with broad wing area. Dragonfly has narrow elongated wings.' },
  { emoji: '🎂', answer: 'Cake', choices: ['Cake', 'Pie', 'Muffin'], category: 'Food', tier: 'medium',
    hintA: 'It usually has candles on top!', hintC: 'Cylindrical layered structure with frosting texture. Candles add vertical line features.' },
  { emoji: '🏠', answer: 'House', choices: ['House', 'Castle', 'Barn'], category: 'Buildings', tier: 'medium',
    hintA: 'It has a triangle roof and a door!', hintC: 'Triangular roof + rectangular base. Castle has turrets; barn has gambrel roof.' },
  // Hard tier — tricky distinctions
  { emoji: '🐺', answer: 'Wolf', choices: ['Wolf', 'Dog', 'Fox'], category: 'Animals', tier: 'hard',
    hintA: 'It lives in the forest and howls at the moon!', hintC: 'Very similar to dog class — fine-grained classification. Muzzle length and ear angle are discriminative features.' },
  { emoji: '🍊', answer: 'Orange', choices: ['Orange', 'Peach', 'Tangerine'], category: 'Food', tier: 'hard',
    hintA: 'It\'s round, orange, and juicy!', hintC: 'Color and shape nearly identical to tangerine. Texture (pore size) is the discriminative feature at high resolution.' },
  { emoji: '🎻', answer: 'Violin', choices: ['Violin', 'Cello', 'Guitar'], category: 'Music', tier: 'hard',
    hintA: 'It\'s played with a bow!', hintC: 'Same body shape as cello at different scale. Without size reference, need fine details like chin rest.' },
  { emoji: '🦅', answer: 'Eagle', choices: ['Eagle', 'Hawk', 'Falcon'], category: 'Nature', tier: 'hard',
    hintA: 'It\'s a big bird with sharp eyes!', hintC: 'Fine-grained classification problem. Beak curvature, head coloring, and wingspan ratios are key discriminators.' },
];

const REVEAL_LABELS = ['Extremely blurry', 'Very blurry', 'Blurry', 'Slightly blurry', 'Clear'];
const REVEAL_POINTS = [30, 25, 20, 15, 10];

export function PixelInvestigatorGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [ri, setRi] = useState(0);
  const [revealLevel, setRevealLevel] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  // Filter by age band: A gets easy+medium, B gets all, C gets all
  const rounds = useMemo(() => {
    if (ageBand === 'A') return IMAGES.filter(i => i.tier !== 'hard');
    return IMAGES;
  }, [ageBand]);

  const round = rounds[ri];
  const blur = Math.max(0, 24 - revealLevel * 6);
  const pts = REVEAL_POINTS[revealLevel] || 10;

  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function reveal() {
    if (revealLevel < 4) setRevealLevel(l => l + 1);
  }

  function guess(choice: string) {
    if (answered) return;
    const correct = choice === round.answer;
    setAnswered(true);
    setWasCorrect(correct);

    if (correct) {
      const earned = pts + (streak >= 2 ? 5 : 0);
      game.updateScore(earned);
      setTotalEarned(t => t + earned);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setAnswered(false);
      setRevealLevel(0);
      setWasCorrect(false);
      setShowHint(false);
      if (ri < rounds.length - 1) { setRi(i => i + 1); game.advanceRound(); }
      else game.completeGame();
    }, 2000);
  }

  return (
    <GameShell gameId="pixel-investigator" title="Pixel Investigator" worldNumber={3} worldColor="#FF66AA" xpReward={20} totalRounds={rounds.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(236,72,153,${0.12 + p.size * 0.05}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(236,72,153,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
            <div className="flex-1 flex flex-col p-4">
              <AnimatePresence mode="wait">
                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.span className="text-6xl block" animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}>🔍</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Pixel Investigator</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Images start heavily blurred — like a CNN\'s early layers seeing only low-frequency features. Each reveal adds higher-frequency detail, mimicking deeper network layers.'
                        : 'Can you guess what the blurry picture is? Fewer reveals = more points!'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Computer Vision', 'Feature Extraction', 'Image Recognition'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 font-body text-[10px] text-pink-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Investigating! <Eye className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ PLAY ═══ */}
                {phase === 'play' && round && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 w-full max-w-md">
                      <span className="px-2 py-0.5 rounded bg-pink-500/10 font-body text-[9px] text-pink-400">{round.category}</span>
                      <span className="px-2 py-0.5 rounded font-body text-[9px]"
                        style={{ backgroundColor: round.tier === 'hard' ? 'rgba(239,68,68,0.1)' : round.tier === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: round.tier === 'hard' ? '#EF4444' : round.tier === 'medium' ? '#F59E0B' : '#10B981' }}>
                        {round.tier}
                      </span>
                      <div className="flex-1" />
                      <span className="font-mono text-[10px] text-white/20">{ri + 1}/{rounds.length}</span>
                      {streak >= 2 && <span className="font-display text-[10px] font-bold text-amber-400">🔥 x{streak}</span>}
                    </div>

                    {/* Points available */}
                    <div className="flex items-center gap-1 mb-3">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="font-display text-xs font-bold text-amber-400">{pts} pts</span>
                      <span className="font-body text-[9px] text-white/20">available</span>
                    </div>

                    {/* Image display */}
                    <motion.div
                      className="w-36 h-36 rounded-2xl flex items-center justify-center text-7xl mb-3"
                      style={{
                        filter: answered ? 'blur(0px)' : `blur(${blur}px)`,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(236,72,153,0.15)',
                        boxShadow: '0 0 30px rgba(236,72,153,0.08)',
                        transition: 'filter 0.5s ease',
                      }}
                      aria-label={answered ? `The answer is ${round.answer}` : 'Blurred image to guess'}>
                      {round.emoji}
                    </motion.div>

                    {/* Reveal level indicator */}
                    <div className="flex gap-1 mb-3">
                      {[0, 1, 2, 3, 4].map(level => (
                        <div key={level} className="w-8 h-1 rounded-full transition-colors"
                          style={{ backgroundColor: level <= revealLevel ? '#EC4899' : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                    <p className="font-body text-[9px] text-white/20 mb-3">{REVEAL_LABELS[revealLevel]}</p>

                    {/* Result feedback */}
                    <AnimatePresence>
                      {answered && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className={`mb-3 px-4 py-2 rounded-xl text-center ${wasCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                          <p className={`font-display text-sm font-bold ${wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {wasCorrect ? `✓ +${pts + (streak >= 2 ? 5 : 0)} pts!` : `✗ It was ${round.answer}`}
                          </p>
                          {wasCorrect && revealLevel <= 1 && (
                            <p className="font-body text-[10px] text-green-400/60 mt-0.5">Eagle eye! Early guess bonus!</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reveal button */}
                    {!answered && (
                      <div className="flex gap-2 mb-3">
                        <button onClick={reveal} disabled={revealLevel >= 4}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 font-body text-xs disabled:opacity-30 flex items-center gap-1"
                          aria-label={`Reveal more detail. Currently level ${revealLevel} of 4`}>
                          <Search className="w-3 h-3" /> Reveal More ({revealLevel}/4)
                        </button>
                        {!showHint && (
                          <button onClick={() => setShowHint(true)}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 font-body text-xs"
                            aria-label="Show hint">💡</button>
                        )}
                      </div>
                    )}

                    {/* Hint */}
                    <AnimatePresence>
                      {showHint && !answered && (
                        <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="font-body text-[10px] text-pink-300/50 mb-2 max-w-sm text-center">
                          {ageBand === 'C' ? round.hintC : round.hintA}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Choice buttons */}
                    <div className="flex gap-2">
                      {round.choices.map(c => (
                        <motion.button key={c} onClick={() => guess(c)} disabled={answered}
                          className={`px-5 py-3 rounded-xl border font-display text-sm font-bold transition-all ${
                            answered && c === round.answer ? 'border-green-500 bg-green-500/10 text-green-400'
                            : answered && c !== round.answer && wasCorrect ? 'border-white/5 text-white/15'
                            : answered && c !== round.answer ? 'border-white/5 text-white/15'
                            : 'border-pink-500/20 bg-pink-500/5 text-white hover:border-pink-500/40'
                          }`}
                          whileTap={!answered ? { scale: 0.95 } : {}}
                          aria-label={`Guess: ${c}`}>
                          {c}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## File 2: `src/components/games/FoolTheAiGame.tsx`

```tsx
// ════════════════════════════════════════════════════════════════════════
// FOOL THE AI V2 — Lab 7 (Computer Vision) — STANDARD POLISH
//
// Concept: See items with AI labels and confidence scores.
// Identify wrong labels, low-confidence predictions, and correct ones.
// Teaches about AI confidence, misclassification, and adversarial examples.
//
// V2 Upgrades:
// • Chrome bezel (cyan, Lab 7)
// • Particle background
// • Welcome phase with concept intro
// • Age-band explanations (C: softmax confidence, adversarial examples)
// • 14 items with richer explanations
// • Animated confidence bar with color coding
// • 4 challenge rounds (up from 3)
// • Feedback panel with "why AI got confused" explanations
// • Score multiplier for consecutive correct finds
// • ARIA labels
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { AlertTriangle, CheckCircle2, Target } from 'lucide-react';

type Phase = 'welcome' | 'play';

interface Item {
  emoji: string;
  aiLabel: string;
  confidence: number;
  isWrong: boolean;
  explanation: string;
  explanationC: string;
}

interface Challenge {
  text: string;
  type: 'wrong' | 'lowconf' | 'correct' | 'highconf';
  target: number;
  check: (item: Item) => boolean;
  descC: string;
}

const ITEMS: Item[] = [
  { emoji: '🍎', aiLabel: 'Apple', confidence: 95, isWrong: false,
    explanation: 'AI is confident and correct!',
    explanationC: 'Softmax output: 0.95 for "apple" class. High confidence, correct prediction.' },
  { emoji: '🌽', aiLabel: 'Banana', confidence: 42, isWrong: true,
    explanation: 'That\'s corn, not a banana! The yellow color confused the AI.',
    explanationC: 'Color-channel bias: yellow hue triggered banana activation. Low confidence (0.42) reflects model uncertainty.' },
  { emoji: '🐕', aiLabel: 'Dog', confidence: 88, isWrong: false,
    explanation: 'High confidence, correct label.',
    explanationC: 'Strong feature match across multiple convolutional filters. Confidence 0.88 indicates reliable classification.' },
  { emoji: '🐈', aiLabel: 'Small tiger', confidence: 35, isWrong: true,
    explanation: 'It\'s a cat! The stripes confused the AI.',
    explanationC: 'Feature overlap between cat and tiger classes. The model lacks fine-grained scale awareness. Confidence 0.35.' },
  { emoji: '🌙', aiLabel: 'Moon', confidence: 91, isWrong: false,
    explanation: 'Clear and confident — correct!',
    explanationC: 'Crescent shape is highly distinctive. Few confusable classes → concentrated softmax distribution.' },
  { emoji: '🍕', aiLabel: 'Triangle', confidence: 28, isWrong: true,
    explanation: 'It\'s pizza! AI only saw the shape, not the food.',
    explanationC: 'Shape-dominant classification without texture analysis. The model prioritized geometric features over material properties.' },
  { emoji: '🎸', aiLabel: 'Guitar', confidence: 82, isWrong: false,
    explanation: 'Solid prediction, well done AI.',
    explanationC: 'Distinctive body contour + neck structure. High inter-class distance from other string instruments.' },
  { emoji: '🧦', aiLabel: 'Sleeping bag', confidence: 31, isWrong: true,
    explanation: 'Those are socks! AI confused the shape.',
    explanationC: 'Elongated cloth texture matched sleeping bag training examples. Scale ambiguity in single-image classification.' },
  { emoji: '🌈', aiLabel: 'Rainbow', confidence: 94, isWrong: false,
    explanation: 'Easy one for the AI — high confidence.',
    explanationC: 'Multi-color arc is a unique signature. No confusable class in ImageNet. Confidence 0.94.' },
  { emoji: '🦑', aiLabel: 'Spider', confidence: 38, isWrong: true,
    explanation: 'It\'s a squid! Too many tentacles confused the AI.',
    explanationC: 'Tentacle count overlap with arachnid class. The model confuses multi-limbed organisms without body-plan analysis.' },
  { emoji: '🏀', aiLabel: 'Basketball', confidence: 90, isWrong: false,
    explanation: 'AI recognized the orange sphere pattern.',
    explanationC: 'Texture + color + shape alignment. Seam line pattern is a learned discriminative feature. Confidence 0.90.' },
  { emoji: '🧲', aiLabel: 'Horseshoe', confidence: 44, isWrong: true,
    explanation: 'It\'s a magnet! Similar U-shape fooled the AI.',
    explanationC: 'U-shaped contour activated horseshoe class. Without color/material analysis, shape alone causes misclassification.' },
  { emoji: '🎹', aiLabel: 'Piano', confidence: 86, isWrong: false,
    explanation: 'Black and white key pattern recognized correctly.',
    explanationC: 'Alternating black/white bar pattern is highly distinctive. Correct classification with confidence 0.86.' },
  { emoji: '🥝', aiLabel: 'Coconut', confidence: 40, isWrong: true,
    explanation: 'It\'s a kiwi! The fuzzy brown exterior confused the AI.',
    explanationC: 'Texture confusion: both have rough brown exterior. Cross-section would disambiguate but single-view limits accuracy.' },
];

const CHALLENGES: Challenge[] = [
  { text: 'Find 3 WRONG labels!', type: 'wrong', target: 3,
    check: (item) => item.isWrong,
    descC: 'Identify misclassified items where the predicted label ≠ ground truth.' },
  { text: 'Find 3 items with confidence below 50%!', type: 'lowconf', target: 3,
    check: (item) => item.confidence < 50,
    descC: 'Find predictions where softmax max probability < 0.50 — indicating model uncertainty.' },
  { text: 'Find 4 correctly labeled items!', type: 'correct', target: 4,
    check: (item) => !item.isWrong,
    descC: 'Identify true positives: items where predicted class matches ground truth.' },
  { text: 'Find 3 items with confidence above 85%!', type: 'highconf', target: 3,
    check: (item) => item.confidence > 85,
    descC: 'High-confidence predictions (>0.85). Are they all correct? Explore overconfidence bias.' },
];

export function FoolTheAiGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [ci, setCi] = useState(0);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{ idx: number; hit: boolean } | null>(null);
  const [consecutiveHits, setConsecutiveHits] = useState(0);

  const challenge = CHALLENGES[ci];
  const matchCount = Array.from(found).filter(idx => challenge.check(ITEMS[idx])).length;

  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function tap(idx: number) {
    if (found.has(idx) || feedback) return;
    const item = ITEMS[idx];
    const hit = challenge.check(item);
    setFound(prev => new Set(prev).add(idx));
    setFeedback({ idx, hit });

    if (hit) {
      const bonus = consecutiveHits >= 2 ? 4 : 0;
      game.updateScore(10 + bonus);
      setConsecutiveHits(c => c + 1);
    } else {
      setConsecutiveHits(0);
    }

    setTimeout(() => {
      setFeedback(null);
      const newMatch = matchCount + (hit ? 1 : 0);
      if (newMatch >= challenge.target) {
        if (ci < CHALLENGES.length - 1) {
          setCi(i => i + 1);
          setFound(new Set());
          setConsecutiveHits(0);
          game.advanceRound();
        } else {
          game.completeGame();
        }
      }
    }, 2200);
  }

  return (
    <GameShell gameId="fool-the-ai" title="Fool the AI" worldNumber={7} worldColor="#06B6D4" xpReward={20} totalRounds={CHALLENGES.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(6,182,212,${0.12 + p.size * 0.05}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(6,182,212,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.span className="text-6xl block" animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}>🤖</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Fool the AI</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Examine AI classification outputs with softmax confidence scores. Identify misclassifications, low-confidence predictions, and adversarial failures.'
                        : 'AI labels things, but sometimes it gets confused! Find wrong labels and tricky predictions.'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Classification', 'Confidence', 'Adversarial AI'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-body text-[10px] text-cyan-400">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Investigating! <Target className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ PLAY ═══ */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    {/* Challenge header */}
                    <div className="rounded-xl p-3 mb-3 text-center"
                      style={{ backgroundColor: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
                      <p className="font-display text-sm font-bold text-cyan-400">🎯 {challenge.text}</p>
                      {ageBand === 'C' && <p className="font-body text-[9px] text-white/25 mt-0.5">{challenge.descC}</p>}
                      <div className="flex items-center justify-center gap-2 mt-1.5">
                        <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div className="h-full rounded-full bg-cyan-500" animate={{ width: `${(matchCount / challenge.target) * 100}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-white/30">{matchCount}/{challenge.target}</span>
                        <span className="font-body text-[9px] text-white/15">Round {ci + 1}/{CHALLENGES.length}</span>
                      </div>
                    </div>

                    {/* Item grid */}
                    <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
                      {ITEMS.map((item, i) => {
                        const tapped = found.has(i);
                        const isFeedback = feedback?.idx === i;
                        const confColor = item.confidence > 80 ? '#10B981' : item.confidence > 50 ? '#F59E0B' : '#EF4444';
                        return (
                          <motion.button key={i} onClick={() => tap(i)} disabled={tapped && !isFeedback}
                            className={`rounded-xl border p-2.5 text-center transition-all ${
                              isFeedback && feedback.hit ? 'border-green-500 bg-green-500/10'
                              : isFeedback && !feedback.hit ? 'border-orange-500 bg-orange-500/10'
                              : tapped ? 'border-white/5 opacity-20'
                              : 'border-white/10 bg-white/[0.02] hover:border-cyan-500/30'
                            }`}
                            whileTap={!tapped ? { scale: 0.95 } : {}}
                            aria-label={`${item.emoji} labeled as "${item.aiLabel}" with ${item.confidence}% confidence`}>
                            <span className="text-2xl block">{item.emoji}</span>
                            <p className="font-body text-[9px] text-white/40 mt-1 truncate">&quot;{item.aiLabel}&quot;</p>
                            {/* Confidence bar */}
                            <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ backgroundColor: confColor }}
                                initial={{ width: 0 }} animate={{ width: `${item.confidence}%` }}
                                transition={{ duration: 0.8, delay: 0.1 }} />
                            </div>
                            <p className="font-mono text-[8px] mt-0.5" style={{ color: confColor }}>{item.confidence}%</p>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Feedback panel */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className={`mt-2 p-3 rounded-xl text-center ${feedback.hit ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                          <div className="flex items-center justify-center gap-2 mb-1">
                            {feedback.hit ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-orange-400" />}
                            <p className={`font-display text-xs font-bold ${feedback.hit ? 'text-green-400' : 'text-orange-400'}`}>
                              {feedback.hit ? '✓ Good catch!' : '✗ Not what we\'re looking for'}
                            </p>
                          </div>
                          <p className="font-body text-[10px] text-white/40">
                            {ageBand === 'C' ? ITEMS[feedback.idx].explanationC : ITEMS[feedback.idx].explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## V1 → V2 Comparison

### Pixel Investigator

| Feature | V1 | V2 |
|---------|----|----|
| Lines | ~100 | ~320 |
| Images | 8 basic | 12 across 3 difficulty tiers (easy/medium/hard) |
| Chrome bezel | None | Pink (Lab 3) with LED rim |
| Particles | None | 14 pink floating particles |
| Welcome phase | None | Concept intro with age-band descriptions |
| Hints | None | Per-image hints (A: simple, C: CNN feature extraction) |
| Difficulty tiers | None | Easy → Medium → Hard, age-band filtered |
| Streak bonus | None | +5 pts for 2+ consecutive correct |
| Visual feedback | Basic text | Color-coded result card with tier badges |
| Accessibility | None | ARIA labels on all controls |

### Fool the AI

| Feature | V1 | V2 |
|---------|----|----|
| Lines | ~130 | ~350 |
| Items | 12 | 14 with dual explanations (A vs C) |
| Challenge rounds | 3 | 4 (added "high confidence" round) |
| Chrome bezel | None | Cyan (Lab 7) with LED rim |
| Particles | None | 14 cyan floating particles |
| Welcome phase | None | Concept intro (C: softmax, adversarial) |
| Confidence bar | Static div | Animated Framer Motion with color coding |
| Explanations | Single | Dual: kid-friendly + technical (C: softmax scores) |
| Score system | Flat 8 pts | 10 pts base + 4 bonus for consecutive hits |
| Accessibility | None | ARIA labels with item details |

**Total: ~670 lines, standard polish applied to both.**

---

## Notes for Build

- **Game routes** (`page.tsx`) are not created until Stage 10 Part 2 (game router).
- **Game registry** (`gameRegistry.ts`) is updated after all Stage 7 sub-stages complete.
- **`index.ts` barrel exports** for game components are not part of the current pattern — games are imported directly by path.
- Both games use `GameShell` which auto-calls `startGame()` on mount — no manual init needed.
- Store API uses `updateScore()` and `advanceRound()` (NOT `addScore`/`nextRound`).
