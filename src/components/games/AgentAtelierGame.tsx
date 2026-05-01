'use client';

// ================================================================
// AGENT ATELIER — Stage 11D (C1, Lab 11 opener)
// ================================================================
// Lab 11 Agentic AI | #6FFFE6 Mint-Cyan
// Build → Equip → Constrain narrative arc — Stage 1 (Build).
//
// 12-phase machine (managed by useAgentAtelierStore):
//   welcome → learn-roster → learn-wiring → learn-mission →
//   mission-select → build → wire → simulate → grade → save →
//   review → complete
//
// 3D atelier renders behind the UI (D3D-1 desktop-only, dynamic
// import w/ ssr:false). UI is 2D-HTML overlaid via fixed-position
// panels on top of the persistent CockpitCanvas.
//
// Sub 11D.7 SPLIT into a/b/c (scope management):
//   • Sub 11D.7a (this commit): welcome / learn-* / mission-select
//   • Sub 11D.7b:                 build / wire / simulate
//   • Sub 11D.7c:                 grade / save / review / complete
// ================================================================

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';

import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useAgentAtelierStore } from '@/stores/agentAtelierStore';
import { AGENT_ROSTER, rosterForBand } from '@/lib/agentatelier/agentRoster';
import { missionsForBand } from '@/lib/agentatelier/missionLibrary';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import type { AgentSpec, Mission } from '@/types/agentAtelier';

// ─── 3D content (D3D-1: desktop-only, dynamic, ssr:false) ────────

const AgentAtelier3D = dynamic(() => import('@/components/3d/AgentAtelier3D'), { ssr: false });
const AgentAtelierEnvironment = dynamic(
  () => import('@/components/3d/environments/AgentAtelierEnvironment'),
  { ssr: false },
);

const LAB11_HEX = '#6FFFE6';
const LAB11_DEEP = '#0A4A47';

// ─── Common chrome bezel panel ───────────────────────────────────

