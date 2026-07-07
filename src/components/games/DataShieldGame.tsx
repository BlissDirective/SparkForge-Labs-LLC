// ════════════════════════════════════════════════════════════════════════
// DATA SHIELD v5 — Lab 6 (AI & Ethics) — scenario / context-shift redesign
// ════════════════════════════════════════════════════════════════════════
// The old version sorted a fixed bank where each item ALWAYS landed in the same
// bin — so the real lesson (context decides) was lost and the bank memorised.
//
// v5 keeps the three-tier sort (Private / Sensitive / Shareable) but every level
// is a SCENARIO: Sparky's robot friend (a) fills a sign-up form, (b) posts to
// the whole world, (c) chats with an AI helper, (d) enters the school portal,
// (e) pastes into a chatbot (2026 skill). The SAME item changes bin by scenario
// — e.g. "your first name" is fine on the school portal but risky in a public
// post. The reveal after each commit teaches WHY the context changed the answer.
//
// G1 honesty: the scenario (the input) is shown BEFORE sorting; the correct bin
// is never in the chip or its aria label — it's revealed only after you commit.
// Keyboard-operable: three real <button>s per item (no drag).

'use client';

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ChevronRight, Shield, GraduationCap, Target, RotateCcw, Sparkles,
  Lock, AlertTriangle, Share2, ArrowRight,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import {
  GlowingTitle, ScoreDisplay, ComboCounter, FeedbackPopup,
} from '@/components/games/shared/GameVisualKit';

type AgeBand = 'A' | 'B' | 'C';

const LAB_COLOR = '#FF7050';

// Bin index 0 / 1 / 2 — the fixed privacy taxonomy (NOT the answer to any one
// item; shown as a legend so kids know the three choices before they decide).
const BINS = ['Private', 'Sensitive', 'Shareable'] as const;
const BIN_META = [
  { label: 'Private', hint: 'Keep it secret', color: '#EF4444', Icon: Lock },
  { label: 'Sensitive', hint: 'Share with care', color: '#F59E0B', Icon: AlertTriangle },
  { label: 'Shareable', hint: 'OK to share', color: '#10B981', Icon: Share2 },
] as const;

// ════════════════════════════════════════════════════════════════════════
// SCENARIOS — each is a real situation. The SAME item id can carry a different
// `bin` in different scenarios; that is the whole point (context decides).
//   flip   → a context-shift item (first name across scenarios). Hidden for A.
//   subtle → hardest nuance. Only band C sees it.
// ════════════════════════════════════════════════════════════════════════
interface ScenarioItem {
  id: string; name: string; bin: number; why: string; flip?: boolean; subtle?: boolean;
}
interface Scenario {
  key: string; name: string; emoji: string;
  difficulty: LevelConfig['difficulty'];
  setup: string;   // shown BEFORE sorting — the input/context
  concept: string; // the teaching line
  items: ScenarioItem[];
}

