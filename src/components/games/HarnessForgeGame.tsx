'use client';

// ════════════════════════════════════════════════════════════════
// HARNESS FORGE — Stage 11G (C7, Lab 11 — Constrain step)
// ════════════════════════════════════════════════════════════════
// Lab 11 Agentic AI | #6FFFE6 Mint-Cyan + per-layer accents
// Closes the Build → Equip → Audit → CONSTRAIN narrative arc.
//
// 12-phase machine (managed by useHarnessForgeStore):
//   welcome → learn-why → learn-layers → learn-catches
//   → save-select → configure-filter → configure-validator
//   → configure-monitor → stress-test → report → save → complete
//
// Reads existing agent_compositions; persists harness_config back
// in place via UPDATE.
//
// Sub 11G.8a (this commit): welcome / 3 tutorials / save-select /
// 3 configure phases. Sub 11G.8b: stress-test / report / save / complete.
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';

import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useHarnessForgeStore } from '@/stores/harnessForgeStore';
import { FILTER_RULE_META } from '@/lib/harness/filterLayer';
import { VALIDATOR_RULE_META } from '@/lib/harness/validatorLayer';
import { MONITOR_RULE_META } from '@/lib/harness/monitorLayer';
import { STRESS_FIXTURES, fixturesForBand } from '@/lib/harness/stressTestFixtures';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import type { HarnessConfig } from '@/types/harness';

