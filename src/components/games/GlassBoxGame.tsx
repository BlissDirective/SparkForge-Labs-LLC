// ════════════════════════════════════════════════════════════════════════
// GLASS BOX — Lab 11 Flagship (Stage 11F, C2) — "Constrain / Observe" step.
// ════════════════════════════════════════════════════════════════════════
// A real AI-observability detective game. The child opens up a saved AI
// agent team's RUN (its trajectory — the ordered sequence of reasoning /
// tool steps), scrubs through it step by step, inspects each step's inputs,
// outputs and reasoning, and TAGS the steps where the agent went wrong.
// "Grade my analysis" compares the child's flags against the auditor's own
// findings and shows how good a detective they were.
//
// This UI drives the REAL engine in `useGlassBoxStore` — auditReplay
// (missionRunner.simulate + issueDetector) produces the trajectory and the
// heuristic auditor findings; summarizeAudit grades the child's annotations.
// No quiz stub: the store owns all logic, this file is the presentational +
// state→view / control→action layer.
//
// Phase machine (from glassBoxStore.GlassBoxPhase):
//   welcome → learn-trajectory → learn-inputs-outputs → learn-issues
//   → save-select → replay ⇄ annotate → report → complete
//
// Fresh account: saved runs come from OTHER games (Agent Atelier / MCP Lab).
// A brand-new player has none, so we always offer a clearly-labelled built-in
// SAMPLE run (a deliberately-flawed practice team) — injected into the store's
// own savesCache and replayed through the exact same pickSource path. The
// game never blocks on a save.
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useMemo, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useGlassBoxStore, describeSource } from '@/stores/glassBoxStore';
import { ISSUE_CATEGORY_META } from '@/lib/glassbox/issueDetector';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import type { IssueCategory, ReplaySource } from '@/types/glassbox';
import type { AgentComposition } from '@/types/agentAtelier';
import type { ToolBinding } from '@/types/mcplab';

const LAB = '#E945F5';

// ─── Inline style helpers (no arbitrary [Npx] Tailwind classes) ──────────
const panel: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 16,
};
const primaryBtn: CSSProperties = {
  background: LAB,
  color: '#0b0410',
  fontWeight: 700,
  borderRadius: 12,
  padding: '12px 24px',
  border: 'none',
  cursor: 'pointer',
};
const ghostBtn: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12,
  padding: '10px 20px',
  cursor: 'pointer',
};

// Issue categories in a stable, severity-first display order.
const CATEGORY_ORDER: IssueCategory[] = [
  'missing-input',
  'tool-misuse',
  'forbidden-tool',
  'no-critic',
  'unused-output',
  'redundant-step',
  'short-loop',
];

// ─── Built-in SAMPLE run (fresh-account fallback) ────────────────────────
// A deliberately-flawed practice team so a brand-new player always has a
// real trajectory to audit. Runs through the store's own pickSource path,
// so its trajectory + findings are produced by the genuine engine — the
// "birthday" name routes it to the birthday-plan mission via
// inferMissionForComposition. With NO wires the engine surfaces:
//   • Estimator + Researcher outputs that nothing downstream consumes
//     (unused-output), and
//   • the terminal Writer running with an unwired `notes` list
//     (missing-input).
const SAMPLE_ID = 'sample-birthday-team';
const SAMPLE_COMP: AgentComposition = {
  id: SAMPLE_ID,
  childId: 'sample',
  name: 'Birthday Party Team (practice run)',
  team: [
    { agentId: 'researcher', position: [-0.6, 0] },
    { agentId: 'estimator', position: [0, 0.5] },
    { agentId: 'writer', position: [0.6, 0] },
  ],
  wires: [], // intentionally unwired — the bugs to catch
  createdAt: '2026-01-01T00:00:00.000Z',
};
const SAMPLE_BINDINGS: ToolBinding[] = [];
const SAMPLE_SOURCE: ReplaySource = {
  compositionId: SAMPLE_ID,
  name: SAMPLE_COMP.name,
  origin: 'atelier',
  createdAt: SAMPLE_COMP.createdAt,
};

