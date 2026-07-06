// ════════════════════════════════════════════════════════════════════════
// LOST IN TRANSLATION v5 — Lab 8 — NLP / machine translation
// ════════════════════════════════════════════════════════════════════════
// A TELEPHONE GAME WITH REAL TEXT. A sentence is passed hop-by-hop through
// pivot languages and visibly MUTATES — each hop shows an English gloss of
// what that translator "heard". The comedy is the lesson: idioms, sarcasm and
// poetry drift; plain literal facts survive.
//
// Two mechanics across 5 levels:
//   (1) SPOT THE BROKEN HOP — read the chain, tap the step where the meaning
//       (or rhyme, or tone) was lost. The answer is NOT pre-labeled — the
//       reveal only lands after the child commits (G1 honesty).
//   (2) ROUTE TO KEEP IT INTACT — choose which translation path (old pivot
//       chain vs a modern meaning-aware LLM) preserves the message, then watch
//       both results play out.
//
// Frame: back-translation as a drift test kids can try in any real translator —
// send a sentence out to another language and back; if it comes home weird,
// you just found drift.

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, RotateCcw, Sparkles, Languages,
  Lightbulb, ArrowRight, Bot, GitBranch, ShieldCheck, Check, X,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import { GlowingTitle } from '@/components/games/shared/GameVisualKit';

const LAB_COLOR = '#8F96FA';
const INK = '#1A1D2B';
const SUB = '#5A6078';
const GOOD = '#2ECC71';
const BREAK = '#EF4444';

type AgeBand = 'A' | 'B' | 'C';

// ════════════════════════════════════════════════════════════════════════
// LEVEL DATA — every "drift" is a real, readable mutation of the sentence
// ════════════════════════════════════════════════════════════════════════
interface Hop {
  lang: string;   // the pivot this hop went through
  gloss: string;  // English gloss of what THIS translator produced
  broke: boolean; // true = meaning / rhyme / tone was lost AT this hop
}

interface SpotLevel {
  kind: 'spot';
  source: string;
  hops: Hop[];
  survives: boolean;      // true → correct answer is "It arrived safe"
  concept: string;
  hintA: string;          // concrete cue for band A
  reveal: string;         // Sparky teaching line after commit
  sparky: string;         // comedic narration of the garble
  tipC?: string;          // deeper back-translation tip for band C
}

interface RoutePath {
  id: string;
  label: string;
  sub: string;
  result: string;
  preserves: boolean;
}
interface RouteLevel {
  kind: 'route';
  source: string;
  meaning: string;        // what the sentence really means
  paths: RoutePath[];
  concept: string;
  hintA: string;
  reveal: string;
  sparky: string;         // narrates the broken route
  tipC?: string;
}

type LevelData = SpotLevel | RouteLevel;

