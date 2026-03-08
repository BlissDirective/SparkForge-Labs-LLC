# SPARKFORGE — STAGE 7C PART 1: Treat Trainer + Sentiment Scanner

**Date:** February 20, 2026 | **GCUD Version:** V7
**Batch:** 7C — Simulation & Sandbox Games
**Games in this file:** Treat Trainer (Standard Polish), Sentiment Scanner (Standard Polish)

---

## Game 1: `src/components/games/TreatTrainerGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// TREAT TRAINER V2 — Lab 2 (Teaching AI)
// Reinforcement learning grid maze.
// Enhanced: chrome bezel, welcome phase, age-band explanations,
// visual reward sliders, learning progress chart, RL vocabulary.
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Play, Dog } from 'lucide-react';

type Phase = 'welcome' | 'play';

const SIZE = 7;
const WALLS: [number, number][] = [[1,1],[1,2],[2,4],[3,1],[3,3],[4,5],[5,2],[5,3]];
const START: [number, number] = [0, 0];
const GOAL: [number, number] = [6, 6];
const TOTAL_EPISODES = 10;

const isWall = (r: number, c: number) => WALLS.some(([wr, wc]) => wr === r && wc === c);

export function TreatTrainerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  // Initialize game store
  useEffect(() => { game.startGame("treat-trainer", TOTAL_EPISODES); }, []);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [rewards, setRewards] = useState({ toward: 3, away: -2, wall: -5, goal: 10 });
  const [episode, setEpisode] = useState(0);
  const [path, setPath] = useState<[number, number][]>([]);
  const [robotPos, setRobotPos] = useState<[number, number]>(START);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  const runEpisode = useCallback(async () => {
    setRunning(true);
    let pos: [number, number] = [...START];
    const trail: [number, number][] = [[...pos]];
    const visited = new Set<string>();
    let steps = 0;

    for (let s = 0; s < 50; s++) {
      steps++;
      const moves = ([[0,1],[0,-1],[1,0],[-1,0]] as [number, number][]).filter(([dr, dc]) => {
        const nr = pos[0] + dr, nc = pos[1] + dc;
        return nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !isWall(nr, nc);
      });
      if (moves.length === 0) break;

      const scored = moves.map(([dr, dc]) => {
        const nr = pos[0] + dr, nc = pos[1] + dc;
        let sc = 0;
        const dB = Math.abs(pos[0] - GOAL[0]) + Math.abs(pos[1] - GOAL[1]);
        const dA = Math.abs(nr - GOAL[0]) + Math.abs(nc - GOAL[1]);
        sc += dA < dB ? rewards.toward : rewards.away;
        if (nr === GOAL[0] && nc === GOAL[1]) sc += rewards.goal;
        if (visited.has(`${nr},${nc}`)) sc -= 1;
        sc += (Math.random() - 0.5) * Math.max(1, 6 - episode);
        return { dr, dc, sc };
      });
      scored.sort((a, b) => b.sc - a.sc);

      pos = [pos[0] + scored[0].dr, pos[1] + scored[0].dc];
      visited.add(`${pos[0]},${pos[1]}`);
      trail.push([...pos]);
      setRobotPos([...pos]);
      setPath([...trail]);

      await new Promise(r => setTimeout(r, 100));
      if (pos[0] === GOAL[0] && pos[1] === GOAL[1]) break;
    }

    setHistory(prev => [...prev, steps]);
    setEpisode(e => e + 1);
    game.updateScore(5);
    game.advanceRound();
    setRunning(false);
    if (episode >= 9) game.completeGame();
  }, [rewards, episode, game]);

  return (
    <GameShell gameId="treat-trainer" title="Treat Trainer" worldNumber={2} worldColor="#8B5CF6">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(139,92,246,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">

                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-5xl">🐕</span>
                    <h2 className="font-display text-2xl font-bold text-white">Treat Trainer</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? "Tune the reward function to shape an agent's policy in a grid maze. Observe convergence over 10 episodes."
                        : 'Train a robot to find the treat! Adjust rewards to teach it the best path.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Reinforcement Learning', 'Rewards', 'Training'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-[10px] text-purple-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Training! <Dog className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ PLAY ═══ */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    <p className="font-body text-xs text-white/40 text-center mb-2">
                      {ageBand === 'C' ? `Episode ${episode + 1}/10 — Tune the reward function and observe convergence.`
                        : `Episode ${episode + 1}/10 — Adjust rewards and run!`}
                    </p>

                    {/* Reward sliders */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {([
                        { key: 'toward' as const, label: ageBand === 'C' ? 'R(closer)' : '→ Toward', color: '#10B981' },
                        { key: 'away' as const, label: ageBand === 'C' ? 'R(farther)' : '← Away', color: '#EF4444' },
                        { key: 'wall' as const, label: ageBand === 'C' ? 'R(wall)' : '🧱 Hit wall', color: '#F59E0B' },
                        { key: 'goal' as const, label: ageBand === 'C' ? 'R(goal)' : '🎯 Reach goal', color: '#8B5CF6' },
                      ]).map(({ key, label, color }) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="font-body text-[9px] text-white/40 w-20 truncate">{label}</span>
                          <input type="range" min={-10} max={10} value={rewards[key]}
                            onChange={e => setRewards(r => ({ ...r, [key]: +e.target.value }))}
                            className="flex-1 h-1 accent-purple-500"
                            aria-label={`${label} reward`} />
                          <span className="font-mono text-[10px] w-6 text-right" style={{ color }}>{rewards[key]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, 32px)` }}>
                        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
                          const r = Math.floor(i / SIZE), c = i % SIZE;
                          const isR = robotPos[0] === r && robotPos[1] === c;
                          const isG = r === GOAL[0] && c === GOAL[1];
                          const isS = r === START[0] && c === START[1];
                          const isW = isWall(r, c);
                          const inP = path.some(([pr, pc]) => pr === r && pc === c);
                          return (
                            <div key={i} className={`w-[32px] h-[32px] rounded-sm flex items-center justify-center text-xs
                              ${isW ? 'bg-white/10' : isR ? 'bg-purple-500/30' : isG ? 'bg-green-500/20' : isS ? 'bg-blue-500/20' : inP ? 'bg-purple-500/10' : 'bg-white/[0.02]'}`}>
                              {isR ? '🤖' : isG ? '🦴' : isS ? '🏁' : isW ? '🧱' : inP ? <span className="text-[6px] text-purple-400">•</span> : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Steps chart */}
                    {history.length > 0 && (
                      <div className="mb-2">
                        <p className="font-body text-[9px] text-white/20 mb-1">
                          {ageBand === 'C' ? 'Steps per episode (convergence)' : 'Steps taken'}
                        </p>
                        <div className="flex items-end gap-1 h-8 justify-center">
                          {history.map((s, i) => (
                            <motion.div key={i} className="w-3 bg-purple-500/50 rounded-t"
                              initial={{ height: 0 }} animate={{ height: `${Math.min(100, s * 2)}%` }}>
                              <span className="font-mono text-[6px] text-white/20 block text-center">{s}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    <motion.button onClick={runEpisode} disabled={running || episode >= 10}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Play className="w-4 h-4" /> {running ? 'Running...' : `Run Episode ${episode + 1}`}
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Game 2: `src/components/games/SentimentScannerGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// SENTIMENT SCANNER V2 — Lab 8 (NLP)
// Real-time keyword sentiment analysis with emoji meter.
// Enhanced: chrome bezel, welcome phase, 5 challenges,
// word highlighting with polarity, age-band vocabulary.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { ScanLine, Smile } from 'lucide-react';

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
  { text: 'Write something MIXED — both happy AND sad!', target: 'mixed', check: (s: number, _wc: number, hl: { pol: number }[]) => hl.some(h => h.pol > 0) && hl.some(h => h.pol < 0) },
  { text: 'Use exactly 3 emotional words in one sentence!', target: 'count3', check: (_s: number, _wc: number, hl: { pol: number }[]) => hl.length === 3 },
];

export function SentimentScannerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  // Initialize game store
  useEffect(() => { game.startGame("sentiment-scanner", CHALLENGES.length); }, []);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [text, setText] = useState('');
  const [ci, setCi] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  const { score, hl, wordCount } = useMemo(() => analyze(text), [text]);
  const emoji = score > 0.3 ? '😊' : score < -0.3 ? '😢' : '😐';
  const pct = ((score + 1) / 2) * 100;

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
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
    <GameShell gameId="sentiment-scanner" title="Sentiment Scanner" worldNumber={8} worldColor="#818CF8">
      <div className="h-full flex flex-col relative overflow-hidden">
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

                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    <span className="text-5xl">🔬</span>
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

                {/* ═══ PLAY ═══ */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    {/* Challenge */}
                    <div className="rounded-xl p-3 mb-3 border border-indigo-500/20 bg-indigo-500/5 text-center">
                      <p className="font-display text-sm font-bold text-indigo-400">🎯 {CHALLENGES[ci].text}</p>
                    </div>

                    {/* Mood meter */}
                    <div className="flex items-center gap-3 mb-3 justify-center">
                      <span className="text-xl">😢</span>
                      <div className="w-48 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative overflow-visible">
                        <motion.div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center text-sm"
                          animate={{ left: `calc(${pct}% - 12px)` }} transition={{ type: 'spring', stiffness: 200 }}>
                          {emoji}
                        </motion.div>
                      </div>
                      <span className="text-xl">😊</span>
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
                            {h.word} {h.pol > 0 ? '↑' : '↓'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Success flash */}
                    <AnimatePresence>
                      {showSuccess && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className="mb-3 rounded-xl p-3 bg-green-500/10 border border-green-500/20 text-center">
                          <p className="font-display text-sm font-bold text-green-400">✅ Challenge Complete!</p>
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
```
