// ════════════════════════════════════════════════════════════════════════
// CAREER EXPLORER v5 — Lab 9 — "A Day in the AI Lab" (dispatch archetype)
// ════════════════════════════════════════════════════════════════════════
// Was a CONNECT clone that wired invented skill↔title pairs (Statistics→Data
// Scientist, SQL→Data Analyst) — arbitrary one-to-one mappings that taught
// kids fabricated flashcards, not what these people actually DO.
//
// Now: real problem TICKETS land in the lab ("our model calls everyone a
// cat!", "the chatbot leaks private info", "our agent loops forever and burns
// the budget"). The child DISPATCHES the specialist who should own it. After
// dispatching, Sparky narrates a short vignette of that specialist FIXING it —
// so careers are learned by function, not memorization. Real problems have
// more than one defensible owner, so we accept the best-fit AND sensible
// alternates, and every vignette names who else could lend a hand (kills the
// "one arbitrary right answer" problem). 2026 roster adds Lab-11's Harness
// Engineer (constrain the agent) and MCP Integrator (equip the agent).

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronRight, Sparkles, RotateCcw, Trophy, Send, Ticket, Users, Star,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { useActiveChild } from '@/hooks/useChildren';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { GlowingTitle, FeedbackPopup } from '@/components/games/shared/GameVisualKit';

const LAB_COLOR = '#E68E28';
const INK = '#1A1D2B';
const MUTED = '#5A6078';
const FAINT = '#8C94AC';

type Band = 'A' | 'B' | 'C';

// ════════════════════════════════════════════════════════════════════════
// ROSTER — the 2026 AI-lab specialists. Each has a friendly name for the
// youngest band, a real job title for older kids, and a one-line "what they
// actually do" so the role is taught by function.
// ════════════════════════════════════════════════════════════════════════
interface Specialist {
  id: string;
  name: string;   // real title (bands B/C)
  nameA: string;  // friendly name (band A)
  emoji: string;
  does: string;   // one-line: what they actually do
  lab11?: boolean;
}

const ROSTER: Record<string, Specialist> = {
  ml: {
    id: 'ml', name: 'ML Engineer', nameA: 'Model Builder', emoji: '🧠',
    does: 'Builds, trains, and fixes the AI models so they make good predictions.',
  },
  data: {
    id: 'data', name: 'Data Scientist', nameA: 'Data Detective', emoji: '🔢',
    does: 'Digs through the data to find patterns and figure out what is really going on.',
  },
  ethics: {
    id: 'ethics', name: 'AI Ethics Specialist', nameA: 'Fairness Checker', emoji: '⚖️',
    does: 'Makes sure the AI is fair and treats every kind of person right.',
  },
  privacy: {
    id: 'privacy', name: 'Privacy & Security Engineer', nameA: 'Secret Keeper', emoji: '🔒',
    does: 'Keeps people’s private info safe and stops the AI from leaking it.',
  },
  harness: {
    id: 'harness', name: 'Harness Engineer', nameA: 'Agent Wrangler', emoji: '🕸️', lab11: true,
    does: 'Builds the guardrails around an AI agent so it stays on task and doesn’t waste time or money.',
  },
  mcp: {
    id: 'mcp', name: 'MCP Integrator', nameA: 'Tool Connector', emoji: '🔌', lab11: true,
    does: 'Hooks the AI up to outside tools and data (with MCP) so it can actually get real work done.',
  },
  vision: {
    id: 'vision', name: 'Computer Vision Engineer', nameA: 'Robot-Eyes Expert', emoji: '👁️',
    does: 'Teaches the AI to see and understand pictures and video.',
  },
  pm: {
    id: 'pm', name: 'AI Product Manager', nameA: 'Team Captain', emoji: '📋',
    does: 'Decides what to build next and makes sure it truly helps real people.',
  },
};

const nameFor = (id: string, band: Band) => (band === 'A' ? ROSTER[id].nameA : ROSTER[id].name);

// ════════════════════════════════════════════════════════════════════════
// TICKETS — 5 genuinely distinct problems. Each names a best-fit owner plus
// defensible ALTERNATES (partial credit) and clear DISTRACTORS (wrong).
// The vignette narrates the canonical fix; `alsoNote` acknowledges co-owners.
// ════════════════════════════════════════════════════════════════════════
interface RoundDef {
  id: number;
  seed: number;
  from: string;        // who filed the ticket (flavor)
  ticketA: string;     // band A wording (obvious)
  ticketC: string;     // bands B/C wording (nuanced)
  best: string;
  alternates: string[];
  distractors: string[];
  vignette: string[];  // Sparky-narrated fix, 2-3 lines
  alsoNote: string;    // multi-owner acknowledgment (bands B/C)
}