const LEVEL_DATA: Record<number, LevelData> = {
  // ── L1: a literal sentence that SURVIVES (baseline drift test) ──────────
  1: {
    kind: 'spot',
    source: 'The red ball is under the table.',
    hops: [
      { lang: 'Spanish', gloss: 'The red ball is under the table.', broke: false },
      { lang: 'Japanese', gloss: 'The red ball is beneath the table.', broke: false },
      { lang: 'back to English', gloss: 'The red ball is under the table.', broke: false },
    ],
    survives: true,
    concept: 'Plain, literal sentences are tough to break. When the message comes home matching the start, your drift test passed.',
    hintA: 'Read every line. If they all still mean the same thing, tap “It arrived safe.”',
    reveal: 'Nothing broke! Concrete words like “red”, “ball” and “table” survive every hop, so the back-translation still matches the start.',
    sparky: 'Sparky: “Boring... but perfect. Not one word wandered off. That is a healthy sentence.”',
    tipC: 'Translators almost never disagree on concrete nouns. Drift shows up when the meaning is figurative, not literal.',
  },

  // ── L2: an idiom that BREAKS at the first hop ───────────────────────────
  2: {
    kind: 'spot',
    source: "It's raining cats and dogs.",
    hops: [
      { lang: 'word-for-word', gloss: 'Cats and dogs are falling from the sky.', broke: true },
      { lang: 'Portuguese', gloss: 'Pets are dropping out of the clouds.', broke: false },
      { lang: 'back to English', gloss: 'Animals keep falling down from above.', broke: false },
    ],
    survives: false,
    concept: 'Idioms are stored as whole phrases, not words. Translate them word-by-word and the real meaning vanishes instantly.',
    hintA: 'One line suddenly talks about REAL animals. That is where the saying got taken literally.',
    reveal: '“Raining cats and dogs” just means “raining hard” — but a word-for-word translator saw actual animals at the very first hop. Every hop after only carried the mistake along.',
    sparky: 'Sparky: “Somebody call animal rescue — it is storming poodles out there!”',
    tipC: 'A faithful hop can still pass along a broken meaning. The damage happens once, at the hop that misread the phrase.',
  },

  // ── L3: sarcasm whose TONE flips to sincere at a middle hop ─────────────
  3: {
    kind: 'spot',
    source: 'Oh, fantastic. Another rainy Monday. I just love this.',
    hops: [
      { lang: 'German', gloss: 'Oh, fantastic. Another rainy Monday. I really love this.', broke: false },
      { lang: 'literal pivot', gloss: 'It is a fantastic, lovely rainy Monday that I love.', broke: true },
      { lang: 'back to English', gloss: 'What a wonderful, happy Monday it is!', broke: false },
    ],
    survives: false,
    concept: 'Sarcasm lives in tone, not the literal words. Strip the tone and the meaning flips to its exact opposite.',
    hintA: 'The speaker is actually GRUMPY. Find the line where it suddenly sounds truly happy — that is the flip.',
    reveal: 'The speaker was annoyed — “I just love this” meant the opposite. At the second hop a translator that ignores tone turned the complaint into a genuine compliment.',
    sparky: 'Sparky: “Now the robot thinks you LOVE soggy Mondays. It is booking you a rainy vacation.”',
    tipC: 'Tone and context carry the real message. Remove them and a sarcastic line inverts — praise becomes complaint, or the reverse.',
  },

  // ── L4: a poem whose RHYME + music dies at the first hop ────────────────
  4: {
    kind: 'spot',
    source: 'The stars shine bright in the quiet night.',
    hops: [
      { lang: 'clinical pivot', gloss: 'The stars are very luminous during the silent darkness.', broke: true },
      { lang: 'Latin', gloss: 'Cosmic bodies emit strong light in the noiseless dark.', broke: false },
      { lang: 'back to English', gloss: 'Space objects produce illumination in the soundless dark.', broke: false },
    ],
    survives: false,
    concept: 'Rhyme, rhythm and imagery rarely survive translation. The facts may cross, but the music dies first.',
    hintA: 'One line stops rhyming and starts sounding like a science textbook. That is where the poem was lost.',
    reveal: '“Bright / night” rhymed and felt calm — but the first hop kept only the facts and dropped the rhyme and mood. The rest of the chain reads like a lab report.',
    sparky: 'Sparky: “Ah yes, the classic bedtime lullaby: “Cosmic bodies emit strong light.” Sleep tight, kids!”',
    tipC: 'Meaning can survive while form is destroyed. Poetry is the hardest translation job because sound and sense are tangled together.',
  },

  // ── L5: 2026 contrast — old pivot chain vs a meaning-aware LLM ───────────
  5: {
    kind: 'route',
    source: 'Break a leg at your big recital tonight!',
    meaning: '“Break a leg” is a theatre saying that means “good luck”.',
    paths: [
      {
        id: 'chain',
        label: 'Old pivot chain',
        sub: 'Hops through 3 languages, word by word',
        result: 'Injure your leg at tonight’s concert.',
        preserves: false,
      },
      {
        id: 'llm',
        label: 'Modern LLM',
        sub: 'One meaning-aware model, translated directly',
        result: 'Good luck at your big recital tonight!',
        preserves: true,
      },
    ],
    concept: 'Older machine translation hopped through pivot languages word-by-word. Modern language models translate the whole meaning at once, so sayings survive.',
    hintA: 'One path keeps the friendly “good luck” wish. The other tells your friend to get hurt. Pick the kind one.',
    reveal: 'The pivot chain translated the words and wished your friend an injury. A 2026 language model translated the meaning, so the good-luck wish arrived intact. Try it yourself: send a saying to another language and back — if it comes home weird, you found drift.',
    sparky: 'Sparky: “The old translator just wished your friend a trip to the nurse. Modern model saves the day!”',
    tipC: 'This is why machine translation switched from pivot chains to end-to-end neural models — they translate intent, not tokens. Even so, rare idioms can still drift, so always back-translate to check.',
  },
};

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Safe Arrival', description: 'A plain sentence takes the trip. Did anything change?', emoji: '📦', difficulty: 'easy', starThresholds: [40, 70, 100], xpReward: 50 },
  { id: 2, name: 'Cats & Dogs', description: 'An idiom hops through translators. Spot where it broke.', emoji: '🐱', difficulty: 'easy', starThresholds: [40, 70, 100], xpReward: 60 },
  { id: 3, name: 'Sure, Great', description: 'Sarcasm goes on a trip. Find the hop that flipped the tone.', emoji: '🙃', difficulty: 'medium', starThresholds: [40, 70, 100], xpReward: 80 },
  { id: 4, name: 'Starlight', description: 'A little poem is translated. Where did the music die?', emoji: '📜', difficulty: 'hard', starThresholds: [40, 70, 100], xpReward: 100 },
  { id: 5, name: 'Chain vs Model', description: 'Route a saying two ways and watch what survives.', emoji: '🤖', difficulty: 'expert', starThresholds: [40, 70, 100], xpReward: 130, isBonus: true },
];

