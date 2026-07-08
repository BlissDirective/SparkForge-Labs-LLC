// ════════════════════════════════════════════════════════════════════════
// VIBE CODER — Lab 9 (Code Lab) — the real 2026 prompt → generate → verify loop
// ════════════════════════════════════════════════════════════════════════
// Rebuild plan §II.7 NEW-3. The kid DESCRIBES a mini-app in plain language, a
// scripted "AI" GENERATES a small block program that is buggy on purpose, the
// app RUNS and visibly misbehaves, and the kid VERIFIES: reads the blocks, finds
// the bug, and either fixes the block or re-prompts the AI to regenerate it.
//
// The lesson of 2026 engineering: generation is cheap, verification is the skill.
//
// Everything here is HONEST. There is a real, tiny, deterministic interpreter
// over the block types (set / on-tap / if / show). The deliberate bug genuinely
// causes the wrong output; the fix genuinely fixes it. Nothing is faked — the
// preview you tap and the "Run" verdict use the exact same evaluator.
//
// Bands: B = one obvious bug, fix-the-block path. C = subtler bugs + the
// re-prompt path (add a clarifying instruction; the AI regenerates a corrected
// version) plus a fifth, slightly bigger app.

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useReducedMotion, motion, AnimatePresence } from 'motion/react';
import {
  Bot, Wand2, Play, RotateCcw, Bug, Check, X, ChevronRight, Hand, Sparkles,
  Wrench, MessageSquarePlus, Target, Terminal, Lightbulb, AlertTriangle,
  CheckCircle2, Star, Hash, MessageCircle, Trophy, ToggleLeft, PartyPopper,
  Loader2, type LucideIcon,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';

// ── palette (dark surface, honest inline colors per contract) ──────────────
const ACCENT = '#E68E28';
const BG = '#0E1428';
const CARD = '#141B33';
const INK = '#EAF0F6';
const MUTED = '#9AA4BE';
const GOOD = '#46D07F';
const BAD = '#F26D6D';
const LINE = '#26304F';
const STEP_MS = 420;

// ════════════════════════════════════════════════════════════════════════
// THE INTERPRETER — a small honest evaluator over toy event-driven apps
// ════════════════════════════════════════════════════════════════════════
type Val = number | string | boolean;

type Expr =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'var'; name: string }
  | { t: 'add'; a: Expr; b: Expr }
  | { t: 'concat'; parts: Expr[] }
  | { t: 'not'; e: Expr }
  | { t: 'cond'; cond: Cond; then: Expr; els: Expr };

type Cond =
  | { t: 'truthy'; e: Expr }
  | { t: 'cmp'; op: '>=' | '<' | '=='; a: Expr; b: Expr };

type Stmt = { kind: 'set'; target: string; value: Expr };

interface Program { setup: Stmt[]; onTap: Stmt[]; display: Expr }

const fmt = (v: Val): string =>
  typeof v === 'number' ? (Number.isNaN(v) ? 'NaN' : String(v))
    : typeof v === 'boolean' ? String(v)
      : v;

function ev(e: Expr, env: Record<string, Val>): Val {
  switch (e.t) {
    case 'num': return e.v;
    case 'str': return e.v;
    case 'bool': return e.v;
    case 'var': return env[e.name];
    case 'not': return !truthy(ev(e.e, env));
    case 'concat': return e.parts.map((p) => fmt(ev(p, env))).join('');
    case 'cond': return evalCond(e.cond, env) ? ev(e.then, env) : ev(e.els, env);
    case 'add': {
      const a = ev(e.a, env);
      const b = ev(e.b, env);
      if (typeof a === 'number' && typeof b === 'number') return a + b;
      return fmt(a) + fmt(b);
    }
  }
}

const truthy = (v: Val | undefined): boolean => v === true || (typeof v === 'number' && v !== 0) || (typeof v === 'string' && v.length > 0);

function evalCond(c: Cond, env: Record<string, Val>): boolean {
  if (c.t === 'truthy') return truthy(ev(c.e, env));
  const a = ev(c.a, env);
  const b = ev(c.b, env);
  switch (c.op) {
    case '==': return a === b;
    case '>=': return Number(a) >= Number(b);
    case '<': return Number(a) < Number(b);
  }
}

