// ════════════════════════════════════════════════════
// TIME MACHINE V2 — Lab 1 (What IS AI?)
// Drag AI milestone cards to correct timeline positions.
// Enhanced: chrome bezel, welcome phase, age-band content,
// more milestones, visual timeline, educational tooltips.
// ENH: Clock animation + placement celebration + progress bar + score counter
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { Clock } from 'lucide-react';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

// 3D Environment (no SSR)
const TimeMachineEnvironment = dynamic(
  () => import('@/components/3d/environments/TimeMachineEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

interface Milestone {
  id: string;
  year: number;
  label: string;
  desc: string;
  descC: string;
  band: 'A' | 'B' | 'C';
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
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
  { id: 'm15', year: 1943, label: 'McCulloch-Pitts Neurons', desc: 'Scientists created a math model of how brain cells work!', descC: 'Warren McCulloch and Walter Pitts published the first mathematical model of artificial neurons, founding computational neuroscience.', band: 'C' },
  { id: 'm16', year: 1958, label: 'Perceptron Invented', desc: 'The first machine that could learn from examples!', descC: 'Frank Rosenblatt built the Mark I Perceptron, the first hardware implementation of a learning algorithm for binary classification.', band: 'B' },
  { id: 'm17', year: 1965, label: 'ELIZA Chatbot', desc: 'A computer program that could chat like a therapist!', descC: 'Joseph Weizenbaum created ELIZA at MIT, demonstrating that simple pattern matching could create the illusion of understanding.', band: 'A' },
  { id: 'm18', year: 1979, label: 'Stanford Cart', desc: 'A robot that could drive itself across a room!', descC: 'The Stanford Cart navigated a chair-filled room autonomously using stereo vision — taking 5 hours to cross 20 meters.', band: 'B' },
  { id: 'm19', year: 1986, label: 'Backpropagation', desc: 'A clever way to teach neural networks by working backwards!', descC: 'Rumelhart, Hinton, and Williams popularized backpropagation, enabling efficient training of multi-layer neural networks.', band: 'C' },
  { id: 'm20', year: 1995, label: 'Support Vector Machines', desc: 'A powerful way to sort things into groups!', descC: 'Vapnik and Cortes introduced SVMs with the kernel trick, dominating ML competitions for the next decade.', band: 'C' },
  { id: 'm21', year: 2004, label: 'DARPA Grand Challenge', desc: 'Self-driving cars raced through the desert!', descC: 'DARPA Grand Challenge launched autonomous vehicle research. No car finished in 2004, but Stanley won in 2005 covering 132 miles.', band: 'B' },
  { id: 'm22', year: 2009, label: 'ImageNet Created', desc: 'Scientists collected millions of labeled pictures for AI to learn from!', descC: 'Fei-Fei Li launched ImageNet with 14M+ images in 20K+ categories, creating the benchmark that would spark the deep learning revolution.', band: 'B' },
  { id: 'm23', year: 2014, label: 'GANs Invented', desc: 'AI learned to create realistic fake images!', descC: 'Ian Goodfellow invented Generative Adversarial Networks — two neural networks competing to generate increasingly realistic synthetic data.', band: 'C' },
  { id: 'm24', year: 2020, label: 'GPT-3 Released', desc: 'An AI that could write almost like a human!', descC: 'OpenAI released GPT-3 with 175B parameters, demonstrating few-shot learning and sparking the large language model era.', band: 'A' },
  { id: 'm25', year: 2021, label: 'DALL-E Creates Art', desc: 'AI could now create pictures from text descriptions!', descC: 'OpenAI DALL-E demonstrated text-to-image generation, combining CLIP and diffusion models to create novel images from natural language.', band: 'A' },
  { id: 'm26', year: 2023, label: 'GPT-4 Multimodal', desc: 'AI could now understand both text AND images together!', descC: 'GPT-4 achieved multimodal reasoning, passing the bar exam and demonstrating visual understanding alongside language capabilities.', band: 'A' },
  { id: 'm27', year: 2024, label: 'AI Video Generation', desc: 'AI could create realistic videos from just a text description!', descC: 'Sora and other video models demonstrated temporal coherence in AI-generated video, raising both creative and ethical questions.', band: 'B' },
  { id: 'm28', year: 2026, label: 'AI Agents Era', desc: 'AI assistants that can use tools and complete tasks independently!', descC: 'Autonomous AI agents capable of multi-step reasoning, tool use, and code execution become mainstream in software development and research.', band: 'A' },
];

const LEARN_CARDS = [
  { title: 'The Story of AI', emoji: '📖', desc: 'Artificial Intelligence has been a dream of scientists for over 70 years! From the first computer programs to today\'s chatbots, AI has come a long way.' },
  { title: 'Key Moments', emoji: '⭐', desc: 'Some moments changed everything — like when a computer first beat a chess champion, or when deep learning made machines see and speak.' },
  { title: 'AI Keeps Growing', emoji: '🚀', desc: 'Every year, AI gets smarter and more useful. In this game, you\'ll place important AI milestones on a timeline to see how it all unfolded!' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function TimeMachineGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('time-machine', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [placed, setPlaced] = useState<Map<string, number>>(new Map());
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; correct: boolean } | null>(null);
  const [streak, setStreak] = useState(0);
  const [celebrateSlot, setCelebrateSlot] = useState<number | null>(null);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const { safeTimeout } = useSafeTimeout();
  const animatedScore = useAnimatedCounter(game.score);

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

  useEffect(() => {
    setGameSceneContent(<TimeMachineEnvironment currentYear={slots[placed.size] || 2024} isPlacing={selectedCard !== null} />);
    return () => setGameSceneContent(null);
  }, [placed.size, selectedCard, slots, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  function handleSlotClick(slotYear: number) {
    if (!selectedCard) return;
    const card = milestones.find(m => m.id === selectedCard);
    if (!card) return;

    const correct = card.year === slotYear;
    setFeedback({ id: card.id, correct });

    if (correct) {
      setStreak(s => s + 1);
      setCelebrateSlot(slotYear);
      safeTimeout(() => setCelebrateSlot(null), 800);
      setPlaced(prev => new Map(prev).set(card.id, slotYear));
      setTrayCards(prev => {
        const remaining = prev.filter(c => c.id !== card.id);
        if (remaining.length === 0) {
          safeTimeout(() => { setPhase('complete'); game.completeGame(); }, 2000);
        }
        return remaining;
      });
      game.updateScore(10);
      game.advanceRound();
    } else {
      setStreak(0);
    }
    setSelectedCard(null);

    safeTimeout(() => {
      setFeedback(null);
    }, 2000);
  }

  return (
    <GameShell gameId="time-machine" title="Time Machine" worldNumber={1} worldColor="#00BBFF" totalRounds={milestones.length}>
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
                    {/* ENH: Animated ticking clock */}
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <motion.span
                        className="text-5xl inline-block"
                        animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      >
                        ⏰
                      </motion.span>
                      <motion.div
                        className="absolute -inset-3 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(0,187,255,0.15), transparent)' }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Time Machine welcome phase">Time Machine</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Travel through the history of AI! Place milestone cards on the correct year.
                    </p>
                    <div className="flex gap-2">
                      {['AI History', 'Timeline', 'Milestones'].map(t => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-sky-400/10 border border-sky-400/20 text-sky-400 font-body text-2xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #00BBFF, #0099DD)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Start the Time Machine game"
                    >
                      Start the Time Machine! <Clock className="inline w-4 h-4 ml-1" />
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

                {phase === 'play' && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={placed.size} total={milestones.length} labColor="#00BBFF" />
                    </div>
                    {/* ENH: Visual progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-2xs text-white/30" role="status" aria-label={`${placed.size} of ${milestones.length} milestones placed`}>
                          {placed.size}/{milestones.length} placed
                        </span>
                        {streak >= 2 && (
                          <motion.span
                            className="font-display text-2xs font-bold"
                            style={{
                              color: '#00BBFF',
                              textShadow: `0 0 ${4 + streak * 2}px rgba(0,187,255,${0.3 + streak * 0.1})`,
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 0.5 }}
                            key={streak}
                          >
                            {streak} streak {streak >= 5 ? '🔥🔥' : '🔥'}
                          </motion.span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #00BBFF, #00DDFF)' }}
                          animate={{ width: `${(placed.size / milestones.length) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />
                      </div>
                    </div>
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
                              } ${isFeedbackTarget && feedback?.correct ? 'ring-2 ring-green-500/50' : ''} ${celebrateSlot === year ? 'ring-2 ring-green-400/60' : ''}`}
                              whileTap={selectedCard && !placedMilestone ? { scale: 0.95 } : {}}
                              animate={celebrateSlot === year ? { scale: [1, 1.2, 1], boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 20px rgba(74,222,128,0.4)', '0 0 0px rgba(74,222,128,0)'] } : {}}
                              transition={celebrateSlot === year ? { duration: 0.6 } : undefined}
                              aria-label={`Timeline slot: ${year}`}
                            >
                              <span className="font-mono text-2xs text-white/30">{year}</span>
                              {placedMilestone && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="mt-1"
                                >
                                  <p className="font-display text-2xs font-bold text-sky-400">
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
                            {feedback.correct ? 'Correct!' : 'Wrong year \u2014 try again!'}
                          </p>
                          {feedback.correct && (() => {
                            const m = milestones.find(ml => ml.id === feedback.id);
                            return m ? (
                              <p className="font-body text-2xs text-white/40 mt-0.5">
                                {ageBand === 'C' ? m.descC : m.desc}
                              </p>
                            ) : null;
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Card tray */}
                    <div className="border-t border-white/5 pt-3">
                      <p className="font-body text-2xs text-white/20 mb-2">Cards to place:</p>
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
                            <p className="font-display text-xs font-bold text-white">{card.label}</p>
                            <p className="font-body text-2xs text-white/30 mt-0.5">
                              {ageBand === 'C' ? card.descC : card.desc}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
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
                    <motion.h2
                      className="font-display text-2xl font-bold text-white"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      aria-label="Time Machine complete phase - Timeline Mastery"
                    >
                      Timeline Mastery!
                    </motion.h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      You traveled through the history of artificial intelligence, placing key milestones on the timeline from the 1950s to today.
                    </p>
                    {/* ENH: Animated score counter */}
                    <motion.div
                      className="rounded-xl px-6 py-3 bg-[#00BBFF]/10 border border-[#00BBFF]/20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                      role="status"
                      aria-label={`Final score: ${animatedScore} points`}
                    >
                      <motion.p
                        className="font-data text-2xl text-[#00BBFF]"
                        animate={{ textShadow: ['0 0 0px rgba(0,187,255,0)', '0 0 12px rgba(0,187,255,0.5)', '0 0 0px rgba(0,187,255,0)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {animatedScore}
                      </motion.p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </motion.div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• AI has a rich history spanning over 70 years of breakthroughs and setbacks</li>
                        <li>• Key milestones like the Turing Test, Deep Blue, and AlphaGo shaped how we think about machine intelligence</li>
                        <li>• Modern AI (transformers, large language models) builds on decades of earlier research and innovation</li>
                      </ul>
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
