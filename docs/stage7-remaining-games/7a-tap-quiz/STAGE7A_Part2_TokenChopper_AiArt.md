# SPARKFORGE — STAGE 7A PART 2: Token Chopper + AI Art Detective

**Continues from:** `STAGE7A_BatchA_TapQuiz_8Games.md` (Games 1-2)
**Games in this file:** Token Chopper (Game 3), AI Art Detective (Game 4)

---

## Game 3: `src/components/games/TokenChopperGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// TOKEN CHOPPER V2 — Lab 4 (AI That Creates)
// Type text, see it split into tokens in real-time.
// Enhanced: chrome bezel, welcome phase, 5 challenges,
// token categories, cost calculator, age-band explanations.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Scissors, Zap } from 'lucide-react';

type Phase = 'welcome' | 'play';

function tokenize(text: string): { token: string; type: 'word' | 'subword' | 'punct' | 'space' }[] {
  if (!text.trim()) return [];
  const result: { token: string; type: 'word' | 'subword' | 'punct' | 'space' }[] = [];
  const parts = text.match(/[A-Z]?[a-z]+|[A-Z]+|[0-9]+|[^\w\s]|\s+/g) || [];
  parts.forEach(part => {
    if (/^\s+$/.test(part)) {
      result.push({ token: '⎵', type: 'space' });
    } else if (/^[^\w\s]$/.test(part)) {
      result.push({ token: part, type: 'punct' });
    } else if (part.length <= 4) {
      result.push({ token: part, type: 'word' });
    } else {
      let i = 0;
      while (i < part.length) {
        const chunk = Math.min(3 + Math.floor(Math.random() * 3), part.length - i);
        result.push({ token: part.slice(i, i + chunk), type: i === 0 ? 'word' : 'subword' });
        i += chunk;
      }
    }
  });
  return result;
}

const TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  word: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
  subword: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)' },
  punct: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  space: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
};

const CHALLENGES = [
  { text: 'Type a 4-letter word that stays as one token!', target: 'single', hint: 'Short common words like "play" or "code" stay as one token.' },
  { text: 'Find a word that splits into 3+ tokens!', target: 'split3', hint: 'Try longer words like "understanding" or "extraordinary".' },
  { text: 'Write a sentence with exactly 10 tokens!', target: 'exact10', hint: 'Count words + spaces + punctuation. A 5-word sentence is usually about right.' },
  { text: 'Use punctuation to create 5+ punctuation tokens!', target: 'punct5', hint: 'Try: "Hello! How are you? Fine, thanks!!!"' },
  { text: 'Write something that costs over $0.00005!', target: 'expensive', hint: 'More tokens = more cost. Write a longer paragraph!' },
];

