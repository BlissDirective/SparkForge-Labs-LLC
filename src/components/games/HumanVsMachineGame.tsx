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
//
// ENH: Score bars + thinking indicators + verdict reveal + advantage flash
// ================================================================

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGameContent } from '@/hooks/useContent';
import { Swords, User, Bot } from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';
import { useSceneStore } from '@/stores/sceneStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';

// 3D Environment (no SSR)
const HumanVsMachineEnvironment = dynamic(
  () => import('@/components/3d/environments/HumanVsMachineEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

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
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
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
  {
    title: 'Original Painting',
    emoji: '🎨',
    prompt: 'Paint something that expresses the feeling of a rainy Sunday afternoon.',
    type: 'text',
    aiAnswer: 'A watercolor scene of a window with raindrops, a steaming mug on the sill, and muted grey-blue tones evoking quiet melancholy.',
    aiTime: 1400,
    humanAdvantage: 'Your art comes from real emotions and memories!',
    aiAdvantage: 'AI generates polished descriptions but has no Sunday afternoons to remember.',
    humanAdvantageC: 'Human creativity draws on embodied sensory memory and emotional autobiography — art is expression, not generation.',
    aiAdvantageC: 'AI produces aesthetically coherent compositions by pattern-matching training data but lacks phenomenal experience to ground creative intent.',
    band: 'A',
  },
  {
    title: 'Spot the Difference',
    emoji: '🖼️',
    prompt: 'Find all 7 differences between these two nearly identical pictures (imagine two complex scenes).',
    type: 'math',
    aiAnswer: 'Difference 1: cloud shape (top-left), 2: missing bird, 3: fence post color, 4: flower count, 5: shadow angle, 6: window reflection, 7: grass height.',
    aiTime: 350,
    humanAdvantage: 'Humans notice differences that feel "off" even before counting them.',
    aiAdvantage: 'AI compares pixel-by-pixel across millions of data points in milliseconds.',
    humanAdvantageC: 'Human gestalt perception detects anomalies holistically before analytic decomposition.',
    aiAdvantageC: 'Computer vision models compute pixel-level diff maps in O(n) time, detecting sub-pixel changes invisible to humans.',
    band: 'B',
  },
  {
    title: 'Comfort a Friend',
    emoji: '💝',
    prompt: 'Your friend just lost their pet. What would you say to comfort them?',
    type: 'opinion',
    aiAnswer: 'I\'m so sorry for your loss. Losing a pet is like losing a family member. It\'s okay to grieve, and your pet was lucky to have been loved so much.',
    aiTime: 1100,
    humanAdvantage: 'You can feel their pain and give a real hug!',
    aiAdvantage: 'AI says the right words but cannot share in the grief.',
    humanAdvantageC: 'Empathy requires theory of mind and shared emotional experience — humans co-regulate emotions through presence and attunement.',
    aiAdvantageC: 'AI generates empathetic language via sentiment-aligned fine-tuning but has no capacity for emotional co-regulation or genuine compassion.',
    band: 'A',
  },
  {
    title: 'Speed Reading',
    emoji: '📖',
    prompt: 'Read this 500-page textbook and list the 10 most important concepts.',
    type: 'math',
    aiAnswer: '1. Central thesis (Ch.1), 2. Core framework (Ch.3), 3. Key experiment (Ch.5), 4. Counter-argument (Ch.8), 5. Statistical model (Ch.11), 6. Case study A (Ch.14), 7. Methodology critique (Ch.17), 8. Synthesis (Ch.20), 9. Future directions (Ch.23), 10. Author\'s conclusion (Ch.25).',
    aiTime: 250,
    humanAdvantage: 'Humans understand the deeper meaning behind the words.',
    aiAdvantage: 'AI can process 500 pages in seconds — no coffee breaks needed!',
    humanAdvantageC: 'Human reading involves deep comprehension, critical evaluation, and integration with prior knowledge.',
    aiAdvantageC: 'LLMs with 100K+ context windows process entire books in seconds, extracting key terms via attention weight analysis — but comprehension depth is debated.',
    band: 'B',
  },
  {
    title: 'Right or Wrong?',
    emoji: '⚖️',
    prompt: 'A self-driving car must choose: swerve left (risk 1 passenger) or right (risk 2 pedestrians). What should it do?',
    type: 'opinion',
    aiAnswer: 'This is a variant of the trolley problem. Utilitarian ethics suggests minimizing total harm (swerve left), while deontological ethics argues against actively choosing to harm anyone.',
    aiTime: 1600,
    humanAdvantage: 'Moral choices need human judgment, values, and accountability.',
    aiAdvantage: 'AI can analyze ethical frameworks but cannot bear moral responsibility.',
    humanAdvantageC: 'Moral agency requires consciousness, free will, and the capacity to bear responsibility — qualities absent in AI systems.',
    aiAdvantageC: 'AI can enumerate ethical frameworks (utilitarian, deontological, virtue ethics) but lacks moral agency and cannot be held accountable for consequences.',
    band: 'C',
  },
  {
    title: 'Data Crunching',
    emoji: '📊',
    prompt: 'Analyze 10 million customer purchases to find buying patterns.',
    type: 'math',
    aiAnswer: 'Cluster analysis reveals 5 customer segments: weekend bulk buyers (23%), weekday convenience shoppers (31%), sale hunters (18%), premium brand loyalists (15%), and seasonal purchasers (13%). Cross-sell opportunity: segments 1 and 4 overlap 34% on household items.',
    aiTime: 200,
    humanAdvantage: 'Humans can ask "so what?" and turn data into business strategy.',
    aiAdvantage: 'AI processes millions of records in seconds — a human would need months!',
    humanAdvantageC: 'Humans contextualize data within business strategy, market dynamics, and stakeholder needs — turning correlation into actionable insight.',
    aiAdvantageC: 'ML clustering algorithms (k-means, DBSCAN) and association rule mining (Apriori) process millions of transactions in O(n log n), finding patterns invisible to manual analysis.',
    band: 'B',
  },
  {
    title: 'Stand-Up Comedy',
    emoji: '🎤',
    prompt: 'Tell a joke that would make a room full of people laugh.',
    type: 'text',
    aiAnswer: 'Why do programmers prefer dark mode? Because light attracts bugs!',
    aiTime: 900,
    humanAdvantage: 'You can read the room, adjust timing, and land the punchline!',
    aiAdvantage: 'AI knows thousands of jokes but cannot feel the crowd\'s energy.',
    humanAdvantageC: 'Comedy requires real-time social perception, timing calibration, and the shared vulnerability of live performance.',
    aiAdvantageC: 'AI generates jokes via pattern matching on humor corpora but cannot perceive audience reaction or adapt delivery in real time.',
    band: 'A',
  },
  {
    title: 'New Situation',
    emoji: '🌪️',
    prompt: 'You\'re lost in a foreign city with a dead phone. What do you do?',
    type: 'opinion',
    aiAnswer: 'Look for landmarks, find a police station or hotel, ask locals for directions using gestures, locate a map at a transit station, or find a cafe with Wi-Fi to charge your phone.',
    aiTime: 1300,
    humanAdvantage: 'Humans adapt to brand-new situations using common sense and street smarts!',
    aiAdvantage: 'AI can suggest solutions but cannot physically navigate or read social cues.',
    humanAdvantageC: 'Human adaptability combines spatial reasoning, social intelligence, improvisation, and embodied action in novel environments.',
    aiAdvantageC: 'AI can generate contingency plans from training data but cannot execute physical actions, read body language, or improvise in truly novel scenarios.',
    band: 'A',
  },
];

const LEARN_CARDS = [
  { title: 'Humans AND Machines', emoji: '🤝', desc: 'Humans and AI are each amazing at different things. The best results often come when they work together!' },
  { title: 'What Humans Do Best', emoji: '💡', desc: 'Humans excel at creativity, empathy, humor, and understanding context. We can think about things we\'ve never seen before!' },
  { title: 'What AI Does Best', emoji: '⚡', desc: 'AI is incredible at speed, pattern recognition, processing huge amounts of data, and never getting tired. It can analyze millions of items in seconds!' },
];

export function HumanVsMachineGame() {
  const prefersReducedMotion = useReducedMotion();
  const game = useGameStore();
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('human-vs-machine', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges

  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [humanAnswer, setHumanAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiRevealed, setAiRevealed] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const challenges = useFilteredContent(ALL_CHALLENGES, tier, ageBand);
  // ENH: Track scores for comparison bars and advantage indicator
  const [humanTotal, setHumanTotal] = useState(0);
  const [machineTotal, setMachineTotal] = useState(0);
  // ENH: Verdict reveal animation trigger
  const [verdictType, setVerdictType] = useState<'human' | 'machine' | null>(null);
  const { safeTimeout } = useSafeTimeout();

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
    // ENH: Update score comparison bars
    setHumanTotal(h => h + 10);
    safeTimeout(() => {
      setAiThinking(false);
      setAiRevealed(true);
      // ENH: Determine verdict and update machine score
      const aiScore = challenge.type === 'math' ? 12 : challenge.type === 'opinion' ? 5 : 8;
      setMachineTotal(m => m + aiScore);
      setVerdictType(challenge.type === 'opinion' ? 'human' : challenge.type === 'math' ? 'machine' : 'human');
    }, challenge.aiTime);
  }, [humanAnswer, challenge, game, safeTimeout]);

  function nextRound() {
    setHumanAnswer('');
    setSubmitted(false);
    setAiRevealed(false);
    setVerdictType(null);
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
      worldColor="#0FB8FA"
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
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : {
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
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #00BBFF, #0099DD)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Start the Human vs Machine challenge"
                    >
                      Challenge the AI!{' '}
                      <Swords className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
                    <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                    <h3 className="font-display text-xl font-bold text-white">{LEARN_CARDS[learnIdx].title}</h3>
                    <p className="font-body text-sm text-white/60 max-w-md">{LEARN_CARDS[learnIdx].desc}</p>
                    <div className="flex gap-1 mt-2">
                      {LEARN_CARDS.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-[#00BBFF]' : 'bg-white/20'}`} />
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      {learnIdx > 0 && (
                        <motion.button onClick={() => setLearnIdx(i => i - 1)}
                          className="px-4 py-2 rounded-lg border border-white/10 font-display text-xs text-white/60 hover:text-white"
                          whileTap={{ scale: 0.95 }}>Back</motion.button>
                      )}
                      <motion.button onClick={() => learnIdx < LEARN_CARDS.length - 1 ? setLearnIdx(i => i + 1) : setPhase('play')}
                        className="px-6 py-2 rounded-lg font-display text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #00BBFF, #0088CC)' }}
                        whileTap={{ scale: 0.95 }}>{learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Playing!'}</motion.button>
                    </div>
                  </motion.div>
                )}

                {phase === 'play' && challenge && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-lg space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={roundIdx + 1} total={challenges.length} labColor="#00BBFF" />
                    </div>
                    {/* ENH: Animated score comparison bars (human vs machine) */}
                    <div className="flex items-center gap-3 mb-3 max-w-xs mx-auto">
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="font-body text-2xs text-sky-400">You</span>
                          <motion.span key={humanTotal} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-data text-2xs text-sky-300">{humanTotal}</motion.span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full bg-sky-500" animate={{ width: `${Math.min((humanTotal / Math.max(humanTotal + machineTotal, 1)) * 100, 100)}%` }} transition={{ type: 'spring', stiffness: 80, damping: 12 }} />
                        </div>
                      </div>
                      <span className="font-display text-2xs text-white/20">vs</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="font-body text-2xs text-amber-400">AI</span>
                          <motion.span key={machineTotal} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-data text-2xs text-amber-300">{machineTotal}</motion.span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full bg-amber-500" animate={{ width: `${Math.min((machineTotal / Math.max(humanTotal + machineTotal, 1)) * 100, 100)}%` }} transition={{ type: 'spring', stiffness: 80, damping: 12 }} />
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <span className="text-3xl">{challenge.emoji}</span>
                      <h3 className="font-display text-base font-bold text-white mt-1">
                        {challenge.title}
                      </h3>
                      <p className="font-body text-sm text-white/50">
                        {challenge.prompt}
                      </p>
                      <p className="font-body text-2xs text-white/20 mt-0.5">Round {roundIdx + 1}/{challenges.length}</p>
                    </div>

                    <div className="flex gap-3 mb-4">
                      {/* Human side */}
                      <div className="flex-1 rounded-xl p-3 border border-sky-500/20 bg-sky-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-sky-400" />
                          <span className="font-display text-xs font-bold text-white">You</span>
                        </div>
                        {!submitted ? (
                          <div className="relative">
                            {/* ENH: Human side thought bubble animation while typing */}
                            {humanAnswer.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -top-5 right-1 font-body text-2xs text-sky-400/40"
                              >
                                {'\uD83D\uDCAD'}
                              </motion.div>
                            )}
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
                          </div>
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
                          // ENH: Machine side processing dots animation
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map(dot => (
                              <motion.div
                                key={dot}
                                className="w-2 h-2 rounded-full bg-amber-400/60"
                                animate={prefersReducedMotion ? {} : { scale: [1, 1.4, 1], opacity: [0.3, 0.9, 0.3] }}
                                transition={prefersReducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 0.8, delay: dot * 0.2 }}
                              />
                            ))}
                            <motion.span
                              className="font-body text-xs text-white/30 ml-1"
                              animate={prefersReducedMotion ? {} : { opacity: [0.3, 0.8, 0.3] }}
                              transition={prefersReducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 1 }}
                            >
                              Processing...
                            </motion.span>
                          </div>
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
                        {/* ENH: Verdict reveal animation — scales in from center */}
                        {verdictType && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.15, 1], opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="text-center py-2 rounded-xl"
                            // ENH: Advantage flash (green=human, blue=machine)
                            style={{
                              backgroundColor: verdictType === 'human' ? 'rgba(0,187,255,0.08)' : 'rgba(245,158,11,0.08)',
                              border: `1px solid ${verdictType === 'human' ? 'rgba(0,187,255,0.2)' : 'rgba(245,158,11,0.2)'}`,
                            }}
                          >
                            <motion.p
                              className="font-display text-xs font-bold"
                              style={{ color: verdictType === 'human' ? '#00BBFF' : '#F59E0B' }}
                              animate={{ color: verdictType === 'human' ? ['#00BBFF', '#00FF88', '#00BBFF'] : ['#F59E0B', '#60A5FA', '#F59E0B'] }}
                              transition={{ duration: 1.2 }}
                            >
                              {verdictType === 'human' ? 'Human Advantage!' : 'Machine Advantage!'}
                            </motion.p>
                          </motion.div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          {/* ENH: Advantage cards with color flash on entry */}
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-lg p-2 bg-sky-500/5 border border-sky-500/10"
                            style={verdictType === 'human' ? { boxShadow: '0 0 12px rgba(0,187,255,0.15)' } : {}}
                          >
                            <p className="font-body text-2xs text-sky-400 uppercase">Human Advantage</p>
                            <p className="font-body text-2xs text-white/50 mt-0.5">
                              {ageBand === 'C' ? challenge.humanAdvantageC : challenge.humanAdvantage}
                            </p>
                          </motion.div>
                          <motion.div
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-lg p-2 bg-amber-500/5 border border-amber-500/10"
                            style={verdictType === 'machine' ? { boxShadow: '0 0 12px rgba(245,158,11,0.15)' } : {}}
                          >
                            <p className="font-body text-2xs text-amber-400 uppercase">AI Advantage</p>
                            <p className="font-body text-2xs text-white/50 mt-0.5">
                              {ageBand === 'C' ? challenge.aiAdvantageC : challenge.aiAdvantage}
                            </p>
                          </motion.div>
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
                    <motion.span className="text-6xl" animate={prefersReducedMotion ? {} : { rotate: [0, 10, -10, 0] }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}>🏆</motion.span>
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
