// ════════════════════════════════════════════════════════════════════════
// HUMAN vs MACHINE v5 — Lab 1 — "2026 Reality Check" game show
// ════════════════════════════════════════════════════════════════════════
// The old game was a two-bin drag-sort ("Humans win" / "Machines win"), a
// near-clone of Time Machine that taught a confident falsehood: that modern
// tasks split cleanly into human OR machine wins. In 2026 that is wrong —
// most real work is COMPLEMENTARY.
//
// New mechanic: THREE bins — Humans, Machines, and Better Together. The child
// commits a task to a bin, and only THEN a "2026 Reality Check" card flips up
// showing how that task actually works today (e.g. "AI drafts the story, a
// human picks the ending"). Sparky hosts as a game-show referee between a kid
// avatar and a robot contestant. Most modern tasks are legitimately "Better
// Together" — the reality-check cards are the payoff, never a gotcha.
//
// 5 real rounds (not 10 near-identical ones): foundational obvious calls →
// genuinely ambiguous 2026 calls. Task bank refreshed for 2026 (agents,
// generation, code, medicine, art).
//
// G1 honesty: the chip and its aria-label NEVER reveal the "right" bin. The
// reality-check reveal always comes AFTER the child commits.

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useReducedMotion, motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, Cpu, Users, User, GraduationCap, Target,
  RotateCcw, Sparkles, Trophy,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SparkyCore, type SparkyExpression } from '@/components/sparky';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import { GlowingTitle, ScoreDisplay } from '@/components/games/shared/GameVisualKit';
import type { AgeBand } from '@/types';

const LAB_COLOR = '#0FB8FA';

// ── The three bins. `together` is the star of the show. ──
type Bin = 'human' | 'machine' | 'together';

const BIN_META: Record<Bin, { label: string; short: string; color: string; Icon: typeof User }> = {
  human:    { label: 'Humans',         short: 'Humans',   color: '#F59E0B', Icon: User },
  machine:  { label: 'Machines',       short: 'Machines', color: '#4F6EF7', Icon: Cpu },
  together: { label: 'Better Together', short: 'Together', color: '#2ECC71', Icon: Users },
};
const BIN_ORDER: Bin[] = ['human', 'machine', 'together'];

// ════════════════════════════════════════════════════════════════════════
// TASK BANK — grouped into 5 rounds, foundational → genuinely ambiguous.
// `best` is the honest 2026 answer; `reality` is the payoff lesson shown
// AFTER a commit. `realityA` is a gentler wording for the youngest band.
// `diff` drives per-age-band task selection.
// ════════════════════════════════════════════════════════════════════════
interface Task {
  id: string;
  label: string;
  best: Bin;
  reality: string;
  realityA?: string;
  diff: 'easy' | 'mid' | 'hard';
}

interface Round {
  id: number;
  name: string;
  emoji: string;
  concept: string;
  tasks: Task[];
}

