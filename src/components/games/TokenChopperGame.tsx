// ════════════════════════════════════════════════════
// TOKEN CHOPPER V2 — Lab 4 (AI That Creates)
// Type text, see it split into tokens in real-time.
// Enhanced: chrome bezel, welcome phase, 5 challenges,
// token categories, cost calculator, age-band explanations.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Scissors } from 'lucide-react';

// 3D Environment (no SSR)
const Canvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas),
  { ssr: false }
);
const TokenChopperEnvironment = dynamic(
  () => import('@/components/3d/environments/TokenChopperEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'play';

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

const CHALLENGES = [
  { text: 'Type a 4-letter word that stays as one token!', target: 'single', hint: 'Short common words like "play" or "code" stay as one token.' },
  { text: 'Find a word that splits into 3+ tokens!', target: 'split3', hint: 'Try longer words like "understanding" or "extraordinary".' },
  { text: 'Write a sentence with exactly 10 tokens!', target: 'exact10', hint: 'Count words + spaces + punctuation. A 5-word sentence is usually about right.' },
  { text: 'Use punctuation to create 5+ punctuation tokens!', target: 'punct5', hint: 'Try: "Hello! How are you? Fine, thanks!!!"' },
  { text: 'Write something that costs over $0.00005!', target: 'expensive', hint: 'More tokens = more cost. Write a longer paragraph!' },
];

export function TokenChopperGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [text, setText] = useState('');
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);

  const tokens = useMemo(() => tokenize(text), [text]);
  const cost = (tokens.length * 0.00001).toFixed(5);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 4,
    dur: (i % 6) + 4,
  })), []);

  function checkChallenge() {
    const c = CHALLENGES[challengeIdx];
    let passed = false;
    if (c.target === 'single' && tokens.some(t => t.type === 'word' && t.token.length === 4)) passed = true;
    if (c.target === 'split3') {
      const words = text.split(/\s+/);
      passed = words.some(w => tokenize(w).length >= 3);
    }
    if (c.target === 'exact10' && tokens.length === 10) passed = true;
    if (c.target === 'punct5' && tokens.filter(t => t.type === 'punct').length >= 5) passed = true;
    if (c.target === 'expensive' && parseFloat(cost) > 0.00005) passed = true;

    if (passed && !completed.has(challengeIdx)) {
      setCompleted(prev => new Set(prev).add(challengeIdx));
      game.updateScore(15);
      game.advanceRound();
      setShowHint(false);
      if (challengeIdx < CHALLENGES.length - 1) {
        setTimeout(() => {
          setChallengeIdx(i => i + 1);
          setText('');
        }, 1500);
      } else {
        setTimeout(() => game.completeGame(), 1500);
      }
    }
  }

  return (
    <GameShell gameId="token-chopper" title="Token Chopper" worldNumber={4} worldColor="#FFAA44" totalRounds={CHALLENGES.length}>
      {/* 3D Environment Background */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 2, 8], fov: 50 }}
          style={{ background: 'transparent' }}
          gl={{ alpha: true, antialias: true }}
        >
          <TokenChopperEnvironment tokensChopped={tokens.length} isChopping={phase === 'play' && text.length > 0} />
        </Canvas>
      </div>
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
                    <span className="text-5xl">{'\u2702\uFE0F'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">Token Chopper</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Explore how language models tokenize text using byte-pair encoding. See subword splitting in action.'
                        : 'See how AI chops up your words into tiny pieces called "tokens"! Every word has a cost.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Tokenization', 'Subwords', 'API Cost'].map(t => (
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
                      Start Chopping! <Scissors className="inline w-4 h-4 ml-1" />
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
                    {/* Challenge bar */}
                    <div className="rounded-xl p-3 mb-3 border border-orange-400/20 bg-orange-400/5">
                      <p className="font-display text-sm font-bold text-orange-400">
                        {CHALLENGES[challengeIdx].text}
                      </p>
                      {showHint && (
                        <p className="font-body text-[10px] text-white/30 mt-1">
                          {CHALLENGES[challengeIdx].hint}
                        </p>
                      )}
                      {!showHint && (
                        <button
                          onClick={() => setShowHint(true)}
                          className="font-body text-[10px] text-white/20 hover:text-white/40 mt-1"
                        >
                          Show hint
                        </button>
                      )}
                    </div>

                    {/* Input */}
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Type anything here to see tokens..."
                      aria-label="Text input for tokenization"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm mb-3 resize-none h-20 focus:outline-none focus:border-orange-400/50"
                    />

                    {/* Stats bar */}
                    <div className="flex items-center gap-4 mb-3">
                      <span className="font-data text-xs text-white/40">{tokens.length} tokens</span>
                      <span className="font-mono text-xs text-white/20">{'\u2248'} ${cost}</span>
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
                            <span className="font-body text-[8px] text-white/20">{c.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Token pills */}
                    <div className="flex-1 overflow-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {tokens.map((tok, i) => (
                          <motion.span
                            key={`${tok.token}-${i}`}
                            className="px-2.5 py-1 rounded-lg font-mono text-xs text-white"
                            style={{
                              backgroundColor: TYPE_COLORS[tok.type].bg,
                              border: `1px solid ${TYPE_COLORS[tok.type].border}`,
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.03 }}
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
                    >
                      Check Challenge
                    </motion.button>
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
