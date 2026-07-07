// ════════════════════════════════════════════════════════════════════════
// SENTIMENT SCANNER v5 — Lab 8 (AI That Understands Us) — SORT + OVERRULE
// ════════════════════════════════════════════════════════════════════════
// You SORT short text messages into their emotion — Happy / Sad / Angry /
// Neutral — the way a sentiment classifier labels the feeling behind text.
//
// The real de-clone (band C): some messages are SARCASTIC or MIXED. On those,
// "Sparky's model" shows its guess AND its confidence — and it is sometimes
// WRONG (a naive model reads a sarcastic "Oh GREAT, another Monday" as Happy).
// child can AGREE with Sparky or OVERRULE him. A correct overrule scores a
// bonus. This teaches that models are uncertain and can be fooled.
//
// Themed message banks (movie reviews, customer feedback, group chat, game
// reviews, social posts) mean each level shows messages that actually match
// its theme — no more one generic bank behind every label.
//
// Emoji policy: this file keeps only the level-node identity icons plus the
// sarcasm cue emoji (eye-roll / upside-down face) that ARE the data the
// classifier trips over — removing them would gut the lesson. All UI
// affordances use lucide icons.

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronRight, ScanLine, GraduationCap, Target, RotateCcw, Sparkles, Bot,
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
import {
  GlowingTitle, ScoreDisplay, ComboCounter, FeedbackPopup,
} from '@/components/games/shared/GameVisualKit';

type AgeBand = 'A' | 'B' | 'C';

const LAB_COLOR = '#8F96FA';
const OVERRULE_BONUS = 8;

// ── The four emotion bins (index === bin id) ──
interface BinMeta { name: string; color: string; }
const BINS: BinMeta[] = [
  { name: 'Happy',   color: '#2ECC71' }, // 0
  { name: 'Sad',     color: '#4F6EF7' }, // 1
  { name: 'Angry',   color: '#EF4444' }, // 2
  { name: 'Neutral', color: '#8C94AC' }, // 3
];

// ════════════════════════════════════════════════════════════════════════
// MESSAGE MODEL
//   name    = full message (a11y + display) — NEVER names the answer (G1)
//   bin     = TRUE emotion, hidden until the child commits
//   clarity = 'clear' (band A+) or 'subtle' (band B+)
//   uncertain + modelGuess + modelConfidence = band-C overrule item. Sparky
//     shows modelGuess with modelConfidence; it may disagree with `bin`.
// ════════════════════════════════════════════════════════════════════════
interface Message {
  id: string;
  name: string;
  bin: number;
  why: string;
  clarity: 'clear' | 'subtle';
  uncertain?: boolean;
  modelGuess?: number;
  modelConfidence?: number;
}

// ════════════════════════════════════════════════════════════════════════
// PER-THEME BANKS — each theme's messages actually match the theme
// ════════════════════════════════════════════════════════════════════════
type ThemeKey = 'movies' | 'customer' | 'chat' | 'games' | 'social';

