// ════════════════════════════════════════════════════════════════════════
// MCP LAB — Lab 11 Flagship (Stage 11E, C6) — "Equip" step of the
// Build → Equip → Constrain arc.
// ════════════════════════════════════════════════════════════════════════
// The child plugs MCP-style tools into an AI agent team and watches the
// team's capabilities expand (baseline → equipped contrast). This UI drives
// the REAL engine in `useMcpLabStore` (mission library + binding validation
// + heuristic grader). No quiz stub — the store does all the logic; this
// file is the presentational layer + state→view / controls→action wiring.
//
// Phase machine driven (from mcpLabStore.McpLabPhase):
//   welcome → learn-tools → learn-descriptions → learn-plug-and-play
//   → mission-select → load-team → equip → test → compare → grade
//   → (save) → complete

'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useMcpLabStore } from '@/stores/mcpLabStore';
import {
  toolsForBand,
  getTool,
  CATEGORY_META,
  SIDE_EFFECT_META,
} from '@/lib/mcplab/toolCatalog';
import { getEquipMission } from '@/lib/mcplab/toolBinding';
import { getAgent } from '@/lib/agentatelier/agentRoster';
import { canConnect } from '@/lib/agentatelier/wireGraph';
import type { Tool, EquipMission, EquipMissionDifficulty } from '@/types/mcplab';
import type { Port } from '@/types/agentAtelier';

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

const DIFFICULTY_LABEL: Record<EquipMissionDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const TUTORIALS = [
  {
    phase: 'learn-tools' as const,
    key: 'tools' as const,
    emoji: '🧰',
    title: 'Tools are plug-ins',
    body: [
      'Your AI agents are smart, but on their own they can only guess.',
      'A tool is a real plug-in — a Calculator that does exact math, a Calendar that knows the date, a Dictionary that looks up words.',
      'When you plug a tool into an agent, the agent stops guessing and starts using the real thing.',
    ],
  },
  {
    phase: 'learn-descriptions' as const,
    key: 'descriptions' as const,
    emoji: '🏷️',
    title: 'Descriptions matter',
    body: [
      'Every tool has a description that tells the agent what it does and how to use it.',
      'A clear description means the agent picks the right tool at the right time.',
      'This is the real idea behind MCP: a shared, clear way to hand tools to an AI.',
    ],
  },
  {
    phase: 'learn-plug-and-play' as const,
    key: 'plugAndPlay' as const,
    emoji: '🔌',
    title: 'Plug and play',
    body: [
      'Pick a mission, then plug tools into your team.',
      'Run the mission once WITHOUT tools, then WITH your tools — and watch what changes.',
      'More of the right tools = a stronger team and more stars. Ready?',
    ],
  },
];

