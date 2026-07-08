// ════════════════════════════════════════════════════════════════════════
// BIAS DETECTIVE v6 — Lab 6 (AI & Ethics) — "Audit the AI" (G3 §II.4 #18)
// ════════════════════════════════════════════════════════════════════════
// Was a 2-bin drag-sort of pre-summarized labels (half-leaked the answer, one
// mechanic ten times). Now it's an evidence audit: for each real AI system the
// child EXPOSES THE BIAS PATHWAY (flags which training-data facts cause the
// unfair outcome), then CHOOSES A FIX and watches per-group accuracy bars
// respond — a good fix that addresses the real source closes the gap; a wrong
// fix doesn't. Sparky plays the naive AI defending itself ("I just followed the
// data!") until the evidence convicts it. Reuses the strong cases (Amazon
// hiring, COMPAS, healthcare proxy, facial recognition) + a 2026 LLM-bias case.
//
// Honest (G1): the fix's effect on the bars is a deterministic function of
// whether the fix targets the actual bias source. Nothing is pre-labeled; the
// reveal comes only after the child commits. Bespoke DOM/SVG — no Pixi canvas.
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Scale, ChevronRight, Search, Wrench, Trophy, RotateCcw,
  AlertTriangle, CheckCircle2, XCircle, Bot,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFButton } from '@/components/ui/SFButton';

const LAB_COLOR = '#FF7050';
type Band = 'A' | 'B' | 'C';

// Dark game-surface palette (inline — no text-white/NN opacity utilities).
const PANEL = '#141B33';
const INK = '#0E1428';
const BORDER = 'rgba(255,255,255,0.10)';
const TEXT = '#EAF0F6';
const TEXT_DIM = '#9AA4BE';

// ════════════════════════════════════════════════════════════════════════
// CASE MODEL
// ════════════════════════════════════════════════════════════════════════
interface DataCard { id: string; text: string; isSource: boolean; note: string; }
interface Fix {
  id: string;
  text: string;
  /** true = genuinely addresses the real bias source (closes the gap). */
  effective: boolean;
  note: string;
}
interface GroupAcc { group: string; before: number; /** after an EFFECTIVE fix */ after: number; }
interface Case {
  id: string;
  minBand: Band;
  system: string;
  sparkyDefense: string;       // the naive AI defending itself
  outcome: string;             // the unfair outcome the child is auditing
  data: DataCard[];
  fixes: Fix[];
  groups: GroupAcc[];
  metricLabel: string;         // e.g. "Selected fairly" / "Correctly flagged"
  lesson: string;
}

const BAND_ORDER: Record<Band, number> = { A: 0, B: 1, C: 2 };

