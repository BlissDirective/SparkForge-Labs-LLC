// ════════════════════════════════════════════════════
// SENTIMENT SCANNER V2 — Lab 8 (NLP)
// Real-time keyword sentiment analysis with emoji meter.
// Enhanced: chrome bezel, welcome phase, 5 challenges,
// word highlighting with polarity, age-band vocabulary.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { ScanLine } from 'lucide-react';
import dynamic from 'next/dynamic';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const SentimentScannerEnvironment = dynamic(
  () => import('@/components/3d/environments/SentimentScannerEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

const LEARN_CARDS = [
  { title: 'Reading Emotions in Text', emoji: '💬', desc: 'Sentiment analysis is how AI figures out the emotion behind words. Is a review happy, angry, or neutral? AI can tell!' },
  { title: 'Positive, Negative, Neutral', emoji: '😊', desc: 'AI looks for keywords and patterns to score text. Words like "amazing" and "love" are positive, while "terrible" and "hate" are negative.' },
  { title: 'How NLP Works', emoji: '🧠', desc: 'Natural Language Processing (NLP) helps computers understand human language. In this game, you\'ll write text and watch AI analyze its sentiment in real-time!' },
];

const POS = [
  'happy','joy','love','great','amazing','wonderful','beautiful','fantastic','excellent','awesome',
  'brilliant','delightful','cheerful','kind','friendly',
  'thrilled','grateful','magnificent','superb','glorious','marvelous','splendid','radiant','vibrant','blissful',
  'enchanting','heartwarming','inspiring','uplifting','triumphant',
  'generous','gracious','harmonious','peaceful','serene','tender','charming','dazzling','lively','majestic',
  'noble','pleasant','proud','refreshing','victorious',
];
const NEG = [
  'sad','angry','hate','terrible','awful','horrible','bad','worst','ugly','stupid',
  'mean','boring','scary','cruel','lonely',
  'miserable','dreadful','disgusting','painful','frightening','depressing','annoying','frustrating','heartbreaking','devastating',
  'gloomy','wretched','pathetic','worthless','hopeless',
  'bitter','resentful','hostile','toxic','vicious','hideous','unbearable','tragic','dismal','dreary',
  'ghastly','rotten','wicked','harsh','ruthless',
];

function analyze(text: string) {
  const words = text.toLowerCase().split(/\s+/);
  const hl: { word: string; pol: number }[] = [];
  let total = 0;
  words.forEach(w => {
    const c = w.replace(/[^a-z]/g, '');
    if (POS.includes(c)) { total++; hl.push({ word: c, pol: 1 }); }
    else if (NEG.includes(c)) { total--; hl.push({ word: c, pol: -1 }); }
  });
  const score = words.length > 0 ? Math.max(-1, Math.min(1, total / Math.max(1, Math.sqrt(words.length)))) : 0;
  return { score, hl, wordCount: words.filter(w => w.length > 0).length };
}

const CHALLENGES = [
  // Easy
  { text: 'Write the HAPPIEST sentence you can!', target: 'happy', difficulty: 'easy' as const, check: (s: number) => s > 0.5 },
  { text: 'Write the SADDEST sentence you can!', target: 'sad', difficulty: 'easy' as const, check: (s: number) => s < -0.5 },
  { text: 'Write a COMPLIMENT for someone you like!', target: 'compliment', difficulty: 'easy' as const, check: (s: number, wc: number) => s > 0.3 && wc >= 3 },
  // Medium
  { text: 'Write a perfectly NEUTRAL sentence!', target: 'neutral', difficulty: 'medium' as const, check: (s: number, wc: number) => Math.abs(s) < 0.15 && wc >= 4 },
  { text: 'Write something MIXED \u2014 both happy AND sad!', target: 'mixed', difficulty: 'medium' as const, check: (s: number, _wc: number, hl: { pol: number }[]) => hl.some(h => h.pol > 0) && hl.some(h => h.pol < 0) },
  { text: 'Use exactly 3 emotional words in one sentence!', target: 'count3', difficulty: 'medium' as const, check: (_s: number, _wc: number, hl: { pol: number }[]) => hl.length === 3 },
  { text: 'Write a PRODUCT REVIEW that sounds positive!', target: 'review', difficulty: 'medium' as const, check: (s: number, wc: number) => s > 0.3 && wc >= 5 },
  { text: 'Write a sentence with EXACTLY 2 negative words!', target: 'neg2', difficulty: 'medium' as const, check: (_s: number, _wc: number, hl: { pol: number }[]) => hl.filter(h => h.pol < 0).length === 2 },
  // Hard
  { text: 'Write a SARCASTIC sentence that uses positive words but sounds negative!', target: 'sarcasm', difficulty: 'hard' as const, check: (s: number, wc: number, hl: { pol: number }[]) => s > 0.2 && wc >= 5 && hl.filter(h => h.pol > 0).length >= 2 },
  { text: 'Write CONSTRUCTIVE CRITICISM \u2014 use both positive and negative words!', target: 'constructive', difficulty: 'hard' as const, check: (_s: number, wc: number, hl: { pol: number }[]) => hl.some(h => h.pol > 0) && hl.some(h => h.pol < 0) && wc >= 6 },
  { text: 'Write a sentence WITHOUT any emotional words (but at least 6 words)!', target: 'noemotion', difficulty: 'hard' as const, check: (_s: number, wc: number, hl: { pol: number }[]) => hl.length === 0 && wc >= 6 },
  { text: 'Write a sentence with EXACTLY 5 emotional words!', target: 'count5', difficulty: 'hard' as const, check: (_s: number, _wc: number, hl: { pol: number }[]) => hl.length === 5 },
  // Expert
  { text: 'Write a sentence that scores EXACTLY neutral (score near 0) but uses 4+ emotional words!', target: 'balanced4', difficulty: 'expert' as const, check: (s: number, _wc: number, hl: { pol: number }[]) => Math.abs(s) < 0.15 && hl.length >= 4 },
  { text: 'Write a sentence with MORE negative words than positive, but an overall POSITIVE score!', target: 'inverseNeg', difficulty: 'expert' as const, check: (s: number, _wc: number, hl: { pol: number }[]) => { const pos = hl.filter(h => h.pol > 0).length; const neg = hl.filter(h => h.pol < 0).length; return neg > pos && s > 0 && hl.length >= 3; } },
  { text: 'Write a sentence using at least 7 emotional words in 12+ words total!', target: 'emotionDense', difficulty: 'expert' as const, check: (_s: number, wc: number, hl: { pol: number }[]) => hl.length >= 7 && wc >= 12 },
];

export function SentimentScannerGame() {
  const prefersReducedMotion = useReducedMotion();
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('sentiment-scanner', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const { safeTimeout } = useSafeTimeout();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const challenges = useFilteredContent(CHALLENGES, tier, ageBand);

  // IND-11: Set maxScore to match 15pts/challenge (not default 10pts)
  useEffect(() => {
    if (challenges.length > 0) game.setMaxScore(challenges.length * 15);
  }, [challenges.length, game]);
  const [text, setText] = useState('');
  const [ci, setCi] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  const { score, hl, wordCount } = useMemo(() => analyze(text), [text]);
  const emoji = score > 0.3 ? '\u{1F60A}' : score < -0.3 ? '\u{1F622}' : '\u{1F610}';
  const pct = ((score + 1) / 2) * 100;

  useEffect(() => {
    setGameSceneContent(<SentimentScannerEnvironment sentiment={score} textsAnalyzed={ci} />);
  }, [score, ci, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  function check() {
    const c = challenges[ci];
    const ok = c.check(score, wordCount, hl);
    if (ok && !done.has(ci)) {
      setDone(p => new Set(p).add(ci));
      game.updateScore(15);
      game.advanceRound();
      setShowSuccess(true);
      safeTimeout(() => {
        setShowSuccess(false);
        if (ci < challenges.length - 1) { setCi(i => i + 1); setText(''); }
        else { setPhase('complete'); game.completeGame(); }
      }, 1500);
    }
  }

  return (
    <GameShell gameId="sentiment-scanner" title="Sentiment Scanner" worldNumber={8} worldColor="#8F96FA" totalRounds={challenges.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(99,102,241,${0.15 + p.size * 0.06}), transparent)` }}
              animate={prefersReducedMotion ? {} : { y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">

                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    <span className="text-5xl" role="img" aria-label="microscope">{'\u{1F52C}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">Sentiment Scanner</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Explore lexicon-based sentiment analysis. Write text and observe real-time polarity scoring with keyword decomposition.'
                        : 'Write sentences and watch the emoji mood meter react! Can you make it happy, sad, or neutral?'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Sentiment Analysis', 'NLP', 'Polarity'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-body text-2xs text-indigo-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start sentiment scanning game">
                      Start Scanning! <ScanLine className="inline w-4 h-4 ml-1" />
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
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-[#818CF8]' : 'bg-white/20'}`} />
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
                        style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }}
                        whileTap={{ scale: 0.95 }}>{learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Playing!'}</motion.button>
                    </div>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    <div className="flex items-center gap-3 mb-3 px-4">
                      <DifficultySelector value={tier} onChange={setTier} ageBand={ageBand} />
                      <GameProgressTracker current={ci + 1} total={challenges.length} labColor="#818CF8" />
                    </div>
                    {/* Challenge */}
                    <div className="rounded-xl p-3 mb-3 border border-indigo-500/20 bg-indigo-500/5 text-center">
                      <p className="font-display text-sm font-bold text-indigo-400">{'\u{1F3AF}'} {challenges[ci].text}</p>
                    </div>

                    {/* Mood meter */}
                    <div className="flex items-center gap-3 mb-3 justify-center">
                      <span className="text-xl">{'\u{1F622}'}</span>
                      <div className="w-48 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative overflow-visible">
                        <motion.div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center text-sm"
                          animate={{ left: `calc(${pct}% - 12px)` }} transition={{ type: 'spring', stiffness: 200 }}>
                          {emoji}
                        </motion.div>
                      </div>
                      <span className="text-xl">{'\u{1F60A}'}</span>
                    </div>

                    <p className="font-mono text-xs text-white/20 text-center mb-3">
                      {ageBand === 'C' ? `Polarity: ${score.toFixed(3)} | Words: ${wordCount} | Emotional: ${hl.length}`
                        : `Mood: ${score > 0.3 ? 'Happy!' : score < -0.3 ? 'Sad' : 'Neutral'}`}
                    </p>

                    {/* Input */}
                    <textarea value={text} onChange={e => setText(e.target.value)}
                      placeholder="Type a sentence..." autoFocus aria-label="Sentiment input"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm resize-none h-20 mb-3 focus:outline-none focus:border-indigo-500/40" />

                    {/* Highlighted words */}
                    {hl.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {hl.map((h, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded text-xs font-bold ${h.pol > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {h.word} {h.pol > 0 ? '\u2191' : '\u2193'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Success flash */}
                    <AnimatePresence>
                      {showSuccess && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className="mb-3 rounded-xl p-3 bg-green-500/10 border border-green-500/20 text-center">
                          <p className="font-display text-sm font-bold text-green-400">{'\u2705'} Challenge Complete!</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button onClick={check}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Check sentiment answer">
                      Check!
                    </motion.button>
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
                    <h2 className="font-display text-2xl font-bold text-white">Sentiment Scanner Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You mastered sentiment analysis by writing sentences that triggered specific emotional responses — the same technique AI uses to understand opinions online!</p>
                    <div className="rounded-xl px-6 py-3 bg-[#818CF8]/10 border border-[#818CF8]/20">
                      <p className="font-data text-2xl" style={{ color: '#818CF8' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Sentiment analysis scores text from negative to positive</li>
                        <li>• Emotion detection identifies feelings like joy, anger, and surprise in words</li>
                        <li>• NLP keyword matching is a simple but powerful way to gauge tone</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
