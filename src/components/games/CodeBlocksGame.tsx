// ════════════════════════════════════════════════════════════════════════
// CODE BLOCKS v5 — Lab 9 (Code Lab) — a program that actually RUNS
// ════════════════════════════════════════════════════════════════════════
// Redesign (audit §II.4 #30): the old version was a CONNECT clone — you wired
// blocks in "execution order" but nothing executed. A loop drawn as a straight
// line taught the wrong mental model, and decoys never had real consequences.
//
// Now: you assemble a tiny program from statement cards (order them with the
// up/down buttons — no drag required), then hit RUN. A REAL deterministic
// interpreter executes it line-by-line in an animated console: variables update,
// a real loop iterates pass-by-pass, print statements emit output. There is no
// answer telegraph — correctness only shows when the produced output matches the
// GOAL after you commit and run (G1 honesty).
//
// Wrong orders produce visibly wrong output ("Power: undefined", "Sum: 0"). The
// "no-update" loop bug genuinely infinite-loops until Sparky sparks out and pulls
// the plug — teaching the bug for real. Band C gets a "debug the AI-generated
// code" level: a plausible AI-written snippet with one ordering bug to fix.
//
// Statement types the interpreter runs: assign (x = expr), print(expr),
// if <cond>: <body>, while <cond>: <body>, noop. Exprs: numbers, strings, vars,
// + - * / and string concat. Everything is honest — output is computed, never faked.

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useReducedMotion, motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, RotateCcw, Play, Plus, ArrowUp,
  ArrowDown, Trash2, Terminal, Bug, Sparkles, AlertTriangle, CheckCircle2, Zap,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { useActiveChild } from '@/hooks/useChildren';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import { GlowingTitle, FeedbackPopup } from '@/components/games/shared/GameVisualKit';
import type { AgeBand } from '@/types';

const LAB_COLOR = '#E68E28';
const MAX_SCORE = 100;
const STEP_MS = 440;      // per-frame animation cadence
const WHILE_CAP = 10;     // loop iterations before we declare an infinite loop
const STEP_BUDGET = 160;  // total executed statements before bail-out

// ════════════════════════════════════════════════════════════════════════
// THE INTERPRETER — a small honest evaluator over toy programs
// ════════════════════════════════════════════════════════════════════════
type Val = number | string | undefined;

type Expr =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'var'; name: string }
  | { t: 'bin'; op: '+' | '-' | '*' | '/'; a: Expr; b: Expr }
  | { t: 'concat'; parts: Expr[] };

type Cond = {
  t: 'cmp';
  op: '>' | '<' | '>=' | '<=' | '==' | '!=';
  a: Expr;
  b: Expr;
};

type Stmt =
  | { id: string; kind: 'assign'; target: string; value: Expr }
  | { id: string; kind: 'print'; value: Expr }
  | { id: string; kind: 'if'; cond: Cond; body: Stmt[] }
  | { id: string; kind: 'while'; cond: Cond; body: Stmt[] }
  | { id: string; kind: 'noop' };

const fmt = (v: Val): string =>
  v === undefined ? 'undefined'
    : typeof v === 'number' ? (Number.isNaN(v) ? 'NaN' : String(v))
      : v;
const numOf = (v: Val): number => (typeof v === 'number' ? v : NaN);

function evalExpr(e: Expr, env: Record<string, Val>): Val {
  switch (e.t) {
    case 'num': return e.v;
    case 'str': return e.v;
    case 'var': return env[e.name];
    case 'concat': return e.parts.map((p) => fmt(evalExpr(p, env))).join('');
    case 'bin': {
      const a = evalExpr(e.a, env);
      const b = evalExpr(e.b, env);
      if (e.op === '+') {
        if (typeof a === 'string' || typeof b === 'string') return fmt(a) + fmt(b);
        return numOf(a) + numOf(b);
      }
      if (e.op === '-') return numOf(a) - numOf(b);
      if (e.op === '*') return numOf(a) * numOf(b);
      // '/'
      { const d = numOf(b); return d === 0 ? NaN : numOf(a) / d; }
    }
  }
}

