// ════════════════════════════════════════════════════════════════════════
// TOOL PICKER v5 — Lab 5 — pick-the-model-family + compose-a-pipeline
// ════════════════════════════════════════════════════════════════════════
// v4 was a SORT clone: drag job chips into Vision / Language / Prediction /
// Recommendation bins. Two problems: (1) the taxonomy was pre-LLM — no
// Generative or Agent family — and (2) it was indistinguishable from every
// other sorter in the library.
//
// v5 fixes both:
//   1. SIX real 2026 model families — Vision, Language, Prediction,
//      Recommendation, Generative, Agent — with a refreshed job bank
//      ("write a poem about my dog" = Generative, "plan my week and book it"
//      = Agent, "turn this text into a video" = Generative).
//   2. A COMPOSITION mode (the de-clone): on later levels the child wires a
//      TWO-tool pipeline for a compound job ("describe a photo aloud" =
//      Vision → Language) and then SPARKY RUNS the assembled pipeline on a
//      sample and shows the result. That makes it more than a sorter.
//
// Everything is button/select driven — fully keyboard operable, no drag.
// G1 honesty: a job chip NEVER names its own family; the answer is revealed
// only after the child commits. Dark surface throughout.

'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, RotateCcw, Sparkles,
  ArrowRight, Play, CheckCircle2, XCircle, Wand2,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';

const LAB_COLOR = '#00D17A';

// Dark-surface palette (inline hex — no text-white/NN opacity utilities).
const SURFACE = 'rgba(255,255,255,0.045)';
const SURFACE_2 = 'rgba(255,255,255,0.07)';
const BORDER = 'rgba(255,255,255,0.10)';
const TEXT = '#EAF0F6';
const TEXT_DIM = '#98A2B8';

// ════════════════════════════════════════════════════════════════════════
// THE SIX AI MODEL FAMILIES (2026)
// ════════════════════════════════════════════════════════════════════════
const VISION = 0, LANGUAGE = 1, PREDICTION = 2, RECOMMEND = 3, GENERATIVE = 4, AGENT = 5;

interface Family { idx: number; name: string; emoji: string; color: string; blurb: string; }

const FAMILIES: Family[] = [
  { idx: VISION,     name: 'Vision',         emoji: '👁️', color: '#4F6EF7', blurb: 'Sees images & video' },
  { idx: LANGUAGE,   name: 'Language',       emoji: '💬', color: '#10BAD2', blurb: 'Reads & writes text' },
  { idx: PREDICTION, name: 'Prediction',     emoji: '📈', color: '#2ECC71', blurb: 'Forecasts numbers' },
  { idx: RECOMMEND,  name: 'Recommendation', emoji: '⭐', color: '#F59E0B', blurb: "Suggests what you'll like" },
  { idx: GENERATIVE, name: 'Generative',     emoji: '✨', color: '#E945F5', blurb: 'Creates brand-new content' },
  { idx: AGENT,      name: 'Agent',          emoji: '🤖', color: '#8F96FA', blurb: 'Plans & takes action' },
];

const CORE4 = [VISION, LANGUAGE, PREDICTION, RECOMMEND];
const ALL6 = [VISION, LANGUAGE, PREDICTION, RECOMMEND, GENERATIVE, AGENT];

// ════════════════════════════════════════════════════════════════════════
// SINGLE-TOOL JOB BANK — job + its family + the "why" (revealed after commit).
// The label/name NEVER name the family (G1 honesty).
// ════════════════════════════════════════════════════════════════════════
interface Job { id: string; label: string; family: number; why: string; }

