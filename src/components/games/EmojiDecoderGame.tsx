// ════════════════════════════════════════════════════════════════════════
// EMOJI DECODER v5 — Lab 8 — DECODE archetype (de-cloned from SORT)
// ════════════════════════════════════════════════════════════════════════
// Previously a Sentiment-Scanner clone that hid the glyphs and only sorted
// text names into Positive/Negative/Action/Object bins. That undercut the
// whole premise ("an emoji is a TOKEN that carries meaning") for visual kids.
//
// v5 shows the GLYPH and its TOKEN NAME side by side — that juxtaposition IS
// the lesson — and adds two real mechanics on top of a crisper sort:
//   • SORT   — read a token by what it means: Feeling / Action / Thing / Sign.
//   • DECODE — turn an emoji SEQUENCE ("🍕➡️🏠❓") into a real sentence, after
//              Sparky first guesses it hilariously literally ("a pizza walks
//              home?") to show that CONTEXT changes meaning.
//   • FUZZY  — one ambiguous emoji (🙏 please/thanks/pray, 💀 dead/"hilarious",
//              🐐 goat/GOAT) means different things in different messages.
//
// 5 levels: sort → tricky sort → sequence decode → ambiguity → master mix.
// Fully keyboard-operable (buttons, no drag). Glyphs are aria-hidden; the
// token name is the accessible name. No answer telegraph — reveal on commit.
// Pixi/WebGL canvas removed — this is bespoke HTML/SVG (DOM archetype).

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useReducedMotion } from 'motion/react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, RotateCcw, Sparkles, ArrowRight, Bot,
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
import {
  GlowingTitle, ScoreDisplay, ComboCounter, FeedbackPopup,
} from '@/components/games/shared/GameVisualKit';

const LAB_COLOR = '#8F96FA';

// ════════════════════════════════════════════════════════════════════════
// TAXONOMY — one crisp axis: what does this token stand for?
// (was Positive/Negative/Action/Object — two mixed axes. Now single-axis.)
// ════════════════════════════════════════════════════════════════════════
type Band = 'A' | 'B' | 'C';
type Category = 'feeling' | 'action' | 'thing' | 'sign';

const CATS: Record<Category, { label: string; glyph: string; color: string }> = {
  feeling: { label: 'Feeling', glyph: '💗', color: '#E945F5' },
  action:  { label: 'Action',  glyph: '🏃', color: '#2ECC71' },
  thing:   { label: 'Thing',   glyph: '📦', color: '#4F6EF7' },
  sign:    { label: 'Sign',    glyph: '➡️', color: '#F59E0B' },
};

interface Option { id: string; text: string; correct: boolean; }
interface SortRound { kind: 'sort'; glyph: string; name: string; answer: Category; cats: Category[]; why: string; }
interface DecodeRound { kind: 'decode'; sequence: { glyph: string; name: string }[]; sparky: string; prompt: string; options: Option[]; why: string; }
interface FuzzyRound { kind: 'fuzzy'; glyph: string; name: string; context: string; prompt: string; options: Option[]; why: string; }
type Round = SortRound | DecodeRound | FuzzyRound;

// ── level definitions (kind drives the mechanic) ──
interface EmojiLevel extends LevelConfig { kind: 'sort' | 'sequence' | 'ambiguity' | 'mixed'; }

const LEVELS: EmojiLevel[] = [
  { id: 1, kind: 'sort', name: 'Token Kinds', description: 'Every emoji is a token. Read each one by what it MEANS.', emoji: '😊', difficulty: 'easy', starThresholds: [1, 2, 3], xpReward: 50 },
  { id: 2, kind: 'sort', name: 'Tricky Tokens', description: 'Gestures and signs sneak in. Read meaning, not shape.', emoji: '👍', difficulty: 'medium', starThresholds: [1, 2, 3], xpReward: 70 },
  { id: 3, kind: 'sequence', name: 'Decode a Sequence', description: 'A row of emoji is a sentence. Decode what it really says.', emoji: '➡️', difficulty: 'medium', starThresholds: [1, 2, 3], xpReward: 90 },
  { id: 4, kind: 'ambiguity', name: 'Same Emoji, New Meaning', description: 'One emoji can mean different things — let context decide.', emoji: '🙏', difficulty: 'hard', starThresholds: [1, 2, 3], xpReward: 120 },
  { id: 5, kind: 'mixed', name: 'Decoder Master', description: 'Sort, decode, and de-fuzz — everything you have learned.', emoji: '🤖', difficulty: 'expert', starThresholds: [1, 2, 3], xpReward: 160, isBonus: true },
];

