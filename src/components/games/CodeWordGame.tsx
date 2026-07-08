// ════════════════════════════════════════════════════════════════════════
// CODE WORD — Lab 6 (AI & Ethics) — voice-clone / deepfake-scam defense
// ════════════════════════════════════════════════════════════════════════
// Rebuild plan §II.7 NEW-4. Replaces the obsolete "spot the deepfake
// artifact" pedagogy (you can no longer reliably tell a clone by looking or
// listening) with VERIFICATION BEHAVIOR: because the clone may be perfect,
// you defeat it by verifying through a trusted channel.
//
// Loop: an "incoming" phone call / text / video-call is shown as a styled
// transcript. A "family member" makes an URGENT ask that could be an AI
// voice/face clone. The child commits to a response BEFORE any answer is
// highlighted (HONESTY): agree a code word, hang up + call back on the known
// number, tell a trusted adult, check provenance — or the wrong "just do
// what it says". After committing, Sparky reveals what a scammer running a
// clone would have done and why the verification step defeats it.
//
// Escalates obvious → a flawless clone where the ONLY defense is the protocol
// (Scenario 5, band C surfaces the provenance nuance).
//
// Unplugged tie-in: an interactive "set up a family code word" card the child
// fills in, with a print affordance (window.print, feature-detected).
//
// Pure DOM/SVG. Optional Web Speech read-aloud of the scripted line is
// feature-detected AND muted by default (the transcript is always shown).
// ARIA throughout; reveals are announced via aria-live.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Phone, MessageSquare, Video, ShieldCheck, PhoneCall, Users, FileSearch,
  Printer, KeyRound, Volume2, VolumeX, Play, ArrowRight, CheckCircle2,
  XCircle, RotateCcw, Sparkles, AlertTriangle, Lightbulb, ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';

// ── Palette (inline dark surface per contract) ──────────────────────────
const LAB_COLOR = '#FF7050';
const INK = '#0E1428';
const PANEL = '#141B33';
const PANEL_HI = '#1B2340';
const TEXT = '#EAF0F6';
const TEXT_DIM = '#9AA4BE';
const SAFE = '#2ECC71';
const DANGER = '#FF5C6C';

type Band = 'A' | 'B' | 'C';
type Channel = 'phone' | 'text' | 'video';
type Phase = 'welcome' | 'setup' | 'scenario' | 'reveal' | 'complete';

type ChoiceId = 'codeword' | 'callback' | 'adult' | 'provenance' | 'comply';

interface Choice {
  id: ChoiceId;
  label: string;
  icon: LucideIcon;
  safe: boolean;
}

const CHANNEL_META: Record<Channel, { icon: LucideIcon; label: string }> = {
  phone: { icon: Phone, label: 'Incoming call' },
  text: { icon: MessageSquare, label: 'New message' },
  video: { icon: Video, label: 'Video call' },
};

// The full menu of protocol responses. Each scenario picks a subset per band.
const CHOICE_LIB: Record<ChoiceId, Choice> = {
  codeword: { id: 'codeword', label: 'Ask for our family code word', icon: KeyRound, safe: true },
  callback: { id: 'callback', label: 'Hang up and call back on the number I know', icon: PhoneCall, safe: true },
  adult: { id: 'adult', label: 'Tell a trusted adult before doing anything', icon: Users, safe: true },
  provenance: { id: 'provenance', label: 'Check where this really came from', icon: FileSearch, safe: true },
  comply: { id: 'comply', label: 'Just do what they asked — it sounds like them', icon: AlertTriangle, safe: false },
};

interface Scenario {
  id: string;
  channel: Channel;
  from: string;
  claim: string;
  transcript: string[];
  spoken: string; // the single scripted line an optional voice would read
  urgentAsk: string;
  scammerMove: string;
  whyProtocolWins: string;
  provenanceNote?: string; // surfaced for band C
  // Which protocol responses appear, per band. `comply` is always the trap.
  choiceIds: Record<Band, ChoiceId[]>;
}

