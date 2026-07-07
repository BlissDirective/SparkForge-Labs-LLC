// ════════════════════════════════════════════════════════════════════════
// PET TRAINER v5 — Lab 2 Flagship (Reinforcement-Learning rebuild)
// ════════════════════════════════════════════════════════════════════════
// A REAL trial-based behavior-shaping loop. The pet attempts a trick sampled
// from a softmax policy over its action set. Within a timing window the child
// taps Treat (reward +1) or No (correction −1). The tapped action's weight is
// updated with a genuine *gradient-bandit* rule (Sutton & Barto §2.8):
//
//     wᵢ ← wᵢ + α · r · ( 1{i = attempted} − π(i) )
//
// The behavior meter shows π(desired) — the probability the pet performs the
// desired action — which is a REAL function of the reward history. There are
// no hidden target numbers (G1 honesty). Reward the WRONG attempt and the pet
// reliably learns the wrong trick — the meter and the policy bars show it.
//
// Pet is animated SVG/emoji + DOM meters. No Pixi, no Three.js, no GLB assets.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Cookie, Ban, Zap, RotateCcw, Star, ChevronRight, Trophy, Check } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import type { AgeBand } from '@/types';

const LAB_COLOR = '#4F6EF7';

// ── RL constants ─────────────────────────────────────────────────────────
const THRESHOLD = 0.8; // reliability needed to call a cue "learned"

// Per-band tuning. Band A: forgiving timing + faster learning. Band C: tight.
const BAND_TUNING: Record<AgeBand, { alpha: number; windowMs: number; maxTrials: number }> = {
  A: { alpha: 0.9, windowMs: 4200, maxTrials: 24 },
  B: { alpha: 0.8, windowMs: 3000, maxTrials: 20 },
  C: { alpha: 0.7, windowMs: 2200, maxTrials: 18 },
};

// ── Action catalogue (text labels; pet emoji animates the pose) ──────────
type ActionId = 'sit' | 'stay' | 'spin' | 'bark' | 'shake' | 'liedown' | 'beg';

const ACTIONS: Record<ActionId, { label: string }> = {
  sit: { label: 'Sits' },
  stay: { label: 'Stays' },
  spin: { label: 'Spins' },
  bark: { label: 'Barks' },
  shake: { label: 'Shakes paw' },
  liedown: { label: 'Lies down' },
  beg: { label: 'Begs' },
};

// Pose transforms for the animated pet sprite (motion variants).
const POSE: Record<ActionId, Record<string, number | number[]>> = {
  sit: { y: 14, scaleY: 0.82, rotate: 0 },
  stay: { y: 0, scale: 1, rotate: 0 },
  spin: { rotate: 360, y: -4 },
  bark: { scale: [1, 1.18, 1, 1.14, 1], x: [0, -3, 3, -2, 0] },
  shake: { rotate: [0, -14, 12, -10, 0], x: [0, 4, -4, 0] },
  liedown: { rotate: 78, y: 16 },
  beg: { y: -18, scaleY: 1.08 },
};

// ── Cue / Level definitions ──────────────────────────────────────────────
interface Cue {
  id: string;
  prompt: string; // what the trainer signals, e.g. "Sit!"
  desired: ActionId;
}

interface LevelDef {
  id: number;
  name: string;
  pet: string; // content emoji (kept minimal across the file)
  petName: string;
  story: string;
  concept: string;
  coachIntro: string;
  actions: ActionId[]; // policy support (softmax over these)
  cues: Cue[]; // 1 = single trick, 2 = multi-trick / chain
  sequential?: boolean; // chain: cue[1] unlocks only after cue[0] is reliable
  preload?: Record<string, Partial<Record<ActionId, number>>>; // mistrained start
  bands: AgeBand[];
}

