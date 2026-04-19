// ════════════════════════════════════════════════════
// GAME XP CONFIG — server-authoritative (API-HIGH-003 Option C)
//
// Single source of truth for how much XP each game awards on
// completion. Previously the client passed `xpReward` to GameShell
// and forwarded it to /api/gamification/xp, which trusted whatever
// amount it received. That meant a tampered client could forge
// arbitrary XP awards (up to the request-level 500 cap) and grind
// levels by replaying the mutation.
//
// With the server-authoritative flow:
//   1. The client POSTs `{ childId, source: 'game', gameId }` —
//      no `amount` field.
//   2. This module provides the canonical `xp = getGameXP(gameId)`
//      and the `DAILY_XP_CAP` used to clamp total daily awards.
//   3. The server-computed amount is then multiplied by the streak
//      multiplier and stamped onto the child row.
//
// Values below were audited against the `xpReward={N}` literals
// previously passed to GameShell by each of the 35 game components
// (see A-003 audit, April 2026). Any game not in the map falls back
// to DEFAULT_GAME_XP. When adding a new game, add it here too; the
// default is a deliberate safety net, not an excuse to skip the map.
// ════════════════════════════════════════════════════

/** Fallback reward for any gameId not explicitly listed below. */
export const DEFAULT_GAME_XP = 50;

/** Cap per child per calendar day (after streak multipliers). */
export const DAILY_XP_CAP = 10000;

/**
 * Absolute maximum the /api/gamification/xp endpoint will ever credit
 * in a single request for non-game sources (lessons, quizzes, spark
 * facts). Matches the historical AwardXPSchema.amount.max(500).
 */
export const MAX_NON_GAME_AWARD = 500;

/**
 * Canonical per-game XP reward. Values mirror the previous client
 * `xpReward={N}` literal for each of the 35 games. Anything not
 * listed here defaults to DEFAULT_GAME_XP (50) — the majority case.
 */
export const GAME_XP_REWARDS: Readonly<Record<string, number>> = Object.freeze({
  // ─── Lower rewards (explicit in the previous client code) ──────
  'fool-the-ai': 20,
  'pixel-investigator': 20,
  'ai-or-not': 25,
  'camera-quest': 25,
  'emoji-decoder': 25,
  'robot-vacuum': 25,
  'my-first-ai-app': 30,
  'pet-trainer': 30,
  // ─── Default 50 (omitted; resolved via getGameXP fallback) ─────
});

/** Look up canonical XP for a game id. Safe for unknown ids. */
export function getGameXP(gameId: string | undefined | null): number {
  if (!gameId) return DEFAULT_GAME_XP;
  return GAME_XP_REWARDS[gameId] ?? DEFAULT_GAME_XP;
}
