// ════════════════════════════════════════════════════════════════════════
// TRACE IT — Lab 10 (AI Literacy) — NEW-2 (rebuild plan §II.7)
// ════════════════════════════════════════════════════════════════════════
// AI-search citation literacy. An "AI Overview" answer box responds to a
// homework-style question with a confident answer and 1–3 cited sources.
// Some answers are right; some are confidently WRONG; some cite a source
// that does not actually say what the AI claims; some cite a source that
// never mentions the topic at all (a fabricated citation); and some cite two
// sources that flat-out disagree.
//
// The child does the thing almost nobody does with AI search: CHECKS THE
// SOURCE. They click through a citation to open the (mock, DOM-drawn) article
// card, read the snippet lines, and highlight the ONE line that supports or
// contradicts the AI's claim — or declare that nothing in the source backs it
// up. Then they rule:
//   • TRUST — the source really backs the answer.
//   • FIX   — the source says something different (pick the corrected answer).
//   • FLAG  — the source does not support it / is made up / sources disagree.
//
// G1 honesty: the verdict is NOT pre-shown. The child inspects and commits;
// the reveal (right / subtly wrong / unsupported citation) comes AFTER.
// Sparky is a friendly librarian guide. ~5 rounds escalate:
//   1 obviously-right → 2 confidently-wrong-with-real-source →
//   3 right-tone-but-misquoted-source → 4 fabricated citation →
//   5 two sources that disagree.
//
// Band diff (B/C): band B gives clearer mismatches and a per-round hint;
// band C uses subtle misquotes (numbers you must compare), fabricated
// citations with tempting-but-off lines, and quietly-disagreeing sources.
//
// DOM only (no 3D/canvas). ARIA + keyboard-operable; reveals are aria-live.
// Reports XP + 1–3 stars exactly once via useGameActions().awardXP +
// completeGame('trace-it', stars).

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Search, Sparkles, ExternalLink, ChevronDown, ShieldCheck,
  Wrench, Flag, CircleSlash, Check, X, Star, RotateCcw, ArrowRight,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFButton } from '@/components/ui/SFButton';

// ── Palette (dark surface, Lab 10 accent) ────────────────────────────────
const ACCENT = '#DE5AEA';
const SURFACE = '#0E1428';
const PANEL = '#141B33';
const CELL = '#101836';
const INK = '#EAF0F6';
const MUTE = '#9AA4BE';
const GOOD = '#2ECC71';
const BAD = '#FF5C6C';
const AMBER = '#F6B44C';
const HAIR = 'rgba(255,255,255,0.12)';

type Band = 'B' | 'C';
type Verdict = 'trust' | 'fix' | 'flag';
type LineRole = 'support' | 'contradict' | 'absent';

interface SnippetLine {
  text: string;
  role: LineRole;
}

interface Source {
  id: string;
  title: string;
  site: string;
  lines: Record<Band, SnippetLine[]>;
}

/** The decisive evidence the child should mark: a specific line, or 'none'
 *  (the source(s) do not back the claim at all). */
type KeyEvidence = { sourceId: string; lineIndex: number } | 'none';

interface Round {
  id: number;
  question: string;
  aiAnswer: string;
  sources: Source[];
  verdict: Verdict;
  key: Record<Band, KeyEvidence>;
  /** A corrected-answer picker shown whenever the child rules FIX. Present on
   *  every round (so its presence never leaks the answer). fixCorrect is only
   *  meaningful when verdict === 'fix'. */
  fixOptions: string[];
  fixCorrect: number;
  bandHint: string;
  reveal: string;
  baseXP: number;
}

interface RoundResult {
  score: number;
  stars: 1 | 2 | 3;
  xp: number;
}

// Shorthand for a source whose snippet reads the same to both bands.
const both = (lines: SnippetLine[]): Record<Band, SnippetLine[]> => ({ B: lines, C: lines });

