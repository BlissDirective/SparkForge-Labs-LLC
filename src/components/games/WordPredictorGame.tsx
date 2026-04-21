// ════════════════════════════════════════════════════
// WORD PREDICTOR V2 — Lab 4 (AI That Creates)
// Guess the next word, see AI's probability distribution.
// Enhanced: chrome bezel, welcome phase, age-band sentences,
// animated probability bars, streak counter, explanations.
// ENH: Spring probability bars + brain pulse + streak flame + answer feedback
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { Brain, Zap } from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const WordPredictorEnvironment = dynamic(
  () => import('@/components/3d/environments/WordPredictorEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'play' | 'complete';

interface Round {
  sentence: string;
  predictions: { word: string; confidence: number }[];
  explanation: string;
  explanationC: string;
  band: 'A' | 'B' | 'C';
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
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
  {
    sentence: 'The cat sat on the ___',
    predictions: [
      { word: 'mat', confidence: 45 },
      { word: 'chair', confidence: 25 },
      { word: 'floor', confidence: 18 },
      { word: 'bed', confidence: 12 },
    ],
    explanation: '"The cat sat on the mat" is a classic sentence! AI remembers common phrases.',
    explanationC: 'Highly frequent n-gram in training data. The idiom "cat sat on the mat" creates strong statistical bias toward "mat" despite other valid completions.',
    band: 'A',
  },
  {
    sentence: 'Water boils at 100 degrees ___',
    predictions: [
      { word: 'Celsius', confidence: 75 },
      { word: 'Fahrenheit', confidence: 12 },
      { word: 'centigrade', confidence: 8 },
      { word: 'hot', confidence: 5 },
    ],
    explanation: 'AI knows science facts! Water boils at 100 degrees Celsius.',
    explanationC: 'Factual grounding produces a peaked distribution. The model has high certainty from encyclopedic knowledge encoded during pre-training.',
    band: 'A',
  },
  {
    sentence: 'The astronaut floated in ___',
    predictions: [
      { word: 'space', confidence: 55 },
      { word: 'zero', confidence: 20 },
      { word: 'the', confidence: 15 },
      { word: 'air', confidence: 10 },
    ],
    explanation: 'Astronauts float in space! AI connects "astronaut" and "floating" to space.',
    explanationC: 'Strong semantic priming from co-occurrence of "astronaut" and "space" in training data creates high conditional probability.',
    band: 'A',
  },
  {
    sentence: 'The musician played a beautiful ___',
    predictions: [
      { word: 'song', confidence: 40 },
      { word: 'melody', confidence: 30 },
      { word: 'piece', confidence: 18 },
      { word: 'tune', confidence: 12 },
    ],
    explanation: 'All these words fit! AI spreads probability across musical terms.',
    explanationC: 'Near-synonyms in the same semantic field create a moderately flat distribution with gradual probability decay.',
    band: 'A',
  },
  {
    sentence: 'The detective found a clue in the ___',
    predictions: [
      { word: 'room', confidence: 28 },
      { word: 'house', confidence: 22 },
      { word: 'garden', confidence: 18 },
      { word: 'library', confidence: 16 },
      { word: 'basement', confidence: 16 },
    ],
    explanation: 'Detectives find clues everywhere! AI considers many locations equally likely.',
    explanationC: 'Location nouns following "in the" are relatively interchangeable in detective narratives, producing a uniform distribution.',
    band: 'B',
  },
  {
    sentence: 'Machine learning models need lots of ___',
    predictions: [
      { word: 'data', confidence: 65 },
      { word: 'training', confidence: 18 },
      { word: 'time', confidence: 10 },
      { word: 'compute', confidence: 7 },
    ],
    explanation: 'Data is the fuel for machine learning! AI knows this from its own training.',
    explanationC: '"Data" dominates due to the extremely common collocation "lots of data" in ML literature and educational content.',
    band: 'B',
  },
  {
    sentence: 'The self-driving car uses sensors to ___',
    predictions: [
      { word: 'detect', confidence: 35 },
      { word: 'navigate', confidence: 30 },
      { word: 'see', confidence: 20 },
      { word: 'avoid', confidence: 15 },
    ],
    explanation: 'Sensors help self-driving cars understand the world around them!',
    explanationC: 'Multiple valid verb completions create a moderately peaked distribution with "detect" and "navigate" as primary actions in autonomous vehicle literature.',
    band: 'B',
  },
  {
    sentence: 'GPT stands for Generative Pre-trained ___',
    predictions: [
      { word: 'Transformer', confidence: 92 },
      { word: 'Technology', confidence: 4 },
      { word: 'Tool', confidence: 3 },
      { word: 'Text', confidence: 1 },
    ],
    explanation: 'Very high confidence! GPT stands for Generative Pre-trained Transformer.',
    explanationC: 'Near-deterministic distribution. The acronym expansion is a fixed fact with extremely strong co-occurrence in the training corpus.',
    band: 'C',
  },
  {
    sentence: 'Overfitting occurs when a model memorizes the ___',
    predictions: [
      { word: 'training', confidence: 60 },
      { word: 'data', confidence: 25 },
      { word: 'noise', confidence: 10 },
      { word: 'examples', confidence: 5 },
    ],
    explanation: 'Overfitting means the AI memorizes training data instead of learning patterns!',
    explanationC: '"Training data" is the canonical phrase in ML. "Noise" is technically more precise but less frequent in introductory contexts.',
    band: 'C',
  },
  {
    sentence: 'The attention mechanism allows models to focus on ___',
    predictions: [
      { word: 'relevant', confidence: 50 },
      { word: 'important', confidence: 25 },
      { word: 'specific', confidence: 15 },
      { word: 'different', confidence: 10 },
    ],
    explanation: 'Attention helps AI focus on the most important parts of the input!',
    explanationC: '"Relevant" collocates strongly with attention mechanism descriptions. The mechanism computes dynamic weighted averages over input positions.',
    band: 'C',
  },
];

export function WordPredictorGame() {
  const prefersReducedMotion = useReducedMotion();
  const game = useGameStore();
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('word-predictor', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const { safeTimeout } = useSafeTimeout();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [guess, setGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const animatedScore = useAnimatedCounter(game.score);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const rounds = useFilteredContent(ALL_ROUNDS, tier, ageBand);
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
    // ENH: Brain thinking pulse before reveal
    setIsPredicting(true);
    safeTimeout(() => {
      setIsPredicting(false);
      setShowResult(true);
      if (matched) {
        setStreak(s => s + 1);
        setAnswerFeedback('correct');
        game.updateScore(15);
      } else {
        setStreak(0);
        setAnswerFeedback('wrong');
        game.updateScore(5);
      }
      safeTimeout(() => setAnswerFeedback(null), 1000);
      safeTimeout(() => {
        setShowResult(false);
        setGuess('');
        if (roundIdx < rounds.length - 1) {
          setRoundIdx(i => i + 1);
          game.advanceRound();
        } else {
          setPhase('complete');
          game.completeGame();
        }
      }, 4000);
    }, 800);
  }

  return (
    <GameShell gameId="word-predictor" title="Word Predictor" worldNumber={4} worldColor="#D9A430" totalRounds={rounds.length}>
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
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: p.dur, delay: p.delay, repeat: Infinity }}
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
                    {/* ENH: Animated brain entrance */}
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                    >
                      <motion.span
                        className="text-5xl inline-block"
                        animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                      >
                        🔮
                      </motion.span>
                      <motion.div
                        className="absolute -inset-3 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(255,170,68,0.15), transparent)' }}
                        animate={prefersReducedMotion ? {} : { scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Word Predictor welcome phase">Word Predictor</h2>
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
                      aria-label="Start the Word Predictor game"
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
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={roundIdx + 1} total={rounds.length} labColor="#FFAA44" />
                    </div>
                    {/* ENH: Streak flame that grows with consecutive correct guesses */}
                    {streak >= 2 && (
                      <motion.div
                        className="flex items-center gap-1 mb-2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={streak}
                      >
                        <motion.span
                          className="inline-block"
                          style={{ fontSize: `${Math.min(12 + streak * 3, 28)}px` }}
                          animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
                        >
                          {streak >= 5 ? '\uD83D\uDD25\uD83D\uDD25' : '\uD83D\uDD25'}
                        </motion.span>
                        <motion.span
                          className="font-display text-xs font-bold"
                          style={{
                            color: '#FFAA44',
                            textShadow: `0 0 ${4 + streak * 3}px rgba(255,170,68,${0.3 + streak * 0.1})`,
                          }}
                        >
                          {streak} streak!
                        </motion.span>
                      </motion.div>
                    )}
                    <p className="font-body text-white/40 text-xs mb-4" role="status" aria-label={`Round ${roundIdx + 1} of ${rounds.length}`}>What word comes next?</p>
                    <p className="font-display text-xl font-bold text-white mb-6" aria-label={`Sentence to complete: ${round.sentence}`}>
                      {round.sentence.replace('___', '')}
                      <span className="inline-block w-20 border-b-2 border-orange-400/40 mx-1" />
                    </p>

                    {!showResult ? (
                      <div className="space-y-3">
                        {/* ENH: Brain thinking pulse during prediction */}
                        {isPredicting && (
                          <motion.div
                            className="flex items-center justify-center gap-2 mb-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div
                              animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, repeat: Infinity }}
                            >
                              <Brain className="w-6 h-6 text-orange-400" />
                            </motion.div>
                            <span className="font-body text-xs text-orange-400/70">AI is thinking...</span>
                          </motion.div>
                        )}
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
                            disabled={isPredicting}
                          />
                          <motion.button
                            onClick={submitGuess}
                            disabled={!guess.trim() || isPredicting}
                            className="px-5 py-3 rounded-xl text-white font-display font-bold text-sm disabled:opacity-30"
                            style={{ background: 'linear-gradient(135deg, #FFAA44, #DD8822)' }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Submit word prediction guess"
                          >
                            <Zap className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {/* ENH: Green flash on correct, red shake on wrong */}
                        <motion.div
                          className={`rounded-xl px-4 py-2 text-center ${
                            answerFeedback === 'correct'
                              ? 'bg-green-500/15 border border-green-500/30'
                              : answerFeedback === 'wrong'
                                ? 'bg-red-500/10 border border-red-500/30'
                                : 'bg-transparent border border-transparent'
                          }`}
                          animate={
                            answerFeedback === 'correct'
                              ? { scale: [1, 1.03, 1], boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 20px rgba(74,222,128,0.3)', '0 0 0px rgba(74,222,128,0)'] }
                              : answerFeedback === 'wrong'
                                ? { x: [-6, 6, -4, 4, -2, 0] }
                                : {}
                          }
                          transition={{ duration: 0.5 }}
                        >
                          <p className="font-display text-sm font-bold text-orange-400 mb-1">
                            You guessed: &quot;{guess}&quot;
                          </p>
                          <p className="font-body text-sm text-white/60">
                            {matched
                              ? `The AI predicted that too! (${matched.confidence}% confidence)`
                              : 'The AI had different predictions \u2014 see below!'}
                          </p>
                        </motion.div>
                        {/* ENH: Spring-animated probability bars */}
                        <div className="space-y-2 max-w-xs mx-auto text-left">
                          <p className="font-body text-xs text-white/30">AI&apos;s probability distribution:</p>
                          {round.predictions.map((p, pIdx) => {
                            const isGuessed = p.word.toLowerCase() === guess.trim().toLowerCase();
                            return (
                              <motion.div
                                key={p.word}
                                className="flex items-center gap-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: pIdx * 0.1 }}
                              >
                                <span
                                  className={`font-body text-xs w-16 text-right ${
                                    isGuessed ? 'text-orange-400 font-bold' : 'text-white/40'
                                  }`}
                                >
                                  {p.word}
                                </span>
                                <div className={`flex-1 h-5 bg-white/5 rounded overflow-hidden ${
                                  isGuessed && matched ? 'ring-1 ring-green-400/40' : ''
                                }`}>
                                  <motion.div
                                    className={`h-full rounded ${
                                      isGuessed && matched
                                        ? 'bg-green-400/60'
                                        : isGuessed && !matched
                                          ? 'bg-red-400/40'
                                          : 'bg-orange-400/60'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${p.confidence}%` }}
                                    transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.15 + pIdx * 0.12 }}
                                  />
                                </div>
                                <span className="font-mono text-2xs text-white/30 w-8">
                                  {p.confidence}%
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                        <p className="font-body text-2xs text-white/25 mt-3 max-w-xs mx-auto">
                          {ageBand === 'C' ? round.explanationC : round.explanation}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {phase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span className="text-6xl" animate={prefersReducedMotion ? {} : { rotate: [0, 10, -10, 0] }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Word Predictor complete phase">Word Predictor Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      You explored how language models predict the next word by analyzing context and assigning probabilities to possible completions.
                    </p>
                    {/* ENH: Animated score counter */}
                    <motion.div
                      className="rounded-xl px-6 py-3 bg-[#FFAA44]/10 border border-[#FFAA44]/20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                      role="status"
                      aria-label={`Final score: ${animatedScore} points`}
                    >
                      <motion.p
                        className="font-data text-2xl text-[#FFAA44]"
                        animate={prefersReducedMotion ? {} : { textShadow: ['0 0 0px rgba(255,170,68,0)', '0 0 12px rgba(255,170,68,0.5)', '0 0 0px rgba(255,170,68,0)'] }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                      >
                        {animatedScore}
                      </motion.p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </motion.div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Language models predict the next word by calculating probability distributions over possible completions</li>
                        <li>• Context matters — the same word can have very different probabilities depending on the surrounding sentence</li>
                        <li>• High-confidence predictions happen when context strongly implies one answer, while ambiguous contexts spread probability across many words</li>
                      </ul>
                    </div>
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