const BANK: Job[] = [
  // Vision
  { id: 'tumor',   label: 'Spot tumors in an X-ray',            family: VISION, why: 'Finding things inside an image is a Vision job — the model reads pixels.' },
  { id: 'face',    label: 'Unlock a phone with your face',       family: VISION, why: 'Recognizing a face in a camera image is a Vision job.' },
  { id: 'berries', label: 'Help a farm robot pick ripe berries', family: VISION, why: 'Seeing which berries are ripe in a camera feed is a Vision job.' },
  { id: 'ocr',     label: 'Read a handwritten note into text',   family: VISION, why: 'Turning marks in an image into text is a Vision job (OCR).' },
  // Language
  { id: 'menu',    label: 'Translate a menu into Spanish',       family: LANGUAGE, why: 'Changing text from one language to another is a Language job.' },
  { id: 'spam',    label: 'Sort emails into spam or not-spam',   family: LANGUAGE, why: 'Reading text and labeling it is a Language job.' },
  { id: 'mood',    label: 'Tell if a review is happy or angry',  family: LANGUAGE, why: 'Reading words to judge their tone is a Language job (sentiment).' },
  { id: 'facts',   label: 'Pull the key facts from a contract',  family: LANGUAGE, why: 'Finding facts inside writing is a Language job.' },
  // Prediction
  { id: 'rain',    label: "Forecast tomorrow's rain",            family: PREDICTION, why: 'Forecasting a future value from past data is a Prediction job.' },
  { id: 'sales',   label: "Forecast next month's store sales",   family: PREDICTION, why: 'Predicting future sales from history is a Prediction job.' },
  { id: 'bus',     label: 'Estimate how long a bus ride takes',  family: PREDICTION, why: "Estimating a number you don't know yet is a Prediction job." },
  { id: 'logins',  label: 'Guess how many players log in tonight', family: PREDICTION, why: 'Forecasting a count from past patterns is a Prediction job.' },
  // Recommendation
  { id: 'song',    label: 'Suggest the next song to play',       family: RECOMMEND, why: "Suggesting what you'll like next is a Recommendation job." },
  { id: 'feed',    label: 'Pick which short videos fill a feed', family: RECOMMEND, why: "Ranking what you'll enjoy is a Recommendation job." },
  { id: 'shop',    label: 'Suggest products you might buy',      family: RECOMMEND, why: 'Suggesting items based on shoppers like you is a Recommendation job.' },
  { id: 'book',    label: 'Recommend a book like your last one', family: RECOMMEND, why: 'Finding items similar to ones you loved is a Recommendation job.' },
  // Generative
  { id: 'poem',    label: 'Write a poem about your dog',         family: GENERATIVE, why: 'Making brand-new text from scratch is a Generative job.' },
  { id: 'vid',     label: 'Turn a text description into a video', family: GENERATIVE, why: 'Creating a new video from words is a Generative job.' },
  { id: 'art',     label: 'Make album cover art from a prompt',  family: GENERATIVE, why: 'Painting a new image from a prompt is a Generative job.' },
  { id: 'music',   label: 'Compose background music for a game', family: GENERATIVE, why: 'Composing new music is a Generative job.' },
  { id: 'card',    label: 'Design a birthday card from a few words', family: GENERATIVE, why: 'Creating new artwork from a few words is a Generative job.' },
  // Agent
  { id: 'week',    label: 'Plan your week and book the appointments', family: AGENT, why: 'Planning steps AND taking actions (booking) is an Agent job.' },
  { id: 'inbox',  label: 'Clear your inbox: read, label, and file', family: AGENT, why: 'Deciding and then acting across your inbox is an Agent job.' },
  { id: 'grocery', label: 'Reorder groceries when the fridge runs low', family: AGENT, why: 'Watching, deciding, and ordering on its own is an Agent job.' },
  { id: 'trip',    label: 'Compare flights and hold the best seat', family: AGENT, why: 'Researching, comparing, and acting in steps is an Agent job.' },
];

// ════════════════════════════════════════════════════════════════════════
// COMPOSITION BANK — compound jobs that need a TWO-tool pipeline, in order.
// Sparky "runs" the assembled pipeline on the sample and shows each stage.
// ════════════════════════════════════════════════════════════════════════
interface Chain {
  id: string; label: string; chain: [number, number]; why: string;
  sample: string; run: [string, string];
}

