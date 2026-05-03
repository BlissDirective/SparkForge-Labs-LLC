// src/types/mcplab.ts
// ════════════════════════════════════════════════════════════════
// Stage 11E — MCP Plug-and-Play Lab (C6, Lab 11)
// ════════════════════════════════════════════════════════════════
// Shared types for the tool catalog, tool bindings, and equipped
// missions. Bindings persist in the agent_compositions.tool_bindings
// JSONB column added in 20260501000004.
//
// "MCP" in the kid-facing copy expands to "Make Cool Plug-ins" — a
// kid-friendly demystification of the actual industry concept (Model
// Context Protocol). The pedagogical idea is the same as the real
// thing: a standardized way to attach external capabilities to
// agents, where the *description* matters as much as the
// implementation.
// ════════════════════════════════════════════════════════════════

import type { AgeBand } from '@/config/gameRegistry';
import type { PortType } from '@/types/agentAtelier';

// ─── Tool catalog ────────────────────────────────────────────────

/** Categorical tag used for visual grouping in the catalog drawer. */
export type ToolCategory =
  | 'math'        // calculator, unit-converter, formula-solver
  | 'time'        // calendar, clock, timer
  | 'language'    // dictionary, translator, thesaurus
  | 'web'         // web-fetch (sandboxed), search
  | 'creative'    // doodle-maker, color-picker
  | 'data'        // chart-builder, csv-reader
  | 'utility';    // notepad, list-maker

/** Side-effect class — kid-readable label that the UI surfaces in
 *  every tool card. Matches the Doc 2 §C2 safety taxonomy. */
export type ToolSideEffect =
  | 'read-only'   // pure compute / read; no external writes
  | 'sandboxed'   // mutates a sandbox the kid controls (e.g., notepad)
  | 'cached-fetch' // reads cached external content (web-fetch)
  | 'network';    // makes outbound network calls (gated to network-quota)

/** Tool definition (static, lives in toolCatalog.ts). */
export interface Tool {
  id: string;
  name: string;
  /** ≤ 60-char human role label. */
  blurb: string;
  category: ToolCategory;
  /** What the tool needs from the agent — must match the agent input port type. */
  inputType: PortType;
  /** What the tool returns — fed back as the agent's output. */
  outputType: PortType;
  /** Kid-readable description. The pedagogical hook of Stage 11E:
   *  changing the description changes how the agent uses the tool. */
  description: string;
  /** Side-effect class for the safety badge. */
  sideEffect: ToolSideEffect;
  /** Age-band gate. */
  unlockTier: AgeBand;
  /** Decorative emoji. */
  emoji: string;
  /** HEX accent for the tool card + 3D representation. */
  accentHex: string;
  /** Optional — when the tool ships with a default config (e.g., calculator base = 10). */
  defaultConfigJson?: Record<string, unknown>;
}

// ─── Tool bindings (persistent shape) ────────────────────────────

/** A specific tool attached to a specific agent's input port. Shape
 *  matches the agent_compositions.tool_bindings JSONB column. */
export interface ToolBinding {
  agentId: string;
  /** Which input port this tool feeds. */
  inputName: string;
  /** Foreign key into the static toolCatalog (NOT a DB FK). */
  toolId: string;
  /** Optional per-binding configuration override. */
  configJson?: Record<string, unknown>;
}

// ─── Equipped mission shape ──────────────────────────────────────

export type EquipMissionDifficulty = 'easy' | 'medium' | 'hard';

export interface EquipMission {
  id: string;
  title: string;
  prompt: string;
  difficulty: EquipMissionDifficulty;
  band: AgeBand[];
  /** The starter team the mission ships with — references AGENT_ROSTER ids.
   *  Player can also LOAD a previous Atelier save instead. */
  starterTeam: string[];
  /** Tool ids the mission EXPECTS to be attached for a 3-star solve. */
  recommendedTools: string[];
  /** Tool ids the mission FORBIDS (safety / focus). */
  forbiddenTools: string[];
  /** Hand-built rubric — same shape as Stage 11D's Mission rubric. */
  rubric: Array<{ criterion: string; weight: number }>;
  /** Suggested minimum tool-binding count for a 3-star solve. */
  parToolCount: number;
}

export interface EquipGrade {
  total: number;       // 0..1
  stars: 0 | 1 | 2 | 3;
  perCriterion: { criterion: string; matched: number }[];
  /** Tool that contributed most to the score (or null if unequipped). */
  mvpToolId: string | null;
  /** Forbidden tools the player attached (penalty). */
  violations: string[];
  timeMs: number;
}

// ─── Validation errors ───────────────────────────────────────────

export type ToolBindingError =
  | { kind: 'unknown-tool'; toolId: string }
  | { kind: 'unknown-agent'; agentId: string }
  | { kind: 'unknown-port'; agentId: string; inputName: string }
  | { kind: 'type-mismatch'; toolType: PortType; portType: PortType }
  | { kind: 'duplicate-binding' }
  | { kind: 'forbidden-tool'; toolId: string };
