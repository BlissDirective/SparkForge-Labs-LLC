// ════════════════════════════════════════════════════════════════════════
// AGENT ATELIER — Lab 11 Flagship (Stage 11D, C1) — "Build" step of the
// Build → Equip → Constrain arc.
// ════════════════════════════════════════════════════════════════════════
// The child assembles a team of specialist AI agents on a build canvas,
// wires each agent's output into the next agent's input, then runs the
// wired team on a mission and gets a graded report. This UI drives the REAL
// engine in `useAgentAtelierStore` (agent roster + mission library + wire-
// graph validation + topological simulator + heuristic grader). No slider
// stub — the store owns ALL logic; this file is the presentational layer +
// state→view / controls→action wiring.
//
// Phase machine driven (from agentAtelierStore.AtelierPhase):
//   welcome → learn-roster → learn-wiring → learn-mission
//   → mission-select → build/wire (the canvas) → simulate → grade
//   → (save) → complete
//
// Interaction model (click + keyboard, no drag required):
//   • Place an agent: click it in the palette → placeAgent().
//   • Wire agents:    click an OUTPUT port (beginWire) then click a glowing,
//                     type-compatible INPUT port (addWire). All ports are
//                     <button>s, so the whole flow is keyboard-usable.
//   • Remove:         × on an agent node (removeAgent) or on a wire chip
//                     (removeWire).
//   • Run:            runSimulation() → animated trajectory → graded report.
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useAgentAtelierStore } from '@/stores/agentAtelierStore';
import { getAgent, rosterForBand } from '@/lib/agentatelier/agentRoster';
import { getMission } from '@/lib/agentatelier/missionLibrary';
import { legalTargets } from '@/lib/agentatelier/wireGraph';
import type { Mission, MissionDifficulty } from '@/types/agentAtelier';

const LAB = '#E945F5';

// ─── Small style helpers (inline — no arbitrary Tailwind classes) ────────
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
};
const ghostBtn: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12,
  padding: '10px 20px',
};

const DIFFICULTY_LABEL: Record<MissionDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

function Stars({ n, size = 28 }: { n: number; size?: number }) {
  return (
    <span aria-label={`${n} out of 3 stars`} style={{ fontSize: size, letterSpacing: 2 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ opacity: i < n ? 1 : 0.22 }}>
          ⭐
        </span>
      ))}
    </span>
  );
}

const TUTORIALS = [
  {
    phase: 'learn-roster' as const,
    key: 'roster' as const,
    emoji: '🧑‍🔧',
    title: 'Meet your specialists',
    body: [
      'An AI agent is a helper that does ONE job really well — a Researcher looks things up, a Writer turns notes into prose, a Planner breaks a goal into steps.',
      'Each agent has inputs (what it needs) and outputs (what it makes). You will build a team by placing agents on your canvas.',
      'No single agent can do everything — the magic is getting a team to work together.',
    ],
  },
  {
    phase: 'learn-wiring' as const,
    key: 'wiring' as const,
    emoji: '🔗',
    title: 'Wire them together',
    body: [
      'To make a team, you connect one agent\'s OUTPUT into another agent\'s INPUT. The first agent\'s work flows into the next.',
      'Wires have to match: a list can feed a list, and text accepts almost anything — but a number can\'t feed a plan.',
      'You also can\'t make a loop (A → B → A). A good team flows forward, from start to finish.',
    ],
  },
  {
    phase: 'learn-mission' as const,
    key: 'mission' as const,
    emoji: '🎯',
    title: 'Pick a mission & run it',
    body: [
      'Choose a mission — a real job for your team, like planning a birthday or fact-checking claims.',
      'Place the agents you need, wire them in order, then hit Run. Your team executes step by step.',
      'A rubric grades the result and gives you 0–3 stars. Fewer agents than the target = a bonus. Ready to build?',
    ],
  },
];

