// ════════════════════════════════════════════════════════════════════════
// DATA DETECTIVE v4 — Lab 2 (Teaching Machines) — REDESIGN
// ════════════════════════════════════════════════════════════════════════
// Was a repeated 20s radio-button quiz (QuizLevelRenderer) stretching a
// 12-question bank across 10 levels. The scenarios were the strongest in
// Lab 2 (Amazon hiring bias, pulse oximeters, ZIP-code proxy variables,
// demographic-parity failure) but the delivery wasted them.
//
// Now every scenario is a CASE ON AN EVIDENCE BOARD. Each case shows a small,
// kid-readable fake dataset. The child INVESTIGATES — taps the suspicious
// rows or columns — then COMMITS an accusation. Only after committing is the
// flaw revealed (G1 honesty: nothing is pre-highlighted). The child then
// NAMES THE BIAS from a taxonomy pick sized to their age band. Sparky plays a
// noir detective sidekick. The old data-pipeline drag-order becomes the final
// case-closing ritual — reordered with keyboard-friendly up/down controls.
//
// DOM game (no 3D/canvas). Self-drives its own case flow inside GameShell
// (dark Frost-Prismatic surface) and reports XP + 1–3 stars exactly once via
// useGameActions().awardXP + completeGame('data-detective', stars).

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Fingerprint, Search, Scale, FileCheck2, Lock, Star, ChevronRight,
  ChevronLeft, RotateCcw, ArrowUp, ArrowDown, Check, X, Sparkles,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFButton } from '@/components/ui/SFButton';

// ── Palette (dark surface) ──────────────────────────────────────────────
const ACCENT = '#4F6EF7';     // Lab 2
const AMBER = '#F6B44C';      // detective highlight
const GOOD = '#2ECC71';
const BAD = '#FF5C6C';
const SURFACE = '#0E1526';
const PANEL = '#0A0F1C';
const CELL = '#141d33';
const INK = '#F5F7FF';
const BODY = 'rgba(255,255,255,0.74)';
const MUTE = 'rgba(255,255,255,0.55)';
const HAIR = 'rgba(255,255,255,0.12)';

type Band = 'A' | 'B' | 'C';

// ── Case data types ─────────────────────────────────────────────────────
interface BiasOption { label: string; correct?: boolean }

/** A suspect is either a set of column indices or row indices to tap. */
interface Suspect { mode: 'column' | 'row'; indices: number[] }

interface InvestigationCase {
  kind: 'investigate';
  id: number;
  codename: string;
  emoji: string;
  concept: string;            // short subtitle (bias family)
  sparky: string;             // noir brief
  columns: string[];
  rows: string[][];           // each row aligned to columns
  suspect: Suspect;           // the correct suspicious target(s)
  investigatePrompt: string;  // what the child is asked to tap
  reveal: string;             // announced after commit (aria-live)
  bandHint: string;           // generic nudge shown for band A (no pre-reveal)
  options: Record<Band, BiasOption[]>;
  namingReveal: string;       // the "why" shown after naming the bias
  baseXP: number;
}

interface RitualCase {
  kind: 'ritual';
  id: number;
  codename: string;
  emoji: string;
  concept: string;
  sparky: string;
  stages: { id: string; label: string; color: string }[]; // in CORRECT order
  reveal: string;
  baseXP: number;
}

type CaseDef = InvestigationCase | RitualCase;

interface CaseResult { score: number; stars: 1 | 2 | 3; xp: number }