const CASES: Case[] = [
  {
    id: 'hiring',
    minBand: 'A',
    system: 'ResuméBot — screens job applications and recommends who to interview.',
    sparkyDefense: "I just learned from the company's past hiring! I'm only following the data.",
    outcome: 'It recommends mostly men and quietly down-ranks resumes that mention "women\'s".',
    data: [
      { id: 'h-hist', text: '10 years of past resumes — almost all from men', isSource: true, note: 'The model learns "successful applicant = looks like past (male) hires."' },
      { id: 'h-word', text: 'It penalizes the word "women\'s" (e.g. "women\'s chess club")', isSource: true, note: 'A feature that directly encodes gender — a clear bias pathway.' },
      { id: 'h-exp', text: 'Years of work experience', isSource: false, note: 'Experience is a fair, job-relevant signal — not the bias source here.' },
      { id: 'h-skill', text: 'Programming languages listed', isSource: false, note: 'A relevant skill signal — not where the bias comes from.' },
    ],
    fixes: [
      { id: 'h-rebal', text: 'Rebalance the training data across genders and remove the "women\'s" penalty', effective: true, note: 'Fixes the actual sources: skewed data + a gender-encoding feature.' },
      { id: 'h-more', text: 'Add even more resumes from past (mostly male) hires', effective: false, note: 'That deepens the exact skew causing the bias.' },
      { id: 'h-none', text: 'Do nothing — "it\'s just the data"', effective: false, note: 'Following biased data faithfully still produces biased decisions.' },
    ],
    groups: [{ group: 'Men', before: 82, after: 80 }, { group: 'Women', before: 41, after: 78 }],
    metricLabel: 'Recommended when qualified',
    lesson: 'Bias starts in the data — and a feature that stands in for gender leaks it right back in. Balanced data + audited features is fair design.',
  },
  {
    id: 'faces',
    minBand: 'A',
    system: 'FaceUnlock — recognizes faces to unlock a phone.',
    sparkyDefense: "I work great in my tests! Everyone in my photos unlocks fine.",
    outcome: 'It often fails to recognize people with darker skin tones.',
    data: [
      { id: 'f-light', text: 'Training photos are mostly light-skinned faces', isSource: true, note: 'The model learns light-skinned features far better — the core bias source.' },
      { id: 'f-testlight', text: 'It was only tested on the team\'s own (light-skinned) faces', isSource: true, note: 'Testing on one group hides the failure for everyone else.' },
      { id: 'f-res', text: 'The camera is high-resolution', isSource: false, note: 'Resolution is fine here — not the cause of the gap.' },
      { id: 'f-speed', text: 'It unlocks in under a second', isSource: false, note: 'Speed is unrelated to the fairness gap.' },
    ],
    fixes: [
      { id: 'f-div', text: 'Add diverse faces to the data AND test accuracy per skin tone', effective: true, note: 'Addresses both real sources: unrepresentative data + one-group testing.' },
      { id: 'f-more', text: 'Collect more light-skinned photos to boost overall accuracy', effective: false, note: 'Overall accuracy hides the gap; the under-served group stays under-served.' },
      { id: 'f-ship', text: 'Ship it — it passed the team\'s tests', effective: false, note: 'Passing a one-group test is exactly how this bias slips out the door.' },
    ],
    groups: [{ group: 'Lighter skin', before: 96, after: 95 }, { group: 'Darker skin', before: 62, after: 93 }],
    metricLabel: 'Recognized correctly',
    lesson: 'A model is only as fair as its data and its tests. Represent everyone in both.',
  },
  {
    id: 'compas',
    minBand: 'B',
    system: 'RiskScore — predicts how likely someone is to re-offend, used in court.',
    sparkyDefense: "My numbers come straight from real records. Records don't lie!",
    outcome: 'It labels Black defendants "high risk" far more often — even many who never re-offend.',
    data: [
      { id: 'c-arr', text: 'Past arrest records — but policing was heavier in some neighborhoods', isSource: true, note: 'Uneven policing means the "data" already encodes bias, not just behavior.' },
      { id: 'c-zip', text: 'The person\'s ZIP code', isSource: true, note: 'ZIP correlates strongly with race — a proxy that sneaks bias back in.' },
      { id: 'c-age', text: 'The person\'s age', isSource: false, note: 'Age relates to re-offense rates generally and isn\'t the racial-bias source here.' },
      { id: 'c-charge', text: 'The current charge', isSource: false, note: 'The charge itself is relevant case information, not the bias pathway.' },
    ],
    fixes: [
      { id: 'c-audit', text: 'Drop the ZIP proxy and add an independent audit of error rates by group', effective: true, note: 'Removes the proxy and measures false-positive rates per group — the real fix.' },
      { id: 'c-blind', text: 'Just delete the race field (keep ZIP and arrest history)', effective: false, note: 'Fairness-through-unawareness fails: correlated proxies still predict race.' },
      { id: 'c-trust', text: 'Trust the score — it\'s based on real records', effective: false, note: 'Biased records produce biased scores; "real" isn\'t the same as "fair".' },
    ],
    groups: [{ group: 'White defendants', before: 23, after: 24 }, { group: 'Black defendants', before: 45, after: 25 }],
    metricLabel: 'Wrongly flagged high-risk (lower is fairer)',
    lesson: 'Removing the race label isn\'t enough — proxies like ZIP keep the bias. Audit the error rates for every group.',
  },
  {
    id: 'health',
    minBand: 'B',
    system: 'CareFinder — decides which patients get extra medical support.',
    sparkyDefense: "I send help to the patients the system spends the most on. Efficient, right?",
    outcome: 'Black patients who are actually sicker get offered less extra care.',
    data: [
      { id: 'he-spend', text: 'It uses past healthcare SPENDING as a stand-in for how sick you are', isSource: true, note: 'People with less access spend less — so "spending" undercounts their real need.' },
      { id: 'he-access', text: 'Some groups have had less access to doctors', isSource: true, note: 'Less access → less past spending → the model thinks they\'re healthier than they are.' },
      { id: 'he-diag', text: 'Actual diagnoses and test results', isSource: false, note: 'These measure real health — using THEM would be the fair choice.' },
      { id: 'he-age', text: 'Patient age', isSource: false, note: 'Age is a normal medical factor, not the bias source.' },
    ],
    fixes: [
      { id: 'he-need', text: 'Use real health measures (diagnoses, test results) instead of spending', effective: true, note: 'Predicting actual illness — not money spent — removes the proxy bias.' },
      { id: 'he-spend2', text: 'Add more detailed spending data', effective: false, note: 'More of a biased proxy is still a biased proxy.' },
      { id: 'he-keep', text: 'Keep using spending — it\'s easy to measure', effective: false, note: 'Convenient, but it systematically underserves the people with the least access.' },
    ],
    groups: [{ group: 'White patients', before: 88, after: 87 }, { group: 'Black patients', before: 58, after: 86 }],
    metricLabel: 'Sick patients correctly offered care',
    lesson: 'A convenient stand-in (proxy) can hide real need. Measure the thing you actually care about.',
  },
  {
    id: 'llm',
    minBand: 'C',
    system: 'HireChat — a 2026 AI chatbot that reads resumes and rates candidates.',
    sparkyDefense: "I'm a modern language model! I read every resume in plain English. How could I be biased?",
    outcome: 'It quietly rates candidates with certain names and phrasings higher — and marks fluent-but-non-native English as "weaker".',
    data: [
      { id: 'l-web', text: 'It learned from huge piles of internet text full of stereotypes', isSource: true, note: 'LLMs absorb the biases in their training text and echo them.' },
      { id: 'l-phras', text: 'It rewards a specific confident, native-English phrasing style', isSource: true, note: 'Style-preference penalizes equally-qualified people who write differently.' },
      { id: 'l-skill', text: 'The actual skills and projects listed', isSource: false, note: 'The job-relevant content — what a fair system should focus on.' },
      { id: 'l-len', text: 'Resume length in words', isSource: false, note: 'A formatting detail, not the source of the demographic bias.' },
    ],
    fixes: [
      { id: 'l-guard', text: 'Add bias guardrails + blind-review key fields + audit ratings across groups', effective: true, note: 'Guardrails, hiding name/style cues, and per-group audits address the real sources.' },
      { id: 'l-tell', text: 'Just add "be fair" to the prompt', effective: false, note: 'A polite instruction alone doesn\'t remove learned bias — you have to measure and constrain it.' },
      { id: 'l-trust', text: 'Trust it — modern models are too smart to be biased', effective: false, note: 'Smarter models can carry subtler, harder-to-spot bias, not less.' },
    ],
    groups: [{ group: 'Favored phrasing', before: 84, after: 82 }, { group: 'Other phrasing', before: 49, after: 80 }],
    metricLabel: 'Qualified candidate rated fairly',
    lesson: 'Even a fluent 2026 chatbot inherits bias from its text and its style preferences. Fairness needs guardrails + audits, not just a nice instruction.',
  },
];