const THEME_BANKS: Record<ThemeKey, Message[]> = {
  movies: [
    { id: 'm-best', name: "Best film I've seen all year!", bin: 0, clarity: 'clear', why: '"best all year" is glowing praise — Happy.' },
    { id: 'm-waste', name: "Two boring hours I'll never get back.", bin: 2, clarity: 'clear', why: '"boring" plus a bitter complaint reads as frustration — Angry.' },
    { id: 'm-runtime', name: 'The film runs for 148 minutes.', bin: 3, clarity: 'clear', why: 'Just a fact about the length — Neutral.' },
    { id: 'm-cried', name: 'The ending had me in tears.', bin: 1, clarity: 'clear', why: '"in tears" signals sadness — Sad.' },
    { id: 'm-fine', name: 'It was... fine, I suppose.', bin: 3, clarity: 'subtle', why: 'Lukewarm, with no strong feeling either way — Neutral.' },
    { id: 'm-more', name: 'I expected so much more from this.', bin: 1, clarity: 'subtle', why: 'Quiet disappointment leans Sad, not angry.' },
    { id: 'm-superhero', name: 'Oh WOW, another superhero reboot. Thrilling. 🙄', bin: 2, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 81, why: '"wow" and "thrilling" fool the model into Happy, but the eye-roll and "another reboot" are sarcastic — really Angry.' },
    { id: 'm-classic', name: "Sure, 'instant classic.' We'll see. 🙃", bin: 3, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 72, why: 'The quote marks and upside-down face mean they doubt the hype — this is guarded/Neutral, not real praise.' },
  ],
  customer: [
    { id: 'c-best', name: "Best purchase I've ever made!", bin: 0, clarity: 'clear', why: '"best purchase ever" is clear delight — Happy.' },
    { id: 'c-broke', name: "It broke after one day. I'm furious.", bin: 2, clarity: 'clear', why: '"furious" is a direct anger word — Angry.' },
    { id: 'c-arrived', name: 'The package arrived on Tuesday.', bin: 3, clarity: 'clear', why: 'A plain delivery fact — Neutral.' },
    { id: 'c-sooner', name: "Wish I'd bought this sooner!", bin: 0, clarity: 'clear', why: 'A happy regret that it took so long to buy — Happy.' },
    { id: 'c-meh', name: 'Does the job, nothing special.', bin: 3, clarity: 'subtle', why: 'Neither pleased nor upset — Neutral.' },
    { id: 'c-hoped', name: "Not quite what I'd hoped for.", bin: 1, clarity: 'subtle', why: 'Gentle letdown leans Sad.' },
    { id: 'c-brilliant', name: 'Oh brilliant, it stopped working already. 🙄', bin: 2, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 85, why: '"brilliant" pulls the model to Happy, but the eye-roll and "stopped working" flip it — Angry.' },
    { id: 'c-tenstar', name: 'Ten stars. Truly love waiting a whole month for delivery.', bin: 2, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 78, why: 'The model hears "ten stars" and "love", but it is sarcasm about a slow delivery — Angry.' },
  ],
  chat: [
    { id: 'g-job', name: 'OMG I got the job!! So happy right now!', bin: 0, clarity: 'clear', why: '"OMG" and "so happy" burst with excitement — Happy.' },
    { id: 'g-left-out', name: "I'm so tired of being left out.", bin: 1, clarity: 'clear', why: 'Feeling left out and worn down — Sad.' },
    { id: 'g-done', name: 'Stop texting me. I am DONE.', bin: 2, clarity: 'clear', why: '"stop" and shouty "DONE" signal anger — Angry.' },
    { id: 'g-meet', name: 'Meet at 7 outside the cinema.', bin: 3, clarity: 'clear', why: 'A plain plan with no feeling — Neutral.' },
    { id: 'g-wait', name: "Guess I'll just wait here then.", bin: 1, clarity: 'subtle', why: 'Resigned and a little hurt — leans Sad.' },
    { id: 'g-late', name: 'Running 5 minutes late, sorry!', bin: 3, clarity: 'subtle', why: 'A quick heads-up, no strong emotion — Neutral.' },
    { id: 'g-invite', name: 'Wow, thanks SO much for the invite. Really. 🙄', bin: 1, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 80, why: '"thanks so much" looks Happy to the model, but the eye-roll shows they were left out and hurt — Sad.' },
    { id: 'g-fine', name: "No no, it's FINE, I love waiting an hour. 🙃", bin: 2, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 77, why: '"it\'s fine" and "I love" fool the model, but this is annoyed sarcasm — Angry.' },
  ],
  games: [
    { id: 'v-masterpiece', name: 'This game is an absolute masterpiece!', bin: 0, clarity: 'clear', why: '"absolute masterpiece" is strong praise — Happy.' },
    { id: 'v-ragequit', name: 'Rage-quit after the tenth crash.', bin: 2, clarity: 'clear', why: '"rage-quit" says it all — Angry.' },
    { id: 'v-download', name: "It's a 12 GB download.", bin: 3, clarity: 'clear', why: 'A factual detail — Neutral.' },
    { id: 'v-tears', name: 'The story left me in tears.', bin: 1, clarity: 'clear', why: '"in tears" is a sadness cue — Sad.' },
    { id: 'v-decent', name: "Decent, but I've played better.", bin: 3, clarity: 'subtle', why: 'A shrug of a review — Neutral.' },
    { id: 'v-letdown', name: 'The ending really let me down.', bin: 1, clarity: 'subtle', why: 'Disappointment leans Sad.' },
    { id: 'v-paywall', name: 'Great, ANOTHER paywall. Love it. 🙄', bin: 2, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 84, why: '"great" and "love it" read as Happy, but the eye-roll over a paywall is sarcasm — Angry.' },
    { id: 'v-boss', name: '10/10 would happily lose to that boss again — best fight in years!', bin: 0, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 70, why: 'Here Sparky is RIGHT — "10/10", "happily" and "best fight in years" are genuine praise. Agreeing with him is the correct call.' },
  ],
  social: [
    { id: 's-puppy', name: 'Just adopted the cutest puppy ever!', bin: 0, clarity: 'clear', why: '"cutest ever" is pure joy — Happy.' },
    { id: 's-grandma', name: 'Missing my grandma so much today.', bin: 1, clarity: 'clear', why: '"missing... so much" expresses loss — Sad.' },
    { id: 's-weather', name: 'Absolutely done with this endless rain.', bin: 2, clarity: 'clear', why: '"absolutely done" is fed-up frustration — Angry.' },
    { id: 's-blog', name: 'New blog post is up at the link.', bin: 3, clarity: 'clear', why: 'A plain announcement — Neutral.' },
    { id: 's-week', name: 'Not my best week, honestly.', bin: 1, clarity: 'subtle', why: 'A quiet low mood — leans Sad.' },
    { id: 's-news', name: 'Big news coming soon — stay tuned.', bin: 3, clarity: 'subtle', why: 'A teaser with no clear feeling yet — Neutral.' },
    { id: 's-monday', name: 'Oh GREAT, another Monday 🙄', bin: 2, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 82, why: '"GREAT" fools the model into Happy, but the eye-roll about Monday is weary sarcasm — Angry.' },
    { id: 's-alarm', name: "Just LOVING how my alarm didn't go off. 🙃", bin: 2, clarity: 'subtle', uncertain: true, modelGuess: 0, modelConfidence: 79, why: '"LOVING" pulls the model to Happy; the real message is frustration about oversleeping — Angry.' },
  ],
};

