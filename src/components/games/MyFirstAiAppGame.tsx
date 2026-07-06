// ════════════════════════════════════════════════════════════════════════
// MY FIRST AI APP v6 — Lab 9 (Code Lab) — a tiny app that actually RUNS
// ════════════════════════════════════════════════════════════════════════
// Redesign (audit §II.4 #33): the old version was the sixth PixiConnectStage
// CONNECT clone — you dragged edges from "User Input" through a "model" to
// "Output", decoys were pre-labelled dead, and shipping just printed the text
// "App shipped!". No app was ever seen.
//
// Now: the child ASSEMBLES a tiny app from real blocks — a sample input (given),
// an AI model/service, an optional processing step, and an output/display — then
// hits RUN and SEES THE APP ACTUALLY RUN on the sample input. A real deterministic
// runtime threads the input through the blocks IN THE ORDER the child wired them:
//   • Photo → Image Describer → Display  ⇒ a real caption card.
//   • Wire a Translate block in between   ⇒ the caption comes out in Spanish.
//   • Skip the model (Display only)       ⇒ the screen just shows the raw photo.
//   • Put Display before the model         ⇒ the model's result is thrown away.
//   • Feed a photo to the Mood model       ⇒ a visibly BROKEN app Sparky reacts to.
//
// There is no telegraph: the preview is the honest result of the child's wiring,
// computed only after they commit and Run (G1 honesty). Mis-wires produce broken
// or funny apps you can see, not a red edge. Teaches the real Input → Model →
// Output shape by making it tangible and runnable.

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useReducedMotion, motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, RotateCcw, Play, Plus, ArrowUp,
  ArrowDown, Trash2, Sparkles, CheckCircle2, Zap, AlertTriangle, Smartphone,
  Languages, MessageSquare, ArrowRight,
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

// ════════════════════════════════════════════════════════════════════════
// THE APP RUNTIME — an honest little data pipeline
// ════════════════════════════════════════════════════════════════════════
// A payload is the piece of data flowing between blocks. Each block is a pure
// transform (payload → payload). A block that receives data it can't handle
// emits a `broken` payload — that is what makes a mis-wired app visibly break.

type DataKind = 'image' | 'text' | 'caption' | 'sentiment' | 'replies' | 'empty' | 'broken';

interface Sentiment { label: string; emoji: string; color: string; score: number }

interface Payload {
  kind: DataKind;
  text?: string;                 // caption / message / raw text content
  emoji?: string;                // stand-in for an "image" (not mascot art)
  scene?: string;               // hidden description of an image — only the describer can read it
  lang?: 'en' | 'es';           // language of a caption / replies
  sentiment?: Sentiment;
  replies?: string[];
  reason?: string;              // why a payload is broken
}

const kindName = (p: Payload | null): string => {
  if (!p) return 'nothing';
  switch (p.kind) {
    case 'image': return 'a photo';
    case 'text': return 'plain text';
    case 'caption': return 'a caption';
    case 'sentiment': return 'a mood result';
    case 'replies': return 'reply suggestions';
    case 'empty': return 'an empty screen';
    case 'broken': return 'a broken signal';
  }
};

// ── Real deterministic transforms ─────────────────────────────────────────

// Sentiment model: count feeling-words in the text. Fully deterministic.
const POS = ['love', 'amazing', 'great', 'happy', 'good', 'awesome', 'fun', 'best', 'wonderful', 'puppy', 'excited'];
const NEG = ['hate', 'sad', 'bad', 'terrible', 'angry', 'worst', 'boring', 'awful', 'sick', 'tired'];
function analyzeSentiment(text: string): Sentiment {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/);
  const score = words.reduce((s, w) => s + (POS.includes(w) ? 1 : 0) - (NEG.includes(w) ? 1 : 0), 0);
  if (score > 0) return { label: 'Positive', emoji: '😊', color: '#2ECC71', score };
  if (score < 0) return { label: 'Negative', emoji: '😞', color: '#E74C3C', score };
  return { label: 'Neutral', emoji: '😐', color: '#8C94AC', score };
}

