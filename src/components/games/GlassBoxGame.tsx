'use client';

// ════════════════════════════════════════════════════════════════
// GLASS BOX LAB — Stage 11F (C2, Lab 11 — Audit step)
// ════════════════════════════════════════════════════════════════
// Lab 11 Agentic AI | #6FFFE6 Mint-Cyan
//
// 10-phase machine (managed by useGlassBoxStore):
//   welcome → learn-trajectory → learn-inputs-outputs → learn-issues
//   → save-select → replay → inspect → annotate → report → complete
//
// Reads existing agent_compositions saves; ALL annotations and audit
// reports live in transient store state. STATELESS by design.
//
// Sub 11F.7a (this commit): welcome / 3 tutorials / save-select.
// Sub 11F.7b: replay / inspect / annotate / report / complete.
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';

import { GameShell } from '@/components/game/GameShell';
import { useActiveChild } from '@/hooks/useChildren';
import { useGlassBoxStore, describeSource } from '@/stores/glassBoxStore';
import { ISSUE_CATEGORY_META } from '@/lib/glassbox/issueDetector';
import type { ReplaySource } from '@/types/glassbox';

const GlassBox3D = dynamic(() => import('@/components/3d/GlassBox3D'), { ssr: false });
const GlassBoxEnvironment = dynamic(
  () => import('@/components/3d/environments/GlassBoxEnvironment'),
  { ssr: false },
);

const LAB11_HEX = '#6FFFE6';
const LAB11_DEEP = '#0A4A47';

// ─── Common chrome bezel panel ───────────────────────────────────

export function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border bg-black/65 backdrop-blur-sm shadow-2xl ${className}`}
      style={{
        borderColor: `${LAB11_HEX}40`,
        boxShadow: `0 0 24px ${LAB11_HEX}25, inset 0 0 0 1px ${LAB11_HEX}30`,
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1 — WELCOME
// ═══════════════════════════════════════════════════════════════

function WelcomePhase() {
  const beginGame = useGlassBoxStore((s) => s.beginGame);

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 grid place-items-center p-8"
    >
      <Panel className="max-w-xl w-full p-10 text-center">
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: LAB11_HEX }}>
          Lab 11 · Stage 3: Audit
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Glass Box Lab
        </h1>
        <p className="font-body text-base text-white/80 mb-8 max-w-md mx-auto leading-relaxed">
          Open up any team you&apos;ve built and look inside. Step through
          its trajectory, find the bugs, tag the misses. Auditing is how
          good teams become great teams.
        </p>
        <button
          type="button"
          onClick={beginGame}
          className="px-8 py-3 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${LAB11_HEX}, ${LAB11_DEEP})`,
            color: '#031416',
            boxShadow: `0 0 20px ${LAB11_HEX}50`,
          }}
          aria-label="Enter the Glass Box"
        >
          Enter the Glass Box
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — LEARN: TRAJECTORY
// ═══════════════════════════════════════════════════════════════

