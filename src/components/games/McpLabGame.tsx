'use client';

// ════════════════════════════════════════════════════════════════
// MCP LAB — Stage 11E (C6, Lab 11 — Equip step of Build→Equip→Constrain)
// ════════════════════════════════════════════════════════════════
// Lab 11 Agentic AI | #6FFFE6 Mint-Cyan
//
// 12-phase machine (managed by useMcpLabStore):
//   welcome → learn-tools → learn-descriptions → learn-plug-and-play
//   → mission-select → load-team → equip → test → compare → grade
//   → save → complete
//
// Reuses agent_compositions table (read existing 11D saves; writes
// new equipped saves with tool_bindings populated).
//
// Sub 11E.8a (this commit): welcome / learn-* / mission-select /
// load-team. Sub 11E.8b: equip / test / compare / grade / save /
// complete.
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';

import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useMcpLabStore } from '@/stores/mcpLabStore';
import { TOOL_CATALOG, CATEGORY_META, SIDE_EFFECT_META, toolsForBand } from '@/lib/mcplab/toolCatalog';
import { equipMissionsForBand } from '@/lib/mcplab/toolBinding';
import { AGENT_ROSTER, getAgent } from '@/lib/agentatelier/agentRoster';
import { DifficultySelector, type DifficultyTier } from '@/components/games/DifficultySelector';
import type { EquipMission, Tool } from '@/types/mcplab';