const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Puppy School — Sit',
    pet: '🐕',
    petName: 'Sparky Jr.',
    story: 'Give the "Sit!" cue, watch what the puppy tries, then reward the right attempt.',
    concept:
      'Reinforcement learning: the pet picks an action from a probability policy. A reward nudges the weight of the action it just tried UP; a correction nudges it DOWN. Reward the right attempt and "Sit" becomes reliable.',
    coachIntro:
      'Hi, I\'m Sparky the vet coach! The puppy guesses at first. Tap Treat the instant it sits — reward timing is the whole trick.',
    actions: ['sit', 'spin', 'bark'],
    cues: [{ id: 'sit', prompt: 'Sit!', desired: 'sit' }],
    bands: ['A', 'B', 'C'],
  },
  {
    id: 2,
    name: 'Kitty School — Stay',
    pet: '🐱',
    petName: 'Mochi',
    story: 'Same loop, new trick. Reward "Stay" and correct the wrong guesses.',
    concept:
      'Corrections matter too. Tapping "No" on a wrong attempt pushes that action DOWN and spreads probability to the others — the policy learns from mistakes as well as rewards.',
    coachIntro:
      'Cats are choosy! Use "No" when Mochi does the wrong thing — a correction is a negative reward signal.',
    actions: ['stay', 'spin', 'bark'],
    cues: [{ id: 'stay', prompt: 'Stay!', desired: 'stay' }],
    bands: ['A', 'B', 'C'],
  },
  {
    id: 3,
    name: 'Parrot School — Two Cues',
    pet: '🦜',
    petName: 'Kiwi',
    story: 'Two different signals, two different tricks. Read the cue before you reward.',
    concept:
      'A contextual policy: each cue keeps its OWN weights. The same treat means different things depending on the signal shown — that is how one learner handles many behaviors.',
    coachIntro:
      'Watch the cue box! When it says "Shake" reward a paw, when it says "Sit" reward a sit. Different context, different right answer.',
    actions: ['sit', 'shake', 'spin', 'bark'],
    cues: [
      { id: 'sit', prompt: 'Sit!', desired: 'sit' },
      { id: 'shake', prompt: 'Shake!', desired: 'shake' },
    ],
    bands: ['B', 'C'],
  },
  {
    id: 4,
    name: 'Chain School — Sit ▸ Shake',
    pet: '🐕',
    petName: 'Rex',
    story: 'Shape a chain: make "Sit" reliable FIRST, then the "Shake" step unlocks.',
    concept:
      'Shaping by successive approximation: you build a chain one reliable link at a time. The second cue only unlocks once the first behavior is dependable — exactly how trainers (and curricula) grow complex skills.',
    coachIntro:
      'Chains are built step by step, Rex. Lock in "Sit" to 80% first — then I\'ll open up the "Shake" step.',
    actions: ['sit', 'shake', 'spin', 'bark'],
    cues: [
      { id: 'sit', prompt: 'Step 1 — Sit!', desired: 'sit' },
      { id: 'shake', prompt: 'Step 2 — Shake!', desired: 'shake' },
    ],
    sequential: true,
    bands: ['C'],
  },
  {
    id: 5,
    name: 'Rescue — Fix the Mistrained Pet',
    pet: '🐕',
    petName: 'Bandit',
    story: 'Bandit was rewarded for spinning by mistake. Retrain him to actually SIT.',
    concept:
      'Un-learning: Bandit\'s policy starts biased toward "Spin" because someone rewarded the wrong attempt. Corrections drive that weight back down while treats build "Sit" up — proof the meter only ever reflects the reward history.',
    coachIntro:
      'Poor Bandit was taught wrong — he spins for everything. Tap "No" when he spins, Treat only when he sits. You can un-teach a bad habit.',
    actions: ['sit', 'spin', 'bark'],
    cues: [{ id: 'sit', prompt: 'Sit!', desired: 'sit' }],
    preload: { sit: { spin: 2.4 } }, // wrong action pre-weighted → π(spin) ≈ 0.9
    bands: ['C'],
  },
];

// ── Pure RL helpers (exported-in-spirit; deterministic given inputs) ──────
type WeightMap = Partial<Record<ActionId, number>>;

/** Softmax policy π over a cue's action support. */
function policy(weights: WeightMap, actions: ActionId[]): Record<string, number> {
  const ws = actions.map((a) => weights[a] ?? 0);
  const max = Math.max(...ws);
  const exps = ws.map((w) => Math.exp(w - max));
  const sum = exps.reduce((s, e) => s + e, 0) || 1;
  const out: Record<string, number> = {};
  actions.forEach((a, i) => {
    out[a] = exps[i] / sum;
  });
  return out;
}