const SCENARIOS: Record<string, Scenario> = {
  signup: {
    key: 'signup', name: 'Game App Sign-Up', emoji: '📝', difficulty: 'easy',
    setup: "Sparky's robot friend is making an account for a new game app. What is OK to type into the sign-up form?",
    concept: 'A sign-up form only needs enough to make your account. Give what it truly needs — guard the rest.',
    items: [
      { id: 'username', name: 'A username you made up', bin: 2, why: 'A username is made for sign-up forms — that is exactly what it is for.' },
      { id: 'parentEmail', name: "A parent's email address", bin: 1, why: 'The form needs an email to make the account — use a grown-up’s and share it carefully.' },
      { id: 'address', name: 'Your home address', bin: 0, why: 'A game app does not need to know where you live. Keep your address private.' },
      { id: 'school', name: 'The name of your school', bin: 0, why: 'A game does not need your school — that could tell a stranger where to find you.' },
      { id: 'favColor', name: 'Your favourite colour', bin: 2, why: 'A fun detail like this is safe — it cannot be used to find you.' },
      { id: 'age', name: 'How old you are', bin: 1, why: 'Some apps ask your age to keep you safe — share your age, but not your full birthday.' },
    ],
  },
  publicPost: {
    key: 'publicPost', name: 'Post to the Whole World', emoji: '🌍', difficulty: 'easy',
    setup: 'Sparky wants to post something that EVERYONE in the world can see, forever. What is safe to post in public?',
    concept: 'A public post can be seen by anyone, forever. Only post things that cannot be used to find or copy you.',
    items: [
      { id: 'opinion', name: 'Your opinion about a movie', bin: 2, why: 'Opinions are made to be shared — no risk in a public post.' },
      { id: 'drawing', name: 'A drawing you made', bin: 2, why: 'Sharing your own art in public is wonderful and safe.' },
      { id: 'firstName', name: 'Your first name', bin: 1, flip: true, why: 'In a PUBLIC post even your first name is worth guarding — yet on your school portal (a place that already knows you) it is fine. Context decides.' },
      { id: 'schoolName', name: 'The name of your school', bin: 0, why: 'Posting your school tells strangers where to find you on weekdays. Keep it private.' },
      { id: 'address', name: 'Your home address', bin: 0, why: 'Never post where you live for the whole world to see.' },
      { id: 'homeAlone', name: '"I’m home alone right now"', bin: 0, why: 'Telling everyone you are home alone is not safe — keep it private.' },
    ],
  },
  aiChat: {
    key: 'aiChat', name: 'AI Homework Helper', emoji: '🤖', difficulty: 'medium',
    setup: 'Sparky is chatting with an AI helper to understand a tricky math problem. What is OK to tell the AI?',
    concept: 'An AI helper needs your question — not your identity. Share the problem, not private facts about you.',
    items: [
      { id: 'homework', name: 'The math question you are stuck on', bin: 2, why: 'The whole point is to ask your question — that is safe to share with the helper.' },
      { id: 'myParagraph', name: 'A paragraph YOU wrote for class', bin: 2, why: 'Asking the AI to check your own writing is fine.' },
      { id: 'fullName', name: 'Your full real name', bin: 1, why: 'The AI does not need your name to help — leave it out unless a grown-up says it is okay.' },
      { id: 'friendPhone', name: "Your friend’s phone number", bin: 0, why: 'Your friend’s number is not yours to share — keep it private.' },
      { id: 'password', name: 'Your account password', bin: 0, why: 'An AI never needs your password. Never type it in.' },
    ],
  },
  schoolPortal: {
    key: 'schoolPortal', name: 'Your School Portal', emoji: '🏫', difficulty: 'medium',
    setup: 'Sparky is logging into the OFFICIAL school portal that the teachers set up. What is okay to enter here?',
    concept: 'A trusted place you know — like your school portal — can safely use info a public site cannot. The context changed the answer.',
    items: [
      { id: 'firstName', name: 'Your first name', bin: 2, flip: true, why: 'Your school already knows your first name, so here it is fine — even though it was risky in a public post. Same item, different context.' },
      { id: 'classGrade', name: 'Your class or grade', bin: 2, why: 'Your teacher needs to know your class — safe on the school portal.' },
      { id: 'studentId', name: 'Your student ID number', bin: 1, why: 'Your student ID belongs on the REAL school portal only — never type it anywhere else.' },
      { id: 'reusedPw', name: 'A password you use for other sites', bin: 0, why: 'Never reuse another site’s password here — the portal should have its own.' },
      { id: 'selfieAll', name: 'A selfie for EVERYONE to see', bin: 1, subtle: true, why: 'A photo for your teacher is different from a photo for the whole world — share it only with care.' },
    ],
  },
  chatbot: {
    key: 'chatbot', name: 'Safe to Paste into a Chatbot?', emoji: '💬', difficulty: 'expert',
    setup: 'Sparky is using an AI chatbot and wants to PASTE things into the chat box. What is safe to paste?',
    concept: 'The 2026 rule: never paste passwords, your home address, or other people’s private info into a chatbot. Your own homework question is fine.',
    items: [
      { id: 'homework', name: 'Your own homework question', bin: 2, why: 'Pasting your own question is exactly what a chatbot is for — safe.' },
      { id: 'myStory', name: 'A story YOU are writing', bin: 2, why: 'Pasting your own writing to get feedback is fine.' },
      { id: 'password', name: 'A password', bin: 0, why: 'Never paste a password into a chatbot. Ever.' },
      { id: 'address', name: 'Your home address', bin: 0, why: 'Do not paste where you live — a chatbot does not need it.' },
      { id: 'friendChat', name: "A screenshot of a friend’s private chat", bin: 0, subtle: true, why: 'Other people’s private messages are not yours to paste — keep them out.' },
      { id: 'fullName', name: 'Your full real name', bin: 1, why: 'Your name is not needed to get help — leave it out to be safe.' },
    ],
  },
};