// ─── Tutorials ───────────────────────────────────────────────────────────
const TUTORIALS = [
  {
    phase: 'learn-trajectory' as const,
    key: 'trajectory' as const,
    emoji: '🧭',
    title: 'A run leaves a trail',
    body: [
      'When an AI agent team does a job, each teammate takes a turn. That ordered list of turns is called a trajectory — the trail the AI left behind.',
      'A Glass Box lets you SEE that trail. You can scrub through it one step at a time, forwards and backwards, like scrubbing a video.',
      'Your job: follow the trail and find where the team slipped up.',
    ],
  },
  {
    phase: 'learn-inputs-outputs' as const,
    key: 'inputsOutputs' as const,
    emoji: '📥',
    title: 'Inputs in, outputs out',
    body: [
      'Every step has inputs (what the agent was handed) and outputs (what it made).',
      'Read them carefully. If an input says something like "(no list wired)", the agent was working with missing information!',
      'And if an output is never used by a later step, the team did work for nothing.',
    ],
  },
  {
    phase: 'learn-issues' as const,
    key: 'issues' as const,
    emoji: '🕵️',
    title: 'Tag the trouble',
    body: [
      'When you spot a problem on a step, TAG it with the kind of issue it is — like "Missing input" or "Unused output".',
      'You can add a note to explain what you saw.',
      'At the end, "Grade my analysis" checks your tags against what the auditor found. Catch the real bugs to score more stars!',
    ],
  },
];

// ─── Small value formatter for inputs/outputs ────────────────────────────
function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.map((x) => String(x)).join(' · ');
  if (typeof v === 'number') return String(v);
  return String(v);
}
function looksMissing(v: unknown): boolean {
  return typeof v === 'string' && v.startsWith('(no ') && v.endsWith(' wired)');
}

// ─── Stars ───────────────────────────────────────────────────────────────
function Stars({ n, size = 28 }: { n: number; size?: number }) {
  return (
    <span aria-label={`${n} out of 3 stars`} style={{ fontSize: size, letterSpacing: 2 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ opacity: i < n ? 1 : 0.22 }} aria-hidden>
          ⭐
        </span>
      ))}
    </span>
  );
}

