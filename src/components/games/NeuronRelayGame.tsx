// ════════════════════════════════════════════════════
// NEURON RELAY V2 — Lab 3 (Neural Networks)
// Toggle neurons on/off, adjust volume, hit target signal.
// Enhanced: chrome bezel, welcome phase, visual signal meter,
// neuron labels, age-band explanations, 8 puzzles.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Zap, BrainCircuit } from 'lucide-react';

// 3D Environment (no SSR)
const Canvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas),
  { ssr: false }
);
const NeuronRelayEnvironment = dynamic(
  () => import('@/components/3d/environments/NeuronRelayEnvironment'),
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
  const isMobile = useIsMobile();
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [pi, setPi] = useState(0);
  const puzzle = PUZZLES[pi];
  const [neurons, setNeurons] = useState<Neuron[]>(() => Array.from({ length: puzzle.n }, (_, i) => ({ id: i, on: false, vol: 50 })));
  const [result, setResult] = useState<'none' | 'pass' | 'fail'>('none');
  const [showHint, setShowHint] = useState(false);

  const signal = neurons.reduce((s, n) => s + (n.on ? n.vol * 0.2 : 0), 0);
  const inRange = signal >= puzzle.target[0] && signal <= puzzle.target[1];

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100, size: (i % 3) + 1,
    delay: (i * 0.7) % 4, dur: (i % 6) + 4,
  })), []);

  function toggle(id: number) { setNeurons(prev => prev.map(n => n.id === id ? { ...n, on: !n.on } : n)); }
  function setVol(id: number, v: number) { setNeurons(prev => prev.map(n => n.id === id ? { ...n, vol: v } : n)); }

  function test() {
    setResult(inRange ? 'pass' : 'fail');
    if (inRange) {
      game.updateScore(10);
      setTimeout(() => {
        if (pi < PUZZLES.length - 1) {
          const next = pi + 1;
          setPi(next);
          setNeurons(Array.from({ length: PUZZLES[next].n }, (_, i) => ({ id: i, on: false, vol: 50 })));
          setResult('none'); setShowHint(false);
          game.advanceRound();
        } else game.completeGame();
      }, 1500);
    }
  }

  return (
    <GameShell gameId="neuron-relay" title="Neuron Relay" worldNumber={3} worldColor="#EC4899" totalRounds={PUZZLES.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* 3D Environment Background */}
        {!isMobile && (
          <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
            <Canvas
              camera={{ position: [0, 2, 8], fov: 50 }}
              style={{ background: 'transparent' }}
              gl={{ alpha: true, antialias: true }}
            >
              <NeuronRelayEnvironment activeLayer={pi} signalStrength={signal / 100} />
            </Canvas>
          </div>
        )}

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
                    <span className="text-5xl" role="img" aria-label="brain">{'\u{1F9E0}'}</span>
                    <h2 className="font-display text-2xl font-bold text-white">Neuron Relay</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Simulate neuron activation. Toggle neurons and adjust weights to produce a target output signal within the specified range.'
                        : 'Toggle neurons on and off, adjust their volume, and try to hit the target signal!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Neurons', 'Activation', 'Signal'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 font-body text-[10px] text-pink-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Fire Neurons! <BrainCircuit className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    <p className="font-body text-xs text-white/30 text-center mb-2">
                      {ageBand === 'C' ? `Puzzle ${pi + 1}/${PUZZLES.length} \u2014 Target output: [${puzzle.target[0]}, ${puzzle.target[1]}]`
                        : `Puzzle ${pi + 1}/${PUZZLES.length} \u2014 Hit the green zone!`}
                    </p>

                    {/* Target bar */}
                    <div className="h-4 rounded-full bg-white/5 mb-4 relative overflow-hidden">
                      <div className="absolute h-full bg-pink-500/15 rounded-full"
                        style={{ left: `${puzzle.target[0]}%`, width: `${puzzle.target[1] - puzzle.target[0]}%` }} />
                      <motion.div className="absolute top-0 h-full w-1 bg-white rounded"
                        animate={{ left: `${Math.min(100, signal)}%` }}
                        transition={{ type: 'spring', stiffness: 200 }} />
                    </div>

                    {/* Neurons */}
                    <div className="flex items-center gap-3 justify-center mb-4 flex-wrap">
                      {neurons.map(n => (
                        <div key={n.id} className="text-center">
                          <p className="font-mono text-[8px] text-white/15 mb-1">
                            {ageBand === 'C' ? `N${n.id + 1} (w=${n.vol}%)` : `#${n.id + 1}`}
                          </p>
                          <motion.button onClick={() => toggle(n.id)}
                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg transition-all
                              ${n.on ? 'border-pink-500 bg-pink-500/20' : 'border-white/10 bg-white/[0.02]'}`}
                            animate={n.on ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 0.4 }}
                            aria-label={`Neuron ${n.id + 1}: ${n.on ? 'on' : 'off'}`}>
                            {n.on ? '\u26A1' : '\u26AA'}
                          </motion.button>
                          <input type="range" min={0} max={100} value={n.vol} onChange={e => setVol(n.id, +e.target.value)}
                            className="w-12 mt-1 accent-pink-500 h-1" aria-label={`Neuron ${n.id + 1} volume`} />
                          <p className="font-mono text-[8px] text-white/15">{n.vol}%</p>
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
                      <p className="font-body text-[10px] text-pink-300/50 text-center mb-2">{'\u{1F4A1}'} {puzzle.hint}</p>
                    )}
                    {!showHint && <button onClick={() => setShowHint(true)} aria-label="Show hint for this puzzle" className="block mx-auto font-body text-[10px] text-white/20 hover:text-white/40 mb-2">Need a hint?</button>}

                    <motion.button onClick={test} aria-label="Test neural signal output"
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Zap className="w-4 h-4" /> Test Signal
                    </motion.button>
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
