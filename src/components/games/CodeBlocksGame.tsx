// ================================================================
// CODE BLOCKS V3 — Lab 9 (Build With AI)
// FULL TREATMENT FLAGSHIP-LITE
//
// FEATURES:
// 1. Robot actor — animated character that acts out instructions
// 2. Magnetic block snapping — interlocking notch visuals
// 3. Execution tracer — glowing light trails through blocks
// 4. Terminal-style output — green monospace + typewriter
// 5. Block indentation — colored left border bars
// 6. Star rating — 1-3 stars per challenge
// 7. 10 challenges across 4 categories, age-band filtered
// 8. Chrome bezel, welcome phase, learn phase
// 9. Desktop: CodeBlocks3D for 3D visualization (Decision 6.5)
// ================================================================

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useGameContent } from '@/hooks/useContent';
import { useSceneStore } from '@/stores/sceneStore';
import {
  Play, RotateCcw, Code2, Bug, GraduationCap,
  Star, ChevronRight, Terminal,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy-load 3D visualization (desktop only)
const CodeBlocks3D = dynamic(
  () => import('@/components/3d/CodeBlocks3D').then((m) => m.CodeBlocks3D),
  { ssr: false }
);

// --- Types ---
type Phase = 'welcome' | 'learn' | 'play' | 'complete';
type BlockType = 'event' | 'action' | 'logic' | 'loop' | 'function';

interface Block {
  id: string;
  type: BlockType;
  label: string;
  color: string;
  robotAction?: string;
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
  robotSequence: string[];
  pseudocode: string;
  hint: string;
  band: 'A' | 'B' | 'C';
}

// --- Constants ---
const BLOCK_COLORS: Record<BlockType, string> = {
  event: '#F59E0B',
  action: '#3B82F6',
  logic: '#F97316',
  loop: '#8B5CF6',
  function: '#EC4899',
};

const BLOCK_SHAPES: Record<BlockType, string> = {
  event: '\u25b6',
  action: '\u25cf',
  logic: '\u25c6',
  loop: '\u21bb',
  function: '\u2b21',
};

// --- All 10 Challenges ---
const ALL_CHALLENGES: Challenge[] = [
  // --- SEQUENCE ---
  {
    id: 'c1', title: 'Say Hello!', category: 'sequence', band: 'A',
    description: 'Make the robot say "Hello World!"',
    descriptionC: 'Sequential execution: event trigger \u2192 output statement.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event, robotAction: 'wake' },
      { id: 'say-hello', type: 'action', label: '\ud83d\udcac Say "Hello World!"', color: BLOCK_COLORS.action, robotAction: 'talk' },
      { id: 'say-bye', type: 'action', label: '\ud83d\udcac Say "Goodbye!"', color: BLOCK_COLORS.action, robotAction: 'wave' },
    ],
    correctSequence: ['start', 'say-hello'],
    output: '\ud83e\udd16: Hello World!',
    outputSteps: ['\u25b6 Program starts...', '\ud83d\udcac Say "Hello World!"'],
    robotSequence: ['wake', 'talk'],
    pseudocode: 'BEGIN\n  PRINT "Hello World!"\nEND',
    hint: 'Every program starts with "When Start". Then add the say block.',
  },
  {
    id: 'c2', title: 'Count to 3', category: 'sequence', band: 'A',
    description: 'Make the robot count 1, 2, 3.',
    descriptionC: 'Sequential statements execute top-to-bottom.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'say-1', type: 'action', label: '\ud83d\udcac Say "1"', color: BLOCK_COLORS.action },
      { id: 'say-2', type: 'action', label: '\ud83d\udcac Say "2"', color: BLOCK_COLORS.action },
      { id: 'say-3', type: 'action', label: '\ud83d\udcac Say "3"', color: BLOCK_COLORS.action },
      { id: 'say-4', type: 'action', label: '\ud83d\udcac Say "4"', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'say-1', 'say-2', 'say-3'],
    output: '\ud83e\udd16: 1, 2, 3!',
    outputSteps: ['\u25b6 Program starts...', '\ud83d\udcac "1"', '\ud83d\udcac "2"', '\ud83d\udcac "3"'],
    robotSequence: ['wake', 'hold1', 'hold2', 'hold3'],
    pseudocode: 'BEGIN\n  PRINT "1"\n  PRINT "2"\n  PRINT "3"\nEND',
    hint: 'Order matters! 1 \u2192 2 \u2192 3. Don\'t include 4.',
  },
  // --- CONDITIONALS ---
  {
    id: 'c3', title: 'If It Rains', category: 'conditional', band: 'A',
    description: 'If raining \u2192 bring umbrella.',
    descriptionC: 'IF-THEN conditional branching.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'if-rain', type: 'logic', label: '\ud83d\udd00 If raining?', color: BLOCK_COLORS.logic },
      { id: 'umbrella', type: 'action', label: '\u2602\ufe0f Bring umbrella', color: BLOCK_COLORS.action },
      { id: 'sunglasses', type: 'action', label: '\ud83d\ude0e Wear sunglasses', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'if-rain', 'umbrella'],
    output: '\ud83e\udd16: Umbrella ready!',
    outputSteps: ['\u25b6 Program starts...', '\ud83d\udd00 Is it raining? \u2192 YES', '\u2602\ufe0f Bringing umbrella!'],
    robotSequence: ['wake', 'think', 'umbrella'],
    pseudocode: 'BEGIN\n  IF raining THEN\n    BRING umbrella\n  END IF\nEND',
    hint: 'Start \u2192 check condition \u2192 action for true.',
  },
  {
    id: 'c4', title: 'Hot or Cold?', category: 'conditional', band: 'B',
    description: 'If temp > 30\u00b0 \u2192 AC, else \u2192 sweater.',
    descriptionC: 'IF-ELSE with comparison operator.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'if-hot', type: 'logic', label: '\ud83c\udf21\ufe0f If temp > 30\u00b0?', color: BLOCK_COLORS.logic },
      { id: 'ac', type: 'action', label: '\u2744\ufe0f Turn on AC', color: BLOCK_COLORS.action },
      { id: 'else', type: 'logic', label: '\u21aa\ufe0f Else', color: BLOCK_COLORS.logic },
      { id: 'sweater', type: 'action', label: '\ud83e\udde5 Wear sweater', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'if-hot', 'ac', 'else', 'sweater'],
    output: '\ud83e\udd16: 35\u00b0! AC on!',
    outputSteps: ['\u25b6 Program starts...', '\ud83c\udf21\ufe0f temp > 30\u00b0? \u2192 YES (35\u00b0)', '\u2744\ufe0f AC activated!'],
    robotSequence: ['wake', 'think', 'cool', 'skip', 'skip'],
    pseudocode: 'BEGIN\n  IF temp > 30 THEN\n    AC on\n  ELSE\n    WEAR sweater\n  END IF\nEND',
    hint: 'IF \u2192 true action \u2192 ELSE \u2192 false action.',
  },
  // --- LOOPS ---
  {
    id: 'c5', title: 'Clap 3 Times', category: 'loop', band: 'A',
    description: 'Use a loop to clap 3 times.',
    descriptionC: 'FOR loop: fixed iteration count.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'loop-3', type: 'loop', label: '\ud83d\udd01 Repeat 3 times', color: BLOCK_COLORS.loop },
      { id: 'clap', type: 'action', label: '\ud83d\udc4f Clap', color: BLOCK_COLORS.action },
      { id: 'jump', type: 'action', label: '\ud83e\udd98 Jump', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-3', 'clap'],
    output: '\ud83e\udd16: Clap \u00d73!',
    outputSteps: ['\u25b6 Program starts...', '\ud83d\udd01 Loop 1/3', '\ud83d\udc4f Clap!', '\ud83d\udd01 Loop 2/3', '\ud83d\udc4f Clap!', '\ud83d\udd01 Loop 3/3', '\ud83d\udc4f Clap!'],
    robotSequence: ['wake', 'loop', 'clap', 'loop', 'clap', 'loop', 'clap'],
    pseudocode: 'BEGIN\n  FOR i = 1 TO 3\n    CLAP\n  END FOR\nEND',
    hint: 'Start \u2192 loop \u2192 action inside the loop.',
  },
  {
    id: 'c6', title: 'Dance Routine', category: 'loop', band: 'B',
    description: 'Loop 2 times: spin then wave.',
    descriptionC: 'Multi-statement loop body.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'loop-2', type: 'loop', label: '\ud83d\udd01 Repeat 2 times', color: BLOCK_COLORS.loop },
      { id: 'spin', type: 'action', label: '\ud83c\udf00 Spin', color: BLOCK_COLORS.action },
      { id: 'wave', type: 'action', label: '\ud83d\udc4b Wave', color: BLOCK_COLORS.action },
      { id: 'bow', type: 'action', label: '\ud83d\ude47 Bow', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-2', 'spin', 'wave'],
    output: '\ud83e\udd16: Spin+Wave \u00d72!',
    outputSteps: ['\u25b6 Starts...', '\ud83d\udd01 1/2', '\ud83c\udf00 Spin!', '\ud83d\udc4b Wave!', '\ud83d\udd01 2/2', '\ud83c\udf00 Spin!', '\ud83d\udc4b Wave!'],
    robotSequence: ['wake', 'loop', 'spin', 'wave', 'loop', 'spin', 'wave'],
    pseudocode: 'BEGIN\n  FOR i = 1 TO 2\n    SPIN\n    WAVE\n  END FOR\nEND',
    hint: 'Both spin AND wave go inside the loop.',
  },
  // --- FUNCTIONS ---
  {
    id: 'c7', title: 'Morning Routine', category: 'function', band: 'B',
    description: 'Call wakeUp() then eat breakfast.',
    descriptionC: 'Function abstraction: call reusable procedure.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'fn-wake', type: 'function', label: '\ud83d\udce6 Call wakeUp()', color: BLOCK_COLORS.function },
      { id: 'eat', type: 'action', label: '\ud83c\udf73 Eat breakfast', color: BLOCK_COLORS.action },
      { id: 'sleep', type: 'action', label: '\ud83d\ude34 Go to sleep', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'fn-wake', 'eat'],
    output: '\ud83e\udd16: Awake \u2192 Eating!',
    outputSteps: ['\u25b6 Starts...', '\ud83d\udce6 wakeUp():', '\u23f0 \u2192 Alarm!', '\ud83e\uddcd \u2192 Get up', '\ud83e\udea5 \u2192 Brush teeth', '\ud83c\udf73 Eating breakfast!'],
    robotSequence: ['wake', 'function', 'alarm', 'getup', 'brush', 'eat'],
    pseudocode: 'FUNCTION wakeUp()\n  ALARM\n  GET_UP\n  BRUSH_TEETH\nEND\n\nBEGIN\n  CALL wakeUp()\n  EAT breakfast\nEND',
    hint: 'Functions bundle steps. Call it first, then eat.',
  },
  {
    id: 'c8', title: 'Robot Patrol', category: 'function', band: 'C',
    description: 'Loop patrol() 3 times.',
    descriptionC: 'Compose function calls within loop body.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'loop-3', type: 'loop', label: '\ud83d\udd01 Repeat 3 times', color: BLOCK_COLORS.loop },
      { id: 'fn-patrol', type: 'function', label: '\ud83d\udce6 Call patrol()', color: BLOCK_COLORS.function },
      { id: 'scan', type: 'action', label: '\ud83d\udce1 Scan', color: BLOCK_COLORS.action },
      { id: 'report', type: 'action', label: '\ud83d\udccb Report', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-3', 'fn-patrol'],
    output: '\ud83e\udd16: 3 patrols done!',
    outputSteps: ['\u25b6 Starts...', '\ud83d\udd01 1/3', '\ud83d\udce6 patrol()\u2192\ud83d\udce1\ud83d\udd0d\ud83d\udccb', '\ud83d\udd01 2/3', '\ud83d\udce6 patrol()\u2192\ud83d\udce1\ud83d\udd0d\ud83d\udccb', '\ud83d\udd01 3/3', '\ud83d\udce6 patrol()\u2192\ud83d\udce1\ud83d\udd0d\ud83d\udccb', '\u2705 All clear!'],
    robotSequence: ['wake', 'loop', 'patrol', 'loop', 'patrol', 'loop', 'patrol', 'salute'],
    pseudocode: 'FUNCTION patrol()\n  SCAN\n  REPORT\n  MOVE\nEND\n\nBEGIN\n  FOR i=1 TO 3\n    CALL patrol()\n  END FOR\nEND',
    hint: 'Just call the function inside the loop!',
  },
  {
    id: 'c9', title: 'Smart Alarm', category: 'conditional', band: 'C',
    description: 'IF weekday \u2192 alarm at 7. ELSE \u2192 sleep in.',
    descriptionC: 'Nested conditional with context-dependent branching.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'if-weekday', type: 'logic', label: '\ud83d\udcc5 If weekday?', color: BLOCK_COLORS.logic },
      { id: 'alarm-7', type: 'action', label: '\u23f0 Alarm at 7AM', color: BLOCK_COLORS.action },
      { id: 'else', type: 'logic', label: '\u21aa\ufe0f Else', color: BLOCK_COLORS.logic },
      { id: 'sleep-in', type: 'action', label: '\ud83d\ude34 Sleep in!', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'if-weekday', 'alarm-7', 'else', 'sleep-in'],
    output: '\ud83e\udd16: Monday! Alarm 7AM!',
    outputSteps: ['\u25b6 Starts...', '\ud83d\udcc5 Weekday? \u2192 YES (Monday)', '\u23f0 Setting alarm: 7:00 AM'],
    robotSequence: ['wake', 'think', 'alarm'],
    pseudocode: 'BEGIN\n  IF weekday THEN\n    SET alarm 7AM\n  ELSE\n    SLEEP in\n  END IF\nEND',
    hint: 'Same pattern as Hot or Cold: IF \u2192 action \u2192 ELSE \u2192 action.',
  },
  {
    id: 'c10', title: 'Remix: Party Bot', category: 'loop', band: 'C',
    description: 'Loop 3 times: clap, spin, wave. Full party!',
    descriptionC: 'Multi-action loop body with 3 sequential operations.',
    palette: [
      { id: 'start', type: 'event', label: '\u25b6 When Start', color: BLOCK_COLORS.event },
      { id: 'loop-3', type: 'loop', label: '\ud83d\udd01 Repeat 3 times', color: BLOCK_COLORS.loop },
      { id: 'clap', type: 'action', label: '\ud83d\udc4f Clap', color: BLOCK_COLORS.action },
      { id: 'spin', type: 'action', label: '\ud83c\udf00 Spin', color: BLOCK_COLORS.action },
      { id: 'wave', type: 'action', label: '\ud83d\udc4b Wave', color: BLOCK_COLORS.action },
      { id: 'bow', type: 'action', label: '\ud83d\ude47 Bow', color: BLOCK_COLORS.action },
    ],
    correctSequence: ['start', 'loop-3', 'clap', 'spin', 'wave'],
    output: '\ud83e\udd16: Party time \u00d73!',
    outputSteps: ['\u25b6 Starts...', '\ud83d\udd01 1/3', '\ud83d\udc4f Clap!', '\ud83c\udf00 Spin!', '\ud83d\udc4b Wave!', '\ud83d\udd01 2/3', '\ud83d\udc4f Clap!', '\ud83c\udf00 Spin!', '\ud83d\udc4b Wave!', '\ud83d\udd01 3/3', '\ud83d\udc4f Clap!', '\ud83c\udf00 Spin!', '\ud83d\udc4b Wave!'],
    robotSequence: ['wake', 'loop', 'clap', 'spin', 'wave', 'loop', 'clap', 'spin', 'wave', 'loop', 'clap', 'spin', 'wave'],
    pseudocode: 'BEGIN\n  FOR i = 1 TO 3\n    CLAP\n    SPIN\n    WAVE\n  END FOR\nEND',
    hint: 'All three actions go INSIDE the loop!',
  },
];

// --- Learn Cards ---
const LEARN_CARDS = [
  { title: 'Sequence', emoji: '\ud83d\udccb', desc: 'Code runs one step at a time, top to bottom.' },
  { title: 'Conditions', emoji: '\ud83d\udd00', desc: 'IF true \u2192 do this. ELSE \u2192 do that.' },
  { title: 'Loops', emoji: '\ud83d\udd01', desc: 'Repeat actions without writing them again.' },
  { title: 'Functions', emoji: '\ud83d\udce6', desc: 'Bundle steps into reusable blocks.' },
];

// --- Robot Poses (20 distinct) ---
const ROBOT_POSES: Record<string, { emoji: string; label: string }> = {
  idle:     { emoji: '\ud83e\udd16', label: '' },
  wake:     { emoji: '\ud83e\udd16', label: 'Booting...' },
  talk:     { emoji: '\ud83d\udde3\ufe0f', label: 'Hello World!' },
  think:    { emoji: '\ud83e\udd14', label: 'Checking...' },
  clap:     { emoji: '\ud83d\udc4f', label: 'Clap!' },
  wave:     { emoji: '\ud83d\udc4b', label: 'Wave!' },
  spin:     { emoji: '\ud83c\udf00', label: 'Spin!' },
  umbrella: { emoji: '\u2602\ufe0f', label: 'Umbrella!' },
  cool:     { emoji: '\u2744\ufe0f', label: 'AC on!' },
  eat:      { emoji: '\ud83c\udf73', label: 'Yum!' },
  patrol:   { emoji: '\ud83d\udd0d', label: 'Patrolling...' },
  salute:   { emoji: '\ud83e\udee1', label: 'All clear!' },
  alarm:    { emoji: '\u23f0', label: 'RING!' },
  getup:    { emoji: '\ud83e\uddcd', label: 'Rising...' },
  brush:    { emoji: '\ud83e\udea5', label: 'Brushing!' },
  function: { emoji: '\ud83d\udce6', label: 'Unpacking...' },
  loop:     { emoji: '\ud83d\udd01', label: 'Repeating...' },
  hold1:    { emoji: '\u261d\ufe0f', label: '1!' },
  hold2:    { emoji: '\u270c\ufe0f', label: '2!' },
  hold3:    { emoji: '\ud83e\udd1f', label: '3!' },
  correct:  { emoji: '\ud83c\udf89', label: 'CORRECT!' },
  wrong:    { emoji: '\ud83d\ude05', label: 'Try again...' },
  skip:     { emoji: '\ud83e\udd16', label: '' },
};

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

// --- Hook: detect desktop ---
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isDesktop;
}

// --- Main Component ---
export function CodeBlocksGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const setGameSceneContent = useSceneStore((s) => s.setGameSceneContent);
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';
  const { data: _dynamicContent } = useGameContent('code-blocks', ageBand);
  // Phase 2: Dynamic scenarios available via _dynamicContent?.scenarios and _dynamicContent?.challenges
  const _isDesktop = useIsDesktop();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [placed, setPlaced] = useState<Block[]>([]);
  const [running, setRunning] = useState(false);
  const [runIdx, setRunIdx] = useState(-1);
  const [tracerY, setTracerY] = useState(-1);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [showPseudo, setShowPseudo] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [robotPose, setRobotPose] = useState('idle');
  const [attempts, setAttempts] = useState(0);
  const [stars, setStars] = useState<number[]>([]);
  const [learnIdx, setLearnIdx] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  const challenges = useMemo(
    () => ALL_CHALLENGES.filter((c) => BAND_ORDER[c.band] <= BAND_ORDER[ageBand]),
    [ageBand]
  );
  const challenge = challenges[challengeIdx];

  const particles = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 1, delay: Math.random() * 4,
      dur: Math.random() * 6 + 4,
    })),
    []
  );

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [outputLines]);

  function addBlock(block: Block) {
    if (running || placed.find((b) => b.id === block.id)) return;
    setPlaced((prev) => [...prev, block]);
  }

  function removeBlock(idx: number) {
    if (running) return;
    setPlaced((prev) => prev.filter((_, i) => i !== idx));
  }

  async function runCode() {
    setRunning(true);
    setResult(null);
    setOutputLines([]);
    setAttempts((a) => a + 1);
    setRobotPose('wake');

    // Tracer through placed blocks
    for (let i = 0; i < placed.length; i++) {
      setRunIdx(i);
      setTracerY(i);
      await new Promise((r) => setTimeout(r, 600));
    }

    const seq = placed.map((b) => b.id);
    const correct =
      JSON.stringify(seq) === JSON.stringify(challenge.correctSequence);

    if (correct) {
      for (let i = 0; i < challenge.outputSteps.length; i++) {
        setOutputLines((prev) => [...prev, challenge.outputSteps[i]]);
        if (challenge.robotSequence[i])
          setRobotPose(challenge.robotSequence[i]);
        await new Promise((r) => setTimeout(r, 450));
      }
      setRobotPose('correct');
      const starCount = !showHint && attempts === 0 ? 3 : !showHint ? 2 : 1;
      setStars((prev) => [...prev, starCount]);
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
      setChallengeIdx((i) => i + 1);
      game.advanceRound();
    } else {
      setPhase('complete');
      game.completeGame();
    }
  }

  useEffect(() => {
    if (placed.length > 0) {
      setGameSceneContent(
        <CodeBlocks3D blocks={placed} runIdx={runIdx} tracerY={tracerY} running={running} />
      );
    } else {
      setGameSceneContent(null);
    }
  }, [placed, runIdx, tracerY, running, setGameSceneContent]);

  // --- JSX ---
  return (
    <GameShell gameId="code-blocks" title="Code Blocks" worldNumber={9} worldColor="#F97316" totalRounds={challenges.length}>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(249,115,22,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(249,115,22,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(249,115,22,0.1)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* --- WELCOME PHASE --- */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-5xl">🧱</span>
                    <h2 className="font-display text-2xl font-bold text-white">Code Blocks</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Visual programming: compose sequences, conditionals, loops, and functions.'
                        : 'Snap blocks together to make the robot do cool things!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Sequence', 'Loops', 'Conditionals', 'Functions'].map((t) => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 font-body text-2xs text-orange-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Start coding">
                      Start Coding! <Code2 className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* --- LEARN PHASE --- */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <GraduationCap className="w-8 h-8 text-orange-400" />
                    <h3 className="font-display text-lg font-bold text-white">Learn the Basics</h3>
                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                        className="rounded-xl p-4 border border-orange-500/20 bg-orange-500/5 max-w-xs">
                        <span className="text-3xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-sm font-bold text-white mt-2">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-xs text-white/50 mt-1">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <div className="flex gap-2">
                      {LEARN_CARDS.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === learnIdx ? 'bg-orange-400' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <motion.button
                      onClick={() => learnIdx < LEARN_CARDS.length - 1 ? setLearnIdx((i) => i + 1) : setPhase('play')}
                      className="w-full max-w-xs py-2.5 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={learnIdx < LEARN_CARDS.length - 1 ? 'Next learn card' : 'Start challenges'}>
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next' : 'Start Challenges!'}
                      <ChevronRight className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* --- PLAY PHASE --- */}
                {phase === 'play' && challenge && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-display text-sm font-bold text-white">
                          {challengeIdx + 1}/{challenges.length}: {challenge.title}
                        </h3>
                        <p className="font-body text-2xs text-white/40">
                          {ageBand === 'C' ? challenge.descriptionC : challenge.description}
                        </p>
                      </div>
                      <div className="flex gap-0.5">
                        {stars.map((s, i) => (
                          <div key={i} className="flex">
                            {Array.from({ length: s }).map((_, j) => (
                              <Star key={j} className="w-3 h-3 text-orange-400 fill-orange-400" />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main play area */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* COLUMN 1: Block Palette */}
                      <div className="space-y-1.5">
                        <p className="font-display text-2xs text-white/20 uppercase">Palette</p>
                        {challenge.palette.map((block) => {
                          const used = placed.find((b) => b.id === block.id);
                          return (
                            <motion.button key={block.id}
                              onClick={() => addBlock(block)}
                              disabled={!!used || running}
                              className={`w-full text-left px-3 py-2 rounded-lg border font-body text-xs transition-all
                                ${used ? 'opacity-20 cursor-not-allowed border-white/5' :
                                  'cursor-pointer border-white/10 hover:border-white/20'}`}
                              style={{ borderLeftWidth: 4, borderLeftColor: block.color,
                                background: `linear-gradient(90deg, ${block.color}08, transparent)` }}
                              whileTap={!used ? { scale: 0.95 } : {}}
                              aria-label={`Add ${block.label}`}>
                              <span className="text-white/60">
                                {BLOCK_SHAPES[block.type]} {block.label}
                              </span>
                            </motion.button>
                          );
                        })}
                        <div className="flex gap-1 mt-2">
                          <button onClick={() => setShowHint(true)} disabled={showHint}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 font-body text-2xs text-white/30 hover:text-white/50 flex items-center justify-center gap-0.5"
                            aria-label="Show hint">
                            <Bug className="w-3 h-3" /> Hint
                          </button>
                          <button onClick={() => { setPlaced([]); setResult(null); setOutputLines([]); setRobotPose('idle'); }}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 font-body text-2xs text-white/30 hover:text-white/50 flex items-center justify-center gap-0.5"
                            aria-label="Reset workspace">
                            <RotateCcw className="w-3 h-3" /> Reset
                          </button>
                        </div>
                      </div>

                      {/* COLUMN 2: Workspace (placed blocks) */}
                      <div className="flex flex-col">
                        <p className="font-display text-2xs text-white/20 uppercase mb-1">Workspace</p>

                        {/* 3D renders in CockpitCanvas via sceneStore (D3D-B3) */}

                        {/* 2D block stack */}
                        <div className="flex-1 rounded-xl border border-dashed border-white/10 p-2 min-h-[120px] relative">
                          {/* Tracer line */}
                          {running && tracerY >= 0 && (
                            <motion.div className="absolute left-0 top-0 w-1 bg-orange-400/50 rounded-full"
                              animate={{ height: `${((tracerY + 1) / placed.length) * 100}%` }}
                              transition={{ duration: 0.3 }} />
                          )}

                          {placed.length === 0 && (
                            <p className="font-body text-2xs text-white/10 text-center mt-8">
                              Click blocks to add them here
                            </p>
                          )}

                          {placed.map((block, i) => (
                            <motion.div key={block.id + i}
                              initial={{ opacity: 0, x: -20, scale: 0.9 }}
                              animate={{ opacity: 1, x: 0, scale: runIdx === i ? 1.03 : 1 }}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md mb-0.5 cursor-pointer
                                ${runIdx === i ? 'ring-1 ring-orange-400/50' : ''}`}
                              style={{
                                borderLeft: `3px solid ${block.color}`,
                                background: runIdx === i ? `${block.color}15` : `${block.color}08`,
                                marginLeft: (block.type === 'action' && i > 0 && ['logic', 'loop'].includes(placed[i-1]?.type)) ? 16 : 0,
                              }}
                              onClick={() => removeBlock(i)}
                              aria-label={`Remove ${block.label}`}>
                              <span className="font-mono text-2xs text-white/20">{BLOCK_SHAPES[block.type]}</span>
                              <span className="font-body text-2xs text-white/60 flex-1">{block.label}</span>
                              {!running && <span className="text-white/10 text-2xs">&times;</span>}
                            </motion.div>
                          ))}
                        </div>

                        {/* Run button */}
                        <motion.button onClick={runCode} disabled={placed.length === 0 || running || result === 'correct'}
                          className="mt-2 w-full py-2.5 rounded-xl font-display font-bold text-sm text-white disabled:opacity-30 flex items-center justify-center gap-1"
                          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                          whileTap={{ scale: 0.95 }}
                          aria-label={running ? 'Code is running' : 'Run code'}>
                          {running ? 'Running...' : 'Run Code'}
                          <Play className="w-4 h-4" />
                        </motion.button>

                        {result === 'correct' && (
                          <motion.button onClick={nextChallenge}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="mt-1 w-full py-2 rounded-xl bg-white/5 border border-white/10 font-display text-xs text-white/50 flex items-center justify-center gap-1"
                            aria-label="Next challenge">
                            Next Challenge <ChevronRight className="w-3 h-3" />
                          </motion.button>
                        )}
                      </div>

                      {/* COLUMN 3: Output Panel (Robot + Terminal) */}
                      <div className="flex flex-col gap-2">
                        {/* Robot */}
                        <div className="rounded-xl p-3 border border-orange-500/10 bg-orange-500/5 text-center">
                          <motion.span key={robotPose} className="text-4xl block"
                            initial={{ scale: 0.5, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300 }}>
                            {ROBOT_POSES[robotPose]?.emoji || '\ud83e\udd16'}
                          </motion.span>
                          <AnimatePresence mode="wait">
                            {ROBOT_POSES[robotPose]?.label && (
                              <motion.p key={robotPose}
                                className="font-mono text-2xs text-orange-300/50 mt-1"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}>
                                {ROBOT_POSES[robotPose].label}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Terminal */}
                        <div ref={terminalRef} role="log" aria-live="polite"
                          className="flex-1 rounded-xl bg-black/40 border border-white/10 p-2 overflow-auto max-h-[200px]">
                          <div className="flex gap-1 mb-1">
                            <button onClick={() => setShowPseudo(false)}
                              className={`font-mono text-2xs px-1.5 py-0.5 rounded flex items-center gap-0.5 ${!showPseudo ? 'bg-green-500/20 text-green-400' : 'text-white/20'}`}
                              aria-label="Show output" aria-pressed={!showPseudo}>
                              <Terminal className="w-2.5 h-2.5" /> Out
                            </button>
                            <button onClick={() => setShowPseudo(true)}
                              className={`font-mono text-2xs px-1.5 py-0.5 rounded ${showPseudo ? 'bg-purple-500/20 text-purple-400' : 'text-white/20'}`}
                              aria-label="Show pseudocode" aria-pressed={showPseudo}>
                              Pseudo
                            </button>
                          </div>
                          {showPseudo ? (
                            <pre className="font-mono text-2xs text-purple-300/50 whitespace-pre-wrap">{challenge.pseudocode}</pre>
                          ) : (
                            <div className="space-y-0.5">
                              {outputLines.map((line, i) => (
                                <motion.p key={i} className="font-mono text-2xs text-green-400/70"
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                  <span className="text-green-600/30">{'>'}</span> {line}
                                </motion.p>
                              ))}
                              {outputLines.length === 0 && (
                                <p className="font-mono text-2xs text-white/10">Awaiting code...</p>
                              )}
                              {running && (
                                <motion.span className="font-mono text-2xs text-green-400"
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ repeat: Infinity, duration: 0.6 }}>
                                  _
                                </motion.span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Result feedback */}
                        {result && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className={`rounded-lg p-2 text-center ${
                              result === 'correct' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                            }`}>
                            <p className="font-display text-xs font-bold"
                              style={{ color: result === 'correct' ? '#10B981' : '#EF4444' }}>
                              {result === 'correct' ? '\u2705 Correct!' : '\u274c Not quite \u2014 try again!'}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Hint */}
                    {showHint && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mt-2 rounded-lg p-2 bg-amber-500/5 border border-amber-500/10">
                        <p className="font-body text-2xs text-amber-400">{'\ud83d\udca1'} {challenge.hint}</p>
                      </motion.div>
                    )}
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
                    <h2 className="font-display text-2xl font-bold text-white">Code Blocks Complete!</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">You arranged code blocks to solve programming challenges, learning how algorithms execute step-by-step — the foundation of all software!</p>
                    <div className="rounded-xl px-6 py-3 bg-[#F97316]/10 border border-[#F97316]/20">
                      <p className="font-data text-2xl" style={{ color: '#F97316' }}>{game.score}</p>
                      <p className="font-body text-2xs text-white/30">Total Points</p>
                    </div>
                    <div className="mt-4 space-y-2 text-left max-w-sm">
                      <h3 className="font-display text-sm font-bold text-white/70">What You Learned:</h3>
                      <ul className="space-y-1 text-2xs font-body text-white/40">
                        <li>• Sequential programming means instructions run in order, top to bottom</li>
                        <li>• Algorithm design is about choosing the right steps in the right sequence</li>
                        <li>• Debugging means finding and fixing mistakes in your code logic</li>
                      </ul>
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

export default CodeBlocksGame;