export default function GlassBoxGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();
  const childId = child?.id;

  // ─── Store: state ──────────────────────────────────────────────────────
  const phase = useGlassBoxStore((s) => s.phase);
  const availableSources = useGlassBoxStore((s) => s.availableSources);
  const savesCache = useGlassBoxStore((s) => s.savesCache);
  const isLoadingSources = useGlassBoxStore((s) => s.isLoadingSources);
  const steps = useGlassBoxStore((s) => s.steps);
  const scrubIndex = useGlassBoxStore((s) => s.scrubIndex);
  const inspectAgentId = useGlassBoxStore((s) => s.inspectAgentId);
  const annotateStepIndex = useGlassBoxStore((s) => s.annotateStepIndex);
  const summary = useGlassBoxStore((s) => s.summary);
  const finalArtifact = useGlassBoxStore((s) => s.finalArtifact);
  const totalMs = useGlassBoxStore((s) => s.totalMs);
  const error = useGlassBoxStore((s) => s.error);

  // ─── Store: actions ────────────────────────────────────────────────────
  const setPhase = useGlassBoxStore((s) => s.setPhase);
  const beginGame = useGlassBoxStore((s) => s.beginGame);
  const reset = useGlassBoxStore((s) => s.reset);
  const markTutorialSeen = useGlassBoxStore((s) => s.markTutorialSeen);
  const loadSources = useGlassBoxStore((s) => s.loadSources);
  const pickSource = useGlassBoxStore((s) => s.pickSource);
  const setScrub = useGlassBoxStore((s) => s.setScrub);
  const scrubNext = useGlassBoxStore((s) => s.scrubNext);
  const scrubPrev = useGlassBoxStore((s) => s.scrubPrev);
  const setInspectAgent = useGlassBoxStore((s) => s.setInspectAgent);
  const beginAnnotateStep = useGlassBoxStore((s) => s.beginAnnotateStep);
  const cancelAnnotate = useGlassBoxStore((s) => s.cancelAnnotate);
  const toggleStepTag = useGlassBoxStore((s) => s.toggleStepTag);
  const setStepNote = useGlassBoxStore((s) => s.setStepNote);
  const recomputeSummary = useGlassBoxStore((s) => s.recomputeSummary);

  const loadedRef = useRef(false);
  const firedRef = useRef(false);

  // ─── Mount: reset to a clean welcome. Clean up on exit. ────────────────
  // reset() puts the phase back to 'welcome'; the welcome screen's button
  // calls beginGame(), which routes to the first unseen tutorial (or
  // straight to save-select for a returning player). This locally gates a
  // welcome even though beginGame itself never lands on 'welcome'.
  useEffect(() => {
    reset();
    loadedRef.current = false;
    firedRef.current = false;
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Load saved runs once, when we reach the picker. ───────────────────
  useEffect(() => {
    if (phase === 'save-select' && childId && !loadedRef.current) {
      loadedRef.current = true;
      void loadSources(childId);
    }
  }, [phase, childId, loadSources]);

  // ─── Completion: fire exactly once at the report. ──────────────────────
  useEffect(() => {
    if (phase === 'report' && summary && !firedRef.current) {
      firedRef.current = true;
      const stars = Math.max(1, summary.stars) as 1 | 2 | 3;
      const xp = 50 + Math.round(summary.accuracy * 80) + summary.truePositiveCount * 12;
      awardXP(xp);
      completeGame('glass-box', stars);
    }
  }, [phase, summary, awardXP, completeGame]);

  const current = steps[scrubIndex];

  // Distinct agents appearing in the trajectory (for the inspect legend).
  const trajectoryAgents = useMemo(() => {
    const seen = new Set<string>();
    const out: { agentId: string; firstStep: number }[] = [];
    steps.forEach((s, i) => {
      if (!seen.has(s.base.agentId)) {
        seen.add(s.base.agentId);
        out.push({ agentId: s.base.agentId, firstStep: i });
      }
    });
    return out;
  }, [steps]);

  // Value-trace: is a step's output value consumed by any LATER step's input?
  // Derived purely from the visible trajectory — a real observability cue for
  // spotting outputs that "go nowhere".
  function usedLater(value: unknown, fromStepIdx: number): boolean {
    const needle = JSON.stringify(value);
    for (let i = fromStepIdx + 1; i < steps.length; i++) {
      const inputs = steps[i].base.inputs;
      for (const k of Object.keys(inputs)) {
        if (JSON.stringify(inputs[k]) === needle) return true;
      }
    }
    return false;
  }

  function playSource(source: ReplaySource) {
    if (source.compositionId === SAMPLE_ID) {
      // Inject the built-in sample into the store's own cache, then replay it
      // through the genuine pickSource → auditReplay path.
      useGlassBoxStore.setState((s) => ({
        savesCache: { ...s.savesCache, [SAMPLE_ID]: { comp: SAMPLE_COMP, bindings: SAMPLE_BINDINGS } },
        availableSources: s.availableSources.some((x) => x.compositionId === SAMPLE_ID)
          ? s.availableSources
          : [...s.availableSources, SAMPLE_SOURCE],
      }));
    }
    pickSource(source.compositionId);
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHASE VIEWS
  // ══════════════════════════════════════════════════════════════════════

  function WelcomeView() {
    return (
      <Centered>
        <div style={{ fontSize: 64 }} aria-hidden>🔍</div>
        <h1 className="text-3xl font-black" style={{ color: LAB }}>Glass Box</h1>
        <p className="max-w-md text-lg text-white/80">
          Open up an AI agent team&apos;s run, follow its trail step by step, and be the detective who
          finds where it went wrong.
        </p>
        <button style={primaryBtn} onClick={() => beginGame()} aria-label="Start Glass Box">
          Open the glass box →
        </button>
      </Centered>
    );
  }

  function TutorialView() {
    const t = TUTORIALS.find((x) => x.phase === phase)!;
    const idx = TUTORIALS.findIndex((x) => x.phase === phase);
    const next = TUTORIALS[idx + 1];
    return (
      <Centered>
        <div className="flex items-center gap-2" role="group" aria-label="Lesson progress">
          {TUTORIALS.map((x, i) => (
            <span
              key={x.key}
              aria-hidden
              style={{ width: 28, height: 6, borderRadius: 3, background: i <= idx ? LAB : 'rgba(255,255,255,0.18)' }}
            />
          ))}
        </div>
        <div style={{ ...panel, padding: 28, maxWidth: 560 }} className="text-center">
          <div style={{ fontSize: 52 }} aria-hidden>{t.emoji}</div>
          <h2 className="mb-3 text-2xl font-black" style={{ color: LAB }}>{t.title}</h2>
          <div className="space-y-3">
            {t.body.map((line, i) => (
              <p key={i} className="text-white/80">{line}</p>
            ))}
          </div>
        </div>
        <button
          style={primaryBtn}
          onClick={() => {
            markTutorialSeen(t.key);
            setPhase(next ? next.phase : 'save-select');
          }}
          aria-label={next ? 'Next lesson' : 'Go to run picker'}
        >
          {next ? 'Got it — next' : "Let's investigate →"}
        </button>
      </Centered>
    );
  }

  function SourcePickerView() {
    // Always offer the sample as a guaranteed-playable option.
    const realSources = availableSources.filter((s) => s.compositionId !== SAMPLE_ID);
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>Pick a run to audit</h2>
          <p className="text-white/70">
            These are AI agent teams saved from other labs. Open one up and inspect its run.
          </p>
        </div>

        {isLoadingSources && (
          <p className="text-center text-white/70" aria-live="polite">Loading your saved runs…</p>
        )}

        {!isLoadingSources && realSources.length === 0 && (
          <div style={{ ...panel, padding: 16 }} className="text-center" role="note">
            <p className="text-white/75">
              No saved runs yet — those come from building teams in <strong className="text-white">Agent
              Atelier</strong> and <strong className="text-white">MCP Lab</strong>. No problem: start with the
              practice run below, then come back with your own!
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {realSources.map((s) => (
            <SourceCard key={s.compositionId} source={s} />
          ))}
          <SourceCard source={SAMPLE_SOURCE} sample />
        </div>
      </div>
    );
  }

  function SourceCard({ source, sample = false }: { source: ReplaySource; sample?: boolean }) {
    const desc = sample
      ? { agentNames: SAMPLE_COMP.team.map((p) => getAgent(p.agentId)?.name ?? p.agentId), toolNames: [], wireCount: 0, hasTools: false }
      : describeSource(source, savesCache);
    return (
      <button
        onClick={() => playSource(source)}
        aria-label={`Audit the run ${source.name}`}
        style={{ ...panel, padding: 18, textAlign: 'left', cursor: 'pointer', border: sample ? `1px solid ${LAB}` : panel.border }}
        className="flex flex-col gap-2 transition hover:brightness-125"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-white">{source.name}</h3>
          <span
            style={{
              fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
              background: sample ? 'rgba(233,69,245,0.22)' : 'rgba(255,255,255,0.08)',
              color: sample ? LAB : 'rgba(255,255,255,0.75)',
            }}
          >
            {sample ? 'Practice' : source.origin === 'mcp' ? 'MCP team' : 'Atelier team'}
          </span>
        </div>
        {desc && (
          <p className="text-sm text-white/70">
            🤖 {desc.agentNames.join(', ') || 'no agents'}
            {desc.hasTools ? ` · 🧰 ${desc.toolNames.join(', ')}` : ''}
          </p>
        )}
        <p className="text-xs text-white/60">
          {sample ? 'A quick team with a few mistakes to catch — great for learning.' : 'Tap to open up this run and inspect every step.'}
        </p>
      </button>
    );
  }

  function ReplayError() {
    let msg = 'This run could not be opened.';
    if (error?.kind === 'no-team') msg = 'This saved team is empty — nothing to replay.';
    else if (error?.kind === 'cycle-in-team') msg = 'This team wires back on itself (a loop), so it can\'t run.';
    else if (error?.kind === 'composition-not-found') msg = 'That saved run could not be found.';
    else if (error?.kind === 'simulator-error') msg = `The run hit a snag (${error.simKind}).`;
    return (
      <Centered>
        <div style={{ fontSize: 52 }} aria-hidden>🧩</div>
        <h2 className="text-2xl font-black" style={{ color: LAB }}>Couldn&apos;t open that run</h2>
        <p className="max-w-md text-white/75" role="alert">{msg}</p>
        <button style={primaryBtn} onClick={() => setPhase('save-select')} aria-label="Pick another run">
          ← Pick another run
        </button>
      </Centered>
    );
  }

  function ReplayView() {
    if (error) return ReplayError();
    if (!current) return null;
    const spec = getAgent(current.base.agentId);
    const inspectSpec = inspectAgentId ? getAgent(inspectAgentId) : spec;

    function onTimelineKey(e: KeyboardEvent<HTMLDivElement>) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); scrubNext(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); scrubPrev(); }
      else if (e.key === 'Home') { e.preventDefault(); setScrub(0); }
      else if (e.key === 'End') { e.preventDefault(); setScrub(steps.length - 1); }
    }

    const inputEntries = Object.entries(current.base.inputs);
    const outputEntries = Object.entries(current.base.outputs);

    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 py-4">
        <header className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>Inspect the run</h2>
          <p className="text-sm text-white/70">
            Step {scrubIndex + 1} of {steps.length} · total run time {totalMs} ms. Scrub through and flag
            anything that looks wrong.
          </p>
        </header>

        {/* Agents-in-this-run legend (setInspectAgent) */}
        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Agents in this run">
          {trajectoryAgents.map(({ agentId, firstStep }) => {
            const a = getAgent(agentId);
            const active = inspectAgentId === agentId;
            return (
              <button
                key={agentId}
                onClick={() => { setInspectAgent(agentId); setScrub(firstStep); }}
                aria-pressed={active}
                aria-label={`Focus agent ${a?.name ?? agentId}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                  padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
                  background: active ? 'rgba(233,69,245,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? LAB : 'rgba(255,255,255,0.14)'}`,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <span aria-hidden style={{ width: 9, height: 9, borderRadius: 999, background: a?.accentHex ?? '#fff' }} />
                {a?.name ?? agentId}
              </button>
            );
          })}
        </div>

        {/* Timeline scrubber — keyboard-operable */}
        <div
          role="group"
          aria-label={`Trajectory scrubber, step ${scrubIndex + 1} of ${steps.length}. Use left and right arrow keys.`}
          tabIndex={0}
          onKeyDown={onTimelineKey}
          style={{ ...panel, padding: 14, outline: 'none' }}
          className="focus:ring-2"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrubPrev()}
              disabled={scrubIndex === 0}
              aria-label="Previous step"
              style={{ ...ghostBtn, padding: '8px 14px', opacity: scrubIndex === 0 ? 0.4 : 1 }}
            >
              ◀
            </button>

            <ol className="flex flex-1 items-stretch gap-1.5 overflow-x-auto" aria-label="Steps">
              {steps.map((s, i) => {
                const a = getAgent(s.base.agentId);
                const active = i === scrubIndex;
                const tagged = s.playerTags.length > 0;
                return (
                  <li key={i} className="flex-1" style={{ minWidth: 76 }}>
                    <button
                      onClick={() => setScrub(i)}
                      aria-current={active ? 'step' : undefined}
                      aria-label={`Step ${i + 1}: ${a?.name ?? s.base.agentId}${tagged ? `, you flagged ${s.playerTags.length}` : ''}`}
                      style={{
                        width: '100%', borderRadius: 10, padding: '8px 6px', cursor: 'pointer', textAlign: 'center',
                        background: active ? 'rgba(233,69,245,0.22)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? LAB : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      <span aria-hidden style={{ display: 'block', width: 10, height: 10, borderRadius: 999, margin: '0 auto 4px', background: a?.accentHex ?? '#fff' }} />
                      <span className="block text-white" style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                      <span className="block text-white/70" style={{ fontSize: 10 }}>{a?.name ?? s.base.agentId}</span>
                      {tagged && <span aria-hidden style={{ fontSize: 10 }}>🚩{s.playerTags.length}</span>}
                    </button>
                  </li>
                );
              })}
            </ol>

            <button
              onClick={() => scrubNext()}
              disabled={scrubIndex === steps.length - 1}
              aria-label="Next step"
              style={{ ...ghostBtn, padding: '8px 14px', opacity: scrubIndex === steps.length - 1 ? 0.4 : 1 }}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Step detail */}
        <section style={{ ...panel, padding: 20 }} aria-label={`Details for step ${scrubIndex + 1}`} aria-live="polite">
          <div className="mb-3 flex items-center gap-2">
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: 999, background: inspectSpec?.accentHex ?? '#fff' }} />
            <h3 className="text-lg font-bold text-white">🤖 {inspectSpec?.name ?? current.base.agentId}</h3>
            <span className="text-xs text-white/60">{inspectSpec?.role}</span>
            <span className="ml-auto text-xs text-white/60">{current.base.durationMs} ms</span>
          </div>

          <p className="mb-4 text-sm text-white/80">{current.base.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Inputs */}
            <div style={{ borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">📥 Inputs</div>
              {inputEntries.length === 0 ? (
                <p className="text-sm text-white/60">No inputs.</p>
              ) : (
                <ul className="space-y-1.5">
                  {inputEntries.map(([k, v]) => {
                    const missing = looksMissing(v);
                    return (
                      <li key={k} className="text-sm">
                        <span className="text-white/70">{k}: </span>
                        <span style={{ color: missing ? '#ff9b82' : 'rgba(255,255,255,0.9)' }}>
                          {fmtValue(v)}{missing ? ' ⚠' : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Outputs */}
            <div style={{ borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">📤 Outputs</div>
              {outputEntries.length === 0 ? (
                <p className="text-sm text-white/60">No outputs.</p>
              ) : (
                <ul className="space-y-1.5">
                  {outputEntries.map(([k, v]) => {
                    const isLast = scrubIndex === steps.length - 1;
                    const used = usedLater(v, scrubIndex);
                    return (
                      <li key={k} className="text-sm">
                        <span className="text-white/70">{k}: </span>
                        <span className="text-white/90">{fmtValue(v)}</span>
                        {!isLast && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: used ? '#5be6a8' : '#e6c46b' }}>
                            {used ? '→ used later' : '→ goes nowhere'}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Player's tags on this step + tag button */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {current.playerTags.length > 0 ? (
              current.playerTags.map((c) => (
                <span
                  key={c}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '3px 10px',
                    borderRadius: 999, background: `${ISSUE_CATEGORY_META[c].color}22`,
                    border: `1px solid ${ISSUE_CATEGORY_META[c].color}`, color: '#fff',
                  }}
                >
                  {ISSUE_CATEGORY_META[c].emoji} {ISSUE_CATEGORY_META[c].label}
                </span>
              ))
            ) : (
              <span className="text-xs text-white/60">You haven&apos;t flagged this step yet.</span>
            )}
            <button
              onClick={() => beginAnnotateStep(scrubIndex)}
              aria-label={`Tag issues on step ${scrubIndex + 1}`}
              style={{ ...ghostBtn, marginLeft: 'auto', padding: '8px 16px' }}
            >
              🚩 Tag this step
            </button>
          </div>
        </section>

        {/* Detective tips + grade */}
        <div className="flex flex-col items-center gap-3">
          <details style={{ ...panel, padding: 12, width: '100%', maxWidth: 640 }}>
            <summary className="cursor-pointer text-sm font-bold text-white/80">🔎 What should a detective look for?</summary>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              <li>• An input that says <span style={{ color: '#ff9b82' }}>(no … wired)</span> — the agent was missing information.</li>
              <li>• An output that <span style={{ color: '#e6c46b' }}>goes nowhere</span> — wasted work.</li>
              <li>• Two steps that make almost the same thing — a redundant step.</li>
              <li>• A long run with no &quot;Critic&quot; to double-check the work.</li>
            </ul>
          </details>
          <button
            style={primaryBtn}
            onClick={() => { recomputeSummary(); setPhase('report'); }}
            aria-label="Grade my analysis"
          >
            ✅ Grade my analysis
          </button>
        </div>
      </div>
    );
  }

  function AnnotateView() {
    const idx = annotateStepIndex ?? scrubIndex;
    const step = steps[idx];
    if (!step) { cancelAnnotate(); return null; }
    const spec = getAgent(step.base.agentId);
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 py-4">
        <header className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>Tag step {idx + 1}</h2>
          <p className="text-sm text-white/70">
            🤖 {spec?.name ?? step.base.agentId} — {step.base.summary}
          </p>
        </header>

        <section style={{ ...panel, padding: 18 }} aria-label="Issue categories">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">
            What went wrong here? (tap all that apply)
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATEGORY_ORDER.map((c) => {
              const meta = ISSUE_CATEGORY_META[c];
              const on = step.playerTags.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleStepTag(idx, c)}
                  aria-pressed={on}
                  aria-label={`${meta.label}. ${meta.hint}`}
                  title={meta.hint}
                  style={{
                    textAlign: 'left', borderRadius: 10, padding: 10, cursor: 'pointer',
                    background: on ? `${meta.color}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${on ? meta.color : 'rgba(255,255,255,0.12)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span aria-hidden style={{ fontSize: 18 }}>{meta.emoji}</span>
                    <span className="font-semibold text-white">{meta.label}</span>
                    {on && <span aria-hidden style={{ marginLeft: 'auto', color: meta.color }}>✓</span>}
                  </div>
                  <div className="mt-0.5 text-white/60" style={{ fontSize: 11 }}>{meta.hint}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ ...panel, padding: 18 }}>
          <label htmlFor="gb-note" className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/60">
            📝 Detective note (optional)
          </label>
          <textarea
            id="gb-note"
            value={step.playerNote ?? ''}
            onChange={(e) => setStepNote(idx, e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="What did you notice on this step?"
            style={{
              width: '100%', borderRadius: 10, padding: '10px 12px', resize: 'vertical',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff',
            }}
          />
          <div className="mt-1 text-right text-xs text-white/60">{(step.playerNote ?? '').length}/200</div>
        </section>

        <div className="flex justify-center">
          <button style={primaryBtn} onClick={() => cancelAnnotate()} aria-label="Done tagging, back to the run">
            Done →
          </button>
        </div>
      </div>
    );
  }

  function ReportView() {
    if (!summary) return null;
    const pct = Math.round(summary.accuracy * 100);
    const win = summary.stars >= 2;
    const detectedTotal = Object.values(summary.detectedByCategory).reduce((a, b) => a + b, 0);
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5 py-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div style={{ fontSize: 52 }} aria-hidden>{win ? '🎉' : '🔍'}</div>
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            {win ? 'Sharp detective work!' : 'Analysis graded'}
          </h2>
          <div className="my-2"><Stars n={Math.max(1, summary.stars)} size={36} /></div>
          <p className="text-white/80">Accuracy: <strong style={{ color: LAB }}>{pct}%</strong></p>
        </motion.div>

        {/* Scoreboard */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Caught" value={summary.truePositiveCount} tone="#5be6a8" />
          <Stat label="Missed" value={summary.underTagCount} tone="#e6c46b" />
          <Stat label="False alarms" value={summary.overTagCount} tone="#ff9b82" />
        </div>

        <div style={{ ...panel, padding: 18 }}>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-white/70">
            The auditor found {detectedTotal} issue{detectedTotal === 1 ? '' : 's'} across {summary.flaggedSteps} step
            {summary.flaggedSteps === 1 ? '' : 's'}
          </h3>
          <ul className="space-y-1.5">
            {CATEGORY_ORDER.filter((c) => summary.detectedByCategory[c] > 0 || summary.taggedByCategory[c] > 0).map((c) => {
              const meta = ISSUE_CATEGORY_META[c];
              const det = summary.detectedByCategory[c];
              const tag = summary.taggedByCategory[c];
              const good = tag >= det && det > 0;
              return (
                <li key={c} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white/80">
                    {good ? '✅' : det > 0 ? '🟡' : '⬜'} {meta.emoji} {meta.label}
                  </span>
                  <span className="text-xs text-white/60">
                    you {tag} · auditor {det}
                  </span>
                </li>
              );
            })}
            {detectedTotal === 0 && summary.overTagCount === 0 && (
              <li className="text-sm text-white/70">This run was clean — no issues to catch. Nice eye!</li>
            )}
          </ul>
        </div>

        {finalArtifact && (
          <div style={{ ...panel, padding: 16 }}>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">Final artifact the team produced</div>
            <p className="text-sm text-white/80">{finalArtifact}</p>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button style={ghostBtn} onClick={() => setPhase('replay')} aria-label="Back to the run to adjust tags">
            ← Re-inspect
          </button>
          <button style={primaryBtn} onClick={() => setPhase('complete')} aria-label="Finish">
            Finish →
          </button>
        </div>
      </div>
    );
  }

  function CompleteView() {
    return (
      <Centered>
        <div style={{ fontSize: 60 }} aria-hidden>🏆</div>
        <h2 className="text-3xl font-black" style={{ color: LAB }}>Case closed!</h2>
        <p className="max-w-md text-white/80">
          You looked inside an AI&apos;s run and spotted what went wrong. That&apos;s AI observability — the
          skill of making a &quot;black box&quot; into a glass box.
        </p>
        {summary && <Stars n={Math.max(1, summary.stars)} size={32} />}
        <button
          style={primaryBtn}
          onClick={() => {
            firedRef.current = false;
            loadedRef.current = false;
            reset();
            setPhase('save-select');
          }}
          aria-label="Audit another run"
        >
          ↺ Audit another run
        </button>
      </Centered>
    );
  }

  // Called as plain functions (not JSX elements) so markup inlines into this
  // component's tree — the annotate note textarea keeps focus across renders.
  function view() {
    switch (phase) {
      case 'welcome':
        return WelcomeView();
      case 'learn-trajectory':
      case 'learn-inputs-outputs':
      case 'learn-issues':
        return TutorialView();
      case 'save-select':
        return SourcePickerView();
      case 'replay':
      case 'inspect':
        return ReplayView();
      case 'annotate':
        return AnnotateView();
      case 'report':
        return ReportView();
      case 'complete':
        return CompleteView();
      default:
        return WelcomeView();
    }
  }

  return (
    <GameShell title="Glass Box" color={LAB} labNum={11}>
      <div className="w-full px-4" style={{ minHeight: '60vh' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {view()}
          </motion.div>
        </AnimatePresence>
      </div>
    </GameShell>
  );
}

// ─── Layout helpers ────────────────────────────────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center" style={{ minHeight: '55vh' }}>
      {children}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={{ ...panel, padding: 14 }} className="text-center">
      <p className="font-black" style={{ color: tone, fontSize: 30 }}>{value}</p>
      <p className="text-xs text-white/70">{label}</p>
    </div>
  );
}