const HarnessForge3D = dynamic(() => import('@/components/3d/HarnessForge3D'), { ssr: false });
const HarnessForgeEnvironment = dynamic(
  () => import('@/components/3d/environments/HarnessForgeEnvironment'),
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
  const beginGame = useHarnessForgeStore((s) => s.beginGame);
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
          Lab 11 · Stage 4: Constrain
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Harness Forge
        </h1>
        <p className="font-body text-base text-white/80 mb-8 max-w-md mx-auto leading-relaxed">
          Wrap any team in three layers of safety harness. Filter the
          inputs, validate the outputs, monitor the trajectory. Then
          stress-test the team and see what each layer caught.
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
          aria-label="Enter the Harness Forge"
        >
          Enter the Forge
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — LEARN: WHY HARNESS?
// ═══════════════════════════════════════════════════════════════

function LearnWhyPhase() {
  const setPhase = useHarnessForgeStore((s) => s.setPhase);
  const markSeen = useHarnessForgeStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('why');
    setPhase('learn-layers');
  }
  return (
    <motion.div
      key="learn-why"
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
          Why harness?
        </h2>
        <p className="font-body text-white/80 mb-4">
          A great team can still fail in unsafe ways. Maybe the prompt has personal info that leaks.
          Maybe the team loops forever. Maybe the final answer makes things up.
        </p>
        <p className="font-body text-white/80 mb-4">
          A <span style={{ color: LAB11_HEX }}>safety harness</span> is three layers wrapping the team that
          catch problems automatically — before, during, and after the run.
        </p>
        <p className="font-body text-sm text-white/60 mb-6 italic">
          You won&apos;t prevent every issue. The goal is to prevent the worst ones reliably.
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
// PHASE 3 — LEARN: THE 3 LAYERS
// ═══════════════════════════════════════════════════════════════

function LearnLayersPhase() {
  const setPhase = useHarnessForgeStore((s) => s.setPhase);
  const markSeen = useHarnessForgeStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('layers');
    setPhase('learn-catches');
  }
  return (
    <motion.div
      key="learn-layers"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-3xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB11_HEX }}>
          Tutorial · 2 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
          The three layers
        </h2>
        <div className="space-y-3 mb-6">
          <LayerCard
            num={1}
            color="#E68E28"
            label="Input filter"
            blurb="Sanitizes prompts before any agent sees them. Strips personal info, blocks profanity, caps length."
            when="BEFORE the team runs"
          />
          <LayerCard
            num={2}
            color="#B67BFF"
            label="Behavior monitor"
            blurb="Watches the trajectory in real time. Halts runaway loops; flags duplicate work."
            when="DURING the team runs"
          />
          <LayerCard
            num={3}
            color="#6FFFE6"
            label="Output validator"
            blurb="Checks the final artifact against rules. Demands keywords, length caps, citations."
            when="AFTER the team finishes"
          />
        </div>
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

function LayerCard({
  num, color, label, blurb, when,
}: { num: number; color: string; label: string; blurb: string; when: string }) {
  return (
    <div
      className="flex gap-3 rounded-lg p-3 bg-black/45"
      style={{ border: `1px solid ${color}50` }}
    >
      <div
        className="flex-shrink-0 w-9 h-9 grid place-items-center rounded font-display text-sm font-bold text-white"
        style={{ background: `${color}25`, border: `1px solid ${color}50` }}
      >
        {num}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <h3 className="font-display text-sm font-bold text-white">{label}</h3>
          <span className="font-mono text-[9px] uppercase text-white/55">{when}</span>
        </div>
        <p className="font-body text-xs text-white/70 leading-snug">{blurb}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — LEARN: WHAT EACH LAYER CATCHES
// ═══════════════════════════════════════════════════════════════

function LearnCatchesPhase() {
  const setPhase = useHarnessForgeStore((s) => s.setPhase);
  const markSeen = useHarnessForgeStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('catches');
    setPhase('save-select');
  }
  return (
    <motion.div
      key="learn-catches"
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
          What each layer catches
        </h2>
        <p className="font-body text-white/80 mb-4">
          Each layer ships with a few rules you can turn on. Here&apos;s what they catch:
        </p>
        <div className="grid sm:grid-cols-2 gap-2 mb-6">
          {Object.entries(FILTER_RULE_META).map(([k, m]) => (
            <RuleHintCard key={`f-${k}`} layer="filter" label={m.label} hint={m.hint} color={m.color} />
          ))}
          {Object.entries(VALIDATOR_RULE_META).map(([k, m]) => (
            <RuleHintCard key={`v-${k}`} layer="validator" label={m.label} hint={m.hint} color={m.color} />
          ))}
          {Object.entries(MONITOR_RULE_META).map(([k, m]) => (
            <RuleHintCard key={`m-${k}`} layer="monitor" label={m.label} hint={m.hint} color={m.color} />
          ))}
        </div>
        <p className="font-body text-sm text-white/60 mb-6 italic">
          You don&apos;t need every rule on. Pick the ones the mission warrants.
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

function RuleHintCard({ layer, label, hint, color }: { layer: string; label: string; hint: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5 bg-black/45" style={{ border: `1px solid ${color}40` }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded" style={{ background: `${color}25`, color }}>
          {layer}
        </span>
        <span className="font-display text-sm font-bold text-white">{label}</span>
      </div>
      <p className="font-body text-[11px] text-white/65 leading-snug">{hint}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — SAVE SELECT
// ═══════════════════════════════════════════════════════════════

function SaveSelectPhase() {
  const availableSaves = useHarnessForgeStore((s) => s.availableSaves);
  const isLoading = useHarnessForgeStore((s) => s.isLoadingSaves);
  const loadSaves = useHarnessForgeStore((s) => s.loadSaves);
  const pickSave = useHarnessForgeStore((s) => s.pickSave);
  const activeChild = useActiveChild();

  useEffect(() => {
    if (activeChild?.id) void loadSaves(activeChild.id);
  }, [activeChild?.id, loadSaves]);

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
            Pick a team to harness
          </p>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Your saved teams</h2>
          <p className="font-body text-sm text-white/65">
            Wrap any saved team in a safety harness. Already-harnessed teams show a badge.
          </p>
        </Panel>

        {isLoading && (
          <Panel className="p-4 text-center">
            <p className="font-body text-sm text-white/60">Loading saves…</p>
          </Panel>
        )}

        {!isLoading && availableSaves.length === 0 && (
          <Panel className="p-6 text-center">
            <p className="font-body text-sm text-white/65">
              No saves yet. Build a team in the Atelier or equip one in MCP Lab first.
            </p>
          </Panel>
        )}

        {!isLoading && availableSaves.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {availableSaves.map((entry) => (
              <SaveCard
                key={entry.comp.id}
                name={entry.comp.name}
                agentNames={entry.comp.team.map((p) => getAgent(p.agentId)?.name ?? p.agentId)}
                hasTools={entry.bindings.length > 0}
                hasHarness={!!entry.harness}
                createdAt={entry.comp.createdAt}
                onPick={() => pickSave(entry.comp.id)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface SaveCardProps {
  name: string;
  agentNames: string[];
  hasTools: boolean;
  hasHarness: boolean;
  createdAt: string;
  onPick: () => void;
}

function SaveCard({ name, agentNames, hasTools, hasHarness, createdAt, onPick }: SaveCardProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="text-left rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(10,74,71,0.3))',
        border: `1px solid ${LAB11_HEX}40`,
      }}
      aria-label={`Harness ${name}`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="font-display text-base font-bold text-white truncate">{name}</h3>
        <div className="flex flex-shrink-0 gap-1">
          {hasTools && (
            <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: '#FFD93D20', color: '#FFD93D' }}>
              MCP
            </span>
          )}
          {hasHarness && (
            <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: '#B67BFF20', color: '#B67BFF' }}>
              harnessed
            </span>
          )}
        </div>
      </div>
      <p className="font-body text-[11px] text-white/65 mb-1 leading-snug">
        {agentNames.join(' · ')}
      </p>
      <p className="font-mono text-[9px] text-white/35">
        {new Date(createdAt).toLocaleString()}
      </p>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6 — CONFIGURE INPUT FILTER
// ═══════════════════════════════════════════════════════════════

function ConfigureFilterPhase() {
  const config = useHarnessForgeStore((s) => s.config);
  const toggleFilterRule = useHarnessForgeStore((s) => s.toggleFilterRule);
  const setFilterLengthCap = useHarnessForgeStore((s) => s.setFilterLengthCap);
  const setPhase = useHarnessForgeStore((s) => s.setPhase);

  return (
    <ConfigureLayerLayout
      stepLabel="Layer 1 of 3 · Input filter"
      title="Configure the input filter"
      subtitle="Sanitize prompts BEFORE any agent sees them."
      onBack={() => setPhase('save-select')}
      onNext={() => setPhase('configure-validator')}
      nextLabel="Validator →"
      backLabel="← Save select"
    >
      <RuleToggle
        label={FILTER_RULE_META.stripPii.label}
        hint={FILTER_RULE_META.stripPii.hint}
        color={FILTER_RULE_META.stripPii.color}
        on={config.filter.stripPii}
        onToggle={() => toggleFilterRule('stripPii')}
      />
      <RuleToggle
        label={FILTER_RULE_META.blockProfanity.label}
        hint={FILTER_RULE_META.blockProfanity.hint}
        color={FILTER_RULE_META.blockProfanity.color}
        on={config.filter.blockProfanity}
        onToggle={() => toggleFilterRule('blockProfanity')}
      />
      <NumberRule
        label={FILTER_RULE_META.lengthCap.label}
        hint={FILTER_RULE_META.lengthCap.hint}
        color={FILTER_RULE_META.lengthCap.color}
        value={config.filter.lengthCap}
        onChange={setFilterLengthCap}
        suffix="chars"
        min={0}
        max={10000}
        step={50}
      />
    </ConfigureLayerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 7 — CONFIGURE OUTPUT VALIDATOR
// ═══════════════════════════════════════════════════════════════

function ConfigureValidatorPhase() {
  const config = useHarnessForgeStore((s) => s.config);
  const setReqKw = useHarnessForgeStore((s) => s.setValidatorRequireKeyword);
  const setMaxLen = useHarnessForgeStore((s) => s.setValidatorMaxLength);
  const toggleCit = useHarnessForgeStore((s) => s.toggleValidatorCitations);
  const setPhase = useHarnessForgeStore((s) => s.setPhase);

  return (
    <ConfigureLayerLayout
      stepLabel="Layer 2 of 3 · Output validator"
      title="Configure the output validator"
      subtitle="Check the team's final artifact against rules."
      onBack={() => setPhase('configure-filter')}
      onNext={() => setPhase('configure-monitor')}
      nextLabel="Monitor →"
      backLabel="← Filter"
    >
      <TextRule
        label={VALIDATOR_RULE_META.requireKeyword.label}
        hint={VALIDATOR_RULE_META.requireKeyword.hint}
        color={VALIDATOR_RULE_META.requireKeyword.color}
        value={config.validator.requireKeyword ?? ''}
        onChange={setReqKw}
        placeholder="e.g. thermos"
      />
      <NumberRule
        label={VALIDATOR_RULE_META.maxLength.label}
        hint={VALIDATOR_RULE_META.maxLength.hint}
        color={VALIDATOR_RULE_META.maxLength.color}
        value={config.validator.maxLength ?? 0}
        onChange={(v) => setMaxLen(v === 0 ? undefined : v)}
        suffix="chars"
        min={0}
        max={10000}
        step={50}
      />
      <RuleToggle
        label={VALIDATOR_RULE_META.requireCitations.label}
        hint={VALIDATOR_RULE_META.requireCitations.hint}
        color={VALIDATOR_RULE_META.requireCitations.color}
        on={config.validator.requireCitations}
        onToggle={toggleCit}
      />
    </ConfigureLayerLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 8 — CONFIGURE BEHAVIOR MONITOR
// ═══════════════════════════════════════════════════════════════

function ConfigureMonitorPhase() {
  const config = useHarnessForgeStore((s) => s.config);
  const setLoopLimit = useHarnessForgeStore((s) => s.setMonitorLoopLimit);
  const toggleDedupe = useHarnessForgeStore((s) => s.toggleMonitorDedupe);
  const setPhase = useHarnessForgeStore((s) => s.setPhase);
  return (
    <ConfigureLayerLayout
      stepLabel="Layer 3 of 3 · Behavior monitor"
      title="Configure the behavior monitor"
      subtitle="Watch the trajectory in real time. Halt loops, flag duplicates."
      onBack={() => setPhase('configure-validator')}
      onNext={() => setPhase('stress-test')}
      nextLabel="Stress test ▶"
      backLabel="← Validator"
    >
      <NumberRule
        label={MONITOR_RULE_META.loopLimit.label}
        hint={MONITOR_RULE_META.loopLimit.hint}
        color={MONITOR_RULE_META.loopLimit.color}
        value={config.monitor.loopLimit}
        onChange={setLoopLimit}
        suffix="steps"
        min={1}
        max={50}
        step={1}
      />
      <RuleToggle
        label={MONITOR_RULE_META.dedupeOutputs.label}
        hint={MONITOR_RULE_META.dedupeOutputs.hint}
        color={MONITOR_RULE_META.dedupeOutputs.color}
        on={config.monitor.dedupeOutputs}
        onToggle={toggleDedupe}
      />
    </ConfigureLayerLayout>
  );
}

// ─── Shared configure-layer layout + form atoms ──────────────────

interface ConfigureLayerLayoutProps {
  stepLabel: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  backLabel: string;
  nextLabel: string;
}

function ConfigureLayerLayout({ stepLabel, title, subtitle, children, onBack, onNext, backLabel, nextLabel }: ConfigureLayerLayoutProps) {
  return (
    <motion.div
      key={stepLabel}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-6">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB11_HEX }}>
          {stepLabel}
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-1">{title}</h2>
        <p className="font-body text-xs text-white/65 mb-4">{subtitle}</p>

        <div className="space-y-2 mb-5">{children}</div>

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded font-mono text-xs text-white/85 border border-white/20 hover:text-white"
          >
            {backLabel}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB11_HEX, color: '#031416' }}
          >
            {nextLabel}
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

function RuleToggle({ label, hint, color, on, onToggle }: { label: string; hint: string; color: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left rounded-lg p-3 transition-all hover:scale-[1.01]"
      style={{
        background: on ? `${color}15` : 'rgba(0,0,0,0.45)',
        border: `1px solid ${on ? color : color + '40'}`,
        boxShadow: on ? `0 0 8px ${color}30` : undefined,
      }}
      aria-pressed={on}
      aria-label={`${label} ${on ? 'on' : 'off'}`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <div
          className="w-9 h-5 rounded-full p-0.5 transition-colors flex-shrink-0"
          style={{ background: on ? color : 'rgba(255,255,255,0.15)' }}
        >
          <div
            className="w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }}
          />
        </div>
        <span className="font-display text-sm font-bold text-white">{label}</span>
      </div>
      <p className="font-body text-[11px] text-white/55 leading-snug ml-11">{hint}</p>
    </button>
  );
}

function NumberRule({ label, hint, color, value, onChange, suffix, min, max, step }: { label: string; hint: string; color: string; value: number; onChange: (v: number) => void; suffix: string; min: number; max: number; step: number }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${color}40` }}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="font-display text-sm font-bold text-white">{label}</span>
        <span className="font-mono text-xs text-white/85 tabular-nums">
          {value === 0 ? 'off' : `${value} ${suffix}`}
        </span>
      </div>
      <p className="font-body text-[11px] text-white/55 leading-snug mb-2">{hint}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${(value - min) / (max - min) * 100}%, rgba(255,255,255,0.12) ${(value - min) / (max - min) * 100}%, rgba(255,255,255,0.12) 100%)`,
          accentColor: color,
        }}
        aria-label={label}
      />
    </div>
  );
}

function TextRule({ label, hint, color, value, onChange, placeholder }: { label: string; hint: string; color: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${color}40` }}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="font-display text-sm font-bold text-white">{label}</span>
        {value && (
          <span className="font-mono text-[10px] text-white/55">on</span>
        )}
      </div>
      <p className="font-body text-[11px] text-white/55 leading-snug mb-2">{hint}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={40}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 rounded bg-black/60 border border-white/15 text-white font-body text-sm focus:outline-none focus:border-white/40"
        aria-label={label}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASES 9-12 — placeholders implemented in Sub 11G.8b
// ═══════════════════════════════════════════════════════════════

function StressTestPlaceholder() {
  const setPhase = useHarnessForgeStore((s) => s.setPhase);
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <Panel className="max-w-md p-6 text-center">
        <p className="font-mono text-xs uppercase mb-2" style={{ color: LAB11_HEX }}>
          Stress test / report / save / complete (Sub 11G.8b)
        </p>
        <p className="text-white/70 font-body text-sm mb-4">
          Remaining phases land in the next sub-task.
        </p>
        <button
          type="button"
          onClick={() => setPhase('configure-monitor')}
          className="px-4 py-2 rounded font-mono text-xs"
          style={{ background: LAB11_HEX, color: '#031416' }}
        >
          ← Back
        </button>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN — Phase router + GameShell wrapper
// ═══════════════════════════════════════════════════════════════

const TOTAL_ROUNDS = 3;

export function HarnessForgeGame() {
  const phase = useHarnessForgeStore((s) => s.phase);
  const reset = useHarnessForgeStore((s) => s.reset);

  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  return (
    <GameShell
      gameId="harness-forge"
      title="Harness Forge"
      worldNumber={11}
      worldColor={LAB11_HEX}
      totalRounds={TOTAL_ROUNDS}
      hints={3}
      showTimer
    >
      <div className="absolute inset-0 pointer-events-none">
        <HarnessForgeEnvironment />
        <HarnessForge3D />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'welcome' && <WelcomePhase key="welcome" />}
        {phase === 'learn-why' && <LearnWhyPhase key="learn-why" />}
        {phase === 'learn-layers' && <LearnLayersPhase key="learn-layers" />}
        {phase === 'learn-catches' && <LearnCatchesPhase key="learn-catches" />}
        {phase === 'save-select' && <SaveSelectPhase key="save-select" />}
        {phase === 'configure-filter' && <ConfigureFilterPhase key="configure-filter" />}
        {phase === 'configure-validator' && <ConfigureValidatorPhase key="configure-validator" />}
        {phase === 'configure-monitor' && <ConfigureMonitorPhase key="configure-monitor" />}
        {phase === 'stress-test' && <StressTestPlaceholder key="stress-test" />}
        {phase === 'report' && <StressTestPlaceholder key="report" />}
        {phase === 'save' && <StressTestPlaceholder key="save" />}
        {phase === 'complete' && <StressTestPlaceholder key="complete" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default HarnessForgeGame;

export const _LAB11_HEX = LAB11_HEX;