// LLM reply model: deterministic 3 replies chosen by what the message is.
function suggestReplies(text: string): string[] {
  const t = text.toLowerCase();
  if (t.includes('thank')) return ["You're welcome!", 'Happy to help!', 'Anytime, friend!'];
  if (t.includes('?')) return ["Yes, I'll be there!", "Sorry, I can't make it.", 'Maybe — let me check.'];
  return ['Sounds good!', 'Got it, thanks!', "Let's do it!"];
}

// Translate service: an exact phrase lookup (deterministic; passes unknown text
// through unchanged). Covers every string the models above can produce.
const ES: Record<string, string> = {
  'a dog running on the grass': 'un perro corriendo sobre la hierba',
  "You're welcome!": '¡De nada!',
  'Happy to help!': '¡Encantado de ayudar!',
  'Anytime, friend!': '¡Cuando quieras, amigo!',
  "Yes, I'll be there!": '¡Sí, allí estaré!',
  "Sorry, I can't make it.": 'Lo siento, no puedo ir.',
  'Maybe — let me check.': 'Quizás, déjame ver.',
};
const toSpanish = (s: string): string => ES[s] ?? s;

// A block: a labelled transform with a kind that governs where it belongs.
type BlockKind = 'input' | 'model' | 'process' | 'output';
interface Block {
  id: string;
  kind: BlockKind;
  label: string;
  emoji: string;
  hint: string;                  // shown on the card
  bands?: AgeBand[];             // toolbox blocks gated by age band (decoys)
  run: (incoming: Payload | null) => Payload;
}

// ── Block library (each run() is real, no faking) ─────────────────────────
const B = {
  describe: (): Block => ({
    id: 'describe', kind: 'model', label: 'Image Describer', emoji: '🖼️',
    hint: 'photo → words',
    run: (p) => (p && p.kind === 'image' && p.scene)
      ? { kind: 'caption', text: p.scene, lang: 'en', emoji: p.emoji }
      : { kind: 'broken', reason: `The Image Describer needs a photo, but it got ${kindName(p)}.` },
  }),
  mood: (): Block => ({
    id: 'mood', kind: 'model', label: 'Mood Model', emoji: '🧠',
    hint: 'text → feeling',
    run: (p) => (p && (p.kind === 'text' || p.kind === 'caption') && p.text)
      ? { kind: 'sentiment', text: p.text, sentiment: analyzeSentiment(p.text) }
      : { kind: 'broken', reason: `The Mood Model reads text, but it got ${kindName(p)}.` },
  }),
  reply: (): Block => ({
    id: 'reply', kind: 'model', label: 'Reply Model', emoji: '💬',
    hint: 'message → 3 replies',
    run: (p) => (p && (p.kind === 'text' || p.kind === 'caption') && p.text)
      ? { kind: 'replies', text: p.text, replies: suggestReplies(p.text), lang: 'en' }
      : { kind: 'broken', reason: `The Reply Model needs a text message, but it got ${kindName(p)}.` },
  }),
  offline: (): Block => ({
    id: 'offline', kind: 'model', label: 'Cloud Model', emoji: '📴',
    hint: 'offline right now',
    run: () => ({ kind: 'broken', reason: 'The Cloud Model is offline — no data comes back. Real apps must handle dead services.' }),
  }),
  translate: (): Block => ({
    id: 'translate', kind: 'process', label: 'Translate → Spanish', emoji: '🌐',
    hint: 'text → Spanish',
    run: (p) => {
      if (!p) return { kind: 'broken', reason: 'Translate had nothing to translate.' };
      if ((p.kind === 'caption' || p.kind === 'text') && p.text) {
        return { ...p, text: toSpanish(p.text), lang: 'es' };
      }
      if (p.kind === 'replies' && p.replies) {
        return { ...p, replies: p.replies.map(toSpanish), lang: 'es' };
      }
      return { kind: 'broken', reason: `Translate works on words, but it got ${kindName(p)}. Put it AFTER the model.` };
    },
  }),
  display: (): Block => ({
    id: 'display', kind: 'output', label: 'App Screen', emoji: '📱',
    hint: 'shows the result',
    run: (p) => p ?? { kind: 'empty' },
  }),
} as const;