const ROUNDS: Round[] = [
  {
    id: 1,
    name: 'Warm-Up Calls',
    emoji: '🌟',
    concept: 'Some jobs really do belong to one side. Warm up on the easy ones.',
    tasks: [
      { id: 'hug', label: 'Hug a friend who is crying', best: 'human', diff: 'easy',
        reality: 'A machine can say "I\'m sorry" but real comfort — a hug and knowing exactly what your friend needs — is a human thing.',
        realityA: 'Only a person can give a real hug and truly cheer up a sad friend.' },
      { id: 'sum', label: 'Add up 5,000 numbers in a blink', best: 'machine', diff: 'easy',
        reality: 'Computers do giant sums instantly and never slip. This is an easy win for machines.',
        realityA: 'Computers can add up huge numbers super fast without mistakes.' },
      { id: 'memory', label: 'Remember every fact on the internet', best: 'machine', diff: 'easy',
        reality: 'Computer memory stores and recalls mountains of facts perfectly. People forget — machines do not.',
        realityA: 'Computers can remember way more than any person ever could.' },
      { id: 'brave', label: 'Be brave and say sorry first', best: 'human', diff: 'mid',
        reality: 'Owning a mistake and saying sorry takes real feelings and courage. A machine can print the words, but it does not mean them.',
        realityA: 'Saying a real "I\'m sorry" comes from a person\'s heart.' },
      { id: 'chess', label: 'Beat a grandmaster at chess', best: 'machine', diff: 'hard',
        reality: 'Chess engines have beaten every human champion for years. But note: the game is a closed world of fixed rules — that is exactly where machines shine.',
        realityA: 'Chess computers can beat the very best human players.' },
    ],
  },
  {
    id: 2,
    name: 'Everyday 2026',
    emoji: '🏠',
    concept: 'Real day-to-day tasks are usually a team effort. Watch for "Better Together".',
    tasks: [
      { id: 'party', label: 'Plan a surprise birthday party', best: 'together', diff: 'easy',
        reality: 'AI can brainstorm themes and a checklist in seconds — but YOU know what your friend actually loves. Best done together.',
        realityA: 'AI can list party ideas fast, and you pick the ones your friend will love. Team effort!' },
      { id: 'menu', label: 'Read a menu in another language', best: 'together', diff: 'mid',
        reality: 'AI translates the whole menu instantly, but a human catches the jokes, slang, and "is this spicy?" nuance. Together wins.',
        realityA: 'AI translates the words fast, and a person figures out the tricky bits. Together!' },
      { id: 'card', label: 'Write Grandma a thank-you card', best: 'human', diff: 'mid',
        reality: 'AI could draft it, but the whole point is that it is from YOU. The memories and love have to be real.',
        realityA: 'The best thank-you comes from your own heart, not a machine.' },
      { id: 'route', label: 'Find the fastest route across the city', best: 'machine', diff: 'easy',
        reality: 'Maps apps check live traffic on every street at once — a machine job through and through.',
        realityA: 'A map app checks all the roads at once to find the fastest way.' },
      { id: 'homework', label: 'Learn your times tables', best: 'together', diff: 'hard',
        reality: 'An AI tutor can explain and quiz you all day — but only YOUR practice and effort make it stick in your brain. You are a team.',
        realityA: 'An AI helper can quiz you, but you have to practice to really learn.' },
    ],
  },
  {
    id: 3,
    name: 'Making Art & Stories',
    emoji: '🎨',
    concept: 'AI can generate art and words in seconds — but taste, meaning and the big idea are human.',
    tasks: [
      { id: 'dragon', label: 'Make a picture of a dragon on a skateboard', best: 'together', diff: 'easy',
        reality: 'AI image tools draw it in seconds — but the wild idea, and picking the version that looks awesome, is you. Better together.',
        realityA: 'AI can draw it fast, and you dream up the idea and pick the best one. Team!' },
      { id: 'song', label: 'Write a song that makes people cry', best: 'together', diff: 'hard',
        reality: 'AI can draft lyrics and a tune, but real feeling — a memory, a heartbreak — comes from a human, who also decides what truly lands.',
        realityA: 'AI can help with the words, but the real feelings come from a person.' },
      { id: 'story', label: 'Dream up a story nobody has told before', best: 'human', diff: 'mid',
        reality: 'AI remixes stories it has already seen. A truly NEW idea — a surprising twist from your imagination — starts with a human.',
        realityA: 'A brand-new idea starts in a person\'s imagination.' },
      { id: 'color', label: 'Colour in 200 comic backgrounds', best: 'together', diff: 'mid',
        reality: 'AI can fill hundreds of backgrounds fast so the artist skips the boring part and focuses on the characters. A great team-up.',
        realityA: 'AI can colour lots of pages fast so the artist does the fun parts.' },
      { id: 'taste', label: 'Decide which drawing is the best', best: 'human', diff: 'hard',
        reality: 'Taste — "this one has heart, that one feels flat" — is a human judgment. AI can make options; it cannot truly know which one moves people.',
        realityA: 'People decide which art feels the best — that is a human choice.' },
    ],
  },
  {
    id: 4,
    name: 'Code & AI Agents',
    emoji: '🤖',
    concept: 'In 2026, AI agents do multi-step work — but a human decides what to build and checks it is right.',
    tasks: [
      { id: 'typo', label: 'Fix the same bug in 1,000 files', best: 'together', diff: 'easy',
        reality: 'An AI agent can sweep all 1,000 files in seconds — but a human decides WHICH fix is correct and checks nothing broke. Together.',
        realityA: 'An AI helper can change lots of files fast, and a person checks it is right.' },
      { id: 'whatbuild', label: 'Decide what app is worth building', best: 'human', diff: 'mid',
        reality: 'Knowing what people actually need — the "why" — is a human call. AI can build fast, but it cannot tell you what is worth building.',
        realityA: 'A person decides what would really help people. That is the big idea.' },
      { id: 'boring', label: 'Write the repetitive parts of code', best: 'together', diff: 'mid',
        reality: 'AI is great at the boilerplate so humans focus on the tricky, creative logic. A classic 2026 team-up.',
        realityA: 'AI can write the boring, repeated code so people do the clever parts.' },
      { id: 'agentflight', label: 'Let an AI agent book a real flight', best: 'together', diff: 'hard',
        reality: 'An agent can click through every step — but a human must approve spending the money and double-check the dates. Humans stay in the loop.',
        realityA: 'An AI can do the steps, but a person says "yes" before spending money.' },
      { id: 'safe', label: 'Make sure the code is safe and honest', best: 'human', diff: 'hard',
        reality: 'Deciding what is safe, fair, and honest is a human responsibility. AI can flag issues, but people are accountable for the call.',
        realityA: 'People are in charge of keeping things safe and fair.' },
    ],
  },
  {
    id: 5,
    name: 'Big Real-World Calls',
    emoji: '🔬',
    concept: 'The hardest 2026 questions — medicine, science, safety. Almost all are "Better Together".',
    tasks: [
      { id: 'xray', label: 'Spot a tiny tumour on an X-ray', best: 'together', diff: 'mid',
        reality: 'AI flags faint spots a tired eye can miss — but a doctor makes the diagnosis and tells the family with care. Together they are stronger than either alone.',
        realityA: 'AI can spot tiny things on the scan, and a doctor decides what it means. Team!' },
      { id: 'medicine', label: 'Discover a brand-new medicine', best: 'together', diff: 'hard',
        reality: 'AI can test millions of molecules to shortlist candidates — but human scientists design the study, run real trials, and judge if it is safe.',
        realityA: 'AI can try lots of ideas fast, and scientists check which ones really work.' },
      { id: 'treat', label: 'Choose a patient\'s treatment plan', best: 'human', diff: 'hard',
        reality: 'AI can suggest options from the data, but the final choice weighs the person\'s wishes, fears, and life — a human doctor\'s responsibility.',
        realityA: 'A doctor makes the final choice about how to help a patient.' },
      { id: 'snow', label: 'Drive a car through a snowstorm', best: 'together', diff: 'hard',
        reality: 'Self-driving AI handles steady roads well, but wild snow with weird surprises still needs human judgment ready to take over. For now, together.',
        realityA: 'A car computer helps drive, but a person watches for tricky snow. Together.' },
      { id: 'weather', label: 'Predict next week\'s weather', best: 'machine', diff: 'easy',
        reality: 'Weather models crunch satellite and history data far beyond any human — this really is a machine strength.',
        realityA: 'Computers use tons of data to guess the weather better than people can.' },
    ],
  },
];

