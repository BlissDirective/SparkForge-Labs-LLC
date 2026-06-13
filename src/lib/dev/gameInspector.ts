// ════════════════════════════════════════════════════════════════════════
// GAME INSPECTOR — dev-only state hook for the Playwright iteration loop
// ════════════════════════════════════════════════════════════════════════
// Fable-Frontend-Enhancement.md Phase A item 3 + §2.3 (the canvas caveat).
//
// Playwright MCP's accessibility-tree snapshots see *nothing* inside a
// Pixi/Phaser/R3F canvas. So in dev builds we mirror game state onto
// `window.__SPARKFORGE_GAME__`, letting Claude assert state textually while
// judging visuals from screenshots. This is stripped from production.
//
// Usage:
//   • GameShell publishes the shell snapshot (gameId, score, round, …).
//   • A canvas scene publishes its own state via publishScene({ … }).
//   • Playwright reads it with: () => window.__SPARKFORGE_GAME__

export interface GameInspectorSnapshot {
  gameId: string | null;
  title: string | null;
  labNumber?: number;
  score: number;
  currentRound: number;
  isComplete: boolean;
  /** Scene-specific state pushed by the active canvas (Pixi/Phaser/R3F). */
  scene: Record<string, unknown>;
  /** Epoch ms of the last update — lets Playwright wait for a fresh frame. */
  updatedAt: number;
}

declare global {
  interface Window {
    __SPARKFORGE_GAME__?: GameInspectorSnapshot;
  }
}

const isDev = process.env.NODE_ENV !== 'production';

function base(): GameInspectorSnapshot {
  return {
    gameId: null,
    title: null,
    score: 0,
    currentRound: 0,
    isComplete: false,
    scene: {},
    updatedAt: 0,
  };
}

/** Merge a partial snapshot onto the global. No-op outside dev / SSR. */
export function publishGameSnapshot(partial: Partial<GameInspectorSnapshot>): void {
  if (!isDev || typeof window === 'undefined') return;
  const prev = window.__SPARKFORGE_GAME__ ?? base();
  window.__SPARKFORGE_GAME__ = {
    ...prev,
    ...partial,
    scene: partial.scene ? { ...prev.scene, ...partial.scene } : prev.scene,
    updatedAt: Date.now(),
  };
}

/** Convenience: publish (or merge) scene-specific state from a canvas. */
export function publishScene(scene: Record<string, unknown>): void {
  publishGameSnapshot({ scene });
}

/** Reset the global when a game unmounts so stale state isn't read. */
export function clearGameSnapshot(): void {
  if (!isDev || typeof window === 'undefined') return;
  delete window.__SPARKFORGE_GAME__;
}
