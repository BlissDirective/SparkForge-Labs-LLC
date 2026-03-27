// ================================================================
// HUMAN VS MACHINE V2 — Lab 1 (What Is AI?)
// Side-by-side comparison: human answers vs AI answers.
// Teaches: AI strengths/limitations, human vs machine.
// Enhanced: chrome bezel, welcome phase, 8 challenges,
// scoring comparison, "who wins" verdict, age-band depth.
//
// V3 NOTE: No 3D enhancements. This is a standard polish game
// per Decision 6.5. Retains unique 2D visual enhancements
// with lab-colored particle background.
// ================================================================

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Swords, User, Bot } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';

// 3D Environment (no SSR)
const HumanVsMachineEnvironment = dynamic(
  () => import('@/components/3d/environments/HumanVsMachineEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'play' | 'complete';

interface Challenge {
  title: string;
  emoji: string;
  prompt: string;
  type: 'math' | 'text' | 'opinion';
  aiAnswer: string;
  aiTime: number;
  humanAdvantage: string;
  aiAdvantage: string;
  humanAdvantageC: string;
  aiAdvantageC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_CHALLENGES: Challenge[] = [
  {
    title: 'Quick Math',
    emoji: '🧮',
    prompt: 'What is 47 + 86?',
    type: 'math',
    aiAnswer: '133',
    aiTime: 300,
    humanAdvantage: "You can check AI's work!",
    aiAdvantage: 'AI is lightning fast at math.',
    humanAdvantageC: 'Humans verify computational outputs through number sense and estimation.',
    aiAdvantageC: 'Computational speed: O(1) for arithmetic vs human sequential processing.',
    band: 'A',
  },
  {
    title: 'Complete the Joke',
    emoji: '😂',
    prompt: 'Why did the robot go to school?',
    type: 'text',
    aiAnswer: 'To improve its learning algorithms!',
    aiTime: 800,
    humanAdvantage: 'Humor is a human superpower!',
    aiAdvantage: "AI can generate jokes, but doesn't get why they're funny.",
    humanAdvantageC: 'Human humor relies on theory of mind, cultural context, and timing.',
    aiAdvantageC: 'AI pattern-matches joke structures but lacks phenomenal understanding of humor.',
    band: 'A',
  },
  {
    title: 'Describe Friendship',
    emoji: '🤝',
    prompt: 'What does friendship mean to you?',
    type: 'opinion',
    aiAnswer: 'Friendship is a mutual bond of trust, support, and shared experiences between people.',
    aiTime: 1200,
    humanAdvantage: 'Your answer has real feeling \u2014 AI describes, not feels.',
    aiAdvantage: 'AI sounds eloquent but has no lived experience.',
    humanAdvantageC: 'Phenomenal experience gives humans genuine emotional grounding.',
    aiAdvantageC: 'AI generates semantically coherent descriptions without subjective experience.',
    band: 'A',
  },
  {
    title: 'Name an Emotion',
    emoji: '😊',
    prompt: 'Describe what happiness feels like',
    type: 'opinion',
    aiAnswer: 'Happiness is a warm feeling of contentment, often accompanied by smiling and a sense of lightness.',
    aiTime: 1000,
    humanAdvantage: 'You described a FEELING. AI describes a concept.',
    aiAdvantage: 'AI sounds accurate but has never felt happy.',
    humanAdvantageC: 'First-person phenomenal experience is epistemically privileged.',
    aiAdvantageC: 'AI synthesizes descriptions from training data without qualia.',
    band: 'B',
  },
  {
    title: 'Creative Story',
    emoji: '📚',
    prompt: 'Write a one-sentence story about a lost puppy.',
    type: 'text',
    aiAnswer: 'A small golden puppy wandered through the misty park, sniffing each bench until it found the scarf that smelled like home.',
    aiTime: 1500,
    humanAdvantage: 'Your stories have unique perspectives!',
    aiAdvantage: 'AI writes well but remixes patterns from training data.',
    humanAdvantageC: 'Human narratives draw on embodied experience and genuine imagination.',
    aiAdvantageC: 'AI generates plausible narratives via statistical sequence prediction.',
    band: 'B',
  },
  {
    title: 'Quick Math 2',
    emoji: '🔢',
    prompt: 'What is 15 \u00d7 12?',
    type: 'math',
    aiAnswer: '180',
    aiTime: 200,
    humanAdvantage: 'Understanding WHY matters more than speed.',
    aiAdvantage: 'Calculators are fast, but understanding is human.',
    humanAdvantageC: 'Mathematical intuition and proof comprehension exceed mere computation.',
    aiAdvantageC: 'Deterministic arithmetic is trivially parallelizable.',
    band: 'A',
  },
  {
    title: 'Moral Dilemma',
    emoji: '⚖️',
    prompt: "Is it okay to lie to protect someone's feelings?",
    type: 'opinion',
    aiAnswer: 'This depends on the context. Some ethicists argue white lies preserve social harmony, while others prioritize honesty.',
    aiTime: 1800,
    humanAdvantage: 'You have REAL moral intuitions shaped by experience.',
    aiAdvantage: 'AI presents balanced views but cannot feel moral weight.',
    humanAdvantageC: 'Moral reasoning integrates emotion, experience, and ethical frameworks.',
    aiAdvantageC: 'AI aggregates ethical positions without moral agency or stakes.',
    band: 'C',
  },
  {
    title: 'Pattern Recognition',
    emoji: '🔍',
    prompt: 'What comes next: 2, 6, 12, 20, ___?',
    type: 'math',
    aiAnswer: '30 (differences increase by 2: +4, +6, +8, +10)',
    aiTime: 400,
    humanAdvantage: 'Humans can explain WHY patterns work.',
    aiAdvantage: 'AI processes sequences fast but may not truly understand.',
    humanAdvantageC: 'Human pattern recognition generalizes from limited examples via inductive reasoning.',
    aiAdvantageC: 'Sequence prediction leverages statistical regularities in training data.',
    band: 'C',
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function HumanVsMachineGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [humanAnswer, setHumanAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiRevealed, setAiRevealed] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const challenges = useMemo(
    () => ALL_CHALLENGES.filter((c) => BAND_ORDER[c.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const challenge = challenges[roundIdx];

  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  useEffect(() => {
    setGameSceneContent(<HumanVsMachineEnvironment humanScore={game.score} machineScore={roundIdx * 10} isRevealing={aiRevealed} />);
    return () => setGameSceneContent(null);
  }, [game.score, roundIdx, aiRevealed, setGameSceneContent]);

  const handleSubmit = useCallback(() => {
    if (!humanAnswer.trim()) return;
    setSubmitted(true);
    setAiThinking(true);
    game.updateScore(10);
    setTimeout(() => {
      setAiThinking(false);
      setAiRevealed(true);
    }, challenge.aiTime);
  }, [humanAnswer, challenge, game]);

  function nextRound() {
    setHumanAnswer('');
    setSubmitted(false);
    setAiRevealed(false);
    if (roundIdx < challenges.length - 1) {
      setRoundIdx((i) => i + 1);
      game.advanceRound();
    } else {
      setPhase('complete');
      game.completeGame();
    }
  }

  return (
    <GameShell
      gameId="human-vs-machine"
      title="Human vs Machine"
      worldNumber={1}
      worldColor="#00BBFF"
      totalRounds={challenges.length}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(0,187,255,${
                  0.15 + p.size * 0.06
                }), transparent)`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(0,187,255,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0,187,255,0.1)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

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
                    <span className="text-5xl">⚔️</span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Human vs Machine
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Go head-to-head with AI! See where humans shine and
                      where AI excels.
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Comparison', 'Strengths', 'Limitations'].map(
                        (t) => (
                          <span
                            key={t}
                            className="px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 font-body text-2xs text-sky-300"
                          >
                            {t}
                          </span>
                        )
                      )}
                    </div>
                    <motion.button
                      onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #00BBFF, #0099DD)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Challenge the AI!{' '}
                      <Swords className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'play' && challenge && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-lg space-y-4"
                  >
                    <div className="text-center mb-4">
                      <span className="text-3xl">{challenge.emoji}</span>
                      <h3 className="font-display text-base font-bold text-white mt-1">
                        {challenge.title}
                      </h3>
                      <p className="font-body text-sm text-white/50">
                        {challenge.prompt}
                      </p>
                    </div>

                    <div className="flex gap-3 mb-4">
                      {/* Human side */}
                      <div className="flex-1 rounded-xl p-3 border border-sky-500/20 bg-sky-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-sky-400" />
                          <span className="font-display text-xs font-bold text-white">You</span>
                        </div>
                        {!submitted ? (
                          <input
                            type="text"
                            value={humanAnswer}
                            onChange={(e) => setHumanAnswer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Your answer..."
                            autoFocus
                            aria-label="Your answer"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-body placeholder:text-white/20 focus:outline-none focus:border-sky-500/50"
                          />
                        ) : (
                          <p className="font-body text-sm text-white/80">{humanAnswer}</p>
                        )}
                      </div>

                      {/* AI side */}
                      <div className="flex-1 rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-amber-400" />
                          <span className="font-display text-xs font-bold text-white">AI</span>
                        </div>
                        {aiThinking ? (
                          <motion.p
                            className="font-body text-sm text-white/30"
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            Thinking...
                          </motion.p>
                        ) : aiRevealed ? (
                          <p className="font-body text-sm text-white/80">
                            {challenge.aiAnswer}
                          </p>
                        ) : (
                          <p className="font-body text-sm text-white/10">Waiting...</p>
                        )}
                      </div>
                    </div>

                    {!submitted && (
                      <motion.button
                        onClick={handleSubmit}
                        disabled={!humanAnswer.trim()}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white disabled:opacity-30"
                        style={{
                          background: 'linear-gradient(135deg, #00BBFF, #0099DD)',
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Submit!
                      </motion.button>
                    )}

                    {aiRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg p-2 bg-sky-500/5 border border-sky-500/10">
                            <p className="font-body text-2xs text-sky-400 uppercase">Human Advantage</p>
                            <p className="font-body text-2xs text-white/50 mt-0.5">
                              {ageBand === 'C' ? challenge.humanAdvantageC : challenge.humanAdvantage}
                            </p>
                          </div>
                          <div className="rounded-lg p-2 bg-amber-500/5 border border-amber-500/10">
                            <p className="font-body text-2xs text-amber-400 uppercase">AI Advantage</p>
                            <p className="font-body text-2xs text-white/50 mt-0.5">
                              {ageBand === 'C' ? challenge.aiAdvantageC : challenge.aiAdvantage}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={nextRound}
                          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 font-display text-sm text-white/50 hover:bg-white/10"
                          whileTap={{ scale: 0.95 }}
                        >
                          Next Challenge &rarr;
                        </motion.button>
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
                    <motion.span className="text-6xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Human vs Machine Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      You went head-to-head with AI across multiple challenges, discovering where humans and machines each have unique strengths.
                    </p>
                    <div className="rounded-xl px-6 py-3 bg-[#00BBFF]/10 border border-[#00BBFF]/20">
                      <p className="font-data text-2xl text-[#00BBFF]">{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• AI excels at speed, pattern matching, and processing large amounts of data instantly</li>
                        <li>• Humans have unique strengths in creativity, empathy, moral reasoning, and lived experience</li>
                        <li>• The best outcomes often come from humans and AI working together, combining their complementary abilities</li>
                      </ul>
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

export default HumanVsMachineGame;