// Run a program through a scripted number of taps, recording the display after
// setup and after every tap. This is the honest heart of the game.
function simulate(prog: Program, taps: number): { seq: string[]; env: Record<string, Val> } {
  const env: Record<string, Val> = {};
  for (const s of prog.setup) env[s.target] = ev(s.value, env);
  const seq = [fmt(ev(prog.display, env))];
  for (let i = 0; i < taps; i++) {
    for (const s of prog.onTap) env[s.target] = ev(s.value, env);
    seq.push(fmt(ev(prog.display, env)));
  }
  return { seq, env: { ...env } };
}

const arrEq = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const sym = (op: string) => (op === '>=' ? '≥' : op === '==' ? '=' : op);

// ════════════════════════════════════════════════════════════════════════
// LEVEL DATA — 5 genuinely distinct tiny apps, each with ONE real bug
// ════════════════════════════════════════════════════════════════════════
type Params = Record<string, number | string | boolean>;

interface CodeTok { text: string; hl?: boolean; dim?: boolean; indent?: number }
interface PromptOpt { id: string; text: string; correct: boolean }
interface ClarifyOpt { id: string; text: string; correct: boolean; patch: Params }
interface FixOpt { value: number | string | boolean; label: string }

interface VLevel {
  id: number;
  name: string;
  Icon: LucideIcon;
  bands: ('B' | 'C')[];
  taps: number;
  xpReward: number;
  spec: string;
  concept: string;
  hint: string;
  prompt: PromptOpt[];
  buggy: Params;
  correct: Params;
  build: (p: Params) => Program;
  code: (p: Params) => CodeTok[];
  fix: { label: string; key: string; options: FixOpt[] };
  clarify: { label: string; options: ClarifyOpt[] };
}

const V = (name: string): Expr => ({ t: 'var', name });
const N = (v: number): Expr => ({ t: 'num', v });
const S = (v: string): Expr => ({ t: 'str', v });