// score → stars helper (shared by both mechanics)
function starsFor(score: number, thresholds: number[]): 0 | 1 | 2 | 3 {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}
// attempts → score: 1st try 100, 2nd 70, 3rd+ 40
const scoreForAttempts = (a: number) => (a <= 1 ? 100 : a === 2 ? 70 : 40);

// ════════════════════════════════════════════════════════════════════════
// CHAIN VIEW — the animated telephone: source, then each mutated hop
// ════════════════════════════════════════════════════════════════════════
function SentenceRow({
  label, icon, text, tone, delay, reduced, aria,
}: {
  label: string; icon: React.ReactNode; text: string;
  tone: 'source' | 'plain' | 'good' | 'break'; delay: number; reduced: boolean;
  aria?: string;
}) {
  const border =
    tone === 'break' ? BREAK : tone === 'good' ? GOOD : tone === 'source' ? LAB_COLOR : '#E6E8F2';
  const bg =
    tone === 'break' ? `${BREAK}0F` : tone === 'good' ? `${GOOD}0F` : tone === 'source' ? `${LAB_COLOR}12` : '#FFFFFF';
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: reduced ? 0 : delay, type: 'spring', damping: 22 }}
      className="rounded-2xl p-3 flex items-start gap-3"
      style={{ background: bg, border: `2px solid ${border}` }}
      aria-label={aria}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${border}22`, color: border }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold mb-0.5" style={{ color: border }}>{label}</div>
        <div className="text-sm leading-snug" style={{ color: INK }}>{text}</div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SPOT MECHANIC — tap the hop where meaning broke (or "it arrived safe")
// ════════════════════════════════════════════════════════════════════════
function SpotLevelView({
  data, band, level, onComplete, onExit,
}: {
  data: SpotLevel; band: AgeBand; level: LevelConfig;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const reduced = !!useReducedMotion();
  const [attempts, setAttempts] = useState(0);
  const [wrongPicks, setWrongPicks] = useState<Set<number>>(new Set()); // -1 = "safe"
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(band === 'A');
  const [nudge, setNudge] = useState<string | null>(null);

  // Correct target: index of the broken hop, or -1 meaning "it arrived safe"
  const correct = data.survives ? -1 : data.hops.findIndex((h) => h.broke);

  const commit = useCallback((pick: number) => {
    if (solved) return;
    setNudge(null);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (pick === correct) {
      setSolved(true);
      juice.onCorrect(level.id, scoreForAttempts(nextAttempts));
    } else {
      setWrongPicks((prev) => new Set(prev).add(pick));
      setNudge(
        pick === -1
          ? 'Not quite — something DID change on the way. Look for the odd line.'
          : 'That line still matched the sentence before it. The break is somewhere else.',
      );
      juice.onWrong(level.id, 0);
    }
  }, [solved, attempts, correct, juice, level.id]);

  const finish = useCallback(() => {
    const score = scoreForAttempts(attempts);
    const stars = starsFor(score, level.starThresholds);
    onComplete({ score, maxScore: 100, stars, xpEarned: Math.round(level.xpReward * (stars / 3)), timeMs: 0 });
  }, [attempts, level, onComplete]);

  const retry = useCallback(() => {
    setAttempts(0); setWrongPicks(new Set()); setSolved(false); setNudge(null);
  }, []);

  // tone for a hop row given current state
  const hopTone = (i: number): 'plain' | 'good' | 'break' => {
    if (!solved) return wrongPicks.has(i) ? 'good' : 'plain'; // a wrong-picked hop was "fine", tint green
    if (i === correct) return 'break';
    return 'good';
  };

  return (
    <div className="relative z-10 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <GlowingTitle emoji="🌍" color={LAB_COLOR}>Where did it break?</GlowingTitle>
        <span className="text-xs font-bold" style={{ color: LAB_COLOR }}>
          Try {Math.max(1, attempts + (solved ? 0 : 1))}
        </span>
      </div>

      <p className="text-xs" style={{ color: SUB }}>
        The sentence is passed from one translator to the next. Each line is what that translator
        <strong style={{ color: INK }}> heard</strong>. Tap the hop where the meaning was lost.
      </p>

      {/* HINT (auto for band A, on-demand for B; band C gets none) */}
      {band !== 'C' && (
        showHint ? (
          <div className="rounded-xl p-2.5 text-xs flex items-start gap-2" style={{ background: '#FFD93D18', color: '#8a6d00' }}>
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{data.hintA}</span>
          </div>
        ) : (
          <SFButton variant="ghost" size="sm" onClick={() => setShowHint(true)} aria-label="Show a hint">
            <Lightbulb className="w-4 h-4 mr-1" /> Need a hint?
          </SFButton>
        )
      )}

      {/* THE CHAIN */}
      <div className="space-y-2" role="group" aria-label="Translation chain — the original sentence and each translated hop">
        <SentenceRow
          label="Original (English)"
          icon={<MessageIcon />}
          text={data.source}
          tone="source"
          delay={0}
          reduced={reduced}
          aria={`Original sentence: ${data.source}`}
        />
        {data.hops.map((h, i) => {
          const tone = hopTone(i);
          const isCorrect = solved && i === correct;
          return (
            <div key={i} className="flex flex-col">
              <div className="flex justify-center py-0.5" aria-hidden="true">
                <ArrowRight className="w-4 h-4 rotate-90" style={{ color: '#B9BFD6' }} />
              </div>
              <button
                type="button"
                onClick={() => commit(i)}
                disabled={solved}
                aria-label={`Hop ${i + 1}, through ${h.lang}. Heard: ${h.gloss}. ${solved ? (isCorrect ? 'This is where the meaning broke.' : 'This hop kept the meaning.') : 'Tap if the meaning broke here.'}`}
                className="text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-transform disabled:cursor-default"
                style={{ ['--tw-ring-color' as string]: LAB_COLOR }}
              >
                <SentenceRow
                  label={`Hop ${i + 1} · via ${h.lang}${isCorrect ? ' — meaning lost here' : ''}`}
                  icon={isCorrect ? <X className="w-4 h-4" /> : solved ? <Check className="w-4 h-4" /> : <Languages className="w-4 h-4" />}
                  text={h.gloss}
                  tone={tone}
                  delay={0.12 * (i + 1)}
                  reduced={reduced}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* "It arrived safe" — the survives answer, always offered */}
      {!solved && (
        <button
          type="button"
          onClick={() => commit(-1)}
          aria-label="It arrived safe — no hop broke the meaning"
          className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{
            background: wrongPicks.has(-1) ? '#F0F1F8' : `${GOOD}12`,
            border: `2px dashed ${wrongPicks.has(-1) ? '#C7CCE0' : GOOD}`,
            color: wrongPicks.has(-1) ? '#8C94AC' : GOOD,
            ['--tw-ring-color' as string]: GOOD,
          }}
        >
          <ShieldCheck className="w-4 h-4" /> It arrived safe — nothing broke
        </button>
      )}

      {/* NUDGE after a wrong pick */}
      <AnimatePresence>
        {nudge && !solved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="status"
            className="rounded-xl p-3 text-xs"
            style={{ background: `${BREAK}12`, color: BREAK, border: `1px solid ${BREAK}30` }}
          >
            {nudge}
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVEAL — only after the child commits the correct answer */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="rounded-2xl p-4" style={{ background: `${GOOD}12`, border: `1px solid ${GOOD}40` }}>
              <p className="text-sm font-bold flex items-center gap-2" style={{ color: GOOD }}>
                <Check className="w-4 h-4" /> {data.survives ? 'Correct — it survived the trip!' : 'Correct — you found the broken hop!'}
              </p>
              <p className="text-sm mt-1.5" style={{ color: SUB }}>{data.reveal}</p>
            </div>
            <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: `${LAB_COLOR}12` }}>
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden="true" />
              <p className="text-xs italic" style={{ color: INK }}>{data.sparky}</p>
            </div>
            {band === 'C' && data.tipC && (
              <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: '#F0F1F8' }}>
                <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SUB }} aria-hidden="true" />
                <p className="text-xs" style={{ color: SUB }}><strong style={{ color: INK }}>Drift-test tip:</strong> {data.tipC}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTROLS */}
      <div className="flex gap-2 pt-1">
        {solved ? (
          <SFButton variant="primary" className="flex-1" onClick={finish}>
            <Sparkles className="w-4 h-4 mr-2" /> Continue
          </SFButton>
        ) : (
          <SFButton variant="outline" className="flex-1" onClick={retry} aria-label="Start this level over">
            <RotateCcw className="w-4 h-4 mr-2" /> Restart
          </SFButton>
        )}
        <SFButton variant="outline" onClick={onExit} aria-label="Exit to level map">✕</SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ROUTE MECHANIC — pick the path that preserves meaning, watch both results
// ════════════════════════════════════════════════════════════════════════
function RouteLevelView({
  data, band, level, onComplete, onExit,
}: {
  data: RouteLevel; band: AgeBand; level: LevelConfig;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const reduced = !!useReducedMotion();
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(band === 'A');

  const correctId = data.paths.find((p) => p.preserves)!.id;

  const pick = useCallback((id: string) => {
    if (solved) return;
    setRevealed((prev) => new Set(prev).add(id));
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (id === correctId) {
      setSolved(true);
      // reveal both so the child sees the contrast
      setRevealed(new Set(data.paths.map((p) => p.id)));
      juice.onCorrect(level.id, scoreForAttempts(nextAttempts));
    } else {
      juice.onWrong(level.id, 0);
    }
  }, [solved, attempts, correctId, data.paths, juice, level.id]);

  const finish = useCallback(() => {
    const score = scoreForAttempts(attempts);
    const stars = starsFor(score, level.starThresholds);
    onComplete({ score, maxScore: 100, stars, xpEarned: Math.round(level.xpReward * (stars / 3)), timeMs: 0 });
  }, [attempts, level, onComplete]);

  const retry = useCallback(() => {
    setAttempts(0); setRevealed(new Set()); setSolved(false);
  }, []);

  return (
    <div className="relative z-10 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <GlowingTitle emoji="🌍" color={LAB_COLOR}>Which path keeps the meaning?</GlowingTitle>
        <span className="text-xs font-bold" style={{ color: LAB_COLOR }}>Try {Math.max(1, attempts + (solved ? 0 : 1))}</span>
      </div>

      <SentenceRow
        label="Send this message"
        icon={<MessageIcon />}
        text={data.source}
        tone="source"
        delay={0}
        reduced={reduced}
        aria={`Message to translate: ${data.source}`}
      />
      <p className="text-xs" style={{ color: SUB }}>{data.meaning}</p>

      {band !== 'C' && (
        showHint ? (
          <div className="rounded-xl p-2.5 text-xs flex items-start gap-2" style={{ background: '#FFD93D18', color: '#8a6d00' }}>
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{data.hintA}</span>
          </div>
        ) : (
          <SFButton variant="ghost" size="sm" onClick={() => setShowHint(true)} aria-label="Show a hint">
            <Lightbulb className="w-4 h-4 mr-1" /> Need a hint?
          </SFButton>
        )
      )}

      {/* TWO ROUTE CARDS */}
      <div className="space-y-2" role="group" aria-label="Choose a translation path">
        {data.paths.map((p) => {
          const isRevealed = revealed.has(p.id);
          const border = !isRevealed ? '#E6E8F2' : p.preserves ? GOOD : BREAK;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p.id)}
              disabled={solved}
              aria-label={`${p.label}: ${p.sub}.${isRevealed ? ` Result: ${p.result}. ${p.preserves ? 'Meaning preserved.' : 'Meaning drifted.'}` : ' Tap to try this path.'}`}
              className="w-full text-left rounded-2xl p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-default transition-transform"
              style={{
                background: !isRevealed ? '#FFFFFF' : p.preserves ? `${GOOD}0F` : `${BREAK}0F`,
                border: `2px solid ${border}`,
                ['--tw-ring-color' as string]: LAB_COLOR,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${border}22`, color: border }} aria-hidden="true">
                  {p.id === 'llm' ? <Bot className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: INK }}>{p.label}</div>
                  <div className="text-xs" style={{ color: SUB }}>{p.sub}</div>
                </div>
              </div>
              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    initial={reduced ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 rounded-xl p-2.5 flex items-start gap-2"
                    style={{ background: p.preserves ? `${GOOD}15` : `${BREAK}15` }}
                  >
                    {p.preserves ? <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOOD }} /> : <X className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BREAK }} />}
                    <span className="text-sm" style={{ color: INK }}>“{p.result}”</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* wrong-first nudge */}
      {!solved && revealed.size > 0 && (
        <div role="status" className="rounded-xl p-3 text-xs" style={{ background: `${BREAK}12`, color: BREAK, border: `1px solid ${BREAK}30` }}>
          That route mangled the message. Try the other path.
        </div>
      )}

      {/* REVEAL */}
      <AnimatePresence>
        {solved && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="rounded-2xl p-4" style={{ background: `${GOOD}12`, border: `1px solid ${GOOD}40` }}>
              <p className="text-sm font-bold flex items-center gap-2" style={{ color: GOOD }}>
                <Check className="w-4 h-4" /> That path kept the meaning!
              </p>
              <p className="text-sm mt-1.5" style={{ color: SUB }}>{data.reveal}</p>
            </div>
            <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: `${LAB_COLOR}12` }}>
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden="true" />
              <p className="text-xs italic" style={{ color: INK }}>{data.sparky}</p>
            </div>
            {band === 'C' && data.tipC && (
              <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: '#F0F1F8' }}>
                <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SUB }} aria-hidden="true" />
                <p className="text-xs" style={{ color: SUB }}><strong style={{ color: INK }}>Drift-test tip:</strong> {data.tipC}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 pt-1">
        {solved ? (
          <SFButton variant="primary" className="flex-1" onClick={finish}>
            <Sparkles className="w-4 h-4 mr-2" /> Continue
          </SFButton>
        ) : (
          <SFButton variant="outline" className="flex-1" onClick={retry} aria-label="Start this level over">
            <RotateCcw className="w-4 h-4 mr-2" /> Restart
          </SFButton>
        )}
        <SFButton variant="outline" onClick={onExit} aria-label="Exit to level map">✕</SFButton>
      </div>
    </div>
  );
}

