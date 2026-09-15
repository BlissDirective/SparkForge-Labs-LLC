// ════════════════════════════════════════════════════════════════
// HoloBubble projection bus — not a Zustand store.
// PlaceholderSparky publishes the live `socket.holoBubble` world
// point; ForgeSlotProjector writes CSS pixels from the live camera.
// Poster / no-canvas path falls back to projectWorldPoint.
// ════════════════════════════════════════════════════════════════

export interface HoloBubbleScreen {
  x: number;
  y: number;
  visible: boolean;
}

let world: readonly [number, number, number] | null = null;
let screen: HoloBubbleScreen | null = null;

export function publishHoloBubbleWorld(
  point: readonly [number, number, number] | null,
): void {
  world = point;
}

export function getHoloBubbleWorld(): readonly [number, number, number] | null {
  return world;
}

export function publishHoloBubbleScreen(point: HoloBubbleScreen | null): void {
  screen = point;
}

export function getHoloBubbleScreen(): HoloBubbleScreen | null {
  return screen;
}

/** Test helper — not used at runtime. */
export function resetHoloBubbleAnchorForTests(): void {
  world = null;
  screen = null;
}