const CONCEPTS: Record<EmojiLevel['kind'], string> = {
  sort: 'A model does not "see" an emoji as a picture — it reads it as a token with a meaning. Is it a Feeling, an Action, a Thing, or a Sign?',
  sequence: 'On its own an emoji is fuzzy. In a sequence, the emoji around it — and the order — give it a real meaning. That is how a model decodes a message.',
  ambiguity: 'The same emoji can mean totally different things. A model uses the words around it (the context) to pick which meaning is right.',
  mixed: 'Put it all together: read each token, decode a sequence, and let context resolve a fuzzy emoji — exactly what a real model does.',
};

// ════════════════════════════════════════════════════════════════════════
// CONTENT BANKS — glyph + token name always paired (the juxtaposition IS the lesson)
// ════════════════════════════════════════════════════════════════════════
interface SortItem { glyph: string; name: string; answer: Category; why: string; hard?: boolean; sign?: boolean; }

const SORT_ITEMS: SortItem[] = [
  { glyph: '😊', name: 'smiling face', answer: 'feeling', why: 'A smiling face is a Feeling — the token carries an emotion, not a thing.' },
  { glyph: '😢', name: 'crying face', answer: 'feeling', why: 'A crying face is a Feeling — a model reads it as sadness.' },
  { glyph: '😠', name: 'angry face', answer: 'feeling', why: 'An angry face is a Feeling — it stands for an emotion.' },
  { glyph: '❤️', name: 'red heart', answer: 'feeling', why: 'A heart is a Feeling — it means love or liking something.' },
  { glyph: '🏃', name: 'running person', answer: 'action', why: 'A running person is an Action — something is happening.' },
  { glyph: '👋', name: 'waving hand', answer: 'action', why: 'A waving hand is an Action — the doing of saying hello.' },
  { glyph: '💃', name: 'dancing person', answer: 'action', why: 'Dancing is an Action — a person doing something.' },
  { glyph: '🍕', name: 'pizza', answer: 'thing', why: 'A pizza is a Thing — an object, not a feeling or an action.' },
  { glyph: '🚀', name: 'rocket', answer: 'thing', why: 'A rocket is a Thing — the object the emoji names.' },
  { glyph: '🐶', name: 'dog face', answer: 'thing', why: 'A dog is a Thing — a real object (an animal), not a feeling.' },
  { glyph: '🎂', name: 'birthday cake', answer: 'thing', why: 'A cake is a Thing — the object pictured, not the party mood.' },
  // ── trickier (bands B/C): gestures read as actions, party face as feeling ──
  { glyph: '👍', name: 'thumbs up', answer: 'action', why: 'A thumbs up is a gesture — a doing — so it is an Action, not a Feeling.', hard: true },
  { glyph: '🥳', name: 'partying face', answer: 'feeling', why: 'A partying face shows the FEELING of celebrating, even though it wears a hat.', hard: true },
  { glyph: '👏', name: 'clapping hands', answer: 'action', why: 'Clapping is an Action — the gesture of applauding.', hard: true },
  // ── signs (bands B/C only) ──
  { glyph: '➡️', name: 'right arrow', answer: 'sign', why: 'An arrow is a Sign — it points "to" or "then". Not a feeling or a thing.', sign: true },
  { glyph: '✅', name: 'check mark', answer: 'sign', why: 'A check mark is a Sign that means "yes" or "done".', sign: true },
  { glyph: '❓', name: 'question mark', answer: 'sign', why: 'A question mark is a Sign — it turns a message into a question.', sign: true },
];

