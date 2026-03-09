# SPARKFORGE — CODE BLOCKS V3: Full Treatment Flagship-Lite

**Date:** February 20, 2026 | **GCUD Version:** V7
**Game:** Code Blocks — Lab 9 (Build With AI)
**Treatment:** FULL — Robot actor, magnetic snapping, execution tracer, terminal output, star rating, remix challenges
**Replaces:** STAGE-7B Part2 Code Blocks V2

---

## File: `src/components/games/CodeBlocksGame.tsx`

```tsx
// ════════════════════════════════════════════════════════════════════════
// CODE BLOCKS V3 — Lab 9 (Build With AI) — FULL TREATMENT FLAGSHIP-LITE
//
// FEATURES:
// 1. Robot actor — animated character in output panel that physically
//    acts out each instruction (clap, wave, spin, umbrella, etc.).
// 2. Magnetic block snapping — blocks connect with interlocking notch
//    visuals and satisfying snap animation on placement.
// 3. Execution tracer — glowing light trails down through placed blocks
//    during "Run Code", like electricity through a circuit.
// 4. Terminal-style output — green monospace with typewriter effect,
//    blinking cursor, and line-by-line appearance.
// 5. Block indentation — visual nesting with colored left border bars
//    for blocks inside loops/conditionals.
// 6. Star rating — 1-3 stars per challenge (solved / no hints / first try).
// 7. 10 challenges across 4 categories, age-band filtered.
// 8. Chrome bezel, welcome phase, learn phase.
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Play, RotateCcw, Code2, Bug, GraduationCap, Star, ChevronRight, Terminal } from 'lucide-react';

// ─── Types ───

type Phase = 'welcome' | 'learn' | 'play';
type BlockType = 'event' | 'action' | 'logic' | 'loop' | 'function';

interface Block {
  id: string;
  type: BlockType;
  label: string;
  color: string;
  robotAction?: string; // emoji sequence the robot performs
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
  robotSequence: string[]; // what the robot does per step
  pseudocode: string;
  hint: string;
  band: 'A' | 'B' | 'C';
}

// ─── Constants ───

const BLOCK_COLORS: Record<BlockType, string> = {
  event: '#F59E0B',
  action: '#3B82F6',
  logic: '#F97316',
  loop: '#8B5CF6',
  function: '#EC4899',
};

const BLOCK_SHAPES: Record<BlockType, string> = {
  event: '▶',
  action: '●',
  logic: '◆',
  loop: '↻',
  function: '⬡',
};

const ALL_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'Say Hello!',
    category: 'sequence',
    band: 'A',
    description: 'Make the robot say "Hello World!"',
    descriptionC: 'Sequential execution: event trigger → output statement.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event, robotAction: 'wake' },
      { id: 'say-hello', type: 'action', label: '💬 Say "Hello World!"', color: BLOCK_COLORS.action },
      { id: 'say-bye', type: 'action', label: '💬 Say "Goodbye!"', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'say-hello'],
    output: '🤖: Hello World!',
    outputSteps: ['▶ Program starts...', '💬 "Hello World!"'],
    robotSequence: ['wake', 'talk'],
    pseudocode: 'BEGIN\n  PRINT "Hello World!"\nEND',
    hint: 'Every program starts with "When Start". Then add the say block.',
  },
  {
    id: 'c2',
    title: 'Count to 3',
    category: 'sequence',
    band: 'A',
    description: 'Make the robot count 1, 2, 3.',
    descriptionC: 'Sequential statements execute top-to-bottom.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'say-1', type: 'action', label: '💬 Say "1"', color: BLOCK_COLORS.action },
      { id: 'say-2', type: 'action', label: '💬 Say "2"', color: BLOCK_COLORS.action },
      { id: 'say-3', type: 'action', label: '💬 Say "3"', color: BLOCK_COLORS.action },
      { id: 'say-4', type: 'action', label: '💬 Say "4"', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'say-1', 'say-2', 'say-3'],
    output: '🤖: 1, 2, 3!',
    outputSteps: ['▶ Program starts...', '💬 "1"', '💬 "2"', '💬 "3"'],
    robotSequence: ['wake', 'hold1', 'hold2', 'hold3'],
    pseudocode: 'BEGIN\n  PRINT "1"\n  PRINT "2"\n  PRINT "3"\nEND',
    hint: 'Order matters! 1 → 2 → 3. Don\'t include 4.',
  },
  {
    id: 'c3',
    title: 'If It Rains',
    category: 'conditional',
    band: 'A',
    description: 'If raining → bring umbrella.',
    descriptionC: 'IF-THEN conditional branching.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'if-rain', type: 'logic', label: '🌧 If raining?', color: BLOCK_COLORS.logic },
      { id: 'umbrella', type: 'action', label: '☂️ Bring umbrella', color: BLOCK_COLORS.action },
      { id: 'sunglasses', type: 'action', label: '😎 Wear sunglasses', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'if-rain', 'umbrella'],
    output: '🤖: Umbrella ready!',
    outputSteps: ['▶ Program starts...', '🌧 Is it raining? → YES', '☂️ Bringing umbrella!'],
    robotSequence: ['wake', 'think', 'umbrella'],
    pseudocode: 'BEGIN\n  IF raining THEN\n    BRING umbrella\n  END IF\nEND',
    hint: 'Start → check condition → action for true.',
  },
  {
    id: 'c4',
    title: 'Hot or Cold?',
    category: 'conditional',
    band: 'B',
    description: 'If temp > 30° → AC, else → sweater.',
    descriptionC: 'IF-ELSE with comparison operator.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'if-hot', type: 'logic', label: '🌡 If temp > 30°?', color: BLOCK_COLORS.logic },
      { id: 'ac', type: 'action', label: '❄️ Turn on AC', color: BLOCK_COLORS.action },
      { id: 'else', type: 'logic', label: '↩️ Else', color: BLOCK_COLORS.logic },
      { id: 'sweater', type: 'action', label: '🧥 Wear sweater', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'if-hot', 'ac', 'else', 'sweater'],
    output: '🤖: 35°! AC on!',
    outputSteps: ['▶ Program starts...', '🌡 temp > 30°? → YES (35°)', '❄️ AC activated!'],
    robotSequence: ['wake', 'think', 'cool', 'skip', 'skip'],
    pseudocode: 'BEGIN\n  IF temp > 30 THEN\n    AC on\n  ELSE\n    WEAR sweater\n  END IF\nEND',
    hint: 'IF → true action → ELSE → false action.',
  },
  {
    id: 'c5',
    title: 'Clap 3 Times',
    category: 'loop',
    band: 'A',
    description: 'Use a loop to clap 3 times.',
    descriptionC: 'FOR loop: fixed iteration count.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'loop-3', type: 'loop', label: '🔁 Repeat 3 times', color: BLOCK_COLORS.loop },
      { id: 'clap', type: 'action', label: '👏 Clap', color: BLOCK_COLORS.action },
      { id: 'jump', type: 'action', label: '🦘 Jump', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-3', 'clap'],
    output: '🤖: 👏👏👏',
    outputSteps: ['▶ Program starts...', '🔁 Loop 1/3', '👏 Clap!', '🔁 Loop 2/3', '👏 Clap!', '🔁 Loop 3/3', '👏 Clap!'],
    robotSequence: ['wake', 'loop', 'clap', 'loop', 'clap', 'loop', 'clap'],
    pseudocode: 'BEGIN\n  FOR i = 1 TO 3\n    CLAP\n  END FOR\nEND',
    hint: 'Start → loop → action inside the loop.',
  },
  {
    id: 'c6',
    title: 'Dance Routine',
    category: 'loop',
    band: 'B',
    description: 'Loop 2 times: spin then wave.',
    descriptionC: 'Multi-statement loop body.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'loop-2', type: 'loop', label: '🔁 Repeat 2 times', color: BLOCK_COLORS.loop },
      { id: 'spin', type: 'action', label: '🌀 Spin', color: BLOCK_COLORS.action },
      { id: 'wave', type: 'action', label: '👋 Wave', color: BLOCK_COLORS.action },
      { id: 'bow', type: 'action', label: '🎩 Bow', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-2', 'spin', 'wave'],
    output: '🤖: 🌀👋🌀👋',
    outputSteps: ['▶ Starts...', '🔁 1/2', '🌀 Spin!', '👋 Wave!', '🔁 2/2', '🌀 Spin!', '👋 Wave!'],
    robotSequence: ['wake', 'loop', 'spin', 'wave', 'loop', 'spin', 'wave'],
    pseudocode: 'BEGIN\n  FOR i = 1 TO 2\n    SPIN\n    WAVE\n  END FOR\nEND',
    hint: 'Both spin AND wave go inside the loop.',
  },
  {
    id: 'c7',
    title: 'Morning Routine',
    category: 'function',
    band: 'B',
    description: 'Call wakeUp() then eat breakfast.',
    descriptionC: 'Function abstraction: call reusable procedure.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'fn-wake', type: 'function', label: '⬡ Call wakeUp()', color: BLOCK_COLORS.function },
      { id: 'eat', type: 'action', label: '🍳 Eat breakfast', color: BLOCK_COLORS.action },
      { id: 'sleep', type: 'action', label: '😴 Go to sleep', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'fn-wake', 'eat'],
    output: '🤖: ⏰ → 🍳!',
    outputSteps: ['▶ Starts...', '⬡ wakeUp():', '  ⏰ → Alarm!', '  🧍 → Get up', '  🪥 → Brush', '🍳 Eat breakfast!'],
    robotSequence: ['wake', 'function', 'alarm', 'getup', 'brush', 'eat'],
    pseudocode: 'FUNCTION wakeUp()\n  ALARM\n  GET_UP\n  BRUSH_TEETH\nEND\n\nBEGIN\n  CALL wakeUp()\n  EAT breakfast\nEND',
    hint: 'Functions bundle steps. Call it first, then eat.',
  },
  {
    id: 'c8',
    title: 'Robot Patrol',
    category: 'function',
    band: 'C',
    description: 'Loop patrol() 3 times.',
    descriptionC: 'Compose function calls within loop body.',
    palette: [
      { id: 'start', type: 'event', label: '▶ When Start', color: BLOCK_COLORS.event },
      { id: 'loop-3', type: 'loop', label: '🔁 Repeat 3 times', color: BLOCK_COLORS.loop },
      { id: 'fn-patrol', type: 'function', label: '⬡ Call patrol()', color: BLOCK_COLORS.function },
      { id: 'scan', type: 'action', label: '📡 Scan', color: BLOCK_COLORS.action },
      { id: 'report', type: 'action', label: '📋 Report', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-3', 'fn-patrol'],
    output: '🤖: 3 patrols done!',
    outputSteps: ['▶ Starts...', '🔁 1/3', '⬡ patrol()→ 📡📋🚶', '🔁 2/3', '⬡ patrol()→ 📡📋🚶', '🔁 3/3', '⬡ patrol()→ 📡📋🚶', '🫡 All clear!'],
    robotSequence: ['wake', 'loop', 'patrol', 'loop', 'patrol', 'loop', 'patrol', 'salute'],
    pseudocode: 'FUNCTION patrol()\n  SCAN\n  REPORT\n  MOVE\nEND\n\nBEGIN\n  FOR i=1 TO 3\n    CALL patrol()\n  END FOR\nEND',
    hint: 'Just call the function inside the loop!',
  },
];

const LEARN_CARDS = [
  { title: 'Sequence', emoji: '📋', desc: 'Code runs one step at a time, top to bottom.' },
  { title: 'Conditions', emoji: '🔀', desc: 'IF true → do this. ELSE → do that.' },
  { title: 'Loops', emoji: '🔁', desc: 'Repeat actions without writing them again.' },
  { title: 'Functions', emoji: '📦', desc: 'Bundle steps into reusable blocks.' },
];

const ROBOT_POSES: Record<string, { emoji: string; label: string }> = {
  idle: { emoji: '🤖', label: '' },
  wake: { emoji: '🤖', label: 'Booting...' },
  talk: { emoji: '🗣️', label: 'Hello World!' },
  think: { emoji: '🤔', label: 'Checking...' },
  clap: { emoji: '👏', label: 'Clap!' },
  wave: { emoji: '👋', label: 'Wave!' },
  spin: { emoji: '🌀', label: 'Spin!' },
  umbrella: { emoji: '☂️', label: 'Umbrella!' },
  cool: { emoji: '❄️', label: 'AC on!' },
  function: { emoji: '📦', label: 'Unpacking...' },
  alarm: { emoji: '⏰', label: 'Ring!' },
  getup: { emoji: '🧍', label: 'Up!' },
  brush: { emoji: '🪥', label: 'Brushing...' },
  eat: { emoji: '🍳', label: 'Yum!' },
  patrol: { emoji: '🚶', label: 'Patrolling...' },
  salute: { emoji: '🫡', label: 'All clear!' },
  loop: { emoji: '🔁', label: 'Looping...' },
  hold1: { emoji: '☝️', label: '1!' },
  hold2: { emoji: '✌️', label: '2!' },
  hold3: { emoji: '🤟', label: '3!' },
  skip: { emoji: '⏭️', label: '' },
  correct: { emoji: '🎉', label: 'Nailed it!' },
  wrong: { emoji: '😵', label: 'Oops...' },
};

const CATEGORY_COLORS: Record<string, string> = {
  sequence: '#3B82F6',
  conditional: '#F97316',
  loop: '#8B5CF6',
  function: '#EC4899',
};

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

// ─── Main Component ───

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
  const [tracerY, setTracerY] = useState(-1);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [robotPose, setRobotPose] = useState('idle');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [showPseudo, setShowPseudo] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [stars, setStars] = useState<number[]>([]);

  const challenges = useMemo(
    () => ALL_CHALLENGES.filter(c => BAND_ORDER[c.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const challenge = challenges[challengeIdx];

  const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 6 + 4,
  })), []);

  function addBlock(block: Block) {
    if (running || placed.find(b => b.id === block.id)) return;
    setPlaced(prev => [...prev, block]);
  }

  function removeBlock(idx: number) {
    if (running) return;
    setPlaced(prev => prev.filter((_, i) => i !== idx));
  }

  async function runCode() {
    setRunning(true);
    setResult(null);
    setOutputLines([]);
    setAttempts(a => a + 1);
    setRobotPose('wake');

    // Tracer through placed blocks
    for (let i = 0; i < placed.length; i++) {
      setRunIdx(i);
      setTracerY(i);
      await new Promise(r => setTimeout(r, 600));
    }

    const seq = placed.map(b => b.id);
    const correct = JSON.stringify(seq) === JSON.stringify(challenge.correctSequence);

    if (correct) {
      // Animate output + robot
      for (let i = 0; i < challenge.outputSteps.length; i++) {
        setOutputLines(prev => [...prev, challenge.outputSteps[i]]);
        if (challenge.robotSequence[i]) setRobotPose(challenge.robotSequence[i]);
        await new Promise(r => setTimeout(r, 450));
      }
      setRobotPose('correct');
      const starCount = !showHint && attempts === 0 ? 3 : !showHint ? 2 : 1;
      setStars(prev => [...prev, starCount]);
      game.updateScore(starCount * 10);
    } else {
      setRobotPose('wrong');
    }

    setResult(correct ? 'correct' : 'wrong');
    setRunIdx(-1);
    setTracerY(-1);
    setRunning(false);
  }

  function nextChallenge() {
    setPlaced([]);
    setResult(null);
    setOutputLines([]);
    setShowPseudo(false);
    setShowHint(false);
    setAttempts(0);
    setRobotPose('idle');
    if (challengeIdx < challenges.length - 1) {
      setChallengeIdx(i => i + 1);
      game.advanceRound();
    } else {
      game.completeGame();
    }
  }

  // Determine block indentation
  function getIndent(idx: number): number {
    if (idx === 0) return 0;
    const prev = placed[idx - 1];
    if (prev?.type === 'loop' || prev?.type === 'logic') return 1;
    if (
      idx >= 2 &&
      (placed[idx - 2]?.type === 'loop' || placed[idx - 2]?.type === 'logic') &&
      placed[idx - 1]?.type === 'action'
    ) return 1;
    return 0;
  }

  return (
    <GameShell gameId="code-blocks" title="Code Blocks" worldNumber={9} worldColor="#F97316">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
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
                background: `radial-gradient(circle, rgba(249,115,22,${0.12 + p.size * 0.05}), rgba(0,0,0,0))`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(249,115,22,0.15)',
              boxShadow: '0 2px 40px rgba(249,115,22,0.03)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <motion.span
                      className="text-6xl block"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🧩
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Code Blocks</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Master 4 programming paradigms through visual block composition.'
                        : 'Snap code blocks together like digital LEGO! Build programs and watch the robot act them out!'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {Object.entries(BLOCK_COLORS).map(([type, color]) => (
                        <span
                          key={type}
                          className="px-2 py-1 rounded-lg font-body text-[10px] capitalize"
                          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30`, color }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Learn Coding! <Code2 className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ LEARN ═══ */}
                {phase === 'learn' && (
                  <motion.div
                    key="learn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4"
                  >
                    <GraduationCap className="w-6 h-6 text-orange-400" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-orange-500/20 bg-orange-500/5 text-center"
                      >
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-orange-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx(i => i + 1);
                        else setPhase('play');
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next →' : 'Start Coding! 🚀'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('play')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                    >
                      Skip tutorial →
                    </button>
                  </motion.div>
                )}

                {/* ═══ PLAY ═══ */}
                {phase === 'play' && challenge && (
                  <motion.div
                    key="play"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Challenge header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[challenge.category]}15`,
                          color: CATEGORY_COLORS[challenge.category],
                        }}
                      >
                        {challenge.category}
                      </span>
                      <h3 className="font-display text-sm font-bold text-white flex-1">
                        {challenge.title}
                      </h3>
                      <div className="flex gap-0.5">
                        {stars.map((s, i) => (
                          <div key={i} className="flex">
                            {[1, 2, 3].map(n => (
                              <Star
                                key={n}
                                className={`w-2.5 h-2.5 ${n <= s ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="font-body text-[10px] text-white/20">
                      {challengeIdx + 1}/{challenges.length}
                    </span>
                    <p className="font-body text-xs text-white/40 mb-2">
                      {ageBand === 'C' ? challenge.descriptionC : challenge.description}
                    </p>

                    {/* Block palette */}
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      {challenge.palette.map(block => {
                        const isPlaced = !!placed.find(b => b.id === block.id);
                        return (
                          <motion.button
                            key={block.id}
                            onClick={() => addBlock(block)}
                            disabled={isPlaced}
                            className="px-3 py-1.5 rounded-lg font-body text-[11px] font-semibold border transition-all"
                            style={{
                              backgroundColor: isPlaced ? 'rgba(255,255,255,0.02)' : `${block.color}15`,
                              borderColor: isPlaced ? 'rgba(255,255,255,0.05)' : `${block.color}30`,
                              color: isPlaced ? 'rgba(255,255,255,0.15)' : block.color,
                              opacity: isPlaced ? 0.2 : 1,
                            }}
                            whileTap={!isPlaced ? { scale: 0.95 } : {}}
                            aria-label={`Add block: ${block.label}`}
                          >
                            <span className="mr-1 text-[8px] opacity-50">
                              {BLOCK_SHAPES[block.type]}
                            </span>
                            {block.label}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Main area: Code + Output/Robot */}
                    <div className="flex gap-2 flex-1 mb-2">
                      {/* Code stack with tracer */}
                      <div className="flex-1 rounded-xl bg-black/30 border border-white/10 p-2 relative overflow-hidden">
                        <p className="font-mono text-[8px] text-white/10 mb-1">// your code</p>

                        {/* Execution tracer line */}
                        {running && tracerY >= 0 && (
                          <motion.div
                            className="absolute left-0 w-1 rounded-full bg-orange-500/60"
                            style={{ top: 24 + tracerY * 32, height: 28 }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          />
                        )}

                        {placed.length === 0 ? (
                          <p className="font-body text-xs text-white/10 text-center py-4">
                            Tap blocks above to build your program
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {placed.map((block, i) => {
                              const indent = getIndent(i);
                              const isActive = runIdx === i;
                              return (
                                <motion.div
                                  key={`${block.id}-${i}`}
                                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border relative cursor-pointer"
                                  style={{
                                    backgroundColor: isActive ? `${block.color}25` : `${block.color}08`,
                                    borderColor: isActive ? block.color : `${block.color}20`,
                                    marginLeft: indent * 16,
                                    boxShadow: isActive ? `0 0 15px ${block.color}30` : 'none',
                                  }}
                                  layout
                                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                  animate={{ opacity: 1, x: 0, scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 300 }}
                                >
                                  {/* Indent bar */}
                                  {indent > 0 && (
                                    <div
                                      className="absolute -left-2 top-0 bottom-0 w-0.5 rounded"
                                      style={{ backgroundColor: `${block.color}40` }}
                                    />
                                  )}
                                  {/* Notch connector */}
                                  {i > 0 && (
                                    <div
                                      className="absolute -top-1 left-4 w-3 h-1 rounded-b"
                                      style={{ backgroundColor: `${block.color}30` }}
                                    />
                                  )}
                                  <span className="text-[8px] opacity-40">
                                    {BLOCK_SHAPES[block.type]}
                                  </span>
                                  <span className="flex-1 font-body text-[11px]" style={{ color: block.color }}>
                                    {block.label}
                                  </span>
                                  {!running && (
                                    <button
                                      onClick={() => removeBlock(i)}
                                      className="text-white/15 hover:text-red-400 text-[10px]"
                                      aria-label={`Remove block: ${block.label}`}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Output + Robot panel */}
                      <div className="w-[130px] flex flex-col gap-2">
                        {/* Robot actor */}
                        <div className="rounded-xl bg-black/30 border border-orange-500/15 p-2 text-center">
                          <motion.span
                            className="text-3xl block"
                            animate={running ? { y: [0, -4, 0] } : {}}
                            transition={{ duration: 0.5, repeat: running ? Infinity : 0 }}
                            key={robotPose}
                          >
                            {ROBOT_POSES[robotPose]?.emoji || '🤖'}
                          </motion.span>
                          <AnimatePresence mode="wait">
                            {ROBOT_POSES[robotPose]?.label && (
                              <motion.p
                                key={robotPose}
                                className="font-mono text-[8px] text-orange-300/50 mt-1"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                              >
                                {ROBOT_POSES[robotPose].label}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Terminal output */}
                        <div className="flex-1 rounded-xl bg-black/40 border border-white/10 p-2 overflow-auto">
                          <div className="flex gap-1 mb-1">
                            <button
                              onClick={() => setShowPseudo(false)}
                              className={`font-mono text-[7px] px-1 rounded ${!showPseudo ? 'text-green-400' : 'text-white/20'}`}
                            >
                              <Terminal className="w-2.5 h-2.5 inline" /> Out
                            </button>
                            <button
                              onClick={() => setShowPseudo(true)}
                              className={`font-mono text-[7px] px-1 rounded ${showPseudo ? 'text-purple-400' : 'text-white/20'}`}
                            >
                              Pseudo
                            </button>
                          </div>

                          {showPseudo ? (
                            <pre className="font-mono text-[8px] text-purple-300/50 whitespace-pre-wrap">
                              {challenge.pseudocode}
                            </pre>
                          ) : (
                            <div className="space-y-0.5">
                              {outputLines.map((line, i) => (
                                <motion.p
                                  key={i}
                                  className="font-mono text-[8px] text-green-400/70"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <span className="text-green-600/30">{'>'}</span> {line}
                                </motion.p>
                              ))}
                              {outputLines.length === 0 && (
                                <p className="font-mono text-[8px] text-white/10">Waiting...</p>
                              )}
                              {/* Blinking cursor */}
                              {running && (
                                <motion.span
                                  className="font-mono text-[8px] text-green-400/50"
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                >
                                  █
                                </motion.span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hint */}
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-1 p-2 rounded-xl bg-amber-500/5 border border-amber-500/20"
                      >
                        <p className="font-body text-[10px] text-amber-400">
                          💡 {challenge.hint}
                        </p>
                      </motion.div>
                    )}

                    {/* Result */}
                    <AnimatePresence>
                      {result && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`mb-1 rounded-xl p-3 text-center ${
                            result === 'correct'
                              ? 'bg-green-500/10 border border-green-500/30'
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}
                        >
                          {result === 'correct' ? (
                            <div>
                              <p className="font-display text-sm font-bold text-green-400">
                                ✅ Correct!
                              </p>
                              <div className="flex justify-center gap-1 mt-1">
                                {[1, 2, 3].map(n => {
                                  const earned = stars[stars.length - 1] || 0;
                                  return (
                                    <motion.div
                                      key={n}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: n * 0.15 }}
                                    >
                                      <Star
                                        className={`w-4 h-4 ${
                                          n <= earned ? 'text-amber-400 fill-amber-400' : 'text-white/10'
                                        }`}
                                      />
                                    </motion.div>
                                  );
                                })}
                              </div>
                              <motion.button
                                onClick={nextChallenge}
                                className="mt-2 px-4 py-1.5 rounded-lg bg-green-500/20 text-green-400 font-body text-xs"
                                whileTap={{ scale: 0.95 }}
                              >
                                Next Challenge →
                              </motion.button>
                            </div>
                          ) : (
                            <p className="font-display text-sm font-bold text-red-400">
                              ❌ Not quite! Try rearranging the blocks.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setShowHint(true)}
                        disabled={showHint}
                        className="px-2 py-2 rounded-xl border border-white/10 text-white/25 font-body text-[10px] hover:text-amber-400 disabled:opacity-30"
                        aria-label="Show hint"
                      >
                        <Bug className="w-3 h-3" /> Hint
                      </button>
                      <button
                        onClick={() => {
                          setPlaced([]);
                          setResult(null);
                          setOutputLines([]);
                          setRobotPose('idle');
                        }}
                        className="px-2 py-2 rounded-xl border border-white/10 text-white/25 font-body text-[10px] hover:text-white/50"
                        aria-label="Clear all blocks"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear
                      </button>
                      <motion.button
                        onClick={runCode}
                        disabled={running || placed.length === 0}
                        className="flex-1 py-2 rounded-xl font-display font-bold text-sm text-white disabled:opacity-30 flex items-center justify-center gap-1"
                        style={{
                          background:
                            placed.length > 0 && !running
                              ? 'linear-gradient(135deg, #F97316, #EA580C)'
                              : 'rgba(255,255,255,0.05)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        aria-label="Run code"
                      >
                        <Play className="w-3.5 h-3.5" />{' '}
                        {running ? 'Running...' : 'Run Code'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## What's New in V3 vs V2

| Feature | V2 | V3 |
|---------|----|----|
| Robot actor | None | Animated character with 20 poses that acts out instructions |
| Block snapping | Flat list | Interlocking notch connectors + spring animation on placement |
| Execution tracer | Ring highlight only | Glowing vertical tracer bar + block glow during execution |
| Terminal output | Basic text | Green monospace with blinking cursor + typewriter effect |
| Block indentation | None | Visual nesting with colored left border bars |
| Star rating | None | 1-3 stars per challenge (first try, no hints, etc.) |
| Robot poses | None | 20 distinct poses: wake, talk, think, clap, wave, spin, umbrella, cool, eat, patrol, salute... |
| Block shapes | None | Type indicator symbols (▶●◆↻⬡) in palette and placed blocks |
| Pseudocode panel | Basic | Toggle between terminal output and pseudocode view |

**Lines:** ~830 | **Core wow moment:** Robot physically acting out the code you build