// ── The rounds (escalating) ──────────────────────────────────────────────
const ROUNDS: Round[] = [
  // ROUND 1 — obviously right. Source clearly backs the answer → TRUST.
  {
    id: 1,
    question: 'How many bones are in an adult human body?',
    aiAnswer: 'An adult human body has 206 bones.',
    sources: [
      {
        id: 's1',
        title: 'The Human Skeleton',
        site: 'kidshealth.org',
        lines: both([
          { text: 'Babies are born with about 300 bones.', role: 'absent' },
          { text: 'As kids grow, some of those bones fuse together.', role: 'absent' },
          { text: 'By adulthood, the human body has 206 bones.', role: 'support' },
        ]),
      },
    ],
    verdict: 'trust',
    key: { B: { sourceId: 's1', lineIndex: 2 }, C: { sourceId: 's1', lineIndex: 2 } },
    fixOptions: ['206 bones', '300 bones', '256 bones'],
    fixCorrect: -1,
    bandHint: 'Open the source and find the line with a number. If it matches the AI (206), you can Trust it.',
    reveal: 'Good trace. The AI said 206, and the source clearly says 206 bones by adulthood. Tone AND source agree — this one earns your trust.',
    baseXP: 40,
  },

  // ROUND 2 — confidently WRONG, but the cited source is real → FIX.
  {
    id: 2,
    question: 'What is the largest planet in our solar system?',
    aiAnswer: 'The largest planet in our solar system is Saturn.',
    sources: [
      {
        id: 's1',
        title: 'Planets Ranked by Size',
        site: 'spacefacts.org',
        lines: {
          B: [
            { text: 'Jupiter is the largest planet in the solar system.', role: 'contradict' },
            { text: 'Saturn is the second largest and is famous for its rings.', role: 'absent' },
            { text: 'Mercury is the smallest planet.', role: 'absent' },
          ],
          C: [
            { text: 'Jupiter measures about 139,820 km across — the widest of any planet.', role: 'contradict' },
            { text: 'Saturn comes next at roughly 116,460 km across.', role: 'absent' },
            { text: 'These two gas giants dwarf the rocky inner planets.', role: 'absent' },
          ],
        },
      },
    ],
    verdict: 'fix',
    key: { B: { sourceId: 's1', lineIndex: 0 }, C: { sourceId: 's1', lineIndex: 0 } },
    fixOptions: ['Jupiter', 'Saturn', 'Neptune'],
    fixCorrect: 0,
    bandHint: 'The AI sounds sure of itself. Read the source anyway — does it name the SAME planet the AI did?',
    reveal: 'Nice catch. The AI confidently said Saturn, but the source says Jupiter is biggest — Saturn is only second. A confident tone is not proof. You fixed it to Jupiter.',
    baseXP: 70,
  },

  // ROUND 3 — right tone, but the number is MISQUOTED from a real source → FIX.
  {
    id: 3,
    question: 'How much water should kids drink each day?',
    aiAnswer: 'Doctors say kids should drink 10 glasses of water every day.',
    sources: [
      {
        id: 's1',
        title: 'Family Health Guide: Staying Hydrated',
        site: 'familyhealth.org',
        lines: {
          B: [
            { text: 'Most kids need about 6 to 8 glasses of water a day — not 10.', role: 'contradict' },
            { text: 'Active kids on hot days may need a little extra.', role: 'absent' },
            { text: 'Sugary drinks do not count toward this.', role: 'absent' },
          ],
          C: [
            { text: 'Most kids need about six to eight glasses of water a day.', role: 'contradict' },
            { text: 'Water needs go up during sports or in hot weather.', role: 'absent' },
            { text: 'Milk and watery fruits help you reach the goal too.', role: 'absent' },
          ],
        },
      },
    ],
    verdict: 'fix',
    key: { B: { sourceId: 's1', lineIndex: 0 }, C: { sourceId: 's1', lineIndex: 0 } },
    fixOptions: ['6 to 8 glasses', '10 glasses', '2 glasses'],
    fixCorrect: 0,
    bandHint: 'The AI states a number like it came from the source. Check the source — is that the number it really gives?',
    reveal: 'Traced it. The source says 6 to 8 glasses — the AI stretched that into "10." The wording sounded official, but the number was changed. You fixed it back to 6 to 8.',
    baseXP: 90,
  },

  // ROUND 4 — FABRICATED citation. The source is real but never mentions the
  // claim at all → nothing supports it → FLAG.
  {
    id: 4,
    question: 'Do goldfish really have a 3-second memory?',
    aiAnswer: 'According to Ocean Science Weekly, goldfish have a memory of only 3 seconds.',
    sources: [
      {
        id: 's1',
        title: 'All About Goldfish',
        site: 'oceanscienceweekly.com',
        lines: {
          B: [
            { text: 'Goldfish were first bred from carp in China long ago.', role: 'absent' },
            { text: 'In a large pond, a goldfish can grow over 30 cm long.', role: 'absent' },
            { text: 'A well-kept goldfish can live for more than 10 years.', role: 'absent' },
          ],
          C: [
            { text: 'Goldfish have sharp eyesight and can even see some colors.', role: 'absent' },
            { text: 'They were first bred from carp in China centuries ago.', role: 'absent' },
            { text: 'A healthy goldfish can live for more than a decade.', role: 'absent' },
          ],
        },
      },
    ],
    verdict: 'flag',
    key: { B: 'none', C: 'none' },
    fixOptions: ['3 seconds', 'several months', 'a few minutes'],
    fixCorrect: -1,
    bandHint: 'The AI named a specific source. Open it and hunt for the "3 seconds" claim. What if it is not in there at all?',
    reveal: 'Flagged, and rightly. The article is all about goldfish — but it never mentions memory or "3 seconds" anywhere. The AI invented a source that does not say what it claims. (For the record, goldfish memory actually lasts months.)',
    baseXP: 110,
  },

  // ROUND 5 — two cited sources that DISAGREE → the confident answer is not
  // trustworthy → FLAG. Decisive line = the one exposing the conflict.
  {
    id: 5,
    question: 'Is Pluto a planet?',
    aiAnswer: 'Yes — Pluto is the ninth planet in our solar system.',
    sources: [
      {
        id: 's1',
        title: 'Astronomy Handbook',
        site: 'starfield-press.com',
        lines: {
          B: [
            { text: 'Pluto is the ninth planet — small, icy, and far from the Sun.', role: 'support' },
            { text: 'It takes 248 Earth-years to orbit the Sun once.', role: 'absent' },
          ],
          C: [
            { text: 'Older textbooks listed Pluto as the ninth planet.', role: 'support' },
            { text: 'Its stretched orbit sometimes crosses inside Neptune’s path.', role: 'absent' },
          ],
        },
      },
      {
        id: 's2',
        title: 'Space Union News',
        site: 'spaceunion.org',
        lines: {
          B: [
            { text: 'In 2006, scientists reclassified Pluto as a dwarf planet, not a full planet.', role: 'contradict' },
            { text: 'It is one of several dwarf planets out past Neptune.', role: 'absent' },
          ],
          C: [
            { text: 'Since a 2006 vote, Pluto is officially a dwarf planet.', role: 'contradict' },
            { text: 'The change was about its small size and crowded orbit.', role: 'absent' },
          ],
        },
      },
    ],
    verdict: 'flag',
    key: { B: { sourceId: 's2', lineIndex: 0 }, C: { sourceId: 's2', lineIndex: 0 } },
    fixOptions: ['a dwarf planet', 'the ninth planet', 'a moon of Neptune'],
    fixCorrect: -1,
    bandHint: 'This AI cited TWO sources. Open both. What should you do when they do not agree with each other?',
    reveal: 'Sharp. One source calls Pluto the ninth planet; the other says it was reclassified as a dwarf planet in 2006. When an AI’s own sources contradict each other, the confident answer is not trustworthy — you were right to flag it.',
    baseXP: 130,
  },
];

