// ════════════════════════════════════════════════════════════════════════
// PIXEL WITNESS — Lab 7 Flagship (Stage 11C, C4) — Computer Vision
// ════════════════════════════════════════════════════════════════════════
// The child reviews a short scene, sees what a multimodal AI "says" about it,
// toggles which senses (modalities) the AI is allowed to use, and catches the
// spots where the AI is confidently wrong (hallucinations).
//
// This UI drives the REAL engine in `usePixelWitnessStore` (clip + Q/A
// library, sense model, judging + grade engine). No quiz stub — the store
// owns all logic; this file is the presentational layer + state→view /
// controls→action wiring.
//
// HONESTY NOTE: there is no real video file. The engine represents each clip
// as authored metadata + pre-recorded AI answers (no /videos/*.mp4 shipped).
// The UI is deliberately truthful about this — every scene is shown as a
// *represented / described* clip card, never a fake video player.
//
// Phase machine (from pixelWitnessStore.PixelWitnessPhase):
//   welcome → learn-modal → learn-fusion → learn-hallucinate → tutorial
//   → (mode select) → watch-A/B/C · hallucination-hunt · sense-builder
//     · creative-sandbox → report → completeGame
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import {
  usePixelWitnessStore,
  expectedClipCountForMode,
  type PixelWitnessPhase,
} from '@/stores/pixelWitnessStore';
import {
  SENSE_META,
  senseSatisfies,
  senseCost,
  senseLevelLabel,
} from '@/lib/pixelwitness/judgeEngine';
import {
  THEME_META,
  clipsForBand,
  getClip,
  questionsForClip,
} from '@/lib/pixelwitness/clipLibrary';
import type {
  PixelMode,
  SenseConfig,
  SenseLevel,
  PixelClip,
  ClipQuestion,
} from '@/types/pixelWitness';

const LAB = '#10BAD2';
type Band = 'A' | 'B' | 'C';
type Rating = 'correct' | 'partial' | 'hallucination';

// ─── Inline style helpers (no arbitrary Tailwind classes) ─────────────────
const panel: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 16,
};
const primaryBtn: CSSProperties = {
  background: LAB,
  color: '#04191d',
  fontWeight: 700,
  borderRadius: 12,
  padding: '12px 24px',
};
const ghostBtn: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12,
  padding: '10px 20px',
};

const SENSE_ORDER: (keyof SenseConfig)[] = ['caption', 'oneFrame', 'allFrames', 'audio'];

const SENSE_LEVEL_EMOJI: Record<SenseLevel, string> = {
  'caption-only': '📝',
  'one-frame': '🖼️',
  'all-frames': '🎞️',
  audio: '🔊',
};

const RATING_META: Record<Rating, { label: string; emoji: string; hint: string; hex: string }> = {
  correct: { label: 'Correct', emoji: '✅', hint: 'The AI got it right', hex: '#00D17A' },
  partial: { label: 'Partly right', emoji: '🟡', hint: 'Right idea, missed details', hex: '#D9A430' },
  hallucination: { label: 'Made-up!', emoji: '🚨', hint: 'The AI invented something', hex: '#FF7050' },
};

// ─── Tutorial (learn-card) content ────────────────────────────────────────
const LEARN: {
  phase: Extract<PixelWitnessPhase, 'learn-modal' | 'learn-fusion' | 'learn-hallucinate'>;
  key: 'modal' | 'fusion' | 'hallucinate';
  next: PixelWitnessPhase;
  emoji: string;
  title: string;
  body: string[];
}[] = [
  {
    phase: 'learn-modal',
    key: 'modal',
    next: 'learn-fusion',
    emoji: '👁️',
    title: 'An AI has senses too',
    body: [
      'A multimodal AI can take in different kinds of information — a text caption, a single picture, a whole video, or sound.',
      'Each one is like a different sense. The more senses it uses, the more it can figure out.',
    ],
  },
  {
    phase: 'learn-fusion',
    key: 'fusion',
    next: 'learn-hallucinate',
    emoji: '🔀',
    title: 'More senses, better answers',
    body: [
      'With only a short caption, the AI has to guess a lot.',
      'Give it the full scene and the sound, and it can actually check what happened. Combining senses is called fusion.',
    ],
  },
  {
    phase: 'learn-hallucinate',
    key: 'hallucinate',
    next: 'tutorial',
    emoji: '🕵️',
    title: 'Catch the made-up details',
    body: [
      'Sometimes an AI sounds totally sure but invents a detail that was never there. That is a hallucination.',
      'Your job, detective: read each answer and decide if it is correct, partly right, or made-up.',
    ],
  },
];