export default function AgentAtelierGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();
  const band = (child?.age_band || 'B') as 'A' | 'B' | 'C';
  const childId = child?.id;

  // ─── Store: state ──────────────────────────────────────────────────────
  const phase = useAgentAtelierStore((s) => s.phase);
  const currentMissionId = useAgentAtelierStore((s) => s.currentMissionId);
  const team = useAgentAtelierStore((s) => s.team);
  const wires = useAgentAtelierStore((s) => s.wires);
  const dragSource = useAgentAtelierStore((s) => s.dragSource);
  const lastWireError = useAgentAtelierStore((s) => s.lastWireError);
  const runError = useAgentAtelierStore((s) => s.runError);
  const trajectory = useAgentAtelierStore((s) => s.trajectory);
  const finalArtifact = useAgentAtelierStore((s) => s.finalArtifact);
  const totalMs = useAgentAtelierStore((s) => s.totalMs);
  const grade = useAgentAtelierStore((s) => s.grade);
  const lastDifficulty = useAgentAtelierStore((s) => s.lastDifficulty);
  const isSaving = useAgentAtelierStore((s) => s.isSaving);

  // ─── Store: actions ────────────────────────────────────────────────────
  const setPhase = useAgentAtelierStore((s) => s.setPhase);
  const beginGame = useAgentAtelierStore((s) => s.beginGame);
  const reset = useAgentAtelierStore((s) => s.reset);
  const markTutorialSeen = useAgentAtelierStore((s) => s.markTutorialSeen);
  const setDifficulty = useAgentAtelierStore((s) => s.setDifficulty);
  const pickMission = useAgentAtelierStore((s) => s.pickMission);
  const availableMissionsForBand = useAgentAtelierStore((s) => s.availableMissionsForBand);
  const placeAgent = useAgentAtelierStore((s) => s.placeAgent);
  const removeAgent = useAgentAtelierStore((s) => s.removeAgent);
  const beginWire = useAgentAtelierStore((s) => s.beginWire);
  const cancelWire = useAgentAtelierStore((s) => s.cancelWire);
  const addWire = useAgentAtelierStore((s) => s.addWire);
  const removeWire = useAgentAtelierStore((s) => s.removeWire);
  const runSimulation = useAgentAtelierStore((s) => s.runSimulation);
  const saveComposition = useAgentAtelierStore((s) => s.saveComposition);

  // ─── Local UI state ────────────────────────────────────────────────────
  const [difFilter, setDifFilter] = useState<'all' | MissionDifficulty>(lastDifficulty);
  const [saveName, setSaveName] = useState('');
  const [revealed, setRevealed] = useState(0);
  const firedRef = useRef(false);

  // ─── Mount: reset + enter the store's intended flow. Clean up on exit. ──
  useEffect(() => {
    reset();
    beginGame();
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Completion: fire exactly once when the graded report shows. ────────
  useEffect(() => {
    if (phase === 'grade' && grade && !firedRef.current) {
      firedRef.current = true;
      const xp = Math.round(60 + grade.total * 140); // 60..200
      awardXP(xp);
      const stars = Math.max(1, grade.stars) as 1 | 2 | 3;
      completeGame('agent-atelier', stars);
    }
  }, [phase, grade, awardXP, completeGame]);

  // ─── Trajectory playback: reveal steps one at a time during `simulate`. ─
  useEffect(() => {
    if (phase !== 'simulate') return;
    setRevealed(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    trajectory.forEach((_, idx) => {
      timers.push(setTimeout(() => setRevealed(idx + 1), 480 * (idx + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, [phase, trajectory]);

  const mission = currentMissionId ? getMission(currentMissionId) : undefined;
  const roster = useMemo(() => rosterForBand(band), [band]);

  // ══════════════════════════════════════════════════════════════════════
  // PHASE VIEWS
  // ══════════════════════════════════════════════════════════════════════

  function WelcomeView() {
    return (
      <Centered>
        <div style={{ fontSize: 64 }}>🕸️</div>
        <h1 className="text-3xl font-black" style={{ color: LAB }}>
          Agent Atelier
        </h1>
        <p className="max-w-md text-center text-lg text-white/80">
          Build a team of AI agents, wire them so each one feeds the next, and run them on a real
          mission. This is the <strong style={{ color: LAB }}>Build</strong> workshop.
        </p>
        <button style={primaryBtn} onClick={() => beginGame()} aria-label="Start Agent Atelier">
          Enter the atelier →
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
        <div className="flex items-center gap-2 text-sm text-white/60">
          {TUTORIALS.map((x, i) => (
            <span
              key={x.key}
              aria-hidden
              style={{
                width: 28,
                height: 6,
                borderRadius: 3,
                background: i <= idx ? LAB : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>
        <div style={{ ...panel, padding: 28, maxWidth: 560 }} className="text-center">
          <div style={{ fontSize: 52 }}>{t.emoji}</div>
          <h2 className="mb-3 text-2xl font-black" style={{ color: LAB }}>
            {t.title}
          </h2>
          <div className="space-y-3">
            {t.body.map((line, i) => (
              <p key={i} className="text-white/80">
                {line}
              </p>
            ))}
          </div>
        </div>
        <button
          style={primaryBtn}
          onClick={() => {
            markTutorialSeen(t.key);
            setPhase(next ? next.phase : 'mission-select');
          }}
          aria-label={next ? 'Next lesson' : 'Go to missions'}
        >
          {next ? 'Got it — next' : "Let's build →"}
        </button>
      </Centered>
    );
  }

  function MissionSelectView() {
    const all = availableMissionsForBand(band);
    const missions = all.filter((m) => difFilter === 'all' || m.difficulty === difFilter);
    const filters: Array<'all' | MissionDifficulty> = ['all', 'easy', 'medium', 'hard'];
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            Pick a mission
          </h2>
          <p className="text-white/70">Choose a real job for your AI team to tackle.</p>
        </div>

        <div
          className="flex flex-wrap justify-center gap-2"
          role="group"
          aria-label="Filter missions by difficulty"
        >
          {filters.map((f) => {
            const active = difFilter === f;
            return (
              <button
                key={f}
                onClick={() => {
                  setDifFilter(f);
                  if (f !== 'all') setDifficulty(f);
                }}
                aria-pressed={active}
                aria-label={`Show ${f === 'all' ? 'all' : DIFFICULTY_LABEL[f]} missions`}
                style={{
                  borderRadius: 999,
                  padding: '6px 16px',
                  fontWeight: 600,
                  fontSize: 14,
                  background: active ? LAB : 'rgba(255,255,255,0.06)',
                  color: active ? '#0b0410' : 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.14)',
                }}
              >
                {f === 'all' ? 'All' : DIFFICULTY_LABEL[f]}
              </button>
            );
          })}
        </div>

        {missions.length === 0 ? (
          <p className="text-center text-white/60">
            No missions at that level for your age band yet — try another difficulty.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {missions.map((m) => (
              <MissionCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>
    );
  }

  function MissionCard({ m }: { m: Mission }) {
    return (
      <button
        onClick={() => pickMission(m.id)}
        aria-label={`Start mission ${m.title}`}
        style={{ ...panel, padding: 18, textAlign: 'left', cursor: 'pointer' }}
        className="flex flex-col gap-2 transition hover:brightness-125"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-white">{m.title}</h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 999,
              background: 'rgba(233,69,245,0.18)',
              color: LAB,
              whiteSpace: 'nowrap',
            }}
          >
            {DIFFICULTY_LABEL[m.difficulty]}
          </span>
        </div>
        <p className="text-sm text-white/70">{m.prompt}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            🎁 makes: {m.expectedOutput}
          </span>
          <span>Target: {m.parAgentCount} agents for 3★</span>
        </div>
      </button>
    );
  }

  // ─── The Build Canvas (drives both `build` and `wire` phases) ──────────
  function CanvasView() {
    if (!mission) return null;

    const placedIds = new Set(team.map((p) => p.agentId));

    // Legal target input ports while a wire is in progress.
    const legal = dragSource
      ? legalTargets(getAgent(dragSource.agentId)!, dragSource.outputName, team)
      : [];
    const isLegalTarget = (agentId: string, portName: string) =>
      legal.some((l) => l.agentId === agentId && l.portName === portName);
    const isWiredInput = (agentId: string, portName: string) =>
      wires.some((w) => w.toAgentId === agentId && w.toInputName === portName);
    const sourceAgent = dragSource ? getAgent(dragSource.agentId) : undefined;

    function nextPosition(count: number): [number, number] {
      const col = count % 3;
      const row = Math.floor(count / 3);
      return [(col - 1) * 0.66, (row - 1) * 0.66];
    }

    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 py-4">
        {/* Mission brief */}
        <header style={{ ...panel, padding: 16 }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-black" style={{ color: LAB }}>
              {mission.title}
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: 999,
                background: 'rgba(233,69,245,0.18)',
                color: LAB,
              }}
            >
              {DIFFICULTY_LABEL[mission.difficulty]}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/80">{mission.prompt}</p>
          <div className="mt-2">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">
              How you&apos;ll be graded
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {mission.rubric.map((c, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.78)',
                  }}
                >
                  ✔ {c.criterion}
                </li>
              ))}
            </ul>
          </div>
        </header>

        {/* Wiring hint bar */}
        <div
          role="status"
          aria-live="polite"
          style={{
            ...panel,
            padding: '10px 14px',
            background: dragSource ? 'rgba(233,69,245,0.12)' : 'rgba(255,255,255,0.04)',
            border: dragSource ? `1px solid ${LAB}` : '1px solid rgba(255,255,255,0.10)',
          }}
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <span className="text-sm text-white/80">
            {dragSource && sourceAgent ? (
              <>
                🔗 Connecting from <strong style={{ color: LAB }}>{sourceAgent.name}.{dragSource.outputName}</strong> —
                now click a glowing input port.
              </>
            ) : team.length === 0 ? (
              <>Step 1: click an agent below to add it to your canvas.</>
            ) : (
              <>Add more agents, or click an agent&apos;s ▶ output, then a matching ◀ input, to wire them.</>
            )}
          </span>
          {dragSource && (
            <button
              onClick={() => cancelWire()}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}
              aria-label="Cancel this connection"
            >
              Cancel connection ✕
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Agent palette */}
          <section style={{ ...panel, padding: 16 }} aria-label="Agent palette">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-white/70">
              Specialists ({roster.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {roster.map((a) => {
                const placed = placedIds.has(a.id);
                return (
                  <button
                    key={a.id}
                    disabled={placed}
                    onClick={() => placeAgent(a.id, nextPosition(team.length))}
                    aria-label={`Add ${a.name} — ${a.role}. ${a.blurb}${
                      placed ? ' Already on the canvas.' : ''
                    }`}
                    title={a.blurb}
                    style={{
                      textAlign: 'left',
                      borderRadius: 10,
                      padding: 10,
                      opacity: placed ? 0.45 : 1,
                      cursor: placed ? 'not-allowed' : 'pointer',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${a.accentHex}55`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        style={{ width: 10, height: 10, borderRadius: 999, background: a.accentHex }}
                      />
                      <span className="text-sm font-semibold text-white">{a.name}</span>
                      {placed && (
                        <span style={{ fontSize: 11, marginLeft: 'auto', color: LAB }} aria-hidden>
                          ✓ added
                        </span>
                      )}
                    </div>
                    <div className="text-white/60" style={{ fontSize: 11 }}>
                      {a.role}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Build canvas — placed agent nodes with ports */}
          <section style={{ ...panel, padding: 16 }} aria-label="Your team canvas">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-white/70">
              Your team ({team.length})
            </h3>
            {team.length === 0 ? (
              <p className="text-sm text-white/60">
                Empty canvas. Click a specialist to place your first agent.
              </p>
            ) : (
              <div className="space-y-2">
                {team.map((p) => {
                  const a = getAgent(p.agentId);
                  if (!a) return null;
                  const isSource = dragSource?.agentId === a.id;
                  return (
                    <div
                      key={a.id}
                      style={{
                        borderRadius: 12,
                        padding: 12,
                        background: isSource ? 'rgba(233,69,245,0.10)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSource ? LAB : 'rgba(255,255,255,0.10)'}`,
                      }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          aria-hidden
                          style={{ width: 10, height: 10, borderRadius: 999, background: a.accentHex }}
                        />
                        <span className="font-bold text-white">{a.name}</span>
                        <span className="text-xs text-white/60">{a.role}</span>
                        <button
                          onClick={() => removeAgent(a.id)}
                          aria-label={`Remove ${a.name} from the canvas`}
                          style={{
                            marginLeft: 'auto',
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            background: 'rgba(0,0,0,0.35)',
                            color: 'white',
                            fontSize: 15,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>

                      {/* Input ports (◀) */}
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-white/50">Inputs:</span>
                        {a.inputs.map((port) => {
                          const wired = isWiredInput(a.id, port.name);
                          const targetable = !!dragSource && isLegalTarget(a.id, port.name);
                          const tint = a.accentHex;
                          return (
                            <button
                              key={port.name}
                              disabled={!dragSource || !targetable}
                              onClick={() => {
                                if (!dragSource) return;
                                addWire({
                                  fromAgentId: dragSource.agentId,
                                  fromOutputName: dragSource.outputName,
                                  toAgentId: a.id,
                                  toInputName: port.name,
                                });
                              }}
                              aria-label={`Input ${port.name}, type ${port.type}${
                                wired ? ', already wired' : ''
                              }${targetable ? '. Click to connect the pending wire here.' : ''}`}
                              style={{
                                fontSize: 12,
                                borderRadius: 8,
                                padding: '4px 9px',
                                cursor: targetable ? 'pointer' : 'default',
                                background: targetable
                                  ? 'rgba(233,69,245,0.22)'
                                  : wired
                                  ? `${tint}22`
                                  : 'rgba(255,255,255,0.05)',
                                border: `1px ${targetable ? 'solid' : 'dashed'} ${
                                  targetable ? LAB : wired ? tint : 'rgba(255,255,255,0.18)'
                                }`,
                                color: 'rgba(255,255,255,0.85)',
                                boxShadow: targetable ? `0 0 0 2px ${LAB}44` : 'none',
                              }}
                            >
                              ◀ {port.name}
                              <span className="text-white/50"> · {port.type}</span>
                              {wired && <span aria-hidden> 🔗</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Output ports (▶) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-white/50">Outputs:</span>
                        {a.outputs.map((port) => {
                          const active = isSource && dragSource?.outputName === port.name;
                          const tint = a.accentHex;
                          return (
                            <button
                              key={port.name}
                              onClick={() =>
                                active
                                  ? cancelWire()
                                  : beginWire({ agentId: a.id, outputName: port.name })
                              }
                              aria-pressed={active}
                              aria-label={`Output ${port.name}, type ${port.type}. ${
                                active ? 'Click to cancel.' : 'Click to start a wire from here.'
                              }`}
                              style={{
                                fontSize: 12,
                                borderRadius: 8,
                                padding: '4px 9px',
                                cursor: 'pointer',
                                background: active ? LAB : `${tint}22`,
                                border: `1px solid ${active ? LAB : tint}`,
                                color: active ? '#0b0410' : 'rgba(255,255,255,0.9)',
                                fontWeight: active ? 700 : 400,
                              }}
                            >
                              {port.name} · {port.type} ▶
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Wires + errors + run */}
        <section style={{ ...panel, padding: 16 }} aria-label="Connections">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/70">
              Connections ({wires.length})
            </h3>
          </div>

          {lastWireError && (
            <p
              role="alert"
              style={{
                marginBottom: 8,
                fontSize: 13,
                color: '#ff9b82',
                background: 'rgba(255,112,80,0.12)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              ⚠️ {lastWireError}
            </p>
          )}
          {runError && (
            <p
              role="alert"
              style={{
                marginBottom: 8,
                fontSize: 13,
                color: '#ff9b82',
                background: 'rgba(255,112,80,0.12)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              ⚠️{' '}
              {runError.kind === 'cycle-in-team'
                ? 'Your team has a loop — remove a wire so the work flows forward.'
                : runError.kind === 'no-terminal-agent'
                ? 'Add at least one agent before running.'
                : 'The final output type does not match what the mission needs.'}
            </p>
          )}

          {wires.length === 0 ? (
            <p className="text-sm text-white/60">
              No connections yet. A single agent can run solo, but wiring a team together earns more
              stars.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {wires.map((w, i) => {
                const from = getAgent(w.fromAgentId);
                const to = getAgent(w.toAgentId);
                return (
                  <li
                    key={`${w.fromAgentId}-${w.fromOutputName}-${w.toAgentId}-${w.toInputName}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 999,
                      padding: '4px 6px 4px 12px',
                      background: 'rgba(233,69,245,0.12)',
                      border: '1px solid rgba(233,69,245,0.35)',
                    }}
                  >
                    <span className="text-sm text-white">
                      {from?.name}.{w.fromOutputName} → {to?.name}.{w.toInputName}
                    </span>
                    <button
                      onClick={() => removeWire(i)}
                      aria-label={`Remove wire from ${from?.name} to ${to?.name}`}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: 'rgba(0,0,0,0.35)',
                        color: 'white',
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              style={ghostBtn}
              onClick={() => setPhase('mission-select')}
              aria-label="Pick a different mission"
            >
              ← Different mission
            </button>
            <button
              style={{ ...primaryBtn, opacity: team.length === 0 ? 0.5 : 1 }}
              disabled={team.length === 0}
              onClick={() => runSimulation()}
              aria-label="Run the mission with your team"
            >
              ▶ Run the mission
            </button>
          </div>
        </section>
      </div>
    );
  }

  function SimulateView() {
    if (!mission) return null;
    const done = revealed >= trajectory.length;
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            Running your team…
          </h2>
          <p className="text-white/70">
            Watch each agent do its job, in order. Total run time: {(totalMs / 1000).toFixed(1)}s.
          </p>
        </div>

        <ol className="space-y-2">
          {trajectory.slice(0, revealed).map((stepItem) => {
            const a = getAgent(stepItem.agentId);
            const outPreview = Object.entries(stepItem.outputs)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : String(v)}`)
              .join('  •  ');
            return (
              <motion.li
                key={stepItem.step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ ...panel, padding: 14 }}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: a?.accentHex ?? LAB,
                      color: '#0b0410',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stepItem.step}
                  </span>
                  <span className="font-bold text-white">{a?.name ?? stepItem.agentId}</span>
                  <span className="ml-auto text-xs text-white/50">{stepItem.durationMs}ms</span>
                </div>
                <p className="mt-1 text-sm text-white/75">{stepItem.summary}</p>
                <p className="mt-1 text-xs text-white/60" style={{ wordBreak: 'break-word' }}>
                  → {outPreview}
                </p>
              </motion.li>
            );
          })}
        </ol>

        {!done && (
          <p className="text-center text-sm text-white/60" aria-live="polite">
            Working… ({revealed}/{trajectory.length})
          </p>
        )}

        <div className="flex justify-center">
          <button
            style={{ ...primaryBtn, opacity: trajectory.length === 0 ? 0.5 : 1 }}
            disabled={trajectory.length === 0}
            onClick={() => {
              setRevealed(trajectory.length);
              setPhase('grade');
            }}
            aria-label="See your graded results"
          >
            {done ? 'See my results →' : 'Skip to results →'}
          </button>
        </div>
      </div>
    );
  }

  function GradeView() {
    if (!grade || !mission) return null;
    const pct = Math.round(grade.total * 100);
    const mvp = grade.mvp ? getAgent(grade.mvp) : undefined;
    const win = grade.stars >= 2;
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5 py-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div style={{ fontSize: 52 }}>{win ? '🎉' : '🧩'}</div>
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            {win ? 'Your team nailed it!' : 'Mission run complete'}
          </h2>
          <div className="my-2">
            <Stars n={grade.stars} size={36} />
          </div>
          <p className="text-white/80">
            Score: <strong style={{ color: LAB }}>{pct}%</strong> · Team of{' '}
            <strong className="text-white">{team.length}</strong> (target {mission.parAgentCount})
          </p>
        </motion.div>

        <div style={{ ...panel, padding: 18 }}>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-white/70">
            How the team did
          </h3>
          <ul className="space-y-1.5">
            {grade.perCriterion.map((c, i) => {
              const good = c.matched >= 0.75;
              const partial = c.matched > 0 && c.matched < 0.75;
              return (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white/80">
                    {good ? '✅' : partial ? '🟡' : '⬜'} {c.criterion}
                  </span>
                  <span className="text-xs text-white/60">{Math.round(c.matched * 100)}%</span>
                </li>
              );
            })}
          </ul>
        </div>

        {finalArtifact && (
          <div style={{ ...panel, padding: 18 }}>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">
              What your team produced
            </div>
            <p className="text-sm text-white/85" style={{ wordBreak: 'break-word' }}>
              {finalArtifact}
            </p>
          </div>
        )}

        {mvp && (
          <p className="text-center text-sm text-white/75">
            🏅 Most valuable agent: <strong style={{ color: LAB }}>{mvp.name}</strong>
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            style={ghostBtn}
            onClick={() => setPhase('build')}
            aria-label="Tweak your team and run again"
          >
            🔧 Tweak the team
          </button>
          {childId && (
            <button
              style={ghostBtn}
              onClick={() => {
                setSaveName(`${mission.title} team`);
                setPhase('save');
              }}
              aria-label="Save this team"
            >
              💾 Save team
            </button>
          )}
          <button style={primaryBtn} onClick={() => setPhase('complete')} aria-label="Finish">
            Finish →
          </button>
        </div>
      </div>
    );
  }

  function SaveView() {
    return (
      <Centered>
        <h2 className="text-2xl font-black" style={{ color: LAB }}>
          Name your team
        </h2>
        <p className="max-w-md text-center text-white/70">
          Save it so you can reuse this crew later. (Totally optional.)
        </p>
        <input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          aria-label="Team name"
          maxLength={60}
          style={{
            width: '100%',
            maxWidth: 360,
            borderRadius: 10,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.16)',
            color: 'white',
          }}
        />
        <div className="flex gap-3">
          <button style={ghostBtn} onClick={() => setPhase('complete')} aria-label="Skip saving">
            Skip
          </button>
          <button
            style={{ ...primaryBtn, opacity: isSaving || !saveName.trim() ? 0.6 : 1 }}
            disabled={isSaving || !saveName.trim() || !childId}
            onClick={async () => {
              if (!childId) return;
              const ok = await saveComposition(childId, saveName.trim());
              if (ok) setPhase('complete');
            }}
            aria-label="Save team"
          >
            {isSaving ? 'Saving…' : 'Save team'}
          </button>
        </div>
      </Centered>
    );
  }

  function CompleteView() {
    return (
      <Centered>
        <div style={{ fontSize: 60 }}>🏆</div>
        <h2 className="text-3xl font-black" style={{ color: LAB }}>
          Nice building, architect!
        </h2>
        <p className="max-w-md text-center text-white/80">
          You assembled a team of AI agents, wired their work together, and ran a real mission.
          That&apos;s the heart of agentic AI — many small specialists, one big result.
        </p>
        {grade && <Stars n={grade.stars} size={32} />}
        <button
          style={primaryBtn}
          onClick={() => {
            firedRef.current = false;
            setRevealed(0);
            reset();
            beginGame();
          }}
          aria-label="Build another team"
        >
          ↺ Build another team
        </button>
      </Centered>
    );
  }

  // Called as plain functions (not JSX elements) so their markup inlines into
  // this component's tree — no remount-per-render, so inputs keep focus.
  function view() {
    switch (phase) {
      case 'welcome':
        return WelcomeView();
      case 'learn-roster':
      case 'learn-wiring':
      case 'learn-mission':
        return TutorialView();
      case 'mission-select':
        return MissionSelectView();
      case 'build':
      case 'wire':
        return CanvasView();
      case 'simulate':
        return SimulateView();
      case 'grade':
      case 'review':
        return GradeView();
      case 'save':
        return SaveView();
      case 'complete':
        return CompleteView();
      default:
        return WelcomeView();
    }
  }

  return (
    <GameShell title="Agent Atelier" color={LAB} labNum={11}>
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

// ─── Layout helper ───────────────────────────────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-8 text-center"
      style={{ minHeight: '55vh' }}
    >
      {children}
    </div>
  );
}