function evalCond(c: Cond, env: Record<string, Val>): boolean {
  const a = evalExpr(c.a, env);
  const b = evalExpr(c.b, env);
  switch (c.op) {
    case '==': return a === b;
    case '!=': return a !== b;
    case '>': return numOf(a) > numOf(b);
    case '<': return numOf(a) < numOf(b);
    case '>=': return numOf(a) >= numOf(b);
    case '<=': return numOf(a) <= numOf(b);
  }
}

interface Frame {
  lineId: string;
  env: Record<string, Val>;
  out: string[];
  note?: string;
}
interface RunResult {
  frames: Frame[];
  output: string[];
  infinite: boolean;
}

// Execute a program, recording a frame after every statement so the console can
// replay execution one line at a time. Detects runaway loops honestly.
function execProgram(program: Stmt[]): RunResult {
  const env: Record<string, Val> = {};
  const out: string[] = [];
  const frames: Frame[] = [];
  let steps = 0;
  let infinite = false;

  const snap = (lineId: string, note?: string) => {
    frames.push({ lineId, env: { ...env }, out: [...out], note });
  };

  const exec = (stmts: Stmt[]): 'ok' | 'halt' => {
    for (const s of stmts) {
      if (steps++ > STEP_BUDGET) { infinite = true; return 'halt'; }
      switch (s.kind) {
        case 'assign':
          env[s.target] = evalExpr(s.value, env);
          snap(s.id);
          break;
        case 'print':
          out.push(fmt(evalExpr(s.value, env)));
          snap(s.id);
          break;
        case 'noop':
          snap(s.id, 'does nothing');
          break;
        case 'if':
          snap(s.id, evalCond(s.cond, env) ? 'condition true' : 'condition false — skipped');
          if (evalCond(s.cond, env)) {
            if (exec(s.body) === 'halt') return 'halt';
          }
          break;
        case 'while': {
          let iters = 0;
          while (evalCond(s.cond, env)) {
            snap(s.id, `loop pass ${iters + 1}`);
            if (iters++ >= WHILE_CAP) { infinite = true; return 'halt'; }
            if (exec(s.body) === 'halt') return 'halt';
            if (steps++ > STEP_BUDGET) { infinite = true; return 'halt'; }
          }
          snap(s.id, 'loop condition false — exit');
          break;
        }
      }
    }
    return 'ok';
  };

  exec(program);
  return { frames, output: out, infinite };
}

const arrEq = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

// ════════════════════════════════════════════════════════════════════════
// LEVEL DATA — genuinely distinct tiny programs (sequence → loop → debug)
// ════════════════════════════════════════════════════════════════════════
interface CardLine { id: string; text: string; indent?: number }
interface Card {
  id: string;
  lines: CardLine[]; // how the card renders (header + any fixed inner body)
  stmt: Stmt;        // what actually runs (ids match line ids for highlighting)
}
interface Level {
  id: number;
  name: string;
  emoji: string;
  difficulty: LevelConfig['difficulty'];
  xpReward: number;
  bands: AgeBand[];
  concept: string;
  goalOutput: string[];
  hints: string[];
  toolbox: Card[];
  initialProgram: string[];              // card ids pre-placed (empty = build from toolbox)
  lockOrderOnly?: boolean;               // debug level: reorder only, no add/remove
  preLines?: CardLine[];                 // fixed scaffolding above the editable region
  postLines?: CardLine[];                // fixed scaffolding below
  wrapHeader?: CardLine;                 // e.g. "while count > 0:" — editable region is its body
  assemble?: (bodyStmts: Stmt[]) => Stmt[]; // combine editable region with fixed frame
}

const p = (id: string, code: string, value: Expr): Card =>
  ({ id, lines: [{ id, text: code }], stmt: { id, kind: 'print', value } });
const a = (id: string, code: string, target: string, value: Expr): Card =>
  ({ id, lines: [{ id, text: code }], stmt: { id, kind: 'assign', target, value } });

