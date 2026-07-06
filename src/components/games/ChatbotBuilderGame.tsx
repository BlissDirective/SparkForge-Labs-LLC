// ════════════════════════════════════════════════════════════════════════
// CHATBOT BUILDER v6 — Lab 8 — "Wire a bot that actually talks back"
// ════════════════════════════════════════════════════════════════════════
// REDESIGN (G3 / audit §II.4 #27): the old PixiConnectStage wire-game was
// theatre — you connected boxes along one correct path and nothing ever
// depended on a real message. There was no conversation.
//
// Now the wiring is CONSEQUENTIAL. A real kid-typed test message ("wht time
// do u open??") flows through the pipeline the child builds:
//
//     message ──▶ detect intent (keyword NLP) ──▶ YOUR routing ──▶ handler ──▶ reply
//
// The reply shown in the phone mockup is a REAL deterministic function of the
// child's wiring + the message (see runMessage / runAll below — a tiny rules
// engine, nothing faked). Route a "hours" question to the "weather" desk and
// the bot genuinely answers about the weather; Sparky reads the crossed wire
// aloud. Mis-wires visibly break specific messages.
//
// 5 grounded levels: one intent → multi-intent → context/memory → tone →
// intent-tree-vs-LLM (band C). The final level contrasts a brittle keyword
// tree with a 2026 LLM + system prompt that generalizes to phrasings the tree
// has never seen.
//
// G1 honesty: no answer is telegraphed. The reply is computed only after the
// child commits their wiring and presses Send.

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, RotateCcw, Sparkles, Send,
  Cpu, Brain, ArrowRight, Rocket, MessageSquare,
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
const BODY = '#5A6078';
const MUTED = '#8C94AC';
const GOODC = '#2ECC71';
const BADC = '#EF4444';

type Band = 'A' | 'B' | 'C';

// ════════════════════════════════════════════════════════════════════════
// THE RULES ENGINE — a real chatbot pipeline (message → intent → reply)
// ════════════════════════════════════════════════════════════════════════
// This is the whole point of the redesign: replies are computed here, from
// the child's wiring. Nothing is pre-baked per message.

type IntentId = 'hours' | 'location' | 'menu' | 'weather' | 'greeting' | 'unknown';
type HandlerId = 'hoursH' | 'locationH' | 'menuH' | 'weatherH' | 'greetingH';
type ToneId = 'friendly' | 'robotic' | 'pirate';
type EngineId = 'tree' | 'llm';

interface IntentRule { id: Exclude<IntentId, 'unknown'>; label: string; keywords: string[]; }

// Keyword classifier — the brittle "intent tree" NLP. Order matters: the
// first rule whose keyword appears wins.
const INTENT_RULES: IntentRule[] = [
  { id: 'hours', label: 'Hours', keywords: ['time', 'open', 'close', 'hour', 'when do'] },
  { id: 'location', label: 'Location', keywords: ['where', 'address', 'located', 'directions', 'find you'] },
  { id: 'menu', label: 'Menu', keywords: ['menu', 'eat', 'food', 'drink', 'coffee', 'snack', 'veggie', 'vegan', 'hungry'] },
  { id: 'weather', label: 'Weather', keywords: ['weather', 'rain', 'sunny', 'cold', 'temperature', 'forecast'] },
  { id: 'greeting', label: 'Greeting', keywords: ['hello', 'hey', 'howdy'] },
];

interface Handler { id: HandlerId; label: string; topic: Exclude<IntentId, 'unknown'>; reply: (ctx: { followUp?: boolean }) => string; }

const HANDLERS: Record<HandlerId, Handler> = {
  hoursH: {
    id: 'hoursH', label: 'Hours Desk', topic: 'hours',
    reply: (c) => (c.followUp ? "On weekends we're open 9am–4pm! 🗓️" : "We're open 8am–6pm on weekdays! ⏰"),
  },
  locationH: {
    id: 'locationH', label: 'Map Desk', topic: 'location',
    reply: () => "You'll find us at 12 Maple Street, right by the park! 📍",
  },
  menuH: {
    id: 'menuH', label: 'Menu Desk', topic: 'menu',
    reply: () => "We serve hot cocoa, warm muffins, and veggie wraps! 🥪",
  },
  weatherH: {
    id: 'weatherH', label: 'Weather Bot', topic: 'weather',
    reply: () => "It's sunny and 72°F outside right now! ☀️",
  },
  greetingH: {
    id: 'greetingH', label: 'Welcome Desk', topic: 'greeting',
    reply: () => "Hey there! Welcome to Sparky's Café ☕ How can I help?",
  },
};