// ── The case files (every strong Lab-2 scenario, reused) ─────────────────
const CASES: CaseDef[] = [
  // CASE 1 — pulse-oximeter / health-app representation failure
  {
    kind: 'investigate',
    id: 1,
    codename: 'The Lopsided Lineup',
    emoji: '🩺',
    concept: 'Who is in the training data?',
    sparky: 'A health app reads oxygen from skin. Works like a dream for some folks, flops for others. The training photos are on the board, kid. Find who got left out.',
    columns: ['Skin tone', 'Photos in training set', 'App accuracy'],
    rows: [
      ['Very light', '4,200', '98%'],
      ['Light', '3,800', '97%'],
      ['Medium', '900', '88%'],
      ['Dark', '210', '71%'],
      ['Very dark', '60', '54%'],
    ],
    suspect: { mode: 'column', indices: [1] },
    investigatePrompt: 'Tap the column that looks lopsided.',
    reveal: 'You cracked it. The training set was almost all light skin — about 8,000 light-skin photos versus 270 dark-skin. The app barely learned dark skin, so it fails there. Real pulse oximeters were built with the same skew.',
    bandHint: 'Detective tip: read down each column and look for numbers that are wildly uneven between groups.',
    options: {
      A: [
        { label: 'Too many of one group, too few of the others', correct: true },
        { label: 'The photos were blurry' },
        { label: 'The app is just broken' },
      ],
      B: [
        { label: 'Sampling bias — the data does not represent everyone', correct: true },
        { label: 'Label bias — humans tagged it wrong' },
        { label: 'A random glitch' },
        { label: 'There was simply too much data' },
      ],
      C: [
        { label: 'Sampling bias', correct: true },
        { label: 'Label bias' },
        { label: 'Proxy variable' },
        { label: 'Historical bias' },
        { label: 'Demographic-parity failure' },
      ],
    },
    namingReveal: 'Sampling bias: when the data collected does not represent the whole population, the model works well only for the group it saw most.',
    baseXP: 50,
  },

  // CASE 2 — Amazon hiring AI copying past prejudice
  {
    kind: 'investigate',
    id: 2,
    codename: 'The Copycat Recruiter',
    emoji: '💼',
    concept: 'What did the AI learn from the past?',
    sparky: 'A hiring AI studied years of old human decisions and copied them cold. Here are the résumés it trained on. Some got hired, some got tossed. Tap the tossed ones — I smell a pattern.',
    columns: ['Résumé', 'Standout words', 'Past humans decided'],
    rows: [
      ['#1', 'captain, coding', 'Hired'],
      ['#2', "women's chess club", 'Rejected'],
      ['#3', 'coding, captain', 'Hired'],
      ['#4', "women's soccer team", 'Rejected'],
      ['#5', 'coding club', 'Hired'],
    ],
    suspect: { mode: 'row', indices: [1, 3] },
    investigatePrompt: 'Tap the résumé rows that were unfairly rejected.',
    reveal: "Nailed it. Every résumé with the word “women’s” was rejected by the old human decisions. The AI copied that pattern and began downranking women — exactly what happened to Amazon’s real hiring AI, which was scrapped in 2018.",
    bandHint: 'Detective tip: compare the rows that were rejected — what word do they share that the hired ones do not?',
    options: {
      A: [
        { label: 'The AI copied unfair choices from the past', correct: true },
        { label: 'The AI picked people at random' },
        { label: 'The résumés were too long' },
      ],
      B: [
        { label: 'Historical bias — it learned old prejudice', correct: true },
        { label: 'Sampling bias — not enough résumés' },
        { label: 'Outliers — a few weird résumés' },
        { label: 'Missing data — blanks in the table' },
      ],
      C: [
        { label: 'Historical bias', correct: true },
        { label: 'Label bias' },
        { label: 'Sampling bias' },
        { label: 'Proxy variable' },
        { label: 'Demographic-parity failure' },
      ],
    },
    namingReveal: 'Historical bias: when past data records unfair human decisions, a model trained on it will repeat that unfairness into the future.',
    baseXP: 70,
  },

  // CASE 3 — ZIP-code proxy for a protected trait (the subtle one)
  {
    kind: 'investigate',
    id: 3,
    codename: 'The Sneaky Stand-In',
    emoji: '📮',
    concept: 'A neutral-looking column that leaks a secret',
    sparky: 'This loan model swears it never looks at race — see, the column even says No. And yet it keeps denying the same neighbourhoods. Something in this table is standing in for race. Find the stand-in.',
    columns: ['Applicant', 'Race used?', 'ZIP code', 'Loan approved?'],
    rows: [
      ['A', 'No', '90210', 'Approved'],
      ['B', 'No', '11434', 'Denied'],
      ['C', 'No', '90212', 'Approved'],
      ['D', 'No', '11433', 'Denied'],
      ['E', 'No', '90211', 'Approved'],
    ],
    suspect: { mode: 'column', indices: [2] },
    investigatePrompt: 'Tap the column secretly doing race’s job.',
    reveal: 'Sharp eyes. The model never reads race — but ZIP code stands in for it. Because neighbourhoods are often segregated, ZIP plus income can predict race and let the model discriminate anyway. A hidden stand-in like this is a proxy variable.',
    bandHint: 'Detective tip: the "Race used?" column says No everywhere — so which other column lines up perfectly with who gets approved?',
    options: {
      A: [
        { label: 'A hidden clue that secretly reveals a group', correct: true },
        { label: 'There are too few applicants' },
        { label: 'The ZIP codes are made up' },
      ],
      B: [
        { label: 'Proxy variable — ZIP stands in for race', correct: true },
        { label: 'Sampling bias — not enough people' },
        { label: 'Missing data — blank cells' },
        { label: 'It is actually fair, race is not used' },
      ],
      C: [
        { label: 'Proxy variable', correct: true },
        { label: 'Label bias' },
        { label: 'Sampling bias' },
        { label: 'Historical bias' },
        { label: 'It is fair — race is not a column' },
      ],
    },
    namingReveal: 'Proxy variable: a feature that looks neutral but is so tightly linked to a protected trait (like race) that using it discriminates indirectly.',
    baseXP: 110,
  },

  // CASE 4 — balanced data, unequal outcomes → demographic parity failure
  {
    kind: 'investigate',
    id: 4,
    codename: 'The Unequal Scoreboard',
    emoji: '🔓',
    concept: 'Balanced data, unequal outcomes',
    sparky: 'Face-unlock, tested fair and square — one thousand faces per group, nobody shorted on data. So why does everyone complain? The counts are even. Look past them. Tap where the story falls apart.',
    columns: ['Group', 'Faces tested', 'Unlocked correctly'],
    rows: [
      ['Light-skin men', '1,000', '99%'],
      ['Dark-skin men', '1,000', '90%'],
      ['Light-skin women', '1,000', '82%'],
      ['Dark-skin women', '1,000', '65%'],
    ],
    suspect: { mode: 'column', indices: [2] },
    investigatePrompt: 'The data is balanced — tap the column that still is not.',
    reveal: 'Case closed. The data was perfectly balanced — 1,000 faces each — but the results are not. It works almost every time for light-skin men and fails one time in three for dark-skin women. Even fair data can give unfair outcomes.',
    bandHint: 'Detective tip: the "Faces tested" column is equal for everyone, so the unfairness must live in the other number column.',
    options: {
      A: [
        { label: 'It works great for some groups, badly for others', correct: true },
        { label: 'There was not enough data' },
        { label: 'The camera is broken' },
      ],
      B: [
        { label: 'Performance is unequal across groups', correct: true },
        { label: 'Sampling bias — uneven data counts' },
        { label: 'Missing data — blank cells' },
        { label: 'Balanced data means it must be fair' },
      ],
      C: [
        { label: 'Demographic-parity failure', correct: true },
        { label: 'Sampling bias' },
        { label: 'Proxy variable' },
        { label: 'Historical bias' },
        { label: 'A single outlier row' },
      ],
    },
    namingReveal: 'Demographic parity: a fairness metric asking whether groups get positive outcomes at the same rate. Equal data does not guarantee it — you must measure the results, not just the inputs.',
    baseXP: 130,
  },

  // CASE 5 — the case-closing ritual (repurposed data-pipeline drag-order)
  {
    kind: 'ritual',
    id: 5,
    codename: 'Close the Case File',
    emoji: '🗂️',
    concept: 'File the evidence in order',
    sparky: 'Every case you cracked started as messy data. Before I stamp this file shut, put the AI pipeline in the order data really flows — so the next detective can follow your work.',
    stages: [
      { id: 'collect', label: 'Collect the data', color: '#3B82F6' },
      { id: 'clean', label: 'Clean out the errors', color: '#8B5CF6' },
      { id: 'label', label: 'Label the examples', color: '#F59E0B' },
      { id: 'train', label: 'Train the model', color: '#10B981' },
      { id: 'eval', label: 'Check (evaluate) the results', color: '#EF4444' },
    ],
    reveal: 'Filed and stamped. Collect → Clean → Label → Train → Check. Get this order wrong and bias sneaks in at every stage. You have got the eye for it now, detective.',
    baseXP: 150,
  },
];

