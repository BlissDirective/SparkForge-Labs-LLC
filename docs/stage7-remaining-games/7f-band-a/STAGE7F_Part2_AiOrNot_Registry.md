# SPARKFORGE — STAGE 7F PART 2: AI or Not? + Registry Updates

**Date:** February 20, 2026 | **GCUD Version:** V8 → V9 (changelog update)
**Batch:** 7F — Band A Coverage Expansion (Labs 8, 9, 10)
**Continued from:** STAGE7F Part 1 (Emoji Decoder + My First AI App)

---

## GAME 3: AI OR NOT?

**File:** `src/components/games/AiOrNotGame.tsx`
**Lab:** 10 (AI's Future) | **Bands:** A, B | **Lines:** 473 | **XP:** 25

**Design:** Future scenario sorting game teaching critical thinking about AI capabilities. Kids see scenarios and classify them as "AI Does This NOW," "Coming SOON," or "Still Sci-Fi!" After voting, they see the real answer with explanation and fun fact. A confidence slider adds metacognitive awareness.

### Features

- 12 future scenarios across 3 time categories (NOW, SOON, SCI-FI)
- Three-way voting with animated emoji buttons
- Confidence meter slider (10-100%) with bonus XP for high-confidence correct answers
- Real-time "Reality Score" tracking accuracy percentage
- Animated scenario card reveal with bounce/rotate entrance
- Result panel: correct/wrong badge, vote comparison, explanation, fun fact, year tag
- Bonus "Prediction" round — kids write their own AI future prediction
- Final results summary with per-category breakdown

### Scenario Catalog

| Category | Scenarios | Band |
|----------|-----------|------|
| NOW (4) | Voice Assistants, AI Music, Medical AI, Translation | A |
| SOON (4) | Self-Driving, AI Houses, Robot Friends, AI Novels | A (3) + B (1) |
| SCI-FI (4) | True Thinking, Time Travel, Universe Creation, Teleportation | A (3) + B (1) |

### Phases

Welcome → Learn (4 cards) → Play (8-10 rounds) → Predict (bonus) → Complete

### Source Code

```tsx
// ════════════════════════════════════════════════════════════════════════
// AI OR NOT? — Lab 10 (AI's Future) — ENHANCED STANDARD
// ════════════════════════════════════════════════════════════════════════
'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Play, BookOpen, ArrowRight, Lightbulb, Award, Rocket, Clock, Send, Brain, CheckCircle } from 'lucide-react';

type Phase = 'welcome' | 'learn' | 'play' | 'predict' | 'complete';
type TimeCategory = 'now' | 'soon' | 'scifi';

interface Scenario {
  id: string; title: string; emoji: string;
  description: string; descriptionB: string;
  answer: TimeCategory; explanation: string; explanationB: string;
  funFact: string; year?: string; bandMin: 'A' | 'B';
}

interface ConceptCard {
  emoji: string; title: string; description: string; descriptionB: string; color: string;
}

const CONCEPT_CARDS: ConceptCard[] = [
  { emoji: '🔍', title: 'What Can AI Really Do?',
    description: 'Some things AI can do RIGHT NOW might surprise you — and some things people say AI can do are still science fiction!',
    descriptionB: 'AI capabilities are often misunderstood — some overhyped, others underappreciated. Critical evaluation matters.',
    color: '#D946EF' },
  { emoji: '📈', title: 'AI Gets Better Over Time',
    description: 'AI is learning new things every year! Things impossible 5 years ago are normal today.',
    descriptionB: 'AI progress is exponential — GPT-2 (2019) could barely write a paragraph; GPT-4 (2023) passes bar exams.',
    color: '#C026D3' },
  { emoji: '🤔', title: 'Healthy Skepticism',
    description: 'Not everything people say about AI is true. Smart thinkers ask: "Can AI really do that?"',
    descriptionB: 'Critical thinking about AI means asking: What\'s the evidence? Was it demonstrated or just claimed?',
    color: '#A21CAF' },
  { emoji: '🚀', title: 'YOU Decide the Future!',
    description: 'Kids like you will grow up to build the AI of tomorrow. What you learn now helps make it REAL!',
    descriptionB: 'Your generation will make critical decisions about AI regulation and deployment — understanding AI capabilities makes it REAL!',
    color: '#86198F' },
];

const ALL_SCENARIOS: Scenario[] = [
  // NOW
  { id: 'n1', emoji: '🗣️', title: 'AI Voice Assistants',
    description: 'You can talk to AI and it talks back — like Siri or Alexa!',
    descriptionB: 'AI-powered voice assistants understand speech, answer questions, control devices, and handle complex multi-turn conversations.',
    answer: 'now', bandMin: 'A',
    explanation: 'Siri, Alexa, and Google Assistant have been doing this for years!',
    explanationB: 'Voice assistants use ASR and NLU. Over 4 billion devices use voice AI today.',
    funFact: 'The first voice assistant was IBM\'s Shoebox in 1961 — it understood 16 words!' },
  { id: 'n2', emoji: '🎵', title: 'AI Creates Music',
    description: 'AI can compose brand-new songs that sound really good!',
    descriptionB: 'AI music tools create original compositions in any genre, from classical to hip-hop, with lyrics and instrumentation.',
    answer: 'now', bandMin: 'A',
    explanation: 'Tools like Suno already create full songs with lyrics and instruments!',
    explanationB: 'Models like MusicGen use transformer architectures trained on millions of tracks.',
    funFact: 'In 2023, an AI-generated song went viral on TikTok with millions of views!', year: '2023' },
  { id: 'n3', emoji: '🏥', title: 'AI Helps Doctors',
    description: 'AI looks at medical scans and helps doctors spot problems they might miss!',
    descriptionB: 'AI diagnostic tools analyze X-rays, MRIs, and CT scans — sometimes more accurately than human radiologists.',
    answer: 'now', bandMin: 'A',
    explanation: 'AI is already FDA-approved to help detect cancer in medical images!',
    explanationB: 'Over 500 AI medical devices have FDA approval. AI matches or exceeds radiologist accuracy in specific tasks.',
    funFact: 'AI can spot some cancers 11.5% more accurately than human doctors alone!', year: '2020+' },
  { id: 'n4', emoji: '🌐', title: 'AI Translates Instantly',
    description: 'AI translates what people say into another language in real time!',
    descriptionB: 'Real-time AI translation works for 100+ languages in text and dozens in speech.',
    answer: 'now', bandMin: 'A',
    explanation: 'Google Translate and DeepL already translate speech live!',
    explanationB: 'Neural machine translation models like NLLB-200 support 200 languages. Earbuds provide real-time translation.',
    funFact: 'Google Translate processes over 100 billion words per day!', year: '2016+' },
  // SOON
  { id: 's1', emoji: '🚗', title: 'Self-Driving Cars Everywhere',
    description: 'Cars that drive themselves on any road, any weather, with no human help at all!',
    descriptionB: 'Fully autonomous Level 5 vehicles handling any scenario, available to everyone worldwide.',
    answer: 'soon', bandMin: 'A',
    explanation: 'Self-driving taxis work in some cities, but they can\'t go everywhere yet!',
    explanationB: 'Level 4 robotaxis (Waymo) operate in limited areas. Level 5 is estimated 5-10 years out.',
    funFact: 'Waymo cars have driven over 20 million miles on public roads!', year: '~2028-2032' },
  { id: 's2', emoji: '🏠', title: 'AI Builds Houses',
    description: 'Robots and AI design and build entire houses from scratch!',
    descriptionB: 'AI-directed 3D-printed houses built autonomously at a fraction of current construction costs.',
    answer: 'soon', bandMin: 'A',
    explanation: '3D-printed houses exist, but AI can\'t fully design AND build alone yet!',
    explanationB: 'ICON has 3D-printed livable houses. Full AI design + build automation is 3-5 years away.',
    funFact: 'A 3D-printed house can be built in under 24 hours for less than $10,000!', year: '~2027-2030' },
  { id: 's3', emoji: '🤖', title: 'Robot Best Friends',
    description: 'Robots that understand your feelings, play with you, and act like real friends!',
    descriptionB: 'Emotionally intelligent companion robots with long-term memory and genuine social interaction.',
    answer: 'soon', bandMin: 'A',
    explanation: 'Simple companion robots exist, but truly understanding feelings is still developing!',
    explanationB: 'Social robots like Moxie have limited emotional intelligence. LLM-powered companions are evolving rapidly.',
    funFact: 'Japan has robot cafes where robots serve food and make conversation!', year: '~2028-2033' },
  { id: 's4', emoji: '📚', title: 'AI Writes Bestsellers',
    description: 'AI writes a book so good it wins a major prize and becomes a bestseller!',
    descriptionB: 'An AI autonomously writes a full novel that wins a major literary award.',
    answer: 'soon', bandMin: 'B',
    explanation: 'AI writes decent short stories, but a truly award-winning novel is years away!',
    explanationB: 'An AI story won a first-round Japanese literary prize in 2024, but 80K+ word novels with deep character arcs remain beyond current capabilities.',
    funFact: 'An AI-written short story passed the first round of a Japanese literary prize!' },
  // SCI-FI
  { id: 'f1', emoji: '🧠', title: 'AI That Truly Thinks',
    description: 'An AI that really truly thinks and feels — just like a real person!',
    descriptionB: 'Artificial General Intelligence with genuine consciousness and human-level understanding across all domains.',
    answer: 'scifi', bandMin: 'A',
    explanation: 'AI is great at specific tasks, but doesn\'t actually think or feel. Still science fiction!',
    explanationB: 'Current AI performs pattern matching, not conscious reasoning. AGI with genuine consciousness remains theoretical.',
    funFact: 'Even the most advanced AI can\'t truly understand a joke — it just predicts likely responses!' },
  { id: 'f2', emoji: '⏰', title: 'AI Time Travel',
    description: 'AI figures out how to send people back in time!',
    descriptionB: 'AI discovers actual temporal displacement — moving matter backwards through time.',
    answer: 'scifi', bandMin: 'A',
    explanation: 'Time travel breaks the laws of physics. AI can\'t change how the universe works!',
    explanationB: 'Time travel violates causality and thermodynamics. AI cannot circumvent fundamental physics.',
    funFact: 'GPS satellites experience time slightly differently due to Einstein\'s relativity!' },
  { id: 'f3', emoji: '🌌', title: 'AI Creates a Universe',
    description: 'AI becomes so powerful it creates an entirely new universe inside a computer!',
    descriptionB: 'An AI creates a fully simulated universe with its own physics and billions of sentient beings.',
    answer: 'scifi', bandMin: 'A',
    explanation: 'AI can simulate simple game worlds, but a real universe needs impossible computing power!',
    explanationB: 'Simulating a universe at quantum level would require more atoms than exist in our universe.',
    funFact: 'Simulating just 1 second of brain activity took a supercomputer 40 minutes!' },
  { id: 'f4', emoji: '✨', title: 'AI Teleportation',
    description: 'AI invents teleportation — zap! You\'re instantly somewhere else!',
    descriptionB: 'AI develops matter teleportation that deconstructs and reconstructs physical objects at a distance.',
    answer: 'scifi', bandMin: 'B',
    explanation: 'Teleportation means turning your body into data and rebuilding it. Way beyond any technology!',
    explanationB: 'Quantum teleportation exists at subatomic scales, but macro-object teleportation violates multiple physical laws.',
    funFact: 'Quantum teleportation of a single photon has been achieved over 1,400 km — but that\'s just information, not matter!' },
];

const CATEGORY_CONFIG: Record<TimeCategory, { label: string; emoji: string; color: string; bg: string }> = {
  now: { label: 'AI Does This NOW!', emoji: '✅', color: '#22C55E', bg: 'bg-emerald-500/15' },
  soon: { label: 'Coming SOON!', emoji: '🔜', color: '#F59E0B', bg: 'bg-amber-500/15' },
  scifi: { label: 'Still Sci-Fi!', emoji: '🚀', color: '#D946EF', bg: 'bg-fuchsia-500/15' },
};

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function AiOrNotGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'A') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [guess, setGuess] = useState<TimeCategory | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [showResult, setShowResult] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [history, setHistory] = useState<{ scenario: Scenario; guess: TimeCategory; correct: boolean }[]>([]);
  const [predictionText, setPredictionText] = useState('');
  const [predictionSubmitted, setPredictionSubmitted] = useState(false);

  const rounds = useMemo(() => {
    const filtered = ALL_SCENARIOS.filter(s => BAND_ORDER[s.bandMin] <= BAND_ORDER[ageBand]);
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, ageBand === 'A' ? 8 : 10);
  }, [ageBand]);

  const round = rounds[roundIdx];
  const totalRounds = rounds.length;
  const realityScore = Math.round((totalCorrect / Math.max(1, history.length)) * 100);

  const particles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2.5 + 1, delay: Math.random() * 5, dur: Math.random() * 6 + 5,
  })), []);

  const handleVote = useCallback((vote: TimeCategory) => {
    if (showResult || !round) return;
    setGuess(vote); setShowResult(true);
    const correct = vote === round.answer;
    const confBonus = correct && confidence >= 80 ? 5 : 0;
    if (correct) { game.updateScore(12 + confBonus); setTotalCorrect(c => c + 1); }
    setHistory(h => [...h, { scenario: round, guess: vote, correct }]);
  }, [showResult, round, confidence, game]);

  const nextRound = useCallback(() => {
    setGuess(null); setShowResult(false); setConfidence(50);
    if (roundIdx < totalRounds - 1) { setRoundIdx(i => i + 1); game.advanceRound(); }
    else setPhase('predict');
  }, [roundIdx, totalRounds, game]);

  const handlePrediction = useCallback(() => {
    if (predictionText.trim().length < 5) return;
    setPredictionSubmitted(true); game.updateScore(15);
  }, [predictionText, game]);

  const finishGame = useCallback(() => { game.completeGame(); setPhase('complete'); }, [game]);

  return (
    <GameShell gameId="ai-or-not" title="AI or Not?" worldNumber={10} worldColor="#D946EF" xpReward={25}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        {particles.map(p => (
          <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
              background: 'radial-gradient(circle, rgba(217,70,239,0.4), transparent)' }}
            animate={{ y: [0, -30, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Chrome Bezel */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.06]">
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent" />
          <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-fuchsia-400/20 to-transparent" />
        </div>

        <AnimatePresence mode="wait">
          {/* ══════ WELCOME ══════ */}
          {phase === 'welcome' && (
            <motion.div key="welcome" className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <motion.div className="text-6xl mb-4" animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}>🔮</motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">AI or Not?</h2>
              <p className="font-body text-sm text-white/60 mb-1">Lab 10 — AI's Future</p>
              <p className="font-body text-sm text-white/50 max-w-sm mb-6">Can AI really do that? Sort amazing scenarios into NOW, SOON, or SCI-FI!</p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {['AI Futures', 'Critical Thinking', 'Predictions', 'Fun Facts'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/20 font-mono text-[10px] text-fuchsia-300">{tag}</span>
                ))}
              </div>
              <motion.button onClick={() => setPhase('learn')}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-display font-bold"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <BookOpen className="w-4 h-4" /> Let's Learn!
              </motion.button>
            </motion.div>
          )}

          {/* ══════ LEARN ══════ */}
          {phase === 'learn' && (
            <motion.div key="learn" className="flex-1 flex flex-col items-center justify-center p-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <p className="font-mono text-xs text-fuchsia-400/60 mb-3">CONCEPT {learnIdx + 1} / {CONCEPT_CARDS.length}</p>
              <AnimatePresence mode="wait">
                <motion.div key={learnIdx} className="w-full max-w-sm rounded-2xl p-6 text-center"
                  style={{ background: `linear-gradient(135deg, ${CONCEPT_CARDS[learnIdx].color}15, ${CONCEPT_CARDS[learnIdx].color}05)`,
                    border: `1px solid ${CONCEPT_CARDS[learnIdx].color}30` }}
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                  <motion.span className="text-4xl block mb-3" animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    {CONCEPT_CARDS[learnIdx].emoji}
                  </motion.span>
                  <h3 className="font-display text-lg font-bold text-white mb-2">{CONCEPT_CARDS[learnIdx].title}</h3>
                  <p className="font-body text-sm text-white/70 leading-relaxed">
                    {ageBand === 'B' || ageBand === 'C' ? CONCEPT_CARDS[learnIdx].descriptionB : CONCEPT_CARDS[learnIdx].description}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="flex gap-2 mt-6">
                {CONCEPT_CARDS.map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === learnIdx ? 'bg-fuchsia-400 scale-125' : 'bg-white/20'}`} />
                ))}
              </div>
              <motion.button onClick={() => { if (learnIdx < CONCEPT_CARDS.length - 1) setLearnIdx(i => i + 1); else { setPhase('play'); game.startGame('ai-or-not', 25); } }}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-fuchsia-600/70 text-white font-display text-sm font-bold"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                {learnIdx < CONCEPT_CARDS.length - 1 ? <><ArrowRight className="w-4 h-4" /> Next</> : <><Play className="w-4 h-4" /> Start!</>}
              </motion.button>
            </motion.div>
          )}

          {/* ══════ PLAY ══════ */}
          {phase === 'play' && round && (
            <motion.div key="play" className="flex-1 flex flex-col p-4 overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-fuchsia-400/60">ROUND {roundIdx + 1} / {totalRounds}</span>
                <span className="font-mono text-xs text-white/30">Reality: {realityScore}%</span>
              </div>

              {/* Scenario Card */}
              <motion.div className="w-full max-w-md mx-auto rounded-2xl p-5 mb-4 text-center border border-fuchsia-500/20 bg-fuchsia-500/[0.05]"
                initial={{ opacity: 0, y: 20, rotateX: 15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}>
                <motion.span className="text-5xl block mb-3" animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}>{round.emoji}</motion.span>
                <h3 className="font-display text-lg font-bold text-white mb-2">{round.title}</h3>
                <p className="font-body text-sm text-white/60 leading-relaxed">
                  {ageBand === 'B' || ageBand === 'C' ? round.descriptionB : round.description}
                </p>
              </motion.div>

              {/* Confidence slider (before voting) — E-8: animated emoji face */}
              {!showResult && (
                <div className="w-full max-w-md mx-auto mb-3">
                  <div className="flex items-center justify-between text-xs font-mono text-white/30 mb-1">
                    <span>{confidence < 30 ? '🤷' : confidence < 60 ? '🤔' : confidence < 85 ? '😏' : '💪'} {confidence < 30 ? 'Guessing' : confidence < 60 ? 'Thinking...' : confidence < 85 ? 'Pretty sure' : 'Confident!'}</span>
                    <span>Confidence: {confidence}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={confidence}
                    onChange={e => setConfidence(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-fuchsia-500"
                    aria-label="How confident are you?" />
                </div>
              )}

              {/* Vote Buttons */}
              {!showResult && (
                <div className="w-full max-w-md mx-auto grid grid-cols-3 gap-2 mb-4">
                  {(['now', 'soon', 'scifi'] as TimeCategory[]).map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <motion.button key={cat} onClick={() => handleVote(cat)}
                        className={`py-3 px-2 rounded-xl border text-center ${cfg.bg} border-white/10`}
                        whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        aria-label={cfg.label}>
                        <span className="text-2xl block mb-1">{cfg.emoji}</span>
                        <span className="font-display text-[11px] font-bold block" style={{ color: cfg.color }}>
                          {cat === 'now' ? 'NOW' : cat === 'soon' ? 'SOON' : 'SCI-FI'}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Result Panel */}
              <AnimatePresence>
                {showResult && guess && (
                  <motion.div className="w-full max-w-md mx-auto rounded-2xl p-4 border mb-4"
                    style={{ borderColor: `${CATEGORY_CONFIG[round.answer].color}40`,
                      background: `${CATEGORY_CONFIG[round.answer].color}08` }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}>
                    {/* Correct or Wrong badge */}
                    <div className="text-center mb-3">
                      {guess === round.answer ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400 }}>
                          <span className="text-3xl">🎯</span>
                          <p className="font-display text-sm font-bold text-emerald-400 mt-1">Correct!</p>
                          {confidence >= 80 && <p className="font-mono text-[10px] text-amber-400">+5 confidence bonus!</p>}
                        </motion.div>
                      ) : (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <span className="text-3xl">💡</span>
                          <p className="font-display text-sm font-bold text-white/60 mt-1">
                            Not quite! It's <span style={{ color: CATEGORY_CONFIG[round.answer].color }}>{CATEGORY_CONFIG[round.answer].label}</span>
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Your vote vs correct */}
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <div className="text-center">
                        <p className="font-mono text-[9px] text-white/30 mb-1">YOU SAID</p>
                        <span className="text-xl">{CATEGORY_CONFIG[guess].emoji}</span>
                      </div>
                      <span className="text-white/20">→</span>
                      <div className="text-center">
                        <p className="font-mono text-[9px] text-white/30 mb-1">ANSWER</p>
                        <span className="text-xl">{CATEGORY_CONFIG[round.answer].emoji}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-3.5 h-3.5 text-fuchsia-400" />
                      </div>
                      <p className="font-body text-sm text-white/60">
                        {ageBand === 'B' || ageBand === 'C' ? round.explanationB : round.explanation}
                      </p>
                    </div>

                    {/* Fun fact */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="font-body text-xs text-white/50">{round.funFact}</p>
                    </div>

                    {/* Year tag */}
                    {round.year && (
                      <div className="flex justify-center mb-3">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 font-mono text-[10px] text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {round.year}
                        </span>
                      </div>
                    )}

                    <motion.button onClick={nextRound}
                      className="w-full py-2.5 rounded-xl bg-fuchsia-600/70 text-white font-display text-sm font-bold flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      {roundIdx < totalRounds - 1
                        ? <><ArrowRight className="w-4 h-4" /> Next Scenario</>
                        : <><Rocket className="w-4 h-4" /> Make a Prediction!</>}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress bar */}
              <div className="mt-auto pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-white/30 mb-1">
                  <span>🎯 {totalCorrect} / {history.length}</span>
                  <span>📊 Reality Score: {realityScore}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 mt-1.5 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500"
                    animate={{ width: `${((roundIdx + (showResult ? 1 : 0)) / totalRounds) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100 }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════ PREDICT (Bonus) ══════ */}
          {phase === 'predict' && (
            <motion.div key="predict" className="flex-1 flex flex-col items-center justify-center p-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <motion.div className="text-4xl mb-3" animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}>🔮</motion.div>
              <h3 className="font-display text-xl font-bold text-white mb-1">Your Prediction!</h3>
              <p className="font-body text-sm text-white/50 mb-4">Bonus Round — What will AI do in the future?</p>

              <div className="w-full max-w-sm rounded-2xl p-5 border border-fuchsia-500/20 bg-fuchsia-500/[0.03]">
                {!predictionSubmitted ? (
                  <>
                    <p className="font-body text-sm text-fuchsia-300 mb-3">
                      Describe something YOU think AI will be able to do in the next 10 years:
                    </p>
                    <textarea value={predictionText} onChange={e => setPredictionText(e.target.value)}
                      placeholder="I think AI will..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm resize-none focus:outline-none focus:border-fuchsia-500/40 h-20"
                      maxLength={200} aria-label="Write your AI prediction" />
                    <p className="font-mono text-[10px] text-white/20 mt-1 mb-3">{predictionText.length}/200</p>
                    <motion.button onClick={handlePrediction} disabled={predictionText.trim().length < 5}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-display text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      <Send className="w-4 h-4" /> Submit Prediction
                    </motion.button>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <p className="text-2xl mb-2">🌟</p>
                    <div className="rounded-xl p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-3">
                      <p className="font-body text-sm text-white/70 italic">"{predictionText}"</p>
                    </div>
                    <p className="font-body text-xs text-white/50 mb-2">
                      Great prediction! Maybe one day YOU'll help build it!
                    </p>
                    <p className="font-mono text-xs text-emerald-400 mb-3">+15 XP creativity bonus!</p>

                    {/* Final Timeline Summary */}
                    <div className="rounded-xl p-3 bg-white/[0.03] border border-white/10 mb-3">
                      <p className="font-mono text-[10px] text-fuchsia-400 mb-2">YOUR RESULTS</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {(['now', 'soon', 'scifi'] as TimeCategory[]).map(cat => {
                          const count = history.filter(h => h.scenario.answer === cat && h.correct).length;
                          const total = history.filter(h => h.scenario.answer === cat).length;
                          const cfg = CATEGORY_CONFIG[cat];
                          return (
                            <div key={cat}>
                              <span className="text-lg block">{cfg.emoji}</span>
                              <p className="font-mono text-xs" style={{ color: cfg.color }}>{count}/{total}</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="font-mono text-xs text-white/40">Overall: <span className="text-fuchsia-400">{totalCorrect}/{history.length}</span> ({realityScore}%)</p>
                      </div>
                    </div>

                    <motion.button onClick={finishGame}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display text-sm font-bold flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      <Award className="w-4 h-4" /> See Final Results!
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
          {/* ══════════ COMPLETE (E-2) ══════════ */}
          {phase === 'complete' && (
            <motion.div key="complete" className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <motion.div className="text-6xl mb-4" animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}>🔮</motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">AI Future Expert!</h2>
              <p className="font-body text-sm text-white/60 mb-4">You sorted AI's past, present, and future!</p>

              <div className="w-full max-w-xs rounded-2xl p-4 bg-white/[0.03] border border-fuchsia-500/20 mb-4">
                {/* Reality Score */}
                <div className="rounded-xl p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-3">
                  <p className="font-mono text-[10px] text-fuchsia-400 mb-1">REALITY SCORE</p>
                  <p className="font-display text-3xl font-bold text-fuchsia-300">{realityScore}%</p>
                </div>

                {/* Per-category breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {(['now', 'soon', 'scifi'] as TimeCategory[]).map(cat => {
                    const count = history.filter(h => h.scenario.answer === cat && h.correct).length;
                    const total = history.filter(h => h.scenario.answer === cat).length;
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <div key={cat} className="rounded-xl p-2 bg-white/[0.03] border border-white/10">
                        <span className="text-xl block">{cfg.emoji}</span>
                        <p className="font-mono text-xs mt-1" style={{ color: cfg.color }}>{count}/{total}</p>
                        <p className="font-mono text-[9px] text-white/30">{cat === 'now' ? 'NOW' : cat === 'soon' ? 'SOON' : 'SCI-FI'}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Overall stats */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl p-2 bg-emerald-500/10 border border-emerald-500/20">
                    <p className="font-mono text-[10px] text-emerald-400 mb-1">CORRECT</p>
                    <p className="font-display text-lg font-bold text-emerald-300">{totalCorrect}/{history.length}</p>
                  </div>
                  <div className="rounded-xl p-2 bg-amber-500/10 border border-amber-500/20">
                    <p className="font-mono text-[10px] text-amber-400 mb-1">XP EARNED</p>
                    <p className="font-display text-lg font-bold text-amber-300">{game.score}</p>
                  </div>
                </div>

                {realityScore >= 80 && (
                  <motion.div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    <span className="font-display text-sm font-bold text-amber-300">AI Expert Badge!</span>
                  </motion.div>
                )}
              </div>

              <p className="font-body text-xs text-white/30 max-w-xs">
                {ageBand === 'B' || ageBand === 'C'
                  ? 'Critical evaluation of AI capabilities is essential for informed decisions about technology\'s role in society.'
                  : 'You know what AI can really do — and what\'s still science fiction!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
      </div>
    </GameShell>
  );
}
```

---

## TRIANGLE BUDGET — AI or Not?

**Tier:** FL-Lite (Enhanced 3D)

> **Note:** AI or Not? is classified as FL-Lite tier with enhanced 3D per GCUD V10 (game #35). When a 3D component is added, it must respect the following device budgets:

| Device | Max Triangles | Target FPS |
|--------|---------------|------------|
| Desktop | 50,000 | 60 |
| Tablet | 25,000 | 45 |
| Mobile | 10,000 | 30 |

Current implementation is CSS/Motion only. The FL-Lite 3D component (if added in a future enhancement) must use `dynamic(() => import(...), { ssr: false })`, implement LOD via `useLOD({ tier: 'flLite' })`, and return `null` on mobile with CSS fallback.

---

## REGISTRY & INTEGRATION

### Game Registry Additions

**File:** `src/config/gameRegistry.ts` — Add these 3 entries:

```typescript
// ──── STAGE 7F: Band A Coverage Games ────
{
  id: 'emoji-decoder',
  title: 'Emoji Decoder',
  slug: 'emoji-decoder',
  labId: 8,
  labTitle: 'Words & Language',
  description: 'Decode emoji puzzles and see how AI reads them differently!',
  ageMin: 7, ageMax: 13,
  bands: ['A', 'B'],
  xpReward: 25,
  estimatedMinutes: 8,
  category: 'standard',
  tags: ['NLP', 'emojis', 'language', 'context'],
  component: 'EmojiDecoderGame',
},
{
  id: 'my-first-ai-app',
  title: 'My First AI App',
  slug: 'my-first-ai-app',
  labId: 9,
  labTitle: 'Build with AI',
  description: 'Design your own AI-powered app with custom powers!',
  ageMin: 7, ageMax: 16,
  bands: ['A', 'B', 'C'],
  xpReward: 30,
  estimatedMinutes: 12,
  category: 'flagship-lite',
  tags: ['app design', 'AI powers', 'creative', 'innovation'],
  component: 'MyFirstAiAppGame',
},
{
  id: 'ai-or-not',
  title: 'AI or Not?',
  slug: 'ai-or-not',
  labId: 10,
  labTitle: "AI's Future",
  description: 'Sort amazing AI scenarios into NOW, SOON, or SCI-FI!',
  ageMin: 7, ageMax: 13,
  bands: ['A', 'B'],
  xpReward: 25,
  estimatedMinutes: 8,
  category: 'standard',
  tags: ['AI futures', 'critical thinking', 'predictions'],
  component: 'AiOrNotGame',
},
```

### Dynamic Imports

**File:** `src/components/games/index.ts` — Add:

```typescript
export { EmojiDecoderGame } from './EmojiDecoderGame';
export { MyFirstAiAppGame } from './MyFirstAiAppGame';
export { AiOrNotGame } from './AiOrNotGame';
```

---

## GCUD V8 CHANGELOG UPDATE

Add to the Change Log section of GCUD V8:

```
STAGE 7F (Feb 20, 2026): Band A Coverage — Labs 8-10
- Resolved Gap #8 / CC-13: Band A thin in Labs 8-10
- Added Emoji Decoder (Lab 8, Bands A-B, Enhanced Standard, 543 lines)
- Added My First AI App (Lab 9, Bands A-B-C, Flagship-Lite, 619 lines)
- Added AI or Not? (Lab 10, Bands A-B, Enhanced Standard, 473 lines)
- Total curriculum: 31 games (was 28), Band A coverage: 22 games (was 19)
- Lab 8: 3→4 games | Lab 9: 3→4 games | Lab 10: 3→4 games
```

---

## COVERAGE IMPACT SUMMARY

| Lab | Before (Band A) | After (Band A) | Change |
|-----|-----------------|----------------|--------|
| Lab 8 (Words & Language) | 2 games | 3 games (+Emoji Decoder) | +1 |
| Lab 9 (Build with AI) | 1 game | 2 games (+My First AI App) | +1 |
| Lab 10 (AI's Future) | 1 game | 2 games (+AI or Not?) | +1 |
| **TOTAL Band A** | 19 games | 22 games | **+3** |
| **TOTAL Curriculum** | 28 games | 31 games | **+3** |

---

## Gap Status After Stage 7F

| Gap | Status | Notes |
|-----|--------|-------|
| #8 / CC-13: Band A thin in Labs 8-10 | **RESOLVED** | 3 new games added |
| Remaining open gaps | 3 | Badge wiring, Lab 9 depth (deferred) |
| Total gaps resolved | 12 / 15 | 9 prior + 3 deferred + 3 open → now 10 resolved |

---

**End of Stage 7F — Band A Coverage Expansion**
Total delivery: 1,635 lines across 3 production-ready .tsx components