function LearnTrajectoryPhase() {
  const setPhase = useGlassBoxStore((s) => s.setPhase);
  const markSeen = useGlassBoxStore((s) => s.markTutorialSeen);

  function next() {
    markSeen('trajectory');
    setPhase('learn-inputs-outputs');
  }

  return (
    <motion.div
      key="learn-trajectory"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
          Tutorial · 1 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
          What&apos;s a trajectory?
        </h2>
        <p className="font-body text-white/80 mb-4">
          A <span style={{ color: LAB11_HEX }}>trajectory</span> is a step-by-step record of what your team
          did when it ran the mission. Each step is one agent doing its job — taking inputs and making outputs.
        </p>
        <div className="rounded-lg p-4 bg-black/45 mb-5" style={{ border: `1px solid ${LAB11_HEX}30` }}>
          <p className="font-mono text-[11px] uppercase mb-2" style={{ color: LAB11_HEX }}>
            Example
          </p>
          <ol className="space-y-1.5 font-body text-sm text-white/85">
            <li>Step 1: Researcher pulls facts about &quot;birthday party&quot;</li>
            <li>Step 2: Planner breaks it into 3 ordered steps</li>
            <li>Step 3: Estimator guesses time and cost</li>
            <li>Step 4: Writer turns the steps into a friendly paragraph</li>
          </ol>
        </div>
        <p className="font-body text-sm text-white/60 mb-6">
          You&apos;ll be able to scrub forward and back through trajectories with the timeline at the bottom.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — LEARN: INPUTS AND OUTPUTS
// ═══════════════════════════════════════════════════════════════

function LearnInputsOutputsPhase() {
  const setPhase = useGlassBoxStore((s) => s.setPhase);
  const markSeen = useGlassBoxStore((s) => s.markTutorialSeen);

  function next() {
    markSeen('inputsOutputs');
    setPhase('learn-issues');
  }

  return (
    <motion.div
      key="learn-inputs-outputs"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
          Tutorial · 2 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
          Reading inputs and outputs
        </h2>
        <p className="font-body text-white/80 mb-4">
          Each step shows you the <span style={{ color: LAB11_HEX }}>inputs</span> the agent received and
          the <span style={{ color: LAB11_HEX }}>outputs</span> it produced. Compare what it got with what
          it made — that&apos;s where most issues hide.
        </p>
        <ul className="space-y-2 mb-6 font-body text-sm text-white/85">
          <li className="flex gap-2">
            <span style={{ color: LAB11_HEX }} className="font-mono">•</span>
            <span>If an input says <code className="font-mono text-[11px] bg-white/5 px-1 rounded">(no text wired)</code>, the agent ran without that input.</span>
          </li>
          <li className="flex gap-2">
            <span style={{ color: LAB11_HEX }} className="font-mono">•</span>
            <span>If an output isn&apos;t consumed by any later step, the agent did wasted work.</span>
          </li>
          <li className="flex gap-2">
            <span style={{ color: LAB11_HEX }} className="font-mono">•</span>
            <span>If two agents made the same kind of output, you&apos;ve got a redundant step.</span>
          </li>
        </ul>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — LEARN: SPOTTING ISSUES
// ═══════════════════════════════════════════════════════════════

function LearnIssuesPhase() {
  const setPhase = useGlassBoxStore((s) => s.setPhase);
  const markSeen = useGlassBoxStore((s) => s.markTutorialSeen);

  function next() {
    markSeen('issues');
    setPhase('save-select');
  }

  const categories = useMemo(() => Object.entries(ISSUE_CATEGORY_META), []);

  return (
    <motion.div
      key="learn-issues"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-3xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
          Tutorial · 3 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
          Issues to spot
        </h2>
        <p className="font-body text-white/80 mb-4">
          Tag each step with one or more issue types. The auditor will tell you what it caught
          on its own; your job is to catch the rest.
        </p>
        <div className="grid sm:grid-cols-2 gap-2 mb-6">
          {categories.map(([id, meta]) => (
            <div
              key={id}
              className="rounded-lg p-3 bg-black/45"
              style={{ border: `1px solid ${meta.color}40` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base" aria-hidden="true">{meta.emoji}</span>
                <span className="font-display text-sm font-bold text-white">{meta.label}</span>
                <span
                  className="ml-auto font-mono text-[9px] uppercase px-1.5 py-0.5 rounded"
                  style={{ background: `${meta.color}25`, color: meta.color }}
                >
                  sev {meta.severity}
                </span>
              </div>
              <p className="font-body text-[11px] text-white/65 leading-snug">{meta.hint}</p>
            </div>
          ))}
        </div>
        <p className="font-body text-sm text-white/60 mb-6">
          Pick a saved team next and try auditing it.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
          >
            Pick a save →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — SAVE SELECT
// ═══════════════════════════════════════════════════════════════

function SaveSelectPhase() {
  const availableSources = useGlassBoxStore((s) => s.availableSources);
  const savesCache = useGlassBoxStore((s) => s.savesCache);
  const isLoading = useGlassBoxStore((s) => s.isLoadingSources);
  const loadSources = useGlassBoxStore((s) => s.loadSources);
  const pickSource = useGlassBoxStore((s) => s.pickSource);
  const activeChild = useActiveChild();

  useEffect(() => {
    if (activeChild?.id) void loadSources(activeChild.id);
  }, [activeChild?.id, loadSources]);

  return (
    <motion.div
      key="save-select"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 overflow-y-auto p-6"
    >
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <Panel className="p-6">
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
            Pick a save to audit
          </p>
          <h2 className="font-display text-2xl font-bold text-white mb-1">
            Your saved teams
          </h2>
          <p className="font-body text-sm text-white/65">
            Replays are reconstructed from your Atelier and MCP Lab saves. Each replay is fresh —
            audit the same save twice, get two passes through the trajectory.
          </p>
        </Panel>

        {isLoading && (
          <Panel className="p-4 text-center">
            <p className="font-body text-sm text-white/60">Loading saves…</p>
          </Panel>
        )}

        {!isLoading && availableSources.length === 0 && (
          <Panel className="p-6 text-center">
            <p className="font-body text-sm text-white/65 mb-2">
              No saves yet. Build a team in the Atelier or equip one in MCP Lab first.
            </p>
          </Panel>
        )}

        {!isLoading && availableSources.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {availableSources.map((source) => (
              <SaveCard
                key={source.compositionId}
                source={source}
                summary={describeSource(source, savesCache)}
                onPick={() => pickSource(source.compositionId)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface SaveCardProps {
  source: ReplaySource;
  summary: ReturnType<typeof describeSource>;
  onPick: () => void;
}

function SaveCard({ source, summary, onPick }: SaveCardProps) {
  const originBadge =
    source.origin === 'mcp'
      ? { label: 'MCP', color: '#FFD93D' }
      : { label: 'Atelier', color: LAB11_HEX };
  return (
    <button
      type="button"
      onClick={onPick}
      className="text-left rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(10,74,71,0.3))',
        border: `1px solid ${LAB11_HEX}40`,
        boxShadow: `inset 0 0 0 1px ${LAB11_HEX}20`,
      }}
      aria-label={`Audit ${source.name}`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="font-display text-base font-bold text-white truncate">{source.name}</h3>
        <span
          className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: `${originBadge.color}20`, color: originBadge.color }}
        >
          {originBadge.label}
        </span>
      </div>
      {summary && (
        <>
          <p className="font-body text-[11px] text-white/65 mb-1 leading-snug">
            {summary.agentNames.join(' · ')}
          </p>
          {summary.toolNames.length > 0 && (
            <p className="font-body text-[11px] text-white/45 mb-1 italic">
              tools: {summary.toolNames.join(', ')}
            </p>
          )}
          <p className="font-mono text-[10px] text-white/45">
            {summary.agentNames.length} agents · {summary.wireCount} wires
            {summary.hasTools ? ` · ${summary.toolNames.length} tools` : ''}
          </p>
        </>
      )}
      <p className="font-mono text-[9px] text-white/35 mt-1">
        {new Date(source.createdAt).toLocaleString()}
      </p>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6 — REPLAY (frame-by-frame trajectory scrubber)
// ═══════════════════════════════════════════════════════════════

import { getAgent } from '@/lib/agentatelier/agentRoster';
import { useGameStore } from '@/stores/gameStore';
import type { IssueCategory } from '@/types/glassbox';

function ReplayPhase() {
  const steps = useGlassBoxStore((s) => s.steps);
  const scrubIndex = useGlassBoxStore((s) => s.scrubIndex);
  const setScrub = useGlassBoxStore((s) => s.setScrub);
  const scrubNext = useGlassBoxStore((s) => s.scrubNext);
  const scrubPrev = useGlassBoxStore((s) => s.scrubPrev);
  const setPhase = useGlassBoxStore((s) => s.setPhase);
  const finalArtifact = useGlassBoxStore((s) => s.finalArtifact);

  const activeStep = steps[scrubIndex];

  // Keyboard scrubbing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        scrubPrev();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        scrubNext();
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scrubNext, scrubPrev]);

  if (steps.length === 0) {
    return (
      <div className="absolute inset-0 grid place-items-center p-8">
        <Panel className="max-w-md p-6 text-center">
          <p className="font-body text-sm text-white/65 mb-3">
            No trajectory to replay. Pick a save first.
          </p>
          <button
            type="button"
            onClick={() => setPhase('save-select')}
            className="px-4 py-2 rounded font-mono text-xs"
            style={{ background: LAB11_HEX, color: '#031416' }}
          >
            ← Save select
          </button>
        </Panel>
      </div>
    );
  }

  const a = activeStep ? getAgent(activeStep.base.agentId) : null;
  const isAtEnd = scrubIndex >= steps.length - 1;

  return (
    <motion.div
      key="replay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid grid-rows-[auto_1fr_auto] gap-3 p-4"
    >
      <Panel className="p-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: LAB11_HEX }}>
            Step {scrubIndex + 1} of {steps.length}
          </p>
          <p className="font-display text-base font-bold text-white">
            {a?.name ?? 'Unknown agent'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPhase('save-select')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 hover:text-white border border-white/20"
          >
            ← Save select
          </button>
          <button
            type="button"
            onClick={() => setPhase('report')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/85 border border-white/20 hover:text-white"
            aria-label="See report"
          >
            Report →
          </button>
        </div>
      </Panel>

      <Panel className="overflow-y-auto p-4">
        {activeStep && a && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase mb-2" style={{ color: LAB11_HEX }}>
                Inputs received
              </p>
              {Object.entries(activeStep.base.inputs).map(([name, v]) => (
                <div key={name} className="mb-2 px-2.5 py-2 rounded bg-black/45 border border-white/10">
                  <p className="font-mono text-[11px] text-white/55 mb-0.5">{name}</p>
                  <p className="font-body text-xs text-white/85 break-words">
                    {typeof v === 'string' ? v : JSON.stringify(v)}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase mb-2" style={{ color: LAB11_HEX }}>
                Outputs produced
              </p>
              {Object.entries(activeStep.base.outputs).map(([name, v]) => (
                <div
                  key={name}
                  className="mb-2 px-2.5 py-2 rounded bg-black/45"
                  style={{ border: `1px solid ${a.accentHex}40` }}
                >
                  <p className="font-mono text-[11px]" style={{ color: a.accentHex }}>
                    {name}
                  </p>
                  <p className="font-body text-xs text-white/85 break-words">
                    {typeof v === 'string' ? v : JSON.stringify(v)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeStep && (
          <p className="mt-3 font-body text-xs text-white/65 italic">
            Summary: {activeStep.base.summary}
          </p>
        )}
        {activeStep?.detected && activeStep.detected.length > 0 && (
          <div className="mt-3">
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: '#FF7050' }}>
              Auditor flagged this step
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeStep.detected.map((cat) => {
                const meta = ISSUE_CATEGORY_META[cat];
                return (
                  <span
                    key={cat}
                    className="font-mono text-[10px] px-2 py-0.5 rounded"
                    style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}
                  >
                    {meta.emoji} {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {isAtEnd && finalArtifact && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg"
            style={{ background: `${LAB11_HEX}10`, border: `1px solid ${LAB11_HEX}40` }}
          >
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB11_HEX }}>
              Final artifact
            </p>
            <p className="font-body text-sm text-white/85 leading-relaxed">{finalArtifact}</p>
          </motion.div>
        )}
      </Panel>

      {/* Scrubber bar */}
      <Panel className="p-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={scrubPrev}
            disabled={scrubIndex === 0}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/85 border border-white/20 disabled:opacity-40"
            aria-label="Previous step"
          >
            ◀ prev
          </button>
          <button
            type="button"
            onClick={scrubNext}
            disabled={scrubIndex >= steps.length - 1}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/85 border border-white/20 disabled:opacity-40"
            aria-label="Next step"
          >
            next ▶
          </button>
          <span className="font-mono text-[10px] text-white/55 ml-2">
            ← / → to scrub
          </span>
          <button
            type="button"
            onClick={() => useGlassBoxStore.getState().beginAnnotateStep(scrubIndex)}
            className="ml-auto px-3 py-1.5 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Tag issues for this step"
          >
            Tag this step
          </button>
        </div>
        <div className="flex gap-1" role="slider" aria-valuemin={0} aria-valuemax={steps.length - 1} aria-valuenow={scrubIndex}>
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setScrub(i)}
              className="flex-1 h-2 rounded-sm transition-all"
              style={{
                background:
                  i === scrubIndex
                    ? LAB11_HEX
                    : s.detected.length > 0
                    ? '#FF705060'
                    : s.playerTags.length > 0
                    ? `${LAB11_HEX}60`
                    : 'rgba(255,255,255,0.1)',
              }}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 8 — ANNOTATE (issue-tag form for the active step)
// ═══════════════════════════════════════════════════════════════

function AnnotatePhase() {
  const annotateStepIndex = useGlassBoxStore((s) => s.annotateStepIndex);
  const steps = useGlassBoxStore((s) => s.steps);
  const cancelAnnotate = useGlassBoxStore((s) => s.cancelAnnotate);
  const toggleStepTag = useGlassBoxStore((s) => s.toggleStepTag);
  const setStepNote = useGlassBoxStore((s) => s.setStepNote);

  if (annotateStepIndex === null || !steps[annotateStepIndex]) {
    return (
      <div className="absolute inset-0 grid place-items-center p-8">
        <Panel className="p-4 text-center">
          <p className="font-body text-sm text-white/65 mb-3">No step selected.</p>
          <button
            type="button"
            onClick={cancelAnnotate}
            className="px-4 py-2 rounded font-mono text-xs"
            style={{ background: LAB11_HEX, color: '#031416' }}
          >
            ← Replay
          </button>
        </Panel>
      </div>
    );
  }

  const step = steps[annotateStepIndex];
  const a = getAgent(step.base.agentId);
  const categories: IssueCategory[] = [
    'missing-input',
    'unused-output',
    'tool-misuse',
    'redundant-step',
    'forbidden-tool',
    'no-critic',
    'short-loop',
  ];

  return (
    <motion.div
      key="annotate"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-6">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
          Annotate · step {annotateStepIndex + 1}
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-4">
          Tag issues for {a?.name ?? 'this step'}
        </h2>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {categories.map((cat) => {
            const meta = ISSUE_CATEGORY_META[cat];
            const tagged = step.playerTags.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleStepTag(annotateStepIndex, cat)}
                className="text-left rounded-lg p-2.5 transition-all hover:scale-[1.02]"
                style={{
                  background: tagged ? `${meta.color}25` : 'rgba(0,0,0,0.45)',
                  border: `1px solid ${tagged ? meta.color : meta.color + '40'}`,
                  boxShadow: tagged ? `0 0 8px ${meta.color}40` : undefined,
                }}
                aria-pressed={tagged}
                aria-label={`${meta.label} ${tagged ? 'tagged' : 'untagged'}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base" aria-hidden="true">{meta.emoji}</span>
                  <span className="font-display text-sm font-bold text-white">{meta.label}</span>
                  {tagged && <span className="ml-auto text-[11px]" style={{ color: meta.color }}>✓</span>}
                </div>
                <p className="font-body text-[10px] text-white/55 leading-snug">{meta.hint}</p>
              </button>
            );
          })}
        </div>

        <label className="block mb-4">
          <span className="font-mono text-[10px] uppercase text-white/55 mb-1 block">
            Note (optional, ≤ 200 chars)
          </span>
          <textarea
            value={step.playerNote ?? ''}
            onChange={(e) => setStepNote(annotateStepIndex, e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="What did you notice about this step?"
            className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white font-body text-sm focus:outline-none focus:border-white/40 resize-none"
            aria-label="Audit note"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelAnnotate}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Done annotating"
          >
            Done
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 9 — REPORT (summary + score)
// ═══════════════════════════════════════════════════════════════

function ReportPhase() {
  const summary = useGlassBoxStore((s) => s.summary);
  const steps = useGlassBoxStore((s) => s.steps);
  const setPhase = useGlassBoxStore((s) => s.setPhase);
  const reset = useGlassBoxStore((s) => s.reset);
  const updateScore = useGameStore((s) => s.updateScore);
  const advanceRound = useGameStore((s) => s.advanceRound);
  const isComplete = useGameStore((s) => s.isComplete);

  useEffect(() => {
    if (!summary) return;
    updateScore(summary.stars * 50);
  }, [summary, updateScore]);

  if (!summary) {
    return (
      <div className="absolute inset-0 grid place-items-center p-8">
        <Panel className="p-4 text-white/60 font-body text-sm">No summary yet.</Panel>
      </div>
    );
  }

  return (
    <motion.div
      key="report"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 overflow-y-auto p-6"
    >
      <div className="max-w-2xl mx-auto py-6">
        <Panel className="p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
            Audit report
          </p>
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.15 }}
                className="text-5xl"
                style={{ color: i < summary.stars ? '#FFD93D' : 'rgba(255,255,255,0.15)' }}
                aria-hidden="true"
              >
                ★
              </motion.span>
            ))}
          </div>
          <p className="font-display text-3xl font-bold text-white mb-1" aria-live="polite">
            {summary.stars} / 3 stars
          </p>
          <p className="font-mono text-xs text-white/60 mb-6">
            Accuracy: {Math.round(summary.accuracy * 100)}%
          </p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            <ReportStat
              label="True positives"
              value={summary.truePositiveCount}
              color={LAB11_HEX}
            />
            <ReportStat
              label="Over-tagged"
              value={summary.overTagCount}
              color="#D9A430"
            />
            <ReportStat
              label="Missed"
              value={summary.underTagCount}
              color="#FF7050"
            />
          </div>

          <p className="font-body text-xs text-white/65 mb-5 leading-relaxed">
            {summary.flaggedSteps} of {summary.totalSteps} steps had at least one auditor-detected issue.
            You tagged {Object.values(summary.taggedByCategory).reduce((s, n) => s + n, 0)}{' '}
            issue{Object.values(summary.taggedByCategory).reduce((s, n) => s + n, 0) === 1 ? '' : 's'}.
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setPhase('replay')}
              className="px-5 py-2 rounded font-mono text-xs text-white/85 border border-white/30 hover:bg-white/5"
              aria-label="Back to replay"
            >
              ← Back to replay
            </button>
            <button
              type="button"
              onClick={() => {
                advanceRound();
                if (isComplete) {
                  setPhase('complete');
                } else {
                  reset();
                  setPhase('save-select');
                }
              }}
              className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
              style={{ background: LAB11_HEX, color: '#031416' }}
              aria-label="Audit another save"
            >
              Audit another →
            </button>
          </div>

          {/* Per-category breakdown for transparency */}
          {steps.length > 0 && (
            <details className="mt-6 text-left">
              <summary className="font-mono text-[10px] uppercase cursor-pointer text-white/55 hover:text-white/85">
                Detection vs your tags
              </summary>
              <ul className="mt-2 space-y-1">
                {(Object.keys(ISSUE_CATEGORY_META) as IssueCategory[]).map((cat) => {
                  const meta = ISSUE_CATEGORY_META[cat];
                  const detected = summary.detectedByCategory[cat];
                  const tagged = summary.taggedByCategory[cat];
                  if (detected === 0 && tagged === 0) return null;
                  return (
                    <li
                      key={cat}
                      className="flex items-center gap-2 px-2 py-1 rounded font-mono text-[11px]"
                      style={{ background: 'rgba(0,0,0,0.45)' }}
                    >
                      <span aria-hidden="true">{meta.emoji}</span>
                      <span className="text-white/85 flex-1">{meta.label}</span>
                      <span style={{ color: meta.color }}>
                        auditor {detected} · you {tagged}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </Panel>
      </div>
    </motion.div>
  );
}

function ReportStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-lg p-2.5"
      style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${color}30` }}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color }}>
        {label}
      </p>
      <p className="font-display text-2xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 10 — COMPLETE
// ═══════════════════════════════════════════════════════════════

function CompletePhase() {
  const completeGame = useGameStore((s) => s.completeGame);

  useEffect(() => {
    completeGame();
  }, [completeGame]);

  return (
    <motion.div
      key="complete"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-md w-full p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
          Audit session complete
        </p>
        <h2 className="font-display text-2xl font-bold text-white mb-3">
          You&apos;ve audited {TOTAL_ROUNDS} runs!
        </h2>
        <p className="font-body text-sm text-white/75 leading-relaxed">
          Auditing teaches you to predict failures. Up next:{' '}
          <span style={{ color: LAB11_HEX }}>Harness Forge</span> — wrap teams in safety harnesses
          and see what each layer catches.
        </p>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN — Phase router + GameShell wrapper
// ═══════════════════════════════════════════════════════════════

const TOTAL_ROUNDS = 4;

export function GlassBoxGame() {
  const phase = useGlassBoxStore((s) => s.phase);
  const reset = useGlassBoxStore((s) => s.reset);

  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  return (
    <GameShell
      gameId="glass-box"
      title="Glass Box Lab"
      worldNumber={11}
      worldColor={LAB11_HEX}
      totalRounds={TOTAL_ROUNDS}
      hints={3}
      showTimer
    >
      <div className="absolute inset-0 pointer-events-none">
        <GlassBoxEnvironment />
        <GlassBox3D />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'welcome' && <WelcomePhase key="welcome" />}
        {phase === 'learn-trajectory' && <LearnTrajectoryPhase key="learn-trajectory" />}
        {phase === 'learn-inputs-outputs' && <LearnInputsOutputsPhase key="learn-inputs-outputs" />}
        {phase === 'learn-issues' && <LearnIssuesPhase key="learn-issues" />}
        {phase === 'save-select' && <SaveSelectPhase key="save-select" />}
        {phase === 'replay' && <ReplayPhase key="replay" />}
        {phase === 'inspect' && <ReplayPhase key="inspect" />}
        {phase === 'annotate' && <AnnotatePhase key="annotate" />}
        {phase === 'report' && <ReportPhase key="report" />}
        {phase === 'complete' && <CompletePhase key="complete" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default GlassBoxGame;

// ─── Local exports for Sub 11F.7b ────────────────────────────────

export const _LAB11_HEX = LAB11_HEX;