// ── 5 scripted scenarios, escalating (obvious → flawless clone) ──────────
const SCENARIOS: Scenario[] = [
  {
    id: 'grandma-giftcards',
    channel: 'phone',
    from: 'Grandma',
    claim: 'your grandma',
    transcript: [
      '"Hi sweetie, it\'s Grandma. My voice sounds funny, I have a cold."',
      '"I\'m in a hurry — can you buy me some gift cards and read me the numbers? Don\'t tell your mum, it\'s a surprise."',
    ],
    spoken: 'Hi sweetie, it is Grandma. Can you buy me some gift cards and read me the numbers? Do not tell your mum.',
    urgentAsk: 'Buy gift cards right now and keep it secret.',
    scammerMove:
      'A scammer can copy a voice from a few seconds of video online. "Grandma" may not be Grandma at all — the "cold" excuse hides that the clone is not perfect.',
    whyProtocolWins:
      'A real grandma is happy to wait while you check with an adult. "Keep it a secret" and "hurry" are the two biggest warning signs of a scam.',
    choiceIds: {
      A: ['adult', 'callback', 'comply'],
      B: ['adult', 'callback', 'codeword', 'comply'],
      C: ['adult', 'callback', 'codeword', 'comply'],
    },
  },
  {
    id: 'mom-password',
    channel: 'text',
    from: 'Mom',
    claim: 'your mum',
    transcript: [
      '"Hey it\'s Mum, I\'m on a new phone 📱 lost my old one."',
      '"Quick — what\'s the password to the family tablet? Locked out and I need it NOW."',
    ],
    spoken: 'Hey it is Mum, I am on a new phone. Quick, what is the password to the family tablet? I need it now.',
    urgentAsk: 'Send a password to a "new" number immediately.',
    scammerMove:
      'A text from a "new phone" is a classic trick — anyone can type "it\'s Mum". No voice or face is even needed, just urgency and a story.',
    whyProtocolWins:
      'Call the number you already have saved for Mum. If the person on the new number is real, they will still be reachable the normal way. Passwords never go over a surprise text.',
    choiceIds: {
      A: ['adult', 'callback', 'comply'],
      B: ['callback', 'adult', 'codeword', 'comply'],
      C: ['callback', 'codeword', 'provenance', 'comply'],
    },
  },
  {
    id: 'friend-money',
    channel: 'video',
    from: 'Jordan (friend)',
    claim: 'your friend Jordan',
    transcript: [
      '"It\'s Jordan! I\'m stuck in town and my phone\'s about to die."',
      '"Can you get a grown-up to send me money? Please, be quick, I\'m scared."',
    ],
    spoken: 'It is Jordan. I am stuck in town and my phone is about to die. Can you get a grown-up to send me money?',
    urgentAsk: 'Rush a grown-up into sending money to a friend.',
    scammerMove:
      'A video call can be faked too — a "deepfake" can put your friend\'s face and voice on a scammer. It looked and sounded like Jordan, and it was still fake.',
    whyProtocolWins:
      'Ask for the code word only the two of you agreed. A clone copied from videos online does NOT know a secret word you never posted anywhere.',
    choiceIds: {
      A: ['adult', 'codeword', 'comply'],
      B: ['codeword', 'callback', 'adult', 'comply'],
      C: ['codeword', 'callback', 'provenance', 'comply'],
    },
  },
  {
    id: 'cousin-secret',
    channel: 'phone',
    from: 'Cousin Amy',
    claim: 'your cousin Amy',
    transcript: [
      '"It\'s Amy — please don\'t tell anyone, I\'m in trouble and I\'m crying."',
      '"I need you to approve a payment on the family account. Stay on the line, don\'t hang up, don\'t call anyone."',
    ],
    spoken: 'It is Amy. Please do not tell anyone. I need you to approve a payment. Stay on the line, do not hang up.',
    urgentAsk: 'Approve a payment and never hang up or check.',
    scammerMove:
      'A cloned voice can cry and beg. "Don\'t hang up, don\'t call anyone" exists for one reason: to stop you from verifying, because verifying is exactly what breaks the trick.',
    whyProtocolWins:
      'Hanging up and calling back on the number you know is the move the scammer fears most. The real Amy can be reached the normal way; a clone cannot survive a call-back.',
    choiceIds: {
      A: ['adult', 'callback', 'comply'],
      B: ['callback', 'codeword', 'adult', 'comply'],
      C: ['callback', 'codeword', 'provenance', 'comply'],
    },
  },
  {
    id: 'parent-flawless-clone',
    channel: 'video',
    from: 'Dad',
    claim: 'your dad',
    transcript: [
      '"Hi, it\'s Dad. Everything looks and sounds completely normal, right? Same face, same voice."',
      '"I need you to read me the family banking code. It\'s really me — you can see me."',
    ],
    spoken: 'Hi, it is Dad. I need you to read me the family banking code. It is really me, you can see me.',
    urgentAsk: 'Hand over a banking code to a face that looks perfect.',
    scammerMove:
      'This clone is flawless — the face and voice have NO glitch to spot. Looking harder cannot help you here; the picture is convincing on purpose.',
    whyProtocolWins:
      'When you cannot tell by looking or listening, the PROTOCOL is the whole defense: ask the code word, and hang up and call back on the known number. A perfect-looking clone still fails both.',
    provenanceNote:
      'Provenance = "where did this really come from?" A genuine call comes from the saved contact and survives a call-back; a real photo or clip can carry C2PA content credentials. A clone has neither — it cannot prove its origin no matter how real it looks.',
    choiceIds: {
      A: ['adult', 'callback', 'comply'],
      B: ['codeword', 'callback', 'adult', 'comply'],
      C: ['codeword', 'callback', 'provenance', 'comply'],
    },
  },
];

