// ════════════════════════════════════════════════════════════════════════
// DATA SHIELD v4 — Lab 6 (AI & Ethics) — SORT archetype migration (Wave 2)
// ════════════════════════════════════════════════════════════════════════
// Was a privacy quiz on QuizLevelRenderer. Now you SORT each data item into a
// privacy bin — Private / Sensitive / Shareable — exactly the GameMechanicKit
// privacy demo. A shield-strength meter rises with each correct call and dips
// on a mistake. Pixi SORT scene (drag chips into named bins) inside GameShell.
//
// Teaches: which personal data to guard, share carefully, or post freely.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Shield, GraduationCap, Target, RotateCcw, Sparkles,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import {
  GlowingTitle, ScoreDisplay, ComboCounter, FeedbackPopup,
} from '@/components/games/shared/GameVisualKit';
import type { BinSortItem } from '@/components/games/pixi/PixiBinSortStage';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiBinSortStage = dynamic(() => import('@/components/games/pixi/PixiBinSortStage'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl" style={{ background: '#0E1428' }} />
  ),
});

const LAB_COLOR = '#2ECC71';
const BINS = ['Private', 'Sensitive', 'Shareable']; // bin index 0 / 1 / 2
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#F59E0B', '#10BAD2', '#FF7050', '#8F96FA'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Password Power', description: 'Sort the secrets from the shareables.', emoji: '🔐', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Personal Info', description: 'What data is private?', emoji: '📋', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Share Smart', description: 'When is sharing data OK?', emoji: '🤝', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Online Profile', description: 'Build a safe profile.', emoji: '🧑‍💻', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'AI & Privacy', description: 'How AI uses your data.', emoji: '🧠', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Identity Guard', description: 'Protect what makes you, you.', emoji: '⚠️', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Account Safety', description: 'Lock down your accounts.', emoji: '⚖️', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Data Footprint', description: 'What you leave behind online.', emoji: '🎭', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Consent Complex', description: 'Choosing what to give away.', emoji: '✅', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Privacy Master', description: 'The ultimate data protector!', emoji: '🛡️', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Some data must stay secret (Private), some you share only with trusted people (Sensitive), and some is safe to post (Shareable).',
  2: 'Personally identifiable info (PII) — name, address, phone — can identify you. Guard it carefully.',
  3: 'Sharing is fine when it cannot be used to find, impersonate, or harm you. Opinions and hobbies are safe.',
  4: 'A safe profile shows your interests, not your secrets. Never post passwords or your live location.',
  5: 'AI systems learn from data you give them. The less PII you share, the less can be misused.',
  6: 'Your identity is built from PII. Lose control of it and others can pretend to be you.',
  7: 'Passwords and PINs unlock everything. They are the most Private data of all — never share them.',
  8: 'Every post leaves a footprint. Sort before you share so nothing Private slips out.',
  9: 'Consent means choosing what to give away. Know the category before you decide.',
  10: 'Master test: guard the Private, protect the Sensitive, and share the Shareable with confidence.',
};

// ════════════════════════════════════════════════════════════════════════
// DATA ITEM BANK — short chip label + full name + correct bin + why
// (interleaved Private / Sensitive / Shareable so any window covers all bins)
// ════════════════════════════════════════════════════════════════════════
interface DataItem { id: string; label: string; name: string; bin: number; why: string; }

