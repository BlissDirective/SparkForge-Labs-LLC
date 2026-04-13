// ════════════════════════════════════════════════════
// TOKEN CHOPPER V2 — Lab 4 (AI That Creates)
// Type text, see it split into tokens in real-time.
// Enhanced: chrome bezel, welcome phase, 5 challenges,
// token categories, cost calculator, age-band explanations.
// ENH: Staggered token entrance + type colors + chop animation + cost meter
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
import { Scissors, Fuel } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import { useFilteredContent } from '@/hooks/useFilteredContent';
import { GameProgressTracker } from '@/components/games/GameProgressTracker';

// 3D Environment (no SSR)
const TokenChopperEnvironment = dynamic(
  () => import('@/components/3d/environments/TokenChopperEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'learn' | 'play' | 'complete';

const LEARN_CARDS = [
  { emoji: '\u2702\uFE0F', title: 'What is Tokenization?', desc: 'AI breaks text into small pieces called tokens \u2014 words, parts of words, or even single characters.' },
  { emoji: '\uD83E\uDDE9', title: 'Why Tokens Matter', desc: 'AI reads tokens, not sentences. How text is split into tokens affects how well AI understands it.' },
  { emoji: '\uD83C\uDFAF', title: 'Your Mission', desc: 'Split sentences into tokens the same way AI does. Match the AI\'s tokenization to score points!' },
];

function tokenize(text: string): { token: string; type: 'word' | 'subword' | 'punct' | 'space' }[] {
  if (!text.trim()) return [];
  const result: { token: string; type: 'word' | 'subword' | 'punct' | 'space' }[] = [];
  const parts = text.match(/[A-Z]?[a-z]+|[A-Z]+|[0-9]+|[^\w\s]|\s+/g) || [];
  parts.forEach(part => {
    if (/^\s+$/.test(part)) {
      result.push({ token: '\u23B5', type: 'space' });
    } else if (/^[^\w\s]$/.test(part)) {
      result.push({ token: part, type: 'punct' });
    } else if (part.length <= 4) {
      result.push({ token: part, type: 'word' });
    } else {
      let i = 0;
      let chunkIndex = 0;
      while (i < part.length) {
        const chunk = Math.min(3 + (chunkIndex % 3), part.length - i);
        result.push({ token: part.slice(i, i + chunk), type: i === 0 ? 'word' : 'subword' });
        i += chunk;
        chunkIndex++;
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

const CHALLENGES: { text: string; target: string; hint: string; difficulty: 'easy' | 'medium' | 'hard' | 'expert' }[] = [
  // Easy (~30%)
  { text: 'Type a 4-letter word that stays as one token!', target: 'single', hint: 'Short common words like "play" or "code" stay as one token.', difficulty: 'easy' },
  { text: 'Type any word and see it get chopped!', target: 'anyword', hint: 'Just type a word with 5 or more letters and watch it split.', difficulty: 'easy' },
  { text: 'Type a 3-letter word — does it stay whole?', target: 'tiny', hint: 'Try "cat", "dog", or "run" — super short words are usually one token.', difficulty: 'easy' },
  { text: 'Type two short words separated by a space!', target: 'twospaces', hint: 'Something like "hi there" — notice the space becomes a token too!', difficulty: 'easy' },
  // Medium (~35%)
  { text: 'Find a word that splits into 3+ tokens!', target: 'split3', hint: 'Try longer words like "understanding" or "extraordinary".', difficulty: 'medium' },
  { text: 'Write a sentence with exactly 10 tokens!', target: 'exact10', hint: 'Count words + spaces + punctuation. A 5-word sentence is usually about right.', difficulty: 'medium' },
  { text: 'Use punctuation to create 5+ punctuation tokens!', target: 'punct5', hint: 'Try: "Hello! How are you? Fine, thanks!!!"', difficulty: 'medium' },
  { text: 'Write a sentence where every word is a single token!', target: 'allsingle', hint: 'Use only short, common words like "I like to play with my dog".', difficulty: 'medium' },
  { text: 'Create exactly 3 subword tokens in one word!', target: 'sub3', hint: 'Words like "extraordinary" or "unbelievable" split into subword pieces.', difficulty: 'medium' },
  // Hard (~25%)
  { text: 'Write something that costs over $0.00005!', target: 'expensive', hint: 'More tokens = more cost. Write a longer paragraph!', difficulty: 'hard' },
  { text: 'Write a sentence with more subwords than whole words!', target: 'moresub', hint: 'Use lots of long, uncommon words like "internationalization" and "electromagnetic".', difficulty: 'hard' },
  { text: 'Get exactly 20 tokens — no more, no less!', target: 'exact20', hint: 'A sentence of about 8-10 words with some punctuation should get you close.', difficulty: 'hard' },
  { text: 'Write a sentence with zero subword tokens!', target: 'nosub', hint: 'Use only very short words (4 letters or fewer). "I am on my bed" has no subwords.', difficulty: 'hard' },
  // Expert (~10%)
  { text: 'Make a single word create 5+ tokens!', target: 'megasplit', hint: 'Try extremely long words like "antidisestablishmentarianism" or compound technical terms.', difficulty: 'expert' },
  { text: 'Write something that costs exactly $0.00003!', target: 'exactcost', hint: 'You need exactly 3 tokens. A single short word might do it!', difficulty: 'expert' },
];

export function TokenChopperGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('token-chopper', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [text, setText] = useState('');
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [challengePassed, setChallengePassed] = useState(false);
  const animatedScore = useAnimatedCounter(game.score);
  const [tier, setTier] = useState<DifficultyTier | 'all'>('all');
  const challenges = useFilteredContent(CHALLENGES, tier, ageBand);
  const { safeTimeout } = useSafeTimeout();

  const tokens = useMemo(() => tokenize(text), [text]);
  const cost = (tokens.length * 0.00001).toFixed(5);

  useEffect(() => {
    setGameSceneContent(<TokenChopperEnvironment tokensChopped={tokens.length} isChopping={phase === 'play' && text.length > 0} />);
  }, [tokens.length, phase, text.length, setGameSceneContent]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  function checkChallenge() {
    const c = challenges[challengeIdx];
    let passed = false;
    if (c.target === 'single' && tokens.length === 1 && tokens[0].type === 'word' && tokens[0].token.length === 4) passed = true;
    if (c.target === 'anyword' && tokens.some(t => t.type === 'subword')) passed = true;
    if (c.target === 'tiny' && tokens.length >= 1 && tokens.some(t => t.type === 'word' && t.token.length <= 3)) passed = true;
    if (c.target === 'twospaces' && tokens.filter(t => t.type === 'space').length >= 1 && tokens.filter(t => t.type === 'word').length >= 2) passed = true;
    if (c.target === 'split3') {
      const words = text.split(/\s+/);
      passed = words.some(w => tokenize(w).length >= 3);
    }
    if (c.target === 'exact10' && tokens.length === 10) passed = true;
    if (c.target === 'punct5' && tokens.filter(t => t.type === 'punct').length >= 5) passed = true;
    if (c.target === 'allsingle' && tokens.length >= 5 && tokens.filter(t => t.type === 'word').length >= 3 && tokens.every(t => t.type !== 'subword')) passed = true;
    if (c.target === 'sub3') {
      const words = text.split(/\s+/);
      passed = words.some(w => tokenize(w).filter(t => t.type === 'subword').length >= 3);
    }
    if (c.target === 'expensive' && parseFloat(cost) > 0.00005) passed = true;
    if (c.target === 'moresub' && tokens.filter(t => t.type === 'subword').length > tokens.filter(t => t.type === 'word').length) passed = true;
    if (c.target === 'exact20' && tokens.length === 20) passed = true;
    if (c.target === 'nosub' && tokens.length >= 5 && tokens.every(t => t.type !== 'subword')) passed = true;
    if (c.target === 'megasplit') {
      const words = text.split(/\s+/);
      passed = words.some(w => tokenize(w).length >= 5);
    }
    if (c.target === 'exactcost' && cost === '0.00003') passed = true;

    if (passed && !completed.has(challengeIdx)) {
      setCompleted(prev => new Set(prev).add(challengeIdx));
      setChallengePassed(true);
      game.updateScore(15);
      game.advanceRound();
      setShowHint(false);
      if (challengeIdx < challenges.length - 1) {
        safeTimeout(() => {
          setChallengeIdx(i => i + 1);
          setText('');
          setChallengePassed(false);
        }, 1500);
      } else {
        safeTimeout(() => { setPhase('complete'); game.completeGame(); }, 1500);
      }
    }
  }

  return (
    <GameShell gameId="token-chopper" title="Token Chopper" worldNumber={4} worldColor="#D9A430" totalRounds={challenges.length}>
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
                    {/* ENH: Animated scissors entrance with chopping motion */}
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <motion.span
                        className="text-5xl inline-block"
                        animate={{ rotate: [0, -20, 20, -10, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                      >
                        {'\u2702\uFE0F'}
                      </motion.span>
                      <motion.div
                        className="absolute -inset-3 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(255,170,68,0.15), transparent)' }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Token Chopper welcome phase">Token Chopper</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Explore how language models tokenize text using byte-pair encoding. See subword splitting in action.'
                        : 'See how AI chops up your words into tiny pieces called "tokens"! Every word has a cost.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Tokenization', 'Subwords', 'API Cost'].map(t => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-orange-400/10 border border-orange-400/20 text-orange-400 font-body text-2xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #FFAA44, #DD8822)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Learn about tokenization"
                    >
                      Learn About Tokens! <Scissors className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'learn' && (
                  <motion.div
                    key="learn"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto"
                  >
                    <Scissors className="w-6 h-6 text-orange-400" />
                    <h3 className="font-display text-lg font-bold text-white">How Tokenization Works</h3>
                    <p className="font-body text-xs text-white/40">
                      {learnIdx + 1} of {LEARN_CARDS.length}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="rounded-xl p-4 border border-orange-400/20 bg-orange-400/5"
                      >
                        <span className="text-3xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-sm font-bold text-orange-300 mt-2">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-xs text-white/50 mt-1">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx(i => i + 1);
                        else setPhase('play');
                      }}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #FFAA44, #DD8822)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={learnIdx < LEARN_CARDS.length - 1 ? `Next card, ${learnIdx + 2} of ${LEARN_CARDS.length}` : 'Start chopping'}
                    >
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next \u2192' : 'Start Chopping! \u2702\uFE0F'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('play')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                      aria-label="Skip learn cards and start playing"
                    >
                      Skip to game {'\u2192'}
                    </button>
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
                      <GameProgressTracker current={challengeIdx + 1} total={challenges.length} labColor="#FFAA44" />
                    </div>
                    {/* ENH: Progress bar for challenges */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-2xs text-white/30" role="status" aria-label={`${completed.size} of ${challenges.length} challenges completed`}>
                          {completed.size}/{challenges.length} challenges
                        </span>
                        <span className="font-data text-2xs text-orange-400" role="status" aria-label={`Score: ${animatedScore} points`}>{animatedScore} pts</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #FFAA44, #FF8822)' }}
                          animate={{ width: `${(completed.size / challenges.length) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />
                      </div>
                    </div>

                    {/* Challenge bar */}
                    <motion.div
                      className="rounded-xl p-3 mb-3 border border-orange-400/20 bg-orange-400/5"
                      animate={challengePassed ? {
                        boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 20px rgba(74,222,128,0.3)', '0 0 0px rgba(74,222,128,0)'],
                        borderColor: ['rgba(255,170,68,0.2)', 'rgba(74,222,128,0.4)', 'rgba(255,170,68,0.2)'],
                      } : {}}
                      transition={{ duration: 0.8 }}
                    >
                      <p className="font-display text-sm font-bold text-orange-400">
                        {challenges[challengeIdx].text}
                      </p>
                      {showHint && (
                        <p className="font-body text-2xs text-white/30 mt-1">
                          {challenges[challengeIdx].hint}
                        </p>
                      )}
                      {!showHint && (
                        <button
                          onClick={() => setShowHint(true)}
                          className="font-body text-2xs text-white/20 hover:text-white/40 mt-1"
                          aria-label="Show hint for current challenge"
                        >
                          Show hint
                        </button>
                      )}
                    </motion.div>

                    {/* Input */}
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Type anything here to see tokens..."
                      aria-label="Text input for tokenization"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm mb-3 resize-none h-20 focus:outline-none focus:border-orange-400/50"
                    />

                    {/* Stats bar */}
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-data text-xs text-white/40" role="status" aria-label={`${tokens.length} tokens`}>{tokens.length} tokens</span>
                      <span className="font-mono text-xs text-white/20" role="status" aria-label={`Estimated cost: $${cost}`}>{'\u2248'} ${cost}</span>
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
                            <span className="font-body text-2xs text-white/20">{c.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* ENH: Cost meter — fills like a fuel gauge */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-3 h-3 text-white/20" />
                        <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: parseFloat(cost) > 0.00005
                                ? 'linear-gradient(90deg, #FFAA44, #FF6644)'
                                : parseFloat(cost) > 0.00002
                                  ? 'linear-gradient(90deg, #FFAA44, #FFCC44)'
                                  : 'linear-gradient(90deg, #00FF88, #00BBFF)',
                            }}
                            animate={{ width: `${Math.min((parseFloat(cost) / 0.0001) * 100, 100)}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                          />
                        </div>
                        <span className="font-mono text-2xs text-white/20 w-16 text-right">${cost}</span>
                      </div>
                    </div>

                    {/* ENH: Token pills with staggered bounce entrance + type-colored borders */}
                    <div className="flex-1 overflow-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {tokens.map((tok, i) => (
                          <motion.span
                            key={`${tok.token}-${i}`}
                            className="px-2.5 py-1 rounded-lg font-mono text-xs text-white"
                            style={{
                              backgroundColor: TYPE_COLORS[tok.type].bg,
                              borderLeft: `3px solid ${TYPE_COLORS[tok.type].border}`,
                              border: `1px solid ${TYPE_COLORS[tok.type].border}`,
                              borderLeftWidth: '3px',
                            }}
                            initial={{ scale: 0, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              damping: 15,
                              delay: i * 0.04,
                            }}
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
                      style={{ background: 'linear-gradient(135deg, #FFAA44, #DD8822)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Check challenge answer"
                    >
                      Check Challenge
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
                    <motion.span className="text-6xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🏆</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white" aria-label="Token Chopper complete phase">Token Chopper Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      You discovered how AI breaks text into tokens — the fundamental units that language models read, process, and generate.
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
                        animate={{ textShadow: ['0 0 0px rgba(255,170,68,0)', '0 0 12px rgba(255,170,68,0.5)', '0 0 0px rgba(255,170,68,0)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {animatedScore}
                      </motion.p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </motion.div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Tokenization splits text into smaller pieces (tokens) that AI can understand — words, subwords, and punctuation</li>
                        <li>• Longer and rarer words get split into multiple subword tokens, while common short words stay as single tokens</li>
                        <li>• Every token has a cost — more tokens means more computation, which is why API pricing is based on token count</li>
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
