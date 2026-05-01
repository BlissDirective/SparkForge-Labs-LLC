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
// PHASES 7-12 — placeholders implemented in Sub 11E.8b
// ═══════════════════════════════════════════════════════════════

function EquipPlaceholder() {
  const setPhase = useMcpLabStore((s) => s.setPhase);
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <Panel className="max-w-md p-6 text-center">
        <p className="font-mono text-xs uppercase mb-2" style={{ color: LAB11_HEX }}>
          Equip / test / compare / grade / save / complete (Sub 11E.8b)
        </p>
        <p className="text-white/70 font-body text-sm mb-4">
          Remaining phases land in the next sub-task.
        </p>
        <button
          type="button"
          onClick={() => setPhase('mission-select')}
          className="px-4 py-2 rounded font-mono text-xs"
          style={{ background: LAB11_HEX, color: '#031416' }}
        >
          ← Mission select
        </button>
      </Panel>
    </div>
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
        {phase === 'equip' && <EquipPlaceholder key="equip" />}
        {phase === 'test' && <EquipPlaceholder key="test" />}
        {phase === 'compare' && <EquipPlaceholder key="compare" />}
        {phase === 'grade' && <EquipPlaceholder key="grade" />}
        {phase === 'save' && <EquipPlaceholder key="save" />}
        {phase === 'complete' && <EquipPlaceholder key="complete" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default McpLabGame;

// ─── Local exports for Sub 11E.8b ────────────────────────────────

export { Panel, ToolCard };
export const _LAB11_HEX = LAB11_HEX;
