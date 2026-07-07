// ════════════════════════════════════════════════════════════════════════
// AI SPY v5 — Lab 1 (What IS AI?) — themed DOM hunt + Sparky scanner
// ════════════════════════════════════════════════════════════════════════
// A tap-to-reveal HUNT: each level is its OWN place (Home, School, City,
// Hospital, Space Station, Future Home) with its OWN 8-object pool that
// actually matches the theme — no modulo remixing. Tap an object; Sparky
// runs a short scan beam over it; then a "why-card" reveals whether/how it
// uses AI. Objects are NEVER pre-labeled (G1 honesty) — the answer arrives
// only after the tap (band A/B) or after the player commits a guess (band C
// "predict-first"). 2026 tiles included: on-device assistants, AI camera /
// visual lookup, recommendation feeds, AI photo cleanup, agentic helpers.
//
// Renderer: bespoke HTML/SVG (no Pixi canvas). Teaches: AI hides in things
// that SENSE, LEARN, or PREDICT — plain objects just sit there.

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Sparkles, Eye, GraduationCap, Target, RotateCcw, ScanLine,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { useActiveChild } from '@/hooks/useChildren';
import { useSafeTimeout } from '@/hooks/useSafeTimeout';
import { SparkyCore, type SparkyExpression } from '@/components/sparky';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import {
  GlowingTitle, ScoreDisplay, ComboCounter, FeedbackPopup,
} from '@/components/games/shared/GameVisualKit';

const LAB_COLOR = '#0FB8FA';

// ════════════════════════════════════════════════════════════════════════
// TILE + THEME DATA — every level has a DISTINCT, theme-matched pool.
// `core` = obvious/standard objects (bands A & B). `subtle` = trickier 2026
// objects mixed in for band C. No object is pre-labeled to the player.
// ════════════════════════════════════════════════════════════════════════
interface SpyTile {
  id: string;
  label: string;
  emoji: string;
  isAI: boolean;
  why: string;      // reveal explanation (kid-friendly)
  subtle?: boolean; // 2026 / band-C object
}

interface Theme {
  id: number;
  name: string;
  emoji: string;
  tint: string;                 // theme accent (matches the place)
  difficulty: LevelConfig['difficulty'];
  xpReward: number;
  isBonus?: boolean;
  description: string;
  concept: string;
  core: SpyTile[];              // >= 8 objects
  subtle: SpyTile[];            // 1-3 subtle 2026 objects (band C)
}