// ── Level meta: 5 real themed levels ──
const THEME_ORDER: ThemeKey[] = ['movies', 'customer', 'chat', 'games', 'social'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Movie Reviews', description: 'Did they love it or hate it?', emoji: '🎬', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 2, name: 'Customer Feedback', description: 'Sort product reviews by mood.', emoji: '⭐', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 3, name: 'Group Chat', description: 'Read the room in a busy chat.', emoji: '💬', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 4, name: 'Game Reviews', description: 'Praise, rage-quits, and plain facts.', emoji: '🎮', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 5, name: 'Social Posts', description: 'Watch out — some posts are sarcastic!', emoji: '📱', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 160, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Sentiment analysis reads a review and labels its feeling from cue words — "loved" is Happy, "boring" is not.',
  2: 'Reviews pack feeling: "best purchase ever" is Happy, "broke in a day" is Angry, "arrived Tuesday" is Neutral.',
  3: 'Chats mix all four emotions fast — and a short "guess I\'ll wait" can hide real feeling under a few words.',
  4: 'Same words, different tone: "10/10" can be honest praise OR sarcasm. Context and emoji decide.',
  5: 'Models are uncertain. On sarcasm, a naive model reads "Oh GREAT, another Monday" as Happy — and it is WRONG. You can overrule it.',
};

// ════════════════════════════════════════════════════════════════════════
// ITEM SELECTION — band decides which messages appear
//   A: clear-cut only, no model uncertainty
//   B: clear + subtle, no model uncertainty
//   C: clear + subtle + the sarcasm / overrule-the-model items
// ════════════════════════════════════════════════════════════════════════
function getItems(theme: ThemeKey, band: AgeBand): Message[] {
  const bank = THEME_BANKS[theme];
  const clear = bank.filter((m) => m.clarity === 'clear' && !m.uncertain);
  const subtle = bank.filter((m) => m.clarity === 'subtle' && !m.uncertain);
  const uncertain = bank.filter((m) => m.uncertain);

  if (band === 'A') {
    return clear.slice(0, 4);
  }
  if (band === 'B') {
    return [clear[0], clear[1], clear[2], subtle[0], subtle[1]].filter(Boolean) as Message[];
  }
  // Band C — weave the overrule items into a themed set of up to 6
  return [clear[0], clear[1], subtle[0], uncertain[0], clear[2], uncertain[1]]
    .filter(Boolean) as Message[];
}

