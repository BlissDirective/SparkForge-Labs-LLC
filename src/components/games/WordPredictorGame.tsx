// ════════════════════════════════════════════════════
// WORD PREDICTOR V2 — Lab 4 (AI That Creates)
// Guess the next word, see AI's probability distribution.
// Enhanced: chrome bezel, welcome phase, age-band sentences,
// animated probability bars, streak counter, explanations.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useSceneStore } from '@/stores/sceneStore';
import { Brain, Zap } from 'lucide-react';

// 3D Environment (no SSR)
const WordPredictorEnvironment = dynamic(
  () => import('@/components/3d/environments/WordPredictorEnvironment'),
  { ssr: false }
);

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
    explanation: 'AI knows facts from training data. The sun rises in the east \u2014 high confidence!',
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
    explanationC: 'High entropy distribution \u2014 the model has weak preference across multiple valid continuations, indicating contextual ambiguity.',
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
    explanationC: 'Low entropy distribution \u2014 strong association between "neural networks" and "brain" in technical literature produces a peaked distribution.',
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
    explanation: 'Backprop calculates how to reduce the loss \u2014 the model\'s error measure.',
    explanationC: 'Backprop computes \u2202L/\u2202\u03B8 via the chain rule. "loss" is the canonical term in ML literature, followed by synonyms "error" and "cost".',
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
    explanationC: 'Without real-time data access, the model relies on prior probability of weather descriptors \u2014 a nearly uniform distribution reflecting genuine uncertainty.',
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
    explanation: 'The future is uncertain \u2014 AI spreads its guesses across many possibilities!',
    explanationC: 'Speculative contexts produce high-entropy distributions. The model cannot predict the future but reflects training data biases about AI narratives.',
    band: 'B',
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function WordPredictorGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);

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

  useEffect(() => {
    setGameSceneContent(<WordPredictorEnvironment wordCount={roundIdx + 1} isPredicting={showResult} />);
  }, [roundIdx, showResult, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
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
    <GameShell gameId="word-predictor" title="Word Predictor" worldNumber={4} worldColor="#FFAA44" totalRounds={rounds.length}>
      <div className="h-full flex flex-col relative z-10 overflow-hidden">
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
                          className="px-2 py-1 rounded-lg bg-orange-400/10 border border-orange-400/20 text-orange-400 font-body text-2xs"
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
                        {streak} streak!
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
                          You guessed: &quot;{guess}&quot;
                        </p>
                        <p className="font-body text-sm text-white/60 mb-4">
                          {matched
                            ? `The AI predicted that too! (${matched.confidence}% confidence)`
                            : 'The AI had different predictions \u2014 see below!'}
                        </p>
                        <div className="space-y-2 max-w-xs mx-auto text-left">
                          <p className="font-body text-xs text-white/30">AI&apos;s probability distribution:</p>
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
                              <span className="font-mono text-2xs text-white/30 w-8">
                                {p.confidence}%
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="font-body text-2xs text-white/25 mt-3 max-w-xs mx-auto">
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