function casesForBand(band: Band): Case[] {
  const list = CASES.filter((c) => BAND_ORDER[c.minBand] <= BAND_ORDER[band]);
  return list.length ? list : CASES.slice(0, 2);
}

// ════════════════════════════════════════════════════════════════════════
// SCORING (honest, deterministic)
// ════════════════════════════════════════════════════════════════════════
function scoreEvidence(c: Case, flagged: Set<string>): { tp: number; fp: number; fn: number; f1: number } {
  const sources = c.data.filter((d) => d.isSource).map((d) => d.id);
  const tp = sources.filter((id) => flagged.has(id)).length;
  const fp = [...flagged].filter((id) => !sources.includes(id)).length;
  const fn = sources.length - tp;
  const prec = tp + fp === 0 ? 0 : tp / (tp + fp);
  const rec = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = prec + rec === 0 ? 0 : (2 * prec * rec) / (prec + rec);
  return { tp, fp, fn, f1 };
}

// ════════════════════════════════════════════════════════════════════════
// GAME
// ════════════════════════════════════════════════════════════════════════
type Phase = 'welcome' | 'evidence' | 'fix' | 'result' | 'done';

export default function BiasDetectiveGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();
  const band = (child?.age_band || 'B') as Band;
  const prefersReduced = useReducedMotion();

  const cases = useMemo(() => casesForBand(band), [band]);
  const [caseIdx, setCaseIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [chosenFix, setChosenFix] = useState<string | null>(null);
  const [caseScores, setCaseScores] = useState<number[]>([]);
  const firedRef = useRef(false);

  const current = cases[caseIdx];
  const totalCases = cases.length;

  const toggleFlag = useCallback((id: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const ev = useMemo(() => (current ? scoreEvidence(current, flagged) : null), [current, flagged]);
  const fixObj = current?.fixes.find((f) => f.id === chosenFix) || null;
  const fixEffective = !!fixObj?.effective;

  // Per-case score: evidence F1 (0–60) + fix choice (0–40).
  const caseScore = useMemo(() => {
    if (!current || !ev) return 0;
    return Math.round(ev.f1 * 60) + (fixEffective ? 40 : 0);
  }, [current, ev, fixEffective]);

  const nextCase = useCallback(() => {
    setCaseScores((s) => [...s, caseScore]);
    if (caseIdx + 1 >= totalCases) {
      setPhase('done');
    } else {
      setCaseIdx((i) => i + 1);
      setFlagged(new Set());
      setChosenFix(null);
      setPhase('evidence');
    }
  }, [caseScore, caseIdx, totalCases]);

  // Completion — fire once at the summary.
  useEffect(() => {
    if (phase === 'done' && !firedRef.current) {
      firedRef.current = true;
      const all = [...caseScores];
      const avg = all.length ? all.reduce((s, v) => s + v, 0) / all.length : 0;
      const stars = avg >= 82 ? 3 : avg >= 55 ? 2 : 1;
      awardXP(60 + Math.round(avg) * cases.length);
      completeGame('bias-detective', stars);
    }
  }, [phase, caseScores, cases.length, awardXP, completeGame]);

  // ─── WELCOME ───
  if (phase === 'welcome') {
    return (
      <GameShell title="Bias Detective" color={LAB_COLOR} labNum={6}>
        <div className="max-w-xl mx-auto text-center py-8 px-4">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: `${LAB_COLOR}1A`, border: `1px solid ${LAB_COLOR}40` }}>
            <Scale className="w-10 h-10" style={{ color: LAB_COLOR }} aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: TEXT }}>Audit the AI</h2>
          <p className="font-body text-sm mb-6" style={{ color: TEXT_DIM }}>
            Each case is a real AI system accused of being unfair. Your job: find the evidence in its
            data that causes the bias, then choose a fix and watch what happens to each group. Sparky
            plays the AI — and it will defend itself until your evidence convicts it.
          </p>
          <p className="font-body text-xs mb-6" style={{ color: TEXT_DIM }}>
            {totalCases} cases · you are the auditor
          </p>
          <SFButton variant="primary" size="lg" onClick={() => setPhase('evidence')}>
            Open the first case <ChevronRight className="w-4 h-4 ml-2" />
          </SFButton>
        </div>
      </GameShell>
    );
  }

  // ─── DONE ───
  if (phase === 'done') {
    const avg = caseScores.length ? Math.round(caseScores.reduce((s, v) => s + v, 0) / caseScores.length) : 0;
    const stars = avg >= 82 ? 3 : avg >= 55 ? 2 : 1;
    return (
      <GameShell title="Bias Detective" color={LAB_COLOR} labNum={6}>
        <div className="max-w-xl mx-auto text-center py-10 px-4">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: '#FFD93D1A', border: '1px solid #FFD93D40' }}>
            <Trophy className="w-10 h-10" style={{ color: '#FFD93D' }} aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: TEXT }}>Case files closed</h2>
          <div className="flex justify-center gap-1 mb-4" aria-label={`${stars} of 3 stars`}>
            {[1, 2, 3].map((s) => (
              <span key={s} className="text-3xl" style={{ opacity: s <= stars ? 1 : 0.25 }} aria-hidden="true">★</span>
            ))}
          </div>
          <p className="font-body text-sm mb-6" style={{ color: TEXT_DIM }}>
            You audited {totalCases} AI systems, exposed how their bias formed, and picked fixes that
            actually helped the people being treated unfairly. That is what a real AI auditor does.
          </p>
          <p className="font-body text-xs" style={{ color: TEXT_DIM }}>Your progress has been saved.</p>
        </div>
      </GameShell>
    );
  }

  if (!current) return null;

  // ─── EVIDENCE / FIX / RESULT (per-case) ───
  return (
    <GameShell title="Bias Detective" color={LAB_COLOR} labNum={6}>
      <div className="max-w-2xl mx-auto py-4 px-3">
        {/* Case header */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-display text-xs font-bold"
            style={{ background: `${LAB_COLOR}1A`, color: LAB_COLOR, border: `1px solid ${LAB_COLOR}40` }}>
            <Search className="w-3.5 h-3.5" aria-hidden="true" /> Case {caseIdx + 1} of {totalCases}
          </span>
          <span className="font-body text-xs ml-auto" style={{ color: TEXT_DIM }}>
            {phase === 'evidence' ? 'Step 1 · Expose the pathway' : phase === 'fix' ? 'Step 2 · Choose a fix' : 'Step 3 · The verdict'}
          </span>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <p className="font-display text-sm font-bold mb-1" style={{ color: TEXT }}>{current.system}</p>
          <p className="font-body text-xs" style={{ color: '#FF9E80' }}>
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
            Accused: {current.outcome}
          </p>
        </div>

        {/* Sparky (the naive AI) defending itself */}
        {phase !== 'result' && (
          <div className="flex items-start gap-2 mb-4 rounded-xl p-3" style={{ background: INK, border: `1px solid ${BORDER}` }} aria-live="polite">
            <Bot className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#4DE9FF' }} aria-hidden="true" />
            <p className="font-body text-xs italic" style={{ color: TEXT_DIM }}>&ldquo;{current.sparkyDefense}&rdquo;</p>
          </div>
        )}

        {/* STEP 1 — evidence */}
        {phase === 'evidence' && (
          <>
            <p className="font-body text-sm mb-3" style={{ color: TEXT }}>
              Look at what the AI was built from. <strong>Flag the facts that CAUSE the unfair outcome</strong> — the bias pathway.
            </p>
            <div className="space-y-2 mb-5">
              {current.data.map((d) => {
                const on = flagged.has(d.id);
                return (
                  <button key={d.id} onClick={() => toggleFlag(d.id)} aria-pressed={on}
                    className="w-full text-left rounded-xl p-3 transition-all flex items-start gap-3"
                    style={{ background: on ? `${LAB_COLOR}1A` : INK, border: `1px solid ${on ? LAB_COLOR : BORDER}` }}>
                    <span className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ border: `1px solid ${on ? LAB_COLOR : BORDER}`, background: on ? LAB_COLOR : 'transparent' }}>
                      {on && <CheckCircle2 className="w-4 h-4" style={{ color: '#04121A' }} aria-hidden="true" />}
                    </span>
                    <span className="font-body text-sm" style={{ color: TEXT }}>{d.text}</span>
                  </button>
                );
              })}
            </div>
            <SFButton variant="primary" size="lg" fullWidth disabled={flagged.size === 0} onClick={() => setPhase('fix')}>
              Build the evidence chain <ChevronRight className="w-4 h-4 ml-2" />
            </SFButton>
          </>
        )}

        {/* STEP 2 — fix */}
        {phase === 'fix' && (
          <>
            <p className="font-body text-sm mb-3" style={{ color: TEXT }}>
              <Wrench className="w-4 h-4 inline mr-1" style={{ color: LAB_COLOR }} aria-hidden="true" />
              Now pick the fix most likely to make this system fair.
            </p>
            <div className="space-y-2 mb-5">
              {current.fixes.map((f) => {
                const on = chosenFix === f.id;
                return (
                  <button key={f.id} onClick={() => setChosenFix(f.id)} aria-pressed={on}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{ background: on ? `${LAB_COLOR}1A` : INK, border: `1px solid ${on ? LAB_COLOR : BORDER}` }}>
                    <span className="font-body text-sm" style={{ color: TEXT }}>{f.text}</span>
                  </button>
                );
              })}
            </div>
            <SFButton variant="primary" size="lg" fullWidth disabled={!chosenFix} onClick={() => setPhase('result')}>
              Apply the fix &amp; run the audit <ChevronRight className="w-4 h-4 ml-2" />
            </SFButton>
          </>
        )}

        {/* STEP 3 — result: per-group accuracy bars respond to the fix */}
        {phase === 'result' && (
          <div aria-live="polite">
            <p className="font-body text-sm mb-3" style={{ color: TEXT }}>
              {current.metricLabel} — before vs after your fix:
            </p>
            <div className="space-y-3 mb-4 rounded-2xl p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
              {current.groups.map((g) => {
                const after = fixEffective ? g.after : g.before + (g.after > g.before ? 2 : -1);
                return (
                  <div key={g.group}>
                    <div className="flex justify-between font-body text-xs mb-1" style={{ color: TEXT_DIM }}>
                      <span>{g.group}</span>
                      <span style={{ color: TEXT }}>{g.before}% → <strong style={{ color: fixEffective ? '#2ECC71' : '#FF9E80' }}>{after}%</strong></span>
                    </div>
                    <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: INK }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: `${g.before}%` }}
                        animate={{ width: `${after}%` }}
                        transition={prefersReduced ? { duration: 0 } : { duration: 0.9, ease: 'easeOut' }}
                        style={{ background: `linear-gradient(90deg, ${LAB_COLOR}, #2ECC71)` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Verdict */}
            <div className="rounded-xl p-3 mb-3 flex items-start gap-2"
              style={{ background: fixEffective ? '#2ECC7112' : '#EF444412', border: `1px solid ${fixEffective ? '#2ECC7140' : '#EF444440'}` }}>
              {fixEffective
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#2ECC71' }} aria-hidden="true" />
                : <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#EF4444' }} aria-hidden="true" />}
              <p className="font-body text-xs" style={{ color: TEXT }}>
                {fixEffective
                  ? 'Your fix closed the gap — the group being treated unfairly is now served as well as everyone else.'
                  : "That fix didn't close the gap. " + (fixObj?.note ?? '')}
              </p>
            </div>

            {/* Evidence review (post-commit reveal, honest) */}
            <div className="rounded-xl p-3 mb-3" style={{ background: INK, border: `1px solid ${BORDER}` }}>
              <p className="font-display text-xs font-bold mb-2" style={{ color: LAB_COLOR }}>The bias pathway</p>
              {current.data.filter((d) => d.isSource).map((d) => (
                <p key={d.id} className="font-body text-xs mb-1" style={{ color: TEXT_DIM }}>
                  <span style={{ color: flagged.has(d.id) ? '#2ECC71' : '#FF9E80' }}>
                    {flagged.has(d.id) ? '✓ you caught' : '✗ you missed'}
                  </span>{' '}
                  {d.text} — <span style={{ color: TEXT }}>{d.note}</span>
                </p>
              ))}
              <p className="font-body text-xs mt-2" style={{ color: TEXT }}>{current.lesson}</p>
            </div>

            <SFButton variant="primary" size="lg" fullWidth onClick={nextCase}>
              {caseIdx + 1 >= totalCases ? 'Close the case files' : 'Next case'} <ChevronRight className="w-4 h-4 ml-2" />
            </SFButton>
          </div>
        )}

        {/* exit */}
        {phase === 'evidence' && (
          <button onClick={() => setPhase('welcome')} className="mt-4 mx-auto flex items-center gap-1 font-body text-xs"
            style={{ color: TEXT_DIM }} aria-label="Restart from the intro">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> restart
          </button>
        )}
      </div>
    </GameShell>
  );
}