// ─── Modes offered on the mode-select board ───────────────────────────────
const MODES: { mode: PixelMode; emoji: string; title: string; blurb: string; star?: boolean }[] = [
  { mode: 'watch-A', emoji: '🌱', title: 'Warm-Up Watch', blurb: 'Easy scenes to get your eye in.' },
  { mode: 'watch-B', emoji: '🔎', title: 'Detective Watch', blurb: 'Trickier scenes — read carefully.' },
  { mode: 'watch-C', emoji: '🧠', title: 'Expert Watch', blurb: 'The hardest, sneakiest answers.' },
  { mode: 'hallucination-hunt', emoji: '🚨', title: 'Hallucination Hunt', blurb: 'Boss round: only made-up-detail traps. Catch them all.' },
  { mode: 'sense-builder', emoji: '🎛️', title: 'Sense Builder', blurb: 'Flip the AI’s senses on and off — watch its answer change!', star: true },
  { mode: 'creative-sandbox', emoji: '🧭', title: 'Free Explore', blurb: 'Browse any scene and peek at the truth. No scoring.' },
];

function Stars({ n, size = 30 }: { n: number; size?: number }) {
  return (
    <span aria-label={`${n} out of 3 stars`} style={{ fontSize: size, letterSpacing: 2 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ opacity: i < n ? 1 : 0.22 }}>
          ⭐
        </span>
      ))}
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-8 text-center"
      style={{ minHeight: '55vh' }}
    >
      {children}
    </div>
  );
}

// A represented scene card — honest stand-in for a short clip (no video file).
function SceneCard({ clip, compact = false }: { clip: PixelClip; compact?: boolean }) {
  const theme = THEME_META[clip.theme];
  return (
    <div
      style={{
        ...panel,
        padding: compact ? 14 : 18,
        borderColor: 'rgba(16,186,210,0.28)',
        background: 'linear-gradient(180deg, rgba(16,186,210,0.10), rgba(255,255,255,0.03))',
      }}
    >
      <div className="flex items-center gap-3">
        <div style={{ fontSize: compact ? 40 : 52 }} aria-hidden>
          {clip.emoji}
        </div>
        <div className="min-w-0">
          <div className="font-black text-white" style={{ fontSize: compact ? 16 : 20 }}>
            {clip.title}
          </div>
          <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 4 }}>
            <span
              style={{
                fontSize: 12,
                padding: '2px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.07)',
                color: theme.color,
                fontWeight: 700,
              }}
            >
              {theme.emoji} {theme.label}
            </span>
            <span className="text-white/70" style={{ fontSize: 12 }}>
              ≈ {clip.durationSec}s scene
            </span>
            {clip.hasAudio && (
              <span className="text-white/70" style={{ fontSize: 12 }}>
                🔊 has sound
              </span>
            )}
          </div>
        </div>
      </div>
      <p
        className="text-white/60"
        style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}
      >
        🎞️ This is a <strong className="text-white/75">represented scene</strong> — there is no real
        video here. The card stands in for a short clip the AI &ldquo;watched.&rdquo; Your detective
        work is judging what the AI <em>said</em> about it.
      </p>
    </div>
  );
}