const LEVELS: VLevel[] = [
  // ── L1: COUNTER — off-by-one (obvious) ─────────────────────────────────
  {
    id: 1, name: 'Tap Counter', Icon: Hash, bands: ['B', 'C'], taps: 3, xpReward: 40,
    spec: 'Every tap adds 1. After 3 taps the screen should read “Count: 3”.',
    concept: 'The AI generated code instantly — but instant is not the same as correct. Run it and watch what it actually does.',
    hint: 'Count how much the number jumps on each tap. The goal is +1, not +2.',
    prompt: [
      { id: 'p1', text: 'Make a counter that adds 1 each time I tap.', correct: true },
      { id: 'p2', text: 'Make a drawing app I can paint on.', correct: false },
      { id: 'p3', text: 'Make a timer that counts down.', correct: false },
    ],
    buggy: { step: 2 }, correct: { step: 1 },
    build: (p) => ({
      setup: [{ kind: 'set', target: 'count', value: N(0) }],
      onTap: [{ kind: 'set', target: 'count', value: { t: 'add', a: V('count'), b: N(Number(p.step)) } }],
      display: { t: 'concat', parts: [S('Count: '), V('count')] },
    }),
    code: (p) => [
      { text: 'set count = 0' },
      { text: 'on tap:', dim: true },
      { text: `count = count + ${p.step}`, hl: true, indent: 1 },
      { text: 'show "Count: " + count' },
    ],
    fix: {
      label: 'Fix the block — how much should each tap add?', key: 'step',
      options: [{ value: 1, label: 'count + 1' }, { value: 2, label: 'count + 2' }, { value: 5, label: 'count + 5' }],
    },
    clarify: {
      label: 'Re-prompt the AI — add a clarifying instruction:',
      options: [
        { id: 'c1', text: '“Add exactly one each tap, no more.”', correct: true, patch: { step: 1 } },
        { id: 'c2', text: '“Count up as fast as you can.”', correct: false, patch: {} },
        { id: 'c3', text: '“Use a nice bright colour.”', correct: false, patch: {} },
      ],
    },
  },

  // ── L2: GREETING — the value vs the literal word ───────────────────────
  {
    id: 2, name: 'Name Greeter', Icon: MessageCircle, bands: ['B', 'C'], taps: 0, xpReward: 40,
    spec: 'The app should greet Sam by name: “Hello, Sam!”.',
    concept: 'The AI put the WORD “name” in the message instead of the value stored in the name variable. Verify what it printed.',
    hint: 'The screen shows the literal word “name”. You want the value inside the name variable.',
    prompt: [
      { id: 'p1', text: 'Greet me by my name.', correct: true },
      { id: 'p2', text: 'Tell me a random joke.', correct: false },
      { id: 'p3', text: 'Play my favourite song.', correct: false },
    ],
    buggy: { nameSource: 'literal' }, correct: { nameSource: 'variable' },
    build: (p) => ({
      setup: [{ kind: 'set', target: 'name', value: S('Sam') }],
      onTap: [],
      display: p.nameSource === 'variable'
        ? { t: 'concat', parts: [S('Hello, '), V('name'), S('!')] }
        : S('Hello, name!'),
    }),
    code: (p) => (p.nameSource === 'variable'
      ? [{ text: 'set name = "Sam"' }, { text: 'show "Hello, " + name + "!"', hl: true }]
      : [{ text: 'set name = "Sam"' }, { text: 'show "Hello, name!"', hl: true }]),
    fix: {
      label: 'Fix the block — what comes after “Hello,”?', key: 'nameSource',
      options: [{ value: 'variable', label: 'the name value' }, { value: 'literal', label: 'the word "name"' }],
    },
    clarify: {
      label: 'Re-prompt the AI — add a clarifying instruction:',
      options: [
        { id: 'c1', text: '“Use my actual name value, not the word name.”', correct: true, patch: { nameSource: 'variable' } },
        { id: 'c2', text: '“Say hi instead of hello.”', correct: false, patch: {} },
        { id: 'c3', text: '“Add another exclamation mark.”', correct: false, patch: {} },
      ],
    },
  },

  // ── L3: SCORE + IF — inverted condition ────────────────────────────────
  {
    id: 3, name: 'Win at Ten', Icon: Trophy, bands: ['B', 'C'], taps: 2, xpReward: 50,
    spec: 'Each tap adds 5 points. It should only say “You win!” once the score reaches 10.',
    concept: 'The AI flipped the comparison. It celebrates while the score is BELOW 10 instead of at 10 or more. Run it and read the check.',
    hint: 'The if-check is backwards. “You win!” should appear when the score is 10 or MORE, not less.',
    prompt: [
      { id: 'p1', text: 'Give 5 points per tap and say “You win!” at 10.', correct: true },
      { id: 'p2', text: 'Show me today’s weather.', correct: false },
      { id: 'p3', text: 'Make a shopping to-do list.', correct: false },
    ],
    buggy: { cmp: '<' }, correct: { cmp: '>=' },
    build: (p) => ({
      setup: [{ kind: 'set', target: 'score', value: N(0) }],
      onTap: [{ kind: 'set', target: 'score', value: { t: 'add', a: V('score'), b: N(5) } }],
      display: {
        t: 'cond',
        cond: { t: 'cmp', op: p.cmp as '>=' | '<', a: V('score'), b: N(10) },
        then: S('You win!'),
        els: { t: 'concat', parts: [S('Score: '), V('score')] },
      },
    }),
    code: (p) => [
      { text: 'set score = 0' },
      { text: 'on tap:', dim: true },
      { text: 'score = score + 5', indent: 1 },
      { text: `if score ${sym(String(p.cmp))} 10:`, hl: true },
      { text: 'show "You win!"', indent: 1 },
      { text: 'else:' },
      { text: 'show "Score: " + score', indent: 1 },
    ],
    fix: {
      label: 'Fix the block — when should it say “You win!”?', key: 'cmp',
      options: [{ value: '>=', label: 'score ≥ 10 (10 or more)' }, { value: '<', label: 'score < 10 (less than 10)' }],
    },
    clarify: {
      label: 'Re-prompt the AI — add a clarifying instruction:',
      options: [
        { id: 'c1', text: '“Only say You win when the score is 10 or more.”', correct: true, patch: { cmp: '>=' } },
        { id: 'c2', text: '“Celebrate as early as possible.”', correct: false, patch: {} },
        { id: 'c3', text: '“Count by tens instead.”', correct: false, patch: {} },
      ],
    },
  },

  // ── L4: TOGGLE — missing update ────────────────────────────────────────
  {
    id: 4, name: 'Light Switch', Icon: ToggleLeft, bands: ['B', 'C'], taps: 3, xpReward: 50,
    spec: 'The light starts OFF. Each tap flips it: OFF → ON → OFF → ON.',
    concept: 'The AI wrote a tap handler that always sets the light to OFF, so nothing ever changes. Tap the preview — it is stuck.',
    hint: 'On each tap the light should become the OPPOSITE of what it was, not always off.',
    prompt: [
      { id: 'p1', text: 'A light switch that toggles on and off when tapped.', correct: true },
      { id: 'p2', text: 'A calculator with big buttons.', correct: false },
      { id: 'p3', text: 'A photo gallery I can scroll.', correct: false },
    ],
    buggy: { flip: 'stuck' }, correct: { flip: 'toggle' },
    build: (p) => ({
      setup: [{ kind: 'set', target: 'on', value: { t: 'bool', v: false } }],
      onTap: [{ kind: 'set', target: 'on', value: p.flip === 'toggle' ? { t: 'not', e: V('on') } : { t: 'bool', v: false } }],
      display: { t: 'cond', cond: { t: 'truthy', e: V('on') }, then: S('Light: ON'), els: S('Light: OFF') },
    }),
    code: (p) => [
      { text: 'set on = false' },
      { text: 'on tap:', dim: true },
      { text: p.flip === 'toggle' ? 'on = not on' : 'on = false', hl: true, indent: 1 },
      { text: 'show (on ? "Light: ON" : "Light: OFF")' },
    ],
    fix: {
      label: 'Fix the block — what should each tap do to “on”?', key: 'flip',
      options: [{ value: 'toggle', label: 'on = not on  (flip it)' }, { value: 'stuck', label: 'on = false  (always off)' }],
    },
    clarify: {
      label: 'Re-prompt the AI — add a clarifying instruction:',
      options: [
        { id: 'c1', text: '“Each tap should switch the light to the opposite.”', correct: true, patch: { flip: 'toggle' } },
        { id: 'c2', text: '“Always turn the light off.”', correct: false, patch: {} },
        { id: 'c3', text: '“Start the light already on.”', correct: false, patch: {} },
      ],
    },
  },

  // ── L5: BIGGER APP (band C) — subtle off-by-one / sticky condition ──────
  {
    id: 5, name: 'Nice at Three', Icon: PartyPopper, bands: ['C'], taps: 4, xpReward: 60,
    spec: 'Each tap adds 1. It should say “Nice, three!” at exactly 3, then keep counting: 4, 5…',
    concept: 'This bug is subtle. The AI used “3 or more”, so once you pass 3 the app celebrates FOREVER. Run past 3 to catch it.',
    hint: 'The celebration is sticky. It should fire only at exactly 3, then return to normal counting.',
    prompt: [
      { id: 'p1', text: 'A tap counter that says “Nice, three!” exactly at 3.', correct: true },
      { id: 'p2', text: 'A music player with a playlist.', correct: false },
      { id: 'p3', text: 'A monthly calendar view.', correct: false },
    ],
    buggy: { op: '>=' }, correct: { op: '==' },
    build: (p) => ({
      setup: [{ kind: 'set', target: 'count', value: N(0) }],
      onTap: [{ kind: 'set', target: 'count', value: { t: 'add', a: V('count'), b: N(1) } }],
      display: {
        t: 'cond',
        cond: { t: 'cmp', op: p.op as '>=' | '==', a: V('count'), b: N(3) },
        then: S('Nice, three!'),
        els: { t: 'concat', parts: [S('Count: '), V('count')] },
      },
    }),
    code: (p) => [
      { text: 'set count = 0' },
      { text: 'on tap:', dim: true },
      { text: 'count = count + 1', indent: 1 },
      { text: `if count ${sym(String(p.op))} 3:`, hl: true },
      { text: 'show "Nice, three!"', indent: 1 },
      { text: 'else:' },
      { text: 'show "Count: " + count', indent: 1 },
    ],
    fix: {
      label: 'Fix the block — when should it celebrate?', key: 'op',
      options: [{ value: '==', label: 'count is exactly 3' }, { value: '>=', label: 'count is 3 or more' }],
    },
    clarify: {
      label: 'Re-prompt the AI — add a clarifying instruction:',
      options: [
        { id: 'c1', text: '“Say Nice only the moment it equals three, then keep counting.”', correct: true, patch: { op: '==' } },
        { id: 'c2', text: '“Celebrate from 3 onward.”', correct: false, patch: {} },
        { id: 'c3', text: '“Stop counting at 3.”', correct: false, patch: {} },
      ],
    },
  },
];