// small inline message-bubble icon (avoids a heavier lucide import)
function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — welcome → mechanic
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig; band: AgeBand;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const [phase, setPhase] = useState<'welcome' | 'play'>('welcome');
  const data = LEVEL_DATA[level.id];

  if (phase === 'welcome') {
    const goalText =
      data.kind === 'spot'
        ? 'Read the chain. Tap the hop where the meaning was lost — or say it arrived safe.'
        : 'Pick the translation path that keeps the message, then watch both results.';
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: SUB }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}14`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span><strong>Concept:</strong> {data.concept}</span>
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3514', color: '#c24e19' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span><strong>Goal:</strong> {goalText}</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('play')}>
          {data.kind === 'spot' ? 'Start the Relay' : 'Try Both Paths'} <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  return data.kind === 'spot'
    ? <SpotLevelView data={data} band={band} level={level} onComplete={onComplete} onExit={onExit} />
    : <RouteLevelView data={data} band={band} level={level} onComplete={onComplete} onExit={onExit} />;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function LostInTranslationGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0); // out of 15
    awardXP(Math.round(totalXP));
    completeGame('lost-in-translation', totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Lost in Translation" color="#8F96FA" labNum={8}>
      <GameLevelSystem
        gameTitle="Lost in Translation"
        gameEmoji="🌍"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} band={band} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
