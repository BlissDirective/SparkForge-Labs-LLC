// ════════════════════════════════════════════════════
// NEURON RELAY V2 — Lab 3 (Neural Networks)
// Toggle neurons on/off, adjust volume, hit target signal.
// Enhanced: chrome bezel, welcome phase, visual signal meter,
// neuron labels, age-band explanations, 8 puzzles.
// ENH: Signal pulse flow + toggle animation + animated meter + target zone
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
import { Zap, BrainCircuit } from 'lucide-react';

// ENH: Animated score counter hook
function useAnimatedCounter(target: number, duration = 600) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (display === target) return;
    const start = display;
    const diff = target - start;
    const startTime = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps
  return display;
}

// 3D Environment (no SSR)
const NeuronRelayEnvironment = dynamic(
  () => import('@/components/3d/environments/NeuronRelayEnvironment'),
  { ssr: false }
);

type Phase = 'welcome' | 'play' | 'complete';

interface Neuron { id: number; on: boolean; vol: number; }

const PUZZLES = [
  { n: 3, target: [40, 60], hint: 'Try turning on 2 neurons at medium volume.' },
  { n: 3, target: [70, 90], hint: 'All 3 neurons on, but adjust their volumes.' },
  { n: 4, target: [20, 35], hint: 'Just 1-2 neurons at low volume should work.' },
  { n: 4, target: [50, 65], hint: 'About half the neurons at moderate levels.' },
  { n: 5, target: [30, 45], hint: 'Fewer neurons, lower volumes.' },
  { n: 5, target: [75, 95], hint: 'Most neurons on with high volumes.' },
  { n: 6, target: [40, 55], hint: 'Balance the activation across several neurons.' },
  { n: 6, target: [85, 100], hint: 'Nearly all neurons firing at high intensity!' },
];