export default function McpLabGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();
  const band = (child?.age_band || 'B') as 'A' | 'B' | 'C';
  const childId = child?.id;

  // ─── Store: state ──────────────────────────────────────────────────────
  const phase = useMcpLabStore((s) => s.phase);
  const currentMissionId = useMcpLabStore((s) => s.currentMissionId);
  const team = useMcpLabStore((s) => s.team);
  const bindings = useMcpLabStore((s) => s.bindings);
  const grade = useMcpLabStore((s) => s.grade);
  const baselineArtifact = useMcpLabStore((s) => s.baselineArtifact);
  const equippedArtifact = useMcpLabStore((s) => s.equippedArtifact);
  const lastBindingError = useMcpLabStore((s) => s.lastBindingError);
  const lastDifficulty = useMcpLabStore((s) => s.lastDifficulty);
  const isSaving = useMcpLabStore((s) => s.isSaving);

  // ─── Store: actions ────────────────────────────────────────────────────
  const setPhase = useMcpLabStore((s) => s.setPhase);
  const beginGame = useMcpLabStore((s) => s.beginGame);
  const reset = useMcpLabStore((s) => s.reset);
  const markTutorialSeen = useMcpLabStore((s) => s.markTutorialSeen);
  const setDifficulty = useMcpLabStore((s) => s.setDifficulty);
  const pickMission = useMcpLabStore((s) => s.pickMission);
  const availableMissionsForBand = useMcpLabStore((s) => s.availableMissionsForBand);
  const loadStarterTeam = useMcpLabStore((s) => s.loadStarterTeam);
  const addBinding = useMcpLabStore((s) => s.addBinding);
  const removeBinding = useMcpLabStore((s) => s.removeBinding);
  const clearBindings = useMcpLabStore((s) => s.clearBindings);
  const runTest = useMcpLabStore((s) => s.runTest);
  const runBaseline = useMcpLabStore((s) => s.runBaseline);
  const saveEquippedComposition = useMcpLabStore((s) => s.saveEquippedComposition);

  // ─── Local UI state ────────────────────────────────────────────────────
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [difFilter, setDifFilter] = useState<'all' | EquipMissionDifficulty>(lastDifficulty);
  const [saveName, setSaveName] = useState('');
  const firedRef = useRef(false);

  // ─── Mount: reset + enter the store's intended flow. Clean up on exit. ──
  useEffect(() => {
    reset();
    beginGame();
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Completion: fire exactly once when the report (grade) phase shows. ─
  useEffect(() => {
    if (phase === 'grade' && grade && !firedRef.current) {
      firedRef.current = true;
      const xp = Math.round(60 + grade.total * 120); // 60..180
      awardXP(xp);
      const stars = Math.max(1, grade.stars) as 1 | 2 | 3;
      completeGame('mcp-lab', stars);
    }
  }, [phase, grade, awardXP, completeGame]);

  const mission = currentMissionId ? getEquipMission(currentMissionId) : undefined;
  const availableTools = useMemo(() => toolsForBand(band), [band]);
  const selectedTool = selectedToolId ? getTool(selectedToolId) : undefined;

  // ══════════════════════════════════════════════════════════════════════
  // PHASE VIEWS
  // ══════════════════════════════════════════════════════════════════════

  function WelcomeView() {
    return (
      <Centered>
        <div style={{ fontSize: 64 }}>🔌</div>
        <h1 className="text-3xl font-black" style={{ color: LAB }}>
          MCP Lab
        </h1>
        <p className="max-w-md text-center text-lg text-white/80">
          Plug real tools into your AI team and watch what they can do. This is the{' '}
          <strong style={{ color: LAB }}>Equip</strong> workshop.
        </p>
        <button style={primaryBtn} onClick={() => beginGame()} aria-label="Start MCP Lab">
          Enter the lab →
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
          {next ? 'Got it — next' : "Let's go →"}
        </button>
      </Centered>
    );
  }

  function MissionSelectView() {
    const all = availableMissionsForBand(band);
    const missions = all.filter((m) => difFilter === 'all' || m.difficulty === difFilter);
    const filters: Array<'all' | EquipMissionDifficulty> = ['all', 'easy', 'medium', 'hard'];
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            Pick a mission
          </h2>
          <p className="text-white/70">Choose a job for your AI team to tackle.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter missions by difficulty">
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

  function MissionCard({ m }: { m: EquipMission }) {
    return (
      <button
        onClick={() => {
          setSelectedToolId(null);
          pickMission(m.id);
        }}
        aria-label={`Start mission ${m.title}`}
        style={{ ...panel, padding: 18, textAlign: 'left', cursor: 'pointer' }}
        className="flex flex-col gap-2 transition hover:brightness-125"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{m.title}</h3>
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
            {DIFFICULTY_LABEL[m.difficulty]}
          </span>
        </div>
        <p className="text-sm text-white/70">{m.prompt}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {m.starterTeam.map((id) => {
            const a = getAgent(id);
            return (
              <span
                key={id}
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                🤖 {a?.name ?? id}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-white/60">
          Best with ~{m.parToolCount} tool{m.parToolCount === 1 ? '' : 's'} plugged in
        </p>
      </button>
    );
  }

  function LoadTeamView() {
    if (!mission) return null;
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            Meet your team
          </h2>
          <p className="text-white/70">
            For <strong className="text-white">{mission.title}</strong>. Right now they have{' '}
            <strong style={{ color: LAB }}>no tools</strong> — they can only estimate by hand.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {team.map((p) => {
            const a = getAgent(p.agentId);
            if (!a) return null;
            return (
              <div key={p.agentId} style={{ ...panel, padding: 16 }} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    style={{ width: 12, height: 12, borderRadius: 999, background: a.accentHex }}
                  />
                  <span className="font-bold text-white">🤖 {a.name}</span>
                </div>
                <p className="text-sm text-white/70">{a.role}</p>
                <p className="text-xs text-white/60">{a.blurb}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-3">
          <button style={ghostBtn} onClick={() => setPhase('mission-select')} aria-label="Pick a different mission">
            ← Different mission
          </button>
          <button style={primaryBtn} onClick={() => loadStarterTeam()} aria-label="Equip this team with tools">
            Equip this team →
          </button>
        </div>
      </div>
    );
  }

  function EquipView() {
    if (!mission) return null;
    const forbidden = new Set(mission.forbiddenTools);
    const recommended = new Set(mission.recommendedTools);

    function tryBind(agentId: string, port: Port) {
      if (!selectedTool) return;
      const ok = addBinding({ agentId, inputName: port.name, toolId: selectedTool.id });
      if (ok) setSelectedToolId(null);
    }

    // group tools by category for the palette
    const grouped = (Object.keys(CATEGORY_META) as Array<Tool['category']>)
      .map((cat) => ({ cat, tools: availableTools.filter((t) => t.category === cat) }))
      .filter((g) => g.tools.length > 0);

    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 py-4">
        <header className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            {mission.title}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-white/75">{mission.prompt}</p>
          <p className="mt-1 text-xs text-white/60">
            {selectedTool
              ? `Now click an agent's port to plug in ${selectedTool.emoji} ${selectedTool.name}.`
              : 'Step 1: pick a tool below. Step 2: click an agent port to plug it in.'}
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Tool palette */}
          <section style={{ ...panel, padding: 16 }} aria-label="Tool palette">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-white/70">Tool palette</h3>
            <div className="space-y-3">
              {grouped.map(({ cat, tools }) => (
                <div key={cat}>
                  <div className="mb-1 text-xs font-semibold" style={{ color: CATEGORY_META[cat].color }}>
                    {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tools.map((t) => {
                      const isForbidden = forbidden.has(t.id);
                      const isSelected = selectedToolId === t.id;
                      const isRec = recommended.has(t.id);
                      const se = SIDE_EFFECT_META[t.sideEffect];
                      return (
                        <button
                          key={t.id}
                          disabled={isForbidden}
                          onClick={() => setSelectedToolId(isSelected ? null : t.id)}
                          aria-pressed={isSelected}
                          aria-label={`${t.name}. ${t.description}${
                            isForbidden ? ' Forbidden in this mission.' : ''
                          }${isRec ? ' Recommended.' : ''}`}
                          title={t.description}
                          style={{
                            textAlign: 'left',
                            borderRadius: 10,
                            padding: 8,
                            opacity: isForbidden ? 0.4 : 1,
                            cursor: isForbidden ? 'not-allowed' : 'pointer',
                            background: isSelected ? 'rgba(233,69,245,0.22)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${
                              isSelected ? LAB : isRec ? 'rgba(233,69,245,0.4)' : 'rgba(255,255,255,0.12)'
                            }`,
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span aria-hidden>{t.emoji}</span>
                            <span className="text-sm font-semibold text-white">{t.name}</span>
                          </div>
                          <div className="text-white/60" style={{ fontSize: 11 }}>{t.blurb}</div>
                          <div className="mt-1 flex items-center gap-1">
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 6,
                                background:
                                  se.tone === 'safe'
                                    ? 'rgba(0,209,122,0.18)'
                                    : se.tone === 'caution'
                                    ? 'rgba(217,164,48,0.18)'
                                    : 'rgba(255,112,80,0.2)',
                                color:
                                  se.tone === 'safe' ? '#5be6a8' : se.tone === 'caution' ? '#e6c46b' : '#ff9b82',
                              }}
                            >
                              {se.label}
                            </span>
                            {isRec && (
                              <span style={{ fontSize: 10, color: LAB }} aria-hidden>
                                ★ pick
                              </span>
                            )}
                            {isForbidden && (
                              <span style={{ fontSize: 10, color: '#ff9b82' }} aria-hidden>
                                ⛔ off-limits
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Agent team + ports */}
          <section style={{ ...panel, padding: 16 }} aria-label="Your agent team">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-white/70">Your team</h3>
            <div className="space-y-2">
              {team.map((p) => {
                const a = getAgent(p.agentId);
                if (!a) return null;
                const boundCount = bindings.filter((b) => b.agentId === a.id).length;
                return (
                  <div
                    key={a.id}
                    style={{
                      borderRadius: 12,
                      padding: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        aria-hidden
                        style={{ width: 10, height: 10, borderRadius: 999, background: a.accentHex }}
                      />
                      <span className="font-bold text-white">🤖 {a.name}</span>
                      {boundCount > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '1px 8px',
                            borderRadius: 999,
                            background: 'rgba(233,69,245,0.2)',
                            color: LAB,
                          }}
                        >
                          {boundCount} tool{boundCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.inputs.map((port) => {
                        const compatible = selectedTool
                          ? canConnect({ name: 'tool', type: selectedTool.outputType }, port)
                          : false;
                        return (
                          <button
                            key={port.name}
                            onClick={() => tryBind(a.id, port)}
                            disabled={!selectedTool}
                            aria-label={`Plug selected tool into ${a.name} port ${port.name} (${port.type})`}
                            style={{
                              fontSize: 12,
                              borderRadius: 8,
                              padding: '6px 10px',
                              cursor: selectedTool ? 'pointer' : 'default',
                              background: compatible ? 'rgba(233,69,245,0.16)' : 'rgba(255,255,255,0.05)',
                              border: `1px dashed ${
                                compatible ? LAB : 'rgba(255,255,255,0.18)'
                              }`,
                              color: 'rgba(255,255,255,0.85)',
                            }}
                          >
                            🔌 {port.name}
                            <span className="text-white/50"> · {port.type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bindings + error + run */}
        <section style={{ ...panel, padding: 16 }} aria-label="Plugged-in tools">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/70">
              Plugged in ({bindings.length})
            </h3>
            {bindings.length > 0 && (
              <button
                onClick={() => clearBindings()}
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}
                aria-label="Remove all plugged-in tools"
              >
                Clear all
              </button>
            )}
          </div>

          {lastBindingError && (
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
              ⚠️ {lastBindingError}
            </p>
          )}

          {bindings.length === 0 ? (
            <p className="text-sm text-white/60">
              No tools plugged in yet. Your team will run on estimates alone — plug some in to level up!
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {bindings.map((b, i) => {
                const t = getTool(b.toolId);
                const a = getAgent(b.agentId);
                return (
                  <li
                    key={`${b.agentId}-${b.inputName}-${b.toolId}-${i}`}
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
                      {t?.emoji} {t?.name} → {a?.name}.{b.inputName}
                    </span>
                    <button
                      onClick={() => removeBinding(i)}
                      aria-label={`Unplug ${t?.name} from ${a?.name}`}
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

          <div className="mt-4 flex items-center justify-between gap-3">
            <button style={ghostBtn} onClick={() => setPhase('load-team')} aria-label="Go back to team">
              ← Back
            </button>
            <button
              style={primaryBtn}
              onClick={() => {
                runBaseline();
                setPhase('test');
              }}
              aria-label="Run the mission"
            >
              ▶ Run the mission
            </button>
          </div>
        </section>
      </div>
    );
  }

  function TestView() {
    if (!mission) return null;
    return (
      <Centered>
        <h2 className="text-2xl font-black" style={{ color: LAB }}>
          First — no tools
        </h2>
        <p className="max-w-md text-center text-white/75">
          Let&apos;s see what the team does on its own, before your tools kick in.
        </p>
        <div style={{ ...panel, padding: 20, maxWidth: 560 }} className="w-full">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">
            Baseline run (no tools)
          </div>
          <p className="text-white/85">{baselineArtifact || 'Running the baseline…'}</p>
        </div>
        <p className="text-sm text-white/60">
          You plugged in <strong style={{ color: LAB }}>{bindings.length}</strong> tool
          {bindings.length === 1 ? '' : 's'}. Run again with them attached!
        </p>
        <button
          style={primaryBtn}
          onClick={() => runTest()}
          aria-label="Run again with your tools plugged in"
        >
          🔌 Run WITH my tools →
        </button>
      </Centered>
    );
  }

  function CompareView() {
    if (!mission) return null;
    const pluggedTools = Array.from(new Set(bindings.map((b) => b.toolId)))
      .map((id) => getTool(id))
      .filter(Boolean) as Tool[];
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            Before → After
          </h2>
          <p className="text-white/70">See how plugging in tools changed what your team could do.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div style={{ ...panel, padding: 18 }}>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">
              Without tools
            </div>
            <p className="text-white/80">{baselineArtifact}</p>
          </div>
          <div
            style={{
              ...panel,
              padding: 18,
              border: `1px solid ${LAB}`,
              background: 'rgba(233,69,245,0.08)',
            }}
          >
            <div className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: LAB }}>
              With your tools
            </div>
            <p className="text-white/90">{equippedArtifact}</p>
            {pluggedTools.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pluggedTools.map((t) => (
                  <span
                    key={t.id}
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {t.emoji} {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center">
          <button style={primaryBtn} onClick={() => setPhase('grade')} aria-label="See your score">
            See my score →
          </button>
        </div>
      </div>
    );
  }

  function GradeView() {
    if (!grade || !mission) return null;
    const pct = Math.round(grade.total * 100);
    const mvp = grade.mvpToolId ? getTool(grade.mvpToolId) : undefined;
    const win = grade.stars >= 2;
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5 py-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div style={{ fontSize: 52 }}>{win ? '🎉' : '🛠️'}</div>
          <h2 className="text-2xl font-black" style={{ color: LAB }}>
            {win ? 'Your team leveled up!' : 'Mission run complete'}
          </h2>
          <div className="my-2">
            <Stars n={grade.stars} size={36} />
          </div>
          <p className="text-white/80">
            Score: <strong style={{ color: LAB }}>{pct}%</strong>
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

        {mvp && (
          <p className="text-center text-sm text-white/75">
            🏅 Most valuable tool: <strong style={{ color: LAB }}>{mvp.emoji} {mvp.name}</strong>
          </p>
        )}

        {grade.violations.length > 0 && (
          <p
            role="alert"
            className="text-center text-sm"
            style={{ color: '#ff9b82' }}
          >
            ⚠️ You used {grade.violations.length} off-limits tool
            {grade.violations.length === 1 ? '' : 's'} — that cost you points next time avoid:{' '}
            {grade.violations.map((v) => getTool(v)?.name ?? v).join(', ')}.
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {childId && (
            <button
              style={ghostBtn}
              onClick={() => {
                setSaveName(`${mission.title} (equipped)`);
                setPhase('save');
              }}
              aria-label="Save this equipped team"
            >
              💾 Save this team
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
          Name your equipped team
        </h2>
        <p className="max-w-md text-center text-white/70">
          Save it so you can reuse this tooled-up team later. (Totally optional.)
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
              const ok = await saveEquippedComposition(childId, saveName.trim());
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
          Nice work, engineer!
        </h2>
        <p className="max-w-md text-center text-white/80">
          You equipped your AI team with real tools and saw their powers grow. That&apos;s the heart of
          MCP — plug in the right capability at the right time.
        </p>
        {grade && <Stars n={grade.stars} size={32} />}
        <button
          style={primaryBtn}
          onClick={() => {
            firedRef.current = false;
            setSelectedToolId(null);
            reset();
            beginGame();
          }}
          aria-label="Play another mission"
        >
          ↺ Play another mission
        </button>
      </Centered>
    );
  }

  // Called as plain functions (not JSX elements) so their markup inlines
  // into this component's tree — no remount-per-render, so inputs keep focus.
  function view() {
    switch (phase) {
      case 'welcome':
        return WelcomeView();
      case 'learn-tools':
      case 'learn-descriptions':
      case 'learn-plug-and-play':
        return TutorialView();
      case 'mission-select':
        return MissionSelectView();
      case 'load-team':
        return LoadTeamView();
      case 'equip':
        return EquipView();
      case 'test':
        return TestView();
      case 'compare':
        return CompareView();
      case 'grade':
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
    <GameShell title="MCP Lab" color={LAB} labNum={11}>
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
