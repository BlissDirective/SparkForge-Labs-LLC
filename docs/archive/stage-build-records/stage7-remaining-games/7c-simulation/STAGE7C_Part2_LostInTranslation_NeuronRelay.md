# SPARKFORGE — STAGE 7C PART 2: Lost in Translation + Neuron Relay

**Continues from:** STAGE-7C Part 1
**Games in this file:** Lost in Translation (Standard Polish), Neuron Relay (Standard Polish)

---

## Game 3: `src/components/games/LostInTranslationGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// LOST IN TRANSLATION V2 — Lab 8 (NLP)
// Pre-computed translation telephone game.
// Enhanced: chrome bezel, welcome phase, 7 rounds,
// language flags, "why it changed" explanations, age-band.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Languages, ArrowDown } from 'lucide-react';

type Phase = 'welcome' | 'play';

interface Round {
  original: string;
  steps: string[];
  final: string;
  why: string;
  whyC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_ROUNDS: Round[] = [
  {
    original: 'Break a leg!',
    steps: ['🇫🇷 Casse une jambe!', '🇯🇵 足を折って!', '🇩🇪 Brich dir ein Bein!'],
    final: 'Break yourself a bone!',
    why: 'Idioms don\'t translate well! "Break a leg" means "good luck" in English only.',
    whyC: 'Idiomatic expressions are non-compositional — their meaning can\'t be derived from individual words. MT models lack pragmatic context.',
    band: 'A',
  },
  {
    original: 'It\'s raining cats and dogs',
    steps: ['🇰🇷 고양이와 개가 비처럼', '🇫🇷 Chats et chiens tombent du ciel', '🇪🇸 Caen gatos y perros del cielo'],
    final: 'Cats and dogs are falling from the sky!',
    why: 'Another idiom! AI translated the literal words instead of the meaning.',
    whyC: 'Statistical MT models often fail on metaphorical language because they optimize for word-level or phrase-level translation without discourse awareness.',
    band: 'A',
  },
  {
    original: 'Piece of cake!',
    steps: ['🇨🇳 一块蛋糕！', '🇪🇸 ¡Un pedazo de pastel!', '🇷🇺 Кусок торта!'],
    final: 'A slice of cake!',
    why: 'The "easy" meaning was lost — AI just translated the food words!',
    whyC: 'Polysemy resolution failure — the model selected the food sense of "piece of cake" rather than the idiomatic "easy" sense.',
    band: 'A',
  },
  {
    original: 'I have butterflies in my stomach',
    steps: ['🇩🇪 Schmetterlinge im Bauch', '🇯🇵 お腹に蝶がいる', '🇫🇷 Des papillons dans le ventre'],
    final: 'There are butterflies living in my belly!',
    why: 'The "nervous" feeling became literal butterflies! Emotions are hard to translate.',
    whyC: 'Somatic metaphors for emotions vary cross-linguistically. German preserves this idiom, but re-translation through Japanese literalizes it.',
    band: 'B',
  },
  {
    original: 'The early bird catches the worm',
    steps: ['🇨🇳 早起的鸟儿有虫吃', '🇮🇹 L\'uccello mattiniero prende il verme', '🇩🇪 Der frühe Vogel fängt den Wurm'],
    final: 'The morning bird takes the worm!',
    why: 'The proverb\'s wisdom about working hard was lost — only the bird and worm survived!',
    whyC: 'Proverbial expressions encode cultural knowledge that isn\'t preserved by compositional translation. The moral is lost in favor of literal content.',
    band: 'B',
  },
  {
    original: 'Let the cat out of the bag',
    steps: ['🇪🇸 Dejar salir al gato de la bolsa', '🇯🇵 袋から猫を出す', '🇫🇷 Laisser sortir le chat du sac'],
    final: 'Release the cat from the bag!',
    why: 'The secret-revealing meaning became a literal cat rescue! Context matters.',
    whyC: 'Without pragmatic context, NMT models cannot disambiguate between literal and figurative interpretations of the same surface form.',
    band: 'C',
  },
  {
    original: 'Time flies like an arrow',
    steps: ['🇩🇪 Die Zeit fliegt wie ein Pfeil', '🇨🇳 时间像箭一样飞', '🇪🇸 El tiempo vuela como una flecha'],
    final: 'Time flies like an arrow!',
    why: 'This one stayed close! Simple metaphors with clear structure translate better.',
    whyC: 'Transparent metaphors with direct structural analogs across languages preserve meaning through translation chains more reliably.',
    band: 'C',
  },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function LostInTranslationGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(-1);

  const rounds = useMemo(() => ALL_ROUNDS.filter(r => BAND_ORDER[r.band] <= BAND_ORDER[ageBand]), [ageBand]);

  // Initialize game store
  useEffect(() => { game.startGame("lost-in-translation", rounds.length); }, [rounds.length]);

  const round = rounds[idx];
  const allRevealed = step >= round?.steps.length;

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function reveal() {
    if (allRevealed) {
      game.updateScore(10);
      if (idx < rounds.length - 1) { setIdx(i => i + 1); setStep(-1); game.advanceRound(); }
      else game.completeGame();
    } else { setStep(s => s + 1); }
  }

  return (
    <GameShell gameId="lost-in-translation" title="Lost in Translation" worldNumber={8} worldColor="#818CF8">
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
                    <span className="text-5xl">🌍</span>
                    <h2 className="font-display text-2xl font-bold text-white">Lost in Translation</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Observe how neural machine translation degrades meaning through multi-hop translation chains. Analyze why idioms fail.'
                        : 'Watch what happens when a phrase gets translated through multiple languages and back!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Translation', 'Idioms', 'Language'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-body text-[10px] text-indigo-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Translating! <Languages className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ PLAY ═══ */}
                {phase === 'play' && round && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    <p className="font-body text-xs text-white/20 text-center mb-3">{idx + 1}/{rounds.length}</p>

                    {/* Original */}
                    <div className="rounded-xl p-4 mb-3 border border-indigo-500/20 bg-indigo-500/5 text-center">
                      <p className="font-body text-[10px] text-white/30">🇬🇧 Original</p>
                      <p className="font-display text-base font-bold text-white">"{round.original}"</p>
                    </div>

                    {/* Translation steps */}
                    <div className="space-y-2 mb-3">
                      {round.steps.map((s, i) => (
                        <motion.div key={i} className={`p-3 rounded-xl border text-center transition-all ${i <= step ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-white/5 bg-white/[0.02]'}`}
                          animate={{ opacity: i <= step ? 1 : 0.2 }}>
                          {i <= step && i > 0 && <ArrowDown className="w-3 h-3 text-indigo-500/30 mx-auto mb-1" />}
                          <p className="font-body text-sm text-white/70">{i <= step ? s : '???'}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Final result */}
                    {allRevealed && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl p-4 text-center border border-amber-500/30 bg-amber-500/5 mb-3">
                        <p className="font-body text-[10px] text-white/30">🇬🇧 Back to English:</p>
                        <p className="font-display text-base font-bold text-amber-400">"{round.final}"</p>
                        <p className="font-body text-[10px] text-white/30 mt-2">💡 {ageBand === 'C' ? round.whyC : round.why}</p>
                      </motion.div>
                    )}

                    <motion.button onClick={reveal}
                      aria-label={allRevealed ? (idx < rounds.length - 1 ? 'Next phrase' : 'Finish game') : 'Reveal next translation step'}
                      className="w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {allRevealed ? (idx < rounds.length - 1 ? 'Next Phrase →' : 'Finish!') : 'Reveal Next Translation →'}
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

---

## Game 4: `src/components/games/NeuronRelayGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// NEURON RELAY V2 — Lab 3 (Neural Networks)
// Toggle neurons on/off, adjust volume, hit target signal.
// Enhanced: chrome bezel, welcome phase, visual signal meter,
// neuron labels, age-band explanations, 8 puzzles.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Zap, BrainCircuit } from 'lucide-react';

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
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  // Initialize game store
  useEffect(() => { game.startGame("neuron-relay", PUZZLES.length); }, []);

  const [phase, setPhase] = useState<Phase>('welcome');
  const [pi, setPi] = useState(0);
  const p = PUZZLES[pi];
  const [neurons, setNeurons] = useState<Neuron[]>(() => Array.from({ length: p.n }, (_, i) => ({ id: i, on: false, vol: 50 })));
  const [result, setResult] = useState<'none' | 'pass' | 'fail'>('none');
  const [showHint, setShowHint] = useState(false);

  const signal = neurons.reduce((s, n) => s + (n.on ? n.vol * 0.2 : 0), 0);
  const inRange = signal >= p.target[0] && signal <= p.target[1];

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
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
    <GameShell gameId="neuron-relay" title="Neuron Relay" worldNumber={3} worldColor="#EC4899">
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

                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    <span className="text-5xl">🧠</span>
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

                {/* ═══ PLAY ═══ */}
                {phase === 'play' && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col w-full max-w-md">
                    <p className="font-body text-xs text-white/30 text-center mb-2">
                      {ageBand === 'C' ? `Puzzle ${pi + 1}/${PUZZLES.length} — Target output: [${p.target[0]}, ${p.target[1]}]`
                        : `Puzzle ${pi + 1}/${PUZZLES.length} — Hit the green zone!`}
                    </p>

                    {/* Target bar */}
                    <div className="h-4 rounded-full bg-white/5 mb-4 relative overflow-hidden">
                      <div className="absolute h-full bg-pink-500/15 rounded-full"
                        style={{ left: `${p.target[0]}%`, width: `${p.target[1] - p.target[0]}%` }} />
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
                            {n.on ? '⚡' : '⚪'}
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
                        {result === 'pass' ? '✅' : result === 'fail' ? '❌' : '🎯'}
                      </motion.div>
                    </div>

                    <p className="font-mono text-sm text-center mb-3">
                      Signal: <span className={`font-bold ${inRange ? 'text-green-400' : 'text-white/60'}`}>{signal.toFixed(1)}</span>
                      <span className="text-white/20"> / {p.target[0]}–{p.target[1]}</span>
                    </p>

                    {showHint && (
                      <p className="font-body text-[10px] text-pink-300/50 text-center mb-2">💡 {p.hint}</p>
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
```