const DECODE = {
  easy: [
    { sequence: [{ glyph: '🍕', name: 'pizza' }, { glyph: '❓', name: 'question mark' }], sparky: 'A pizza with a question mark… is the pizza confused about something?', prompt: 'What is this message really asking?', opts: [['Do you want some pizza?', true], ['Is the pizza a question?', false], ['The pizza is thinking hard.', false]], why: 'By itself the pizza is just a Thing. Add a question mark and the context turns it into a question: "Want pizza?"' },
    { sequence: [{ glyph: '😴', name: 'sleepy face' }, { glyph: '➡️', name: 'right arrow' }, { glyph: '🛏️', name: 'bed' }], sparky: 'A sleepy face walks over and… carries a bed away on its back?', prompt: 'What does this sequence mean?', opts: [['I am tired, so I am going to bed.', true], ['The bed made me sleepy on purpose.', false], ['A face is stealing a bed.', false]], why: 'The arrow means "so / then". In order: tired, then off to bed. Context, not the pictures, makes the sentence.' },
  ],
  mid: [
    { sequence: [{ glyph: '🍕', name: 'pizza' }, { glyph: '➡️', name: 'right arrow' }, { glyph: '🏠', name: 'house' }, { glyph: '❓', name: 'question mark' }], sparky: 'A pizza… walks… to a house? Is the pizza lost and looking for its home?', prompt: 'What is this message really asking?', opts: [['Should we get pizza delivered to our house?', true], ['Does a pizza live inside the house?', false], ['Is the house made of pizza?', false]], why: 'The arrow means "to", the house means "home", and the question mark makes it a question. Context turns four pictures into "deliver pizza home?".' },
    { sequence: [{ glyph: '🎂', name: 'birthday cake' }, { glyph: '🎉', name: 'party popper' }, { glyph: '🎁', name: 'gift' }], sparky: 'A cake explodes right next to a present? That sounds messy and dangerous!', prompt: 'What does this sequence mean?', opts: [['Happy birthday — let us celebrate with gifts!', true], ['A cake blew up a present.', false], ['The gift is afraid of the cake.', false]], why: 'Together these tokens mean a birthday party. Meaning comes from the whole message, not one picture.' },
  ],
  hard: [
    { sequence: [{ glyph: '🌧️', name: 'rain cloud' }, { glyph: '➡️', name: 'right arrow' }, { glyph: '☂️', name: 'umbrella' }, { glyph: '➡️', name: 'right arrow' }, { glyph: '🙂', name: 'slightly smiling face' }], sparky: 'Rain strolls over to an umbrella, and then everyone is happy? Strange friendship!', prompt: 'What does this sequence really mean?', opts: [['It is raining, so take an umbrella and you will be fine.', true], ['The rain and umbrella are best friends.', false], ['An umbrella makes the rain smile.', false]], why: 'Read left to right with context: rain, then bring an umbrella, then you are okay. Same pictures, a real sentence.' },
    { sequence: [{ glyph: '📚', name: 'books' }, { glyph: '➡️', name: 'right arrow' }, { glyph: '🧠', name: 'brain' }, { glyph: '➡️', name: 'right arrow' }, { glyph: '💯', name: 'hundred points' }], sparky: 'Books march into a brain and out pops the number one hundred? Is that math magic?', prompt: 'What does this sequence mean?', opts: [['Study, learn it, and you will ace the test.', true], ['Books live inside your brain.', false], ['A brain scored a goal.', false]], why: 'The "100" token is slang for "perfect". Context: study, then understand, then top marks. The tokens only mean this together.' },
  ],
};

