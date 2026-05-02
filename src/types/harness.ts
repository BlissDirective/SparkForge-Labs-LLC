// src/types/harness.ts
// ════════════════════════════════════════════════════════════════
// Stage 11G — Harness Forge (C7, Lab 11 — Constrain step)
// ════════════════════════════════════════════════════════════════
// Shared types for the 3-layer safety harness applied to a saved
// composition. Persisted in the agent_compositions.harness_config
// JSONB column added in 20260501000005.
//
// The 3 layers, in execution order:
//   1. INPUT FILTER     — sanitizes prompts before any agent sees them
//   2. BEHAVIOR MONITOR — watches the trajectory in real time for
//                          loops, duplicate outputs, etc.
//   3. OUTPUT VALIDATOR — checks the final artifact against rules
//
// Each layer can CATCH things (returning a list of catches) and the
// stress test produces a per-layer effectiveness score.
// ════════════════════════════════════════════════════════════════

import type { AgeBand } from '@/config/gameRegistry';

// ─── Layer config shapes ─────────────────────────────────────────

export interface FilterLayerConfig {
  /** Strip personally identifiable info (emails, phone, addresses). */
  stripPii: boolean;
  /** Block prompts containing profanity (kid-safe block list). */
  blockProfanity: boolean;
  /** Hard cap on prompt length (characters). 0 = no cap. */
  lengthCap: number;
}

export interface ValidatorLayerConfig {
  /** If set, the final artifact must contain this keyword (case-insensitive). */
  requireKeyword?: string;
  /** If set, the final artifact must be ≤ this character length. */
  maxLength?: number;
  /** Require any [number]-style citation in the artifact. */
  requireCitations: boolean;
}

export interface MonitorLayerConfig {
  /** Maximum number of agent calls before the run is auto-stopped. */
  loopLimit: number;
  /** Detect and surface near-duplicate outputs across steps. */
  dedupeOutputs: boolean;
}

/** Persistent shape (matches agent_compositions.harness_config JSONB). */
export interface HarnessConfig {
  filter: FilterLayerConfig;
  validator: ValidatorLayerConfig;
  monitor: MonitorLayerConfig;
}

export const DEFAULT_HARNESS_CONFIG: HarnessConfig = {
  filter:    { stripPii: false, blockProfanity: false, lengthCap: 0 },
  validator: { requireKeyword: undefined, maxLength: undefined, requireCitations: false },
  monitor:   { loopLimit: 10, dedupeOutputs: false },
};

// ─── Catches ─────────────────────────────────────────────────────

/** A single thing a layer caught during a run. */
export interface HarnessCatch {
  layer: 'filter' | 'validator' | 'monitor';
  /** Kid-readable category. */
  rule: string;
  /** ≤ 200-char detail of what was caught. */
  detail: string;
  /** Severity 1..3 (UI sorts critical to top). */
  severity: 1 | 2 | 3;
}

// ─── Stress test fixtures ────────────────────────────────────────

/** A stress-test prompt designed to challenge one or more layers. */
export interface StressFixture {
  id: string;
  /** Kid-readable label (e.g., "Phishing Email Prompt"). */
  label: string;
  /** The actual prompt text the agent team will receive. */
  prompt: string;
  /** Categories of layer this fixture is designed to test. */
  targetLayers: Array<'filter' | 'validator' | 'monitor'>;
  /** What an UNHARNESSED team would produce (used for the comparison panel). */
  unharnessedOutcome: string;
  /** Optional: keywords the validator's requireKeyword field should match for full score. */
  expectedKeywords?: string[];
  /** Age-band gate. */
  band: AgeBand[];
}

// ─── Stress test result ──────────────────────────────────────────

export interface StressTestResult {
  fixtureId: string;
  /** All catches from running this fixture through the harness. */
  catches: HarnessCatch[];
  /** Final artifact text after all layers ran (may be sanitized or rejected). */
  finalArtifact: string;
  /** True if the run was REJECTED by some layer before producing a final artifact. */
  rejected: boolean;
  /** ISO-friendly timestamp when this result was generated (session-only). */
  timestampMs: number;
}

export interface StressTestGrade {
  /** Total fixtures attempted. */
  totalFixtures: number;
  /** Number of fixtures that produced at least one catch (good - the harness worked). */
  caughtCount: number;
  /** Number of fixtures that the unharnessed team would have failed but the harness rejected. */
  preventedCount: number;
  /** Per-layer effectiveness fraction 0..1. */
  filterEffectiveness: number;
  validatorEffectiveness: number;
  monitorEffectiveness: number;
  /** Total score 0..1 (mean of layer effectiveness, weighted). */
  total: number;
  stars: 0 | 1 | 2 | 3;
}

// ─── Apply errors ────────────────────────────────────────────────

export type HarnessApplyError =
  | { kind: 'no-composition'; }
  | { kind: 'invalid-config'; reason: string };
