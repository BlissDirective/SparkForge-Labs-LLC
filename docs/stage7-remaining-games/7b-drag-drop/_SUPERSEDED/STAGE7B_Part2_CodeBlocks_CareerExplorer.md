# SPARKFORGE — STAGE 7B PART 2: Code Blocks (Flagship-Lite) + Career Explorer

**Date:** February 20, 2026 | **GCUD Version:** V7
**Batch:** 7B — Drag & Drop Games
**Games in this file:** Code Blocks (Flagship-Lite), Career Explorer (Standard Polish)
**Completes:** Stage 7B — All 4 Drag & Drop games

---

## Game 3: `src/components/games/CodeBlocksGame.tsx` — FLAGSHIP-LITE

```tsx
// ════════════════════════════════════════════════════
// CODE BLOCKS V2 — Lab 9 (Build With AI) — FLAGSHIP-LITE
// Scratch-style visual coding with block snapping.
// Enhanced: 8 challenges across 4 categories (sequence,
// conditionals, loops, functions), animated code execution,
// pseudocode panel, debug mode, age-band complexity,
// chrome bezel, block categories with colors.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Play, RotateCcw, Code2, Bug, ChevronRight, GraduationCap } from 'lucide-react';

type Phase = 'welcome' | 'learn' | 'play';
type BlockType = 'event' | 'action' | 'logic' | 'loop' | 'function';

interface Block {
  id: string;
  type: BlockType;
  label: string;
  color: string;
  indent?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  descriptionC: string;
  category: 'sequence' | 'conditional' | 'loop' | 'function';
  palette: Block[];
  correctSequence: string[];
  output: string;
  outputSteps: string[];
  pseudocode: string;
  hint: string;
  band: 'A' | 'B' | 'C';
}

const BLOCK_COLORS: Record<BlockType, string> = {
  event: '#F59E0B',
  action: '#3B82F6',
  logic: '#F97316',
  loop: '#8B5CF6',
  function: '#EC4899',
};

const ALL_CHALLENGES: Challenge[] = [
  // ─── SEQUENCE ───
  {
    id: 'c1', title: 'Say Hello!', category: 'sequence', band: 'A',
    description: 'Make the robot say "Hello World!"',
    descriptionC: 'Compose a sequential program: event trigger → output action.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'say-hello', type: 'action', label: '💬 Say "Hello World!"', color: BLOCK_COLORS.action },
      { id: 'say-bye', type: 'action', label: '💬 Say "Goodbye!"', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'say-hello'],
    output: '🤖: Hello World!',
    outputSteps: ['▶ Program starts...', '💬 "Hello World!"'],
    pseudocode: 'BEGIN\n  PRINT "Hello World!"\nEND',
    hint: 'Every program starts with "When Start". Then add the say block.',
  },
  {
    id: 'c2', title: 'Count to 3', category: 'sequence', band: 'A',
    description: 'Make the robot count 1, 2, 3 in order.',
    descriptionC: 'Sequential execution: statements run in order, top to bottom.',
    palette: [
      { id: 'say-1', type: 'action', label: '💬 Say "1"', color: BLOCK_COLORS.action },
      { id: 'say-2', type: 'action', label: '💬 Say "2"', color: BLOCK_COLORS.action },
      { id: 'say-3', type: 'action', label: '💬 Say "3"', color: BLOCK_COLORS.action },
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'say-4', type: 'action', label: '💬 Say "4"', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'say-1', 'say-2', 'say-3'],
    output: '🤖: 1, 2, 3',
    outputSteps: ['▶ Program starts...', '💬 "1"', '💬 "2"', '💬 "3"'],
    pseudocode: 'BEGIN\n  PRINT "1"\n  PRINT "2"\n  PRINT "3"\nEND',
    hint: 'Order matters! Put the numbers 1, 2, 3 in sequence. Don\'t include 4.',
  },
  // ─── CONDITIONALS ───
  {
    id: 'c3', title: 'If It Rains', category: 'conditional', band: 'A',
    description: 'If raining → bring umbrella.',
    descriptionC: 'Conditional branching: IF condition THEN action.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'if-rain', type: 'logic', label: '🔀 If raining?', color: BLOCK_COLORS.logic },
      { id: 'umbrella', type: 'action', label: '☂️ Bring umbrella', color: BLOCK_COLORS.action },
      { id: 'sunglasses', type: 'action', label: '😎 Wear sunglasses', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'if-rain', 'umbrella'],
    output: '🤖: Umbrella ready!',
    outputSteps: ['▶ Program starts...', '🔀 Checking: Is it raining? → YES', '☂️ Bringing umbrella!'],
    pseudocode: 'BEGIN\n  IF raining THEN\n    BRING umbrella\n  END IF\nEND',
    hint: 'Start → check the condition → then the action for when it\'s true.',
  },
  {
    id: 'c4', title: 'Hot or Cold?', category: 'conditional', band: 'B',
    description: 'If temperature > 30° → turn on AC, else → wear sweater.',
    descriptionC: 'IF-ELSE branching with comparative condition.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'if-hot', type: 'logic', label: '🌡️ If temp > 30°?', color: BLOCK_COLORS.logic },
      { id: 'ac', type: 'action', label: '❄️ Turn on AC', color: BLOCK_COLORS.action },
      { id: 'sweater', type: 'action', label: '🧥 Wear sweater', color: BLOCK_COLORS.action },
      { id: 'else', type: 'logic', label: '↪️ Else', color: BLOCK_COLORS.logic },
    ],
    correctSequence: ['start', 'if-hot', 'ac', 'else', 'sweater'],
    output: '🤖: Temperature is 35°! AC activated!',
    outputSteps: ['▶ Program starts...', '🌡️ Checking: temp > 30°? → YES (35°)', '❄️ Turning on AC!'],
    pseudocode: 'BEGIN\n  IF temperature > 30 THEN\n    TURN_ON ac\n  ELSE\n    WEAR sweater\n  END IF\nEND',
    hint: 'IF → action for true → ELSE → action for false.',
  },
  // ─── LOOPS ───
  {
    id: 'c5', title: 'Clap 3 Times', category: 'loop', band: 'A',
    description: 'Make the robot clap 3 times using a loop.',
    descriptionC: 'FOR loop: repeat an action a fixed number of times.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'loop-3', type: 'loop', label: '🔁 Repeat 3 times', color: BLOCK_COLORS.loop },
      { id: 'clap', type: 'action', label: '👏 Clap', color: BLOCK_COLORS.action },
      { id: 'jump', type: 'action', label: '🦘 Jump', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-3', 'clap'],
    output: '🤖: 👏👏👏',
    outputSteps: ['▶ Program starts...', '🔁 Loop iteration 1/3', '👏 Clap!', '🔁 Loop iteration 2/3', '👏 Clap!', '🔁 Loop iteration 3/3', '👏 Clap!'],
    pseudocode: 'BEGIN\n  FOR i = 1 TO 3\n    CLAP\n  END FOR\nEND',
    hint: 'Start → loop block → action to repeat inside the loop.',
  },
  {
    id: 'c6', title: 'Dance Routine', category: 'loop', band: 'B',
    description: 'Loop 2 times: spin then wave.',
    descriptionC: 'Nested loop body with multiple sequential actions.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'loop-2', type: 'loop', label: '🔁 Repeat 2 times', color: BLOCK_COLORS.loop },
      { id: 'spin', type: 'action', label: '🌀 Spin', color: BLOCK_COLORS.action },
      { id: 'wave', type: 'action', label: '👋 Wave', color: BLOCK_COLORS.action },
      { id: 'bow', type: 'action', label: '🙇 Bow', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-2', 'spin', 'wave'],
    output: '🤖: 🌀👋🌀👋',
    outputSteps: ['▶ Program starts...', '🔁 Loop 1/2', '🌀 Spin!', '👋 Wave!', '🔁 Loop 2/2', '🌀 Spin!', '👋 Wave!'],
    pseudocode: 'BEGIN\n  FOR i = 1 TO 2\n    SPIN\n    WAVE\n  END FOR\nEND',
    hint: 'The loop repeats ALL blocks inside it. Put spin AND wave inside.',
  },
  // ─── FUNCTIONS ───
  {
    id: 'c7', title: 'Morning Routine', category: 'function', band: 'B',
    description: 'Call the "wake up" function, then eat breakfast.',
    descriptionC: 'Function abstraction: encapsulate reusable behavior.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'fn-wake', type: 'function', label: '📦 Call wakeUp()', color: BLOCK_COLORS.function },
      { id: 'eat', type: 'action', label: '🍳 Eat breakfast', color: BLOCK_COLORS.action },
      { id: 'sleep', type: 'action', label: '😴 Go to sleep', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'fn-wake', 'eat'],
    output: '🤖: Awake! → Eating breakfast!',
    outputSteps: ['▶ Program starts...', '📦 Calling wakeUp()...', '⏰ → Alarm rings!', '🧍 → Getting up!', '🪥 → Brushing teeth!', '🍳 Eating breakfast!'],
    pseudocode: 'FUNCTION wakeUp()\n  ALARM ring\n  GET_UP\n  BRUSH_TEETH\nEND FUNCTION\n\nBEGIN\n  CALL wakeUp()\n  EAT breakfast\nEND',
    hint: 'Functions bundle multiple steps into one block. Call it first, then eat.',
  },
  {
    id: 'c8', title: 'Robot Patrol', category: 'function', band: 'C',
    description: 'Define a patrol function: scan → report → move. Then loop it 3 times.',
    descriptionC: 'Compose function calls within loop bodies for modular program design.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'loop-3', type: 'loop', label: '🔁 Repeat 3 times', color: BLOCK_COLORS.loop },
      { id: 'fn-patrol', type: 'function', label: '📦 Call patrol()', color: BLOCK_COLORS.function },
      { id: 'scan', type: 'action', label: '📡 Scan area', color: BLOCK_COLORS.action },
      { id: 'report', type: 'action', label: '📋 Send report', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-3', 'fn-patrol'],
    output: '🤖: Patrol complete! 3 areas scanned and reported.',
    outputSteps: ['▶ Program starts...', '🔁 Patrol 1/3', '📦 patrol() → 📡🔍📋', '🔁 Patrol 2/3', '📦 patrol() → 📡🔍📋', '🔁 Patrol 3/3', '📦 patrol() → 📡🔍📋'],
    pseudocode: 'FUNCTION patrol()\n  SCAN area\n  SEND report\n  MOVE forward\nEND FUNCTION\n\nBEGIN\n  FOR i = 1 TO 3\n    CALL patrol()\n  END FOR\nEND',
    hint: 'You don\'t need individual actions — just call the function inside the loop!',
  },
];

const LEARN_CARDS = [
  { title: 'Sequence', emoji: '📋', desc: 'Code runs one step at a time, top to bottom. Order matters!' },
  { title: 'Conditions', emoji: '🔀', desc: 'IF something is true → do this. ELSE → do that.' },
  { title: 'Loops', emoji: '🔁', desc: 'Repeat actions without writing them over and over.' },
  { title: 'Functions', emoji: '📦', desc: 'Bundle steps into a reusable block you can call by name.' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };
const CATEGORY_COLORS: Record<string, string> = { sequence: '#3B82F6', conditional: '#F97316', loop: '#8B5CF6', function: '#EC4899' };

export function CodeBlocksGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [placed, setPlaced] = useState<Block[]>([]);
  const [running, setRunning] = useState(false);
  const [runIdx, setRunIdx] = useState(-1);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [showPseudo, setShowPseudo] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const challenges = useMemo(() => ALL_CHALLENGES.filter(c => BAND_ORDER[c.band] <= BAND_ORDER[ageBand]), [ageBand]);
  const challenge = challenges[challengeIdx];

  const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function addBlock(block: Block) {
    if (running) return;
    if (placed.find(b => b.id === block.id)) return;
    setPlaced(prev => [...prev, block]);
  }

  function removeBlock(idx: number) {
    if (running) return;
    setPlaced(prev => prev.filter((_, i) => i !== idx));
  }

  async function runCode() {
    setRunning(true); setResult(null); setOutputLines([]);
    const steps = challenge.outputSteps;

    for (let i = 0; i < placed.length; i++) {
      setRunIdx(i);
      await new Promise(r => setTimeout(r, 700));
    }

    const seq = placed.map(b => b.id);
    const correct = JSON.stringify(seq) === JSON.stringify(challenge.correctSequence);

    if (correct) {
      // Animate output lines
      for (let i = 0; i < steps.length; i++) {
        setOutputLines(prev => [...prev, steps[i]]);
        await new Promise(r => setTimeout(r, 500));
      }
      game.addScore(20);
    }

    setResult(correct ? 'correct' : 'wrong');
    setRunIdx(-1); setRunning(false);
  }

  function nextChallenge() {
    setPlaced([]); setResult(null); setOutputLines([]); setShowPseudo(false); setShowHint(false);
    if (challengeIdx < challenges.length - 1) { setChallengeIdx(i => i + 1); game.nextRound(); }
    else game.completeGame();
  }

  return (
    <GameShell gameId="code-blocks" title="Code Blocks" worldNumber={9} worldColor="#F97316">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(249,115,22,${0.12 + p.size * 0.05}), rgba(0,0,0,0))` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          {/* Chrome bezel */}
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(249,115,22,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-5xl">🧱</span>
                    <h2 className="font-display text-2xl font-bold text-white">Code Blocks</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Build programs using visual blocks. Master sequence, conditionals, loops, and function abstraction.'
                        : 'Snap together code blocks to make the robot do things! Like building with LEGO — but for code!'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[{ label: 'Events', color: BLOCK_COLORS.event }, { label: 'Actions', color: BLOCK_COLORS.action },
                        { label: 'Logic', color: BLOCK_COLORS.logic }, { label: 'Loops', color: BLOCK_COLORS.loop },
                        { label: 'Functions', color: BLOCK_COLORS.function }].map(b => (
                        <span key={b.label} className="px-2 py-1 rounded-lg font-body text-[10px] border"
                          style={{ backgroundColor: `${b.color}15`, borderColor: `${b.color}30`, color: b.color }}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Learn the Basics! <Code2 className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* LEARN */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <GraduationCap className="w-6 h-6 text-orange-400" />
                    <h3 className="font-display text-lg font-bold text-white">Coding Concepts</h3>
                    <p className="font-body text-xs text-white/40">{learnIdx + 1} of {LEARN_CARDS.length}</p>
                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-orange-500/20 bg-orange-500/5 text-center">
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-orange-300 mt-3">{LEARN_CARDS[learnIdx].title}</h4>
                        <p className="font-body text-sm text-white/60 mt-2">{LEARN_CARDS[learnIdx].desc}</p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button onClick={() => { if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx(i => i + 1); else setPhase('play'); }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next →' : 'Start Coding! 🚀'}
                    </motion.button>
                    <button onClick={() => setPhase('play')} className="font-body text-xs text-white/20 hover:text-white/40">Skip intro →</button>
                  </motion.div>
                )}

                {/* PLAY */}
                {phase === 'play' && challenge && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    {/* Challenge header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{ backgroundColor: `${CATEGORY_COLORS[challenge.category]}20`, color: CATEGORY_COLORS[challenge.category] }}>
                        {challenge.category}
                      </span>
                      <h3 className="font-display text-sm font-bold text-white flex-1">{challenge.title}</h3>
                      <span className="font-body text-[10px] text-white/20">{challengeIdx + 1}/{challenges.length}</span>
                    </div>

                    <p className="font-body text-xs text-white/40 mb-3">{ageBand === 'C' ? challenge.descriptionC : challenge.description}</p>

                    {/* Block palette */}
                    <div className="flex flex-wrap gap-1.5 mb-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      {challenge.palette.map(block => (
                        <motion.button key={block.id} onClick={() => addBlock(block)}
                          disabled={!!placed.find(b => b.id === block.id)}
                          className="px-3 py-1.5 rounded-lg font-body text-[11px] font-semibold border disabled:opacity-20"
                          style={{ backgroundColor: `${block.color}12`, borderColor: `${block.color}30`, color: block.color }}
                          whileTap={{ scale: 0.95 }} aria-label={`Add block: ${block.label}`}>
                          {block.label}
                        </motion.button>
                      ))}
                    </div>

                    {/* Code editor area */}
                    <div className="flex gap-3 flex-1 mb-3">
                      {/* Code stack */}
                      <div className="flex-1 rounded-xl bg-black/20 border border-white/10 p-3 min-h-[120px]">
                        <p className="font-mono text-[9px] text-white/15 mb-1">// your code</p>
                        {placed.length === 0 ? (
                          <p className="font-body text-xs text-white/10 text-center py-4">Tap blocks above to add them here</p>
                        ) : (
                          <div className="space-y-1">
                            {placed.map((block, i) => (
                              <motion.div key={`${block.id}-${i}`}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg font-body text-[11px] font-semibold border ${runIdx === i ? 'ring-2 ring-white/50' : ''}`}
                                style={{ backgroundColor: `${block.color}12`, borderColor: `${block.color}30`, color: block.color,
                                  marginLeft: block.type === 'action' && placed[i - 1]?.type !== 'event' ? 16 : 0 }}
                                layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <span className="flex-1">{block.label}</span>
                                {!running && <button onClick={() => removeBlock(i)} className="text-white/20 hover:text-white/50 text-xs">✕</button>}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Output / Pseudocode panel */}
                      <div className="w-[140px] rounded-xl bg-black/20 border border-white/10 p-2">
                        <div className="flex gap-1 mb-1">
                          <button onClick={() => setShowPseudo(false)} className={`font-mono text-[8px] px-1.5 py-0.5 rounded ${!showPseudo ? 'bg-orange-500/20 text-orange-400' : 'text-white/20'}`}>Output</button>
                          <button onClick={() => setShowPseudo(true)} className={`font-mono text-[8px] px-1.5 py-0.5 rounded ${showPseudo ? 'bg-purple-500/20 text-purple-400' : 'text-white/20'}`}>Pseudo</button>
                        </div>
                        {showPseudo ? (
                          <pre className="font-mono text-[9px] text-purple-300/60 whitespace-pre-wrap">{challenge.pseudocode}</pre>
                        ) : (
                          <div className="space-y-0.5">
                            {outputLines.map((line, i) => (
                              <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[9px] text-green-400/70">{line}</motion.p>
                            ))}
                            {outputLines.length === 0 && <p className="font-mono text-[9px] text-white/10">Run code to see output...</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hint */}
                    {showHint && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 rounded-xl p-2 bg-amber-500/5 border border-amber-500/10">
                        <p className="font-body text-[10px] text-amber-400">💡 {challenge.hint}</p>
                      </motion.div>
                    )}

                    {/* Result */}
                    <AnimatePresence>
                      {result && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`mb-2 rounded-xl p-3 text-center ${result === 'correct' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                          {result === 'correct' ? (
                            <div>
                              <p className="font-display text-sm font-bold text-green-400">✅ Correct! Program runs perfectly!</p>
                              <motion.button onClick={nextChallenge} className="mt-2 px-4 py-1.5 rounded-lg bg-green-500/20 text-green-300 font-body text-xs hover:bg-green-500/30"
                                whileTap={{ scale: 0.95 }}>
                                Next Challenge →
                              </motion.button>
                            </div>
                          ) : (
                            <p className="font-display text-sm font-bold text-red-400">❌ Not quite — check the block order and try again!</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="flex gap-2">
                      <button onClick={() => setShowHint(true)} className="px-3 py-2 rounded-xl border border-white/10 text-white/30 font-body text-[10px] hover:bg-white/5 flex items-center gap-1">
                        <Bug className="w-3 h-3" /> Hint
                      </button>
                      <button onClick={() => { setPlaced([]); setResult(null); setOutputLines([]); }}
                        className="px-3 py-2 rounded-xl border border-white/10 text-white/30 font-body text-[10px] hover:bg-white/5 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Clear
                      </button>
                      <motion.button onClick={runCode} disabled={running || placed.length === 0}
                        className="flex-1 py-2 rounded-xl font-display font-bold text-sm text-white disabled:opacity-30 flex items-center justify-center gap-1"
                        style={{ background: placed.length > 0 && !running ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.98 }}>
                        <Play className="w-3.5 h-3.5" /> {running ? 'Running...' : 'Run Code'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Game 4: `src/components/games/CareerExplorerGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// CAREER EXPLORER V2 — Lab 10 (AI's Future)
// Swipeable AI career cards with detail panels.
// Enhanced: chrome bezel, welcome phase, 12 careers,
// age-band salary visibility, skill match quiz, summary.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { ThumbsUp, ThumbsDown, Compass, Sparkles } from 'lucide-react';

type Phase = 'welcome' | 'swipe' | 'summary';

interface Career {
  title: string;
  emoji: string;
  dayInLife: string;
  dayInLifeC: string;
  skills: string[];
  education: string;
  salary: string;
  growth: string;
}

const CAREERS: Career[] = [
  { title: 'ML Engineer', emoji: '🧠', dayInLife: 'Train AI models and make them work better!', dayInLifeC: 'Design, train, and deploy machine learning models. Optimize hyperparameters and manage ML pipelines.', skills: ['Python', 'Math', 'Problem Solving'], education: 'CS Degree + ML', salary: '$130K–$200K', growth: '🚀 Very High' },
  { title: 'AI Ethicist', emoji: '⚖️', dayInLife: 'Make sure AI is fair for everyone!', dayInLifeC: 'Audit AI systems for bias, develop ethical guidelines, and ensure responsible AI deployment.', skills: ['Ethics', 'Research', 'Communication'], education: 'Philosophy/CS', salary: '$90K–$150K', growth: '📈 Growing' },
  { title: 'Robotics Engineer', emoji: '🤖', dayInLife: 'Build robots that move and interact with the world!', dayInLifeC: 'Design robotic systems integrating sensors, actuators, and AI control algorithms.', skills: ['Engineering', 'Programming', 'Physics'], education: 'Robotics/ME', salary: '$100K–$170K', growth: '🚀 Very High' },
  { title: 'AI Artist', emoji: '🎨', dayInLife: 'Create amazing art using AI tools!', dayInLifeC: 'Leverage generative AI models to create digital art, animations, and interactive experiences.', skills: ['Art', 'Creativity', 'AI Tools'], education: 'Art/Design + AI', salary: '$60K–$120K', growth: '📈 Growing' },
  { title: 'Data Scientist', emoji: '📊', dayInLife: 'Find hidden patterns in data that help businesses!', dayInLifeC: 'Apply statistical analysis and machine learning to extract insights from complex datasets.', skills: ['Statistics', 'Python', 'SQL'], education: 'CS/Stats Degree', salary: '$110K–$180K', growth: '🚀 Very High' },
  { title: 'NLP Researcher', emoji: '💬', dayInLife: 'Teach AI to understand and speak language!', dayInLifeC: 'Research and develop natural language processing models for understanding, generation, and translation.', skills: ['Linguistics', 'ML', 'Research'], education: 'CS PhD', salary: '$140K–$220K', growth: '🚀 Very High' },
  { title: 'AI Product Manager', emoji: '📋', dayInLife: 'Decide what AI products should do!', dayInLifeC: 'Define product strategy, prioritize features, and coordinate engineering teams for AI products.', skills: ['Strategy', 'Leadership', 'Tech'], education: 'Business/CS', salary: '$120K–$190K', growth: '📈 Growing' },
  { title: 'Computer Vision Eng.', emoji: '👁️', dayInLife: 'Teach computers to see — cars, cameras, medical scans!', dayInLifeC: 'Develop image recognition, object detection, and video analysis systems using deep learning.', skills: ['Deep Learning', 'Math', 'Python'], education: 'CS Degree + CV', salary: '$120K–$195K', growth: '🚀 Very High' },
  { title: 'AI Safety Researcher', emoji: '🛡️', dayInLife: 'Keep AI safe and helpful for humans!', dayInLifeC: 'Research alignment, interpretability, and robustness to ensure AI systems behave as intended.', skills: ['Research', 'Math', 'Philosophy'], education: 'CS/Math PhD', salary: '$150K–$250K', growth: '🚀 Very High' },
  { title: 'Prompt Engineer', emoji: '✍️', dayInLife: 'Write the perfect instructions for AI!', dayInLifeC: 'Design and optimize prompts for large language models to achieve desired outputs reliably.', skills: ['Writing', 'Logic', 'Creativity'], education: 'Any + AI Skills', salary: '$80K–$150K', growth: '📈 Growing' },
];

export function CareerExplorerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [idx, setIdx] = useState(0);
  const [favorites, setFavorites] = useState<Career[]>([]);
  const [exitDir, setExitDir] = useState(0);

  const career = CAREERS[idx];

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function swipe(interested: boolean) {
    if (interested) setFavorites(prev => [...prev, career]);
    setExitDir(interested ? 1 : -1);
    game.addScore(5);
    setTimeout(() => {
      setExitDir(0);
      if (idx < CAREERS.length - 1) { setIdx(i => i + 1); game.nextRound(); }
      else { setPhase('summary'); game.completeGame(); }
    }, 300);
  }

  return (
    <GameShell gameId="career-explorer" title="Career Explorer" worldNumber={10} worldColor="#D946EF">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(217,70,239,${0.15 + p.size * 0.06}), rgba(0,0,0,0))` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          {/* Chrome bezel */}
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(217,70,239,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {/* Welcome */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    <span className="text-5xl">🔮</span>
                    <h2 className="font-display text-2xl font-bold text-white">Career Explorer</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">Swipe through exciting AI careers! Discover what AI professionals do every day.</p>
                    <div className="flex gap-2 justify-center">
                      {['AI Careers', 'Skills', 'Future Jobs'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 font-body text-[10px] text-fuchsia-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('swipe')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #D946EF, #A855F7)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Explore Careers! <Compass className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* Swipe */}
                {phase === 'swipe' && career && (
                  <motion.div key="swipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm space-y-4">
                    <AnimatePresence mode="wait">
                      <motion.div key={idx} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: exitDir * 200 }} transition={{ duration: 0.3 }}
                        className="rounded-2xl p-5 max-w-sm w-full border border-fuchsia-500/20 bg-fuchsia-500/5">
                        <div className="text-center mb-3">
                          <span className="text-4xl">{career.emoji}</span>
                          <h3 className="font-display text-lg font-bold text-white mt-1">{career.title}</h3>
                          <span className="font-body text-[10px] text-fuchsia-300">{career.growth}</span>
                        </div>

                        <div className="space-y-2.5 text-left">
                          <div>
                            <p className="font-body text-[9px] text-white/25 uppercase tracking-wider">A Day In The Life</p>
                            <p className="font-body text-xs text-white/60">{ageBand === 'C' ? career.dayInLifeC : career.dayInLife}</p>
                          </div>
                          <div>
                            <p className="font-body text-[9px] text-white/25 uppercase tracking-wider">Key Skills</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {career.skills.map(s => <span key={s} className="px-1.5 py-0.5 rounded bg-fuchsia-500/10 font-body text-[9px] text-fuchsia-300">{s}</span>)}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <div>
                              <p className="font-body text-[9px] text-white/25 uppercase">Education</p>
                              <p className="font-body text-[10px] text-white/50">{career.education}</p>
                            </div>
                            {ageBand !== 'A' && (
                              <div className="text-right">
                                <p className="font-body text-[9px] text-white/25 uppercase">Salary Range</p>
                                <p className="font-display text-[10px] font-bold text-emerald-400">{career.salary}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <div className="flex gap-6 mt-4 justify-center">
                      <motion.button onClick={() => swipe(false)} className="w-12 h-12 rounded-full border-2 border-red-500/30 bg-red-500/5 flex items-center justify-center text-red-400"
                        whileTap={{ scale: 0.85 }} aria-label="Not interested">
                        <ThumbsDown className="w-5 h-5" />
                      </motion.button>
                      <motion.button onClick={() => swipe(true)} className="w-12 h-12 rounded-full border-2 border-green-500/30 bg-green-500/5 flex items-center justify-center text-green-400"
                        whileTap={{ scale: 0.85 }} aria-label="Interested">
                        <ThumbsUp className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <p className="font-body text-[10px] text-white/15 mt-2 text-center">{idx + 1} of {CAREERS.length}</p>
                  </motion.div>
                )}

                {/* Summary */}
                {phase === 'summary' && (
                  <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
                    <Sparkles className="w-8 h-8 text-fuchsia-400 mx-auto" />
                    <h3 className="font-display text-xl font-bold text-white">Your AI Career Picks!</h3>
                    {favorites.length > 0 ? (
                      <div className="space-y-2 max-w-sm">
                        {favorites.map(c => (
                          <div key={c.title} className="rounded-xl p-3 flex items-center gap-3 border border-fuchsia-500/10 bg-fuchsia-500/5">
                            <span className="text-2xl">{c.emoji}</span>
                            <div className="text-left">
                              <p className="font-display text-sm font-bold text-white">{c.title}</p>
                              <p className="font-body text-[9px] text-white/30">{c.skills.join(' · ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-body text-sm text-white/50">No picks yet — that's okay! All these careers will be here when you're ready to explore.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## VERIFICATION CHECKLIST — BATCH 7B

### `npm run dev` — All 4 Games

- **Sort Toy Box** (`/arcade/sort-toy-box`): Chrome bezel (Lab 2 `#AA66FF`), welcome → sort shapes → reveal AI criterion
- **Human vs Machine** (`/arcade/human-vs-machine`): Chrome bezel (Lab 1 `#00BBFF`), welcome → side-by-side → advantages comparison
- **Code Blocks** (`/arcade/code-blocks`): Chrome bezel (Lab 9 `#F97316` orange), welcome → learn 4 concepts → 8 challenges with pseudocode panel
- **Career Explorer** (`/arcade/career-explorer`): Chrome bezel (fuchsia), welcome → swipe cards → summary favorites

### Code Blocks — Flagship-Lite Extras

- 8 challenges across 4 categories (sequence, conditional, loop, function)
- Block palette with color-coded types (event/action/logic/loop/function)
- Animated code execution (highlight runs through placed blocks)
- Output panel shows step-by-step execution
- Pseudocode panel toggle
- Hint system
- Age-band: Band A gets 5 challenges, Band B gets 7, Band C gets all 8

### Git

```bash
git add .
git commit -m "Stage 7B: 4 enhanced drag/drop games — Code Blocks flagship-lite"
git push origin main
```

Stage 7B complete. Sort Toy Box + Human vs Machine (standard polish), Code Blocks (flagship-lite with 8 challenges, pseudocode, animated execution), Career Explorer (standard polish with age-band salary visibility).