const AMBIG = {
  cryLaugh: [
    { glyph: '😭', name: 'loudly crying face', context: 'That joke was SO funny 😭', prompt: 'What does this emoji mean here?', opts: [['Laughing so hard it hurts', true], ['Really, really sad', false], ['Feeling sleepy', false]], why: 'This emoji usually means crying — but after something funny it means laughing till you cry. Context flips it.' },
    { glyph: '😭', name: 'loudly crying face', context: 'My goldfish died today 😭', prompt: 'What does this emoji mean here?', opts: [['Truly sad and crying', true], ['Laughing really hard', false], ['Super excited', false]], why: 'The same emoji — but this message is sad, so here it truly means crying. The words around it decide.' },
  ],
  pray: [
    { glyph: '🙏', name: 'folded hands', context: 'Thanks so much for helping me! 🙏', prompt: 'What does this emoji mean here?', opts: [['Thank you', true], ['Please help me', false], ['I am angry', false]], why: 'This emoji can mean thanks, please, or pray. After "thanks so much", here it means thank you.' },
    { glyph: '🙏', name: 'folded hands', context: '🙏 that it stops raining before the game', prompt: 'What does this emoji mean here?', opts: [['Hoping / please let it happen', true], ['Saying thank you', false], ['Giving a high-five', false]], why: 'The same emoji — but here it means hoping or "please". One emoji, different meaning by context.' },
  ],
  skull: [
    { glyph: '💀', name: 'skull', context: 'That meme killed me 💀', prompt: 'What does this emoji mean here?', opts: [['That is hilarious', true], ['Someone really died', false], ['I am scared', false]], why: 'This emoji can mean death — but online "I am dead" is slang for "that is so funny".' },
    { glyph: '💀', name: 'skull', context: 'The pirate flag had a 💀 on it', prompt: 'What does this emoji mean here?', opts: [['A real skull symbol', true], ['Something was funny', false], ['Saying thanks', false]], why: 'The same emoji — but on a pirate flag it means an actual skull. Context tells the model which meaning.' },
  ],
  goat: [
    { glyph: '🐐', name: 'goat', context: 'She is the 🐐 of basketball!', prompt: 'What does this emoji mean here?', opts: [['Greatest Of All Time', true], ['She owns a pet goat', false], ['She is a farm animal', false]], why: 'The goat animal became slang for G.O.A.T. — "Greatest Of All Time". Context makes it a compliment.' },
    { glyph: '🐐', name: 'goat', context: 'A 🐐 was munching grass in the field', prompt: 'What does this emoji mean here?', opts: [['A real goat animal', true], ['The greatest player ever', false], ['Something funny', false]], why: 'The same emoji — in a field it just means the animal. The sentence around it decides the meaning.' },
  ],
};

// ── option/round builders ──
function opts(pairs: [string, boolean][]): Option[] {
  return pairs.map(([text, correct], i) => ({ id: `o${i}`, text, correct }));
}
function toDecode(d: (typeof DECODE)['easy'][number]): DecodeRound {
  return { kind: 'decode', sequence: d.sequence, sparky: d.sparky, prompt: d.prompt, options: opts(d.opts as [string, boolean][]), why: d.why };
}
function toFuzzy(f: (typeof AMBIG)['pray'][number]): FuzzyRound {
  return { kind: 'fuzzy', glyph: f.glyph, name: f.name, context: f.context, prompt: f.prompt, options: opts(f.opts as [string, boolean][]), why: f.why };
}

function sortRounds(band: Band, seed: number, count: number): SortRound[] {
  const cats: Category[] = band === 'A' ? ['feeling', 'action', 'thing'] : ['feeling', 'action', 'thing', 'sign'];
  const pool = SORT_ITEMS.filter((it) => cats.includes(it.answer) && (band === 'A' ? !it.hard && !it.sign : true));
  const n = Math.min(count, pool.length);
  const out: SortRound[] = [];
  for (let i = 0; i < n; i++) {
    const it = pool[(seed + i) % pool.length];
    out.push({ kind: 'sort', glyph: it.glyph, name: it.name, answer: it.answer, cats, why: it.why });
  }
  return out;
}

function getRounds(level: EmojiLevel, band: Band): Round[] {
  switch (level.kind) {
    case 'sort':
      // L1 gentle, L2 leans on the tricky/sign items via a seed offset.
      return sortRounds(band, level.id === 1 ? 0 : 11, band === 'A' ? 4 : band === 'B' ? 5 : 6);
    case 'sequence': {
      const set = band === 'A' ? DECODE.easy : band === 'B' ? DECODE.mid : DECODE.hard;
      return set.map(toDecode);
    }
    case 'ambiguity':
      if (band === 'A') return AMBIG.cryLaugh.map(toFuzzy);
      if (band === 'B') return [...AMBIG.pray.map(toFuzzy), toFuzzy(AMBIG.cryLaugh[0])];
      return [toFuzzy(AMBIG.pray[0]), toFuzzy(AMBIG.skull[0]), toFuzzy(AMBIG.goat[0])];
    case 'mixed':
    default:
      if (band === 'A') return [...sortRounds('A', 2, 2), toDecode(DECODE.easy[0])];
      if (band === 'B') return [toDecode(DECODE.mid[1]), toFuzzy(AMBIG.pray[0]), toFuzzy(AMBIG.cryLaugh[0])];
      return [toDecode(DECODE.hard[0]), toFuzzy(AMBIG.skull[0]), toFuzzy(AMBIG.goat[0])];
  }
}