const ROUNDS: RoundDef[] = [
  {
    id: 1, seed: 17, from: 'Photo Sorter team',
    ticketA: 'Our picture robot thinks EVERYTHING is a cat! 🐱 Buses, bananas… all "cat."',
    ticketC: 'Our image model labels almost every photo "cat" — even buses and bananas. Who should we send?',
    best: 'ml', alternates: ['data'], distractors: ['vision', 'pm', 'mcp'],
    vignette: [
      'The Model Builder opens up the model and sees it never really learned the other labels.',
      'They retrain it on a balanced set of pictures and re-test — now buses read as "bus" and bananas as "banana." Fixed!',
    ],
    alsoNote: 'A Data Detective could jump in too — if the training photos were mostly cats, the data itself may be the real culprit.',
  },
  {
    id: 2, seed: 42, from: 'Chatbot testers',
    ticketA: 'Uh oh — our chatbot is telling secrets it should keep! 🙊 It said a kid’s address out loud.',
    ticketC: 'Testers found the chatbot repeating users’ home addresses and phone numbers back to strangers. Who owns this?',
    best: 'privacy', alternates: ['ethics'], distractors: ['ml', 'data', 'harness'],
    vignette: [
      'The Secret Keeper traces where private info sneaks into replies.',
      'They add filters that redact addresses and phone numbers, and lock down what the bot is allowed to repeat. Leak sealed.',
    ],
    alsoNote: 'An AI Ethics Specialist would care about this too — leaking private data is a fairness-and-harm problem, not just a security bug.',
  },
  {
    id: 3, seed: 88, from: 'Agent Ops',
    ticketA: 'Our helper robot keeps going in circles and won’t stop! 🔁 It ran all night.',
    ticketC: 'Our new AI agent got stuck in a loop overnight and ran up a huge bill. Who do we dispatch?',
    best: 'harness', alternates: ['ml'], distractors: ['pm', 'mcp', 'data'],
    vignette: [
      'The Agent Wrangler wraps the agent in a harness: a step limit, a spending cap, and a clear "stop when done" rule.',
      'Now if it loops, it halts itself long before the budget burns. This is Lab 11’s "constrain the agent" idea in action.',
    ],
    alsoNote: 'A Model Builder could help too — a smarter model might loop less — but the guardrails are what stop the runaway bill today.',
  },
  {
    id: 4, seed: 123, from: 'Community team',
    ticketA: 'Players say the game’s AI isn’t being fair to everyone! ⚖️',
    ticketC: 'Users say our loan-helper AI feels biased — it says "no" to some neighborhoods far more often. Who leads this?',
    best: 'ethics', alternates: ['data'], distractors: ['pm', 'privacy', 'vision'],
    vignette: [
      'The Fairness Checker measures the gap across groups and confirms it is real, not random.',
      'They trace it to lopsided training data, rebalance it, and set up fairness tests that run before every release.',
    ],
    alsoNote: 'A Data Detective is a strong co-owner here — the bias hides in the data, and untangling it is detective work.',
  },
  {
    id: 5, seed: 200, from: 'Assistant team',
    ticketA: 'Our robot has lots of great ideas but no "hands" to actually do them! 🤖',
    ticketC: 'Our assistant gives great advice but can’t reach the calendar, files, or email to actually do anything. Who fixes this?',
    best: 'mcp', alternates: ['harness'], distractors: ['ml', 'pm', 'data'],
    vignette: [
      'The Tool Connector plugs the assistant into real tools using MCP — calendar, files, and email.',
      'Now it can book the meeting, open the doc, and send the note by itself. This is Lab 11’s "equip the agent" idea.',
    ],
    alsoNote: 'An Agent Wrangler pairs up nicely — once the AI has hands, it needs guardrails so it uses those tools safely.',
  },
];

const BEST_POINTS = 20;
const ALT_POINTS = 12;
const MAX_SCORE = ROUNDS.length * BEST_POINTS;