/** Sample an action from the policy (the pet's actual attempt). */
function sampleAction(probs: Record<string, number>, actions: ActionId[]): ActionId {
  const r = Math.random();
  let acc = 0;
  for (const a of actions) {
    acc += probs[a] ?? 0;
    if (r <= acc) return a;
  }
  return actions[actions.length - 1];
}

/**
 * Gradient-bandit update (Sutton & Barto §2.8):
 *   wᵢ ← wᵢ + α · r · (1{i=attempted} − π(i))
 * reward = +1 (treat) or −1 (correction). Applies to ALL support actions.
 */
function updateWeights(
  weights: WeightMap,
  actions: ActionId[],
  attempted: ActionId,
  reward: number,
  alpha: number,
): WeightMap {
  const probs = policy(weights, actions);
  const next: WeightMap = { ...weights };
  for (const a of actions) {
    const indicator = a === attempted ? 1 : 0;
    next[a] = (weights[a] ?? 0) + alpha * reward * (indicator - probs[a]);
  }
  return next;
}

/** Timing factor: prompt taps reward at full strength, late taps weaker. */
function timingFactor(elapsedMs: number, windowMs: number): number {
  const f = 1 - (elapsedMs / windowMs) * 0.85;
  return Math.max(0.15, Math.min(1, f));
}

// ── Small presentational pieces ──────────────────────────────────────────
function CoachBubble({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border p-3"
      style={{ borderColor: `${LAB_COLOR}44`, background: `${LAB_COLOR}12` }}
    >
      <span aria-hidden className="text-2xl leading-none">🩺</span>
      <p className="text-sm text-white/85">
        <span className="font-semibold" style={{ color: LAB_COLOR }}>Coach Sparky: </span>
        {text}
      </p>
    </div>
  );
}

function PetSprite({
  emoji,
  pose,
  active,
  reduced,
}: {
  emoji: string;
  pose: ActionId | null;
  active: boolean;
  reduced: boolean;
}) {
  const target = pose && !reduced ? POSE[pose] : reduced ? { scale: active ? 1.06 : 1 } : { y: 0, rotate: 0, scale: 1 };
  return (
    <div
      className="relative flex items-center justify-center rounded-3xl border"
      style={{
        width: 180,
        height: 180,
        borderColor: `${LAB_COLOR}55`,
        background: `radial-gradient(circle at 50% 40%, ${LAB_COLOR}22, rgba(0,0,0,0.35))`,
      }}
    >
      <motion.span
        aria-hidden
        className="select-none"
        style={{ fontSize: 96, display: 'inline-block', originY: 1 }}
        animate={target}
        transition={{ duration: reduced ? 0.2 : 0.7, ease: 'easeInOut' }}
      >
        {emoji}
      </motion.span>
    </div>
  );
}