export default function PixelWitnessGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();
  const band = (child?.age_band || 'B') as Band;

  // ─── Store: state ──────────────────────────────────────────────────────
  const phase = usePixelWitnessStore((s) => s.phase);
  const mode = usePixelWitnessStore((s) => s.mode);
  const modeClips = usePixelWitnessStore((s) => s.modeClips);
  const clipIndex = usePixelWitnessStore((s) => s.clipIndex);
  const currentClip = usePixelWitnessStore((s) => s.currentClip);
  const currentQuestions = usePixelWitnessStore((s) => s.currentQuestions);
  const questionIndex = usePixelWitnessStore((s) => s.questionIndex);
  const currentQuestion = usePixelWitnessStore((s) => s.currentQuestion);
  const ratings = usePixelWitnessStore((s) => s.ratings);
  const senseConfig = usePixelWitnessStore((s) => s.senseConfig);
  const hasRatedCurrent = usePixelWitnessStore((s) => s.hasRatedCurrent);

  // ─── Store: actions ────────────────────────────────────────────────────
  const setPhase = usePixelWitnessStore((s) => s.setPhase);
  const beginGame = usePixelWitnessStore((s) => s.beginGame);
  const reset = usePixelWitnessStore((s) => s.reset);
  const markTutorialSeen = usePixelWitnessStore((s) => s.markTutorialSeen);
  const startMode = usePixelWitnessStore((s) => s.startMode);
  const nextQuestion = usePixelWitnessStore((s) => s.nextQuestion);
  const toggleSense = usePixelWitnessStore((s) => s.toggleSense);
  const getDisplayedAnswer = usePixelWitnessStore((s) => s.getDisplayedAnswer);
  const rateAnswer = usePixelWitnessStore((s) => s.rateAnswer);
  const getGrade = usePixelWitnessStore((s) => s.getGrade);

  // ─── Local UI state ────────────────────────────────────────────────────
  const [welcomeGate, setWelcomeGate] = useState(true);
  const [modeChosen, setModeChosen] = useState(false);
  const [sandboxClipId, setSandboxClipId] = useState<string | null>(null);
  const [sandboxReveals, setSandboxReveals] = useState<Record<string, boolean>>({});
  const firedRef = useRef(false);

  // ─── Mount: reset + enter the store's intended flow. Clean up on exit. ──
  useEffect(() => {
    reset();
    beginGame();
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Completion: fire exactly once when the graded report is reached. ───
  useEffect(() => {
    if (phase === 'report' && !firedRef.current) {
      firedRef.current = true;
      const grade = getGrade();
      const xp = 40 + Math.round(grade.accuracy * 50) + grade.hallucinationsCaught * 6;
      awardXP(xp);
      const stars = Math.max(1, grade.stars) as 1 | 2 | 3;
      completeGame('pixel-witness', stars);
    }
  }, [phase, getGrade, awardXP, completeGame]);

  const returnToModeSelect = () => {
    firedRef.current = false;
    setModeChosen(false);
    setSandboxClipId(null);
    setSandboxReveals({});
    reset();
    beginGame();
  };

  const chooseMode = (m: PixelMode) => {
    setModeChosen(true);
    startMode(m, band);
  };

  // The rating the child gave for the current question (for the reveal panel).
  const currentRating = useMemo(
    () => (currentQuestion ? ratings.find((r) => r.questionId === currentQuestion.id) : undefined),
    [ratings, currentQuestion],
  );

  // ══════════════════════════════════════════════════════════════════════
  // PHASE VIEWS
  // ══════════════════════════════════════════════════════════════════════

  function WelcomeView() {
    return (
      <Centered>
        <div style={{ fontSize: 64 }} aria-hidden>
          🎬🕵️
        </div>
        <h1 className="text-3xl font-black" style={{ color: LAB }}>
          Pixel Witness
        </h1>
        <p className="max-w-lg text-lg text-white/80">
          An AI just watched a bunch of short scenes and told us what it saw. But AIs sometimes make
          things up! Your job is to <strong style={{ color: LAB }}>catch the mistakes</strong>.
        </p>
        <p className="max-w-md text-sm text-white/60">
          Heads up: the scenes are shown as described cards, not real videos. You judge what the AI{' '}
          <em>said</em> about each one.
        </p>
        <button style={primaryBtn} onClick={() => setWelcomeGate(false)} aria-label="Start investigating">
          Start investigating →
        </button>
      </Centered>
    );
  }

  function LearnView() {
    const card = LEARN.find((l) => l.phase === phase);
    if (!card) return null;
    const idx = LEARN.findIndex((l) => l.phase === phase);
    return (
      <Centered>
        <div className="flex items-center gap-2" role="presentation">
          {LEARN.map((l, i) => (
            <span
              key={l.key}
              aria-hidden
              style={{
                width: 28,
                height: 6,
                borderRadius: 3,
                background: i <= idx ? LAB : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>
        <div style={{ ...panel, padding: 28, maxWidth: 560 }} className="text-center">
          <div style={{ fontSize: 52 }} aria-hidden>
            {card.emoji}
          </div>
          <h2 className="mb-3 text-2xl font-black" style={{ color: LAB }}>
            {card.title}
          </h2>
          <div className="space-y-3">
            {card.body.map((line, i) => (
              <p key={i} className="text-white/80">
                {line}
              </p>
            ))}
          </div>
        </div>
        <button
          style={primaryBtn}
          onClick={() => {
            markTutorialSeen(card.key);
            setPhase(card.next);
          }}
          aria-label={idx < LEARN.length - 1 ? 'Next lesson' : 'How to play'}
        >
          {idx < LEARN.length - 1 ? 'Got it — next' : 'How to play →'}
        </button>
      </Centered>
    );
  }

  function HowToView() {
    return (
      <Centered>
        <div style={{ fontSize: 52 }} aria-hidden>
          🎯
        </div>
        <h2 className="text-2xl font-black" style={{ color: LAB }}>
          How to play
        </h2>
        <div style={{ ...panel, padding: 24, maxWidth: 560 }} className="text-left">
          <ul className="space-y-3 text-white/80">
            <li>
              <strong className="text-white">1.</strong> Read the scene and the AI&apos;s answer.
            </li>
            <li>
              <strong className="text-white">2.</strong> Decide: is it{' '}
              <span style={{ color: RATING_META.correct.hex }}>Correct</span>,{' '}
              <span style={{ color: RATING_META.partial.hex }}>Partly right</span>, or{' '}
              <span style={{ color: RATING_META.hallucination.hex }}>Made-up</span>?
            </li>
            <li>
              <strong className="text-white">3.</strong> In <strong style={{ color: LAB }}>Sense Builder</strong>{' '}
              you can flip the AI&apos;s senses on and off and watch its answer change.
            </li>
          </ul>
        </div>
        <button
          style={primaryBtn}
          onClick={() => {
            markTutorialSeen('tutorial');
            setPhase('watch-A');
          }}
          aria-label="Pick a mode"
        >
          Pick a mode →
        </button>
      </Centered>
    );
  }

  function ModeSelectView() {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            Choose your case
          </h2>
          <p className="text-white/70">Pick how you want to investigate the AI today.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {MODES.map((m) => {
            const count = expectedClipCountForMode(m.mode, band);
            const isSandbox = m.mode === 'creative-sandbox';
            return (
              <button
                key={m.mode}
                onClick={() => chooseMode(m.mode)}
                aria-label={`Start ${m.title}. ${m.blurb}`}
                style={{
                  ...panel,
                  padding: 18,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: m.star ? LAB : 'rgba(255,255,255,0.10)',
                  background: m.star
                    ? 'rgba(16,186,210,0.08)'
                    : 'rgba(255,255,255,0.04)',
                }}
                className="flex flex-col gap-2 transition hover:brightness-125"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg font-bold text-white">
                    <span aria-hidden>{m.emoji}</span> {m.title}
                  </span>
                  {m.star && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: 999,
                        background: 'rgba(16,186,210,0.2)',
                        color: LAB,
                      }}
                    >
                      ★ try me
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70">{m.blurb}</p>
                <p className="text-xs text-white/60">
                  {isSandbox ? 'Browse freely' : `${count} scene${count === 1 ? '' : 's'} · earns stars`}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Shared: the rating strip + reveal used by watch modes & sense-builder ─
  function JudgePanel({ question }: { question: ClipQuestion }) {
    if (!hasRatedCurrent) {
      return (
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-white/75">
            Detective, what&apos;s your call on the AI&apos;s answer?
          </p>
          <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Rate the AI's answer">
            {(Object.keys(RATING_META) as Rating[]).map((r) => {
              const meta = RATING_META[r];
              return (
                <button
                  key={r}
                  onClick={() => rateAnswer(r)}
                  aria-label={`${meta.label} — ${meta.hint}`}
                  style={{
                    ...panel,
                    padding: 14,
                    cursor: 'pointer',
                    borderColor: `${meta.hex}66`,
                  }}
                  className="flex flex-col items-center gap-1 transition hover:brightness-125"
                >
                  <span style={{ fontSize: 28 }} aria-hidden>
                    {meta.emoji}
                  </span>
                  <span className="font-bold" style={{ color: meta.hex }}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-white/60">{meta.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Reveal after rating.
    const truthMeta = RATING_META[question.truth];
    const matched = currentRating?.matched ?? false;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          ...panel,
          padding: 18,
          borderColor: matched ? 'rgba(0,209,122,0.5)' : 'rgba(255,112,80,0.5)',
          background: matched ? 'rgba(0,209,122,0.08)' : 'rgba(255,112,80,0.08)',
        }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 26 }} aria-hidden>
            {matched ? '🎉' : '🤔'}
          </span>
          <span className="font-black text-white">
            {matched ? 'Great call!' : 'Not quite.'}
          </span>
        </div>
        <p className="text-sm text-white/80">
          The answer was actually{' '}
          <strong style={{ color: truthMeta.hex }}>
            {truthMeta.emoji} {truthMeta.label.toLowerCase()}
          </strong>
          {currentRating && (
            <>
              {' '}— you said{' '}
              <strong style={{ color: RATING_META[currentRating.rating as Rating].hex }}>
                {RATING_META[currentRating.rating as Rating].label.toLowerCase()}
              </strong>
              .
            </>
          )}
        </p>
        <p className="text-sm text-white/70">{question.explanation}</p>
        <div className="flex justify-end pt-1">
          <button style={primaryBtn} onClick={() => nextQuestion()} aria-label="Next question">
            Next →
          </button>
        </div>
      </motion.div>
    );
  }

  function ClipReviewView() {
    if (!currentClip || !currentQuestion) {
      return (
        <Centered>
          <p className="text-white/70">No scenes available for this mode yet.</p>
          <button style={ghostBtn} onClick={returnToModeSelect} aria-label="Back to modes">
            ← Back to modes
          </button>
        </Centered>
      );
    }
    const q = currentQuestion;
    const total = modeClips.length;
    const modeMeta = MODES.find((m) => m.mode === mode);
    const judgedForClip = questionIndex; // questions already answered on this clip
    const answer = getDisplayedAnswer();

    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 py-4">
        <header className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-black" style={{ color: LAB }}>
            <span aria-hidden>{modeMeta?.emoji}</span> {modeMeta?.title ?? 'Watch'}
          </h2>
          <span className="text-sm text-white/60">
            Scene {clipIndex + 1}/{total} · Q {questionIndex + 1}/{currentQuestions.length}
          </span>
        </header>

        <SceneCard clip={currentClip} />

        {/* What the AI was allowed to use for this question (read-only context). */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">The AI looked at:</span>
          <span
            style={{
              fontSize: 12,
              padding: '3px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 600,
            }}
          >
            {SENSE_LEVEL_EMOJI[q.minimumSense]} {senseLevelLabel(q.minimumSense)}
          </span>
        </div>

        <div style={{ ...panel, padding: 18 }} className="space-y-3">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">Question</div>
            <p className="text-lg text-white">{q.text}</p>
          </div>
          <div
            style={{
              borderRadius: 12,
              padding: 14,
              background: 'rgba(16,186,210,0.08)',
              border: '1px solid rgba(16,186,210,0.25)',
            }}
          >
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: LAB }}>
              🤖 The AI says
            </div>
            <p className="text-white/90">{answer}</p>
          </div>
        </div>

        <JudgePanel question={q} />

        {judgedForClip === 0 && questionIndex === 0 && clipIndex === 0 && !hasRatedCurrent && (
          <div className="flex justify-center">
            <button
              style={{ ...ghostBtn, fontSize: 13, padding: '6px 14px' }}
              onClick={returnToModeSelect}
              aria-label="Quit to mode select"
            >
              Quit case
            </button>
          </div>
        )}
      </div>
    );
  }

  function SenseBuilderView() {
    if (!currentClip || !currentQuestion) {
      return (
        <Centered>
          <p className="text-white/70">No scenes available yet.</p>
          <button style={ghostBtn} onClick={returnToModeSelect} aria-label="Back to modes">
            ← Back to modes
          </button>
        </Centered>
      );
    }
    const q = currentQuestion;
    const satisfied = senseSatisfies(senseConfig, q.minimumSense);
    const cost = senseCost(senseConfig);
    const answer = getDisplayedAnswer();

    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 py-4">
        <header className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-black" style={{ color: LAB }}>
            🎛️ Sense Builder
          </h2>
          <span className="text-sm text-white/60">
            Scene {clipIndex + 1}/{modeClips.length} · Q {questionIndex + 1}/{currentQuestions.length}
          </span>
        </header>

        <SceneCard clip={currentClip} compact />

        <div style={{ ...panel, padding: 16 }} className="space-y-2">
          <p className="text-lg text-white">{q.text}</p>
          <p className="text-xs text-white/60">
            To answer this well, the AI needs at least:{' '}
            <strong className="text-white/80">
              {SENSE_LEVEL_EMOJI[q.minimumSense]} {senseLevelLabel(q.minimumSense)}
            </strong>
          </p>
        </div>

        {/* The star mechanic: flip senses and watch the answer change. */}
        <div style={{ ...panel, padding: 16 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/70">
              Give the AI its senses
            </h3>
            <span className="text-xs text-white/60">Token cost: {cost}×</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {SENSE_ORDER.map((key) => {
              const meta = SENSE_META[key];
              const on = senseConfig[key];
              return (
                <button
                  key={key}
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggleSense(key)}
                  aria-label={`${meta.label}. ${meta.hint} Costs ${meta.costMultiplier} times. Currently ${on ? 'on' : 'off'}.`}
                  style={{
                    borderRadius: 12,
                    padding: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: on ? 'rgba(16,186,210,0.16)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${on ? LAB : 'rgba(255,255,255,0.12)'}`,
                  }}
                  className="flex items-start gap-2 transition"
                >
                  <span style={{ fontSize: 22 }} aria-hidden>
                    {meta.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-white">{meta.label}</span>
                      <span
                        aria-hidden
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 8px',
                          borderRadius: 999,
                          background: on ? LAB : 'rgba(255,255,255,0.12)',
                          color: on ? '#04191d' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {on ? 'ON' : 'OFF'}
                      </span>
                      <span className="text-white/50" style={{ fontSize: 11 }}>
                        {meta.costMultiplier}×
                      </span>
                    </span>
                    <span className="block text-white/60" style={{ fontSize: 11, marginTop: 2 }}>
                      {meta.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live perception status + answer. */}
        <div
          style={{
            ...panel,
            padding: 16,
            borderColor: satisfied ? 'rgba(0,209,122,0.4)' : 'rgba(255,112,80,0.4)',
            background: satisfied ? 'rgba(0,209,122,0.06)' : 'rgba(255,112,80,0.06)',
          }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-sm font-bold" aria-live="polite">
            {satisfied ? (
              <span style={{ color: '#5be6a8' }}>✅ The AI can really perceive this</span>
            ) : (
              <span style={{ color: '#ff9b82' }}>🙈 The AI is guessing blind — not enough senses</span>
            )}
          </div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: LAB }}>
            🤖 The AI says
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={answer}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-white/90"
            >
              {answer}
            </motion.p>
          </AnimatePresence>
          {!hasRatedCurrent && (
            <p className="text-xs text-white/60">
              Flip senses on and off and watch the answer change. When you&apos;re ready, judge it.
            </p>
          )}
        </div>

        <JudgePanel question={q} />
      </div>
    );
  }

  function SandboxView() {
    const clips = clipsForBand(band);
    if (sandboxClipId) {
      const clip = getClip(sandboxClipId);
      const qs = questionsForClip(sandboxClipId);
      return (
        <div className="mx-auto w-full max-w-2xl space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black" style={{ color: LAB }}>
              🧭 Free Explore
            </h2>
            <button
              style={{ ...ghostBtn, fontSize: 13, padding: '6px 14px' }}
              onClick={() => setSandboxClipId(null)}
              aria-label="Back to scene list"
            >
              ← Scenes
            </button>
          </div>
          {clip && <SceneCard clip={clip} />}
          <div className="space-y-3">
            {qs.map((q) => {
              const revealed = sandboxReveals[q.id];
              const truthMeta = RATING_META[q.truth];
              return (
                <div key={q.id} style={{ ...panel, padding: 16 }} className="space-y-2">
                  <p className="font-semibold text-white">{q.text}</p>
                  <div
                    style={{
                      borderRadius: 10,
                      padding: 12,
                      background: 'rgba(16,186,210,0.07)',
                      border: '1px solid rgba(16,186,210,0.22)',
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: LAB }}>
                      🤖 AI answer
                    </span>
                    <p className="text-white/90" style={{ marginTop: 4 }}>
                      {q.aiAnswer}
                    </p>
                  </div>
                  {revealed ? (
                    <p className="text-sm text-white/70">
                      <strong style={{ color: truthMeta.hex }}>
                        {truthMeta.emoji} {truthMeta.label}
                      </strong>{' '}
                      — {q.explanation}
                    </p>
                  ) : (
                    <button
                      style={{ ...ghostBtn, fontSize: 13, padding: '6px 14px' }}
                      onClick={() => setSandboxReveals((r) => ({ ...r, [q.id]: true }))}
                      aria-label={`Reveal the truth for: ${q.text}`}
                    >
                      🔍 Show the truth
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-center pt-2">
            <button style={ghostBtn} onClick={returnToModeSelect} aria-label="Back to modes">
              Done exploring
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 py-4">
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            🧭 Free Explore
          </h2>
          <p className="text-white/70">Pick any scene to read the AI&apos;s answers and peek at the truth. No scoring here.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((c) => {
            const theme = THEME_META[c.theme];
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSandboxClipId(c.id);
                  setSandboxReveals({});
                }}
                aria-label={`Explore scene: ${c.title}`}
                style={{ ...panel, padding: 14, cursor: 'pointer', textAlign: 'left' }}
                className="flex items-center gap-3 transition hover:brightness-125"
              >
                <span style={{ fontSize: 34 }} aria-hidden>
                  {c.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-white">{c.title}</span>
                  <span className="text-xs" style={{ color: theme.color }}>
                    {theme.emoji} {theme.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-center">
          <button style={ghostBtn} onClick={returnToModeSelect} aria-label="Back to modes">
            ← Back to modes
          </button>
        </div>
      </div>
    );
  }

  function ReportView() {
    const grade = getGrade();
    const pct = Math.round(grade.accuracy * 100);
    const win = grade.stars >= 2;
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5 py-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div style={{ fontSize: 52 }} aria-hidden>
            {win ? '🏆' : '🔍'}
          </div>
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            {win ? 'Sharp eyes, detective!' : 'Case closed'}
          </h2>
          <div className="my-2">
            <Stars n={grade.stars} size={38} />
          </div>
          <p className="text-white/80">
            Accuracy: <strong style={{ color: LAB }}>{pct}%</strong> ({grade.matched}/{grade.totalRated} calls right)
          </p>
        </motion.div>

        <div style={{ ...panel, padding: 18 }} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">🚨 Hallucinations caught</span>
            <span className="font-bold" style={{ color: '#5be6a8' }}>{grade.hallucinationsCaught}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">😴 Hallucinations missed</span>
            <span className="font-bold" style={{ color: '#ff9b82' }}>{grade.hallucinationsMissed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">🚧 False alarms</span>
            <span className="font-bold" style={{ color: '#e6c46b' }}>{grade.falseAlarms}</span>
          </div>
        </div>

        <p className="text-center text-white/75">{grade.summary}</p>

        <div className="flex justify-center">
          <button style={primaryBtn} onClick={returnToModeSelect} aria-label="Play another case">
            ↺ Play another case
          </button>
        </div>
      </div>
    );
  }

  // Called as plain functions (not JSX elements) so markup inlines into this
  // component's tree — no remount-per-render, so toggles/inputs keep state.
  function view() {
    if (welcomeGate) return WelcomeView();
    switch (phase) {
      case 'welcome':
        return WelcomeView();
      case 'learn-modal':
      case 'learn-fusion':
      case 'learn-hallucinate':
        return LearnView();
      case 'tutorial':
        return HowToView();
      case 'report':
        return ReportView();
      case 'creative-sandbox':
        return modeChosen ? SandboxView() : ModeSelectView();
      case 'sense-builder':
        return modeChosen ? SenseBuilderView() : ModeSelectView();
      case 'watch-A':
      case 'watch-B':
      case 'watch-C':
      case 'hallucination-hunt':
        return modeChosen ? ClipReviewView() : ModeSelectView();
      default:
        return ModeSelectView();
    }
  }

  return (
    <GameShell title="Pixel Witness" color={LAB} labNum={7}>
      <div className="w-full px-4" style={{ minHeight: '60vh' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={welcomeGate ? 'welcome-gate' : phase + (modeChosen ? '-active' : '-select')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {view()}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