// Deterministic shuffle so option order is stable across re-renders but not
// always "best answer first" (keeps the G1-honesty: no positional tell).
function seededOrder(ids: string[], seed: number): string[] {
  const arr = [...ids];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function optionCountFor(band: Band) {
  return band === 'A' ? 3 : band === 'B' ? 4 : 5;
}

// ════════════════════════════════════════════════════════════════════════
// AMBIENT PARTICLES — 14 lab-colored dots (required game feature)
// ════════════════════════════════════════════════════════════════════════
function ParticleField({ reduced }: { reduced: boolean }) {
  const dots = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: (i * 37) % 100,
      top: (i * 53) % 100,
      size: 4 + (i % 3) * 3,
      dur: 3 + (i % 5) * 0.6,
      delay: (i % 4) * 0.5,
    })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`, top: `${d.top}%`,
            width: d.size, height: d.size,
            background: LAB_COLOR, opacity: 0.2,
          }}
          animate={reduced ? undefined : { y: [0, -14, 0], opacity: [0.1, 0.32, 0.1] }}
          transition={reduced ? undefined : { repeat: Infinity, duration: d.dur, delay: d.delay }}
        />
      ))}
    </div>
  );
}

type Outcome = 'best' | 'alt' | 'wrong';

// ════════════════════════════════════════════════════════════════════════
// SPARKY VIGNETTE — narrated fix shown AFTER the child dispatches
// ════════════════════════════════════════════════════════════════════════
function Vignette({
  round, dispatchedId, outcome, band, onNext, isLast,
}: {
  round: RoundDef; dispatchedId: string; outcome: Outcome; band: Band;
  onNext: () => void; isLast: boolean;
}) {
  const best = ROSTER[round.best];
  const headline =
    outcome === 'best' ? 'Perfect dispatch!'
      : outcome === 'alt' ? 'Good call — that works too!'
        : 'Not the best fit — but here’s who cracks it.';
  const sub =
    outcome === 'best'
      ? `${nameFor(dispatchedId, band)} is exactly who this ticket needs.`
      : outcome === 'alt'
        ? `${nameFor(dispatchedId, band)} can handle a lot of this. The go-to owner is the ${nameFor(round.best, band)}.`
        : `You sent the ${nameFor(dispatchedId, band)}. This one really belongs to the ${nameFor(round.best, band)}.`;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    >
      <FeedbackPopup
        type={outcome === 'wrong' ? 'info' : 'correct'}
        message={headline}
        explanation={sub}
      />

      <SFCard variant="elevated" className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `linear-gradient(135deg, ${LAB_COLOR}30, ${LAB_COLOR}12)` }}
            aria-hidden
          >
            {best.emoji}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: INK }}>
              {nameFor(round.best, band)}
              {best.lab11 && (
                <span
                  className="ml-2 align-middle rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: '#6FFFE620', color: '#1FB89E' }}
                >
                  Lab 11
                </span>
              )}
            </p>
            <p className="text-xs" style={{ color: FAINT }}>{best.does}</p>
          </div>
        </div>

        <div className="space-y-2" role="group" aria-label="Sparky tells the story of the fix">
          {round.vignette.map((line, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-2 rounded-xl p-3"
              style={{ background: `${LAB_COLOR}0D` }}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.25 }}
            >
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden />
              <p className="text-sm" style={{ color: MUTED }}>
                <strong style={{ color: LAB_COLOR }}>Sparky:</strong> {line}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Multi-owner acknowledgment — richer for older bands */}
        {band !== 'A' ? (
          <div
            className="mt-3 flex items-start gap-2 rounded-xl p-3 text-xs"
            style={{ background: '#4F6EF710', color: '#3B55C9' }}
          >
            <Users className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <span><strong>Not the only right answer:</strong> {round.alsoNote}</span>
          </div>
        ) : (
          <div
            className="mt-3 flex items-center gap-2 rounded-xl p-3 text-xs"
            style={{ background: '#4F6EF710', color: '#3B55C9' }}
          >
            <Users className="w-4 h-4 shrink-0" aria-hidden />
            <span>The {nameFor(round.alternates[0], band)} could help out too!</span>
          </div>
        )}
      </SFCard>

      <SFButton variant="primary" size="lg" className="w-full" onClick={onNext}>
        {isLast ? 'See how the lab did' : 'Next case'} <ChevronRight className="w-5 h-5 ml-2" />
      </SFButton>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN GAME
// ════════════════════════════════════════════════════════════════════════
export default function CareerExplorerGame() {
  const { awardXP, completeGame } = useGameActions();
  const juice = useJuice();
  const reduced = !!useReducedMotion();
  const child = useActiveChild();
  const band = (child?.age_band || 'B') as Band;

  const [phase, setPhase] = useState<'welcome' | 'ticket' | 'verdict' | 'complete'>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [dispatched, setDispatched] = useState<{ id: string; outcome: Outcome } | null>(null);
  const [results, setResults] = useState<{ outcome: Outcome; points: number }[]>([]);
  const firedRef = useRef(false);

  const round = ROUNDS[roundIdx];
  const isLast = roundIdx === ROUNDS.length - 1;
  const score = results.reduce((s, r) => s + r.points, 0);

  const options = useMemo(() => {
    const required = [round.best, ...round.alternates];
    const want = optionCountFor(band);
    const extra = round.distractors.slice(0, Math.max(0, want - required.length));
    return seededOrder([...required, ...extra], round.seed);
  }, [round, band]);

  const dispatch = useCallback((id: string) => {
    const outcome: Outcome = id === round.best ? 'best'
      : round.alternates.includes(id) ? 'alt' : 'wrong';
    const points = outcome === 'best' ? BEST_POINTS : outcome === 'alt' ? ALT_POINTS : 0;
    setDispatched({ id, outcome });
    setResults((r) => [...r, { outcome, points }]);
    if (outcome === 'wrong') juice.onWrong(roundIdx + 1, score);
    else juice.onCorrect(roundIdx + 1, score + points);
    setPhase('verdict');
  }, [round, roundIdx, score, juice]);

  const nextCase = useCallback(() => {
    setDispatched(null);
    if (isLast) {
      setPhase('complete');
    } else {
      setRoundIdx((i) => i + 1);
      setPhase('ticket');
    }
  }, [isLast]);

  const restart = useCallback(() => {
    firedRef.current = false;
    setResults([]);
    setRoundIdx(0);
    setDispatched(null);
    setPhase('welcome');
  }, []);

  // Final stars: fire XP + completeGame exactly once on entering `complete`.
  const finalStars = (score >= 80 ? 3 : score >= 44 ? 2 : 1) as 1 | 2 | 3;
  useEffect(() => {
    if (phase === 'complete' && !firedRef.current) {
      firedRef.current = true;
      awardXP(Math.round(score * 1.5) + 20);
      completeGame('career-explorer', finalStars);
    }
  }, [phase, score, finalStars, awardXP, completeGame]);

  return (
    <GameShell title="Career Explorer" color="#E68E28" labNum={9}>
      <div className="relative">
        <ParticleField reduced={reduced} />
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {/* ═══ WELCOME ═══ */}
            {phase === 'welcome' && (
              <motion.div
                key="welcome" className="space-y-5"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <GlowingTitle emoji="💼" color={LAB_COLOR}>A Day in the AI Lab</GlowingTitle>
                <SFCard variant="elevated" className="p-5 space-y-3">
                  <p className="text-sm" style={{ color: MUTED }}>
                    You run the front desk of a real AI lab. All day, <strong style={{ color: INK }}>problem tickets</strong> come in —
                    a model that mislabels everything, a chatbot that leaks secrets, an agent that won’t stop.
                  </p>
                  <p className="text-sm" style={{ color: MUTED }}>
                    Your job: <strong style={{ color: LAB_COLOR }}>dispatch the right specialist</strong>. Then watch Sparky
                    narrate how they fix it — that’s how you learn what each career really <em>does</em>.
                  </p>
                  <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}12`, color: LAB_COLOR }}>
                    <strong>Heads up:</strong> big problems can have more than one right owner — send your best guess,
                    and we’ll tell you who else could have helped. {ROUNDS.length} cases to solve.
                  </div>
                </SFCard>
                <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('ticket')}>
                  Open the lab <ChevronRight className="w-5 h-5 ml-2" />
                </SFButton>
              </motion.div>
            )}

            {/* ═══ TICKET / DISPATCH ═══ */}
            {phase === 'ticket' && (
              <motion.div
                key={`ticket-${round.id}`} className="space-y-4"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              >
                <div className="flex items-center justify-between">
                  <GlowingTitle emoji="🎟️" color={LAB_COLOR}>New Ticket</GlowingTitle>
                  <span className="text-sm font-bold" style={{ color: LAB_COLOR }}>
                    Case {roundIdx + 1} / {ROUNDS.length}
                  </span>
                </div>

                {/* The problem ticket */}
                <SFCard variant="elevated" className="p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold" style={{ color: FAINT }}>
                    <Ticket className="w-4 h-4" style={{ color: LAB_COLOR }} aria-hidden />
                    From: {round.from}
                  </div>
                  <p className="text-base font-semibold" style={{ color: INK }}>
                    {band === 'A' ? round.ticketA : round.ticketC}
                  </p>
                </SFCard>

                <p className="text-sm font-semibold px-1" style={{ color: MUTED }}>
                  Who do you send?
                </p>

                {/* Specialist choices — real buttons, keyboard operable */}
                <div className="grid grid-cols-1 gap-2" role="group" aria-label="Choose a specialist to dispatch">
                  {options.map((id) => {
                    const sp = ROSTER[id];
                    return (
                      <button
                        key={id}
                        onClick={() => dispatch(id)}
                        aria-label={`Dispatch ${nameFor(id, band)}. ${sp.does}`}
                        className="w-full text-left rounded-2xl p-3 flex items-start gap-3 transition-all
                          hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          background: '#FFFFFF',
                          border: `2px solid ${LAB_COLOR}25`,
                          ['--tw-ring-color' as string]: LAB_COLOR,
                        }}
                      >
                        <span
                          className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: `linear-gradient(135deg, ${LAB_COLOR}20, ${LAB_COLOR}08)` }}
                          aria-hidden
                        >
                          {sp.emoji}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: INK }}>{nameFor(id, band)}</span>
                            {sp.lab11 && band === 'C' && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-bold"
                                style={{ background: '#6FFFE620', color: '#1FB89E' }}
                              >
                                Lab 11
                              </span>
                            )}
                          </span>
                          <span className="block text-xs mt-0.5" style={{ color: FAINT }}>{sp.does}</span>
                        </span>
                        <Send className="w-4 h-4 shrink-0 mt-1" style={{ color: LAB_COLOR }} aria-hidden />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ VERDICT / VIGNETTE ═══ */}
            {phase === 'verdict' && dispatched && (
              <motion.div key={`verdict-${round.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Vignette
                  round={round}
                  dispatchedId={dispatched.id}
                  outcome={dispatched.outcome}
                  band={band}
                  onNext={nextCase}
                  isLast={isLast}
                />
              </motion.div>
            )}

            {/* ═══ COMPLETE ═══ */}
            {phase === 'complete' && (
              <motion.div
                key="complete" className="space-y-5 text-center"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${LAB_COLOR}, #FFD93D)` }}
                  animate={reduced ? undefined : { rotate: [0, 8, -8, 0] }}
                  transition={reduced ? undefined : { repeat: Infinity, duration: 2 }}
                >
                  <Trophy className="w-10 h-10 text-white" aria-hidden />
                </motion.div>

                <div>
                  <h2 className="text-xl font-bold" style={{ color: INK }}>Shift complete!</h2>
                  <p className="text-sm mt-1" style={{ color: MUTED }}>
                    You dispatched the lab through {ROUNDS.length} real problems.
                  </p>
                </div>

                <div className="flex justify-center gap-2" role="img" aria-label={`${finalStars} of 3 stars`}>
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className="w-9 h-9"
                      style={{
                        color: s <= finalStars ? '#FFD93D' : '#E7E9F2',
                        fill: s <= finalStars ? '#FFD93D' : 'none',
                      }}
                      aria-hidden
                    />
                  ))}
                </div>

                <SFCard variant="elevated" className="p-4">
                  <p className="text-sm" style={{ color: MUTED }}>
                    Best-fit dispatches: <strong style={{ color: INK }}>{results.filter((r) => r.outcome === 'best').length}</strong>
                    {' · '}Sensible alternates: <strong style={{ color: INK }}>{results.filter((r) => r.outcome === 'alt').length}</strong>
                  </p>
                  <p className="text-sm mt-1" style={{ color: MUTED }}>
                    Score: <strong style={{ color: LAB_COLOR }}>{score}</strong> / {MAX_SCORE}
                  </p>
                </SFCard>

                <SFButton variant="primary" size="lg" className="w-full" onClick={restart}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Run the lab again
                </SFButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GameShell>
  );
}