const CHAINS: Chain[] = [
  {
    id: 'describe', label: 'Describe a photo out loud for a blind friend',
    chain: [VISION, LANGUAGE],
    why: 'Vision has to SEE the photo first, then Language puts what it saw into words.',
    sample: '📷 A photo: a brown dog running on a sandy beach',
    run: [
      'Vision looks at the photo and spots: dog, beach, running, sunshine.',
      'Language turns that into a sentence: “A brown dog is running on a sunny beach.”',
    ],
  },
  {
    id: 'emails', label: 'Summarize my emails, then draft replies',
    chain: [LANGUAGE, AGENT],
    why: 'Language has to READ the emails first, then the Agent acts on them.',
    sample: '📥 12 unread emails',
    run: [
      'Language reads all 12 and summarizes each in one line.',
      'The Agent drafts a reply to each and lines them up to send.',
    ],
  },
  {
    id: 'poster', label: 'Turn my written idea into a poster',
    chain: [LANGUAGE, GENERATIVE],
    why: 'Language understands your words first, then Generative creates the picture.',
    sample: '📝 “Make a poster for our Saturday bake sale”',
    run: [
      'Language turns your note into a clear image prompt.',
      'Generative paints a colorful bake-sale poster.',
    ],
  },
  {
    id: 'porch', label: 'Watch the door and text me when a package arrives',
    chain: [VISION, AGENT],
    why: 'Vision has to SEE the package first, then the Agent takes action.',
    sample: '🎥 Live view of the front porch',
    run: [
      'Vision watches the feed and spots a delivery box.',
      'The Agent texts you and logs the drop-off time.',
    ],
  },
  {
    id: 'churn', label: 'Find players about to quit, then write each a note',
    chain: [PREDICTION, GENERATIVE],
    why: 'Prediction forecasts who will leave first, then Generative writes to them.',
    sample: '📊 Play stats for 500 gamers',
    run: [
      'Prediction flags 30 players likely to stop playing.',
      'Generative writes each one a friendly “come back” note.',
    ],
  },
  {
    id: 'reviews', label: 'Read our app reviews, then suggest what to fix',
    chain: [LANGUAGE, RECOMMEND],
    why: 'Language understands the reviews first, then Recommendation ranks the fix.',
    sample: '🗣️ 200 app-store reviews',
    run: [
      'Language reads the reviews and finds the common mood.',
      'Recommendation suggests the top fix to make next.',
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════
// LEVEL PLANS PER AGE BAND
//   A = single-tool only, 4 families (all 5 levels are sorts)
//   B = all 6 families, composition on the final level
//   C = all 6 families, composition on the last two levels
// ════════════════════════════════════════════════════════════════════════
type Band = 'A' | 'B' | 'C';
type Mode = 'sort' | 'compose';

interface PlanEntry {
  name: string; emoji: string; difficulty: LevelConfig['difficulty'];
  mode: Mode; families: number[]; xpReward: number; isBonus?: boolean;
}

const PLANS: Record<Band, PlanEntry[]> = {
  A: [
    { name: 'Match the Job',  emoji: '🧰', difficulty: 'easy',   mode: 'sort', families: CORE4, xpReward: 50 },
    { name: 'Look & Read',    emoji: '👁️', difficulty: 'easy',   mode: 'sort', families: CORE4, xpReward: 60 },
    { name: 'Guess & Suggest', emoji: '🔮', difficulty: 'easy',  mode: 'sort', families: CORE4, xpReward: 70 },
    { name: 'Everyday AI',    emoji: '📱', difficulty: 'medium', mode: 'sort', families: CORE4, xpReward: 90 },
    { name: 'Tool Master',    emoji: '👑', difficulty: 'medium', mode: 'sort', families: CORE4, xpReward: 120, isBonus: true },
  ],
  B: [
    { name: 'Match the Job',    emoji: '🧰', difficulty: 'easy',   mode: 'sort',    families: CORE4, xpReward: 50 },
    { name: 'Two New Tools',    emoji: '✨', difficulty: 'easy',   mode: 'sort',    families: ALL6,  xpReward: 70 },
    { name: 'All Six Families', emoji: '🌈', difficulty: 'medium', mode: 'sort',    families: ALL6,  xpReward: 90 },
    { name: 'Mixed Jobs',       emoji: '🧠', difficulty: 'hard',   mode: 'sort',    families: ALL6,  xpReward: 110 },
    { name: 'Build a Pipeline', emoji: '🔗', difficulty: 'expert', mode: 'compose', families: ALL6,  xpReward: 150, isBonus: true },
  ],
  C: [
    { name: 'Match the Job',    emoji: '🧰', difficulty: 'easy',   mode: 'sort',    families: ALL6, xpReward: 60 },
    { name: 'All Six Families', emoji: '🌈', difficulty: 'easy',   mode: 'sort',    families: ALL6, xpReward: 80 },
    { name: 'Mixed Jobs',       emoji: '🧠', difficulty: 'medium', mode: 'sort',    families: ALL6, xpReward: 100 },
    { name: 'Build a Pipeline', emoji: '🔗', difficulty: 'hard',   mode: 'compose', families: ALL6, xpReward: 140 },
    { name: 'Pipeline Pro',     emoji: '⚙️', difficulty: 'expert', mode: 'compose', families: ALL6, xpReward: 180, isBonus: true },
  ],
};

function buildLevels(band: Band): LevelConfig[] {
  return PLANS[band].map((p, i) => ({
    id: i + 1,
    name: p.name,
    description: p.mode === 'compose'
      ? 'Wire a two-tool pipeline, then watch Sparky run it.'
      : 'Match each job to the AI family that fits.',
    emoji: p.emoji,
    difficulty: p.difficulty,
    starThresholds: [34, 60, 85], // percentages — see finish()
    xpReward: p.xpReward,
    isBonus: p.isBonus,
  }));
}

const CONCEPT_SORT =
  'Each AI family fits a kind of job. Vision sees, Language reads & writes, Prediction forecasts, Recommendation suggests, Generative creates brand-new content, and Agent plans and takes action.';
const CONCEPT_COMPOSE =
  'Real assistants CHAIN tools together. One family handles the first step and hands its result to the next — and the ORDER matters. You wire the pipeline; Sparky runs it.';

// ── Deterministic sort-job picker: round-robin across the allowed families ──
function pickSortJobs(families: number[], count: number, seed: number): Job[] {
  const groups = families.map((f) => BANK.filter((j) => j.family === f));
  const out: Job[] = [];
  const seen = new Set<string>();
  let step = 0;
  const guard = count * families.length + 24;
  while (out.length < count && step < guard) {
    const g = groups[step % groups.length];
    if (g.length > 0) {
      const job = g[(Math.floor(step / groups.length) + seed) % g.length];
      if (!seen.has(job.id)) { seen.add(job.id); out.push(job); }
    }
    step++;
  }
  return out;
}

function pickChains(count: number, seed: number): Chain[] {
  const out: Chain[] = [];
  for (let i = 0; i < count; i++) out.push(CHAINS[(seed + i) % CHAINS.length]);
  return out;
}

function famByIdx(idx: number): Family {
  return FAMILIES[idx];
}

// ════════════════════════════════════════════════════════════════════════
// SHARED DARK UI BITS
// ════════════════════════════════════════════════════════════════════════
function Panel({ children, style, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{ background: SURFACE, border: `1px solid ${BORDER}`, ...style }}>
      {children}
    </div>
  );
}

function HeaderBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `${LAB_COLOR}22`, border: `1px solid ${LAB_COLOR}44` }}
          aria-hidden="true"
        >🧰</span>
        <h2 className="text-base font-bold" style={{ color: TEXT }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100);
  return (
    <div
      className="h-2 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.08)' }}
      role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}
      aria-label="Level progress"
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${LAB_COLOR}, #10BAD2)` }}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SORT MODE — one job at a time, pick its family (buttons, keyboard-first).
// ════════════════════════════════════════════════════════════════════════
function SortMode({
  plan, level, onComplete, onExit,
}: {
  plan: PlanEntry; level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const count = plan.families.length <= 4 ? 5 : 6;
  const jobs = useMemo(() => pickSortJobs(plan.families, count, level.id), [plan.families, count, level.id]);
  const options = useMemo(() => plan.families.map(famByIdx), [plan.families]);

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // family idx the child chose

  const job = jobs[index];
  const revealed = picked !== null;
  const isRight = revealed && picked === job.family;

  const pick = useCallback((fam: number) => {
    if (revealed) return;
    setPicked(fam);
    if (fam === job.family) {
      setCorrectCount((c) => c + 1);
      setCombo((c) => c + 1);
      juice.onCorrect(index, (correctCount + 1) * 10);
    } else {
      setCombo(0);
      juice.onWrong(index, correctCount * 10);
    }
  }, [revealed, job, index, correctCount, juice]);

  const next = useCallback(() => {
    const finalCorrect = correctCount;
    if (index + 1 >= jobs.length) {
      const maxScore = jobs.length * 10;
      const score = finalCorrect * 10;
      const pct = score / maxScore;
      const stars: 0 | 1 | 2 | 3 = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : pct >= 0.34 ? 1 : 0;
      setTimeout(() => onComplete({ score, maxScore, stars, xpEarned: Math.round(level.xpReward * (stars / 3)), timeMs: 0 }), 200);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }, [index, jobs.length, correctCount, level.xpReward, onComplete]);

  return (
    <div className="relative z-10 space-y-4">
      <HeaderBar
        title="Pick the Right Tool"
        right={<span className="text-sm font-bold" style={{ color: LAB_COLOR }}>{index + 1} / {jobs.length}</span>}
      />
      <ProgressBar value={index + (revealed ? 1 : 0)} max={jobs.length} />

      {combo >= 2 && (
        <div className="text-xs font-bold" style={{ color: '#F59E0B' }} role="status">🔥 {combo} in a row!</div>
      )}

      {/* The job — never names its family (G1 honesty) */}
      <Panel style={{ background: SURFACE_2 }}>
        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: TEXT_DIM }}>The job</p>
        <p className="text-lg font-bold" style={{ color: TEXT }} aria-label={`Job: ${job.label}`}>{job.label}</p>
        <p className="text-sm mt-2" style={{ color: TEXT_DIM }}>Which AI family fits best?</p>
      </Panel>

      {/* Family options */}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="AI family choices">
        {options.map((f) => {
          const chosen = picked === f.idx;
          const correctOne = revealed && f.idx === job.family;
          const showState = revealed && (chosen || correctOne);
          const stateColor = correctOne ? '#2ECC71' : chosen ? '#EF4444' : f.color;
          return (
            <button
              key={f.idx}
              type="button"
              onClick={() => pick(f.idx)}
              disabled={revealed}
              aria-label={`${f.name} — ${f.blurb}${showState ? (correctOne ? ' (correct answer)' : ' (your pick, not right)') : ''}`}
              className="rounded-2xl p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-default"
              style={{
                background: showState ? `${stateColor}1F` : SURFACE,
                border: `1.5px solid ${showState ? stateColor : `${f.color}44`}`,
                ['--tw-ring-color' as string]: f.color,
                opacity: revealed && !showState ? 0.5 : 1,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">{f.emoji}</span>
                <span className="font-bold text-sm" style={{ color: TEXT }}>{f.name}</span>
                {correctOne && <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: '#2ECC71' }} />}
                {chosen && !correctOne && <XCircle className="w-4 h-4 ml-auto" style={{ color: '#EF4444' }} />}
              </div>
              <p className="text-xs mt-1" style={{ color: TEXT_DIM }}>{f.blurb}</p>
            </button>
          );
        })}
      </div>

      {/* Reveal — explanation appears only after commit */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="status"
          >
            <Panel style={{ background: `${isRight ? '#2ECC71' : '#EF4444'}14`, border: `1px solid ${isRight ? '#2ECC71' : '#EF4444'}55` }}>
              <p className="text-sm font-bold" style={{ color: isRight ? '#2ECC71' : '#FCA5A5' }}>
                {isRight ? 'Right tool!' : `That's a ${famByIdx(job.family).name} job.`}
              </p>
              <p className="text-xs mt-1" style={{ color: TEXT }}>{job.why}</p>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={next} disabled={!revealed}>
          {index + 1 >= jobs.length ? 'Finish' : 'Next Job'} <ChevronRight className="w-4 h-4 ml-1" />
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit to level map">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// COMPOSE MODE — wire a 2-tool pipeline, then Sparky runs it on a sample.
// ════════════════════════════════════════════════════════════════════════
function ComposeMode({
  plan, level, onComplete, onExit,
}: {
  plan: PlanEntry; level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const chains = useMemo(() => pickChains(3, level.id), [level.id]);
  const options = useMemo(() => plan.families.map(famByIdx), [plan.families]);

  const [index, setIndex] = useState(0);
  const [correctSteps, setCorrectSteps] = useState(0);
  const [step1, setStep1] = useState<number | ''>('');
  const [step2, setStep2] = useState<number | ''>('');
  const [ran, setRan] = useState(false);

  const chain = chains[index];
  const canRun = step1 !== '' && step2 !== '' && !ran;
  const s1ok = ran && step1 === chain.chain[0];
  const s2ok = ran && step2 === chain.chain[1];

  const runPipeline = useCallback(() => {
    if (step1 === '' || step2 === '' || ran) return;
    setRan(true);
    const gained = (step1 === chain.chain[0] ? 1 : 0) + (step2 === chain.chain[1] ? 1 : 0);
    setCorrectSteps((c) => c + gained);
    if (gained === 2) juice.onCorrect(index, (correctSteps + gained) * 10);
    else juice.onWrong(index, correctSteps * 10);
  }, [step1, step2, ran, chain, index, correctSteps, juice]);

  const next = useCallback(() => {
    if (index + 1 >= chains.length) {
      const maxScore = chains.length * 20; // two steps × 10
      const score = correctSteps * 10;
      const pct = score / maxScore;
      const stars: 0 | 1 | 2 | 3 = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : pct >= 0.34 ? 1 : 0;
      setTimeout(() => onComplete({ score, maxScore, stars, xpEarned: Math.round(level.xpReward * (stars / 3)), timeMs: 0 }), 200);
      return;
    }
    setIndex((i) => i + 1);
    setStep1(''); setStep2(''); setRan(false);
  }, [index, chains.length, correctSteps, level.xpReward, onComplete]);

  const slotStyle = (ok: boolean, filled: boolean): React.CSSProperties => ({
    background: SURFACE,
    border: `1.5px solid ${ran ? (ok ? '#2ECC71' : '#EF4444') : filled ? `${LAB_COLOR}66` : BORDER}`,
    color: TEXT,
  });

  const Step = ({ n, value, set, ok }: { n: 1 | 2; value: number | ''; set: (v: number | '') => void; ok: boolean }) => (
    <div className="flex-1">
      <label className="text-xs font-bold flex items-center gap-1 mb-1" style={{ color: TEXT_DIM }} htmlFor={`compose-step-${n}`}>
        Step {n}
        {ran && (ok
          ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#2ECC71' }} aria-label="correct" />
          : <XCircle className="w-3.5 h-3.5" style={{ color: '#EF4444' }} aria-label="not right" />)}
      </label>
      <select
        id={`compose-step-${n}`}
        value={value}
        disabled={ran}
        onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))}
        aria-label={`Pick the AI family for step ${n}`}
        className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-default"
        style={{ ...slotStyle(ok, value !== ''), ['--tw-ring-color' as string]: LAB_COLOR }}
      >
        <option value="" style={{ color: '#111' }}>Choose a tool…</option>
        {options.map((f) => (
          <option key={f.idx} value={f.idx} style={{ color: '#111' }}>{f.emoji} {f.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="relative z-10 space-y-4">
      <HeaderBar
        title="Build the Pipeline"
        right={<span className="text-sm font-bold" style={{ color: LAB_COLOR }}>{index + 1} / {chains.length}</span>}
      />
      <ProgressBar value={index + (ran ? 1 : 0)} max={chains.length} />

      <Panel style={{ background: SURFACE_2 }}>
        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: TEXT_DIM }}>Compound job</p>
        <p className="text-lg font-bold" style={{ color: TEXT }} aria-label={`Compound job: ${chain.label}`}>{chain.label}</p>
        <p className="text-sm mt-2" style={{ color: TEXT_DIM }}>Wire two tools in the right order, then run it.</p>
      </Panel>

      {/* Pipeline wiring */}
      <div className="flex items-end gap-2">
        <Step n={1} value={step1} set={setStep1} ok={s1ok} />
        <ArrowRight className="w-5 h-5 mb-2.5 shrink-0" style={{ color: LAB_COLOR }} aria-hidden="true" />
        <Step n={2} value={step2} set={setStep2} ok={s2ok} />
      </div>

      {!ran && (
        <SFButton variant="primary" className="w-full" onClick={runPipeline} disabled={!canRun}>
          <Play className="w-4 h-4 mr-2" />
          {canRun ? 'Run the pipeline' : 'Fill both steps to run'}
        </SFButton>
      )}

      {/* Sparky runs the assembled pipeline on the sample */}
      <AnimatePresence>
        {ran && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="status" className="space-y-2"
          >
            <Panel style={{ background: `${LAB_COLOR}12`, border: `1px solid ${LAB_COLOR}55` }}>
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="w-4 h-4" style={{ color: LAB_COLOR }} />
                <span className="text-sm font-bold" style={{ color: LAB_COLOR }}>Sparky runs your pipeline</span>
              </div>
              <p className="text-sm mb-3" style={{ color: TEXT }}>{chain.sample}</p>
              {[0, 1].map((si) => {
                const f = famByIdx(chain.chain[si]);
                return (
                  <div key={si} className="flex items-start gap-2 mb-2">
                    <span
                      className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold"
                      style={{ background: `${f.color}26`, color: TEXT, border: `1px solid ${f.color}66` }}
                    >
                      {f.emoji} {f.name}
                    </span>
                    <p className="text-xs" style={{ color: TEXT }}>{chain.run[si]}</p>
                  </div>
                );
              })}
            </Panel>

            <Panel style={{ background: `${s1ok && s2ok ? '#2ECC71' : '#F59E0B'}14`, border: `1px solid ${s1ok && s2ok ? '#2ECC71' : '#F59E0B'}55` }}>
              <p className="text-sm font-bold" style={{ color: s1ok && s2ok ? '#2ECC71' : '#FCD34D' }}>
                {s1ok && s2ok ? 'Perfect pipeline!' : 'Right idea — check the order.'}
              </p>
              <p className="text-xs mt-1" style={{ color: TEXT }}>
                Correct wiring: <strong>{famByIdx(chain.chain[0]).name}</strong> → <strong>{famByIdx(chain.chain[1]).name}</strong>. {chain.why}
              </p>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={next} disabled={!ran}>
          {index + 1 >= chains.length ? 'Finish' : 'Next Pipeline'} <ChevronRight className="w-4 h-4 ml-1" />
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit to level map">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — welcome → sort | compose
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  band, level, onComplete, onExit,
}: {
  band: Band; level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const plan = PLANS[band][level.id - 1];
  const [started, setStarted] = useState(false);

  if (!started) {
    const compose = plan.mode === 'compose';
    return (
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{plan.emoji}</span>
          <h2 className="text-lg font-bold" style={{ color: TEXT }}>Level {level.id}: {plan.name}</h2>
        </div>
        <Panel>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}12` }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
            <span style={{ color: TEXT }}><strong style={{ color: LAB_COLOR }}>Concept:</strong> {compose ? CONCEPT_COMPOSE : CONCEPT_SORT}</span>
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}12` }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
            <span style={{ color: TEXT }}>
              {compose
                ? <><strong style={{ color: LAB_COLOR }}>Task:</strong> Wire a two-tool pipeline for each compound job, then run it.</>
                : <><strong style={{ color: LAB_COLOR }}>Task:</strong> Read each job and pick the one AI family that fits it best.</>}
            </span>
          </div>
        </Panel>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setStarted(true)}>
          {compose ? 'Start Building' : 'Start Picking'} <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  return plan.mode === 'compose'
    ? <ComposeMode plan={plan} level={level} onComplete={onComplete} onExit={onExit} />
    : <SortMode plan={plan} level={level} onComplete={onComplete} onExit={onExit} />;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function ToolPickerGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;
  const levels = useMemo(() => buildLevels(band), [band]);
  const firedRef = useRef(false);

  const handleComplete = useCallback((results: LevelResult[]) => {
    if (firedRef.current) return;
    firedRef.current = true;
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = levels.length * 3;
    awardXP(Math.round(totalXP));
    // Map cumulative stars → 1–3 game stars (fires once).
    const gameStars = totalStars >= maxStars * 0.8 ? 3 : totalStars >= maxStars * 0.5 ? 2 : 1;
    completeGame('tool-picker', gameStars);
  }, [awardXP, completeGame, levels.length]);

  return (
    <GameShell title="Tool Picker" color="#00D17A" labNum={5}>
      <GameLevelSystem
        gameTitle="Tool Picker"
        gameEmoji="🧰"
        labColor={LAB_COLOR}
        levels={levels}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer band={band} level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