// Build a LevelConfig list from the rounds (thresholds are informational —
// stars are computed from the honest-answer ratio in finishLevel).
const LEVELS: LevelConfig[] = ROUNDS.map((r, i) => ({
  id: r.id,
  name: r.name,
  description: r.concept,
  emoji: r.emoji,
  difficulty: (i < 1 ? 'easy' : i < 3 ? 'medium' : i < 4 ? 'hard' : 'expert') as LevelConfig['difficulty'],
  starThresholds: [40, 65, 82],
  xpReward: 50 + i * 20,
  isBonus: i === ROUNDS.length - 1,
}));

// ── Per-age-band task selection. Band A gets clearly-obvious tasks + simpler
// reality-checks; band C gets the genuinely ambiguous ones. ──
function tasksForBand(round: Round, band: AgeBand): Task[] {
  let pool: Task[];
  if (band === 'A') pool = round.tasks.filter((t) => t.diff !== 'hard');
  else if (band === 'C') pool = round.tasks.filter((t) => t.diff !== 'easy');
  else pool = round.tasks.slice();
  if (pool.length < 3) pool = round.tasks.slice(); // safety net
  return pool.slice(0, band === 'A' ? 4 : 5);
}

function realityText(task: Task, band: AgeBand): string {
  return band === 'A' && task.realityA ? task.realityA : task.reality;
}