export function NeuronRelayGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('neuron-relay', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [pi, setPi] = useState(0);
  const puzzle = PUZZLES[pi];
  const [neurons, setNeurons] = useState<Neuron[]>(() => Array.from({ length: puzzle.n }, (_, i) => ({ id: i, on: false, vol: 50 })));
  const [result, setResult] = useState<'none' | 'pass' | 'fail'>('none');
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [firingNeurons, setFiringNeurons] = useState<Set<number>>(new Set());
  const animatedScore = useAnimatedCounter(game.score);

  const signal = neurons.reduce((s, n) => s + (n.on ? n.vol * 0.2 : 0), 0);

  useEffect(() => {
    setGameSceneContent(<NeuronRelayEnvironment activeLayer={pi} signalStrength={signal / 100} />);
  }, [pi, signal, setGameSceneContent]);
  const inRange = signal >= puzzle.target[0] && signal <= puzzle.target[1];

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  function toggle(id: number) {
    setNeurons(prev => prev.map(n => n.id === id ? { ...n, on: !n.on } : n));
    // ENH: Show firing pulse on toggle
    setFiringNeurons(prev => { const next = new Set(prev); next.add(id); return next; });
    setTimeout(() => setFiringNeurons(prev => { const next = new Set(prev); next.delete(id); return next; }), 600);
  }
  function setVol(id: number, v: number) { setNeurons(prev => prev.map(n => n.id === id ? { ...n, vol: v } : n)); }

  function test() {
    setResult(inRange ? 'pass' : 'fail');
    if (inRange) {
      setStreak(s => s + 1);
      game.updateScore(10);
      setTimeout(() => {
        if (pi < PUZZLES.length - 1) {
          const next = pi + 1;
          setPi(next);
          setNeurons(Array.from({ length: PUZZLES[next].n }, (_, i) => ({ id: i, on: false, vol: 50 })));
          setResult('none'); setShowHint(false);
          game.advanceRound();
        } else { setPhase('complete'); game.completeGame(); }
      }, 1500);
    } else {
      setStreak(0);
    }
  }

  return (
    <GameShell gameId="neuron-relay" title="Neuron Relay" worldNumber={3} worldColor="#EC4899" totalRounds={PUZZLES.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(236,72,153,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(236,72,153,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">

                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    {/* ENH: Animated brain entrance with neural pulse */}
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <motion.span
                        className="text-5xl inline-block"
                        role="img"
                        aria-label="brain"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {'\u{1F9E0}'}
                      </motion.span>
                      <motion.div
                        className="absolute -inset-4 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2), transparent)' }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      {/* ENH: Orbiting signal dots */}
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full bg-pink-400"
                          style={{ top: '50%', left: '50%' }}
                          animate={{
                            x: [Math.cos((i * 2 * Math.PI) / 3) * 28, Math.cos((i * 2 * Math.PI) / 3 + Math.PI) * 28],
                            y: [Math.sin((i * 2 * Math.PI) / 3) * 28, Math.sin((i * 2 * Math.PI) / 3 + Math.PI) * 28],
                            opacity: [0.8, 0.3, 0.8],
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        />
                      ))}
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-white">Neuron Relay</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Simulate neuron activation. Toggle neurons and adjust weights to produce a target output signal within the specified range.'
                        : 'Toggle neurons on and off, adjust their volume, and try to hit the target signal!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Neurons', 'Activation', 'Signal'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 font-body text-2xs text-pink-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start neuron relay game">
                      Fire Neurons! <BrainCircuit className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-body text-xs text-white/30">
                        {ageBand === 'C' ? `Puzzle ${pi + 1}/${PUZZLES.length} \u2014 Target: [${puzzle.target[0]}, ${puzzle.target[1]}]`
                          : `Puzzle ${pi + 1}/${PUZZLES.length} \u2014 Hit the green zone!`}
                      </p>
                      {/* ENH: Streak display */}
                      {streak >= 2 && (
                        <motion.span
                          className="font-display text-2xs font-bold text-pink-400"
                          style={{ textShadow: `0 0 ${4 + streak * 2}px rgba(236,72,153,${0.3 + streak * 0.1})` }}
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 0.5 }}
                          key={streak}
                        >
                          {streak} streak {streak >= 4 ? '\uD83D\uDD25\uD83D\uDD25' : '\uD83D\uDD25'}
                        </motion.span>
                      )}
                    </div>

                    {/* ENH: Target bar with highlighted green target zone */}
                    <div className="h-6 rounded-full bg-white/5 mb-4 relative overflow-hidden">
                      {/* Target zone with pulsing green highlight */}
                      <motion.div
                        className="absolute h-full rounded-full"
                        style={{
                          left: `${puzzle.target[0]}%`,
                          width: `${puzzle.target[1] - puzzle.target[0]}%`,
                          background: 'linear-gradient(180deg, rgba(74,222,128,0.25), rgba(74,222,128,0.1))',
                          borderTop: '2px solid rgba(74,222,128,0.4)',
                          borderBottom: '2px solid rgba(74,222,128,0.4)',
                        }}
                        animate={{
                          boxShadow: inRange
                            ? ['0 0 0px rgba(74,222,128,0)', '0 0 12px rgba(74,222,128,0.4)', '0 0 0px rgba(74,222,128,0)']
                            : 'none',
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      {/* Target zone labels */}
                      <span className="absolute text-[9px] font-mono text-green-400/40" style={{ left: `${puzzle.target[0]}%`, top: '-14px' }}>{puzzle.target[0]}</span>
                      <span className="absolute text-[9px] font-mono text-green-400/40" style={{ left: `${puzzle.target[1]}%`, top: '-14px' }}>{puzzle.target[1]}</span>
                      {/* ENH: Animated signal indicator with smooth spring motion */}
                      <motion.div
                        className="absolute top-0 h-full w-1.5 rounded"
                        style={{
                          background: inRange ? '#4ade80' : '#EC4899',
                          boxShadow: inRange ? '0 0 8px rgba(74,222,128,0.6)' : '0 0 6px rgba(236,72,153,0.4)',
                        }}
                        animate={{ left: `${Math.min(100, signal)}%` }}
                        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                      />
                    </div>

                    {/* Neurons */}
                    <div className="flex items-center gap-3 justify-center mb-4 flex-wrap">
                      {neurons.map(n => (
                        <div key={n.id} className="text-center">
                          <p className="font-mono text-2xs text-white/15 mb-1">
                            {ageBand === 'C' ? `N${n.id + 1} (w=${n.vol}%)` : `#${n.id + 1}`}
                          </p>
                          {/* ENH: Neuron toggle with scale pop + color flash + signal pulse ring */}
                          <div className="relative">
                            <motion.button onClick={() => toggle(n.id)}
                              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg transition-colors
                                ${n.on ? 'border-pink-500 bg-pink-500/20' : 'border-white/10 bg-white/[0.02]'}`}
                              animate={firingNeurons.has(n.id) ? { scale: [1, 1.15, 1] } : n.on ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                              aria-label={`Neuron ${n.id + 1}: ${n.on ? 'on' : 'off'}`}
                              aria-pressed={n.on}>
                              {n.on ? '\u26A1' : '\u26AA'}
                            </motion.button>
                            {/* ENH: Signal pulse ring on toggle */}
                            {firingNeurons.has(n.id) && (
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-pink-400"
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                              />
                            )}
                          </div>
                          <input type="range" min={0} max={100} value={n.vol} onChange={e => setVol(n.id, +e.target.value)}
                            className="w-12 mt-1 accent-pink-500 h-1" aria-label={`Neuron ${n.id + 1} volume`} />
                          <p className="font-mono text-2xs text-white/15">{n.vol}%</p>
                        </div>
                      ))}

                      {/* Output */}
                      <motion.div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 ${
                        result === 'pass' ? 'border-green-500 bg-green-500/20' : result === 'fail' ? 'border-red-500 bg-red-500/20' : 'border-white/10 bg-white/[0.02]'
                      }`} animate={result === 'pass' ? { scale: [1, 1.3, 1] } : result === 'fail' ? { x: [-4, 4, -4, 0] } : {}}>
                        {result === 'pass' ? '\u2705' : result === 'fail' ? '\u274C' : '\u{1F3AF}'}
                      </motion.div>
                    </div>

                    <p className="font-mono text-sm text-center mb-3">
                      Signal: <span className={`font-bold ${inRange ? 'text-green-400' : 'text-white/60'}`}>{signal.toFixed(1)}</span>
                      <span className="text-white/20"> / {puzzle.target[0]}\u2013{puzzle.target[1]}</span>
                    </p>

                    {showHint && (
                      <p className="font-body text-2xs text-pink-300/50 text-center mb-2">{'\u{1F4A1}'} {puzzle.hint}</p>
                    )}
                    {!showHint && <button onClick={() => setShowHint(true)} aria-label="Show hint for this puzzle" className="block mx-auto font-body text-2xs text-white/20 hover:text-white/40 mb-2">Need a hint?</button>}

                    <motion.button onClick={test} aria-label="Test neural signal output"
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Zap className="w-4 h-4" /> Test Signal
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
                    <h2 className="font-display text-2xl font-bold text-white">Neuron Relay Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      You mastered neural signal processing by toggling neurons and adjusting their weights to hit precise target outputs across 8 puzzles.
                    </p>
                    {/* ENH: Animated score counter */}
                    <motion.div
                      className="rounded-xl px-6 py-3 bg-[#EC4899]/10 border border-[#EC4899]/20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                    >
                      <motion.p
                        className="font-data text-2xl text-[#EC4899]"
                        animate={{ textShadow: ['0 0 0px rgba(236,72,153,0)', '0 0 12px rgba(236,72,153,0.5)', '0 0 0px rgba(236,72,153,0)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {animatedScore}
                      </motion.p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </motion.div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Neural networks process information by activating neurons that pass signals forward</li>
                        <li>• Each neuron has a weight (volume) that controls how strongly it contributes to the output</li>
                        <li>• Getting the right output requires balancing which neurons fire and at what intensity — just like real brain circuits</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