const MAX_STARS = CASES.length * 3;

// ── Small pieces ─────────────────────────────────────────────────────────
function Sparky({ line }: { line: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-3"
      style={{ background: PANEL, border: `1px solid ${HAIR}` }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
        aria-hidden="true"
      >
        🕵️
      </div>
      <p className="text-sm italic leading-snug" style={{ color: BODY }}>
        <span style={{ color: AMBER, fontStyle: 'normal', fontWeight: 700 }}>Sparky:</span>{' '}
        {line}
      </p>
    </div>
  );
}

function StarRow({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          style={{
            width: size, height: size,
            color: s <= count ? '#FFD93D' : HAIR,
            fill: s <= count ? '#FFD93D' : 'none',
          }}
        />
      ))}
    </span>
  );
}

function starsFor(pct: number): 1 | 2 | 3 {
  if (pct >= 0.88) return 3;
  if (pct >= 0.68) return 2;
  return 1;
}

// ── Investigation case ───────────────────────────────────────────────────
function InvestigationCaseView({
  def, band, onSolve, onExit,
}: {
  def: InvestigationCase; band: Band; onSolve: (r: CaseResult) => void; onExit: () => void;
}) {
  const [phase, setPhase] = useState<'investigate' | 'name' | 'result'>('investigate');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [chosen, setChosen] = useState<number | null>(null);
  const startRef = useRef<number>(Date.now());

  const options = def.options[band];
  const correctSet = useMemo(() => new Set(def.suspect.indices), [def]);
  const targetCount = def.suspect.mode === 'column' ? def.columns.length : def.rows.length;

  const toggle = useCallback((idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  // Scoring: investigation (0–50) + naming (0–50).
  const result: CaseResult = useMemo(() => {
    const hits = [...selected].filter((i) => correctSet.has(i)).length;
    const wrong = [...selected].filter((i) => !correctSet.has(i)).length;
    const investPct = correctSet.size === 0 ? 0 : hits / correctSet.size;
    const investScore = Math.max(0, Math.round(50 * investPct) - 8 * wrong);
    const nameScore = chosen !== null && options[chosen]?.correct ? 50 : 0;
    const score = investScore + nameScore;
    const stars = starsFor(score / 100);
    return { score, stars, xp: Math.round(def.baseXP * (stars / 3)) };
  }, [selected, correctSet, chosen, options, def]);

  const namedCorrectly = chosen !== null && options[chosen]?.correct;

  return (
    <div className="space-y-4">
      {/* Case header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2"
          style={{ color: MUTE, ['--tw-ring-color' as string]: ACCENT }}
          aria-label="Back to the evidence board"
        >
          <ChevronLeft className="h-4 w-4" /> Board
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{def.emoji}</span>
          <div>
            <h2 className="text-base font-bold leading-tight" style={{ color: INK }}>
              Case {def.id}: {def.codename}
            </h2>
            <p className="text-xs" style={{ color: MUTE }}>{def.concept}</p>
          </div>
        </div>
      </div>

      <Sparky line={def.sparky} />

      {/* Instruction */}
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: AMBER }}>
        <Search className="h-4 w-4" />
        {phase === 'investigate' ? def.investigatePrompt : 'Name the bias you found.'}
      </div>
      {phase === 'investigate' && band === 'A' && (
        <p className="text-xs" style={{ color: MUTE }}>{def.bandHint}</p>
      )}

      {/* Evidence table */}
      <div
        className="overflow-x-auto rounded-2xl p-2"
        style={{ background: SURFACE, border: `1px solid ${HAIR}` }}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {def.columns.map((col, ci) => {
                const isColMode = def.suspect.mode === 'column';
                const picked = isColMode && selected.has(ci);
                const isCorrect = correctSet.has(ci);
                const revealed = phase !== 'investigate' && isColMode;
                const style: React.CSSProperties = {
                  color: INK, borderBottom: `1px solid ${HAIR}`,
                  background: revealed
                    ? (isCorrect ? `${GOOD}22` : picked ? `${BAD}18` : 'transparent')
                    : (picked ? `${ACCENT}30` : 'transparent'),
                  outline: revealed && isCorrect ? `2px solid ${GOOD}` : picked ? `2px solid ${ACCENT}` : 'none',
                };
                return (
                  <th key={ci} className="p-0" style={{ verticalAlign: 'bottom' }}>
                    {isColMode ? (
                      <button
                        onClick={phase === 'investigate' ? () => toggle(ci) : undefined}
                        disabled={phase !== 'investigate'}
                        aria-pressed={picked}
                        aria-label={`Column: ${col}${picked ? ', selected as suspicious' : ''}`}
                        className="w-full rounded-lg px-2 py-2 text-left text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
                        style={{ ...style, ['--tw-ring-color' as string]: ACCENT, cursor: phase === 'investigate' ? 'pointer' : 'default' }}
                      >
                        <span className="flex items-center gap-1">
                          {revealed && isCorrect && <Check className="h-3.5 w-3.5" style={{ color: GOOD }} />}
                          {revealed && !isCorrect && picked && <X className="h-3.5 w-3.5" style={{ color: BAD }} />}
                          {col}
                        </span>
                      </button>
                    ) : (
                      <div className="px-2 py-2 text-left text-xs font-bold" style={{ color: INK, borderBottom: `1px solid ${HAIR}` }}>
                        {col}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {def.rows.map((row, ri) => {
              const isRowMode = def.suspect.mode === 'row';
              const picked = isRowMode && selected.has(ri);
              const isCorrect = correctSet.has(ri);
              const revealed = phase !== 'investigate' && isRowMode;
              const rowBg = revealed
                ? (isCorrect ? `${GOOD}1E` : picked ? `${BAD}18` : 'transparent')
                : (picked ? `${ACCENT}26` : ri % 2 ? 'rgba(255,255,255,0.03)' : 'transparent');
              const rowContent = row.map((cell, ci) => {
                const colPicked = def.suspect.mode === 'column' && selected.has(ci);
                const colCorrect = def.suspect.mode === 'column' && correctSet.has(ci) && phase !== 'investigate';
                return (
                  <td
                    key={ci}
                    className="px-3 py-2"
                    style={{
                      color: BODY,
                      background: colCorrect ? `${GOOD}14` : colPicked ? `${ACCENT}18` : 'transparent',
                      borderBottom: `1px solid ${HAIR}`,
                    }}
                  >
                    {cell}
                  </td>
                );
              });
              if (isRowMode) {
                return (
                  <tr key={ri}>
                    <td colSpan={def.columns.length} className="p-0">
                      <button
                        onClick={phase === 'investigate' ? () => toggle(ri) : undefined}
                        disabled={phase !== 'investigate'}
                        aria-pressed={picked}
                        aria-label={`Row ${row.join(', ')}${picked ? ', selected as suspicious' : ''}`}
                        className="grid w-full items-center rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          gridTemplateColumns: `repeat(${def.columns.length}, minmax(0, 1fr))`,
                          background: rowBg,
                          outline: revealed && isCorrect ? `2px solid ${GOOD}` : picked ? `2px solid ${ACCENT}` : 'none',
                          ['--tw-ring-color' as string]: ACCENT,
                          cursor: phase === 'investigate' ? 'pointer' : 'default',
                        }}
                      >
                        {row.map((cell, ci) => (
                          <span key={ci} className="flex items-center gap-1 px-3 py-2 text-sm" style={{ color: BODY }}>
                            {ci === 0 && revealed && isCorrect && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: GOOD }} />}
                            {ci === 0 && revealed && !isCorrect && picked && <X className="h-3.5 w-3.5 shrink-0" style={{ color: BAD }} />}
                            {cell}
                          </span>
                        ))}
                      </button>
                    </td>
                  </tr>
                );
              }
              return <tr key={ri} style={{ background: rowBg }}>{rowContent}</tr>;
            })}
          </tbody>
        </table>
      </div>

      {/* Reveal (announced) */}
      <div aria-live="polite">
        {phase !== 'investigate' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-3 text-sm leading-snug"
            style={{ background: `${GOOD}14`, border: `1px solid ${GOOD}44`, color: INK }}
          >
            <Fingerprint className="mr-1 inline h-4 w-4" style={{ color: GOOD }} /> {def.reveal}
          </motion.div>
        )}
      </div>

      {/* Investigate → commit */}
      {phase === 'investigate' && (
        <SFButton
          variant="primary" size="lg" className="w-full"
          onClick={() => setPhase('name')}
          disabled={selected.size === 0}
        >
          <Scale className="mr-2 h-5 w-5" /> Make the accusation
        </SFButton>
      )}

      {/* Name the bias */}
      {phase === 'name' && (
        <div className="space-y-2" role="radiogroup" aria-label="Name the bias type">
          {options.map((opt, oi) => {
            const isChosen = chosen === oi;
            return (
              <button
                key={oi}
                role="radio"
                aria-checked={isChosen}
                onClick={() => setChosen(oi)}
                className="w-full rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: isChosen ? `${ACCENT}26` : CELL,
                  border: `2px solid ${isChosen ? ACCENT : HAIR}`,
                  color: INK,
                  ['--tw-ring-color' as string]: ACCENT,
                }}
              >
                {opt.label}
              </button>
            );
          })}
          <SFButton
            variant="primary" size="lg" className="mt-1 w-full"
            onClick={() => setPhase('result')}
            disabled={chosen === null}
          >
            Close the case <ChevronRight className="ml-2 h-5 w-5" />
          </SFButton>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="space-y-3 rounded-2xl p-4 text-center"
          style={{ background: SURFACE, border: `1px solid ${namedCorrectly ? GOOD : AMBER}55` }}
        >
          <div className="flex justify-center"><StarRow count={result.stars} size={28} /></div>
          <p className="text-sm" style={{ color: BODY }} aria-live="polite">
            {namedCorrectly
              ? 'Right call, detective.'
              : 'Not the name I had — but every good detective learns from a case.'}
          </p>
          <p className="rounded-xl p-2 text-xs leading-snug" style={{ background: PANEL, color: MUTE }}>
            {def.namingReveal}
          </p>
          <p className="text-xs" style={{ color: MUTE }}>
            Case score {result.score}/100 &middot; +{result.xp} XP
          </p>
          <SFButton variant="primary" size="lg" className="w-full" onClick={() => onSolve(result)}>
            <FileCheck2 className="mr-2 h-5 w-5" /> Back to the board
          </SFButton>
        </motion.div>
      )}
    </div>
  );
}