const POINTS_PER_SAFE = 20;
const MAX_SCORE = SCENARIOS.length * POINTS_PER_SAFE;

// Band-tuned intro copy from Sparky.
const BAND_INTRO: Record<Band, string> = {
  A: 'A clever trick can copy a voice you know. If a call feels rushed or secret, the safe move is simple: tell a trusted adult before you do anything.',
  B: 'AI can now copy a familiar voice — even a face on a video call. You cannot always tell. So you VERIFY: a family code word, or hang up and call back on the number you know.',
  C: 'A voice or face clone can be flawless, so spotting a "tell" no longer works. The defense is verification behaviour: a code word, a call-back on a trusted number, and checking provenance — where it truly came from.',
};

// ════════════════════════════════════════════════════════════════════════
// Optional Web Speech read-aloud — feature-detected, muted by default.
// ════════════════════════════════════════════════════════════════════════
function useSpeech() {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function';

  const cancel = useCallback(() => {
    if (supported) {
      try { window.speechSynthesis.cancel(); } catch { /* no-op */ }
    }
  }, [supported]);

  const speak = useCallback((line: string) => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(line);
      u.rate = 0.95;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch { /* no-op */ }
  }, [supported]);

  useEffect(() => () => cancel(), [cancel]);
  return { supported, speak, cancel };
}

// ── Small presentational helpers ────────────────────────────────────────
function Sparky({ line, tone = 'calm' }: { line: string; tone?: 'calm' | 'good' | 'warn' }) {
  const ring = tone === 'good' ? SAFE : tone === 'warn' ? DANGER : LAB_COLOR;
  return (
    <div className="flex items-start gap-3 rounded-2xl p-3" style={{ background: PANEL_HI }}>
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: '2.5rem', height: '2.5rem', background: INK, border: `2px solid ${ring}` }}
        aria-hidden="true"
      >
        <ShieldCheck size={20} color={ring} />
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: ring }}>Sparky, your safety coach</p>
        <p className="text-sm" style={{ color: TEXT }}>{line}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FAMILY CODE-WORD SETUP CARD (interactive + printable)
// ════════════════════════════════════════════════════════════════════════
function CodeWordSetup({
  codeWord, setCodeWord, onDone, reduced,
}: {
  codeWord: string;
  setCodeWord: (v: string) => void;
  onDone: () => void;
  reduced: boolean;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const trimmed = codeWord.trim();

  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }, []);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <Sparky line="Let's set up a family code word — one secret word only your family knows. If a call ever feels off, you can ask for it. A clone copied from the internet won't know it." />

      <div className="rounded-2xl p-4" style={{ background: PANEL, border: `1px solid ${LAB_COLOR}40` }}>
        <label htmlFor="codeword-input" className="mb-2 block text-sm font-semibold" style={{ color: TEXT }}>
          Choose your family code word
        </label>
        <input
          id="codeword-input"
          type="text"
          value={codeWord}
          onChange={(e) => setCodeWord(e.target.value)}
          placeholder="e.g. Blue Dragon"
          maxLength={24}
          autoComplete="off"
          className="w-full rounded-xl px-3 py-2 text-base outline-none"
          style={{ background: INK, color: TEXT, border: `1px solid ${TEXT_DIM}66` }}
          aria-describedby="codeword-help"
        />
        <p id="codeword-help" className="mt-2 text-xs" style={{ color: TEXT_DIM }}>
          Pick something fun and hard to guess. Don't post it anywhere online.
        </p>
      </div>

      {/* Printable family card */}
      <div
        ref={printRef}
        data-print-card
        className="rounded-2xl p-4"
        style={{ background: PANEL_HI, border: `2px dashed ${LAB_COLOR}` }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: LAB_COLOR }}>
          Our Family Safety Card
        </p>
        <p className="mt-2 text-sm" style={{ color: TEXT_DIM }}>Our secret code word is</p>
        <p className="text-2xl font-bold" style={{ color: TEXT }}>
          {trimmed || '____________'}
        </p>
        <ul className="mt-3 space-y-1 text-sm" style={{ color: TEXT }}>
          <li className="flex items-center gap-2"><KeyRound size={16} color={LAB_COLOR} /> If a call feels off, ask for the code word.</li>
          <li className="flex items-center gap-2"><PhoneCall size={16} color={LAB_COLOR} /> Hang up and call back on the number we know.</li>
          <li className="flex items-center gap-2"><Users size={16} color={LAB_COLOR} /> Tell a trusted adult before sending money or secrets.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: PANEL, color: TEXT, border: `1px solid ${TEXT_DIM}66` }}
        >
          <Printer size={18} aria-hidden="true" /> Print this card
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={trimmed.length === 0}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: LAB_COLOR, color: INK }}
        >
          Start the drills <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SCENARIO VIEW