// The "LLM" — simulated. A real LLM has read a huge amount of language, so it
// recognizes NEW ways of asking that the exact-keyword tree misses. We model
// that generalization with a paraphrase table (honest: this is a simulation of
// how the real thing behaves, not an API call).
const LLM_PARAPHRASES: { intent: Exclude<IntentId, 'unknown'>; phrases: string[] }[] = [
  { intent: 'hours', phrases: ['swing by', 'come by', 'stop by', 'pop in', 'still open', 'head over', 'around'] },
  { intent: 'location', phrases: ['get to', 'get there', 'reach you', 'how do i find', 'way to your'] },
  { intent: 'menu', phrases: ['a bite', 'grab a bite', 'anything to eat', 'something to drink', 'what do you serve'] },
];

function labelOf(intent: IntentId): string {
  if (intent === 'unknown') return 'something else';
  return INTENT_RULES.find((r) => r.id === intent)?.label ?? intent;
}

// Keyword tree classifier.
function detectIntent(message: string): IntentId {
  const m = ` ${message.toLowerCase()} `;
  for (const r of INTENT_RULES) if (r.keywords.some((k) => m.includes(k))) return r.id;
  return 'unknown';
}

// LLM classifier: tries the tree first, then generalizes via paraphrases.
function llmResolve(message: string): IntentId {
  const kw = detectIntent(message);
  if (kw !== 'unknown') return kw;
  const m = message.toLowerCase();
  for (const g of LLM_PARAPHRASES) if (g.phrases.some((p) => m.includes(p))) return g.intent;
  return 'unknown';
}

function applyTone(text: string, tone: ToneId): string {
  switch (tone) {
    case 'robotic':
      // strip emoji/personality, clip to a cold machine voice
      return `QUERY RESOLVED. ${text.replace(/[^\x20-\x7E]/g, '').replace(/[!?.]+/g, '.').replace(/\s+/g, ' ').trim().toUpperCase()}`;
    case 'pirate':
      return `Arr! ${text.replace(/[.!]+$/, '').replace(/[^\x20-\x7E]/g, '').trim()}, matey! 🏴‍☠️`;
    case 'friendly':
    default:
      return text;
  }
}

interface RunConfig {
  routing: Partial<Record<IntentId, HandlerId>>;
  tone: ToneId;
  memory: boolean;
  engine: EngineId;
  sysPrompt: '' | 'good' | 'bad';
}

interface MsgResult {
  message: string;
  intent: IntentId;
  handler: HandlerId | null;
  reply: string;
  correct: boolean;
  note?: string; // Sparky's read-aloud when something is wrong
}

// Resolve ONE message against the child's wiring. Deterministic.
function runMessage(message: string, cfg: RunConfig, prev: IntentId | null): MsgResult {
  // A "bad" system prompt tells the LLM to only match exact keywords → it
  // collapses back to brittle tree behaviour. That's the honest lesson.
  const effLlm = cfg.engine === 'llm' && cfg.sysPrompt === 'good';
  let intent = effLlm ? llmResolve(message) : detectIntent(message);
  let followUp = false;

  // Context memory: an unrecognized follow-up ("And on weekends?") borrows the
  // last resolved topic — but only if memory is wired on.
  if (intent === 'unknown' && cfg.memory && prev && prev !== 'unknown') {
    intent = prev;
    followUp = true;
  }

  if (intent === 'unknown') {
    return {
      message, intent, handler: null,
      reply: "Hmm, I'm not sure what you mean. 🤔",
      correct: false,
      note: 'The bot didn’t recognize how that was worded.',
    };
  }

  const handlerId = cfg.routing[intent] ?? null;
  if (!handlerId) {
    return {
      message, intent, handler: null,
      reply: '…',
      correct: false,
      note: `Nothing is wired for the ${labelOf(intent)} intent yet.`,
    };
  }

  const handler = HANDLERS[handlerId];
  const reply = applyTone(handler.reply({ followUp }), cfg.tone);
  const correct = handler.topic === intent;
  const note = correct
    ? undefined
    : `That message was about ${labelOf(intent)}, but you routed it to the ${labelOf(handler.topic)} desk — so the bot answered about ${labelOf(handler.topic)}!`;

  return { message, intent, handler: handlerId, reply, correct, note };
}

