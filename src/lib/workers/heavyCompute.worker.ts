// ════════════════════════════════════════════════════════════════
// heavyCompute.worker — T12 PERF-MED-004 (Opt A)
// ════════════════════════════════════════════════════════════════
// Web Worker entry for ops that are genuinely heavy (>50 ms) and
// would stall the main thread. Exposed via Comlink so callers see
// a plain async function interface. Keep this file completely
// self-contained — it has no DOM / React / Three.js access.
//
// Current jobs:
//   - filterContentSafety: sanitize + validate AI-generated content
//       (PII redaction, forbidden-topic scan) without blocking the
//       Canvas.
//   - computeScoreBreakdown: tally per-round game scores with
//       streak / hint / time bonuses.
//   - hashStrings: SHA-256 over an array of strings (e.g. for cache
//       keys, leaderboard dedup).
//
// New jobs MUST remain pure functions + serializable args so
// Comlink's structured-clone boundary stays cheap.
// ════════════════════════════════════════════════════════════════

import { expose } from 'comlink';
import {
  integrateParticles as integrateParticlesCore,
  type ParticleForces,
} from '../particles/physicsCore';

const PII_PATTERN =
  /\b[\w.+-]+@[\w-]+\.[\w.]+\b|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\d{1,5}\s\w+\s(?:St|Ave|Rd|Blvd|Dr|Ln|Ct)\b/gi;

const FORBIDDEN_TOPICS = [
  'violence',
  'weapon',
  'drug',
  'alcohol',
  'sexual',
  'suicide',
  'self-harm',
];

export interface ContentSafetyResult {
  safe: boolean;
  reason?: string;
  sanitized: string;
}

function sanitize(text: string): string {
  return text.replace(PII_PATTERN, '[REDACTED]');
}

function validate(str: string): { safe: boolean; reason?: string } {
  const lower = str.toLowerCase();
  for (const topic of FORBIDDEN_TOPICS) {
    if (lower.includes(topic)) {
      return { safe: false, reason: `Content contains forbidden topic: ${topic}` };
    }
  }
  return { safe: true };
}

// ── Job: content safety ───────────────────────────────────────────
export function filterContentSafety(text: string): ContentSafetyResult {
  const sanitized = sanitize(text);
  const result = validate(sanitized);
  return { ...result, sanitized };
}

// ── Job: batch content safety ─────────────────────────────────────
export function filterContentSafetyBatch(
  items: readonly string[],
): ContentSafetyResult[] {
  return items.map(filterContentSafety);
}

// ── Job: score breakdown ──────────────────────────────────────────
export interface RoundScoreInput {
  correct: boolean;
  basePoints: number;
  streak?: number;
  hintsUsed?: number;
  timeMs?: number;
  maxTimeMs?: number;
}

export interface ScoreBreakdown {
  total: number;
  base: number;
  streakBonus: number;
  hintPenalty: number;
  timeBonus: number;
}

export function computeScoreBreakdown(rounds: readonly RoundScoreInput[]): ScoreBreakdown {
  let base = 0;
  let streakBonus = 0;
  let hintPenalty = 0;
  let timeBonus = 0;

  for (const r of rounds) {
    if (!r.correct) continue;
    base += r.basePoints;

    if (r.streak && r.streak > 1) {
      streakBonus += Math.min(r.streak - 1, 5) * Math.floor(r.basePoints * 0.2);
    }

    if (r.hintsUsed && r.hintsUsed > 0) {
      hintPenalty += r.hintsUsed * Math.floor(r.basePoints * 0.15);
    }

    if (r.timeMs !== undefined && r.maxTimeMs !== undefined && r.maxTimeMs > 0) {
      const ratio = Math.max(0, 1 - r.timeMs / r.maxTimeMs);
      timeBonus += Math.floor(ratio * r.basePoints * 0.3);
    }
  }

  return {
    total: Math.max(0, base + streakBonus + timeBonus - hintPenalty),
    base,
    streakBonus,
    hintPenalty,
    timeBonus,
  };
}

// ── Job: hash strings (SHA-256) ───────────────────────────────────
async function sha256(input: string): Promise<string> {
  const buffer = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashStrings(inputs: readonly string[]): Promise<string[]> {
  return Promise.all(inputs.map(sha256));
}

// ── Job: particle physics (P2 §10.8 scaffold) ────────────────────
// Offload-candidate integrator — pure function wrapped so CeremonyFX
// and other effect systems can opt in with `useWorkerPhysics={true}`
// once a perf drill + COOP/COEP configuration justifies it. The
// function is a 1:1 wrapper around physicsCore.integrateParticles
// so correctness stays identical across main-thread and worker.
export function integrateParticlesWorker(
  state: Float32Array,
  dt: number,
  forces: ParticleForces,
): { state: Float32Array; expired: number } {
  return integrateParticlesCore(state, dt, forces);
}

// ── Comlink surface ───────────────────────────────────────────────
export const HeavyComputeAPI = {
  filterContentSafety,
  filterContentSafetyBatch,
  computeScoreBreakdown,
  hashStrings,
  integrateParticles: integrateParticlesWorker,
};

export type HeavyComputeAPIType = typeof HeavyComputeAPI;

// Only expose on an actual Worker global. SSR / vitest imports this
// file for type introspection; guarding here avoids a ReferenceError.
if (typeof self !== 'undefined' && typeof (self as typeof self & { postMessage?: unknown }).postMessage === 'function') {
  expose(HeavyComputeAPI);
}
