# SPARKFORGE — STAGE 7A: BATCH A — TAP & QUIZ GAMES (8 games, Enhanced)

**Date:** February 19, 2026 | **GCUD Version:** V7
**Depends on:** Stage 6A (GameShell, gameStore) complete
**Produces:** Enhanced rewrites of 8 tap/quiz games
**Enhancement Level:** Standard Polish (~300-400 lines each)

---

## ENHANCEMENT STANDARD APPLIED TO ALL 8 GAMES

Every game in this batch receives:

1. Chrome bezel frame with world-colored LED rim
2. Particle background (12 particles, world color)
3. Welcome phase with game title, emoji, description, topic tags
4. Age-band content (Band A simpler, Band C technical depth)
5. Improved data (more rounds/scenarios, richer content)
6. Better feedback (animated responses, educational explanations)
7. ARIA labels for accessibility
8. Consistent phase structure (welcome → play → complete)

---

## Game 1: `src/components/games/TimeMachineGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// TIME MACHINE V2 — Lab 1 (What IS AI?)
// Drag AI milestone cards to correct timeline positions.
// Enhanced: chrome bezel, welcome phase, age-band content,
// more milestones, visual timeline, educational tooltips.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Clock, GraduationCap, ChevronRight } from 'lucide-react';

type Phase = 'welcome' | 'play' | 'done';