function PolicyBars({
  probs,
  actions,
  desired,
}: {
  probs: Record<string, number>;
  actions: ActionId[];
  desired: ActionId;
}) {
  return (
    <div className="space-y-2">
      {actions.map((a) => {
        const pct = Math.round((probs[a] ?? 0) * 100);
        const isDesired = a === desired;
        return (
          <div key={a} className="flex items-center gap-2">
            <span
              className="w-24 shrink-0 text-xs"
              style={{ color: isDesired ? LAB_COLOR : 'rgba(255,255,255,0.6)' }}
            >
              {ACTIONS[a].label}
              {isDesired ? ' ★' : ''}
            </span>
            <div
              className="h-3 flex-1 overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: isDesired ? LAB_COLOR : 'rgba(255,255,255,0.45)' }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-white/60">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Per-level RL stage ────────────────────────────────────────────────────
type TrialPhase = 'ready' | 'attempting' | 'window' | 'resolved';

interface LevelOutcome {
  stars: number;
  reliability: number; // final min π(desired) across cues, 0..1
  learned: boolean;
  xp: number;
  trials: number;
}

function LevelStage({
  level,
  band,
  index,
  total,
  onDone,
}: {
  level: LevelDef;
  band: AgeBand;
  index: number;
  total: number;
  onDone: (o: LevelOutcome) => void;
}) {
  const reduced = !!useReducedMotion();
  const tuning = BAND_TUNING[band];
  const anim = reduced ? 250 : 700;

  // weights: cueId -> action -> weight
  const [weights, setWeights] = useState<Record<string, WeightMap>>(() => {
    const init: Record<string, WeightMap> = {};
    for (const c of level.cues) init[c.id] = { ...(level.preload?.[c.id] ?? {}) };
    return init;
  });
  const [unlocked, setUnlocked] = useState<number>(level.sequential ? 1 : level.cues.length);
  const [cueIdx, setCueIdx] = useState(0);
  const [trials, setTrials] = useState(0);
  const [phase, setPhase] = useState<TrialPhase>('ready');
  const [attempt, setAttempt] = useState<ActionId | null>(null);
  const [windowPct, setWindowPct] = useState(0);
  const [flash, setFlash] = useState<{ kind: 'treat' | 'no' | 'miss'; text: string } | null>(null);
  const [finished, setFinished] = useState(false);

  const windowStartRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const activeCue = level.cues[cueIdx];
  const activeActions = level.actions;

  // Live policies + reliabilities.
  const cueProbs = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const c of level.cues) out[c.id] = policy(weights[c.id] ?? {}, level.actions);
    return out;
  }, [weights, level.cues, level.actions]);

  const reliabilityOf = useCallback(
    (c: Cue) => cueProbs[c.id]?.[c.desired] ?? 0,
    [cueProbs],
  );

  // Which cues count toward completion (unlocked ones).
  const activeCueList = level.cues.slice(0, unlocked);
  const minReliability = Math.min(...level.cues.map(reliabilityOf));

  const finalizeLevel = useCallback(
    (learned: boolean, usedTrials: number) => {
      if (finished) return;
      setFinished(true);
      clearTimers();
      const nCues = level.cues.length;
      const good = 6 * nCues;
      const ok = 11 * nCues;
      let stars: number;
      if (learned) stars = usedTrials <= good ? 3 : usedTrials <= ok ? 2 : 1;
      else stars = 1;
      const rel = Math.min(...level.cues.map(reliabilityOf));
      const xp = 40 + level.id * 20 + stars * 15;
      // small pause so the final bar animation is visible
      timersRef.current.push(
        setTimeout(() => onDone({ stars, reliability: rel, learned, xp, trials: usedTrials }), 650),
      );
    },
    [finished, level.cues, level.id, onDone, reliabilityOf],
  );

  // Pick the next cue to present.
  const pickNextCue = useCallback(
    (nextUnlocked: number) => {
      if (level.sequential) return Math.min(nextUnlocked, level.cues.length) - 1;
      if (level.cues.length === 1) return 0;
      return (cueIdx + 1) % nextUnlocked; // round-robin over unlocked cues
    },
    [level.sequential, level.cues.length, cueIdx],
  );

  // Start one attempt (pet samples an action from its current policy).
  const giveCue = useCallback(() => {
    if (phase !== 'ready' || finished) return;
    const probs = policy(weights[activeCue.id] ?? {}, activeActions);
    const chosen = sampleAction(probs, activeActions);
    setAttempt(chosen);
    setFlash(null);
    setPhase('attempting');
    timersRef.current.push(
      setTimeout(() => {
        windowStartRef.current = Date.now();
        setWindowPct(0);
        setPhase('window');
      }, anim),
    );
  }, [phase, finished, weights, activeCue, activeActions, anim]);

  // Window countdown.
  useEffect(() => {
    if (phase !== 'window') return;
    const iv = setInterval(() => {
      const elapsed = Date.now() - windowStartRef.current;
      const pct = Math.min(1, elapsed / tuning.windowMs);
      setWindowPct(pct);
      if (pct >= 1) {
        clearInterval(iv);
        // expired → missed reward → NO learning (timing lesson).
        resolveTrial(null);
      }
    }, 50);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Apply a Treat (+1) / No (−1) / miss (null).
  const resolveTrial = useCallback(
    (reward: 1 | -1 | null) => {
      if (phase !== 'window' || attempt == null || finished) return;
      const elapsed = Date.now() - windowStartRef.current;
      const factor = timingFactor(elapsed, tuning.windowMs);
      const cueId = activeCue.id;

      let nextWeights = weights;
      if (reward != null) {
        const updated = updateWeights(weights[cueId] ?? {}, activeActions, attempt, reward, tuning.alpha * factor);
        nextWeights = { ...weights, [cueId]: updated };
        setWeights(nextWeights);
      }

      const usedTrials = trials + 1;
      setTrials(usedTrials);
      setPhase('resolved');
      setFlash(
        reward == null
          ? { kind: 'miss', text: 'Too slow — no reward signal. Timing matters!' }
          : reward > 0
            ? { kind: 'treat', text: `Rewarded "${ACTIONS[attempt].label}".` }
            : { kind: 'no', text: `Corrected "${ACTIONS[attempt].label}".` },
      );

      // Recompute reliability off the NEW weights.
      const relOf = (c: Cue) => (policy(nextWeights[c.id] ?? {}, level.actions))[c.desired] ?? 0;

      // Sequential unlock: first cue reliable → open next step.
      let nextUnlocked = unlocked;
      if (level.sequential && unlocked < level.cues.length) {
        if (relOf(level.cues[unlocked - 1]) >= THRESHOLD) nextUnlocked = unlocked + 1;
        setUnlocked(nextUnlocked);
      }

      const allActive = level.cues.slice(0, nextUnlocked);
      const learned = nextUnlocked >= level.cues.length && allActive.every((c) => relOf(c) >= THRESHOLD);

      timersRef.current.push(
        setTimeout(() => {
          if (learned) {
            finalizeLevel(true, usedTrials);
            return;
          }
          if (usedTrials >= tuning.maxTrials) {
            finalizeLevel(false, usedTrials);
            return;
          }
          setCueIdx(pickNextCue(nextUnlocked));
          setAttempt(null);
          setPhase('ready');
        }, 950),
      );
    },
    [phase, attempt, finished, weights, trials, tuning, activeCue, activeActions, unlocked, level, pickNextCue, finalizeLevel],
  );

  // Keyboard: G/Space = give cue, T = treat, N = no.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((k === 'g' || k === ' ') && phase === 'ready') {
        e.preventDefault();
        giveCue();
      } else if (k === 't' && phase === 'window') {
        e.preventDefault();
        resolveTrial(1);
      } else if (k === 'n' && phase === 'window') {
        e.preventDefault();
        resolveTrial(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, giveCue, resolveTrial]);

  const meterPct = Math.round(minReliability * 100);
  const meterLabel =
    level.cues.length > 1
      ? `Reliability (weakest trick): ${meterPct}%`
      : `${ACTIONS[activeCue.desired].label.replace(/s$/, '')} reliability: ${meterPct}%`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>
          Level {index + 1} / {total} · Band {band}
        </span>
        <span className="tabular-nums">
          Trials: {trials} / {tuning.maxTrials}
        </span>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white">{level.name}</h2>
        <p className="text-sm text-white/70">{level.story}</p>
      </div>

      <CoachBubble text={level.coachIntro} />

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        {/* Pet + cue */}
        <div className="flex flex-col items-center gap-3">
          <PetSprite emoji={level.pet} pose={phase === 'attempting' || phase === 'window' || phase === 'resolved' ? attempt : null} active={phase !== 'ready'} reduced={reduced} />
          <div
            className="rounded-xl border px-4 py-2 text-center"
            style={{ borderColor: `${LAB_COLOR}55`, background: 'rgba(255,255,255,0.05)' }}
          >
            <div className="text-xs uppercase tracking-wide text-white/60">Cue</div>
            <div className="text-base font-bold" style={{ color: LAB_COLOR }}>{activeCue.prompt}</div>
          </div>
          <div className="text-center text-sm text-white/80" style={{ minHeight: '1.25rem' }} aria-live="polite">
            {phase === 'attempting' && `${level.petName} is thinking…`}
            {phase === 'window' && attempt && `${level.petName} ${ACTIONS[attempt].label.toLowerCase()}!`}
            {phase === 'ready' && `Give the cue to start a trial.`}
          </div>
        </div>

        {/* Meter + policy */}
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Behavior meter</span>
              <span className="tabular-nums" style={{ color: meterPct >= THRESHOLD * 100 ? LAB_COLOR : 'rgba(255,255,255,0.7)' }}>
                {meterPct}%
              </span>
            </div>
            <div
              className="h-5 w-full overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              role="progressbar"
              aria-valuenow={meterPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Probability the pet performs the desired action"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${LAB_COLOR}, #8FA6FF)` }}
                animate={{ width: `${meterPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-1 text-xs text-white/60" aria-live="polite">
              {meterLabel} · goal {Math.round(THRESHOLD * 100)}%
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-white/60">
              Policy for “{activeCue.prompt}” (what the pet is likely to try)
            </div>
            <PolicyBars probs={cueProbs[activeCue.id]} actions={activeActions} desired={activeCue.desired} />
          </div>
        </div>
      </div>

      {/* Timing window */}
      <div style={{ minHeight: '0.75rem' }}>
        {phase === 'window' && (
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} aria-hidden>
            <div
              className="h-full"
              style={{ width: `${Math.max(0, (1 - windowPct) * 100)}%`, background: windowPct > 0.7 ? '#F87171' : LAB_COLOR }}
            />
          </div>
        )}
      </div>

      {/* Feedback flash */}
      <div className="text-center text-sm" style={{ minHeight: '1.5rem' }} aria-live="assertive">
        <AnimatePresence mode="wait">
          {flash && (
            <motion.div
              key={flash.text}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ color: flash.kind === 'treat' ? LAB_COLOR : flash.kind === 'no' ? '#FBBF24' : '#F87171' }}
            >
              {flash.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={giveCue}
          disabled={phase !== 'ready'}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:opacity-40"
          style={{ background: `${LAB_COLOR}` }}
          aria-label="Give the cue (keyboard G)"
        >
          <Zap size={18} aria-hidden /> Give cue
        </button>
        <button
          type="button"
          onClick={() => resolveTrial(1)}
          disabled={phase !== 'window'}
          className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold text-white transition disabled:opacity-30"
          style={{ borderColor: `${LAB_COLOR}`, background: `${LAB_COLOR}22` }}
          aria-label="Give a treat — reward the attempt (keyboard T)"
        >
          <Cookie size={18} aria-hidden /> Treat
        </button>
        <button
          type="button"
          onClick={() => resolveTrial(-1)}
          disabled={phase !== 'window'}
          className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold text-white transition disabled:opacity-30"
          style={{ borderColor: '#FBBF2488', background: '#FBBF2418' }}
          aria-label="Say no — correct the attempt (keyboard N)"
        >
          <Ban size={18} aria-hidden /> No
        </button>
      </div>

      <p className="text-center text-xs text-white/60">
        Reward the WRONG attempt and the pet reliably learns the wrong trick — watch the policy bars.
      </p>
    </div>
  );
}

// ── Screens ───────────────────────────────────────────────────────────────
function StarRow({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} size={22} aria-hidden fill={i < n ? LAB_COLOR : 'transparent'} color={i < n ? LAB_COLOR : 'rgba(255,255,255,0.35)'} />
      ))}
    </span>
  );
}

function LevelCompleteScreen({
  level,
  outcome,
  isLast,
  onNext,
}: {
  level: LevelDef;
  outcome: LevelOutcome;
  isLast: boolean;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 text-center">
      <div className="text-5xl" aria-hidden>{level.pet}</div>
      <h2 className="text-xl font-bold text-white">
        {outcome.learned ? `${level.petName} learned it!` : `${level.petName} needs more practice`}
      </h2>
      <div className="flex items-center justify-center gap-3">
        <StarRow n={outcome.stars} />
      </div>
      <p className="text-sm text-white/70">
        Final reliability {Math.round(outcome.reliability * 100)}% in {outcome.trials} trials.
      </p>
      <div className="rounded-2xl border p-4 text-left" style={{ borderColor: `${LAB_COLOR}44`, background: `${LAB_COLOR}10` }}>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: LAB_COLOR }}>
          The concept
        </div>
        <p className="text-sm text-white/80">{level.concept}</p>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
        style={{ background: LAB_COLOR }}
      >
        {isLast ? <Trophy size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
        {isLast ? 'Finish' : 'Next level'}
      </button>
    </div>
  );
}

function GameCompleteScreen({
  outcomes,
  stars,
  xp,
  onReplay,
}: {
  outcomes: LevelOutcome[];
  stars: number;
  xp: number;
  onReplay: () => void;
}) {
  const learned = outcomes.filter((o) => o.learned).length;
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 text-center">
      <div className="text-5xl" aria-hidden>🏆</div>
      <h2 className="text-2xl font-bold text-white">Trainer certified!</h2>
      <div className="flex items-center justify-center gap-3">
        <StarRow n={stars} />
      </div>
      <p className="text-sm text-white/75">
        You reliably shaped {learned} / {outcomes.length} pets and earned {xp} XP.
      </p>
      <div className="rounded-2xl border p-4 text-left" style={{ borderColor: `${LAB_COLOR}44`, background: `${LAB_COLOR}10` }}>
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold" style={{ color: LAB_COLOR }}>
          <Check size={16} aria-hidden /> What you practiced
        </div>
        <p className="text-sm text-white/80">
          Every wag of the behavior meter came from a real reinforcement update — a treat raised the tried action&apos;s
          weight, a &quot;No&quot; lowered it. That is reinforcement learning: behavior is shaped by the reward signal you
          send, timing included. Reward the wrong thing and the pet faithfully learns the wrong thing.
        </p>
      </div>
      <button
        type="button"
        onClick={onReplay}
        className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold text-white"
        style={{ borderColor: `${LAB_COLOR}`, background: `${LAB_COLOR}22` }}
      >
        <RotateCcw size={18} aria-hidden /> Train again
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
type Screen = 'play' | 'levelDone' | 'gameDone';

export default function PetTrainerGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;

  const levels = useMemo(() => LEVELS.filter((l) => l.bands.includes(band)), [band]);

  const [runId, setRunId] = useState(0); // remount key to reset a level cleanly
  const [levelIdx, setLevelIdx] = useState(0);
  const [screen, setScreen] = useState<Screen>('play');
  const [outcomes, setOutcomes] = useState<LevelOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<LevelOutcome | null>(null);
  const rewarded = useRef(false);

  const level = levels[levelIdx];

  const handleLevelDone = useCallback((o: LevelOutcome) => {
    setLastOutcome(o);
    setOutcomes((prev) => [...prev, o]);
    setScreen('levelDone');
  }, []);

  const finishGame = useCallback(
    (all: LevelOutcome[]) => {
      if (rewarded.current) return;
      rewarded.current = true;
      const totalXP = all.reduce((s, o) => s + o.xp, 0);
      const avgStars = all.reduce((s, o) => s + o.stars, 0) / all.length;
      const stars = avgStars >= 2.5 ? 3 : avgStars >= 1.6 ? 2 : 1;
      awardXP(Math.round(totalXP));
      completeGame('pet-trainer', stars);
    },
    [awardXP, completeGame],
  );

  const goNext = useCallback(() => {
    if (levelIdx + 1 >= levels.length) {
      finishGame(outcomes);
      setScreen('gameDone');
    } else {
      setLevelIdx((i) => i + 1);
      setRunId((r) => r + 1);
      setScreen('play');
    }
  }, [levelIdx, levels.length, outcomes, finishGame]);

  const replay = useCallback(() => {
    rewarded.current = false;
    setOutcomes([]);
    setLastOutcome(null);
    setLevelIdx(0);
    setRunId((r) => r + 1);
    setScreen('play');
  }, []);

  const gameStars = useMemo(() => {
    if (outcomes.length === 0) return 1;
    const avg = outcomes.reduce((s, o) => s + o.stars, 0) / outcomes.length;
    return avg >= 2.5 ? 3 : avg >= 1.6 ? 2 : 1;
  }, [outcomes]);
  const gameXP = useMemo(() => outcomes.reduce((s, o) => s + o.xp, 0), [outcomes]);

  return (
    <GameShell title="Pet Trainer" color={LAB_COLOR} labNum={2}>
      <div className="p-4">
        {screen === 'play' && level && (
          <LevelStage
            key={`${runId}-${level.id}`}
            level={level}
            band={band}
            index={levelIdx}
            total={levels.length}
            onDone={handleLevelDone}
          />
        )}
        {screen === 'levelDone' && level && lastOutcome && (
          <LevelCompleteScreen
            level={level}
            outcome={lastOutcome}
            isLast={levelIdx + 1 >= levels.length}
            onNext={goNext}
          />
        )}
        {screen === 'gameDone' && (
          <GameCompleteScreen outcomes={outcomes} stars={gameStars} xp={gameXP} onReplay={replay} />
        )}
      </div>
    </GameShell>
  );
}