// ════════════════════════════════════════════════════════════════════════
// STIMULUS — the glyph + token name display for each round kind
// ════════════════════════════════════════════════════════════════════════
function Stimulus({ round }: { round: Round }) {
  if (round.kind === 'sort') {
    return (
      <div className="text-center">
        <div className="text-6xl leading-none mb-2" aria-hidden="true">{round.glyph}</div>
        <p className="text-sm" style={{ color: '#5A6078' }}>
          This token is called <strong style={{ color: '#1A1D2B' }}>&ldquo;{round.name}&rdquo;</strong>
        </p>
        <p className="text-base font-bold mt-1" style={{ color: '#1A1D2B' }}>What kind of token is it?</p>
      </div>
    );
  }
  if (round.kind === 'decode') {
    return (
      <div className="space-y-3">
        <div
          className="flex flex-wrap items-end justify-center gap-2"
          role="img"
          aria-label={`Emoji sequence: ${round.sequence.map((s) => s.name).join(', ')}`}
        >
          {round.sequence.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2"
              style={{ background: `${LAB_COLOR}12`, border: `1px solid ${LAB_COLOR}30` }}
            >
              <span className="text-4xl leading-none" aria-hidden="true">{s.glyph}</span>
              <span className="text-xs font-semibold" style={{ color: '#5A6078' }}>{s.name}</span>
            </div>
          ))}
        </div>
        <div
          className="rounded-2xl p-3 text-xs flex items-start gap-2"
          style={{ background: '#FFF7ED', border: '1px solid #F59E0B40', color: '#92400E' }}
        >
          <Bot className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong>Sparky reads it literally:</strong> &ldquo;{round.sparky}&rdquo; That can&rsquo;t be right — what does it REALLY mean?</span>
        </div>
        <p className="text-base font-bold text-center" style={{ color: '#1A1D2B' }}>{round.prompt}</p>
      </div>
    );
  }
  // fuzzy
  return (
    <div className="text-center space-y-2">
      <div className="text-6xl leading-none" aria-hidden="true">{round.glyph}</div>
      <p className="text-xs" style={{ color: '#8C94AC' }}>the token <strong style={{ color: '#5A6078' }}>&ldquo;{round.name}&rdquo;</strong> in a message:</p>
      <div
        className="rounded-2xl p-3 text-sm font-semibold inline-block"
        style={{ background: `${LAB_COLOR}12`, border: `1px solid ${LAB_COLOR}30`, color: '#1A1D2B' }}
      >
        &ldquo;{round.context}&rdquo;
      </div>
      <p className="text-base font-bold mt-1" style={{ color: '#1A1D2B' }}>{round.prompt}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: EmojiLevel; band: Band; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'play'>('welcome');
  const rounds = useMemo(() => getRounds(level, band), [level, band]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; message: string; explanation?: string } | null>(null);

  const round = rounds[roundIdx];
  const isLast = roundIdx >= rounds.length - 1;
  const maxScore = rounds.length * 10 + 20;

  const options: Option[] = useMemo(() => {
    if (round.kind === 'sort') {
      return round.cats.map((c) => ({ id: c, text: CATS[c].label, correct: c === round.answer }));
    }
    return round.options;
  }, [round]);

  const finishLevel = useCallback((finalScore: number, finalWrong: number) => {
    const accuracyBonus = Math.max(0, 20 - finalWrong * 7);
    const total = finalScore + accuracyBonus;
    const pct = total / maxScore;
    const stars = (pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0) as 0 | 1 | 2 | 3;
    setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 900);
  }, [level, maxScore, onComplete]);

  const handleSelect = useCallback((optId: string) => {
    if (selected !== null) return;
    setSelected(optId);
    const chosen = options.find((o) => o.id === optId);
    const correctOpt = options.find((o) => o.correct);
    const isCorrect = !!chosen?.correct;

    if (isCorrect) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Decoded! +${gained}`, explanation: round.why });
      juice.onCorrect(roundIdx, nextScore);
    } else {
      setCombo(0);
      setWrong((w) => w + 1);
      const answerText =
        round.kind === 'sort' ? `"${round.name}" is a ${CATS[round.answer].label}.`
          : `The answer is: "${correctOpt?.text}".`;
      setFeedback({ type: 'wrong', message: answerText, explanation: round.why });
      juice.onWrong(0, score);
    }
  }, [selected, options, combo, score, round, roundIdx, juice]);

  const handleNext = useCallback(() => {
    if (isLast) {
      finishLevel(score, wrong);
      return;
    }
    setRoundIdx((i) => i + 1);
    setSelected(null);
    setFeedback(null);
  }, [isLast, finishLevel, score, wrong]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.kind]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {level.kind === 'sequence' || (level.kind === 'mixed')
                ? <><strong>Decode:</strong> read the emoji, then pick what the message REALLY means. Sparky will guess wrong first!</>
                : level.kind === 'ambiguity'
                  ? <><strong>Un-fuzz it:</strong> the same emoji shows up in different messages. Pick the meaning that fits THIS one.</>
                  : <><strong>Sort:</strong> choose whether each token is a <strong>Feeling</strong>, <strong>Action</strong>, <strong>Thing</strong>{band === 'A' ? '' : <>, or <strong>Sign</strong></>}.</>}
            </span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('play')}>
          Start Decoding <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ PLAY ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>{level.name}</GlowingTitle>
        <span className="text-sm font-bold" style={{ color: LAB_COLOR }}>
          {Math.min(roundIdx + 1, rounds.length)} / {rounds.length}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <SFCard variant="elevated" className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={roundIdx}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Stimulus round={round} />
          </motion.div>
        </AnimatePresence>

        <div
          className="grid grid-cols-2 gap-2 mt-4"
          role="group"
          aria-label="Answer choices"
        >
          {options.map((o) => {
            const isSel = selected === o.id;
            const revealed = selected !== null;
            let bg = '#F8FAFF';
            let border = `${LAB_COLOR}30`;
            let textColor = '#1A1D2B';
            if (revealed) {
              if (o.correct) { bg = '#2ECC7115'; border = '#2ECC7180'; textColor = '#1B7A46'; }
              else if (isSel) { bg = '#EF444415'; border = '#EF444480'; textColor = '#B91C1C'; }
              else { bg = '#F4F5FA'; border = '#E4E7F2'; textColor = '#8C94AC'; }
            }
            return (
              <button
                key={o.id}
                onClick={() => handleSelect(o.id)}
                disabled={revealed}
                aria-pressed={isSel}
                aria-label={round.kind === 'sort' ? `${o.text} — this token is a ${o.text.toLowerCase()}` : o.text}
                className="text-left text-sm font-semibold rounded-2xl px-3 py-3 transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:cursor-default"
                style={{
                  background: bg,
                  border: `2px solid ${border}`,
                  color: textColor,
                  ['--tw-ring-color' as string]: LAB_COLOR,
                }}
              >
                {round.kind === 'sort' && (
                  <span className="mr-1.5" aria-hidden="true">{CATS[o.id as Category].glyph}</span>
                )}
                {o.text}
              </button>
            );
          })}
        </div>
      </SFCard>

      <AnimatePresence>
        {feedback && <FeedbackPopup key={roundIdx} {...feedback} />}
      </AnimatePresence>

      <div className="flex gap-2">
        <SFButton
          variant="primary"
          className="flex-1"
          onClick={handleNext}
          disabled={selected === null}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {selected === null ? 'Choose an answer…' : isLast ? 'Finish' : <>Next <ArrowRight className="w-4 h-4 ml-1.5" /></>}
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit to level map">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function EmojiDecoderGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0); // out of 15 (5 levels × 3)
    awardXP(Math.round(totalXP));
    completeGame('emoji-decoder', totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Emoji Decoder" color="#8F96FA" labNum={8}>
      <GameLevelSystem
        gameTitle="Emoji Decoder"
        gameEmoji="😊"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level as EmojiLevel} band={band} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