const THEMES: Theme[] = [
  {
    id: 1, name: 'Home', emoji: '🏠', tint: '#4F9CF7', difficulty: 'easy', xpReward: 50,
    description: 'Spot the AI hiding around your living room.',
    concept: 'At home, AI hides in things that hear you, learn what you like, or watch the door. Plain furniture just sits there.',
    core: [
      { id: 'speaker', label: 'Smart Speaker', emoji: '🔊', isAI: true, why: 'It listens for your voice and understands words using speech AI.' },
      { id: 'couch', label: 'Couch', emoji: '🛋️', isAI: false, why: 'Just soft furniture — no sensors, no computer. No AI here.' },
      { id: 'vacuum', label: 'Robot Vacuum', emoji: '🤖', isAI: true, why: 'It maps your rooms and steers around chairs all by itself.' },
      { id: 'switch', label: 'Light Switch', emoji: '💡', isAI: false, why: 'Flipping it just connects a wire. Nothing is thinking.' },
      { id: 'tv-recs', label: 'TV Show Picks', emoji: '📺', isAI: true, why: 'It learns what you watch and lines up more shows you might like.' },
      { id: 'frame', label: 'Picture Frame', emoji: '🖼️', isAI: false, why: 'It only holds a photo. Nothing inside is computing.' },
      { id: 'doorbell', label: 'Video Doorbell', emoji: '🚪', isAI: true, why: 'Its camera spots people and packages at your front door.' },
      { id: 'clock', label: 'Wall Clock', emoji: '🕐', isAI: false, why: 'Gears and a battery keep time. It never learns anything.' },
    ],
    subtle: [
      { id: 'on-device', label: 'On-Device Helper', emoji: '📱', isAI: true, subtle: true, why: 'A helper that runs right on your phone — no internet — to answer you and summarise texts.' },
      { id: 'photo-cleanup', label: 'Photo Cleanup', emoji: '🪄', isAI: true, subtle: true, why: 'Tap an unwanted thing in a photo and it paints it away by guessing what was behind it.' },
    ],
  },
  {
    id: 2, name: 'School', emoji: '🏫', tint: '#2ECC71', difficulty: 'easy', xpReward: 65,
    description: 'Which classroom tools actually use AI?',
    concept: 'A school tool uses AI when it adapts to you, understands language, or finds patterns — not when it only writes or stores.',
    core: [
      { id: 'math-app', label: 'Math Practice App', emoji: '➗', isAI: true, why: 'It notices which problems you miss and changes the next ones to fit you.' },
      { id: 'pencil', label: 'Pencil', emoji: '✏️', isAI: false, why: 'Wood and graphite. It writes, but it cannot think.' },
      { id: 'translator', label: 'Language Translator', emoji: '🌐', isAI: true, why: 'It turns one language into another by understanding meaning, not just words.' },
      { id: 'stapler', label: 'Stapler', emoji: '📎', isAI: false, why: 'A spring and metal. Pure mechanics — no AI.' },
      { id: 'autocorrect', label: 'Predictive Text', emoji: '⌨️', isAI: true, why: 'It guesses the word you meant from the letters and the sentence.' },
      { id: 'whiteboard', label: 'Whiteboard', emoji: '📋', isAI: false, why: 'A smooth surface for markers. Nothing senses or learns.' },
      { id: 'reading', label: 'Reading-Level Checker', emoji: '📖', isAI: true, why: 'It scores how hard a text is by spotting patterns in the words.' },
      { id: 'backpack', label: 'Backpack', emoji: '🎒', isAI: false, why: 'It carries your books. No electronics, no AI.' },
    ],
    subtle: [
      { id: 'camera-search', label: 'Camera Homework Search', emoji: '📸', isAI: true, subtle: true, why: 'Point your camera at a question and it recognises the problem and finds help.' },
      { id: 'class-feed', label: 'Class Video Feed', emoji: '🎞️', isAI: true, subtle: true, why: 'It chooses which posts and clips to show next based on what you linger on.' },
    ],
  },
  {
    id: 3, name: 'City Street', emoji: '🌆', tint: '#8C7AE6', difficulty: 'medium', xpReward: 85,
    description: 'AI is all around the city — can you catch it?',
    concept: 'Out in the city AI senses traffic, recognises faces, and predicts the weather. Simple street machinery does none of that.',
    core: [
      { id: 'traffic', label: 'Smart Traffic Light', emoji: '🚦', isAI: true, why: 'Sensors watch the cars and it changes the timing to keep traffic moving.' },
      { id: 'bench', label: 'Park Bench', emoji: '🪑', isAI: false, why: 'Somewhere to sit. It senses nothing at all.' },
      { id: 'shuttle', label: 'Self-Driving Shuttle', emoji: '🚐', isAI: true, why: 'It reads the road with cameras and steers itself.' },
      { id: 'meter', label: 'Parking Meter', emoji: '🅿️', isAI: false, why: 'It just counts the minutes you paid for.' },
      { id: 'face-kiosk', label: 'Face-Unlock Kiosk', emoji: '🪪', isAI: true, why: 'It maps the shape of a face to recognise who it is.' },
      { id: 'hydrant', label: 'Fire Hydrant', emoji: '🧯', isAI: false, why: 'A valve for water. No computer inside.' },
      { id: 'weather-sign', label: 'Weather Sign', emoji: '🌦️', isAI: true, why: 'It predicts rain from live data and past patterns.' },
      { id: 'mailbox', label: 'Mailbox', emoji: '📮', isAI: false, why: 'A metal box for letters. No intelligence needed.' },
    ],
    subtle: [
      { id: 'visual-search', label: 'Visual Search Camera', emoji: '🔎', isAI: true, subtle: true, why: 'Aim it at a building or plant and it identifies what you are looking at.' },
      { id: 'delivery-bot', label: 'Delivery Robot', emoji: '📦', isAI: true, subtle: true, why: 'A little robot that plans its own path along the sidewalk to drop off parcels.' },
    ],
  },
  {
    id: 4, name: 'Hospital', emoji: '🏥', tint: '#EB5A7A', difficulty: 'medium', xpReward: 100,
    description: 'AI helps doctors — but not everything here is smart.',
    concept: 'Hospitals use AI to read scans and spot patterns doctors might miss. Basic care tools stay basic.',
    core: [
      { id: 'scan-ai', label: 'Scan-Reading AI', emoji: '🩻', isAI: true, why: 'It studies X-rays and MRIs to flag spots a doctor should check.' },
      { id: 'bandage', label: 'Bandage', emoji: '🩹', isAI: false, why: 'Fabric and glue. It covers a cut — that is all.' },
      { id: 'symptom-bot', label: 'Symptom Chatbot', emoji: '💬', isAI: true, why: 'It understands your typed symptoms and suggests what to do next.' },
      { id: 'wheelchair', label: 'Wheelchair', emoji: '🦽', isAI: false, why: 'Wheels and a frame. Purely mechanical.' },
      { id: 'rhythm-ai', label: 'Heart-Rhythm Monitor', emoji: '❤️‍🩹', isAI: true, why: 'It learns the pattern of a heartbeat and warns about odd beats.' },
      { id: 'crutches', label: 'Crutches', emoji: '🩼', isAI: false, why: 'They help you walk. No sensors or software.' },
      { id: 'reminder', label: 'Smart Medicine Reminder', emoji: '💊', isAI: true, why: 'It notices your routine and nudges you at the best time.' },
      { id: 'thermometer', label: 'Basic Thermometer', emoji: '🌡️', isAI: false, why: 'It reads a temperature with a simple sensor — it never learns.' },
    ],
    subtle: [
      { id: 'note-writer', label: 'Note-Writing Assistant', emoji: '📝', isAI: true, subtle: true, why: 'It listens to a check-up and writes the summary notes for the doctor.' },
      { id: 'triage-agent', label: 'Triage Scheduler', emoji: '📅', isAI: true, subtle: true, why: 'It looks at everyone waiting and reorders visits on its own to help the sickest first.' },
    ],
  },
  {
    id: 5, name: 'Space Station', emoji: '🚀', tint: '#0FB8FA', difficulty: 'hard', xpReward: 120,
    description: 'Far from Earth, which systems think for themselves?',
    concept: 'In space, AI plans routes and analyses data far from Earth. Not every tool up here is intelligent.',
    core: [
      { id: 'star-nav', label: 'Star-Tracker Navigation', emoji: '⭐', isAI: true, why: 'It recognises star patterns to figure out which way the ship points.' },
      { id: 'handrail', label: 'Handrail', emoji: '➰', isAI: false, why: 'Something to grab in zero gravity. No electronics.' },
      { id: 'rover', label: 'Rover Autopilot', emoji: '🛻', isAI: true, why: 'It drives across another planet, choosing safe paths by itself.' },
      { id: 'bottle', label: 'Water Bottle', emoji: '🧴', isAI: false, why: 'It holds a drink. Nothing computes.' },
      { id: 'life-support', label: 'Life-Support Optimiser', emoji: '🫧', isAI: true, why: 'It learns the crew habits to balance air and power.' },
      { id: 'wrench', label: 'Wrench', emoji: '🔧', isAI: false, why: 'A tool for bolts. Pure metal — no thinking.' },
      { id: 'debris-cam', label: 'Debris-Spotting Camera', emoji: '📡', isAI: true, why: 'A vision system that spots space junk before it hits the station.' },
      { id: 'shutter', label: 'Window Shutter', emoji: '🪟', isAI: false, why: 'It slides to block sunlight. Just a mechanism.' },
    ],
    subtle: [
      { id: 'mission-agent', label: 'Mission-Planning Agent', emoji: '🗂️', isAI: true, subtle: true, why: 'Give it a goal and it breaks the day into tasks and schedules the crew.' },
      { id: 'photo-enhance', label: 'Photo Enhance', emoji: '🌌', isAI: true, subtle: true, why: 'It cleans noise from space photos by predicting the missing detail.' },
    ],
  },
  {
    id: 6, name: 'Future Home', emoji: '🔮', tint: '#E945F5', difficulty: 'expert', xpReward: 160, isBonus: true,
    description: 'The 2026 test — the AI is sneaky in here.',
    concept: 'Master test: across a modern home, find everything that senses, learns, predicts, or acts on its own — even when it looks ordinary.',
    core: [
      { id: 'assistant', label: 'On-Device Assistant', emoji: '🧠', isAI: true, why: 'A helper living on your device that answers and acts without the internet.' },
      { id: 'mug', label: 'Ceramic Mug', emoji: '☕', isAI: false, why: 'It holds tea. There is nothing to sense or learn.' },
      { id: 'feed', label: 'Recommendation Feed', emoji: '📲', isAI: true, why: 'It ranks endless videos to keep showing you what you like.' },
      { id: 'plant', label: 'Houseplant', emoji: '🪴', isAI: false, why: 'A living plant, but it is not a computer. No AI.' },
      { id: 'cleanup', label: 'AI Photo Cleanup', emoji: '🖌️', isAI: true, why: 'It removes things from pictures by imagining what was behind them.' },
      { id: 'calendar', label: 'Paper Calendar', emoji: '📆', isAI: false, why: 'Paper and dates. You do all the thinking.' },
      { id: 'agent-helper', label: 'Agentic Home Helper', emoji: '🕸️', isAI: true, why: 'Give it a goal like "plan dinner" and it takes the steps by itself.' },
      { id: 'can-opener', label: 'Can Opener', emoji: '🥫', isAI: false, why: 'Gears and a blade. You turn the handle — that is it.' },
    ],
    subtle: [
      { id: 'cam-lookup', label: 'Camera Visual Search', emoji: '🖼️', isAI: true, subtle: true, why: 'Aim your camera and it names objects and finds where to buy them.' },
      { id: 'face-doorbell', label: 'Face-Aware Doorbell', emoji: '👋', isAI: true, subtle: true, why: 'It learns your family faces and greets each person by name.' },
      { id: 'restock-agent', label: 'Restock Agent', emoji: '🛒', isAI: true, subtle: true, why: 'It watches what you use and orders more before you run out — on its own.' },
    ],
  },
];