interface Milestone {
  id: string;
  year: number;
  label: string;
  desc: string;
  descC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_MILESTONES: Milestone[] = [
  { id: 'm1', year: 1950, label: 'Turing Test', desc: 'Alan Turing asks: "Can machines think?"', descC: 'Turing proposes the imitation game as a benchmark for machine intelligence.', band: 'A' },
  { id: 'm2', year: 1961, label: 'Robot Arm', desc: 'First industrial robot arm starts work', descC: 'Unimate, the first programmable industrial robot, begins operation at GM.', band: 'A' },
  { id: 'm3', year: 1997, label: 'Deep Blue', desc: 'IBM\'s computer beats world chess champion', descC: 'Deep Blue defeats Kasparov using brute-force search with evaluation heuristics.', band: 'A' },
  { id: 'm4', year: 2011, label: 'Siri', desc: 'Apple launches first mainstream voice assistant', descC: 'Siri demonstrates commercial NLU with speech recognition and intent classification.', band: 'A' },
  { id: 'm5', year: 2016, label: 'AlphaGo', desc: 'AI beats world champion at the game of Go', descC: 'AlphaGo uses Monte Carlo tree search + deep RL to master Go\'s 10^170 state space.', band: 'A' },
  { id: 'm6', year: 2022, label: 'ChatGPT', desc: 'Conversational AI goes mainstream', descC: 'GPT-3.5 fine-tuned with RLHF demonstrates emergent conversational capabilities.', band: 'A' },
  { id: 'm7', year: 1966, label: 'ELIZA', desc: 'First chatbot mimics a therapist', descC: 'Joseph Weizenbaum\'s ELIZA uses pattern matching to simulate Rogerian psychotherapy.', band: 'B' },
  { id: 'm8', year: 2012, label: 'ImageNet', desc: 'Deep learning revolutionizes image recognition', descC: 'AlexNet\'s CNN achieves 15.3% top-5 error on ImageNet, halving the previous best.', band: 'B' },
  { id: 'm9', year: 1958, label: 'Perceptron', desc: 'First neural network hardware built', descC: 'Frank Rosenblatt\'s Mark I Perceptron implements single-layer binary classification.', band: 'C' },
  { id: 'm10', year: 1987, label: 'AI Winter', desc: 'Funding dries up, AI research slows', descC: 'Collapse of the LISP machine market triggers second AI winter, reducing funding.', band: 'C' },
  { id: 'm11', year: 1986, label: 'Backprop', desc: 'Key algorithm for training neural networks', descC: 'Rumelhart, Hinton & Williams popularize backpropagation for multi-layer networks.', band: 'C' },
  { id: 'm12', year: 2017, label: 'Transformer', desc: 'Architecture that powers modern AI', descC: '"Attention Is All You Need" introduces self-attention, replacing recurrence.', band: 'C' },
  { id: 'm13', year: 2023, label: 'GPT-4', desc: 'Multimodal AI sees images and text', descC: 'GPT-4 demonstrates multimodal reasoning across vision and language modalities.', band: 'C' },
  { id: 'm14', year: 2024, label: 'Claude', desc: 'Anthropic\'s helpful and harmless AI', descC: 'Claude demonstrates constitutional AI alignment with RLHF + CAI training.', band: 'C' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function TimeMachineGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [placed, setPlaced] = useState<Map<string, number>>(new Map());
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; correct: boolean } | null>(null);

  const milestones = useMemo(
    () => ALL_MILESTONES.filter(m => BAND_ORDER[m.band] <= BAND_ORDER[ageBand]).sort((a, b) => a.year - b.year),
    [ageBand]
  );

  const [trayCards, setTrayCards] = useState<Milestone[]>(() => {
    const s = [...milestones];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  });

  const slots = milestones.map(m => m.year);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 6 + 4,
  })), []);

  function handleSlotClick(slotYear: number) {
    if (!selectedCard) return;
    const card = milestones.find(m => m.id === selectedCard);
    if (!card) return;

    const correct = card.year === slotYear;
    setFeedback({ id: card.id, correct });

    if (correct) {
      setPlaced(prev => new Map(prev).set(card.id, slotYear));
      setTrayCards(prev => {
        const remaining = prev.filter(c => c.id !== card.id);
        if (remaining.length === 0) {
          setTimeout(() => game.completeGame(), 2000);
        }
        return remaining;
      });
      game.updateScore(12);
      game.advanceRound();
    }
    setSelectedCard(null);

    setTimeout(() => {
      setFeedback(null);
    }, 2000);
  }

  return (
    <GameShell gameId="time-machine" title="Time Machine" worldNumber={1} worldColor="#00BBFF">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
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
                background: `radial-gradient(circle, rgba(0,187,255,${0.15 + p.size * 0.06}), rgba(0,0,0,0))`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(0,187,255,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
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
                    <span className="text-5xl">⏰</span>
                    <h2 className="font-display text-2xl font-bold text-white">Time Machine</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Travel through the history of AI! Place milestone cards on the correct year.
                    </p>
                    <div className="flex gap-2">
                      {['AI History', 'Timeline', 'Milestones'].map(t => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-sky-400/10 border border-sky-400/20 text-sky-400 font-body text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #00BBFF, #0099DD)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Start the Time Machine! <Clock className="inline w-4 h-4 ml-1" />
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
                    <p className="font-body text-xs text-white/30 mb-3 text-center">
                      Select a card, then tap the correct year on the timeline
                    </p>

                    {/* Timeline */}
                    <div className="flex-1 overflow-x-auto mb-4">
                      <div className="flex items-end gap-1 min-w-max px-2 pb-2">
                        {slots.map(year => {
                          const placedMilestone = milestones.find(m => placed.has(m.id) && placed.get(m.id) === year);
                          const isFeedbackTarget = feedback && milestones.find(m => m.id === feedback.id)?.year === year;
                          return (
                            <motion.button
                              key={year}
                              onClick={() => handleSlotClick(year)}
                              className={`flex flex-col items-center px-2 py-2 rounded-lg min-w-[64px] transition-all ${
                                placedMilestone
                                  ? 'bg-sky-400/15 border border-sky-400/30'
                                  : selectedCard
                                    ? 'bg-white/5 border border-white/15 hover:border-sky-400/40'
                                    : 'bg-white/[0.02] border border-white/5'
                              } ${isFeedbackTarget && feedback?.correct ? 'ring-2 ring-green-500/50' : ''}`}
                              whileTap={selectedCard && !placedMilestone ? { scale: 0.95 } : {}}
                              aria-label={`Timeline slot: ${year}`}
                            >
                              <span className="font-mono text-[10px] text-white/30">{year}</span>
                              {placedMilestone && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="mt-1"
                                >
                                  <p className="font-display text-[9px] font-bold text-sky-400">
                                    {placedMilestone.label}
                                  </p>
                                </motion.div>
                              )}
                              {!placedMilestone && (
                                <div className="w-6 h-6 rounded-full border border-dashed border-white/10 mt-1" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`mb-3 px-4 py-2 rounded-xl text-center ${
                            feedback.correct
                              ? 'bg-green-500/10 border border-green-500/30'
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}
                        >
                          <p
                            className="font-display text-xs font-bold"
                            style={{ color: feedback.correct ? '#4ade80' : '#f87171' }}
                          >
                            {feedback.correct ? '✅ Correct!' : '❌ Wrong year — try again!'}
                          </p>
                          {feedback.correct && (() => {
                            const m = milestones.find(ml => ml.id === feedback.id);
                            return m ? (
                              <p className="font-body text-[10px] text-white/40 mt-0.5">
                                {ageBand === 'C' ? m.descC : m.desc}
                              </p>
                            ) : null;
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Card tray */}
                    <div className="border-t border-white/5 pt-3">
                      <p className="font-body text-[10px] text-white/20 mb-2">📇 Cards to place:</p>
                      <div className="flex flex-wrap gap-2">
                        {trayCards.map(card => (
                          <motion.button
                            key={card.id}
                            onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
                            className={`px-3 py-2 rounded-lg border text-left transition-all ${
                              selectedCard === card.id
                                ? 'border-sky-400/50 bg-sky-400/10 ring-1 ring-blue-500/30'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                            whileTap={{ scale: 0.97 }}
                            aria-label={`Milestone card: ${card.label}`}
                          >
                            <p className="font-display text-[11px] font-bold text-white">{card.label}</p>
                            <p className="font-body text-[9px] text-white/30 mt-0.5">
                              {ageBand === 'C' ? card.descC : card.desc}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Game 2: `src/components/games/WordPredictorGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// WORD PREDICTOR V2 — Lab 4 (AI That Creates)
// Guess the next word, see AI's probability distribution.
// Enhanced: chrome bezel, welcome phase, age-band sentences,
// animated probability bars, streak counter, explanations.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Brain, Zap } from 'lucide-react';

type Phase = 'welcome' | 'play';

interface Round {
  sentence: string;
  predictions: { word: string; confidence: number }[];
  explanation: string;
  explanationC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_ROUNDS: Round[] = [
  {
    sentence: 'The cat sat on the ___',
    predictions: [
      { word: 'mat', confidence: 42 },
      { word: 'chair', confidence: 28 },
      { word: 'floor', confidence: 18 },
      { word: 'bed', confidence: 12 },
    ],
    explanation: 'AI picks common words that fit the pattern. "Mat" rhymes and is a classic phrase!',
    explanationC: 'The language model assigns probability mass based on co-occurrence statistics in training data. "mat" has high probability due to the common nursery rhyme pattern.',
    band: 'A',
  },
  {
    sentence: 'The sun rises in the ___',
    predictions: [
      { word: 'east', confidence: 65 },
      { word: 'morning', confidence: 20 },
      { word: 'sky', confidence: 10 },
      { word: 'horizon', confidence: 5 },
    ],
    explanation: 'AI knows facts from training data. The sun rises in the east — high confidence!',
    explanationC: 'Factual knowledge is encoded in model weights during pre-training. "East" dominates due to strong factual grounding in the training corpus.',
    band: 'A',
  },
  {
    sentence: 'I went to the store to buy ___',
    predictions: [
      { word: 'groceries', confidence: 35 },
      { word: 'food', confidence: 25 },
      { word: 'milk', confidence: 20 },
      { word: 'clothes', confidence: 12 },
      { word: 'a gift', confidence: 8 },
    ],
    explanation: 'Many words could fit here! AI spreads probability across likely completions.',
    explanationC: 'When context is ambiguous, the model produces a flatter probability distribution across semantically valid completions.',
    band: 'A',
  },
  {
    sentence: 'She picked up her phone and ___',
    predictions: [
      { word: 'called', confidence: 30 },
      { word: 'texted', confidence: 25 },
      { word: 'checked', confidence: 20 },
      { word: 'scrolled', confidence: 15 },
      { word: 'dialed', confidence: 10 },
    ],
    explanation: 'All these actions make sense after picking up a phone. AI considers all of them!',
    explanationC: 'The conditional probability P(word|context) is distributed across actions semantically associated with phone usage in the training data.',
    band: 'B',
  },
  {
    sentence: 'The robot learned to ___',
    predictions: [
      { word: 'walk', confidence: 22 },
      { word: 'talk', confidence: 20 },
      { word: 'dance', confidence: 18 },
      { word: 'cook', confidence: 15 },
      { word: 'paint', confidence: 13 },
      { word: 'sing', confidence: 12 },
    ],
    explanation: 'Robots can learn many things! The AI gives similar probability to each option.',
    explanationC: 'High entropy distribution — the model has weak preference across multiple valid continuations, indicating contextual ambiguity.',
    band: 'B',
  },
  {
    sentence: 'Neural networks are inspired by the ___',
    predictions: [
      { word: 'brain', confidence: 72 },
      { word: 'mind', confidence: 15 },
      { word: 'body', confidence: 8 },
      { word: 'heart', confidence: 5 },
    ],
    explanation: 'Very high confidence! Neural networks are named after brain neurons.',
    explanationC: 'Low entropy distribution — strong association between "neural networks" and "brain" in technical literature produces a peaked distribution.',
    band: 'B',
  },
  {
    sentence: 'The transformer architecture uses ___',
    predictions: [
      { word: 'attention', confidence: 78 },
      { word: 'layers', confidence: 12 },
      { word: 'embeddings', confidence: 7 },
      { word: 'tokens', confidence: 3 },
    ],
    explanation: 'The transformer\'s key innovation is the attention mechanism!',
    explanationC: '"Attention Is All You Need" (Vaswani et al., 2017) established self-attention as the core mechanism, creating very strong co-occurrence statistics.',
    band: 'C',
  },
  {
    sentence: 'Backpropagation computes the gradient of the ___',
    predictions: [
      { word: 'loss', confidence: 68 },
      { word: 'error', confidence: 18 },
      { word: 'cost', confidence: 10 },
      { word: 'function', confidence: 4 },
    ],
    explanation: 'Backprop calculates how to reduce the loss — the model\'s error measure.',
    explanationC: 'Backprop computes ∂L/∂θ via the chain rule. "loss" is the canonical term in ML literature, followed by synonyms "error" and "cost".',
    band: 'C',
  },
  {
    sentence: 'The weather today is very ___',
    predictions: [
      { word: 'cold', confidence: 28 },
      { word: 'hot', confidence: 25 },
      { word: 'nice', confidence: 22 },
      { word: 'rainy', confidence: 15 },
      { word: 'windy', confidence: 10 },
    ],
    explanation: 'Weather can be many things! The AI doesn\'t know today\'s actual weather.',
    explanationC: 'Without real-time data access, the model relies on prior probability of weather descriptors — a nearly uniform distribution reflecting genuine uncertainty.',
    band: 'A',
  },
  {
    sentence: 'In the future, AI will ___',
    predictions: [
      { word: 'be', confidence: 30 },
      { word: 'help', confidence: 25 },
      { word: 'change', confidence: 20 },
      { word: 'transform', confidence: 15 },
      { word: 'replace', confidence: 10 },
    ],
    explanation: 'The future is uncertain — AI spreads its guesses across many possibilities!',
    explanationC: 'Speculative contexts produce high-entropy distributions. The model cannot predict the future but reflects training data biases about AI narratives.',
    band: 'B',
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function WordPredictorGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [guess, setGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);

  const rounds = useMemo(
    () => ALL_ROUNDS.filter(r => BAND_ORDER[r.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const round = rounds[roundIdx];
  const matched = round?.predictions.find(p => p.word.toLowerCase() === guess.trim().toLowerCase());

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 6 + 4,
  })), []);

  function submitGuess() {
    if (!guess.trim()) return;
    setShowResult(true);
    if (matched) {
      setStreak(s => s + 1);
      game.updateScore(15);
    } else {
      setStreak(0);
      game.updateScore(5);
    }
    setTimeout(() => {
      setShowResult(false);
      setGuess('');
      if (roundIdx < rounds.length - 1) {
        setRoundIdx(i => i + 1);
        game.advanceRound();
      } else {
        game.completeGame();
      }
    }, 4000);
  }

  return (
    <GameShell gameId="word-predictor" title="Word Predictor" worldNumber={4} worldColor="#FFAA44">
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
                background: `radial-gradient(circle, rgba(255,170,68,${0.15 + p.size * 0.06}), rgba(0,0,0,0))`,
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
              border: '1px solid rgba(255,170,68,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
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
                    <span className="text-5xl">🔮</span>
                    <h2 className="font-display text-2xl font-bold text-white">Word Predictor</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Can you guess the next word? See how AI predicts language!
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Next Token', 'Probability', 'Language Model'].map(t => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-orange-400/10 border border-orange-400/20 text-orange-400 font-body text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #FFAA44, #DD8822)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Start Predicting! <Brain className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'play' && round && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-md mx-auto space-y-4"
                  >
                    {streak >= 3 && (
                      <p className="font-display text-xs text-orange-400 mb-2">
                        🔥 {streak} streak!
                      </p>
                    )}
                    <p className="font-body text-white/40 text-xs mb-4">What word comes next?</p>
                    <p className="font-display text-xl font-bold text-white mb-6">
                      {round.sentence.replace('___', '')}
                      <span className="inline-block w-20 border-b-2 border-orange-400/40 mx-1" />
                    </p>

                    {!showResult ? (
                      <div className="flex gap-2 max-w-xs mx-auto">
                        <input
                          type="text"
                          value={guess}
                          onChange={e => setGuess(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitGuess()}
                          placeholder="Your guess..."
                          autoFocus
                          aria-label="Word prediction guess"
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm focus:outline-none focus:border-orange-400/50"
                        />
                        <motion.button
                          onClick={submitGuess}
                          disabled={!guess.trim()}
                          className="px-5 py-3 rounded-xl text-white font-display font-bold text-sm disabled:opacity-30"
                          style={{ background: 'linear-gradient(135deg, #FFAA44, #DD8822)' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Zap className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <p className="font-display text-sm font-bold text-orange-400 mb-1">
                          You guessed: "{guess}"
                        </p>
                        <p className="font-body text-sm text-white/60 mb-4">
                          {matched
                            ? `✅ The AI predicted that too! (${matched.confidence}% confidence)`
                            : '🤔 The AI had different predictions — see below!'}
                        </p>
                        <div className="space-y-2 max-w-xs mx-auto text-left">
                          <p className="font-body text-xs text-white/30">AI's probability distribution:</p>
                          {round.predictions.map(p => (
                            <div key={p.word} className="flex items-center gap-2">
                              <span
                                className={`font-body text-xs w-16 text-right ${
                                  p.word.toLowerCase() === guess.trim().toLowerCase()
                                    ? 'text-orange-400 font-bold'
                                    : 'text-white/40'
                                }`}
                              >
                                {p.word}
                              </span>
                              <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
                                <motion.div
                                  className="h-full rounded bg-orange-400/60"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${p.confidence}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 }}
                                />
                              </div>
                              <span className="font-mono text-[10px] text-white/30 w-8">
                                {p.confidence}%
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="font-body text-[10px] text-white/25 mt-3 max-w-xs mx-auto">
                          {ageBand === 'C' ? round.explanationC : round.explanation}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Games 3-8: Standard Polish Pattern

The following 6 games follow the identical enhancement pattern as Games 1-2 above:

1. Chrome bezel with world-colored LED rim + particles
2. Welcome phase before gameplay begins
3. Age-band content (Band A/B/C descriptions)
4. Improved visual feedback with animated transitions
5. ARIA labels on interactive elements

### Game 3: Token Chopper (`TokenChopperGame.tsx`)

- **Lab:** 4 — AI That Creates | **Color:** `#F59E0B`
- **Enhancement:** Add welcome phase, expand challenges from 3 → 5, add "cost calculator" showing $/1K tokens, age-band explanations of tokenization, color-coded token categories (word vs subword vs punctuation vs space)
- **V1 lines:** 124 → **V2 target:** ~320 lines

### Game 4: AI Art Detective (`AiArtDetectiveGame.tsx`)

- **Lab:** 4 — AI That Creates | **Color:** `#F59E0B`
- **Enhancement:** Add welcome phase, expand rounds from 8 → 10, add "art analysis" phase where kids learn 4 tells (symmetry, texture, gradients, details), add confidence meter for each guess, score multiplier for streaks
- **V1 lines:** 119 → **V2 target:** ~330 lines

### Game 5: Tool Picker (`ToolPickerGame.tsx`)

- **Lab:** 5 — Agents & Helpers | **Color:** `#10B981`
- **Enhancement:** Add welcome phase, expand tools from 4 → 6 (add Translator, Image Generator), expand tasks from 10 → 15, add "why this tool?" explanation after each pick, add combo streak rewards
- **V1 lines:** 170 → **V2 target:** ~350 lines

### Game 6: Data Shield (`DataShieldGame.tsx`)

- **Lab:** 6 — AI & Ethics | **Color:** `#EF4444`
- **Enhancement:** Add welcome phase with privacy primer, expand scenarios from 4 → 6 (add Social Media and Smart Speaker), add visual shield icon that cracks/glows, add "privacy tip" after each decision, age-band graduated severity explanations
- **V1 lines:** 176 → **V2 target:** ~380 lines

### Game 7: Real or Fake? (`RealOrFakeGame.tsx`)

- **Lab:** 6 — AI & Ethics | **Color:** `#EF4444`
- **Enhancement:** Add welcome phase, expand rounds from 8 → 12, add content type variety (text, headlines, social media posts, product reviews), add "detection strategy" tips, confidence scoring
- **V1 lines:** 115 → **V2 target:** ~320 lines

### Game 8: Prediction Market (`PredictionMarketGame.tsx`)

- **Lab:** 10 — AI's Future | **Color:** `#D946EF`
- **Enhancement:** Add welcome phase, expand predictions from 5 → 8, add "expert analysis" card after voting explaining current research, add time horizon indicators (2025/2030/2035), animated vote tallying
- **V1 lines:** 118 → **V2 target:** ~340 lines

---

## Implementation Note

Each game listed above should be built following the exact same chrome bezel + particles + welcome phase + age-band pattern demonstrated in Games 1-2. The V1 code in `STAGE-7_Wave2_Wave3_Games.md` provides the core gameplay logic — wrap it in the standard bezel, add the welcome phase, expand the content arrays, and add age-band differentiation.

---

## VERIFICATION CHECKLIST — BATCH 7A

Run `npm run dev` and test each game at `http://localhost:3000/arcade/[slug]`:

### All 8 Games — Universal Checks

- [ ] Chrome bezel with world-colored LED rim renders
- [ ] Particle background animates in world color
- [ ] Welcome phase shows title, emoji, description, topic tags
- [ ] Gameplay phase works correctly with feedback
- [ ] Age-band content renders appropriately (Band A vs B vs C)
- [ ] ARIA labels present on interactive elements
- [ ] Game completes and awards XP

### Per-Game Checks

- [ ] **Time Machine** (`/arcade/time-machine`): Cards select → slots click → correct placement → educational desc
- [ ] **Word Predictor** (`/arcade/word-predictor`): Input guess → probability bars animate → explanation shows
- [ ] **Token Chopper** (`/arcade/token-chopper`): Text input → live tokenization → challenge check
- [ ] **AI Art Detective** (`/arcade/ai-art-detective`): Two panels → guess AI side → clue reveals
- [ ] **Tool Picker** (`/arcade/tool-picker`): Task appears → timer counts → tool pick → feedback
- [ ] **Data Shield** (`/arcade/data-shield`): Scenario → data point → Shield/Share → privacy meter
- [ ] **Real or Fake** (`/arcade/real-or-fake`): Content card → Real/Fake → clue reveals
- [ ] **Prediction Market** (`/arcade/prediction-market`): Question → vote → bar chart results

### Commit

```bash
git add .
git commit -m "Stage 7A: 8 enhanced tap/quiz games with chrome bezels and age bands"
git push origin main
```

---

**Stage 7A complete.** 8 tap & quiz games enhanced with chrome bezel frames, particle backgrounds, welcome phases, age-band content differentiation, improved data sets, and accessibility labels. Games 1-2 provided as full implementations; Games 3-8 follow the identical pattern with game-specific content expansions noted.