function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-[${LAB11_HEX}]/40 bg-black/65 backdrop-blur-sm shadow-2xl ${className}`}
      style={{
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
  const beginGame = useAgentAtelierStore((s) => s.beginGame);

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
          Lab 11 · Agentic AI · Stage 1: Build
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Agent Atelier
        </h1>
        <p className="font-body text-base text-white/80 mb-8 max-w-md mx-auto leading-relaxed">
          You&apos;re the lead. Pick specialists, wire them up so each
          one feeds the next, and run the team on a mission. Every save
          here can be re-equipped in the Tool Forge and audited in the
          Glass Box.
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
          aria-label="Start Agent Atelier"
        >
          Enter the Atelier
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — LEARN: THE ROSTER
// ═══════════════════════════════════════════════════════════════

function LearnRosterPhase() {
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const markSeen = useAgentAtelierStore((s) => s.markTutorialSeen);

  const tierA = AGENT_ROSTER.filter((a) => a.unlockTier === 'A');

  function next() {
    markSeen('roster');
    setPhase('learn-wiring');
  }

  return (
    <motion.div
      key="learn-roster"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-3xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
          Tutorial · 1 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
          Meet the specialists
        </h2>
        <p className="font-body text-white/80 mb-6">
          Each specialist does one thing well. They have <span style={{ color: LAB11_HEX }}>inputs</span>{' '}
          (what they need) and <span style={{ color: LAB11_HEX }}>outputs</span> (what they make).
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {tierA.map((a) => (
            <RosterCard key={a.id} agent={a} />
          ))}
        </div>
        <p className="font-body text-sm text-white/60 mb-6">
          Eight more specialists unlock as you grow. For now, these four are your starter set.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Continue to wiring tutorial"
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

function RosterCard({ agent }: { agent: AgentSpec }) {
  return (
    <div
      className="rounded-lg p-3 border bg-black/40"
      style={{
        borderColor: `${agent.accentHex}50`,
        boxShadow: `inset 0 0 0 1px ${agent.accentHex}20`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: agent.accentHex, boxShadow: `0 0 6px ${agent.accentHex}` }}
        />
        <h3 className="font-display text-sm font-bold text-white">{agent.name}</h3>
        <span className="ml-auto font-mono text-[10px] text-white/55">{agent.role}</span>
      </div>
      <p className="font-body text-xs text-white/70 mb-2 leading-relaxed">{agent.blurb}</p>
      <div className="flex flex-wrap gap-1 text-[10px] font-mono">
        {agent.inputs.map((i) => (
          <span key={`in-${i.name}`} className="px-1.5 py-0.5 rounded bg-white/[0.05] text-white/60">
            ← {i.name}:{i.type}
          </span>
        ))}
        {agent.outputs.map((o) => (
          <span
            key={`out-${o.name}`}
            className="px-1.5 py-0.5 rounded text-white/85"
            style={{ background: `${agent.accentHex}25` }}
          >
            {o.name}:{o.type} →
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — LEARN: WIRING (port-type rules)
// ═══════════════════════════════════════════════════════════════

function LearnWiringPhase() {
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const markSeen = useAgentAtelierStore((s) => s.markTutorialSeen);

  function next() {
    markSeen('wiring');
    setPhase('learn-mission');
  }

  return (
    <motion.div
      key="learn-wiring"
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
          Wiring rules
        </h2>
        <p className="font-body text-white/80 mb-6">
          Outputs feed into inputs. Most outputs can feed a{' '}
          <span style={{ color: LAB11_HEX }}>text</span> input — text is universal.
        </p>
        <ul className="space-y-2 mb-6 font-body text-sm text-white/85">
          <WireRule ok>Same type to same type — always works.</WireRule>
          <WireRule ok>Anything → text — text accepts anything.</WireRule>
          <WireRule ok>plan → list — each step becomes an item.</WireRule>
          <WireRule>number → list — types don&apos;t match. Add a writer between them.</WireRule>
          <WireRule>An agent can&apos;t wire to itself.</WireRule>
          <WireRule>No loops — outputs can&apos;t end up feeding their own inputs.</WireRule>
        </ul>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Continue to mission tutorial"
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

function WireRule({ children, ok = false }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <li className="flex gap-2">
      <span
        aria-hidden="true"
        className="flex-shrink-0 inline-grid place-items-center w-5 h-5 rounded-full font-bold text-[11px]"
        style={{
          background: ok ? `${LAB11_HEX}30` : '#FF705030',
          color: ok ? LAB11_HEX : '#FF7050',
        }}
      >
        {ok ? '✓' : '✕'}
      </span>
      <span>{children}</span>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — LEARN: THE MISSION (rubric explainer)
// ═══════════════════════════════════════════════════════════════

function LearnMissionPhase() {
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const markSeen = useAgentAtelierStore((s) => s.markTutorialSeen);

  function next() {
    markSeen('mission');
    setPhase('mission-select');
  }

  return (
    <motion.div
      key="learn-mission"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
          Tutorial · 3 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
          Missions and stars
        </h2>
        <p className="font-body text-white/80 mb-6">
          Every mission has a <span style={{ color: LAB11_HEX }}>rubric</span>: a small list of
          things the team has to do. After the run, you&apos;ll see how many your team got right.
        </p>
        <ul className="space-y-2 mb-6 font-body text-sm text-white/85">
          <li>★☆☆ — Some criteria met (40%+).</li>
          <li>★★☆ — Most criteria met (60%+).</li>
          <li>★★★ — Almost everything met (80%+).</li>
        </ul>
        <p className="font-body text-sm text-white/60 mb-6">
          Smaller teams that nail it get a +10% bonus. Don&apos;t over-stuff your atelier.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Pick a mission"
          >
            Pick a mission →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — MISSION SELECT
// ═══════════════════════════════════════════════════════════════

function MissionSelectPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const lastDifficulty = useAgentAtelierStore((s) => s.lastDifficulty);
  const setDifficulty = useAgentAtelierStore((s) => s.setDifficulty);
  const pickMission = useAgentAtelierStore((s) => s.pickMission);

  const [diff, setDiff] = useState<DifficultyTier | 'all'>(lastDifficulty as DifficultyTier);

  // Only show missions matching age-band AND chosen difficulty
  // (or all difficulties when 'all' is chosen).
  const allowed = useMemo(() => {
    const inBand = missionsForBand(ageBand);
    return diff === 'all' ? inBand : inBand.filter((m) => m.difficulty === diff);
  }, [ageBand, diff]);

  return (
    <motion.div
      key="mission-select"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 overflow-y-auto p-6"
    >
      <div className="max-w-4xl mx-auto pt-8 pb-16">
        <Panel className="p-6 mb-6">
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
            Mission Select
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
            Choose your mission
          </h2>
          <DifficultySelector
            value={diff}
            onChange={(d) => {
              setDiff(d);
              if (d !== 'all' && d !== 'expert') {
                setDifficulty(d);
              }
            }}
            ageBand={ageBand}
          />
        </Panel>

        <div className="grid sm:grid-cols-2 gap-3">
          {allowed.length === 0 && (
            <Panel className="col-span-full p-6 text-center text-white/70 font-body">
              No missions at this difficulty for your age band yet. Try a different difficulty.
            </Panel>
          )}
          {allowed.map((m) => (
            <MissionCard key={m.id} mission={m} onPick={() => pickMission(m.id)} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MissionCard({ mission, onPick }: { mission: Mission; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="text-left rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(10,74,71,0.4))`,
        border: `1px solid ${LAB11_HEX}40`,
        boxShadow: `inset 0 0 0 1px ${LAB11_HEX}20`,
      }}
      aria-label={`Pick mission: ${mission.title}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-display text-base font-bold text-white">{mission.title}</h3>
        <span
          className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded"
          style={{ background: `${LAB11_HEX}20`, color: LAB11_HEX }}
        >
          {mission.difficulty}
        </span>
      </div>
      <p className="font-body text-xs text-white/70 leading-relaxed mb-3">{mission.prompt}</p>
      <div className="flex justify-between items-center font-mono text-[10px] text-white/55">
        <span>par {mission.parAgentCount} agents</span>
        <span>{mission.rubric.length} criteria</span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6 / 7 / 8 placeholders — implemented in Sub 11D.7b
// ═══════════════════════════════════════════════════════════════

function BuildPhasePlaceholder() {
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <Panel className="max-w-md p-6 text-center">
        <p className="font-mono text-xs uppercase mb-2" style={{ color: LAB11_HEX }}>
          Build phase (Sub 11D.7b)
        </p>
        <p className="text-white/70 font-body text-sm mb-4">
          Build / wire / simulate phases land in the next sub-task.
        </p>
        <button
          type="button"
          onClick={() => setPhase('mission-select')}
          className="px-4 py-2 rounded font-mono text-xs"
          style={{ background: LAB11_HEX, color: '#031416' }}
        >
          ← back
        </button>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN — Phase router + GameShell wrapper
// ═══════════════════════════════════════════════════════════════

const TOTAL_ROUNDS = 5;

export function AgentAtelierGame() {
  const phase = useAgentAtelierStore((s) => s.phase);
  const reset = useAgentAtelierStore((s) => s.reset);
  const game = useGameStore;

  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band ?? 'B') as 'A' | 'B' | 'C';

  // On mount: reset transient state. On unmount: same.
  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  // Game-store totalRounds bookkeeping (each completed mission = 1 round).
  // Actual round-advance lives in the grade phase (Sub 11D.7c).
  useEffect(() => {
    void game; // silence unused var lint until grade phase lands
  }, [game]);

  return (
    <GameShell
      gameId="agent-atelier"
      title="Agent Atelier"
      worldNumber={11}
      worldColor={LAB11_HEX}
      totalRounds={TOTAL_ROUNDS}
      hints={3}
      showTimer
    >
      {/* 3D content layer */}
      <div className="absolute inset-0 pointer-events-none">
        <AgentAtelierEnvironment />
        <AgentAtelier3D />
      </div>

      {/* 2D UI layer (phase-routed) */}
      <AnimatePresence mode="wait">
        {phase === 'welcome' && <WelcomePhase key="welcome" />}
        {phase === 'learn-roster' && <LearnRosterPhase key="learn-roster" />}
        {phase === 'learn-wiring' && <LearnWiringPhase key="learn-wiring" />}
        {phase === 'learn-mission' && <LearnMissionPhase key="learn-mission" />}
        {phase === 'mission-select' && <MissionSelectPhase key="mission-select" ageBand={ageBand} />}
        {phase === 'build' && <BuildPhasePlaceholder key="build" />}
        {phase === 'wire' && <BuildPhasePlaceholder key="wire" />}
        {phase === 'simulate' && <BuildPhasePlaceholder key="simulate" />}
        {phase === 'grade' && <BuildPhasePlaceholder key="grade" />}
        {phase === 'save' && <BuildPhasePlaceholder key="save" />}
        {phase === 'review' && <BuildPhasePlaceholder key="review" />}
        {phase === 'complete' && <BuildPhasePlaceholder key="complete" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default AgentAtelierGame;

// ─── Roster helper export (used by build/wire phases in Sub 11D.7b) ─

export function rosterAvailableAt(band: 'A' | 'B' | 'C'): readonly AgentSpec[] {
  return rosterForBand(band);
}