// ════════════════════════════════════════════════════════════════════════
// SMALL UI PARTS
// ════════════════════════════════════════════════════════════════════════
function Coach({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: '#1B2140', border: `1px solid ${LINE}` }}>
      <span className="grid place-items-center rounded-lg shrink-0" style={{ width: 30, height: 30, background: `${ACCENT}22` }}>
        <Bot className="w-4 h-4" style={{ color: ACCENT }} aria-hidden />
      </span>
      <p className="text-xs leading-relaxed" style={{ color: INK }}>
        <span className="font-semibold" style={{ color: ACCENT }}>Sparky:</span> {text}
      </p>
    </div>
  );
}

function CodePanel({ toks }: { toks: CodeTok[] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0A0F1F', border: `1px solid ${LINE}` }}>
      <div className="flex items-center gap-1.5 px-3 py-2 text-xs" style={{ color: MUTED, borderBottom: `1px solid ${LINE}` }}>
        <Wand2 className="w-3.5 h-3.5" style={{ color: ACCENT }} aria-hidden /> AI-generated blocks
      </div>
      <div className="p-3 font-mono text-sm space-y-1">
        {toks.map((tk, i) => (
          <div
            key={i}
            className="rounded-md px-2 py-1 flex items-center gap-2"
            style={{
              paddingLeft: 8 + (tk.indent ?? 0) * 18,
              background: tk.hl ? `${ACCENT}22` : 'transparent',
              borderLeft: `3px solid ${tk.hl ? ACCENT : 'transparent'}`,
              color: tk.dim ? MUTED : tk.hl ? '#FFE0BA' : '#C9D4E5',
            }}
          >
            {tk.hl && <Bug className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} aria-label="suspicious line" />}
            <span>{tk.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL STAGE — describe → generate → run → verify (fix or re-prompt)
// ════════════════════════════════════════════════════════════════════════
function LevelStage({
  level, band, index, total, onDone, onWrong,
}: {
  level: VLevel; band: 'B' | 'C'; index: number; total: number;
  onDone: (xp: number) => void; onWrong: () => void;
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'describe' | 'code'>('describe');
  const [params, setParams] = useState<Params>(level.buggy);
  const [tapCount, setTapCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [verdict, setVerdict] = useState<null | 'pass' | 'fail'>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [coach, setCoach] = useState('I generated the code in a blink. But generating is the easy part — your job is to check it actually works. Hit Run and watch.');
  const evaluated = useRef(false);

  const expected = useMemo(() => simulate(level.build(level.correct), level.taps).seq, [level]);
  const prog = useMemo(() => level.build(params), [level, params]);
  const sim = useMemo(() => simulate(prog, tapCount), [prog, tapCount]);
  const current = sim.seq[sim.seq.length - 1];
  const isFixed = arrEq(simulate(prog, level.taps).seq, expected);

  // reset transient run state whenever the code changes
  const resetRun = useCallback(() => {
    setTapCount(0); setPlaying(false); setVerdict(null); evaluated.current = false;
  }, []);

  // ── run: replay the scripted taps, then judge ──
  useEffect(() => {
    if (!playing) return;
    if (tapCount < level.taps) {
      const t = setTimeout(() => setTapCount((c) => c + 1), reduced ? 0 : STEP_MS);
      return () => clearTimeout(t);
    }
    // reached the end of the scripted run
    if (evaluated.current) return;
    evaluated.current = true;
    setPlaying(false);
    const produced = simulate(level.build(params), level.taps).seq;
    if (arrEq(produced, expected)) {
      setVerdict('pass');
      setCoach('Verified! The output matches the goal exactly. That check is the real engineering — nice work.');
    } else {
      setVerdict('fail');
      onWrong();
      setCoach(`Still off. ${level.hint}`);
    }
  }, [playing, tapCount, level, params, expected, reduced, onWrong]);

  // ── advance after a passing run ──
  useEffect(() => {
    if (verdict !== 'pass') return;
    const t = setTimeout(() => onDone(level.xpReward), reduced ? 400 : 1500);
    return () => clearTimeout(t);
  }, [verdict, level.xpReward, onDone, reduced]);

  const run = useCallback(() => {
    setVerdict(null); setTapCount(0); evaluated.current = false; setPlaying(true);
    setCoach('Running it now — watch the preview and the output.');
  }, []);

  const tapOnce = useCallback(() => {
    if (playing) return;
    setVerdict(null); evaluated.current = false;
    setTapCount((c) => Math.min(c + 1, level.taps));
  }, [playing, level.taps]);

  const applyFix = useCallback((value: number | string | boolean) => {
    setParams((p) => ({ ...p, [level.fix.key]: value }));
    resetRun();
    setCoach('You edited the block. Now Run it again to verify the fix actually works.');
  }, [level.fix.key, resetRun]);

  const applyClarify = useCallback((opt: ClarifyOpt) => {
    if (!opt.correct) {
      onWrong();
      setCoach('That instruction did not fix the bug. Compare the code to the goal and try a clearer request.');
      return;
    }
    setRegenerating(true);
    setCoach('Good clarification — regenerating the code from your clearer request…');
    setTimeout(() => {
      setParams((p) => ({ ...p, ...opt.patch }));
      setRegenerating(false);
      resetRun();
      setCoach('New version generated. Verify it by running it.');
    }, reduced ? 200 : 750);
  }, [onWrong, resetRun, reduced]);

  const startCode = useCallback((opt: PromptOpt) => {
    if (opt.correct) { setPhase('code'); return; }
    setCoach('That request is for a different app. Pick the one that matches this level’s goal.');
  }, []);

  // ═══ DESCRIBE PHASE ═══
  if (phase === 'describe') {
    return (
      <div className="space-y-4">
        <StageHeader level={level} index={index} total={total} />
        <div className="rounded-2xl p-4 space-y-3" style={{ background: CARD, border: `1px solid ${LINE}` }}>
          <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: ACCENT }}>
            <MessageSquarePlus className="w-4 h-4" aria-hidden /> Step 1 — describe your app in plain words
          </p>
          <p className="text-sm" style={{ color: MUTED }}>Tell the AI what to build. Pick the request that matches the goal:</p>
          <div className="rounded-lg p-2.5 text-xs flex items-start gap-2" style={{ background: `${ACCENT}14`, color: INK }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ACCENT }} aria-hidden />
            <span><span className="font-semibold">Goal:</span> {level.spec}</span>
          </div>
          <div className="flex flex-col gap-2" role="group" aria-label="Choose a request">
            {level.prompt.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => startCode(o)}
                className="text-left rounded-xl px-3 py-2.5 text-sm flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2"
                style={{ background: BG, border: `1px solid ${LINE}`, color: INK }}
              >
                <span>{o.text}</span>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
              </button>
            ))}
          </div>
        </div>
        <Coach text="Describing what you want is quick. The hard, valuable part comes next: checking what the AI actually gives back." />
      </div>
    );
  }

  // ═══ CODE / RUN / VERIFY PHASE ═══
  const passed = verdict === 'pass';
  return (
    <div className="space-y-4">
      <StageHeader level={level} index={index} total={total} />

      {/* GOAL */}
      <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}44` }}>
        <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ACCENT }} aria-hidden />
        <div className="text-xs" style={{ color: INK }}>
          <span className="font-semibold">Goal:</span> {level.spec}
          <div className="mt-1.5 font-mono flex flex-wrap gap-1" style={{ color: MUTED }}>
            <span>expected:</span>
            {expected.map((s, i) => (
              <span key={i} className="rounded px-1.5 py-0.5" style={{ background: BG, color: GOOD }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* GENERATED CODE */}
      <div className="relative">
        <CodePanel toks={level.code(params)} />
        <AnimatePresence>
          {regenerating && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center rounded-xl"
              style={{ background: 'rgba(10,15,31,0.82)' }}
              role="status" aria-live="polite"
            >
              <span className="flex items-center gap-2 text-sm" style={{ color: ACCENT }}>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Regenerating…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* THE LIVE APP PREVIEW + OUTPUT LOG */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* preview screen — a real, tappable mini-app */}
        <div className="rounded-2xl p-3 flex flex-col" style={{ background: '#070B16', border: `1px solid ${LINE}` }}>
          <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: MUTED }}>
            <Play className="w-3.5 h-3.5" aria-hidden /> app preview
          </p>
          <div
            className="flex-1 grid place-items-center rounded-xl px-3 py-6 text-center"
            style={{ background: BG, border: `1px solid ${LINE}`, minHeight: 76 }}
            role="status" aria-live="polite" aria-label="App preview screen"
          >
            <span className="font-semibold text-lg" style={{ color: INK }}>{current}</span>
          </div>
          {level.taps > 0 && (
            <button
              type="button"
              onClick={tapOnce}
              disabled={playing || tapCount >= level.taps}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40"
              style={{ background: `${ACCENT}26`, color: ACCENT, border: `1px solid ${ACCENT}66` }}
              aria-label="Tap the app"
            >
              <Hand className="w-4 h-4" aria-hidden /> Tap ({tapCount}/{level.taps})
            </button>
          )}
        </div>

        {/* output log — every display the run produced */}
        <div className="rounded-2xl p-3" style={{ background: '#070B16', border: `1px solid ${LINE}` }}>
          <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: MUTED }}>
            <Terminal className="w-3.5 h-3.5" aria-hidden /> output {playing && <span style={{ color: ACCENT }}>running…</span>}
          </p>
          <div className="font-mono text-xs space-y-1" role="log" aria-live="polite" aria-label="Program output">
            {sim.seq.map((s, i) => {
              const ok = s === expected[i];
              return (
                <div key={i} className="flex items-center gap-1.5" style={{ color: ok ? GOOD : BAD }}>
                  <span style={{ color: MUTED }}>{i === 0 ? 'start' : `tap ${i}`}</span>
                  <span>›</span>
                  <span>{s}</span>
                  {i <= tapCount && (ok
                    ? <Check className="w-3 h-3" aria-label="matches goal" />
                    : <X className="w-3 h-3" aria-label="wrong" />)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VERDICT */}
      <AnimatePresence>
        {verdict && (
          <motion.div
            key={verdict}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: passed ? `${GOOD}18` : `${BAD}18`, border: `1px solid ${passed ? GOOD : BAD}55` }}
            role="alert"
          >
            {passed
              ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: GOOD }} aria-hidden />
              : <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: BAD }} aria-hidden />}
            <p className="text-sm" style={{ color: passed ? GOOD : BAD }}>
              {passed ? 'Verified — output matches the goal. Level complete!' : 'The output does not match the goal yet. Read the highlighted block, then fix or re-prompt.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIX (band B) or RE-PROMPT (band C) */}
      {!passed && (
        <div className="rounded-2xl p-3 space-y-2" style={{ background: CARD, border: `1px solid ${LINE}` }}>
          {band === 'B' ? (
            <>
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: ACCENT }}>
                <Wrench className="w-4 h-4" aria-hidden /> {level.fix.label}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Fix the block">
                {level.fix.options.map((o) => {
                  const active = params[level.fix.key] === o.value;
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      aria-pressed={active}
                      onClick={() => applyFix(o.value)}
                      className="rounded-lg px-3 py-1.5 text-sm font-mono focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        background: active ? `${ACCENT}26` : BG,
                        border: `1px solid ${active ? ACCENT : LINE}`,
                        color: active ? ACCENT : INK,
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: ACCENT }}>
                <MessageSquarePlus className="w-4 h-4" aria-hidden /> {level.clarify.label}
              </p>
              <div className="flex flex-col gap-2" role="group" aria-label="Re-prompt the AI">
                {level.clarify.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => applyClarify(o)}
                    className="text-left rounded-xl px-3 py-2 text-sm flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: BG, border: `1px solid ${LINE}`, color: INK }}
                  >
                    <span>{o.text}</span>
                    <Sparkles className="w-4 h-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
                  </button>
                ))}
              </div>
              <p className="text-xs" style={{ color: MUTED }}>
                Prefer to edit directly? You can also fix the block: {' '}
                {level.fix.options.map((o) => (
                  <button
                    key={String(o.value)}
                    type="button"
                    onClick={() => applyFix(o.value)}
                    className="underline focus-visible:outline-none focus-visible:ring-2 mr-2"
                    style={{ color: params[level.fix.key] === o.value ? ACCENT : MUTED }}
                  >
                    {o.label}
                  </button>
                ))}
              </p>
            </>
          )}
        </div>
      )}

      <Coach text={coach} />

      {/* CONTROLS */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={run}
          disabled={playing || passed}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
          style={{ background: ACCENT, color: '#1A1206' }}
        >
          {passed ? <><CheckCircle2 className="w-4 h-4" aria-hidden /> Passed</>
            : isFixed && verdict === null ? <><Play className="w-4 h-4" aria-hidden /> Run to verify</>
              : <><Play className="w-4 h-4" aria-hidden /> Run</>}
        </button>
        <button
          type="button"
          onClick={resetRun}
          disabled={playing}
          className="rounded-xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
          style={{ background: BG, border: `1px solid ${LINE}`, color: MUTED }}
          aria-label="Reset the run"
        >
          <RotateCcw className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function StageHeader({ level, index, total }: { level: VLevel; index: number; total: number }) {
  const { Icon } = level;
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: INK }}>
        <span className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: `${ACCENT}22` }}>
          <Icon className="w-5 h-5" style={{ color: ACCENT }} aria-hidden />
        </span>
        {level.name}
      </h2>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>Level {index + 1} / {total}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function VibeCoderGame() {
  const { awardXP, completeGame } = useGameActions();
  const rawBand = useActiveChild()?.age_band || 'B';
  const band: 'B' | 'C' = rawBand === 'C' ? 'C' : 'B';

  const levels = useMemo(() => LEVELS.filter((l) => l.bands.includes(band)), [band]);

  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [stars, setStars] = useState(3);
  const wrongRef = useRef(0);
  const doneRef = useRef(false);

  const onWrong = useCallback(() => { wrongRef.current += 1; }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const w = wrongRef.current;
    const s = w === 0 ? 3 : w <= 2 ? 2 : 1;
    setStars(s);
    completeGame('vibe-coder', s);
    setFinished(true);
  }, [completeGame]);

  const onDone = useCallback((xp: number) => {
    awardXP(xp);
    setIdx((i) => {
      const next = i + 1;
      if (next >= levels.length) finish();
      return next;
    });
  }, [awardXP, levels.length, finish]);

  const level = levels[Math.min(idx, levels.length - 1)];

  return (
    <GameShell title="Vibe Coder" color="#E68E28" labNum={9}>
      <div className="max-w-2xl mx-auto p-4 rounded-3xl" style={{ background: BG, color: INK }}>
        {/* workflow banner */}
        <div className="mb-4 rounded-2xl p-3 flex items-center gap-2 text-xs" style={{ background: CARD, border: `1px solid ${LINE}`, color: MUTED }}>
          <Lightbulb className="w-4 h-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
          <span>
            <span className="font-semibold" style={{ color: INK }}>describe → generate → verify.</span>{' '}
            The AI writes code in seconds — your real skill is <span style={{ color: ACCENT }}>checking it works</span> and fixing what it got wrong.
          </span>
        </div>

        {finished ? (
          <div className="text-center py-10 space-y-4" role="status" aria-live="polite">
            <PartyPopper className="w-12 h-12 mx-auto" style={{ color: ACCENT }} aria-hidden />
            <h2 className="text-2xl font-bold" style={{ color: INK }}>All apps verified!</h2>
            <div className="flex items-center justify-center gap-1.5" aria-label={`${stars} out of 3 stars`}>
              {[1, 2, 3].map((n) => (
                <Star key={n} className="w-8 h-8" style={{ color: n <= stars ? ACCENT : LINE }} fill={n <= stars ? ACCENT : 'none'} aria-hidden />
              ))}
            </div>
            <p className="text-sm max-w-md mx-auto" style={{ color: MUTED }}>
              You shipped {levels.length} working mini-apps by catching and fixing the AI’s bugs. That verify-and-fix loop is exactly how real 2026 engineers work — generation is cheap, verification is the skill.
            </p>
          </div>
        ) : (
          <LevelStage
            key={level.id}
            level={level}
            band={band}
            index={idx}
            total={levels.length}
            onDone={onDone}
            onWrong={onWrong}
          />
        )}
      </div>
    </GameShell>
  );
}
