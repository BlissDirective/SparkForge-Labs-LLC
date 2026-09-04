// ════════════════════════════════════════════════════════════════
// Forge Lab portal — idle → charge → emit → docked
// ════════════════════════════════════════════════════════════════
// Pure reducer so tests do not need XState. Timings match the
// attached keyframe stills. Reduced-motion callers send SKIP_TO_DOCKED
// instead of IGNITE so charge/emit never play.

export type PortalPhase = 'idle' | 'charge' | 'emit' | 'docked';

export type PortalEvent =
  | { type: 'IGNITE' }
  | { type: 'ADVANCE' }
  | { type: 'RETRACT' }
  | { type: 'SKIP_TO_DOCKED' };

export const PORTAL_PHASES: readonly PortalPhase[] = [
  'idle',
  'charge',
  'emit',
  'docked',
] as const;

/** Charge / emit holds — Chromebook-safe, under 600ms each. */
export const PORTAL_HOLD_MS: Record<Extract<PortalPhase, 'charge' | 'emit'>, number> = {
  charge: 420,
  emit: 560,
};

export function reducePortal(phase: PortalPhase, event: PortalEvent): PortalPhase {
  switch (event.type) {
    case 'IGNITE':
      return phase === 'idle' ? 'charge' : phase;
    case 'ADVANCE':
      if (phase === 'charge') return 'emit';
      if (phase === 'emit') return 'docked';
      return phase;
    case 'RETRACT':
      return phase === 'idle' ? 'idle' : 'idle';
    case 'SKIP_TO_DOCKED':
      return 'docked';
    default:
      return phase;
  }
}

export function isPortalOpen(phase: PortalPhase): boolean {
  return phase === 'emit' || phase === 'docked';
}

export function isHudLit(phase: PortalPhase): boolean {
  return phase === 'emit' || phase === 'docked';
}

export function nextHoldMs(phase: PortalPhase): number | null {
  if (phase === 'charge') return PORTAL_HOLD_MS.charge;
  if (phase === 'emit') return PORTAL_HOLD_MS.emit;
  return null;
}
