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
// SHARED — Stage grid (3x4 lattice for placed agents)
// ═══════════════════════════════════════════════════════════════

const STAGE_COLS = 4;
const STAGE_ROWS = 3;

/** Convert grid (col, row) -> store-logical position (-1..1, -1..1). */
function gridToLogical(col: number, row: number): [number, number] {
  const x = (col / (STAGE_COLS - 1)) * 2 - 1; // -1 .. 1
  const y = (row / (STAGE_ROWS - 1)) * 2 - 1; // -1 .. 1
  return [x, y];
}

/** Returns the next free grid slot for placement, scanning row-major. */
function findFreeSlot(occupied: Array<[number, number]>): [number, number] | null {
  for (let r = 0; r < STAGE_ROWS; r++) {
    for (let c = 0; c < STAGE_COLS; c++) {
      const logical = gridToLogical(c, r);
      const taken = occupied.some(
        ([ox, oy]) => Math.abs(ox - logical[0]) < 0.01 && Math.abs(oy - logical[1]) < 0.01,
      );
      if (!taken) return logical;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6 — BUILD (place specialists)
// ═══════════════════════════════════════════════════════════════

function BuildPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const team = useAgentAtelierStore((s) => s.team);
  const placeAgent = useAgentAtelierStore((s) => s.placeAgent);
  const removeAgent = useAgentAtelierStore((s) => s.removeAgent);
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const reset = useAgentAtelierStore((s) => s.reset);
  const currentMissionId = useAgentAtelierStore((s) => s.currentMissionId);
  const mission = currentMissionId
    ? missionsForBand(ageBand).find((m) => m.id === currentMissionId)
    : null;

  const placed = useMemo(() => new Set(team.map((p) => p.agentId)), [team]);

  function place(agent: AgentSpec) {
    if (placed.has(agent.id)) return;
    const occupied = team.map((p) => p.position);
    const slot = findFreeSlot(occupied);
    if (!slot) return;
    placeAgent(agent.id, slot);
  }

  return (
    <motion.div
      key="build"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid grid-cols-[280px_1fr] gap-3 p-4"
    >
      {/* Roster rail */}
      <Panel className="overflow-y-auto p-3">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
          Roster
        </p>
        <div className="space-y-2">
          {rosterForBand(ageBand).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => place(a)}
              disabled={placed.has(a.id)}
              className="w-full text-left rounded-lg p-2 transition-colors disabled:opacity-40"
              style={{
                background: placed.has(a.id) ? '#0A1A1E' : '#0E2226',
                border: `1px solid ${a.accentHex}40`,
              }}
              aria-label={`Place ${a.name}${placed.has(a.id) ? ' (already placed)' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: a.accentHex, boxShadow: `0 0 4px ${a.accentHex}` }}
                />
                <span className="font-display text-sm font-bold text-white">{a.name}</span>
                <span className="ml-auto font-mono text-[9px] text-white/50">tier {a.unlockTier}</span>
              </div>
              <p className="font-body text-[11px] text-white/65 leading-snug">{a.role}</p>
            </button>
          ))}
        </div>
      </Panel>

      {/* Stage canvas */}
      <Panel className="relative overflow-hidden p-4 flex flex-col">
        {mission && <MissionPromptHeader mission={mission} />}
        <StageGrid />
        <div className="flex-1 overflow-y-auto mt-3">
          <PlacedAgentsList onRemove={removeAgent} />
        </div>
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              reset();
              setPhase('mission-select');
            }}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 hover:text-white border border-white/20"
            aria-label="Pick a different mission"
          >
            ← Mission
          </button>
          <div className="font-mono text-[11px] text-white/55">
            {team.length} agent{team.length === 1 ? '' : 's'} placed
          </div>
          <button
            type="button"
            onClick={() => setPhase('wire')}
            disabled={team.length < 2}
            className="px-4 py-1.5 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Continue to wiring"
          >
            Wire them up →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

function MissionPromptHeader({ mission }: { mission: Mission }) {
  return (
    <div className="mb-3 pb-3 border-b border-white/10">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="font-display text-base font-bold text-white">{mission.title}</h2>
        <span
          className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded"
          style={{ background: `${LAB11_HEX}20`, color: LAB11_HEX }}
        >
          {mission.difficulty}
        </span>
      </div>
      <p className="font-body text-xs text-white/70 leading-relaxed">{mission.prompt}</p>
    </div>
  );
}

function StageGrid() {
  const team = useAgentAtelierStore((s) => s.team);
  // Render an STAGE_COLS x STAGE_ROWS grid; each cell shows the placed agent
  // (if any) at its logical position.
  const cells: Array<{ col: number; row: number; agent: AgentSpec | null }> = [];
  for (let r = 0; r < STAGE_ROWS; r++) {
    for (let c = 0; c < STAGE_COLS; c++) {
      const logical = gridToLogical(c, r);
      const placed = team.find(
        (p) => Math.abs(p.position[0] - logical[0]) < 0.01 && Math.abs(p.position[1] - logical[1]) < 0.01,
      );
      const spec = placed ? AGENT_ROSTER.find((a) => a.id === placed.agentId) ?? null : null;
      cells.push({ col: c, row: r, agent: spec });
    }
  }
  return (
    <div
      className="grid gap-2 p-2 rounded-xl"
      style={{
        gridTemplateColumns: `repeat(${STAGE_COLS}, 1fr)`,
        background: 'rgba(10, 74, 71, 0.15)',
        border: `1px dashed ${LAB11_HEX}30`,
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg grid place-items-center"
          style={{
            background: cell.agent ? `${cell.agent.accentHex}20` : 'rgba(255,255,255,0.03)',
            border: cell.agent ? `1px solid ${cell.agent.accentHex}80` : '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          {cell.agent ? (
            <span className="font-display text-[11px] font-bold text-white text-center px-1 leading-tight">
              {cell.agent.name}
            </span>
          ) : (
            <span className="font-mono text-[9px] text-white/30">empty</span>
          )}
        </div>
      ))}
    </div>
  );
}

function PlacedAgentsList({ onRemove }: { onRemove: (id: string) => void }) {
  const team = useAgentAtelierStore((s) => s.team);
  if (team.length === 0)
    return (
      <p className="font-body text-xs text-white/50 italic">Pick at least 2 specialists to wire up.</p>
    );
  return (
    <ul className="space-y-1.5">
      {team.map((p) => {
        const a = AGENT_ROSTER.find((x) => x.id === p.agentId);
        if (!a) return null;
        return (
          <li
            key={p.agentId}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
            style={{ background: '#0A1A1E', border: `1px solid ${a.accentHex}30` }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: a.accentHex, boxShadow: `0 0 4px ${a.accentHex}` }}
            />
            <span className="font-display font-bold text-white flex-1">{a.name}</span>
            <button
              type="button"
              onClick={() => onRemove(p.agentId)}
              className="px-1.5 py-0.5 rounded text-white/60 hover:text-white hover:bg-white/10 font-mono text-[10px]"
              aria-label={`Remove ${a.name} from team`}
            >
              remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 7 — WIRE (connect outputs to inputs)
// ═══════════════════════════════════════════════════════════════

function WirePhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const team = useAgentAtelierStore((s) => s.team);
  const wires = useAgentAtelierStore((s) => s.wires);
  const dragSource = useAgentAtelierStore((s) => s.dragSource);
  const lastWireError = useAgentAtelierStore((s) => s.lastWireError);
  const beginWire = useAgentAtelierStore((s) => s.beginWire);
  const cancelWire = useAgentAtelierStore((s) => s.cancelWire);
  const addWire = useAgentAtelierStore((s) => s.addWire);
  const removeWire = useAgentAtelierStore((s) => s.removeWire);
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const runSimulation = useAgentAtelierStore((s) => s.runSimulation);
  const currentMissionId = useAgentAtelierStore((s) => s.currentMissionId);
  const mission = currentMissionId
    ? missionsForBand(ageBand).find((m) => m.id === currentMissionId)
    : null;

  // Esc to cancel an in-progress drag.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && dragSource) cancelWire();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dragSource, cancelWire]);

  return (
    <motion.div
      key="wire"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid grid-rows-[auto_1fr_auto] gap-3 p-4"
    >
      <Panel className="p-3">
        {mission && (
          <div className="flex items-baseline justify-between">
            <span className="font-display text-sm font-bold text-white">{mission.title}</span>
            <span className="font-mono text-[10px] uppercase text-white/55">
              {wires.length} wire{wires.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
        {dragSource && (
          <p className="mt-1 font-mono text-[11px]" style={{ color: LAB11_HEX }}>
            Holding wire from <strong>{dragSource.agentId}</strong>:{dragSource.outputName}.
            Click an input port to connect, Esc to cancel.
          </p>
        )}
        {lastWireError && !dragSource && (
          <p className="mt-1 font-mono text-[11px] text-[#FF7050]">{lastWireError}</p>
        )}
      </Panel>

      <Panel className="overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {team.map((p) => {
            const a = AGENT_ROSTER.find((x) => x.id === p.agentId);
            if (!a) return null;
            return (
              <AgentPortCard
                key={a.id}
                agent={a}
                onClickOutput={(name) => beginWire({ agentId: a.id, outputName: name })}
                onClickInput={(name) => {
                  if (!dragSource) return;
                  addWire({
                    fromAgentId: dragSource.agentId,
                    fromOutputName: dragSource.outputName,
                    toAgentId: a.id,
                    toInputName: name,
                  });
                }}
                isDragSource={dragSource?.agentId === a.id}
                wires={wires}
              />
            );
          })}
        </div>

        {wires.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
              Current wires
            </p>
            <ul className="space-y-1">
              {wires.map((w, i) => {
                const fa = AGENT_ROSTER.find((a) => a.id === w.fromAgentId);
                const ta = AGENT_ROSTER.find((a) => a.id === w.toAgentId);
                return (
                  <li
                    key={`${w.fromAgentId}:${w.fromOutputName}->${w.toAgentId}:${w.toInputName}`}
                    className="flex items-center gap-2 text-[11px] font-mono px-2 py-1 rounded bg-black/30"
                  >
                    <span className="text-white/85">
                      {fa?.name}:{w.fromOutputName}
                    </span>
                    <span style={{ color: LAB11_HEX }}>→</span>
                    <span className="text-white/85">
                      {ta?.name}:{w.toInputName}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeWire(i)}
                      className="ml-auto px-1.5 py-0.5 text-white/55 hover:text-white"
                      aria-label="Remove wire"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Panel>

      <Panel className="p-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setPhase('build')}
          className="px-3 py-1.5 rounded font-mono text-xs text-white/70 hover:text-white border border-white/20"
          aria-label="Back to building"
        >
          ← Build
        </button>
        <button
          type="button"
          onClick={runSimulation}
          disabled={team.length < 1}
          className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: LAB11_HEX, color: '#031416' }}
          aria-label="Run the team on this mission"
        >
          Run mission ▶
        </button>
      </Panel>
    </motion.div>
  );
}

interface AgentPortCardProps {
  agent: AgentSpec;
  onClickOutput: (name: string) => void;
  onClickInput: (name: string) => void;
  isDragSource: boolean;
  wires: Array<{ fromAgentId: string; toAgentId: string; toInputName: string; fromOutputName: string }>;
}

function AgentPortCard({ agent, onClickOutput, onClickInput, isDragSource, wires }: AgentPortCardProps) {
  return (
    <div
      className="rounded-lg p-3 bg-black/40"
      style={{
        border: `1px solid ${agent.accentHex}50`,
        boxShadow: isDragSource ? `0 0 14px ${agent.accentHex}80` : `inset 0 0 0 1px ${agent.accentHex}20`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: agent.accentHex, boxShadow: `0 0 4px ${agent.accentHex}` }}
        />
        <h3 className="font-display text-sm font-bold text-white">{agent.name}</h3>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="font-mono text-[9px] uppercase text-white/45 mb-1">Inputs</p>
          {agent.inputs.map((p) => {
            const taken = wires.some(
              (w) => w.toAgentId === agent.id && w.toInputName === p.name,
            );
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onClickInput(p.name)}
                disabled={taken}
                className="block w-full text-left px-2 py-1 mb-1 rounded font-mono text-[10px] disabled:opacity-50"
                style={{
                  background: taken ? `${agent.accentHex}15` : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                }}
                aria-label={`Input ${p.name} type ${p.type}${taken ? ' (already wired)' : ''}`}
              >
                ← {p.name}:{p.type}
              </button>
            );
          })}
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase text-white/45 mb-1">Outputs</p>
          {agent.outputs.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onClickOutput(p.name)}
              className="block w-full text-left px-2 py-1 mb-1 rounded font-mono text-[10px] transition-transform hover:scale-[1.02]"
              style={{
                background: `${agent.accentHex}25`,
                border: `1px solid ${agent.accentHex}60`,
                color: 'white',
              }}
              aria-label={`Output ${p.name} type ${p.type}`}
            >
              {p.name}:{p.type} →
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 8 — SIMULATE (animated trajectory reveal)
// ═══════════════════════════════════════════════════════════════

function SimulatePhase() {
  const trajectory = useAgentAtelierStore((s) => s.trajectory);
  const finalArtifact = useAgentAtelierStore((s) => s.finalArtifact);
  const setPhase = useAgentAtelierStore((s) => s.setPhase);

  // Reveal one step at a time — speeds correlate to step.durationMs.
  const [revealIdx, setRevealIdx] = useState(0);

  useEffect(() => {
    if (trajectory.length === 0) {
      // Defensive: if user got here with no trajectory, bounce back.
      setPhase('wire');
      return;
    }
    if (revealIdx >= trajectory.length) {
      const t = setTimeout(() => setPhase('grade'), 800);
      return () => clearTimeout(t);
    }
    const ms = trajectory[revealIdx].durationMs;
    const t = setTimeout(() => setRevealIdx((i) => i + 1), Math.min(ms, 700));
    return () => clearTimeout(t);
  }, [revealIdx, trajectory, setPhase]);

  return (
    <motion.div
      key="simulate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
          Run · simulating
        </p>
        <h2 className="font-display text-xl md:text-2xl font-bold text-white mb-4">
          Watch your team work
        </h2>
        <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
          {trajectory.slice(0, revealIdx).map((step) => {
            const a = AGENT_ROSTER.find((x) => x.id === step.agentId);
            return (
              <motion.li
                key={step.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="px-3 py-2 rounded bg-black/40 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: a?.accentHex, boxShadow: `0 0 4px ${a?.accentHex}` }}
                  />
                  <span className="font-display text-sm font-bold text-white">
                    Step {step.step}: {a?.name}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-white/55">
                    {step.durationMs}ms
                  </span>
                </div>
                <p className="font-body text-xs text-white/70">{step.summary}</p>
              </motion.li>
            );
          })}
        </ul>
        {revealIdx >= trajectory.length && finalArtifact && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 p-3 rounded-lg"
            style={{ background: `${LAB11_HEX}10`, border: `1px solid ${LAB11_HEX}40` }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: LAB11_HEX }}>
              Final artifact
            </p>
            <p className="font-body text-sm text-white/85 leading-relaxed">{finalArtifact}</p>
          </motion.div>
        )}
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 9 — GRADE (rubric breakdown + stars)
// ═══════════════════════════════════════════════════════════════

function GradePhase() {
  const grade = useAgentAtelierStore((s) => s.grade);
  const trajectory = useAgentAtelierStore((s) => s.trajectory);
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const reset = useAgentAtelierStore((s) => s.reset);
  const updateScore = useGameStore((s) => s.updateScore);
  const advanceRound = useGameStore((s) => s.advanceRound);
  const isComplete = useGameStore((s) => s.isComplete);

  // Award score once when the grade arrives.
  useEffect(() => {
    if (!grade) return;
    const points = grade.stars * 50; // 0/50/100/150
    updateScore(points);
  }, [grade, updateScore]);

  if (!grade) {
    return (
      <div className="absolute inset-0 grid place-items-center p-8">
        <Panel className="p-6 text-white/60 font-body text-sm">No grade available.</Panel>
      </div>
    );
  }

  const mvp = grade.mvp ? AGENT_ROSTER.find((a) => a.id === grade.mvp) : null;

  return (
    <motion.div
      key="grade"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 overflow-y-auto p-6"
    >
      <div className="max-w-2xl mx-auto py-6">
        <Panel className="p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
            Mission complete
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.15 }}
                className="text-5xl"
                style={{ color: i < grade.stars ? '#FFD93D' : 'rgba(255,255,255,0.15)' }}
                aria-hidden="true"
              >
                ★
              </motion.span>
            ))}
          </div>
          <p className="font-display text-3xl font-bold text-white mb-1" aria-live="polite">
            {grade.stars} / 3 stars
          </p>
          <p className="font-mono text-xs text-white/60 mb-6">
            {Math.round(grade.total * 100)}% · {trajectory.length} agents · {grade.timeMs}ms
          </p>

          {/* Per-criterion breakdown */}
          <ul className="text-left space-y-1.5 mb-6">
            {grade.perCriterion.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2 px-3 py-1.5 rounded bg-black/40 border border-white/10"
              >
                <span
                  className="flex-shrink-0 inline-grid place-items-center w-5 h-5 rounded-full font-bold text-[11px]"
                  style={{
                    background: c.matched >= 0.7 ? `${LAB11_HEX}30` : '#FF705030',
                    color: c.matched >= 0.7 ? LAB11_HEX : '#FF7050',
                  }}
                  aria-hidden="true"
                >
                  {c.matched >= 0.7 ? '✓' : '~'}
                </span>
                <span className="font-body text-xs text-white/85 flex-1">{c.criterion}</span>
                <span className="font-mono text-[10px] text-white/50">
                  {Math.round(c.matched * 100)}%
                </span>
              </li>
            ))}
          </ul>

          {/* MVP */}
          {mvp && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded mb-6"
              style={{ background: `${mvp.accentHex}15`, border: `1px solid ${mvp.accentHex}40` }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: mvp.accentHex, boxShadow: `0 0 4px ${mvp.accentHex}` }}
              />
              <span className="font-mono text-[11px] text-white/85">
                MVP: <strong>{mvp.name}</strong>
              </span>
            </div>
          )}

          {/* Action row */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setPhase('save')}
              className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
              style={{ background: LAB11_HEX, color: '#031416' }}
              aria-label="Save this composition"
            >
              Save composition
            </button>
            <button
              type="button"
              onClick={() => {
                advanceRound();
                // Read fresh isComplete: advanceRound may have just flipped it
                // and the closure-captured `isComplete` would be one render stale.
                if (useGameStore.getState().isComplete) {
                  setPhase('complete');
                } else {
                  reset();
                  setPhase('mission-select');
                }
              }}
              className="px-5 py-2 rounded font-mono text-xs text-white/85 border border-white/30 hover:bg-white/5 hover:text-white"
              aria-label="Skip save and pick a new mission"
            >
              New mission →
            </button>
            <button
              type="button"
              onClick={() => setPhase('wire')}
              className="px-5 py-2 rounded font-mono text-xs text-white/70 border border-white/20 hover:text-white"
              aria-label="Try again with the same team"
            >
              Try again
            </button>
          </div>
        </Panel>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 10 — SAVE (name composition + persist)
// ═══════════════════════════════════════════════════════════════

function SavePhase() {
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const saveComposition = useAgentAtelierStore((s) => s.saveComposition);
  const isSaving = useAgentAtelierStore((s) => s.isSaving);
  const advanceRound = useGameStore((s) => s.advanceRound);
  const isComplete = useGameStore((s) => s.isComplete);
  const activeChild = useActiveChild();

  const [name, setName] = useState('');
  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 80;

  async function handleSave() {
    if (!valid || !activeChild) return;
    const ok = await saveComposition(activeChild.id, trimmed);
    if (ok) {
      advanceRound();
      setPhase(useGameStore.getState().isComplete ? 'complete' : 'review');
    }
  }

  return (
    <motion.div
      key="save"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-md w-full p-6">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
          Save composition
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-4">Name this team</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="e.g. Birthday Plan v1"
          className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white font-body text-sm focus:outline-none focus:border-white/40"
          aria-label="Composition name"
        />
        <p className="mt-1 font-mono text-[10px] text-white/45">{trimmed.length}/80</p>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => setPhase('grade')}
            className="px-4 py-2 rounded font-mono text-xs text-white/70 hover:text-white border border-white/20"
            disabled={isSaving}
          >
            ← back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!valid || isSaving || !activeChild}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Save composition"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 11 — REVIEW (saved compositions list)
// ═══════════════════════════════════════════════════════════════

function ReviewPhase() {
  const saved = useAgentAtelierStore((s) => s.savedCompositions);
  const loadCompositions = useAgentAtelierStore((s) => s.loadCompositions);
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const reset = useAgentAtelierStore((s) => s.reset);
  const isComplete = useGameStore((s) => s.isComplete);
  const activeChild = useActiveChild();

  useEffect(() => {
    if (activeChild?.id) void loadCompositions(activeChild.id);
  }, [activeChild?.id, loadCompositions]);

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 overflow-y-auto p-6"
    >
      <div className="max-w-2xl mx-auto py-6">
        <Panel className="p-6 mb-4">
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
            Saved Compositions
          </p>
          <h2 className="font-display text-xl font-bold text-white mb-1">Your atelier saves</h2>
          <p className="font-body text-xs text-white/60">
            These compositions can be re-equipped in the Tool Forge and audit-replayed in the Glass Box.
          </p>
        </Panel>

        {saved.length === 0 ? (
          <Panel className="p-6 text-center">
            <p className="font-body text-sm text-white/60">No saves yet.</p>
          </Panel>
        ) : (
          <ul className="space-y-2">
            {saved.map((c) => (
              <li
                key={c.id}
                className="rounded-lg p-3 bg-black/40"
                style={{ border: `1px solid ${LAB11_HEX}30` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-sm font-bold text-white flex-1">{c.name}</h3>
                  <span className="font-mono text-[10px] text-white/55">
                    {c.team.length} agent{c.team.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-white/45">
                  {new Date(c.createdAt).toLocaleString()} · {c.wires.length} wires
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => {
              if (isComplete) {
                setPhase('complete');
              } else {
                reset();
                setPhase('mission-select');
              }
            }}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Continue"
          >
            {isComplete ? 'Done' : 'New mission →'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 12 — COMPLETE (XP / streak / badge auto-flow via GameShell)
// ═══════════════════════════════════════════════════════════════

function CompletePhase() {
  const completeGame = useGameStore((s) => s.completeGame);

  // Trigger the standard SparkForge completion flow once on mount.
  // GameShell's useCompleteAndReward hook handles XP, streak, badges,
  // and the ceremony FX automatically.
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
          Atelier session complete
        </p>
        <h2 className="font-display text-2xl font-bold text-white mb-3">
          You&apos;ve built {TOTAL_ROUNDS} teams!
        </h2>
        <p className="font-body text-sm text-white/75 leading-relaxed">
          Your saved compositions are ready for the next labs. Lab 11 unlocks the{' '}
          <span style={{ color: LAB11_HEX }}>Tool Forge</span> and{' '}
          <span style={{ color: LAB11_HEX }}>Glass Box</span> next.
        </p>
      </Panel>
    </motion.div>
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
        {phase === 'build' && <BuildPhase key="build" ageBand={ageBand} />}
        {phase === 'wire' && <WirePhase key="wire" ageBand={ageBand} />}
        {phase === 'simulate' && <SimulatePhase key="simulate" />}
        {phase === 'grade' && <GradePhase key="grade" />}
        {phase === 'save' && <SavePhase key="save" />}
        {phase === 'review' && <ReviewPhase key="review" />}
        {phase === 'complete' && <CompletePhase key="complete" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default AgentAtelierGame;

// ─── Roster helper export (used by build/wire phases in Sub 11D.7b) ─

export function rosterAvailableAt(band: 'A' | 'B' | 'C'): readonly AgentSpec[] {
  return rosterForBand(band);
}