export function TokenChopperGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [text, setText] = useState('');
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);

  const tokens = useMemo(() => tokenize(text), [text]);
  const cost = (tokens.length * 0.00001).toFixed(5);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 6 + 4,
  })), []);

  function checkChallenge() {
    const c = CHALLENGES[challengeIdx];
    let passed = false;
    if (c.target === 'single' && tokens.some(t => t.type === 'word' && t.token.length === 4)) passed = true;
    if (c.target === 'split3') {
      const words = text.split(/\s+/);
      passed = words.some(w => tokenize(w).length >= 3);
    }
    if (c.target === 'exact10' && tokens.length === 10) passed = true;
    if (c.target === 'punct5' && tokens.filter(t => t.type === 'punct').length >= 5) passed = true;
    if (c.target === 'expensive' && parseFloat(cost) > 0.00005) passed = true;

    if (passed && !completed.has(challengeIdx)) {
      setCompleted(prev => new Set(prev).add(challengeIdx));
      game.addScore(15);
      game.nextRound();
      setShowHint(false);
      if (challengeIdx < CHALLENGES.length - 1) {
        setTimeout(() => {
          setChallengeIdx(i => i + 1);
          setText('');
        }, 1500);
      } else {
        setTimeout(() => game.completeGame(), 1500);
      }
    }
  }

  return (
    <GameShell gameId="token-chopper" title="Token Chopper" worldNumber={4} worldColor="#F59E0B">
      <div className="h-full flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(245,158,11,${0.15 + p.size * 0.06}), rgba(0,0,0,0))`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(245,158,11,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <span className="text-5xl">✂️</span>
                    <h2 className="font-display text-2xl font-bold text-white">Token Chopper</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Explore how language models tokenize text using byte-pair encoding. See subword splitting in action.'
                        : 'See how AI chops up your words into tiny pieces called "tokens"! Every word has a cost.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Tokenization', 'Subwords', 'API Cost'].map(t => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-body text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Start Chopping! <Scissors className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'play' && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Challenge bar */}
                    <div className="rounded-xl p-3 mb-3 border border-amber-500/20 bg-amber-500/5">
                      <p className="font-display text-sm font-bold text-amber-400">
                        🎯 {CHALLENGES[challengeIdx].text}
                      </p>
                      {showHint && (
                        <p className="font-body text-[10px] text-white/30 mt-1">
                          💡 {CHALLENGES[challengeIdx].hint}
                        </p>
                      )}
                      {!showHint && (
                        <button
                          onClick={() => setShowHint(true)}
                          className="font-body text-[10px] text-white/20 hover:text-white/40 mt-1"
                        >
                          Show hint
                        </button>
                      )}
                    </div>

                    {/* Input */}
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Type anything here to see tokens..."
                      aria-label="Text input for tokenization"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm mb-3 resize-none h-20 focus:outline-none focus:border-amber-500/50"
                    />

                    {/* Stats bar */}
                    <div className="flex items-center gap-4 mb-3">
                      <span className="font-data text-xs text-white/40">{tokens.length} tokens</span>
                      <span className="font-mono text-xs text-white/20">≈ ${cost}</span>
                      <div className="flex gap-2 ml-auto">
                        {[
                          { label: 'word', color: '#3B82F6' },
                          { label: 'sub', color: '#8B5CF6' },
                          { label: 'punct', color: '#EF4444' },
                          { label: 'space', color: '#6B7280' },
                        ].map(c => (
                          <span key={c.label} className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: c.color }}
                            />
                            <span className="font-body text-[8px] text-white/20">{c.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Token pills */}
                    <div className="flex-1 overflow-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {tokens.map((tok, i) => (
                          <motion.span
                            key={`${tok.token}-${i}`}
                            className="px-2.5 py-1 rounded-lg font-mono text-xs text-white"
                            style={{
                              backgroundColor: TYPE_COLORS[tok.type].bg,
                              border: `1px solid ${TYPE_COLORS[tok.type].border}`,
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            {tok.token}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {/* Check */}
                    <motion.button
                      onClick={checkChallenge}
                      className="mt-3 w-full py-3 rounded-xl text-white font-display font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Check Challenge ✨
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Game 4: `src/components/games/AiArtDetectiveGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// AI ART DETECTIVE V2 — Lab 4 (AI That Creates)
// Side-by-side: human vs AI art. Guess which is which.
// Enhanced: chrome bezel, welcome phase, art analysis tips,
// confidence meter, streak scoring, age-band clues.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Palette, Eye } from 'lucide-react';

type Phase = 'welcome' | 'tips' | 'play';

interface ArtRound {
  leftGradient: string;
  rightGradient: string;
  aiSide: 'left' | 'right';
  clue: string;
  clueC: string;
  leftShapes: { x: number; y: number; size: number; type: 'circle' | 'square'; opacity: number }[];
  rightShapes: { x: number; y: number; size: number; type: 'circle' | 'square'; opacity: number }[];
}

const ROUNDS: ArtRound[] = [
  {
    leftGradient: 'from-rose-600 via-purple-500 to-blue-500',
    rightGradient: 'from-amber-400 via-orange-500 to-red-600',
    aiSide: 'left',
    clue: 'AI art often has smoother, more "perfect" gradients!',
    clueC: 'AI-generated gradients use mathematical interpolation, producing unnaturally smooth transitions.',
    leftShapes: [
      { x: 30, y: 25, size: 40, type: 'circle', opacity: 0.2 },
      { x: 60, y: 55, size: 25, type: 'square', opacity: 0.15 },
    ],
    rightShapes: [
      { x: 25, y: 40, size: 35, type: 'circle', opacity: 0.25 },
      { x: 70, y: 30, size: 20, type: 'square', opacity: 0.18 },
    ],
  },
  {
    leftGradient: 'from-green-400 to-cyan-500',
    rightGradient: 'from-indigo-600 via-purple-600 to-pink-500',
    aiSide: 'right',
    clue: 'AI sometimes creates symmetry that looks too perfect.',
    clueC: 'Generative models trained on centered compositions often produce bilaterally symmetric outputs.',
    leftShapes: [{ x: 40, y: 35, size: 30, type: 'circle', opacity: 0.3 }],
    rightShapes: [
      { x: 50, y: 50, size: 45, type: 'circle', opacity: 0.15 },
      { x: 50, y: 50, size: 30, type: 'square', opacity: 0.1 },
    ],
  },
  {
    leftGradient: 'from-yellow-300 via-green-400 to-blue-600',
    rightGradient: 'from-gray-400 via-slate-500 to-gray-700',
    aiSide: 'left',
    clue: 'AI art can be "too perfect" — no accidental brushstrokes!',
    clueC: 'Neural networks optimize for aesthetic objectives, eliminating stochastic artifacts present in physical media.',
    leftShapes: [
      { x: 30, y: 60, size: 28, type: 'square', opacity: 0.12 },
      { x: 65, y: 30, size: 22, type: 'circle', opacity: 0.2 },
    ],
    rightShapes: [{ x: 45, y: 45, size: 50, type: 'circle', opacity: 0.1 }],
  },
  {
    leftGradient: 'from-fuchsia-500 to-cyan-400',
    rightGradient: 'from-red-500 via-yellow-400 to-green-500',
    aiSide: 'right',
    clue: 'Check for repeated patterns — AI loves consistency!',
    clueC: 'Convolutional layers in generative models can produce spatially repeated features.',
    leftShapes: [{ x: 55, y: 40, size: 35, type: 'circle', opacity: 0.2 }],
    rightShapes: [
      { x: 33, y: 33, size: 20, type: 'square', opacity: 0.15 },
      { x: 66, y: 66, size: 20, type: 'square', opacity: 0.15 },
    ],
  },
  {
    leftGradient: 'from-emerald-400 via-teal-500 to-blue-600',
    rightGradient: 'from-violet-500 via-purple-600 to-indigo-700',
    aiSide: 'left',
    clue: 'AI blends colors in mathematically smooth ways.',
    clueC: 'Diffusion models generate images by denoising in latent space, producing mathematically smooth color transitions.',
    leftShapes: [
      { x: 40, y: 30, size: 25, type: 'circle', opacity: 0.2 },
      { x: 60, y: 65, size: 30, type: 'circle', opacity: 0.15 },
    ],
    rightShapes: [{ x: 35, y: 55, size: 40, type: 'square', opacity: 0.1 }],
  },
  {
    leftGradient: 'from-orange-400 via-red-500 to-pink-600',
    rightGradient: 'from-blue-400 via-indigo-500 to-purple-600',
    aiSide: 'right',
    clue: 'Human art has more textural variation.',
    clueC: 'Physical media introduces stochastic texture variation absent in pixel-perfect generated outputs.',
    leftShapes: [{ x: 50, y: 50, size: 30, type: 'circle', opacity: 0.25 }],
    rightShapes: [
      { x: 25, y: 25, size: 18, type: 'circle', opacity: 0.2 },
      { x: 75, y: 75, size: 18, type: 'circle', opacity: 0.2 },
    ],
  },
  {
    leftGradient: 'from-lime-400 to-emerald-600',
    rightGradient: 'from-rose-400 via-pink-500 to-fuchsia-600',
    aiSide: 'right',
    clue: 'AI can struggle with fine details like text or fingers.',
    clueC: 'Generative models have difficulty with structured details due to limited spatial reasoning in latent representations.',
    leftShapes: [
      { x: 45, y: 40, size: 35, type: 'square', opacity: 0.12 },
      { x: 55, y: 60, size: 20, type: 'circle', opacity: 0.18 },
    ],
    rightShapes: [{ x: 50, y: 50, size: 45, type: 'circle', opacity: 0.15 }],
  },
  {
    leftGradient: 'from-cyan-300 via-blue-500 to-indigo-700',
    rightGradient: 'from-amber-300 via-yellow-400 to-orange-500',
    aiSide: 'left',
    clue: 'Does it seem too polished? That might be the AI!',
    clueC: 'Over-optimization toward aesthetic loss functions produces an "uncanny valley" of artistic perfection.',
    leftShapes: [{ x: 35, y: 30, size: 30, type: 'circle', opacity: 0.2 }],
    rightShapes: [
      { x: 30, y: 40, size: 22, type: 'square', opacity: 0.15 },
      { x: 65, y: 55, size: 28, type: 'circle', opacity: 0.18 },
    ],
  },
  {
    leftGradient: 'from-sky-400 via-cyan-500 to-teal-600',
    rightGradient: 'from-pink-400 via-rose-500 to-red-600',
    aiSide: 'right',
    clue: 'AI-generated images sometimes have "impossible" reflections.',
    clueC: 'Generative models lack physical simulation, producing reflections inconsistent with scene geometry.',
    leftShapes: [
      { x: 40, y: 35, size: 32, type: 'circle', opacity: 0.18 },
      { x: 60, y: 65, size: 32, type: 'circle', opacity: 0.18 },
    ],
    rightShapes: [{ x: 50, y: 45, size: 40, type: 'circle', opacity: 0.2 }],
  },
  {
    leftGradient: 'from-purple-400 via-fuchsia-500 to-pink-500',
    rightGradient: 'from-green-400 via-emerald-500 to-teal-600',
    aiSide: 'left',
    clue: 'The best detectives look at overall "feel" — trust your instincts!',
    clueC: 'Human perception integrates multiple visual cues holistically — leverage gestalt processing for detection.',
    leftShapes: [{ x: 45, y: 50, size: 35, type: 'square', opacity: 0.12 }],
    rightShapes: [
      { x: 35, y: 35, size: 25, type: 'circle', opacity: 0.2 },
      { x: 65, y: 65, size: 25, type: 'circle', opacity: 0.2 },
    ],
  },
];

const DETECTION_TIPS = [
  { title: 'Symmetry Check', emoji: '🔄', tip: 'AI art tends to be more symmetrical. Human art usually has natural asymmetry and imperfections.' },
  { title: 'Texture Test', emoji: '🖌️', tip: 'Look for brushstrokes or texture. AI images are often unnaturally smooth and even.' },
  { title: 'Gradient Analysis', emoji: '🌈', tip: 'AI blends colors mathematically — too perfectly smooth gradients are a giveaway.' },
  { title: 'Detail Inspection', emoji: '🔍', tip: 'Zoom into edges and fine details. AI struggles with text, fingers, and complex structures.' },
];

export function AiArtDetectiveGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  const round = ROUNDS[roundIdx];

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 6 + 4,
  })), []);

  function handleGuess(side: 'left' | 'right') {
    if (showResult) return;
    const correct = side === round.aiSide;
    setShowResult(correct ? 'correct' : 'wrong');
    if (correct) {
      setStreak(s => s + 1);
      game.addScore(12 + streak * 2);
    } else {
      setStreak(0);
      game.addScore(3);
    }
    setTimeout(() => {
      setShowResult(null);
      if (roundIdx < ROUNDS.length - 1) {
        setRoundIdx(i => i + 1);
        game.nextRound();
      } else {
        game.completeGame();
      }
    }, 3500);
  }

  return (
    <GameShell gameId="ai-art-detective" title="AI Art Detective" worldNumber={4} worldColor="#F59E0B">
      <div className="h-full flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(245,158,11,${0.15 + p.size * 0.06}), rgba(0,0,0,0))`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(245,158,11,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4"
                  >
                    <span className="text-5xl">🎨</span>
                    <h2 className="font-display text-2xl font-bold text-white">AI Art Detective</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Can you tell which artwork was made by AI? Study the styles and spot the machine!
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Generative AI', 'Art Analysis', 'Pattern Recognition'].map(t => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-body text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('tips')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Learn Detection Tips! <Eye className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'tips' && (
                  <motion.div
                    key="tips"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4 max-w-sm"
                  >
                    <Palette className="w-6 h-6 text-amber-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">Detection Tips</h3>
                    <p className="font-body text-xs text-white/40">
                      {tipIdx + 1} of {DETECTION_TIPS.length}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={tipIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5"
                      >
                        <span className="text-3xl">{DETECTION_TIPS[tipIdx].emoji}</span>
                        <h4 className="font-display text-sm font-bold text-amber-300 mt-2">
                          {DETECTION_TIPS[tipIdx].title}
                        </h4>
                        <p className="font-body text-xs text-white/50 mt-1">
                          {DETECTION_TIPS[tipIdx].tip}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (tipIdx < DETECTION_TIPS.length - 1) setTipIdx(i => i + 1);
                        else setPhase('play');
                      }}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {tipIdx < DETECTION_TIPS.length - 1 ? 'Next Tip →' : 'Start the Gallery! 🖼️'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('play')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                    >
                      Skip tips →
                    </button>
                  </motion.div>
                )}

                {phase === 'play' && round && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-lg mx-auto"
                  >
                    {streak >= 3 && (
                      <p className="font-display text-xs text-amber-400 mb-2">
                        🔥 {streak} streak! Score multiplier active!
                      </p>
                    )}
                    <p className="font-body text-sm text-white/50 mb-3">
                      Which one was made by AI? Round {roundIdx + 1}/{ROUNDS.length}
                    </p>

                    <div className="flex gap-3 mb-4">
                      {(['left', 'right'] as const).map(side => (
                        <motion.button
                          key={side}
                          onClick={() => handleGuess(side)}
                          className={`flex-1 aspect-square rounded-2xl bg-gradient-to-br ${
                            side === 'left' ? round.leftGradient : round.rightGradient
                          } relative overflow-hidden border-2 ${
                            showResult && side === round.aiSide
                              ? 'border-green-500'
                              : showResult
                                ? 'border-white/10'
                                : 'border-white/20 hover:border-amber-500/50'
                          }`}
                          whileHover={!showResult ? { scale: 1.03 } : {}}
                          whileTap={!showResult ? { scale: 0.97 } : {}}
                          aria-label={`${side} artwork`}
                        >
                          <div className="absolute inset-0">
                            {(side === 'left' ? round.leftShapes : round.rightShapes).map((s, i) => (
                              <div
                                key={i}
                                className="absolute"
                                style={{
                                  left: `${s.x}%`,
                                  top: `${s.y}%`,
                                  width: s.size,
                                  height: s.size,
                                  transform: 'translate(-50%,-50%)',
                                  borderRadius: s.type === 'circle' ? '50%' : '4px',
                                  backgroundColor: `rgba(255,255,255,${s.opacity})`,
                                  ...(s.type === 'square'
                                    ? { transform: 'translate(-50%,-50%) rotate(45deg)' }
                                    : {}),
                                }}
                              />
                            ))}
                          </div>
                          {showResult && side === round.aiSide && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center bg-black/30"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <span className="text-3xl">🤖</span>
                            </motion.div>
                          )}
                          <div className="absolute bottom-2 left-0 right-0 text-center">
                            <span className="px-2 py-0.5 rounded bg-black/30 font-display text-[10px] text-white/70">
                              {side === 'left' ? 'A' : 'B'}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {showResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`rounded-xl p-3 max-w-sm mx-auto ${
                            showResult === 'correct'
                              ? 'bg-green-500/10 border border-green-500/30'
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}
                        >
                          <p
                            className="font-display text-sm font-bold"
                            style={{ color: showResult === 'correct' ? '#4ade80' : '#f87171' }}
                          >
                            {showResult === 'correct' ? '🎯 Great eye!' : '🤔 Tricky one!'}
                          </p>
                          <p className="font-body text-xs text-white/50 mt-1">
                            {ageBand === 'C' ? round.clueC : round.clue}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```
