// ════════════════════════════════════════════════════
// SENTIMENT SCANNER V2 — Lab 8 (NLP)
// Real-time keyword sentiment analysis with emoji meter.
// Enhanced: chrome bezel, welcome phase, 5 challenges,
// word highlighting with polarity, age-band vocabulary.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { ScanLine } from 'lucide-react';
import dynamic from 'next/dynamic';

// 3D Environment (no SSR)
const Canvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas),
  { ssr: false }
);
const SentimentScannerEnvironment = dynamic(
  () => import('@/components/3d/environments/SentimentScannerEnvironment'),
  { ssr: false }
);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

type Phase = 'welcome' | 'play';

const POS = ['happy','joy','love','great','amazing','wonderful','beautiful','fantastic','excellent','awesome','brilliant','delightful','cheerful','kind','friendly'];
const NEG = ['sad','angry','hate','terrible','awful','horrible','bad','worst','ugly','stupid','mean','boring','scary','cruel','lonely'];

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
  { text: 'Write the HAPPIEST sentence you can!', target: 'happy', check: (s: number) => s > 0.5 },
  { text: 'Write the SADDEST sentence you can!', target: 'sad', check: (s: number) => s < -0.5 },
  { text: 'Write a perfectly NEUTRAL sentence!', target: 'neutral', check: (s: number, wc: number) => Math.abs(s) < 0.15 && wc >= 4 },
  { text: 'Write something MIXED \u2014 both happy AND sad!', target: 'mixed', check: (s: number, _wc: number, hl: { pol: number }[]) => hl.some(h => h.pol > 0) && hl.some(h => h.pol < 0) },
  { text: 'Use exactly 3 emotional words in one sentence!', target: 'count3', check: (_s: number, _wc: number, hl: { pol: number }[]) => hl.length === 3 },
];

export function SentimentScannerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [text, setText] = useState('');
  const [ci, setCi] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  const { score, hl, wordCount } = useMemo(() => analyze(text), [text]);
  const emoji = score > 0.3 ? '\u{1F60A}' : score < -0.3 ? '\u{1F622}' : '\u{1F610}';
  const pct = ((score + 1) / 2) * 100;

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  function check() {
    const c = CHALLENGES[ci];
    const ok = c.check(score, wordCount, hl);
    if (ok && !done.has(ci)) {
      setDone(p => new Set(p).add(ci));
      game.updateScore(15);
      game.advanceRound();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (ci < CHALLENGES.length - 1) { setCi(i => i + 1); setText(''); }
        else game.completeGame();
      }, 1500);
    }
  }

  return (
    <GameShell gameId="sentiment-scanner" title="Sentiment Scanner" worldNumber={8} worldColor="#818CF8" totalRounds={CHALLENGES.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* 3D Environment Background */}
        {!isMobile && (
          <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
            <Canvas
              camera={{ position: [0, 2, 8], fov: 50 }}
              style={{ background: 'transparent' }}
              gl={{ alpha: true, antialias: true }}
            >
              <SentimentScannerEnvironment sentiment={score} textsAnalyzed={ci} />
            </Canvas>
          </div>
        )}

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(99,102,241,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
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
                        <span key={t} className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-body text-[10px] text-indigo-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Scanning! <ScanLine className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    {/* Challenge */}
                    <div className="rounded-xl p-3 mb-3 border border-indigo-500/20 bg-indigo-500/5 text-center">
                      <p className="font-display text-sm font-bold text-indigo-400">{'\u{1F3AF}'} {CHALLENGES[ci].text}</p>
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
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Check!
                    </motion.button>
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