const BANK: DataItem[] = [
  { id: 'password', label: 'Password', name: 'Password', bin: 0, why: 'A password unlocks your accounts — never share it with anyone.' },
  { id: 'fullname', label: 'Full Name', name: 'Full Name', bin: 1, why: 'Your full name can identify you — share it only on trusted sites.' },
  { id: 'favcolor', label: 'Fav Color', name: 'Favorite Color', bin: 2, why: 'A favorite color tells no one how to find you — safe to share.' },
  { id: 'address', label: 'Address', name: 'Home Address', bin: 0, why: 'Your home address tells strangers exactly where you live. Keep it private.' },
  { id: 'birthday', label: 'Birthday', name: 'Full Birthday', bin: 1, why: 'A full birthdate is valuable to identity thieves — share with care.' },
  { id: 'favgame', label: 'Fav Game', name: 'Favorite Game', bin: 2, why: 'Your favorite game is just a fun fact — safe to post.' },
  { id: 'pin', label: 'Bank PIN', name: 'Bank PIN', bin: 0, why: 'A PIN protects money. It is one of the most private things you have.' },
  { id: 'email', label: 'Email', name: 'Email Address', bin: 1, why: 'An email is a contact point — give it only to people and sites you trust.' },
  { id: 'hobby', label: 'Hobby', name: 'A Hobby', bin: 2, why: 'Hobbies are great to talk about — they cannot be used to harm you.' },
  { id: 'location', label: 'Location', name: 'Live Location', bin: 0, why: 'Live location lets people track you in real time. Keep it private.' },
  { id: 'phone', label: 'Phone', name: 'Phone Number', bin: 1, why: 'A phone number reaches you directly — share it carefully.' },
  { id: 'nickname', label: 'Nickname', name: 'Nickname', bin: 2, why: 'A made-up nickname does not reveal who you really are — safe to use.' },
  { id: 'idnum', label: 'ID #', name: 'ID Number', bin: 0, why: 'ID numbers are used to verify identity. Treat them as top-secret.' },
  { id: 'photo', label: 'Photo', name: 'Your Photo', bin: 1, why: 'A photo of you is personal — share it only with people you trust.' },
  { id: 'opinion', label: 'Opinion', name: 'A Movie Opinion', bin: 2, why: 'Opinions are meant to be shared — no privacy risk at all.' },
  { id: 'school', label: 'School', name: 'School Name', bin: 1, why: 'Your school says where to find you on weekdays — share carefully.' },
  { id: 'drawing', label: 'Drawing', name: 'A Drawing', bin: 2, why: 'Sharing your art is wonderful and totally safe.' },
  { id: 'keys', label: 'Door Code', name: 'Door Code', bin: 0, why: 'A door code is a key to your home. Never share it online.' },
];

function getItems(levelId: number): DataItem[] {
  const count = Math.min(9, 6 + Math.floor(levelId / 3)); // 6–9 items
  const offset = ((levelId - 1) * 3) % BANK.length;
  const out: DataItem[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  // De-dup in case the window wraps onto itself.
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT board + shield meter
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'sort'>('welcome');
  const items = useMemo(() => getItems(level.id), [level.id]);
  const [assignments, setAssignments] = useState<Record<string, number | undefined>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [shield, setShield] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const maxScore = items.length * 10 + 20;
  const sortedCount = items.filter((t) => assignments[t.id] !== undefined).length;
  const allSorted = sortedCount >= items.length;
  const perItemShield = Math.round(100 / items.length);

  const sceneItems = useMemo<BinSortItem[]>(
    () => items.map((it, i) => ({ id: it.id, label: it.label, name: it.name, color: CHIP_PALETTE[i % CHIP_PALETTE.length] })),
    [items],
  );

  const finishLevel = useCallback((finalScore: number, finalWrong: number) => {
    const accuracyBonus = Math.max(0, 20 - finalWrong * 5);
    const total = finalScore + accuracyBonus;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 1300);
  }, [level, maxScore, onComplete]);

  const handleAssign = useCallback((id: string, bin: number) => {
    if (assignments[id] !== undefined) return;
    const item = items.find((t) => t.id === id);
    if (!item) return;

    const nextAssign = { ...assignments, [id]: bin };
    setAssignments(nextAssign);
    const correct = item.bin === bin;
    const doneCount = Object.keys(nextAssign).length;

    if (correct) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setShield((s) => Math.min(100, s + perItemShield));
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Shielded! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setShield((s) => Math.max(0, s - Math.round(perItemShield / 2)));
      setFeedback({ type: 'wrong', message: `That belongs in "${BINS[item.bin]}".`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, perItemShield, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🛡️" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each item into <strong>Private</strong>, <strong>Sensitive</strong>, or <strong>Shareable</strong>. Raise your shield!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Sorting <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🛡️" color={LAB_COLOR}>Sort the Data</GlowingTitle>
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

      <PixiBinSortStage
        items={sceneItems}
        bins={BINS}
        assignments={assignments}
        onAssign={handleAssign}
        labColor={LAB_COLOR}
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={() => finishLevel(score, wrong)} disabled={!allSorted}>
          <Sparkles className="w-4 h-4 mr-2" />
          {allSorted ? 'Secure!' : `Sort ${items.length - sortedCount} more…`}
        </SFButton>
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

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('data-shield', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Data Shield" color={LAB_COLOR} labNum={5}>
      <GameLevelSystem
        gameTitle="Data Shield"
        gameEmoji="🛡️"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