// ── Scoring: honest best-call = 10; a reasonable near-miss still scores
// well because the point is the lesson, not a gotcha. ──
function scoreFor(chosen: Bin, best: Bin): { points: number; kind: 'best' | 'partial' | 'off' } {
  if (chosen === best) return { points: 10, kind: 'best' };
  if (best === 'together') return { points: 5, kind: 'partial' }; // saw one side of a team effort
  if (chosen === 'together') return { points: 6, kind: 'partial' }; // teaming up is rarely wrong
  return { points: 2, kind: 'off' }; // pure human↔machine mix-up
}

// ════════════════════════════════════════════════════════════════════════
// GAME-SHOW STAGE — kid vs robot, Sparky the referee in the middle
// ════════════════════════════════════════════════════════════════════════
function ShowStage({
  expression, line, color,
}: {
  expression: SparkyExpression; line: string; color: string;
}) {
  return (
    <div className="flex items-end justify-between gap-2">
      {/* Kid contestant */}
      <div className="flex flex-col items-center gap-1" style={{ width: 64 }}>
        <div
          className="rounded-2xl flex items-center justify-center"
          style={{ width: 48, height: 48, fontSize: 26, background: '#F59E0B18', border: '2px solid #F59E0B40' }}
          aria-hidden="true"
        >🧒</div>
        <span className="text-xs font-bold" style={{ color: '#B26B00' }}>You</span>
      </div>

      {/* Referee Sparky + speech */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <motion.div
          key={line}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          className="relative rounded-2xl px-3 py-2 text-center"
          style={{ background: `${color}12`, border: `1px solid ${color}33`, maxWidth: 260 }}
          role="status"
          aria-live="polite"
        >
          <p className="text-xs font-semibold" style={{ color: '#1A1D2B' }}>{line}</p>
        </motion.div>
        <div style={{ width: 56 }}>
          <SparkyCore expression={expression} pixelSize={56} />
        </div>
        <span className="text-xs font-bold" style={{ color }}>Sparky · Referee</span>
      </div>

      {/* Robot contestant */}
      <div className="flex flex-col items-center gap-1" style={{ width: 64 }}>
        <div
          className="rounded-2xl flex items-center justify-center"
          style={{ width: 48, height: 48, fontSize: 26, background: '#4F6EF718', border: '2px solid #4F6EF740' }}
          aria-hidden="true"
        >🤖</div>
        <span className="text-xs font-bold" style={{ color: '#3A52C4' }}>Robo</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// REALITY-CHECK CARD — flips up AFTER a commit. The payoff / lesson.
// ════════════════════════════════════════════════════════════════════════
function RealityCard({
  task, chosen, band, isLast, onNext,
}: {
  task: Task; chosen: Bin; band: AgeBand; isLast: boolean; onNext: () => void;
}) {
  const best = BIN_META[task.best];
  const { kind } = scoreFor(chosen, task.best);
  const headline =
    kind === 'best' ? 'Spot on!'
      : kind === 'partial' ? 'Good thinking!'
        : 'Here is the twist —';
  const headColor = kind === 'best' ? '#2ECC71' : kind === 'partial' ? '#F59E0B' : '#4F6EF7';

  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -70, y: 10 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      style={{ transformPerspective: 800 }}
    >
      <SFCard variant="elevated" className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${LAB_COLOR}18`, color: '#0B7FA8' }}
          >
            2026 REALITY CHECK
          </span>
          <span className="text-sm font-bold" style={{ color: headColor }}>{headline}</span>
        </div>

        <p className="text-sm font-semibold mb-3" style={{ color: '#1A1D2B' }}>{task.label}</p>

        {/* The honest answer badge */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
          style={{ background: `${best.color}12`, border: `1px solid ${best.color}33` }}
        >
          <best.Icon className="w-4 h-4 shrink-0" style={{ color: best.color }} />
          <span className="text-xs font-bold" style={{ color: best.color }}>
            Really it&apos;s: {best.label}
          </span>
        </div>

        <p className="text-sm" style={{ color: '#41485F' }}>{realityText(task, band)}</p>

        <SFButton variant="primary" size="lg" className="w-full mt-4" onClick={onNext}>
          {isLast ? 'See my verdict' : 'Next task'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </SFCard>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ROUND RENDERER — commit a task to a bin, then reveal the reality check
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig; band: AgeBand;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const round = useMemo(() => ROUNDS.find((r) => r.id === level.id)!, [level.id]);
  const tasks = useMemo(() => tasksForBand(round, band), [round, band]);

  const [phase, setPhase] = useState<'welcome' | 'play'>('welcome');
  const [taskIndex, setTaskIndex] = useState(0);
  const [committed, setCommitted] = useState<Bin | null>(null);
  const [score, setScore] = useState(0);
  const [bestCalls, setBestCalls] = useState(0);
  const [sparky, setSparky] = useState<{ expression: SparkyExpression; line: string }>({
    expression: 'happy',
    line: 'Welcome to Human vs Machine! Where does each job belong?',
  });

  const maxScore = tasks.length * 10;
  const task = tasks[taskIndex];
  const isLast = taskIndex >= tasks.length - 1;

  const finishLevel = useCallback((finalScore: number, finalBest: number) => {
    const pct = finalScore / Math.max(maxScore, 1);
    const stars = (pct >= 0.8 ? 3 : pct >= 0.6 ? 2 : 1) as 1 | 2 | 3;
    setSparky({
      expression: 'celebrating',
      line: `That's a wrap! You made ${finalBest} of ${tasks.length} expert calls.`,
    });
    setTimeout(() => {
      onComplete({ score: finalScore, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 1100);
  }, [maxScore, tasks.length, level.xpReward, onComplete]);

  const handleCommit = useCallback((bin: Bin) => {
    if (committed || !task) return;
    const { points, kind } = scoreFor(bin, task.best);
    const nextScore = score + points;
    const nextBest = bestCalls + (kind === 'best' ? 1 : 0);
    setScore(nextScore);
    setBestCalls(nextBest);
    setCommitted(bin);

    if (kind === 'best') {
      setSparky({ expression: 'celebrating', line: `Ding ding ding! ${points} points — great call!` });
      juice.onCorrect(taskIndex, nextScore);
    } else if (kind === 'partial') {
      setSparky({ expression: 'surprised', line: `Ooh, close! +${points}. Let's check the tape…` });
      juice.onCorrect(taskIndex, nextScore);
    } else {
      setSparky({ expression: 'thinking', line: `Plot twist! +${points}. Take a look at how it really works.` });
      juice.onWrong(taskIndex, nextScore);
    }
  }, [committed, task, score, bestCalls, taskIndex, juice]);

  const handleNext = useCallback(() => {
    if (isLast) {
      finishLevel(score, bestCalls);
      return;
    }
    setTaskIndex((i) => i + 1);
    setCommitted(null);
    setSparky({ expression: 'speaking', line: 'Next up — where does this one belong?' });
  }, [isLast, score, bestCalls, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={round.emoji} color={LAB_COLOR}>Round {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <div className="mb-4">
            <ShowStage expression="happy" line="Three podiums, one question each — you make the call!" color={LAB_COLOR} />
          </div>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}12`, color: '#0B7FA8' }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>The idea:</strong> {round.concept}</span>
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#2ECC7112', color: '#1B7A44' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              For each job, pick <strong>Humans</strong>, <strong>Machines</strong>, or <strong>Better Together</strong>.
              After you choose, a <strong>2026 Reality Check</strong> shows how it really works today. Hint: teamwork wins a lot in 2026!
            </span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('play')}>
          Start the show <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ PLAY ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji={round.emoji} color={LAB_COLOR}>Where does it belong?</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Trophy className="w-4 h-4" />{taskIndex + (committed ? 1 : 0)} / {tasks.length}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />

      <SFCard variant="elevated" className="p-4">
        <ShowStage expression={sparky.expression} line={sparky.line} color={LAB_COLOR} />
      </SFCard>

      {/* The task chip — no hint about the right bin (G1) */}
      <div
        className="rounded-2xl px-4 py-4 text-center"
        style={{ background: '#FFFFFF', border: `2px dashed ${LAB_COLOR}55` }}
        role="group"
        aria-label={`Task: ${task.label}`}
      >
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#8C94AC' }}>The task</span>
        <p className="text-base font-bold mt-1" style={{ color: '#1A1D2B' }}>{task.label}</p>
      </div>

      <AnimatePresence mode="wait">
        {committed ? (
          <RealityCard
            key={`reveal-${task.id}`}
            task={task}
            chosen={committed}
            band={band}
            isLast={isLast}
            onNext={handleNext}
          />
        ) : (
          <motion.div
            key={`choose-${task.id}`}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-2"
            role="group"
            aria-label="Choose who does this task better"
          >
            {BIN_ORDER.map((bin) => {
              const meta = BIN_META[bin];
              return (
                <button
                  key={bin}
                  type="button"
                  onClick={() => handleCommit(bin)}
                  aria-label={`Place this task with ${meta.label}`}
                  className="flex flex-col items-center gap-2 rounded-2xl px-2 py-4 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)`,
                    border: `2px solid ${meta.color}45`,
                    ['--tw-ring-color' as string]: meta.color,
                  }}
                >
                  <meta.Icon className="w-6 h-6" style={{ color: meta.color }} />
                  <span className="text-xs font-bold text-center" style={{ color: '#1A1D2B' }}>{meta.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {!committed && (
        <div className="flex justify-end">
          <SFButton variant="outline" onClick={onExit} aria-label="Leave this round and return to the round map">
            <RotateCcw className="w-4 h-4 mr-2" /> Round map
          </SFButton>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function HumanVsMachineGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = LEVELS.length * 3; // 15
    awardXP(Math.round(totalXP));
    const finalStars = (totalStars >= maxStars * 0.8 ? 3 : totalStars >= maxStars * 0.53 ? 2 : 1) as 1 | 2 | 3;
    completeGame('human-vs-machine', finalStars);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Human vs Machine" color="#0FB8FA" labNum={1}>
      <GameLevelSystem
        gameTitle="Human vs Machine"
        gameEmoji="🤖"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onLevelComplete, onExit) => (
          <LevelRenderer level={level} band={band} onComplete={onLevelComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