const LEVELS: LevelConfig[] = THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  emoji: t.emoji,
  difficulty: t.difficulty,
  starThresholds: [40, 65, 85], // percentage cut-offs (stars computed by ratio)
  xpReward: t.xpReward,
  isBonus: t.isBonus,
}));

type Band = 'A' | 'B' | 'C';

/** Build the 8-tile board for a level, differentiated by age band. */
function tilesForBand(theme: Theme, band: Band): SpyTile[] {
  // Band C gets the subtler 2026 objects mixed in; A & B get the clearer core.
  if (band === 'C' && theme.subtle.length > 0) {
    const keep = Math.max(0, 8 - theme.subtle.length);
    return [...theme.core.slice(0, keep), ...theme.subtle].slice(0, 8);
  }
  return theme.core.slice(0, 8);
}

function computeStars(correct: number, wrong: number, target: number): 0 | 1 | 2 | 3 {
  const ratio = target > 0 ? correct / target : 0;
  if (ratio >= 0.9 && wrong <= 1) return 3;
  if (ratio >= 0.65 && wrong <= 2) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

// ════════════════════════════════════════════════════════════════════════
// TILE BUTTON — object stays UNLABELED until scanned/revealed (G1 honesty)
// ════════════════════════════════════════════════════════════════════════
function SpyTileButton({
  tile, state, tint, reducedMotion, disabled, onTap,
}: {
  tile: SpyTile;
  state: 'idle' | 'scanning' | 'revealed';
  tint: string;
  reducedMotion: boolean;
  disabled: boolean;
  onTap: () => void;
}) {
  const revealed = state === 'revealed';
  const scanning = state === 'scanning';
  const ai = tile.isAI;

  const border = revealed
    ? (ai ? `${LAB_COLOR}` : '#B7BEC8')
    : scanning ? LAB_COLOR : `${tint}55`;
  const bg = revealed
    ? (ai ? `${LAB_COLOR}14` : '#EEF0F5')
    : `linear-gradient(135deg, ${tint}12, ${tint}05)`;

  return (
    <motion.button
      type="button"
      onClick={onTap}
      disabled={disabled || revealed}
      aria-pressed={revealed}
      aria-label={
        revealed
          ? `${tile.label}. ${ai ? 'Uses AI' : 'No AI'}. ${tile.why}`
          : scanning
            ? `${tile.label}. Scanning…`
            : `${tile.label}. Tap to scan for AI.`
      }
      className="relative flex flex-col items-center justify-center gap-1 rounded-2xl p-3 overflow-hidden
        transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-default"
      style={{
        minHeight: 96,
        background: bg,
        border: `2px solid ${border}`,
        boxShadow: revealed && ai ? `0 0 16px ${LAB_COLOR}30` : 'none',
        ['--tw-ring-color' as string]: LAB_COLOR,
      }}
      whileHover={disabled || revealed ? undefined : { scale: 1.04, y: -2 }}
      whileTap={disabled || revealed ? undefined : { scale: 0.96 }}
    >
      <span className="text-3xl" aria-hidden="true" style={{ opacity: revealed && !ai ? 0.5 : 1 }}>
        {tile.emoji}
      </span>
      <span
        className="text-xs font-semibold text-center leading-tight"
        style={{ color: revealed && !ai ? '#7A8296' : '#1A1D2B' }}
      >
        {tile.label}
      </span>

      {/* Reveal badge — appears only AFTER scan (never pre-labeled) */}
      {revealed && (
        <motion.span
          initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-0.5 px-2 py-0.5 rounded-full font-bold"
          style={{
            fontSize: 10,
            background: ai ? `${LAB_COLOR}22` : '#DCE0E8',
            color: ai ? '#0A7FB0' : '#5A6078',
          }}
        >
          {ai ? 'USES AI' : 'NO AI'}
        </motion.span>
      )}

      {/* Sparky scan beam — a light bar sweeping the tile before the reveal */}
      <AnimatePresence>
        {scanning && (
          <motion.span
            key="beam"
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 h-6"
            style={{
              top: 0,
              background: `linear-gradient(180deg, transparent, ${LAB_COLOR}66, ${LAB_COLOR}, ${LAB_COLOR}66, transparent)`,
              boxShadow: `0 0 14px ${LAB_COLOR}`,
            }}
            initial={{ y: reducedMotion ? 30 : -24, opacity: reducedMotion ? 0.6 : 0 }}
            animate={reducedMotion ? { opacity: 0.6 } : { y: 96, opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.75, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
      {scanning && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ border: `2px solid ${LAB_COLOR}`, boxShadow: `inset 0 0 18px ${LAB_COLOR}55` }}
        />
      )}
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the themed hunt
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  theme, band, onComplete, onExit,
}: {
  theme: Theme; band: Band; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = !!useReducedMotion();
  const { safeTimeout } = useSafeTimeout();
  const predictFirst = band === 'C';

  const tiles = useMemo(() => tilesForBand(theme, band), [theme, band]);
  const prizeTotal = useMemo(() => tiles.filter((t) => t.isAI).length, [tiles]);
  const target = predictFirst ? tiles.length : prizeTotal;
  const maxScore = target * 10 + 20;

  const [phase, setPhase] = useState<'welcome' | 'hunt'>('welcome');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [predictFor, setPredictFor] = useState<SpyTile | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [sparky, setSparky] = useState<SparkyExpression>('happy');
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);
  const [finished, setFinished] = useState(false);

  const revealedCount = Object.keys(revealed).length;
  const busy = scanningId !== null || predictFor !== null || finished;

  const finishLevel = useCallback((fScore: number, fCorrect: number, fWrong: number) => {
    if (finished) return;
    setFinished(true);
    const all: Record<string, boolean> = {};
    tiles.forEach((t) => { all[t.id] = true; });
    setRevealed(all);
    const stars = computeStars(fCorrect, fWrong, target);
    setSparky(stars >= 2 ? 'celebrating' : 'happy');
    safeTimeout(() => {
      onComplete({
        score: fScore,
        maxScore,
        stars,
        xpEarned: theme.xpReward * (stars / 3),
        timeMs: 0,
      });
    }, prefersReducedMotion ? 600 : 1300);
  }, [finished, tiles, target, maxScore, theme.xpReward, onComplete, safeTimeout, prefersReducedMotion]);

  // Apply the outcome of a decision (shared by classic tap + predict-first).
  const resolve = useCallback((tile: SpyTile, decidedAI: boolean) => {
    setRevealed((r) => ({ ...r, [tile.id]: true }));
    const isRight = decidedAI === tile.isAI;

    if (isRight) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      const nextCorrect = correct + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setCorrect(nextCorrect);
      setSparky('excited');
      setFeedback({
        type: 'correct',
        message: tile.isAI
          ? (nextCombo > 2 ? `${nextCombo}x combo! AI spotted +${gained}` : `AI signal! +${gained}`)
          : `Correct — no AI there. +${gained}`,
        explanation: tile.why,
      });
      juice.onCorrect(nextCorrect, nextScore);
      // Classic mode ends when every AI object is found; predict mode when all scanned.
      const doneNow = predictFirst
        ? (revealedCount + 1) >= tiles.length
        : nextCorrect >= prizeTotal;
      if (doneNow) finishLevel(nextScore, nextCorrect, wrong);
    } else {
      const nextWrong = wrong + 1;
      setCombo(0);
      setWrong(nextWrong);
      setSparky('surprised');
      setFeedback({
        type: tile.isAI ? 'wrong' : 'info',
        message: tile.isAI ? 'That one DOES use AI!' : 'Nope — no AI in that one.',
        explanation: tile.why,
      });
      juice.onWrong(0, score);
      const doneNow = predictFirst && (revealedCount + 1) >= tiles.length;
      if (doneNow) finishLevel(score, correct, nextWrong);
    }
  }, [combo, score, correct, wrong, predictFirst, revealedCount, tiles.length, prizeTotal, juice, finishLevel]);

  const handleTap = useCallback((tile: SpyTile) => {
    if (busy || revealed[tile.id]) return;
    setFeedback(null);
    setScanningId(tile.id);
    setSparky('thinking');
    safeTimeout(() => {
      setScanningId(null);
      if (predictFirst) {
        setPredictFor(tile);       // band C commits a guess before the reveal
        setSparky('speaking');
      } else {
        resolve(tile, true);       // classic: tapping = "I think this uses AI"
      }
    }, prefersReducedMotion ? 220 : 850);
  }, [busy, revealed, predictFirst, resolve, safeTimeout, prefersReducedMotion]);

  const submitPrediction = useCallback((guess: boolean) => {
    if (!predictFor) return;
    const tile = predictFor;
    setPredictFor(null);
    resolve(tile, guess);
  }, [predictFor, resolve]);

  const progress = predictFirst ? revealedCount : correct;

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={theme.emoji} color={LAB_COLOR}>
          Level {theme.id}: {theme.name}
        </GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <SparkyCore expression="happy" pixelSize={52} glowColor={LAB_COLOR} />
            <p className="text-sm" style={{ color: '#5A6078' }}>{theme.description}</p>
          </div>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}12`, color: '#0A7FB0' }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {theme.concept}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3512', color: '#C2521F' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {predictFirst ? (
                <><strong>Predict-first:</strong> Tap any object, then commit your guess — does it use AI? You score on your guesses, so be honest!</>
              ) : (
                <><strong>Hunt:</strong> Tap every object you think uses AI. Find all {prizeTotal} hidden AIs!</>
              )}
            </span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('hunt')}>
          {predictFirst ? 'Start Predicting' : 'Start Hunt'} <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ HUNT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SparkyCore expression={sparky} pixelSize={40} glowColor={LAB_COLOR} />
          <GlowingTitle emoji={theme.emoji} color={LAB_COLOR}>
            {predictFirst ? 'Scan & Predict' : 'Find the AI'}
          </GlowingTitle>
        </div>
        <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#0A7FB0' }}>
          <Eye className="w-4 h-4 inline mr-1" />{progress} / {target}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} label={predictFirst ? 'Prediction score' : 'AI-spy score'} />
      <ComboCounter combo={combo} />

      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        role="group"
        aria-label={`${theme.name} objects — tap to scan for AI`}
      >
        {tiles.map((tile) => (
          <SpyTileButton
            key={tile.id}
            tile={tile}
            state={revealed[tile.id] ? 'revealed' : scanningId === tile.id ? 'scanning' : 'idle'}
            tint={theme.tint}
            reducedMotion={prefersReducedMotion}
            disabled={busy}
            onTap={() => handleTap(tile)}
          />
        ))}
      </div>

      {/* Band-C predict prompt — appears after the scan, before the reveal */}
      <AnimatePresence>
        {predictFor && (
          <motion.div
            key="predict"
            role="group"
            aria-label={`Predict: does the ${predictFor.label} use AI?`}
            className="rounded-2xl p-4"
            style={{ background: `${LAB_COLOR}10`, border: `1px solid ${LAB_COLOR}40` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#1A1D2B' }}>
              <ScanLine className="w-4 h-4" style={{ color: LAB_COLOR }} />
              Scanned <strong>{predictFor.label}</strong> {predictFor.emoji} — does it use AI?
            </p>
            <div className="flex gap-2">
              <SFButton variant="primary" className="flex-1" onClick={() => submitPrediction(true)}>
                Uses AI
              </SFButton>
              <SFButton variant="outline" className="flex-1" onClick={() => submitPrediction(false)}>
                No AI
              </SFButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {feedback && <FeedbackPopup key={feedback.message} {...feedback} />}
      </AnimatePresence>

      <div className="flex gap-2">
        <SFButton
          variant="primary"
          className="flex-1"
          disabled={busy}
          onClick={() => finishLevel(score, correct, wrong)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {progress >= target ? 'All scanned!' : 'Finish level'}
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Back to level map">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function AiSpyGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const avgStars = results.length
      ? results.reduce((s, r) => s + r.stars, 0) / results.length
      : 0;
    const stars = (avgStars >= 2.4 ? 3 : avgStars >= 1.5 ? 2 : 1) as 1 | 2 | 3;
    awardXP(Math.round(totalXP));
    completeGame('ai-spy', stars); // fires once, 1–3 stars
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Spy" color={LAB_COLOR} labNum={1}>
      <GameLevelSystem
        gameTitle="AI Spy"
        gameEmoji="🔍"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onLevelComplete, onExit) => {
          const theme = THEMES.find((t) => t.id === level.id) ?? THEMES[0];
          return (
            <LevelRenderer
              theme={theme}
              band={band}
              onComplete={onLevelComplete}
              onExit={onExit}
            />
          );
        }}
      />
    </GameShell>
  );
}