// Ordered scenario plan per age band.
//  A: 2 obvious scenarios, no flips/subtle items.
//  B: 4 scenarios incl. the first-name flip (public post ↔ school portal) + chatbot.
//  C: all 5 scenarios incl. the AI chat + every subtle context flip.
const PLAN: Record<AgeBand, string[]> = {
  A: ['publicPost', 'signup'],
  B: ['signup', 'publicPost', 'schoolPortal', 'chatbot'],
  C: ['signup', 'publicPost', 'aiChat', 'schoolPortal', 'chatbot'],
};

const A_MAX_ITEMS = 4; // younger kids get shorter rounds

function itemsForBand(scenario: Scenario, band: AgeBand): ScenarioItem[] {
  let list = scenario.items.filter((it) => {
    if (it.subtle) return band === 'C';
    if (it.flip) return band !== 'A';
    return true;
  });
  if (band === 'A') list = list.slice(0, A_MAX_ITEMS);
  return list;
}

function buildLevels(band: AgeBand): LevelConfig[] {
  const XP: Record<LevelConfig['difficulty'], number> = { easy: 60, medium: 90, hard: 120, expert: 150 };
  return PLAN[band].map((key, i) => {
    const s = SCENARIOS[key];
    const n = itemsForBand(s, band).length;
    const base = n * 10;
    return {
      id: i + 1,
      name: s.name,
      description: s.setup,
      emoji: s.emoji,
      difficulty: s.difficulty,
      starThresholds: [Math.round(base * 0.5), Math.round(base * 0.7), Math.round(base * 0.9)],
      xpReward: XP[s.difficulty],
      isBonus: s.difficulty === 'expert',
    };
  });
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — one item at a time, three keyboard-operable bin buttons
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, scenarioKey, onComplete, onExit,
}: {
  level: LevelConfig; band: AgeBand; scenarioKey: string;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const scenario = SCENARIOS[scenarioKey];
  const items = useMemo(() => itemsForBand(scenario, band), [scenario, band]);

  const [phase, setPhase] = useState<'welcome' | 'sort'>('welcome');
  const [cur, setCur] = useState(0);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [shield, setShield] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; message: string; explanation?: string } | null>(null);

  const maxScore = items.length * 10 + 20;
  const perItemShield = Math.round(100 / items.length);
  const current = items[cur];
  const committed = !!current && assignments[current.id] !== undefined;
  const isLast = cur >= items.length - 1;

  const finishLevel = useCallback((finalScore: number, finalWrong: number) => {
    const accuracyBonus = Math.max(0, 20 - finalWrong * 5);
    const total = finalScore + accuracyBonus;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 900);
  }, [level, maxScore, onComplete]);

  const handleChoose = useCallback((bin: number) => {
    if (!current || committed) return;
    setAssignments((a) => ({ ...a, [current.id]: bin }));
    const correct = current.bin === bin;
    const done = cur + 1;

    if (correct) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setShield((s) => Math.min(100, s + perItemShield));
      setFeedback({
        type: 'correct',
        message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Shielded! +${gained}`,
        explanation: current.why,
      });
      juice.onCorrect(done, nextScore);
    } else {
      setCombo(0);
      setWrong((w) => w + 1);
      setShield((s) => Math.max(0, s - Math.round(perItemShield / 2)));
      setFeedback({
        type: 'wrong',
        message: `This one is ${BINS[current.bin]} here.`,
        explanation: current.why,
      });
      juice.onWrong(0, score);
    }
  }, [current, committed, cur, combo, score, perItemShield, juice]);

  const next = useCallback(() => {
    setFeedback(null);
    if (isLast) {
      finishLevel(score, wrong);
    } else {
      setCur((c) => c + 1);
    }
  }, [isLast, finishLevel, score, wrong]);

  // ═══ WELCOME — context is shown up front (the input, not the answer) ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={scenario.emoji} color={LAB_COLOR}>{scenario.name}</GlowingTitle>

        <div className="rounded-2xl p-5 space-y-3" style={{ background: '#0E1428', border: `1px solid ${LAB_COLOR}30` }}>
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
            <p className="text-sm font-semibold" style={{ color: '#E8ECFF' }}>{scenario.setup}</p>
          </div>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}14`, color: '#C9D2F0' }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
            <span><strong style={{ color: LAB_COLOR }}>Why it matters:</strong> {scenario.concept}</span>
          </div>
        </div>

        {/* Bin legend — the three choices, shown before sorting (not per-item answers) */}
        <div className="grid grid-cols-3 gap-2">
          {BIN_META.map((b) => (
            <div key={b.label} className="rounded-xl p-2.5 text-center" style={{ background: `${b.color}14`, border: `1px solid ${b.color}33` }}>
              <b.Icon className="w-4 h-4 mx-auto mb-1" style={{ color: b.color }} aria-hidden />
              <div className="text-xs font-bold" style={{ color: b.color }}>{b.label}</div>
              <div className="text-xs mt-0.5" style={{ color: '#8C94AC' }}>{b.hint}</div>
            </div>
          ))}
        </div>

        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Sorting <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT — one item, three buttons, reveal after commit ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji={scenario.emoji} color={LAB_COLOR}>{scenario.name}</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Shield className="w-4 h-4" />{shield}%
        </span>
      </div>

      {/* Shield-strength meter */}
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: '#0E1428' }} aria-hidden>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${shield}%`, background: `linear-gradient(90deg, ${LAB_COLOR}, #10BAD2)` }}
        />
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      {/* Persistent context banner — the scenario is the INPUT, always visible */}
      <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: '#0E1428', border: `1px solid ${LAB_COLOR}22` }}>
        <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden />
        <p className="text-xs" style={{ color: '#C9D2F0' }}>
          <strong style={{ color: LAB_COLOR }}>Scenario:</strong> {scenario.setup}
        </p>
      </div>

      <p className="text-xs font-semibold" style={{ color: '#8C94AC' }}>
        Item {Math.min(cur + 1, items.length)} of {items.length}
      </p>

      {/* Current item chip — G1: name only, NO bin hint in text or aria */}
      {current && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: '#141B33', border: '2px solid #2A3556' }}
          aria-live="polite"
        >
          <p className="text-xs mb-1" style={{ color: '#8C94AC' }}>Where does this belong in THIS scenario?</p>
          <p className="text-base font-bold" style={{ color: '#F5F7FF' }}>{current.name}</p>
        </div>
      )}

      {/* Three bin buttons — keyboard-operable, no drag */}
      {!committed && current && (
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Choose where this item belongs in this scenario">
          {BIN_META.map((b, idx) => (
            <button
              key={b.label}
              type="button"
              onClick={() => handleChoose(idx)}
              aria-label={`Sort into ${b.label} — ${b.hint}`}
              className="flex flex-col items-center gap-1 rounded-2xl p-3 transition-all hover:scale-105
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `${b.color}14`,
                border: `2px solid ${b.color}44`,
                ['--tw-ring-color' as string]: b.color,
              }}
            >
              <b.Icon className="w-5 h-5" style={{ color: b.color }} aria-hidden />
              <span className="text-xs font-bold" style={{ color: b.color }}>{b.label}</span>
              <span className="text-xs" style={{ color: '#8C94AC' }}>{b.hint}</span>
            </button>
          ))}
        </div>
      )}

      {/* Reveal + continue */}
      <AnimatePresence mode="wait">
        {feedback && <FeedbackPopup key={cur} {...feedback} />}
      </AnimatePresence>

      <div className="flex gap-2">
        {committed ? (
          <SFButton variant="primary" className="flex-1" onClick={next}>
            {isLast ? (<><Sparkles className="w-4 h-4 mr-2" />Secure!</>) : (<>Next Item <ArrowRight className="w-4 h-4 ml-2" /></>)}
          </SFButton>
        ) : (
          <div className="flex-1 rounded-xl p-3 text-center text-xs" style={{ background: '#0E1428', color: '#8C94AC' }}>
            Pick a bin for this item.
          </div>
        )}
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function DataShieldGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;

  const levels = useMemo(() => buildLevels(band), [band]);
  const plan = PLAN[band];

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = results.length * 3;
    const frac = maxStars > 0 ? totalStars / maxStars : 0;
    awardXP(Math.round(totalXP));
    completeGame('data-shield', frac >= 0.8 ? 3 : frac >= 0.5 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Data Shield" color={LAB_COLOR} labNum={6}>
      <GameLevelSystem
        gameTitle="Data Shield"
        gameEmoji="🛡️"
        labColor={LAB_COLOR}
        levels={levels}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer
            key={level.id}
            level={level}
            band={band}
            scenarioKey={plan[level.id - 1]}
            onComplete={onComplete}
            onExit={onExit}
          />
        )}
      />
    </GameShell>
  );
}