// ════════════════════════════════════════════════════════════════════════
function ScenarioView({
  scenario, band, index, total, onCommit, reduced,
}: {
  scenario: Scenario;
  band: Band;
  index: number;
  total: number;
  onCommit: (choice: Choice) => void;
  reduced: boolean;
}) {
  const [muted, setMuted] = useState(true);
  const { supported, speak, cancel } = useSpeech();
  const ChannelIcon = CHANNEL_META[scenario.channel].icon;
  const choices = useMemo(
    () => scenario.choiceIds[band].map((id) => CHOICE_LIB[id]),
    [scenario, band],
  );

  // Stop any speech when the scenario changes.
  useEffect(() => { cancel(); }, [scenario.id, cancel]);

  const handlePlay = useCallback(() => {
    if (muted || !supported) return;
    speak(scenario.spoken);
  }, [muted, supported, speak, scenario.spoken]);

  return (
    <motion.div
      key={scenario.id}
      initial={reduced ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: -20 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: TEXT_DIM }}>
          Drill {index + 1} of {total}
        </span>
        {supported && (
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
            style={{ background: PANEL, color: TEXT_DIM, border: `1px solid ${TEXT_DIM}55` }}
            aria-pressed={!muted}
            aria-label={muted ? 'Turn on voice (off by default)' : 'Mute voice'}
          >
            {muted ? <VolumeX size={14} aria-hidden="true" /> : <Volume2 size={14} aria-hidden="true" />}
            {muted ? 'Voice off' : 'Voice on'}
          </button>
        )}
      </div>

      {/* Incoming "call/text" card */}
      <div className="rounded-2xl p-4" style={{ background: PANEL, border: `1px solid ${DANGER}55` }}>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
            style={{ background: INK, color: DANGER, border: `1px solid ${DANGER}66` }}
          >
            <ChannelIcon size={14} aria-hidden="true" /> {CHANNEL_META[scenario.channel].label}
          </span>
          <span className="text-sm font-bold" style={{ color: TEXT }}>{scenario.from}</span>
          <span className="text-xs" style={{ color: TEXT_DIM }}>claims to be {scenario.claim}</span>
        </div>

        <div className="space-y-2">
          {scenario.transcript.map((line, i) => (
            <p
              key={i}
              className="rounded-2xl px-3 py-2 text-sm"
              style={{ background: PANEL_HI, color: TEXT }}
            >
              {line}
            </p>
          ))}
        </div>

        {supported && (
          <button
            type="button"
            onClick={handlePlay}
            disabled={muted}
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ background: INK, color: TEXT, border: `1px solid ${TEXT_DIM}55` }}
            aria-label={muted ? 'Play voice message (turn voice on first)' : 'Play voice message'}
          >
            <Play size={14} aria-hidden="true" /> Play voice message
          </button>
        )}

        <div className="mt-3 flex items-start gap-2 rounded-xl p-2" style={{ background: INK }}>
          <AlertTriangle size={16} color={DANGER} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p className="text-sm font-semibold" style={{ color: TEXT }}>
            Their urgent ask: <span style={{ color: TEXT_DIM }}>{scenario.urgentAsk}</span>
          </p>
        </div>
      </div>

      <p className="text-sm font-semibold" style={{ color: TEXT }}>What is the safe thing to do?</p>

      {/* Choices — the safe answer is NOT highlighted (HONESTY). */}
      <div className="flex flex-col gap-2" role="group" aria-label="Choose your response">
        {choices.map((choice) => {
          const Icon = choice.icon;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => onCommit(choice)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors"
              style={{ background: PANEL_HI, color: TEXT, border: `1px solid ${TEXT_DIM}44` }}
            >
              <Icon size={20} color={TEXT_DIM} aria-hidden="true" className="shrink-0" />
              <span>{choice.label}</span>
              <ChevronRight size={16} color={TEXT_DIM} aria-hidden="true" className="ml-auto shrink-0" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// REVEAL VIEW
// ════════════════════════════════════════════════════════════════════════
function RevealView({
  scenario, choice, band, isLast, onNext, reduced,
}: {
  scenario: Scenario;
  choice: Choice;
  band: Band;
  isLast: boolean;
  onNext: () => void;
  reduced: boolean;
}) {
  const good = choice.safe;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: PANEL, border: `2px solid ${good ? SAFE : DANGER}` }}
      >
        {good
          ? <CheckCircle2 size={28} color={SAFE} aria-hidden="true" />
          : <XCircle size={28} color={DANGER} aria-hidden="true" />}
        <div>
          <p className="text-base font-bold" style={{ color: good ? SAFE : DANGER }}>
            {good ? 'Safe move — you verified.' : 'That is what the scammer hoped you would do.'}
          </p>
          <p className="text-sm" style={{ color: TEXT_DIM }}>You chose: {choice.label}</p>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: PANEL_HI }}>
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: DANGER }}>
          <AlertTriangle size={14} aria-hidden="true" /> What a voice-clone scammer would do
        </p>
        <p className="text-sm" style={{ color: TEXT }}>{scenario.scammerMove}</p>
      </div>

      <div className="rounded-2xl p-4" style={{ background: PANEL_HI }}>
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: SAFE }}>
          <Lightbulb size={14} aria-hidden="true" /> Why verifying defeats the clone
        </p>
        <p className="text-sm" style={{ color: TEXT }}>{scenario.whyProtocolWins}</p>
      </div>

      {band === 'C' && scenario.provenanceNote && (
        <div className="rounded-2xl p-4" style={{ background: INK, border: `1px solid ${LAB_COLOR}55` }}>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: LAB_COLOR }}>
            <FileSearch size={14} aria-hidden="true" /> Provenance nuance
          </p>
          <p className="text-sm" style={{ color: TEXT }}>{scenario.provenanceNote}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center justify-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-bold"
        style={{ background: LAB_COLOR, color: INK }}
      >
        {isLast ? 'See your results' : 'Next drill'} <ArrowRight size={18} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function CodeWordGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;
  const reduced = useReducedMotion() ?? false;

  const [phase, setPhase] = useState<Phase>('welcome');
  const [index, setIndex] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [codeWord, setCodeWord] = useState('');

  const scenario = SCENARIOS[index];
  const completedRef = useRef(false);

  const handleCommit = useCallback((choice: Choice) => {
    setLastChoice(choice);
    if (choice.safe) setSafeCount((c) => c + 1);
    setPhase('reveal');
  }, []);

  const handleNext = useCallback(() => {
    if (index + 1 >= SCENARIOS.length) {
      setPhase('complete');
    } else {
      setIndex((i) => i + 1);
      setLastChoice(null);
      setPhase('scenario');
    }
  }, [index]);

  // Fire reward pipeline exactly once when the complete screen mounts.
  useEffect(() => {
    if (phase !== 'complete' || completedRef.current) return;
    completedRef.current = true;
    const score = safeCount * POINTS_PER_SAFE;
    const stars: 1 | 2 | 3 = score >= 80 ? 3 : score >= 50 ? 2 : 1;
    awardXP(score);
    completeGame('code-word', stars);
  }, [phase, safeCount, awardXP, completeGame]);

  const handleReplay = useCallback(() => {
    completedRef.current = true; // already rewarded; don't re-award on replay
    setIndex(0);
    setSafeCount(0);
    setLastChoice(null);
    setPhase('scenario');
  }, []);

  const score = safeCount * POINTS_PER_SAFE;
  const stars = score >= 80 ? 3 : score >= 50 ? 2 : 1;

  return (
    <GameShell title="Code Word" color={LAB_COLOR} labNum={6}>
      <div
        className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 sm:p-6"
        style={{ background: INK, color: TEXT }}
      >
        <AnimatePresence mode="wait">
          {/* ── WELCOME ─────────────────────────────────────────────── */}
          {phase === 'welcome' && (
            <motion.div
              key="welcome"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-2xl"
                  style={{ width: '3rem', height: '3rem', background: PANEL, border: `2px solid ${LAB_COLOR}` }}
                  aria-hidden="true"
                >
                  <ShieldCheck size={26} color={LAB_COLOR} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: TEXT }}>Code Word</h2>
                  <p className="text-sm" style={{ color: TEXT_DIM }}>Beat the voice-clone scam by verifying</p>
                </div>
              </div>

              <Sparky line={BAND_INTRO[band]} />

              <div className="rounded-2xl p-4" style={{ background: PANEL }}>
                <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT }}>
                  <Sparkles size={16} color={LAB_COLOR} aria-hidden="true" /> The big idea
                </p>
                <p className="mt-1 text-sm" style={{ color: TEXT_DIM }}>
                  AI can copy a voice or a face so well you cannot spot the fake. So you do not try to spot it —
                  you <span style={{ color: TEXT, fontWeight: 600 }}>verify</span> through a channel you trust.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-bold"
                style={{ background: LAB_COLOR, color: INK }}
              >
                Set up our code word <ArrowRight size={18} aria-hidden="true" />
              </button>
            </motion.div>
          )}

          {/* ── SETUP (family code word + print) ────────────────────── */}
          {phase === 'setup' && (
            <div key="setup">
              <CodeWordSetup
                codeWord={codeWord}
                setCodeWord={setCodeWord}
                onDone={() => setPhase('scenario')}
                reduced={reduced}
              />
            </div>
          )}

          {/* ── SCENARIO ────────────────────────────────────────────── */}
          {phase === 'scenario' && (
            <ScenarioView
              key={`scn-${scenario.id}`}
              scenario={scenario}
              band={band}
              index={index}
              total={SCENARIOS.length}
              onCommit={handleCommit}
              reduced={reduced}
            />
          )}

          {/* ── REVEAL ──────────────────────────────────────────────── */}
          {phase === 'reveal' && lastChoice && (
            <RevealView
              key={`rev-${scenario.id}`}
              scenario={scenario}
              choice={lastChoice}
              band={band}
              isLast={index + 1 >= SCENARIOS.length}
              onNext={handleNext}
              reduced={reduced}
            />
          )}

          {/* ── COMPLETE ────────────────────────────────────────────── */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-4"
              aria-live="polite"
            >
              <div className="rounded-2xl p-5 text-center" style={{ background: PANEL, border: `2px solid ${LAB_COLOR}` }}>
                <div className="mb-2 flex justify-center gap-1" aria-hidden="true">
                  {[1, 2, 3].map((s) => (
                    <Sparkles key={s} size={26} color={s <= stars ? LAB_COLOR : `${TEXT_DIM}55`} />
                  ))}
                </div>
                <h2 className="text-xl font-bold" style={{ color: TEXT }}>Verification champion</h2>
                <p className="mt-1 text-sm" style={{ color: TEXT_DIM }}>
                  You made the safe call in {safeCount} of {SCENARIOS.length} drills ({score} / {MAX_SCORE} points).
                </p>
              </div>

              <Sparky
                tone="good"
                line="Remember the drill for real life: a clone can copy a voice or a face, but it cannot survive a call-back to a number you know, and it does not know your family code word. Verify first, act second."
              />

              {/* Reprint the family card as a keepsake. */}
              <div className="rounded-2xl p-4" style={{ background: PANEL_HI, border: `2px dashed ${LAB_COLOR}` }} data-print-card>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: LAB_COLOR }}>Our Family Safety Card</p>
                <p className="mt-1 text-sm" style={{ color: TEXT_DIM }}>Our secret code word is</p>
                <p className="text-2xl font-bold" style={{ color: TEXT }}>{codeWord.trim() || '____________'}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{ background: PANEL, color: TEXT, border: `1px solid ${TEXT_DIM}66` }}
                >
                  <Printer size={18} aria-hidden="true" /> Print our card
                </button>
                <button
                  type="button"
                  onClick={handleReplay}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{ background: LAB_COLOR, color: INK }}
                >
                  <RotateCcw size={18} aria-hidden="true" /> Practice again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
