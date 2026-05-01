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
// PHASES 6-10 — placeholder until Sub 11F.7b
// ═══════════════════════════════════════════════════════════════

function ReplayPlaceholder() {
  const setPhase = useGlassBoxStore((s) => s.setPhase);
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <Panel className="max-w-md p-6 text-center">
        <p className="font-mono text-xs uppercase mb-2" style={{ color: LAB11_HEX }}>
          Replay / inspect / annotate / report / complete (Sub 11F.7b)
        </p>
        <p className="text-white/70 font-body text-sm mb-4">
          Remaining phases land in the next sub-task.
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
        {phase === 'replay' && <ReplayPlaceholder key="replay" />}
        {phase === 'inspect' && <ReplayPlaceholder key="inspect" />}
        {phase === 'annotate' && <ReplayPlaceholder key="annotate" />}
        {phase === 'report' && <ReplayPlaceholder key="report" />}
        {phase === 'complete' && <ReplayPlaceholder key="complete" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default GlassBoxGame;

// ─── Local exports for Sub 11F.7b ────────────────────────────────

export const _LAB11_HEX = LAB11_HEX;