interface RunResult {
  preview: Payload;
  stages: { id: string; label: string; emoji: string; out: Payload }[];
}

// Thread the input through the wired blocks in order. The App Screen captures
// whatever data reaches it — so a Screen placed early shows early data and any
// later model work is thrown away (honest, and a real teaching moment).
function runApp(input: Block, program: Block[]): RunResult {
  const chain = [input, ...program];
  let payload: Payload | null = null;
  let screen: Payload | null = null;
  const stages: RunResult['stages'] = [];
  for (const b of chain) {
    payload = b.run(payload);
    stages.push({ id: b.id, label: b.label, emoji: b.emoji, out: payload });
    if (b.kind === 'output') screen = payload;
  }
  const preview: Payload = screen ?? {
    kind: 'broken',
    reason: 'This app has no screen — add an App Screen block so the result can be shown.',
  };
  return { preview, stages };
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL DATA — five genuinely distinct mini-apps
// ════════════════════════════════════════════════════════════════════════
interface Level {
  id: number;
  name: string;
  emoji: string;
  difficulty: LevelConfig['difficulty'];
  xpReward: number;
  bands: AgeBand[];
  concept: string;
  appName: string;
  input: Block;                       // fixed sample-input source (given)
  toolbox: Block[];                   // blocks the child can add
  goalText: string;
  check: (preview: Payload) => boolean;
  hints: string[];
  isBonus?: boolean;
}

const photoDog: Block = {
  id: 'in-photo', kind: 'input', label: 'Photo', emoji: '🐶', hint: 'a picture',
  run: () => ({ kind: 'image', emoji: '🐶', scene: 'a dog running on the grass' }),
};
const moodText: Block = {
  id: 'in-mood', kind: 'input', label: 'Journal Entry', emoji: '📝', hint: 'what you typed',
  run: () => ({ kind: 'text', text: 'I love my new puppy, today was amazing!' }),
};
const partyMsg: Block = {
  id: 'in-msg', kind: 'input', label: 'Message', emoji: '✉️', hint: 'an incoming message',
  run: () => ({ kind: 'text', text: 'Are you coming to the party tonight?' }),
};
const thanksMsg: Block = {
  id: 'in-thanks', kind: 'input', label: 'Message', emoji: '✉️', hint: 'an incoming message',
  run: () => ({ kind: 'text', text: 'Thanks for helping me with my homework!' }),
};

const LEVELS: Level[] = [
  // ── L1: Input → Model → Output (all bands, 2-block for band A) ──────────
  {
    id: 1, name: 'Photo Caption App', emoji: '📸', difficulty: 'easy', xpReward: 50,
    bands: ['A', 'B', 'C'],
    appName: 'CaptionSnap',
    concept: 'Every AI app is a pipeline: Input → Model → Output. The photo goes to the model, the model makes a caption, the screen shows it.',
    input: photoDog,
    goalText: 'Show a caption card that describes the photo.',
    check: (p) => p.kind === 'caption' && p.lang === 'en',
    toolbox: [B.describe(), B.display(), { ...B.mood(), bands: ['B', 'C'] }],
    hints: [
      'The Image Describer turns a photo into words. Put it before the screen.',
      'Data flows down the list: Photo → Image Describer → App Screen.',
    ],
  },
  // ── L2: right model matters; skip-model shows raw input (all bands) ─────
  {
    id: 2, name: 'Mood Journal', emoji: '😊', difficulty: 'easy', xpReward: 60,
    bands: ['A', 'B', 'C'],
    appName: 'MoodLog',
    concept: 'Different jobs need different models. A mood model reads text and returns a feeling. Wire it between your writing and the screen.',
    input: moodText,
    goalText: 'Show the mood (emoji + colour) of the journal entry.',
    check: (p) => p.kind === 'sentiment',
    toolbox: [B.mood(), B.display(), { ...B.describe(), bands: ['B', 'C'] }],
    hints: [
      'Send the text through the Mood Model, THEN to the screen.',
      'With no model, the screen only shows the raw words — it never worked out the mood.',
    ],
  },
  // ── L3: LLM app (bands B, C) ────────────────────────────────────────────
  {
    id: 3, name: 'Smart Reply', emoji: '💬', difficulty: 'medium', xpReward: 80,
    bands: ['B', 'C'],
    appName: 'QuickReply',
    concept: 'A language model can read a message and suggest replies. Route the message through the Reply Model to get three suggestions.',
    input: partyMsg,
    goalText: 'Show three suggested replies for the message.',
    check: (p) => p.kind === 'replies',
    toolbox: [B.reply(), B.display(), B.mood(), B.offline()],
    hints: [
      'The Reply Model turns a message into reply suggestions.',
      'Watch out — the Cloud Model is offline, and the Mood Model gives feelings, not replies.',
    ],
  },
  // ── L4: add a PROCESSING step (bands B, C) ──────────────────────────────
  {
    id: 4, name: 'Caption Translator', emoji: '🌍', difficulty: 'hard', xpReward: 110,
    bands: ['B', 'C'],
    appName: 'CaptionSnap ES',
    concept: 'Apps can add a processing step. Describe the photo, THEN translate the caption to Spanish, THEN show it. Order matters.',
    input: photoDog,
    goalText: 'Show the photo caption translated into Spanish.',
    check: (p) => p.kind === 'caption' && p.lang === 'es',
    toolbox: [B.describe(), B.translate(), B.display(), { ...B.mood(), bands: ['C'] }],
    hints: [
      'Three steps in order: Image Describer → Translate → App Screen.',
      'Translate needs words, so it must come AFTER the describer — not before.',
    ],
  },
  // ── L5: multi-step app (band C only) ────────────────────────────────────
  {
    id: 5, name: 'Bilingual Smart Reply', emoji: '👑', difficulty: 'expert', xpReward: 150,
    bands: ['C'], isBonus: true,
    appName: 'QuickReply ES',
    concept: 'Master build: chain a model AND a processing step. Turn the message into replies, translate them to Spanish, then show them.',
    input: thanksMsg,
    goalText: 'Show three suggested replies, translated into Spanish.',
    check: (p) => p.kind === 'replies' && p.lang === 'es',
    toolbox: [B.reply(), B.translate(), B.display(), B.mood(), B.offline()],
    hints: [
      'Four steps: Message → Reply Model → Translate → App Screen.',
      'Translate can work on the replies too — put it right after the Reply Model.',
    ],
  },
];

const toLevelConfig = (l: Level): LevelConfig => ({
  id: l.id, name: l.name, description: l.concept, emoji: l.emoji,
  difficulty: l.difficulty, starThresholds: [50, 75, 100], xpReward: l.xpReward,
  isBonus: l.isBonus,
});

// ════════════════════════════════════════════════════════════════════════
// APP PREVIEW — the little screen that shows the REAL result of the wiring
// ════════════════════════════════════════════════════════════════════════
function AppPreview({ appName, preview }: { appName: string; preview: Payload | null }) {
  return (
    <div
      className="mx-auto w-full max-w-xs rounded-3xl p-2"
      style={{ background: '#11151F', border: `2px solid ${LAB_COLOR}55`, boxShadow: `0 10px 30px ${LAB_COLOR}22` }}
    >
      {/* phone status strip */}
      <div className="flex items-center justify-between px-3 py-1.5 text-xs" style={{ color: '#AEB6C8' }}>
        <span className="flex items-center gap-1 font-semibold" style={{ color: '#E6EDF3' }}>
          <Smartphone className="w-3.5 h-3.5" /> {appName}
        </span>
        <span aria-hidden="true">9:41</span>
      </div>
      <div
        className="rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2"
        style={{ background: '#0A0D14', minHeight: '150px' }}
        role="status"
        aria-live="polite"
        aria-label="App preview screen"
      >
        {!preview && (
          <p className="text-sm" style={{ color: '#6B7488' }}>Press Run to launch the app.</p>
        )}

        {preview?.kind === 'caption' && (
          <>
            <div className="text-5xl" aria-hidden="true">{preview.emoji ?? '🖼️'}</div>
            <div className="rounded-xl px-3 py-2 w-full" style={{ background: '#161C28' }}>
              <p className="text-xs mb-0.5 flex items-center justify-center gap-1" style={{ color: LAB_COLOR }}>
                {preview.lang === 'es' ? '🇪🇸 Español' : '🇬🇧 English'} caption
              </p>
              <p className="text-sm font-semibold" style={{ color: '#E6EDF3' }}>&ldquo;{preview.text}&rdquo;</p>
            </div>
          </>
        )}

        {preview?.kind === 'sentiment' && preview.sentiment && (
          <div
            className="rounded-2xl px-5 py-4 w-full flex flex-col items-center gap-1"
            style={{ background: `${preview.sentiment.color}22`, border: `1px solid ${preview.sentiment.color}` }}
          >
            <div className="text-5xl" aria-hidden="true">{preview.sentiment.emoji}</div>
            <p className="text-base font-bold" style={{ color: preview.sentiment.color }}>{preview.sentiment.label}</p>
            <p className="text-xs" style={{ color: '#AEB6C8' }}>&ldquo;{preview.text}&rdquo;</p>
          </div>
        )}

        {preview?.kind === 'replies' && preview.replies && (
          <div className="w-full space-y-1.5">
            <p className="text-xs mb-1 flex items-center justify-center gap-1" style={{ color: LAB_COLOR }}>
              <MessageSquare className="w-3.5 h-3.5" />
              {preview.lang === 'es' ? '🇪🇸 Respuestas' : 'Suggested replies'}
            </p>
            {preview.replies.map((r, i) => (
              <div key={i} className="rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: '#1B2333', color: '#E6EDF3' }}>
                {r}
              </div>
            ))}
          </div>
        )}

        {preview?.kind === 'image' && (
          <>
            <div className="text-6xl" aria-hidden="true">{preview.emoji}</div>
            <p className="text-xs" style={{ color: '#6B7488' }}>(just the photo — no AI step ran on it)</p>
          </>
        )}

        {preview?.kind === 'text' && (
          <>
            <p className="text-sm" style={{ color: '#E6EDF3' }}>&ldquo;{preview.text}&rdquo;</p>
            <p className="text-xs" style={{ color: '#6B7488' }}>(raw text — no AI step ran on it)</p>
          </>
        )}

        {preview?.kind === 'empty' && (
          <p className="text-sm" style={{ color: '#6B7488' }}>— blank screen, nothing to show —</p>
        )}

        {preview?.kind === 'broken' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl" aria-hidden="true">💥</div>
            <p className="text-sm font-semibold" style={{ color: '#FF6B6B' }}>App broke!</p>
            <p className="text-xs" style={{ color: '#E7A9A9' }}>{preview.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — assemble the blocks, then RUN the real app
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: Level; band: AgeBand; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'build'>('welcome');

  const cardMap = useMemo(() => {
    const m: Record<string, Block> = {};
    level.toolbox.forEach((c) => { m[c.id] = c; });
    return m;
  }, [level]);

  const [program, setProgram] = useState<string[]>([]);
  const [wrongRuns, setWrongRuns] = useState(0);
  const [result, setResult] = useState<{ run: RunResult; matched: boolean; stars: number; score: number } | null>(null);
  const completedRef = useRef(false);

  const available = useMemo(
    () => level.toolbox.filter((c) => !program.includes(c.id) && (!c.bands || c.bands.includes(band))),
    [level, program, band],
  );

  const clearRun = useCallback(() => { setResult(null); completedRef.current = false; }, []);

  // ── program editing (fully keyboard-operable via buttons) ──
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

  // ── run the app for real ──
  const handleRun = useCallback(() => {
    const blocks = program.map((id) => cardMap[id]);
    const run = runApp(level.input, blocks);
    const matched = level.check(run.preview);
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
    setResult({ run, matched, stars, score });
  }, [program, cardMap, level, wrongRuns, juice]);

  // ── fire completion once, shortly after a successful run is shown ──
  useEffect(() => {
    if (!result || !result.matched || completedRef.current) return;
    completedRef.current = true;
    const t = setTimeout(() => {
      onComplete({
        score: result.score, maxScore: MAX_SCORE, stars: result.stars as 0 | 1 | 2 | 3,
        xpEarned: Math.round((level.xpReward * result.stars) / 3), timeMs: 0,
      });
    }, 1100);
    return () => clearTimeout(t);
  }, [result, level.xpReward, onComplete]);

  const resetLevel = useCallback(() => {
    setProgram([]);
    setWrongRuns(0);
    clearRun();
  }, [clearRun]);

  const hint = level.hints[Math.min(wrongRuns, level.hints.length - 1)];

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
              <strong>Goal:</strong> Snap the blocks into order to build the app, then press Run.
              The little screen shows exactly what your wiring does — no peeking, the app just runs.
            </span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('build')}>
          Build the App <ChevronRight className="w-5 h-5 ml-2" />
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
          {wrongRuns === 0 ? '3-star run' : `${wrongRuns} rebuild${wrongRuns > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* GOAL */}
      <SFCard variant="elevated" className="p-3">
        <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: '#3A50B0' }}>
          <Target className="w-3.5 h-3.5" /> Goal — build an app that:
        </p>
        <p className="text-sm" style={{ color: '#1A1D2B' }}>{level.goalText}</p>
      </SFCard>

      {/* THE APP — fixed input + editable pipeline */}
      <SFCard variant="elevated" className="p-3">
        <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#5A6078' }}>
          <Smartphone className="w-3.5 h-3.5" /> Your App Pipeline
        </p>

        {/* fixed sample input (the "given") */}
        <div className="rounded-lg mb-1.5 flex items-center gap-2 px-2.5 py-2" style={{ background: '#EEF1FB', border: '1px dashed #B9C4E8' }}>
          <span className="text-xl" aria-hidden="true">{level.input.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: '#1A1D2B' }}>{level.input.label}</p>
            <p className="text-xs" style={{ color: '#5A6078' }}>Sample input — {level.input.hint} (given)</p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#DCE4FA', color: '#3A50B0' }}>INPUT</span>
        </div>

        <div className="flex justify-center py-0.5" aria-hidden="true">
          <ArrowDown className="w-4 h-4" style={{ color: '#B9C4E8' }} />
        </div>

        {program.length === 0 && (
          <p className="text-xs italic px-2 py-3 text-center" style={{ color: '#8C94AC' }}>
            Add blocks from the toolbox below to build the pipeline…
          </p>
        )}

        {program.map((id, idx) => {
          const card = cardMap[id];
          return (
            <div key={id}>
              <div
                className="rounded-lg flex items-center gap-2 px-2.5 py-2"
                style={{ background: '#FFFFFF', border: `1px solid ${LAB_COLOR}44` }}
              >
                <span className="text-xl" aria-hidden="true">{card.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#1A1D2B' }}>{card.label}</p>
                  <p className="text-xs" style={{ color: '#5A6078' }}>{card.hint}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button" onClick={() => moveCard(idx, -1)} disabled={idx === 0}
                    aria-label={`Move ${card.label} earlier`}
                    className="p-1 rounded-md disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: '#EEF1FB', color: '#4F6EF7' }}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button" onClick={() => moveCard(idx, 1)} disabled={idx === program.length - 1}
                    aria-label={`Move ${card.label} later`}
                    className="p-1 rounded-md disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: '#EEF1FB', color: '#4F6EF7' }}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button" onClick={() => removeCard(id)}
                    aria-label={`Remove ${card.label}`}
                    className="p-1 rounded-md focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: '#FDECEC', color: '#D64545' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {idx < program.length - 1 && (
                <div className="flex justify-center py-0.5" aria-hidden="true">
                  <ArrowDown className="w-4 h-4" style={{ color: '#B9C4E8' }} />
                </div>
              )}
            </div>
          );
        })}
      </SFCard>

      {/* TOOLBOX */}
      {available.length > 0 && (
        <SFCard variant="elevated" className="p-3">
          <p className="text-xs font-bold mb-2" style={{ color: '#5A6078' }}>Blocks — tap to add one to your app</p>
          <div className="grid grid-cols-2 gap-1.5">
            {available.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => addCard(card.id)}
                aria-label={`Add ${card.label} block (${card.hint})`}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2"
                style={{ background: '#FFFFFF', border: `1px solid ${LAB_COLOR}44` }}
              >
                <span className="text-lg shrink-0" aria-hidden="true">{card.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold truncate" style={{ color: '#1A1D2B' }}>{card.label}</span>
                  <span className="block text-xs truncate" style={{ color: '#5A6078' }}>{card.hint}</span>
                </span>
                <Plus className="w-4 h-4 shrink-0" style={{ color: LAB_COLOR }} />
              </button>
            ))}
          </div>
        </SFCard>
      )}

      {/* APP PREVIEW — the real running app */}
      <AppPreview appName={level.appName} preview={result ? result.run.preview : null} />

      {/* DATA-FLOW TRACE — what each block actually produced */}
      {result && (
        <div className="rounded-xl px-3 py-2 flex flex-wrap items-center gap-1.5" style={{ background: '#0D1117', border: '1px solid #22283A' }}>
          {result.run.stages.map((s, i) => (
            <span key={`${s.id}-${i}`} className="flex items-center gap-1.5">
              <span
                className="text-xs px-2 py-1 rounded-md flex items-center gap-1"
                style={{ background: s.out.kind === 'broken' ? '#3A1B1B' : '#1B2130', color: s.out.kind === 'broken' ? '#FF9B9B' : '#C9D4E5' }}
              >
                <span aria-hidden="true">{s.emoji}</span>
                {kindName(s.out)}
              </span>
              {i < result.run.stages.length - 1 && <ArrowRight className="w-3.5 h-3.5" style={{ color: '#4B5568' }} aria-hidden="true" />}
            </span>
          ))}
        </div>
      )}

      {/* FEEDBACK */}
      <AnimatePresence>
        {result && (
          result.matched ? (
            <FeedbackPopup
              key="ok" type="correct"
              message={`Your app works! ${'⭐'.repeat(result.stars)}`}
              explanation="The screen shows exactly what the goal asked for. That is a real app pipeline!"
            />
          ) : result.run.preview.kind === 'broken' ? (
            <motion.div
              key="broke" role="alert"
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: '#FDECEC', border: '1px solid #F3B6B6' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#D64545' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#D64545' }}>Sparky says: that app broke! 💥</p>
                <p className="text-xs mt-1" style={{ color: '#7A2E2E' }}>{result.run.preview.reason} Tip: {hint}</p>
              </div>
            </motion.div>
          ) : (
            <FeedbackPopup
              key="wrong" type="wrong"
              message="The app ran, but it isn't doing the goal yet."
              explanation={`Look at the screen above, then re-wire. Tip: ${hint}`}
            />
          )
        )}
      </AnimatePresence>

      {/* CONTROLS */}
      <div className="flex gap-2">
        <SFButton
          variant="primary" className="flex-1"
          onClick={handleRun}
          disabled={program.length === 0}
        >
          {result?.matched
            ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Shipped!</>
            : <><Play className="w-4 h-4 mr-2" /> Run App</>}
        </SFButton>
        <SFButton variant="outline" onClick={resetLevel} aria-label="Reset the pipeline">
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
export default function MyFirstAiAppGame() {
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
    completeGame('my-first-ai-app', ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="My First AI App" color="#E68E28" labNum={9}>
      <GameLevelSystem
        gameTitle="My First AI App"
        gameEmoji="📱"
        labColor={LAB_COLOR}
        levels={levelConfigs}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={levelById[level.id]} band={band} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