const V = (name: string): Expr => ({ t: 'var', name });
const N = (v: number): Expr => ({ t: 'num', v });
const S = (v: string): Expr => ({ t: 'str', v });

const LEVELS: Level[] = [
  // ── L1: SEQUENCE (all bands) ──────────────────────────────────────────
  {
    id: 1, name: 'Wake the Robot', emoji: '🤖', difficulty: 'easy', xpReward: 50,
    bands: ['A', 'B', 'C'],
    concept: 'Programs run top-to-bottom. A variable must be SET before you can print it.',
    goalOutput: ['Booting...', 'Power: ON', 'Robot ready!'],
    hints: ['Set a variable before you print it.', 'The robot boots first, then powers on, then is ready.'],
    initialProgram: [],
    toolbox: [
      p('c1', 'print("Booting...")', S('Booting...')),
      a('c2', 'power = "ON"', 'power', S('ON')),
      p('c3', 'print("Power: " + power)', { t: 'concat', parts: [S('Power: '), V('power')] }),
      p('c4', 'print("Robot ready!")', S('Robot ready!')),
      a('c5', 'power = "OFF"', 'power', S('OFF')),
    ],
  },
  // ── L2: VARIABLES / MATH (all bands) ──────────────────────────────────
  {
    id: 2, name: 'Score Counter', emoji: '🔢', difficulty: 'easy', xpReward: 60,
    bands: ['A', 'B', 'C'],
    concept: 'Variables change step by step. Start the score, add to it, THEN print the total.',
    goalOutput: ['Score: 15'],
    hints: ['Start the score at 0 before you add to it.', 'Print the score after all the adding is done.'],
    initialProgram: [],
    toolbox: [
      a('s0', 'score = 0', 'score', N(0)),
      a('s1', 'score = score + 10', 'score', { t: 'bin', op: '+', a: V('score'), b: N(10) }),
      a('s2', 'score = score + 5', 'score', { t: 'bin', op: '+', a: V('score'), b: N(5) }),
      p('s3', 'print("Score: " + score)', { t: 'concat', parts: [S('Score: '), V('score')] }),
      a('s4', 'score = 100', 'score', N(100)),
    ],
  },
  // ── L3: CONDITIONAL (bands B, C) ──────────────────────────────────────
  {
    id: 3, name: 'Age Check', emoji: '❓', difficulty: 'medium', xpReward: 75,
    bands: ['B', 'C'],
    concept: 'An if-statement checks a condition. Set the value BEFORE you check it, or the check sees nothing.',
    goalOutput: ['Checking age...', 'Teen zone unlocked!'],
    hints: ['Set age before the if checks it.', 'The if only runs its inside line when the condition is true.'],
    initialProgram: [],
    toolbox: [
      p('p0', 'print("Checking age...")', S('Checking age...')),
      a('a0', 'age = 15', 'age', N(15)),
      {
        id: 'ifc',
        lines: [
          { id: 'ifc', text: 'if age >= 13:' },
          { id: 'ifb', text: 'print("Teen zone unlocked!")', indent: 1 },
        ],
        stmt: {
          id: 'ifc', kind: 'if',
          cond: { t: 'cmp', op: '>=', a: V('age'), b: N(13) },
          body: [{ id: 'ifb', kind: 'print', value: S('Teen zone unlocked!') }],
        },
      },
      a('a1', 'age = 10', 'age', N(10)),
    ],
  },
  // ── L4: LOOP + the infinite-loop bug (bands B, C) ─────────────────────
  {
    id: 4, name: 'Countdown Loop', emoji: '🔄', difficulty: 'hard', xpReward: 100,
    bands: ['B', 'C'],
    concept: 'A loop repeats while its condition is true. The body MUST change the loop variable — or it runs FOREVER.',
    goalOutput: ['3', '2', '1', 'Liftoff!'],
    hints: [
      'Print the count, then make count smaller each pass.',
      'One of these steps does nothing to count. If you rely on it, the loop never ends!',
    ],
    initialProgram: [],
    preLines: [{ id: 'l4pre', text: 'count = 3' }],
    wrapHeader: { id: 'l4while', text: 'while count > 0:' },
    postLines: [{ id: 'l4post', text: 'print("Liftoff!")' }],
    toolbox: [
      p('b1', 'print(count)', V('count')),
      a('b2', 'count = count - 1', 'count', { t: 'bin', op: '-', a: V('count'), b: N(1) }),
      { id: 'b3', lines: [{ id: 'b3', text: 'wait()' }], stmt: { id: 'b3', kind: 'noop' } },
    ],
    assemble: (body) => [
      { id: 'l4pre', kind: 'assign', target: 'count', value: N(3) },
      {
        id: 'l4while', kind: 'while',
        cond: { t: 'cmp', op: '>', a: V('count'), b: N(0) },
        body,
      },
      { id: 'l4post', kind: 'print', value: S('Liftoff!') },
    ],
  },
  // ── L5: DEBUG THE AI CODE (band C only) ───────────────────────────────
  {
    id: 5, name: 'Debug the AI Code', emoji: '🪲', difficulty: 'expert', xpReward: 140,
    bands: ['C'],
    concept: 'An AI wrote this program, but the output is wrong. Read the goal, run it, spot the line that runs too early, and reorder to fix the bug.',
    goalOutput: ['Sum: 30', 'Average: 10'],
    hints: [
      'Compare the run output to the goal — which line printed too early?',
      'A value must be computed before you print it.',
    ],
    initialProgram: ['d0', 'd1', 'd2', 'd3', 'd4'], // buggy order the "AI" produced
    lockOrderOnly: true,
    toolbox: [
      a('d0', 'total = 0', 'total', N(0)),
      p('d1', 'print("Sum: " + total)', { t: 'concat', parts: [S('Sum: '), V('total')] }),
      a('d2', 'total = total + 30', 'total', { t: 'bin', op: '+', a: V('total'), b: N(30) }),
      a('d3', 'avg = total / 3', 'avg', { t: 'bin', op: '/', a: V('total'), b: N(3) }),
      p('d4', 'print("Average: " + avg)', { t: 'concat', parts: [S('Average: '), V('avg')] }),
    ],
  },
];

