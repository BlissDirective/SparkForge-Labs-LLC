// ════════════════════════════════════════════════════
// TIME MACHINE V2 — Lab 1 (What IS AI?)
// Drag AI milestone cards to correct timeline positions.
// Enhanced: chrome bezel, welcome phase, age-band content,
// more milestones, visual timeline, educational tooltips.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useSceneStore } from '@/stores/sceneStore';
import { Clock } from 'lucide-react';

// 3D Environment (no SSR)
const TimeMachineEnvironment = dynamic(
  () => import('@/components/3d/environments/TimeMachineEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'play';

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
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);

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

  useEffect(() => {
    setGameSceneContent(<TimeMachineEnvironment currentYear={slots[placed.size] || 2024} isPlacing={selectedCard !== null} />);
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
                    <span className="text-5xl">⏰</span>
                    <h2 className="font-display text-2xl font-bold text-white">Time Machine</h2>
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
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