const McpLab3D = dynamic(() => import('@/components/3d/McpLab3D'), { ssr: false });
const McpLabEnvironment = dynamic(
  () => import('@/components/3d/environments/McpLabEnvironment'),
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
  const beginGame = useMcpLabStore((s) => s.beginGame);

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
          Lab 11 · Stage 2: Equip
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          MCP Plug-and-Play Lab
        </h1>
        <p className="font-body text-base text-white/80 mb-8 max-w-md mx-auto leading-relaxed">
          Tools turn an agent from clever to capable. Plug a calculator
          into a Planner and watch budgets stop being guesses. We&apos;ll
          start simple and build up.
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
          aria-label="Start MCP Plug-and-Play Lab"
        >
          Open the Tool Wall
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — LEARN: WHAT IS A TOOL?
// ═══════════════════════════════════════════════════════════════

function LearnToolsPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const setPhase = useMcpLabStore((s) => s.setPhase);
  const markSeen = useMcpLabStore((s) => s.markTutorialSeen);

  const samples: Tool[] = useMemo(() => {
    const all = toolsForBand(ageBand);
    // Pick 4 representative tools across categories.
    const ids = ['calculator', 'dictionary', 'calendar', 'doodle-maker'];
    return ids.map((id) => all.find((t) => t.id === id)).filter(Boolean) as Tool[];
  }, [ageBand]);

  function next() {
    markSeen('tools');
    setPhase('learn-descriptions');
  }

  return (
    <motion.div
      key="learn-tools"
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
          What is a tool?
        </h2>
        <p className="font-body text-white/80 mb-6">
          A tool is a small helper your agent can call. It takes an{' '}
          <span style={{ color: LAB11_HEX }}>input</span>, does one thing well, and returns an{' '}
          <span style={{ color: LAB11_HEX }}>output</span>. Here are four examples:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {samples.map((t) => (
            <ToolCard key={t.id} tool={t} compact />
          ))}
        </div>
        <p className="font-body text-sm text-white/60 mb-6">
          14 tools unlock as you grow, organized into 7 categories.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Continue to descriptions tutorial"
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — LEARN: DESCRIPTIONS MATTER
// ═══════════════════════════════════════════════════════════════

function LearnDescriptionsPhase() {
  const setPhase = useMcpLabStore((s) => s.setPhase);
  const markSeen = useMcpLabStore((s) => s.markTutorialSeen);

  function next() {
    markSeen('descriptions');
    setPhase('learn-plug-and-play');
  }

  return (
    <motion.div
      key="learn-descriptions"
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
          Descriptions matter
        </h2>
        <p className="font-body text-white/80 mb-4">
          Two tools can do the same thing but have different descriptions.{' '}
          <span style={{ color: LAB11_HEX }}>The description is what the agent reads</span>{' '}
          to decide when to use it.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <DescriptionExampleCard
            title="Calculator (vague)"
            desc="Does math."
            outcome="Agent uses it for any number, even when it shouldn't."
            tone="warn"
          />
          <DescriptionExampleCard
            title="Calculator (clear)"
            desc="A four-function calculator. Send any math expression as plain text; returns the answer as a number."
            outcome="Agent uses it for the right things, in the right way."
            tone="safe"
          />
        </div>
        <p className="font-body text-sm text-white/60 mb-6">
          Every tool in the catalog has a description you can read by hovering it.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Continue to plug-and-play tutorial"
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

function DescriptionExampleCard({
  title,
  desc,
  outcome,
  tone,
}: {
  title: string;
  desc: string;
  outcome: string;
  tone: 'safe' | 'warn';
}) {
  const ringColor = tone === 'safe' ? LAB11_HEX : '#FF7050';
  return (
    <div
      className="rounded-lg p-3 bg-black/50"
      style={{ border: `1px solid ${ringColor}40` }}
    >
      <p className="font-mono text-[10px] uppercase mb-1" style={{ color: ringColor }}>
        {title}
      </p>
      <p className="font-body text-xs text-white/85 mb-2 leading-relaxed">{desc}</p>
      <p className="font-body text-[11px] text-white/55 italic leading-relaxed">{outcome}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — LEARN: PLUG AND PLAY
// ═══════════════════════════════════════════════════════════════

function LearnPlugAndPlayPhase() {
  const setPhase = useMcpLabStore((s) => s.setPhase);
  const markSeen = useMcpLabStore((s) => s.markTutorialSeen);

  function next() {
    markSeen('plugAndPlay');
    setPhase('mission-select');
  }

  return (
    <motion.div
      key="learn-plug-and-play"
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
          Plug and play
        </h2>
        <p className="font-body text-white/80 mb-4">
          You can attach a tool to any agent input port that accepts the tool&apos;s output type.
          Detach it just as easily — no rewiring needed.
        </p>
        <ul className="space-y-2 mb-6 font-body text-sm text-white/85">
          <Rule ok>Tool output type must match the agent input type (or feed text — text accepts anything).</Rule>
          <Rule ok>One tool per input port at most. Want more? Add a teammate.</Rule>
          <Rule ok>Watch the side-effect badge: read-only is safest, network requires extra trust.</Rule>
          <Rule>Some missions forbid certain tools. The catalog will show you.</Rule>
        </ul>
        <p className="font-body text-sm text-white/60 mb-6">
          Now pick a mission and try equipping a team.
        </p>
        <div className="flex justify-end">
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

function Rule({ children, ok = false }: { children: React.ReactNode; ok?: boolean }) {
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
        {ok ? '✓' : '!'}
      </span>
      <span>{children}</span>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED — Tool card (used in tutorials and equip phase)
// ═══════════════════════════════════════════════════════════════

interface ToolCardProps {
  tool: Tool;
  compact?: boolean;
  onClick?: () => void;
  forbidden?: boolean;
  recommended?: boolean;
}

function ToolCard({ tool, compact = false, onClick, forbidden, recommended }: ToolCardProps) {
  const cat = CATEGORY_META[tool.category];
  const side = SIDE_EFFECT_META[tool.sideEffect];
  const sideToneColor =
    side.tone === 'safe' ? '#00D17A' : side.tone === 'caution' ? '#D9A430' : '#FF7050';
  return (
    <button
      type={onClick ? 'button' : 'button'}
      onClick={onClick}
      disabled={forbidden}
      className={`text-left rounded-lg ${compact ? 'p-2.5' : 'p-3'} transition-all ${
        onClick ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
      } disabled:opacity-40 disabled:cursor-not-allowed`}
      style={{
        background: recommended ? `${tool.accentHex}15` : 'rgba(0,0,0,0.45)',
        border: `1px solid ${recommended ? tool.accentHex + '70' : tool.accentHex + '30'}`,
        boxShadow: recommended ? `0 0 12px ${tool.accentHex}30, inset 0 0 0 1px ${tool.accentHex}20` : undefined,
      }}
      aria-label={`${tool.name}${forbidden ? ' (forbidden by current mission)' : recommended ? ' (recommended)' : ''}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg" aria-hidden="true">{tool.emoji}</span>
        <h3 className="font-display text-sm font-bold text-white">{tool.name}</h3>
        {recommended && (
          <span
            className="ml-auto font-mono text-[8px] uppercase font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${tool.accentHex}30`, color: tool.accentHex }}
          >
            rec
          </span>
        )}
        {forbidden && (
          <span className="ml-auto font-mono text-[8px] uppercase font-bold px-1.5 py-0.5 rounded text-[#FF7050] border border-[#FF7050]/50">
            forbidden
          </span>
        )}
      </div>
      <p className="font-body text-[11px] text-white/65 mb-2 leading-snug">{tool.blurb}</p>
      {!compact && (
        <p className="font-body text-[10px] text-white/55 mb-2 leading-snug italic">
          {tool.description}
        </p>
      )}
      <div className="flex items-center gap-1.5 text-[9px] font-mono">
        <span
          className="px-1.5 py-0.5 rounded"
          style={{ background: `${cat.color}20`, color: cat.color }}
        >
          {cat.label}
        </span>
        <span
          className="px-1.5 py-0.5 rounded"
          style={{ background: `${sideToneColor}20`, color: sideToneColor }}
        >
          {side.label}
        </span>
        <span className="ml-auto px-1.5 py-0.5 rounded text-white/45">
          {tool.outputType}
        </span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — MISSION SELECT
// ═══════════════════════════════════════════════════════════════

function MissionSelectPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const lastDifficulty = useMcpLabStore((s) => s.lastDifficulty);
  const setDifficulty = useMcpLabStore((s) => s.setDifficulty);
  const pickMission = useMcpLabStore((s) => s.pickMission);

  const [diff, setDiff] = useState<DifficultyTier | 'all'>(lastDifficulty as DifficultyTier);

  const allowed = useMemo(() => {
    const inBand = equipMissionsForBand(ageBand);
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
            Choose your equipment mission
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
              No missions at this difficulty for your age band yet.
            </Panel>
          )}
          {allowed.map((m) => (
            <EquipMissionCard key={m.id} mission={m} onPick={() => pickMission(m.id)} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function EquipMissionCard({ mission, onPick }: { mission: EquipMission; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="text-left rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(10,74,71,0.4))',
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
      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-white/55">
        <div>par {mission.parToolCount} tools</div>
        <div>{mission.starterTeam.length} starter agents</div>
        <div>{mission.rubric.length} criteria</div>
      </div>
      {mission.forbiddenTools.length > 0 && (
        <p className="mt-2 font-mono text-[10px] text-[#FF7050]">
          Forbidden: {mission.forbiddenTools.join(', ')}
        </p>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6 — LOAD TEAM (starter or atelier save)
// ═══════════════════════════════════════════════════════════════

function LoadTeamPhase() {
  const currentMissionId = useMcpLabStore((s) => s.currentMissionId);
  const team = useMcpLabStore((s) => s.team);
  const savedCompositions = useMcpLabStore((s) => s.savedCompositions);
  const refreshSaves = useMcpLabStore((s) => s.refreshSaves);
  const loadStarterTeam = useMcpLabStore((s) => s.loadStarterTeam);
  const loadFromSave = useMcpLabStore((s) => s.loadFromSave);
  const setPhase = useMcpLabStore((s) => s.setPhase);
  const activeChild = useActiveChild();

  useEffect(() => {
    if (activeChild?.id) void refreshSaves(activeChild.id);
  }, [activeChild?.id, refreshSaves]);

  return (
    <motion.div
      key="load-team"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 overflow-y-auto p-6"
    >
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <Panel className="p-6">
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
            Load a team
          </p>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            How do you want to start?
          </h2>
          <p className="font-body text-sm text-white/65">
            Begin from this mission&apos;s starter team, or load one of your previous Atelier saves.
          </p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display text-base font-bold text-white">Mission starter team</h3>
            <span className="font-mono text-[10px] text-white/55">{team.length} agents</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {team.map((p) => {
              const a = getAgent(p.agentId);
              if (!a) return null;
              return (
                <div
                  key={p.agentId}
                  className="rounded-md p-2 bg-black/50"
                  style={{ border: `1px solid ${a.accentHex}40` }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: a.accentHex }}
                    />
                    <span className="font-display text-xs font-bold text-white">{a.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setPhase('mission-select')}
              className="px-3 py-1.5 rounded font-mono text-xs text-white/70 hover:text-white border border-white/20"
              aria-label="Pick a different mission"
            >
              ← Different mission
            </button>
            <button
              type="button"
              onClick={loadStarterTeam}
              className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
              style={{ background: LAB11_HEX, color: '#031416' }}
              aria-label="Use this starter team"
            >
              Use this team →
            </button>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display text-base font-bold text-white">Your Atelier saves</h3>
            <span className="font-mono text-[10px] text-white/55">
              {savedCompositions.length} saves
            </span>
          </div>
          {savedCompositions.length === 0 ? (
            <p className="font-body text-xs text-white/55 italic">
              No Atelier saves yet. Build a team in the Atelier first to load it here.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {savedCompositions.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-black/40"
                  style={{ border: `1px solid ${LAB11_HEX}25` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-white truncate">{c.name}</p>
                    <p className="font-mono text-[10px] text-white/50">
                      {c.team.length} agents · {c.wires.length} wires ·{' '}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadFromSave(c.id)}
                    className="px-3 py-1 rounded font-mono text-[10px] font-bold transition-transform hover:scale-105"
                    style={{ background: LAB11_HEX, color: '#031416' }}
                    aria-label={`Load ${c.name}`}
                  >
                    load
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {!currentMissionId && (
          <Panel className="p-3 text-center">
            <p className="font-body text-sm text-white/60">No mission selected.</p>
          </Panel>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 7 — EQUIP (attach tools to agent input ports)
// ═══════════════════════════════════════════════════════════════

function EquipPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const team = useMcpLabStore((s) => s.team);
  const bindings = useMcpLabStore((s) => s.bindings);
  const lastBindingError = useMcpLabStore((s) => s.lastBindingError);
  const currentMissionId = useMcpLabStore((s) => s.currentMissionId);
  const addBinding = useMcpLabStore((s) => s.addBinding);
  const removeBinding = useMcpLabStore((s) => s.removeBinding);
  const setPhase = useMcpLabStore((s) => s.setPhase);
  const runTest = useMcpLabStore((s) => s.runTest);
  const runBaseline = useMcpLabStore((s) => s.runBaseline);

  const mission = currentMissionId ? equipMissionsForBand(ageBand).find((m) => m.id === currentMissionId) : null;
  const tools = useMemo(() => toolsForBand(ageBand), [ageBand]);

  // Two-pane drag state: which tool is "selected" awaiting a port click.
  const [pickedToolId, setPickedToolId] = useState<string | null>(null);

  function handlePortClick(agentId: string, inputName: string) {
    if (!pickedToolId) return;
    const ok = addBinding({ agentId, inputName, toolId: pickedToolId });
    if (ok) setPickedToolId(null);
  }

  function startTest() {
    runBaseline();
    runTest();
  }

  return (
    <motion.div
      key="equip"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid grid-cols-[320px_1fr] gap-3 p-4"
    >
      {/* Left: tool catalog drawer */}
      <Panel className="overflow-y-auto p-3">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
          Tool catalog · click a tool, then click a port
        </p>
        <div className="space-y-1.5">
          {tools.map((t) => {
            const forbidden = mission?.forbiddenTools.includes(t.id) ?? false;
            const recommended = mission?.recommendedTools.includes(t.id) ?? false;
            const picked = pickedToolId === t.id;
            return (
              <div
                key={t.id}
                className={picked ? 'ring-2 ring-offset-2 ring-offset-black rounded-lg' : ''}
                style={{ ['--tw-ring-color' as string]: t.accentHex }}
              >
                <ToolCard
                  tool={t}
                  forbidden={forbidden}
                  recommended={recommended}
                  onClick={() => {
                    if (forbidden) return;
                    setPickedToolId(picked ? null : t.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Right: team + ports + bindings list */}
      <Panel className="overflow-y-auto p-4 flex flex-col">
        {mission && (
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
        )}

        {pickedToolId && (
          <p className="mb-3 font-mono text-[11px]" style={{ color: LAB11_HEX }}>
            Holding {pickedToolId}. Click an input port to attach, or click the tool again to release.
          </p>
        )}
        {lastBindingError && !pickedToolId && (
          <p className="mb-3 font-mono text-[11px] text-[#FF7050]">{lastBindingError}</p>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3">
          {team.map((p) => {
            const a = getAgent(p.agentId);
            if (!a) return null;
            return (
              <AgentPortCard
                key={a.id}
                agentId={a.id}
                agentName={a.name}
                accentHex={a.accentHex}
                inputs={a.inputs.map((inp) => ({ name: inp.name, type: inp.type }))}
                bindings={bindings}
                onPortClick={handlePortClick}
              />
            );
          })}
        </div>

        {bindings.length > 0 && (
          <div className="mb-3">
            <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: LAB11_HEX }}>
              Current attachments
            </p>
            <ul className="space-y-1">
              {bindings.map((b, i) => {
                const a = AGENT_ROSTER.find((x) => x.id === b.agentId);
                const t = TOOL_CATALOG.find((x) => x.id === b.toolId);
                return (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-[11px] font-mono px-2 py-1 rounded bg-black/40"
                  >
                    <span className="text-white/85">{t?.emoji} {t?.name}</span>
                    <span style={{ color: LAB11_HEX }}>→</span>
                    <span className="text-white/85">{a?.name}:{b.inputName}</span>
                    <button
                      type="button"
                      onClick={() => removeBinding(i)}
                      className="ml-auto px-1.5 py-0.5 text-white/55 hover:text-white"
                      aria-label="Detach tool"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setPhase('load-team')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 hover:text-white border border-white/20"
          >
            ← Team
          </button>
          <div className="font-mono text-[11px] text-white/55">
            {bindings.length} tool{bindings.length === 1 ? '' : 's'} attached
            {mission ? ` · par ${mission.parToolCount}` : ''}
          </div>
          <button
            type="button"
            onClick={startTest}
            disabled={bindings.length === 0}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="Run the equipped team on this mission"
          >
            Run test ▶
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

interface AgentPortCardProps {
  agentId: string;
  agentName: string;
  accentHex: string;
  inputs: Array<{ name: string; type: string }>;
  bindings: Array<{ agentId: string; inputName: string; toolId: string }>;
  onPortClick: (agentId: string, inputName: string) => void;
}

function AgentPortCard({ agentId, agentName, accentHex, inputs, bindings, onPortClick }: AgentPortCardProps) {
  return (
    <div
      className="rounded-lg p-3 bg-black/40"
      style={{ border: `1px solid ${accentHex}50` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: accentHex, boxShadow: `0 0 4px ${accentHex}` }}
        />
        <h3 className="font-display text-sm font-bold text-white">{agentName}</h3>
      </div>
      <div className="space-y-1">
        {inputs.map((p) => {
          const bound = bindings.find((b) => b.agentId === agentId && b.inputName === p.name);
          const tool = bound ? TOOL_CATALOG.find((t) => t.id === bound.toolId) : null;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => onPortClick(agentId, p.name)}
              className="block w-full text-left px-2 py-1.5 rounded font-mono text-[11px] transition-transform hover:scale-[1.02]"
              style={{
                background: tool ? `${tool.accentHex}25` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tool ? tool.accentHex + '70' : 'rgba(255,255,255,0.1)'}`,
                color: 'white',
              }}
              aria-label={`Input ${p.name} type ${p.type}${tool ? ` — bound to ${tool.name}` : ''}`}
            >
              ← {p.name}:{p.type}
              {tool && (
                <span className="ml-2 opacity-85">
                  {tool.emoji} {tool.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 8 + 9 — TEST + COMPARE (run + side-by-side)
// ═══════════════════════════════════════════════════════════════
// runTest auto-transitions to 'compare', so test phase is brief.

function ComparePhase() {
  const baselineArtifact = useMcpLabStore((s) => s.baselineArtifact);
  const equippedArtifact = useMcpLabStore((s) => s.equippedArtifact);
  const setPhase = useMcpLabStore((s) => s.setPhase);

  return (
    <motion.div
      key="compare"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-3xl w-full p-6">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
          Compare
        </p>
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          With tools vs without
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <div
            className="rounded-lg p-3 bg-black/45"
            style={{ border: '1px solid rgba(255,112,80,0.4)' }}
          >
            <p className="font-mono text-[10px] uppercase mb-1 text-[#FF7050]">Baseline (no tools)</p>
            <p className="font-body text-xs text-white/85 leading-relaxed">{baselineArtifact}</p>
          </div>
          <div
            className="rounded-lg p-3 bg-black/45"
            style={{ border: `1px solid ${LAB11_HEX}40` }}
          >
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB11_HEX }}>
              Equipped
            </p>
            <p className="font-body text-xs text-white/85 leading-relaxed">{equippedArtifact}</p>
          </div>
        </div>
        <p className="font-body text-xs text-white/55 italic mb-4">
          The equipped run leans on the tools you attached. Notice how the artifact references them.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPhase('equip')}
            className="px-4 py-2 rounded font-mono text-xs text-white/75 border border-white/20"
            aria-label="Adjust attachments"
          >
            ← Adjust
          </button>
          <button
            type="button"
            onClick={() => setPhase('grade')}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
            aria-label="See grade"
          >
            See grade →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 10 — GRADE
// ═══════════════════════════════════════════════════════════════

function GradePhase() {
  const grade = useMcpLabStore((s) => s.grade);
  const setPhase = useMcpLabStore((s) => s.setPhase);
  const reset = useMcpLabStore((s) => s.reset);
  const updateScore = useGameStore((s) => s.updateScore);
  const advanceRound = useGameStore((s) => s.advanceRound);
  const isComplete = useGameStore((s) => s.isComplete);

  useEffect(() => {
    if (!grade) return;
    updateScore(grade.stars * 50);
  }, [grade, updateScore]);

  if (!grade) {
    return (
      <div className="absolute inset-0 grid place-items-center p-8">
        <Panel className="p-6 text-white/60 font-body text-sm">No grade available.</Panel>
      </div>
    );
  }

  const mvpTool = grade.mvpToolId ? TOOL_CATALOG.find((t) => t.id === grade.mvpToolId) : null;

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
            Equipped run · graded
          </p>
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
            {Math.round(grade.total * 100)}% · {grade.timeMs}ms
          </p>

          <ul className="text-left space-y-1.5 mb-5">
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

          {grade.violations.length > 0 && (
            <div
              className="text-left rounded-lg p-3 mb-5"
              style={{ background: 'rgba(255,112,80,0.1)', border: '1px solid rgba(255,112,80,0.4)' }}
            >
              <p className="font-mono text-[10px] uppercase text-[#FF7050] mb-1">Violations</p>
              <p className="font-body text-xs text-white/85">
                You attached {grade.violations.length} forbidden tool
                {grade.violations.length === 1 ? '' : 's'}: {grade.violations.join(', ')}.
                Each violation cost 15% of the score.
              </p>
            </div>
          )}

          {mvpTool && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded mb-6"
              style={{ background: `${mvpTool.accentHex}15`, border: `1px solid ${mvpTool.accentHex}40` }}
            >
              <span aria-hidden="true">{mvpTool.emoji}</span>
              <span className="font-mono text-[11px] text-white/85">
                MVP tool: <strong>{mvpTool.name}</strong>
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setPhase('save')}
              className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
              style={{ background: LAB11_HEX, color: '#031416' }}
              aria-label="Save equipped composition"
            >
              Save composition
            </button>
            <button
              type="button"
              onClick={() => {
                advanceRound();
                if (isComplete) {
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
              onClick={() => setPhase('equip')}
              className="px-5 py-2 rounded font-mono text-xs text-white/70 border border-white/20 hover:text-white"
              aria-label="Try again with different tools"
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
// PHASE 11 — SAVE
// ═══════════════════════════════════════════════════════════════

function SavePhase() {
  const setPhase = useMcpLabStore((s) => s.setPhase);
  const saveEquipped = useMcpLabStore((s) => s.saveEquippedComposition);
  const isSaving = useMcpLabStore((s) => s.isSaving);
  const advanceRound = useGameStore((s) => s.advanceRound);
  const isComplete = useGameStore((s) => s.isComplete);
  const activeChild = useActiveChild();

  const [name, setName] = useState('');
  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 80;

  async function handleSave() {
    if (!valid || !activeChild) return;
    const ok = await saveEquipped(activeChild.id, trimmed);
    if (ok) {
      advanceRound();
      setPhase(isComplete ? 'complete' : 'mission-select');
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
          Save equipped composition
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-4">Name this loadout</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="e.g. Travel Trio + tools"
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
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40"
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
// PHASE 12 — COMPLETE
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
          MCP session complete
        </p>
        <h2 className="font-display text-2xl font-bold text-white mb-3">
          You&apos;ve equipped {TOTAL_ROUNDS} teams!
        </h2>
        <p className="font-body text-sm text-white/75 leading-relaxed">
          These equipped saves are ready for the{' '}
          <span style={{ color: LAB11_HEX }}>Glass Box</span> (audit replay) and{' '}
          <span style={{ color: LAB11_HEX }}>Harness Forge</span> (safety wraps) labs.
        </p>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN — Phase router + GameShell wrapper
// ═══════════════════════════════════════════════════════════════

const TOTAL_ROUNDS = 4;

export function McpLabGame() {
  const phase = useMcpLabStore((s) => s.phase);
  const reset = useMcpLabStore((s) => s.reset);

  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band ?? 'B') as 'A' | 'B' | 'C';

  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  return (
    <GameShell
      gameId="mcp-lab"
      title="MCP Plug-and-Play Lab"
      worldNumber={11}
      worldColor={LAB11_HEX}
      totalRounds={TOTAL_ROUNDS}
      hints={3}
      showTimer
    >
      <div className="absolute inset-0 pointer-events-none">
        <McpLabEnvironment />
        <McpLab3D />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'welcome' && <WelcomePhase key="welcome" />}
        {phase === 'learn-tools' && <LearnToolsPhase key="learn-tools" ageBand={ageBand} />}
        {phase === 'learn-descriptions' && <LearnDescriptionsPhase key="learn-descriptions" />}
        {phase === 'learn-plug-and-play' && <LearnPlugAndPlayPhase key="learn-plug-and-play" />}
        {phase === 'mission-select' && <MissionSelectPhase key="mission-select" ageBand={ageBand} />}
        {phase === 'load-team' && <LoadTeamPhase key="load-team" />}
        {phase === 'equip' && <EquipPhase key="equip" ageBand={ageBand} />}
        {phase === 'test' && <EquipPhase key="test" ageBand={ageBand} />}
        {phase === 'compare' && <ComparePhase key="compare" />}
        {phase === 'grade' && <GradePhase key="grade" />}
        {phase === 'save' && <SavePhase key="save" />}
        {phase === 'complete' && <CompletePhase key="complete" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default McpLabGame;

// ─── Local exports for Sub 11E.8b ────────────────────────────────

export { Panel, ToolCard };
export const _LAB11_HEX = LAB11_HEX;