const toLevelConfig = (l: Level): LevelConfig => ({
  id: l.id, name: l.name, description: l.concept, emoji: l.emoji,
  difficulty: l.difficulty, starThresholds: [50, 75, 100], xpReward: l.xpReward,
  isBonus: l.id === 5,
});

// ════════════════════════════════════════════════════════════════════════
// PRESENTATION HELPERS
// ════════════════════════════════════════════════════════════════════════
function CodeLine({
  text, indent = 0, active, faded, mono = true,
}: { text: string; indent?: number; active?: boolean; faded?: boolean; mono?: boolean }) {
  return (
    <div
      className={`${mono ? 'font-mono' : ''} text-sm rounded-md px-2 py-1 transition-colors`}
      style={{
        paddingLeft: `${8 + indent * 18}px`,
        background: active ? `${LAB_COLOR}22` : 'transparent',
        borderLeft: `3px solid ${active ? LAB_COLOR : 'transparent'}`,
        color: faded ? '#8B949E' : '#1A1D2B',
      }}
    >
      {text}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — build the program, then RUN it in the animated console
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: Level; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'build'>('welcome');

  const cardMap = useMemo(() => {
    const m: Record<string, Card> = {};
    level.toolbox.forEach((c) => { m[c.id] = c; });
    return m;
  }, [level]);

  const [program, setProgram] = useState<string[]>(level.initialProgram);
  const [wrongRuns, setWrongRuns] = useState(0);
  const [run, setRun] = useState<{
    frames: Frame[]; matched: boolean; infinite: boolean; stars: number; score: number;
  } | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const completedRef = useRef(false);

  const available = useMemo(
    () => level.toolbox.filter((c) => !program.includes(c.id)),
    [level, program],
  );

  const clearRun = useCallback(() => {
    setRun(null);
    setFrameIdx(0);
    completedRef.current = false;
  }, []);

  // ── program editing (keyboard-operable via buttons) ──
  const addCard = useCallback((id: string) => {
    setProgram((prev) => (prev.includes(id) ? prev : [...prev, id]));
    clearRun();
  }, [clearRun]);
  const removeCard = useCallback((id: string) => {
    setProgram((prev) => prev.filter((x) => x !== id));
    clearRun();
  }, [clearRun]);
  const moveCard = useCallback((idx: number, dir: -1 | 1) => {
    setProgram((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    clearRun();
  }, [clearRun]);

  // ── run ──
  const handleRun = useCallback(() => {
    if (program.length === 0) return;
    const body = program.map((id) => cardMap[id].stmt);
    const stmts = level.assemble ? level.assemble(body) : body;
    const res = execProgram(stmts);
    const matched = !res.infinite && arrEq(res.output, level.goalOutput);
    let stars = 0;
    let score = 0;
    if (matched) {
      stars = wrongRuns === 0 ? 3 : wrongRuns === 1 ? 2 : 1;
      score = ([0, 50, 75, 100] as const)[stars];
      juice.onCorrect(level.id, score);
    } else {
      setWrongRuns((w) => w + 1);
      juice.onWrong(level.id, 0);
    }
    completedRef.current = false;
    setFrameIdx(0);
    setRun({ frames: res.frames, matched, infinite: res.infinite, stars, score });
  }, [program, cardMap, level, wrongRuns, juice]);

  // ── animate the console one frame at a time ──
  useEffect(() => {
    if (!run || run.frames.length === 0) return;
    if (prefersReducedMotion) { setFrameIdx(run.frames.length - 1); return; }
    if (frameIdx >= run.frames.length - 1) return;
    const t = setTimeout(() => setFrameIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [run, frameIdx, prefersReducedMotion]);

  const atEnd = !!run && (prefersReducedMotion || frameIdx >= run.frames.length - 1);
  const running = !!run && !atEnd;

  // ── fire completion once the successful run finishes replaying ──
  useEffect(() => {
    if (!run || !atEnd || !run.matched || completedRef.current) return;
    completedRef.current = true;
    const t = setTimeout(() => {
      onComplete({
        score: run.score, maxScore: MAX_SCORE, stars: run.stars as 0 | 1 | 2 | 3,
        xpEarned: Math.round((level.xpReward * run.stars) / 3), timeMs: 0,
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [run, atEnd, level.xpReward, onComplete]);

  const resetLevel = useCallback(() => {
    setProgram(level.initialProgram);
    setWrongRuns(0);
    clearRun();
  }, [level.initialProgram, clearRun]);

  const activeLineId = run ? run.frames[Math.min(frameIdx, run.frames.length - 1)]?.lineId : undefined;
  const currentFrame = run ? run.frames[Math.min(frameIdx, run.frames.length - 1)] : null;
  const consoleOut = currentFrame ? currentFrame.out : [];
  const envEntries = currentFrame ? Object.entries(currentFrame.env) : [];

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}18`, color: '#8A5A12' }}>
            <GraduationCap className="w-4 h-4 inline mr-1" style={{ color: LAB_COLOR }} />
            <strong>Concept:</strong> {level.concept}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#4F6EF715', color: '#3A50B0' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#4F6EF7' }} />
            <span>
              <strong>Goal:</strong> {level.lockOrderOnly
                ? 'The AI already wrote this code — reorder the lines so the output matches the goal, then Run.'
                : 'Build a program from the cards, put them in the right order, then Run it. The console shows exactly what your code does.'}
            </span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('build')}>
          {level.lockOrderOnly ? <>Open the Code <Bug className="w-5 h-5 ml-2" /></> : <>Start Coding <ChevronRight className="w-5 h-5 ml-2" /></>}
        </SFButton>
      </div>
    );
  }

  // ═══ BUILD + RUN ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>{level.name}</GlowingTitle>
        <span className="text-xs font-semibold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Zap className="w-3.5 h-3.5" />
          {wrongRuns === 0 ? '3-star run' : `${wrongRuns} fix${wrongRuns > 1 ? 'es' : ''} used`}
        </span>
      </div>

      {/* GOAL — the target output the child aims for (no order telegraph) */}
      <SFCard variant="elevated" className="p-3">
        <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: '#3A50B0' }}>
          <Target className="w-3.5 h-3.5" /> Goal — make the console print:
        </p>
        <div className="rounded-lg p-2 font-mono text-xs space-y-0.5" style={{ background: '#EEF1FB', color: '#1A1D2B' }}>
          {level.goalOutput.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </SFCard>

      {/* THE PROGRAM — editable ordered statements */}
      <SFCard variant="elevated" className="p-3">
        <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#5A6078' }}>
          <Terminal className="w-3.5 h-3.5" /> Your Program
        </p>

        {level.preLines?.map((l) => <CodeLine key={l.id} text={l.text} active={activeLineId === l.id} faded />)}
        {level.wrapHeader && <CodeLine text={level.wrapHeader.text} active={activeLineId === level.wrapHeader.id} faded />}

        <div style={{ paddingLeft: level.wrapHeader ? 16 : 0 }}>
          {program.length === 0 && (
            <p className="text-xs italic px-2 py-3" style={{ color: '#8C94AC' }}>
              {level.wrapHeader ? 'Add loop-body steps from the toolbox below…' : 'Add statement cards from the toolbox below…'}
            </p>
          )}
          {program.map((id, idx) => {
            const card = cardMap[id];
            return (
              <div
                key={id}
                className="rounded-lg mb-1.5 flex items-stretch gap-1"
                style={{ background: '#F7F9FF', border: '1px solid #E4E9F5' }}
              >
                <div className="flex-1 min-w-0 py-1">
                  {card.lines.map((ln) => (
                    <CodeLine key={ln.id} text={ln.text} indent={ln.indent} active={activeLineId === ln.id} />
                  ))}
                </div>
                <div className="flex flex-col justify-center gap-0.5 pr-1.5 shrink-0">
                  <button
                    type="button" onClick={() => moveCard(idx, -1)} disabled={idx === 0}
                    aria-label={`Move ${card.lines[0].text} up`}
                    className="p-1 rounded-md disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: '#EEF1FB', color: '#4F6EF7' }}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button" onClick={() => moveCard(idx, 1)} disabled={idx === program.length - 1}
                    aria-label={`Move ${card.lines[0].text} down`}
                    className="p-1 rounded-md disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: '#EEF1FB', color: '#4F6EF7' }}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  {!level.lockOrderOnly && (
                    <button
                      type="button" onClick={() => removeCard(id)}
                      aria-label={`Remove ${card.lines[0].text}`}
                      className="p-1 rounded-md focus-visible:outline-none focus-visible:ring-2"
                      style={{ background: '#FDECEC', color: '#D64545' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {level.postLines?.map((l) => <CodeLine key={l.id} text={l.text} active={activeLineId === l.id} faded />)}
      </SFCard>

      {/* TOOLBOX — available statement cards to add (hidden for reorder-only levels) */}
      {!level.lockOrderOnly && available.length > 0 && (
        <SFCard variant="elevated" className="p-3">
          <p className="text-xs font-bold mb-2" style={{ color: '#5A6078' }}>Toolbox — tap a card to add it</p>
          <div className="flex flex-col gap-1.5">
            {available.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => addCard(card.id)}
                aria-label={`Add ${card.lines[0].text} to program`}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2"
                style={{ background: '#FFFFFF', border: `1px solid ${LAB_COLOR}44` }}
              >
                <span className="font-mono text-sm truncate" style={{ color: '#1A1D2B' }}>
                  {card.lines.map((l) => l.text).join('  ')}
                </span>
                <Plus className="w-4 h-4 shrink-0" style={{ color: LAB_COLOR }} />
              </button>
            ))}
          </div>
        </SFCard>
      )}

      {/* CONSOLE — the real animated output of running the program */}
      <div
        className="rounded-xl p-3 font-mono text-sm"
        style={{ background: '#0D1117', border: '1px solid #22283A', minHeight: '96px' }}
        role="log"
        aria-live="polite"
        aria-label="Program output console"
      >
        <div className="flex items-center gap-1.5 mb-2 text-xs" style={{ color: '#8B949E' }}>
          <Terminal className="w-3.5 h-3.5" /> console
          {running && <span style={{ color: LAB_COLOR }}>running…</span>}
        </div>
        {!run && <div style={{ color: '#8B949E' }}>Press Run to execute your program.</div>}
        {run && consoleOut.length === 0 && !running && (
          <div style={{ color: '#8B949E' }}>(no output)</div>
        )}
        {consoleOut.map((line, i) => (
          <motion.div
            key={i}
            initial={prefersReducedMotion ? false : { opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ color: '#3FB950' }}
          >
            &gt; {line}
          </motion.div>
        ))}
        {running && <span style={{ color: LAB_COLOR }}>▍</span>}

        {/* live variable state during the run */}
        {envEntries.length > 0 && (
          <div className="mt-3 pt-2 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid #22283A' }}>
            {envEntries.map(([k, v]) => (
              <span
                key={k}
                className="text-xs px-2 py-0.5 rounded-md"
                style={{ background: '#1B2130', color: '#C9D4E5' }}
              >
                {k} = <strong style={{ color: '#E6EDF3' }}>{fmt(v)}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FEEDBACK after a run finishes replaying */}
      <AnimatePresence>
        {atEnd && run && (
          run.matched ? (
            <FeedbackPopup
              key="ok" type="correct"
              message={`Program runs! ${run.stars}⭐`}
              explanation="Your output matches the goal exactly. Nicely coded."
            />
          ) : run.infinite ? (
            <motion.div
              key="inf" role="alert"
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: '#FDECEC', border: '1px solid #F3B6B6' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#D64545' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#D64545' }}>
                  ♻️ Infinite loop! Sparky yanked the plug.
                </p>
                <p className="text-xs mt-1" style={{ color: '#7A2E2E' }}>
                  The loop condition never became false — the loop variable never changed, so it would run forever. {level.hints[Math.min(wrongRuns, level.hints.length - 1)]}
                </p>
              </div>
            </motion.div>
          ) : (
            <FeedbackPopup
              key="wrong" type="wrong"
              message="That output doesn't match the goal yet."
              explanation={`Compare your console to the goal, then reorder. Tip: ${level.hints[Math.min(wrongRuns, level.hints.length - 1)]}`}
            />
          )
        )}
      </AnimatePresence>

      {/* CONTROLS */}
      <div className="flex gap-2">
        <SFButton
          variant="primary" className="flex-1"
          onClick={handleRun}
          disabled={program.length === 0 || running}
        >
          {atEnd && run?.matched
            ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Passed!</>
            : <><Play className="w-4 h-4 mr-2" /> Run</>}
        </SFButton>
        <SFButton variant="outline" onClick={resetLevel} aria-label="Reset program">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit to level map">✕</SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function CodeBlocksGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;

  const levels = useMemo(() => LEVELS.filter((l) => l.bands.includes(band)), [band]);
  const levelConfigs = useMemo(() => levels.map(toLevelConfig), [levels]);
  const levelById = useMemo(() => {
    const m: Record<number, Level> = {};
    levels.forEach((l) => { m[l.id] = l; });
    return m;
  }, [levels]);

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = results.length * 3;
    const ratio = maxStars > 0 ? totalStars / maxStars : 0;
    awardXP(Math.round(totalXP));
    completeGame('code-blocks', ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Code Blocks" color="#E68E28" labNum={9}>
      <GameLevelSystem
        gameTitle="Code Blocks"
        gameEmoji="💻"
        labColor={LAB_COLOR}
        levels={levelConfigs}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={levelById[level.id]} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
