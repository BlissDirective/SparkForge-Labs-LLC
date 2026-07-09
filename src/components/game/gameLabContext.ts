'use client';

// ════════════════════════════════════════════════════════════════
// gameLabContext — GameShell → nested framework lab-id channel (G5)
// ════════════════════════════════════════════════════════════════
// GameShell already knows every game's lab number. Rather than thread
// `labId` through 26 GameLevelSystem call sites, GameShell publishes it
// here and GameLevelSystem reads it as a fallback — so the invisible
// adaptive nudge lights up for every level-based game with no per-game
// change. An explicit `labId` prop still wins when a game passes one.

import { createContext, useContext } from 'react';

/** Current game's lab id (1–11), or null outside a GameShell. */
export const GameLabContext = createContext<number | null>(null);

export function useGameLab(): number | null {
  return useContext(GameLabContext);
}