// Run ALL test messages, threading conversation memory across them.
function runAll(messages: string[], cfg: RunConfig): MsgResult[] {
  const out: MsgResult[] = [];
  let last: IntentId | null = null;
  for (const message of messages) {
    const r = runMessage(message, cfg, last);
    if (r.intent !== 'unknown') last = r.intent;
    out.push(r);
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL SPECS — every level is grounded in visible messages + visible replies
// ════════════════════════════════════════════════════════════════════════
type LevelMode = 'route' | 'memory' | 'tone' | 'llm';

interface LevelSpec {
  id: number;
  mode: LevelMode;
  intents: Exclude<IntentId, 'unknown'>[]; // intents the child wires
  choices: HandlerId[]; // handler options offered per intent
  messages: string[];
  brief?: string;
  toneTarget?: ToneId;
}

const SPECS: Record<number, LevelSpec> = {
  1: {
    id: 1, mode: 'route',
    intents: ['hours'],
    choices: ['hoursH', 'weatherH'],
    messages: ['wht time do u open??', 'when do you close today?'],
  },
  2: {
    id: 2, mode: 'route',
    intents: ['hours', 'location', 'menu'],
    choices: ['hoursH', 'locationH', 'menuH', 'weatherH'],
    messages: ['What time do you open?', 'Where are you located?', 'What can I eat there?'],
  },
  3: {
    id: 3, mode: 'memory',
    intents: ['hours', 'menu'],
    choices: ['hoursH', 'menuH', 'weatherH'],
    messages: ['What time do you open?', 'And on weekends?', 'Got any veggie snacks?'],
  },
  4: {
    id: 4, mode: 'tone',
    intents: ['hours', 'menu'],
    choices: ['hoursH', 'menuH'],
    messages: ['What time do you open?', 'What snacks do you have?'],
    brief: 'The café wants a warm, FRIENDLY voice — not a cold robot.',
    toneTarget: 'friendly',
  },
  5: {
    id: 5, mode: 'llm',
    intents: ['hours', 'location', 'menu'],
    choices: ['hoursH', 'locationH', 'menuH'],
    messages: [
      'Can I swing by at 5?',
      'How do I get to ya?',
      'Fancy a bite there?',
      'What time do you open?',
      'Got veggie snacks?',
    ],
  },
};

const META: Record<number, { name: string; emoji: string; description: string; difficulty: LevelConfig['difficulty']; xpReward: number; concept: string }> = {
  1: { name: 'First Words', emoji: '👋', description: 'Wire one question to the desk that answers it.', difficulty: 'easy', xpReward: 50, concept: 'A chatbot reads a message, figures out the intent (what you want), and routes it to a handler that replies. Wire it wrong and it answers the wrong thing.' },
  2: { name: 'Multi-Intent', emoji: '🎯', description: 'Three questions, three desks — route each one.', difficulty: 'easy', xpReward: 70, concept: 'Real bots handle many intents. The classifier detects each one; YOU decide which desk answers it. One crossed wire breaks one message.' },
  3: { name: 'Context Memory', emoji: '🧠', description: 'Make the bot remember what you were talking about.', difficulty: 'medium', xpReward: 90, concept: 'Follow-ups like "and on weekends?" have no keywords. Memory lets the bot reuse the last topic — without it, the bot is lost.' },
  4: { name: 'Give It a Voice', emoji: '🎭', description: 'Same facts, different personality. Match the brief.', difficulty: 'medium', xpReward: 100, concept: 'A tone stage rewrites the reply’s voice before it’s sent. The facts stay the same; friendly, robotic, and pirate sound wildly different.' },
  5: { name: 'Tree vs LLM', emoji: '🤖', description: 'Why 2026 bots use an LLM, not a keyword tree.', difficulty: 'hard', xpReward: 140, concept: 'A keyword tree only works on exact words it was told about. An LLM read tons of language, so it understands new phrasings — give it a good system prompt and it just works.' },
};

// Band gating: A gets the obvious ones; C gets the LLM contrast.
const BAND_LEVELS: Record<Band, number[]> = {
  A: [1, 2, 4],
  B: [1, 2, 3, 4],
  C: [1, 2, 3, 4, 5],
};

function buildLevels(band: Band): LevelConfig[] {
  return BAND_LEVELS[band].map((id) => {
    const m = META[id];
    return {
      id,
      name: m.name,
      description: m.description,
      emoji: m.emoji,
      difficulty: m.difficulty,
      starThresholds: [1, 2, 3], // stars computed directly by the renderer
      xpReward: m.xpReward,
    };
  });
}

function initRouting(spec: LevelSpec): Partial<Record<IntentId, HandlerId>> {
  // The LLM level is about the engine, not the wiring — so it ships pre-wired
  // correctly and the only variable is whether the engine understands.
  if (spec.mode === 'llm') {
    const r: Partial<Record<IntentId, HandlerId>> = {};
    for (const i of spec.intents) {
      const h = spec.choices.find((c) => HANDLERS[c].topic === i);
      if (h) r[i] = h;
    }
    return r;
  }
  return {};
}

// ════════════════════════════════════════════════════════════════════════
// PHONE MOCKUP — the conversation the child's wiring actually produces
// ════════════════════════════════════════════════════════════════════════
function PhoneChat({
  results, revealed, running, reduced,
}: {
  results: MsgResult[]; revealed: number; running: boolean; reduced: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [revealed, running]);

  const shown = results.slice(0, revealed);

  return (
    <div
      className="mx-auto w-full max-w-xs rounded-3xl p-2.5"
      style={{ background: '#12172A', border: '5px solid #232a44', boxShadow: '0 14px 40px rgba(10,12,30,0.45)' }}
    >
      {/* notch */}
      <div className="mx-auto mb-2 rounded-full" style={{ width: '38%', height: 6, background: '#2c3552' }} aria-hidden="true" />
      {/* header */}
      <div className="flex items-center gap-2 px-2 pb-2" style={{ borderBottom: '1px solid #262e48' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${LAB_COLOR}30` }} aria-hidden="true">☕</div>
        <div className="leading-tight">
          <p className="text-xs font-bold" style={{ color: '#F2F5FF' }}>Sparky&apos;s Café Bot</p>
          <p className="text-xs" style={{ color: GOODC }}>● online</p>
        </div>
      </div>

      {/* transcript */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Chatbot conversation"
        className="space-y-2 p-2 overflow-y-auto"
        style={{ minHeight: 208, maxHeight: 300, background: '#0C1020', borderRadius: 14 }}
      >
        {shown.length === 0 && (
          <p className="text-xs text-center py-10" style={{ color: '#8891B4' }}>
            Wire your bot, then press <strong style={{ color: '#C7CEEA' }}>Send</strong> to test it with real messages.
          </p>
        )}

        {shown.map((r, i) => (
          <motion.div
            key={i}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            {/* user message bubble (right) */}
            <div className="flex justify-end">
              <div
                className="rounded-2xl px-3 py-1.5 text-xs"
                style={{ maxWidth: '80%', background: LAB_COLOR, color: '#0B0E1A', borderBottomRightRadius: 4, fontWeight: 500 }}
              >
                {r.message}
              </div>
            </div>
            {/* detected intent tag */}
            <div className="flex justify-start">
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#1B2138', color: '#98A2C8' }}>
                🔍 detected: {labelOf(r.intent)}
              </span>
            </div>
            {/* bot reply bubble (left) */}
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-3 py-1.5 text-xs"
                style={{
                  maxWidth: '85%',
                  background: '#232B44',
                  color: '#EAF0FF',
                  borderBottomLeftRadius: 4,
                  border: `1.5px solid ${r.correct ? `${GOODC}88` : `${BADC}88`}`,
                }}
              >
                {r.reply}
              </div>
            </div>
            {/* Sparky reads the crossed wire aloud */}
            {r.note && (
              <div className="flex items-start gap-1.5 px-1">
                <span aria-hidden="true">🐿️</span>
                <p className="text-xs" style={{ color: r.correct ? '#9AA4C8' : '#F2A0A0' }}>
                  <strong style={{ color: r.correct ? '#B7BEDC' : BADC }}>Sparky:</strong> {r.note}
                </p>
              </div>
            )}
          </motion.div>
        ))}

        {running && revealed < results.length && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3 py-2" style={{ background: '#232B44' }} aria-label="Bot is typing">
              <motion.span
                className="inline-block"
                style={{ color: '#8891B4' }}
                animate={reduced ? undefined : { opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                • • •
              </motion.span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const reduced = !!useReducedMotion();
  const spec = useMemo(() => SPECS[level.id], [level.id]);
  const meta = META[level.id];

  const [phase, setPhase] = useState<'welcome' | 'build'>('welcome');
  const [routing, setRouting] = useState<Partial<Record<IntentId, HandlerId>>>(() => initRouting(spec));
  const [tone, setTone] = useState<ToneId | ''>('');
  const [memory, setMemory] = useState(false);
  const [engine, setEngine] = useState<EngineId>('tree');
  const [sysPrompt, setSysPrompt] = useState<'' | 'good' | 'bad'>('');

  const [results, setResults] = useState<MsgResult[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shippedRef = useRef(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  // Reset everything when the active level changes (GameLevelSystem reuses
  // this component instance across levels).
  useEffect(() => {
    clearTimers();
    shippedRef.current = false;
    setPhase('welcome');
    setRouting(initRouting(spec));
    setTone('');
    setMemory(false);
    setEngine('tree');
    setSysPrompt('');
    setResults([]);
    setRevealed(0);
    setRunning(false);
    setRan(false);
  }, [level.id, spec, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const cfg: RunConfig = useMemo(() => ({
    routing,
    tone: (spec.mode === 'tone' ? (tone || 'friendly') : 'friendly') as ToneId,
    memory,
    engine: spec.mode === 'llm' ? engine : 'tree',
    sysPrompt: spec.mode === 'llm' ? sysPrompt : '',
  }), [routing, tone, memory, engine, sysPrompt, spec.mode]);

  const ready = useMemo(() => {
    if (spec.mode === 'llm') return engine === 'tree' || sysPrompt !== '';
    const routed = spec.intents.every((i) => routing[i]);
    if (spec.mode === 'tone') return routed && tone !== '';
    return routed;
  }, [spec, routing, tone, engine, sysPrompt]);

  const correctCount = useMemo(
    () => results.slice(0, revealed).filter((r) => r.correct).length,
    [results, revealed],
  );

  const computeStars = useCallback((res: MsgResult[]): 0 | 1 | 2 | 3 => {
    const total = res.length || 1;
    const frac = res.filter((r) => r.correct).length / total;
    let stars: 0 | 1 | 2 | 3 = frac >= 0.99 ? 3 : frac >= 0.6 ? 2 : frac >= 0.3 ? 1 : 0;
    // Tone level: perfect facts but the wrong voice can't earn full marks.
    if (spec.mode === 'tone' && stars === 3 && cfg.tone !== spec.toneTarget) stars = 2;
    return stars;
  }, [spec, cfg.tone]);

  const runBot = useCallback(() => {
    clearTimers();
    const res = runAll(spec.messages, cfg);
    setResults(res);
    setRan(true);
    setRunning(true);
    setRevealed(0);

    const finish = (final: MsgResult[]) => {
      setRunning(false);
      const good = final.filter((r) => r.correct).length;
      if (good === final.length) juice.onCorrect(good, good * 10);
      else juice.onWrong(0, good * 10);
    };

    if (reduced) {
      setRevealed(res.length);
      finish(res);
      return;
    }
    let i = 0;
    const step = () => {
      i += 1;
      setRevealed(i);
      if (i < res.length) {
        timers.current.push(setTimeout(step, 850));
      } else {
        finish(res);
      }
    };
    timers.current.push(setTimeout(step, 350));
  }, [spec.messages, cfg, reduced, juice, clearTimers]);

  const shipBot = useCallback(() => {
    if (shippedRef.current) return;
    shippedRef.current = true;
    const stars = computeStars(results);
    onComplete({
      score: results.filter((r) => r.correct).length,
      maxScore: results.length,
      stars,
      xpEarned: Math.round(level.xpReward * (stars / 3)),
      timeMs: 0,
    });
  }, [results, computeStars, onComplete, level.xpReward]);

  const resetBuild = useCallback(() => {
    clearTimers();
    setRouting(initRouting(spec));
    setTone('');
    setMemory(false);
    setEngine('tree');
    setSysPrompt('');
    setResults([]);
    setRevealed(0);
    setRunning(false);
    setRan(false);
  }, [spec, clearTimers]);

  const doneRevealing = ran && !running && revealed >= results.length && results.length > 0;

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={meta.emoji} color={LAB_COLOR}>Level {level.id}: {meta.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: BODY }}>{meta.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}12`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {meta.concept}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3512', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Goal:</strong> Build the pipeline, then press <strong>Send</strong>. The bot will reply to real
              test messages — get the wiring right and every answer lands.
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold mb-1.5" style={{ color: INK }}>Test messages coming in:</p>
            <div className="flex flex-wrap gap-1.5">
              {spec.messages.map((m, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: '#EEF0FA', color: BODY }}>
                  <MessageSquare className="w-3 h-3 inline mr-1" style={{ color: LAB_COLOR }} />
                  {m}
                </span>
              ))}
            </div>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('build')}>
          Build the Bot <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ BUILD ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji={meta.emoji} color={LAB_COLOR}>Build the Bot</GlowingTitle>
        {ran && (
          <span className="text-sm font-bold" style={{ color: correctCount === results.length ? GOODC : LAB_COLOR }}>
            {correctCount} / {results.length} right
          </span>
        )}
      </div>

      {/* pipeline diagram */}
      <div className="flex items-center justify-center gap-1.5 text-xs flex-wrap" aria-hidden="true">
        {['Message', 'Detect intent', spec.mode === 'tone' ? 'Route + Tone' : 'Your routing', 'Reply'].map((s, i, arr) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="px-2 py-1 rounded-lg font-semibold" style={{ background: `${LAB_COLOR}15`, color: LAB_COLOR }}>{s}</span>
            {i < arr.length - 1 && <ArrowRight className="w-3 h-3" style={{ color: MUTED }} />}
          </span>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ── LEFT: the wiring controls ── */}
        <SFCard variant="elevated" className="p-4 space-y-3">
          {spec.brief && (
            <div className="rounded-xl p-2.5 text-xs" style={{ background: '#FFD93D18', color: '#8A6D00' }}>
              <strong>Brief:</strong> {spec.brief}
            </div>
          )}

          {/* Intent → handler routing (route / memory / tone modes) */}
          {spec.mode !== 'llm' && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>Route each intent</p>
              {spec.intents.map((intent) => (
                <label key={intent} className="block">
                  <span className="text-xs font-semibold" style={{ color: INK }}>
                    “{labelOf(intent)}” questions →
                  </span>
                  <select
                    aria-label={`Route ${labelOf(intent)} questions to a handler`}
                    className="mt-1 w-full rounded-lg px-2.5 py-2 text-sm"
                    style={{ background: '#F4F6FC', color: INK, border: `1.5px solid ${routing[intent] ? `${LAB_COLOR}80` : '#D9DEEC'}` }}
                    value={routing[intent] ?? ''}
                    onChange={(e) => setRouting((r) => ({ ...r, [intent]: e.target.value as HandlerId }))}
                  >
                    <option value="">— pick a handler —</option>
                    {spec.choices.map((h) => (
                      <option key={h} value={h}>{HANDLERS[h].label}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          {/* Memory toggle */}
          {spec.mode === 'memory' && (
            <button
              type="button"
              onClick={() => setMemory((v) => !v)}
              aria-pressed={memory}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
              style={{
                background: memory ? `${GOODC}18` : '#F4F6FC',
                color: memory ? '#1B7A44' : BODY,
                border: `1.5px solid ${memory ? `${GOODC}66` : '#D9DEEC'}`,
              }}
            >
              <span className="flex items-center gap-2"><Brain className="w-4 h-4" /> Remember the last topic</span>
              <span>{memory ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Tone select */}
          {spec.mode === 'tone' && (
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>Personality / tone</span>
              <select
                aria-label="Choose the bot's tone"
                className="mt-1 w-full rounded-lg px-2.5 py-2 text-sm"
                style={{ background: '#F4F6FC', color: INK, border: `1.5px solid ${tone ? `${LAB_COLOR}80` : '#D9DEEC'}` }}
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneId)}
              >
                <option value="">— pick a voice —</option>
                <option value="friendly">😊 Friendly</option>
                <option value="robotic">🤖 Robotic</option>
                <option value="pirate">🏴‍☠️ Pirate</option>
              </select>
            </label>
          )}

          {/* LLM engine picker */}
          {spec.mode === 'llm' && (
            <div className="space-y-3">
              <div className="rounded-xl p-2.5 text-xs" style={{ background: `${LAB_COLOR}12`, color: BODY }}>
                Routing is already wired correctly. The real question: can the engine
                <strong style={{ color: INK }}> understand new phrasings?</strong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['tree', 'llm'] as EngineId[]).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEngine(e)}
                    aria-pressed={engine === e}
                    className="rounded-xl px-2 py-2.5 text-xs font-bold flex flex-col items-center gap-1 transition-colors"
                    style={{
                      background: engine === e ? `${LAB_COLOR}1F` : '#F4F6FC',
                      color: engine === e ? LAB_COLOR : BODY,
                      border: `1.5px solid ${engine === e ? `${LAB_COLOR}80` : '#D9DEEC'}`,
                    }}
                  >
                    {e === 'tree' ? <Cpu className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    {e === 'tree' ? 'Keyword Tree' : 'LLM'}
                  </button>
                ))}
              </div>
              {engine === 'llm' && (
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>System prompt</span>
                  <select
                    aria-label="Choose the LLM system prompt"
                    className="mt-1 w-full rounded-lg px-2.5 py-2 text-sm"
                    style={{ background: '#F4F6FC', color: INK, border: `1.5px solid ${sysPrompt ? `${LAB_COLOR}80` : '#D9DEEC'}` }}
                    value={sysPrompt}
                    onChange={(e) => setSysPrompt(e.target.value as '' | 'good' | 'bad')}
                  >
                    <option value="">— write the bot&apos;s instructions —</option>
                    <option value="good">Use café facts to answer ANY question, even worded in a new way.</option>
                    <option value="bad">Only answer if the exact keyword (like &quot;hours&quot;) is present.</option>
                  </select>
                </label>
              )}
            </div>
          )}
        </SFCard>

        {/* ── RIGHT: the phone ── */}
        <div>
          <PhoneChat results={results} revealed={revealed} running={running} reduced={reduced} />
        </div>
      </div>

      {/* result summary after a run */}
      <AnimatePresence>
        {doneRevealing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="rounded-2xl p-3 text-sm flex items-start gap-2"
            style={{
              background: correctCount === results.length ? `${GOODC}15` : `${BADC}12`,
              border: `1px solid ${correctCount === results.length ? `${GOODC}40` : `${BADC}40`}`,
              color: correctCount === results.length ? '#1B7A44' : '#B23838',
            }}
          >
            <span aria-hidden="true">🐿️</span>
            <span>
              {correctCount === results.length
                ? spec.mode === 'llm'
                  ? 'The LLM understood every message — even the ones the keyword tree had never seen. That’s why 2026 bots use LLMs!'
                  : 'Every message got the right answer. Ship it!'
                : spec.mode === 'tone' && cfg.tone !== spec.toneTarget
                  ? 'The facts are right, but that voice doesn’t match the brief. Try the friendly tone.'
                  : spec.mode === 'llm'
                    ? `The keyword tree only handled ${correctCount} of ${results.length}. Switch to the LLM with a good system prompt.`
                    : `${results.length - correctCount} message(s) got a crossed wire. Fix the routing and Send again.`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* actions */}
      <div className="flex gap-2">
        <SFButton
          variant="primary"
          className="flex-1"
          onClick={runBot}
          disabled={!ready || running}
          aria-label="Send test messages through your bot"
        >
          <Send className="w-4 h-4 mr-2" />
          {ran ? 'Send Again' : 'Send'}
        </SFButton>
        {doneRevealing && (
          <SFButton variant="secondary" className="flex-1" onClick={shipBot} aria-label="Ship this bot and score the level">
            <Rocket className="w-4 h-4 mr-2" /> Ship Bot
          </SFButton>
        )}
        <SFButton variant="outline" onClick={resetBuild} aria-label="Reset the wiring">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">✕</SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function ChatbotBuilderGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;
  const levels = useMemo(() => buildLevels(band), [band]);

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = levels.length * 3;
    awardXP(Math.round(totalXP));
    const stars = totalStars >= maxStars * 0.85 ? 3 : totalStars >= maxStars * 0.55 ? 2 : 1;
    completeGame('chatbot-builder', stars);
  }, [awardXP, completeGame, levels.length]);

  return (
    <GameShell title="Chatbot Builder" color="#8F96FA" labNum={8}>
      <GameLevelSystem
        gameTitle="Chatbot Builder"
        gameEmoji="💬"
        labColor={LAB_COLOR}
        levels={levels}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
