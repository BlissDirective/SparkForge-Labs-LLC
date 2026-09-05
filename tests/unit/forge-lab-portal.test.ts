import { describe, expect, it } from 'vitest';
import {
  isHudLit,
  isPortalOpen,
  nextHoldMs,
  reducePortal,
  type PortalPhase,
} from '@/lib/forge-lab/portalMachine';

describe('Forge Lab portal machine', () => {
  it('walks idle → charge → emit → docked', () => {
    let phase: PortalPhase = 'idle';
    phase = reducePortal(phase, { type: 'IGNITE' });
    expect(phase).toBe('charge');
    phase = reducePortal(phase, { type: 'ADVANCE' });
    expect(phase).toBe('emit');
    phase = reducePortal(phase, { type: 'ADVANCE' });
    expect(phase).toBe('docked');
  });

  it('skips motion and jumps to docked', () => {
    expect(reducePortal('idle', { type: 'SKIP_TO_DOCKED' })).toBe('docked');
  });

  it('retracts from any open phase back to idle', () => {
    expect(reducePortal('charge', { type: 'RETRACT' })).toBe('idle');
    expect(reducePortal('docked', { type: 'RETRACT' })).toBe('idle');
  });

  it('does not ignite again while already charging', () => {
    expect(reducePortal('charge', { type: 'IGNITE' })).toBe('charge');
  });

  it('keeps the top HUD lit in every phase; panels open on emit', () => {
    expect(isHudLit('idle')).toBe(true);
    expect(isHudLit('charge')).toBe(true);
    expect(isPortalOpen('idle')).toBe(false);
    expect(isHudLit('emit')).toBe(true);
    expect(isPortalOpen('docked')).toBe(true);
    expect(nextHoldMs('charge')).toBe(420);
    expect(nextHoldMs('docked')).toBeNull();
  });
});