// ════════════════════════════════════════════════════════════════════════
// SPARKY MODEL PANEL — shows the model's guess + confidence for band-C items.
// This is the MODEL'S OPINION for the child to evaluate — NOT the answer key.
// ════════════════════════════════════════════════════════════════════════
function SparkyGuess({ guessBin, confidence }: { guessBin: number; confidence: number }) {
  const g = BINS[guessBin];
  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ background: `${LAB_COLOR}12`, border: `1px solid ${LAB_COLOR}33` }}
      role="group"
      aria-label={`Sparky's model guesses ${g.name} with ${confidence} percent confidence. He can be wrong — you decide.`}
    >
      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: LAB_COLOR }}>
        <Bot className="w-4 h-4" aria-hidden="true" />
        <span>Sparky&apos;s model thinks:</span>
        <span className="inline-flex items-center gap-1" style={{ color: g.color }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} aria-hidden="true" />
          {g.name}
        </span>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: '#8C94AC' }}>
          <span>Confidence</span>
          <span style={{ color: LAB_COLOR, fontWeight: 700 }}>{confidence}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: `${LAB_COLOR}22` }}>
          <div className="h-full rounded-full" style={{ width: `${confidence}%`, background: LAB_COLOR }} />
        </div>
      </div>
      <p className="text-xs" style={{ color: '#8C94AC' }}>
        Sparky can be fooled by sarcasm. Agree if he&apos;s right — or <strong style={{ color: LAB_COLOR }}>overrule</strong> him if you think he&apos;s wrong.
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — one message at a time, four bin buttons, reveal on commit
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, theme, band, onComplete, onExit,
}: {
  level: LevelConfig; theme: ThemeKey; band: AgeBand;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'sort'>('welcome');
  const items = useMemo(() => getItems(theme, band), [theme, band]);

  const [idx, setIdx] = useState(0);
  const [chosenBin, setChosenBin] = useState<number | null>(null); // committed pick for current item
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [overruleWins, setOverruleWins] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const item = items[idx];
  const maxScore = items.length * 10;
  const committed = chosenBin !== null;

  const finishLevel = useCallback((finalCorrect: number, finalScore: number) => {
    const frac = items.length > 0 ? finalCorrect / items.length : 0;
    const stars = (frac >= 0.9 ? 3 : frac >= 0.7 ? 2 : frac >= 0.4 ? 1 : 0) as 0 | 1 | 2 | 3;
    setTimeout(() => {
      onComplete({ score: finalScore, maxScore, stars, xpEarned: Math.round(level.xpReward * (stars / 3)), timeMs: 0 });
    }, 900);
  }, [items.length, maxScore, level.xpReward, onComplete]);

  const handlePick = useCallback((bin: number) => {
    if (committed || !item) return;
    setChosenBin(bin);

    const isCorrect = bin === item.bin;
    const trueLabel = BINS[item.bin].name;
    const doneCount = idx + 1;

    if (item.uncertain) {
      const overruled = bin !== item.modelGuess;
      if (isCorrect) {
        const bonus = overruled ? OVERRULE_BONUS : 0;
        const gained = 10 + combo + bonus;
        setScore((s) => s + gained);
        setCombo((c) => c + 1);
        setCorrectCount((c) => c + 1);
        if (overruled) {
          setOverruleWins((o) => o + 1);
          setFeedback({ type: 'correct', message: `You overruled Sparky — and you were right! +${gained}`, explanation: item.why });
        } else {
          setFeedback({ type: 'correct', message: `You agreed with Sparky — correct! +${gained}`, explanation: item.why });
        }
        juice.onCorrect(doneCount, score + gained);
      } else {
        setCombo(0);
        const trustedWrongModel = bin === item.modelGuess;
        setFeedback({
          type: 'wrong',
          message: trustedWrongModel
            ? `Sparky was fooled by the sarcasm — it's actually ${trueLabel}.`
            : `Not quite — it's actually ${trueLabel}.`,
          explanation: item.why,
        });
        juice.onWrong(doneCount, score);
      }
    } else if (isCorrect) {
      const gained = 10 + combo;
      setScore((s) => s + gained);
      setCombo((c) => c + 1);
      setCorrectCount((c) => c + 1);
      setFeedback({ type: 'correct', message: combo >= 2 ? `${combo + 1}x combo! +${gained}` : `Scanned! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, score + gained);
    } else {
      setCombo(0);
      setFeedback({ type: 'wrong', message: `That message is ${trueLabel}.`, explanation: item.why });
      juice.onWrong(doneCount, score);
    }
  }, [committed, item, idx, combo, score, juice]);

  const handleContinue = useCallback(() => {
    if (idx + 1 >= items.length) {
      finishLevel(correctCount, score);
      return;
    }
    setIdx((i) => i + 1);
    setChosenBin(null);
    setFeedback(null);
  }, [idx, items.length, correctCount, score, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> read each message and send it to <strong>Happy</strong>, <strong>Sad</strong>, <strong>Angry</strong>, or <strong>Neutral</strong>.</span>
          </div>
          {band === 'C' && (
            <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}12`, color: LAB_COLOR }}>
              <Bot className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Overrule Sparky:</strong> on tricky messages, Sparky&apos;s model shows a guess and how confident it is. If you think he&apos;s wrong (sarcasm can fool him), pick a different bin — a correct overrule earns a bonus!</span>
            </div>
          )}
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Scanning <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle color={LAB_COLOR}>Sort the Emotion</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <ScanLine className="w-4 h-4" />{Math.min(idx + 1, items.length)} / {items.length}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      {/* The message under scan */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          <SFCard variant="elevated" className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold mb-2" style={{ color: LAB_COLOR }}>
              <ScanLine className="w-4 h-4" /> Scanning message {idx + 1}
            </div>
            <p
              className="text-lg font-semibold leading-snug"
              style={{ color: '#1A1D2B' }}
              aria-label={`Message: ${item.name}`}
            >
              &ldquo;{item.name}&rdquo;
            </p>
          </SFCard>
        </motion.div>
      </AnimatePresence>

      {/* Sparky's model opinion (band-C overrule items only) */}
      {item.uncertain && item.modelGuess !== undefined && item.modelConfidence !== undefined && (
        <SparkyGuess guessBin={item.modelGuess} confidence={item.modelConfidence} />
      )}

      {/* Four emotion bins — keyboard-operable buttons */}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose the emotion for this message">
        {BINS.map((bin, i) => {
          const isChosen = chosenBin === i;
          const isTruth = committed && i === item.bin;
          const isWrongPick = committed && isChosen && i !== item.bin;
          const isSparkyPick = item.uncertain && item.modelGuess === i;
          const borderColor = isTruth ? '#2ECC71' : isWrongPick ? '#EF4444' : `${bin.color}55`;
          const bg = isTruth ? '#2ECC7115' : isWrongPick ? '#EF444415' : `${bin.color}12`;
          return (
            <button
              key={bin.name}
              type="button"
              disabled={committed}
              onClick={() => handlePick(i)}
              aria-label={`Sort into ${bin.name}${isSparkyPick ? " — Sparky's pick" : ''}`}
              className="relative min-h-14 rounded-xl px-4 flex items-center justify-center gap-2 text-sm font-bold transition-all
                focus-visible:outline-none focus-visible:ring-2 disabled:cursor-default"
              style={{
                background: bg,
                color: bin.color,
                border: `2px solid ${borderColor}`,
                opacity: committed && !isTruth && !isWrongPick ? 0.5 : 1,
                ['--tw-ring-color' as string]: bin.color,
              }}
            >
              <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ background: bin.color }} />
              {bin.name}
              {isSparkyPick && (
                <span
                  className="absolute -top-2 -right-2 flex items-center rounded-full px-1.5 py-0.5"
                  style={{ background: LAB_COLOR, color: '#0B0E1A' }}
                  aria-hidden="true"
                >
                  <Bot className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {feedback && <FeedbackPopup {...feedback} />}
      </AnimatePresence>

      {/* Advance / exit */}
      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={handleContinue} disabled={!committed}>
          <Sparkles className="w-4 h-4 mr-2" />
          {!committed ? 'Pick an emotion…' : idx + 1 >= items.length ? 'Finish!' : 'Next message'}
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>

      {band === 'C' && overruleWins > 0 && (
        <p className="text-xs font-semibold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Bot className="w-3.5 h-3.5" /> {overruleWins} correct overrule{overruleWins > 1 ? 's' : ''} — you caught the model being wrong!
        </p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function SentimentScannerGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = results.length * 3;
    const frac = maxStars > 0 ? totalStars / maxStars : 0;
    awardXP(Math.round(totalXP));
    completeGame('sentiment-scanner', frac >= 0.8 ? 3 : frac >= 0.5 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Sentiment Scanner" color="#8F96FA" labNum={8}>
      <GameLevelSystem
        gameTitle="Sentiment Scanner"
        gameEmoji=""
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer
            key={level.id}
            level={level}
            theme={THEME_ORDER[level.id - 1]}
            band={band}
            onComplete={onComplete}
            onExit={onExit}
          />
        )}
      />
    </GameShell>
  );
}