// ── Closing ritual: reorder the AI pipeline (keyboard-friendly) ──────────
function RitualCaseView({
  def, onSolve, onExit,
}: {
  def: RitualCase; onSolve: (r: CaseResult) => void; onExit: () => void;
}) {
  const correct = def.stages;
  // Start shuffled (deterministic non-identity rotation so it is never pre-solved).
  const [order, setOrder] = useState<string[]>(() => {
    const ids = correct.map((s) => s.id);
    return [...ids.slice(2), ...ids.slice(0, 2)];
  });
  const [locked, setLocked] = useState<CaseResult | null>(null);
  const byId = useMemo(() => new Map(correct.map((s) => [s.id, s])), [correct]);

  const move = useCallback((from: number, to: number) => {
    if (to < 0 || to >= correct.length) return;
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, [correct.length]);

  const lockIn = useCallback(() => {
    const right = order.filter((id, i) => correct[i].id === id).length;
    const pct = right / correct.length;
    const score = Math.round(pct * 100);
    const stars = pct === 1 ? 3 : pct >= 0.6 ? 2 : 1;
    setLocked({ score, stars: stars as 1 | 2 | 3, xp: Math.round(def.baseXP * (stars / 3)) });
  }, [order, correct, def]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2"
          style={{ color: MUTE, ['--tw-ring-color' as string]: ACCENT }}
          aria-label="Back to the evidence board"
        >
          <ChevronLeft className="h-4 w-4" /> Board
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{def.emoji}</span>
          <div>
            <h2 className="text-base font-bold leading-tight" style={{ color: INK }}>
              Case {def.id}: {def.codename}
            </h2>
            <p className="text-xs" style={{ color: MUTE }}>{def.concept}</p>
          </div>
        </div>
      </div>

      <Sparky line={def.sparky} />

      <ol className="space-y-2" aria-label="Data pipeline order">
        {order.map((id, i) => {
          const stage = byId.get(id)!;
          const inPlace = locked && correct[i].id === id;
          const wrongPlace = locked && correct[i].id !== id;
          return (
            <li
              key={id}
              className="flex items-center gap-2 rounded-xl p-2"
              style={{
                background: CELL,
                border: `2px solid ${inPlace ? GOOD : wrongPlace ? BAD : `${stage.color}66`}`,
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: `${stage.color}33`, color: INK }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-semibold" style={{ color: INK }}>{stage.label}</span>
              {locked && (inPlace
                ? <Check className="h-4 w-4" style={{ color: GOOD }} />
                : <X className="h-4 w-4" style={{ color: BAD }} />)}
              {!locked && (
                <span className="flex gap-1">
                  <button
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Move ${stage.label} up`}
                    className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-30"
                    style={{ color: INK, background: PANEL, ['--tw-ring-color' as string]: ACCENT }}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(i, i + 1)}
                    disabled={i === order.length - 1}
                    aria-label={`Move ${stage.label} down`}
                    className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-30"
                    style={{ color: INK, background: PANEL, ['--tw-ring-color' as string]: ACCENT }}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div aria-live="polite">
        {locked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-2xl p-4 text-center"
            style={{ background: SURFACE, border: `1px solid ${locked.stars === 3 ? GOOD : AMBER}55` }}
          >
            <div className="flex justify-center"><StarRow count={locked.stars} size={28} /></div>
            <p className="rounded-xl p-2 text-xs leading-snug" style={{ background: PANEL, color: MUTE }}>
              <Fingerprint className="mr-1 inline h-4 w-4" style={{ color: GOOD }} /> {def.reveal}
            </p>
            <p className="text-xs" style={{ color: MUTE }}>Order score {locked.score}/100 &middot; +{locked.xp} XP</p>
            <SFButton variant="primary" size="lg" className="w-full" onClick={() => onSolve(locked)}>
              <FileCheck2 className="mr-2 h-5 w-5" /> Back to the board
            </SFButton>
          </motion.div>
        )}
      </div>

      {!locked && (
        <SFButton variant="primary" size="lg" className="w-full" onClick={lockIn}>
          <FileCheck2 className="mr-2 h-5 w-5" /> Lock in the order
        </SFButton>
      )}
    </div>
  );
}

// ── Evidence board (home) ────────────────────────────────────────────────
function EvidenceBoard({
  solved, onOpen,
}: {
  solved: Record<number, CaseResult>; onOpen: (index: number) => void;
}) {
  const solvedCount = Object.keys(solved).length;
  const totalStars = Object.values(solved).reduce((s, r) => s + r.stars, 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
          style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
          aria-hidden="true"
        >
          🔍
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: INK }}>The Bias Case Board</h2>
          <div className="flex items-center gap-2 text-xs" style={{ color: MUTE }}>
            <Star className="h-3 w-3" style={{ color: '#FFD93D', fill: '#FFD93D' }} />
            {totalStars}/{MAX_STARS} stars
            <span>&middot;</span>
            {solvedCount}/{CASES.length} cases cracked
          </div>
        </div>
      </div>

      <Sparky line="Five open cases on the board, detective. Each one is a real way AI goes wrong. Crack them in order — solve one to unlock the next." />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CASES.map((c, i) => {
          const done = solved[c.id];
          const unlocked = i === 0 || Boolean(solved[CASES[i - 1].id]);
          return (
            <button
              key={c.id}
              onClick={unlocked ? () => onOpen(i) : undefined}
              aria-disabled={!unlocked}
              aria-label={
                unlocked
                  ? `Case ${c.id}: ${c.codename}, ${c.concept}${done ? `, solved, ${done.stars} of 3 stars` : ', not yet solved'}`
                  : `Case ${c.id}: ${c.codename}, locked — solve the previous case to unlock`
              }
              className="flex items-center gap-3 rounded-2xl p-3 text-left transition-transform focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: unlocked ? SURFACE : PANEL,
                border: `1px solid ${done ? `${GOOD}55` : unlocked ? `${ACCENT}44` : HAIR}`,
                opacity: unlocked ? 1 : 0.55,
                cursor: unlocked ? 'pointer' : 'not-allowed',
                ['--tw-ring-color' as string]: ACCENT,
              }}
            >
              <span className="flex h-8 w-8 items-center justify-center text-2xl" aria-hidden="true">
                {unlocked ? c.emoji : <Lock className="h-5 w-5" style={{ color: MUTE }} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-bold" style={{ color: INK }}>
                  {!unlocked && <Lock className="h-3 w-3" style={{ color: MUTE }} />}
                  Case {c.id}: {c.codename}
                </span>
                <span className="block truncate text-xs" style={{ color: MUTE }}>{c.concept}</span>
              </span>
              {done ? <StarRow count={done.stars} /> : unlocked && <ChevronRight className="h-4 w-4" style={{ color: ACCENT }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Completion overlay ───────────────────────────────────────────────────
function AllComplete({
  totalStars, totalXP, onReplay,
}: {
  totalStars: number; totalXP: number; onReplay: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,7,16,0.72)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div
        role="dialog" aria-modal="true"
        aria-label={`All cases closed: ${totalStars} of ${MAX_STARS} stars, ${totalXP} XP`}
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: SURFACE, border: `1px solid ${ACCENT}55`, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
        initial={{ scale: 0.6, y: 30 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: `${AMBER}22`, border: `1px solid ${AMBER}66` }}>
          🕵️
        </div>
        <h3 className="mb-1 text-xl font-bold" style={{ color: INK }}>
          <Sparkles className="mr-1 inline h-5 w-5" style={{ color: AMBER }} /> Every Case Closed
        </h3>
        <p className="mb-3 text-sm" style={{ color: BODY }}>
          You spotted sampling skew, historical prejudice, a hidden proxy, and an unfair scoreboard — then filed it all in order. That is a real bias detective.
        </p>
        <div className="mb-2 flex justify-center">
          <StarRow count={Math.round((totalStars / MAX_STARS) * 3)} size={26} />
        </div>
        <p className="mb-4 text-sm" style={{ color: MUTE }}>
          <strong style={{ color: INK }}>{totalStars}</strong>/{MAX_STARS} stars &middot; <strong style={{ color: AMBER }}>{totalXP} XP</strong>
        </p>
        <SFButton variant="primary" size="lg" className="w-full" onClick={onReplay}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reopen the case board
        </SFButton>
      </motion.div>
    </motion.div>
  );
}

// ── Orchestrator ─────────────────────────────────────────────────────────
export default function DataDetectiveGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const [solved, setSolved] = useState<Record<number, CaseResult>>({});
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0); // forces case remount → clean reset
  const firedRef = useRef(false);

  const totalStars = Object.values(solved).reduce((s, r) => s + r.stars, 0);
  const totalXP = Object.values(solved).reduce((s, r) => s + r.xp, 0);
  const allDone = Object.keys(solved).length === CASES.length;

  const openCase = useCallback((index: number) => {
    setActiveIndex(index);
    setAttempt((a) => a + 1);
  }, []);

  const solveCase = useCallback((caseId: number, r: CaseResult) => {
    setSolved((prev) => {
      const existing = prev[caseId];
      // Keep the best attempt.
      if (existing && (existing.stars > r.stars || (existing.stars === r.stars && existing.score >= r.score))) {
        return prev;
      }
      return { ...prev, [caseId]: r };
    });
    setActiveIndex(null);
  }, []);

  // Fire XP + completion exactly once when every case is cracked.
  useEffect(() => {
    if (!allDone || firedRef.current) return;
    firedRef.current = true;
    awardXP(totalXP);
    const stars: 1 | 2 | 3 = totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1;
    completeGame('data-detective', stars);
  }, [allDone, totalXP, totalStars, awardXP, completeGame]);

  const replay = useCallback(() => {
    firedRef.current = false;
    setSolved({});
    setActiveIndex(null);
  }, []);

  const activeCase = activeIndex !== null ? CASES[activeIndex] : null;

  return (
    <GameShell title="Data Detective" color={ACCENT} labNum={2}>
      <div className="relative p-4">
        {activeCase ? (
          activeCase.kind === 'investigate' ? (
            <InvestigationCaseView
              key={`${activeCase.id}-${attempt}`}
              def={activeCase}
              band={band}
              onSolve={(r) => solveCase(activeCase.id, r)}
              onExit={() => setActiveIndex(null)}
            />
          ) : (
            <RitualCaseView
              key={`${activeCase.id}-${attempt}`}
              def={activeCase}
              onSolve={(r) => solveCase(activeCase.id, r)}
              onExit={() => setActiveIndex(null)}
            />
          )
        ) : (
          <EvidenceBoard solved={solved} onOpen={openCase} />
        )}

        <AnimatePresence>
          {allDone && activeIndex === null && (
            <AllComplete totalStars={totalStars} totalXP={totalXP} onReplay={replay} />
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