const MAX_STARS = ROUNDS.length * 3;

// ── Small pieces ─────────────────────────────────────────────────────────
function starsFor(pct: number): 1 | 2 | 3 {
  if (pct >= 0.88) return 3;
  if (pct >= 0.6) return 2;
  return 1;
}

function StarRow({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          style={{
            width: size,
            height: size,
            color: s <= count ? '#FFD93D' : HAIR,
            fill: s <= count ? '#FFD93D' : 'none',
          }}
        />
      ))}
    </span>
  );
}

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
        📚
      </div>
      <p className="text-sm leading-snug" style={{ color: INK }}>
        <span style={{ color: ACCENT, fontWeight: 700 }}>Sparky:</span>{' '}
        <span style={{ color: MUTE }}>{line}</span>
      </p>
    </div>
  );
}

// ── One round ────────────────────────────────────────────────────────────
function RoundView({
  round,
  band,
  index,
  total,
  onSolve,
}: {
  round: Round;
  band: Band;
  index: number;
  total: number;
  onSolve: (r: RoundResult) => void;
}) {
  const [openSources, setOpenSources] = useState<Set<string>>(new Set());
  // The line the child marks as decisive, or 'none', or null (unset).
  const [mark, setMark] = useState<KeyEvidence | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [fixChoice, setFixChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const key = round.key[band];

  const toggleSource = useCallback((id: string) => {
    setOpenSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const markLine = useCallback((sourceId: string, lineIndex: number) => {
    if (revealed) return;
    setMark((prev) =>
      prev && prev !== 'none' && prev.sourceId === sourceId && prev.lineIndex === lineIndex
        ? null
        : { sourceId, lineIndex },
    );
  }, [revealed]);

  const sameMark = useCallback(
    (k: KeyEvidence): boolean => {
      if (mark === null) return false;
      if (k === 'none' || mark === 'none') return k === mark;
      return k.sourceId === mark.sourceId && k.lineIndex === mark.lineIndex;
    },
    [mark],
  );

  const canCommit =
    mark !== null && verdict !== null && (verdict !== 'fix' || fixChoice !== null);

  const result: RoundResult = useMemo(() => {
    const highlightCorrect = sameMark(key);
    const verdictCorrect = verdict === round.verdict;
    let score = 0;
    if (highlightCorrect) score += 50;
    if (verdictCorrect) {
      if (round.verdict === 'fix') {
        score += 25;
        if (fixChoice === round.fixCorrect) score += 25;
      } else {
        score += 50;
      }
    }
    const stars = starsFor(score / 100);
    return { score, stars, xp: Math.round(round.baseXP * (stars / 3)) };
  }, [sameMark, key, verdict, round, fixChoice]);

  const verdictCorrect = verdict === round.verdict;

  const verdictDefs: { id: Verdict; label: string; hint: string; Icon: typeof ShieldCheck; color: string }[] = [
    { id: 'trust', label: 'Trust', hint: 'The source backs it up', Icon: ShieldCheck, color: GOOD },
    { id: 'fix', label: 'Fix', hint: 'Source says something different', Icon: Wrench, color: AMBER },
    { id: 'flag', label: 'Flag', hint: 'Source does not support it', Icon: Flag, color: BAD },
  ];

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: MUTE }}>
          Question {index + 1} of {total}
        </span>
        <span className="flex gap-1" aria-hidden="true">
          {ROUNDS.map((r, i) => (
            <span
              key={r.id}
              className="h-1.5 w-6 rounded-full"
              style={{ background: i <= index ? ACCENT : HAIR }}
            />
          ))}
        </span>
      </div>

      <Sparky
        line={
          index === 0
            ? 'Welcome to the reference desk. An AI answer box below is doing homework help. It sounds sure of itself — but our job is to check the sources it cites, not just trust the confident voice.'
            : band === 'B'
              ? round.bandHint
              : 'Another confident answer. Open every source it cites and read carefully before you rule.'
        }
      />

      {/* AI Overview box */}
      <div
        className="rounded-2xl p-3"
        style={{ background: SURFACE, border: `1px solid ${ACCENT}55` }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ACCENT }}>
            AI Overview
          </span>
        </div>
        <p className="text-sm font-semibold" style={{ color: MUTE }}>{round.question}</p>
        <p className="mt-1 text-base font-bold leading-snug" style={{ color: INK }}>
          {round.aiAnswer}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: MUTE }}>Cited:</span>
          {round.sources.map((src) => (
            <button
              key={src.id}
              onClick={() => {
                setOpenSources((prev) => new Set(prev).add(src.id));
                if (typeof document !== 'undefined') {
                  document.getElementById(`src-${round.id}-${src.id}`)?.scrollIntoView({ block: 'nearest' });
                }
              }}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: `${ACCENT}18`,
                border: `1px solid ${ACCENT}44`,
                color: INK,
                ['--tw-ring-color' as string]: ACCENT,
              }}
              aria-label={`Open cited source: ${src.title} from ${src.site}`}
            >
              <ExternalLink className="h-3 w-3" style={{ color: ACCENT }} />
              {src.site}
            </button>
          ))}
        </div>
      </div>

      {/* Instruction */}
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: ACCENT }}>
        <Search className="h-4 w-4" />
        {revealed ? 'Here is what the source really said.' : 'Open each source and mark the line that decides it.'}
      </div>

      {/* Source cards */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: MUTE }}>
          <BookOpen className="h-3.5 w-3.5" /> The sources
        </div>
        {round.sources.map((src) => {
          const open = openSources.has(src.id) || revealed;
          const lines = src.lines[band];
          return (
            <div
              key={src.id}
              id={`src-${round.id}-${src.id}`}
              className="overflow-hidden rounded-2xl"
              style={{ background: PANEL, border: `1px solid ${HAIR}` }}
            >
              <button
                onClick={() => toggleSource(src.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2"
                style={{ color: INK, ['--tw-ring-color' as string]: ACCENT }}
              >
                <ExternalLink className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold" style={{ color: INK }}>{src.title}</span>
                  <span className="block truncate text-xs" style={{ color: MUTE }}>{src.site}</span>
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform"
                  style={{ color: MUTE, transform: open ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-3"
                  >
                    <ul className="space-y-2">
                      {lines.map((ln, li) => {
                        const isMarked = sameMark({ sourceId: src.id, lineIndex: li });
                        const isKey = key !== 'none' && key.sourceId === src.id && key.lineIndex === li;
                        const showKey = revealed && isKey;
                        const showWrongMark = revealed && isMarked && !isKey;
                        const bg = showKey
                          ? `${GOOD}1E`
                          : showWrongMark
                            ? `${BAD}18`
                            : isMarked
                              ? `${ACCENT}26`
                              : CELL;
                        const outline = showKey
                          ? `2px solid ${GOOD}`
                          : showWrongMark
                            ? `2px solid ${BAD}`
                            : isMarked
                              ? `2px solid ${ACCENT}`
                              : `1px solid ${HAIR}`;
                        return (
                          <li key={li}>
                            <button
                              onClick={() => markLine(src.id, li)}
                              disabled={revealed}
                              aria-pressed={isMarked}
                              aria-label={`Source line: ${ln.text}${isMarked ? ', marked as the deciding line' : ''}`}
                              className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                              style={{
                                background: bg,
                                outline,
                                color: INK,
                                cursor: revealed ? 'default' : 'pointer',
                                ['--tw-ring-color' as string]: ACCENT,
                              }}
                            >
                              {showKey && <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOOD }} />}
                              {showWrongMark && <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BAD }} />}
                              <span style={{ color: showKey ? INK : MUTE }}>{ln.text}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* "Nothing here backs it up" — the honest FLAG evidence path */}
        {(openSources.size > 0 || revealed) && (
          <button
            onClick={() => !revealed && setMark((prev) => (prev === 'none' ? null : 'none'))}
            disabled={revealed}
            aria-pressed={mark === 'none'}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: revealed && key === 'none' ? `${GOOD}1E` : mark === 'none' ? `${ACCENT}26` : PANEL,
              border: `1px solid ${
                revealed && key === 'none' ? GOOD : mark === 'none' ? ACCENT : HAIR
              }`,
              color: INK,
              ['--tw-ring-color' as string]: ACCENT,
            }}
          >
            {revealed && key === 'none'
              ? <Check className="h-4 w-4 shrink-0" style={{ color: GOOD }} />
              : <CircleSlash className="h-4 w-4 shrink-0" style={{ color: mark === 'none' ? ACCENT : MUTE }} />}
            None of these lines back up the AI&rsquo;s claim.
          </button>
        )}
      </div>

      {/* Ruling */}
      {!revealed && (
        <div className="space-y-2">
          <div className="text-sm font-semibold" style={{ color: INK }}>Your ruling:</div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Your ruling">
            {verdictDefs.map(({ id, label, hint, Icon, color }) => {
              const on = verdict === id;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setVerdict(id)}
                  className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: on ? `${color}22` : CELL,
                    border: `2px solid ${on ? color : HAIR}`,
                    ['--tw-ring-color' as string]: color,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                  <span className="text-sm font-bold" style={{ color: INK }}>{label}</span>
                  <span className="text-xs leading-tight" style={{ color: MUTE }}>{hint}</span>
                </button>
              );
            })}
          </div>

          {/* Fix → pick the corrected answer */}
          {verdict === 'fix' && (
            <div className="space-y-2 rounded-2xl p-3" style={{ background: PANEL, border: `1px solid ${AMBER}44` }}>
              <div className="text-xs font-semibold" style={{ color: AMBER }}>
                What is the corrected answer?
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Corrected answer">
                {round.fixOptions.map((opt, oi) => {
                  const on = fixChoice === oi;
                  return (
                    <button
                      key={oi}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setFixChoice(oi)}
                      className="rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        background: on ? `${ACCENT}26` : CELL,
                        border: `2px solid ${on ? ACCENT : HAIR}`,
                        color: INK,
                        ['--tw-ring-color' as string]: ACCENT,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <SFButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setRevealed(true)}
            disabled={!canCommit}
          >
            Lock in your ruling <ArrowRight className="ml-2 h-5 w-5" />
          </SFButton>
          {!canCommit && (
            <p className="text-center text-xs" style={{ color: MUTE }}>
              Mark a source line (or &ldquo;none back it up&rdquo;) and pick a ruling to continue.
            </p>
          )}
        </div>
      )}

      {/* Reveal */}
      <div aria-live="polite">
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-2xl p-4"
            style={{ background: SURFACE, border: `1px solid ${verdictCorrect ? GOOD : AMBER}55` }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold" style={{ color: verdictCorrect ? GOOD : AMBER }}>
                {verdictCorrect
                  ? <><Check className="h-4 w-4" /> Right call — {round.verdict.toUpperCase()}</>
                  : <><X className="h-4 w-4" /> The right call was {round.verdict.toUpperCase()}</>}
              </span>
              <StarRow count={result.stars} size={22} />
            </div>
            <p className="text-sm leading-snug" style={{ color: INK }}>{round.reveal}</p>
            <p className="text-xs" style={{ color: MUTE }}>
              Round score {result.score}/100 &middot; +{result.xp} XP
            </p>
            <SFButton variant="primary" size="lg" className="w-full" onClick={() => onSolve(result)}>
              {index === total - 1 ? 'See your results' : 'Next question'} <ArrowRight className="ml-2 h-5 w-5" />
            </SFButton>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Completion overlay ───────────────────────────────────────────────────
function AllComplete({
  totalStars,
  totalXP,
  onReplay,
}: {
  totalStars: number;
  totalXP: number;
  onReplay: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,7,16,0.72)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Trace It complete: ${totalStars} of ${MAX_STARS} stars, ${totalXP} XP`}
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: SURFACE, border: `1px solid ${ACCENT}55`, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
        initial={{ scale: 0.6, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        <div
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}66` }}
        >
          <BookOpen className="h-8 w-8" style={{ color: ACCENT }} />
        </div>
        <h3 className="mb-1 text-xl font-bold" style={{ color: INK }}>
          <Sparkles className="mr-1 inline h-5 w-5" style={{ color: ACCENT }} /> Source-Checker Certified
        </h3>
        <p className="mb-3 text-sm" style={{ color: MUTE }}>
          You caught a confident wrong answer, a misquoted number, a made-up citation, and two sources that disagreed — by clicking through and reading the source instead of trusting the tone. That is the whole skill.
        </p>
        <div className="mb-2 flex justify-center">
          <StarRow count={Math.round((totalStars / MAX_STARS) * 3)} size={26} />
        </div>
        <p className="mb-4 text-sm" style={{ color: MUTE }}>
          <strong style={{ color: INK }}>{totalStars}</strong>/{MAX_STARS} stars &middot;{' '}
          <strong style={{ color: ACCENT }}>{totalXP} XP</strong>
        </p>
        <SFButton variant="primary" size="lg" className="w-full" onClick={onReplay}>
          <RotateCcw className="mr-2 h-4 w-4" /> Trace it again
        </SFButton>
      </motion.div>
    </motion.div>
  );
}

// ── Orchestrator ─────────────────────────────────────────────────────────
export default function TraceItGame() {
  const { awardXP, completeGame } = useGameActions();
  const rawBand = useActiveChild()?.age_band || 'B';
  const band: Band = rawBand === 'C' ? 'C' : 'B';

  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, RoundResult>>({});
  const [attempt, setAttempt] = useState(0); // remount key → clean per-round reset
  const firedRef = useRef(false);

  const done = Object.keys(results).length;
  const allDone = done === ROUNDS.length;
  const totalStars = Object.values(results).reduce((s, r) => s + r.stars, 0);
  const totalXP = Object.values(results).reduce((s, r) => s + r.xp, 0);

  const solveRound = useCallback((roundId: number, r: RoundResult) => {
    setResults((prev) => ({ ...prev, [roundId]: r }));
    setIndex((i) => Math.min(i + 1, ROUNDS.length - 1));
    setAttempt((a) => a + 1);
  }, []);

  // Fire XP + completion exactly once, after every round is ruled.
  useEffect(() => {
    if (!allDone || firedRef.current) return;
    firedRef.current = true;
    awardXP(totalXP);
    const stars: 1 | 2 | 3 = totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1;
    completeGame('trace-it', stars);
  }, [allDone, totalXP, totalStars, awardXP, completeGame]);

  const replay = useCallback(() => {
    firedRef.current = false;
    setResults({});
    setIndex(0);
    setAttempt((a) => a + 1);
  }, []);

  const round = ROUNDS[index];

  return (
    <GameShell title="Trace It" color={ACCENT} labNum={10}>
      <div className="relative p-4">
        <RoundView
          key={`${round.id}-${attempt}`}
          round={round}
          band={band}
          index={index}
          total={ROUNDS.length}
          onSolve={(r) => solveRound(round.id, r)}
        />

        <AnimatePresence>
          {allDone && (
            <AllComplete totalStars={totalStars} totalXP={totalXP} onReplay={replay} />
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
