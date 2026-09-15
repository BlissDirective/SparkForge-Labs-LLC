import { describe, expect, it } from 'vitest';
import {
  armGameLaunchBurst,
  GAME_LAUNCH_BURST_SEEN_KEY,
  readBurstSeen,
  writeBurstSeen,
} from '@/lib/forge-hub/gameLaunchBurst';
import { HUBSPLIT_HOLO_C, LAYOUT_MORPH_MS } from '@/lib/forge-hub/layouts';
import { PORTAL_HOLD_MS } from '@/lib/forge-hub/portalMachine';

const base = {
  poseLock: false,
  flatOverlay: false,
  reducedMotion: false,
  seen: false,
  force: false,
  fromMerge: true,
  mode: 'playStage' as const,
  morphProgress: 1,
};

describe('game-launch-burst session arm', () => {
  it('plays after a just-finished lobby-playstage-merge', () => {
    expect(armGameLaunchBurst(base)).toEqual({ kind: 'play' });
  });

  it('skips auto follow-on under reduced-motion', () => {
    expect(armGameLaunchBurst({ ...base, reducedMotion: true }).kind).toBe(
      'skip',
    );
  });

  it('force-plays under RM so HUD hits the 0ms skip path', () => {
    expect(
      armGameLaunchBurst({ ...base, reducedMotion: true, force: true }).kind,
    ).toBe('play');
  });

  it('holds on EscapeFlat / pose lock', () => {
    expect(armGameLaunchBurst({ ...base, poseLock: true }).kind).toBe('hold');
    expect(armGameLaunchBurst({ ...base, flatOverlay: true }).kind).toBe(
      'hold',
    );
  });

  it('skips if already played this session unless forced', () => {
    expect(armGameLaunchBurst({ ...base, seen: true }).kind).toBe('skip');
    expect(armGameLaunchBurst({ ...base, seen: true, force: true }).kind).toBe(
      'play',
    );
  });

  it('skips when the game is already interactive without a merge', () => {
    expect(
      armGameLaunchBurst({
        ...base,
        fromMerge: false,
        mode: 'playStage',
        morphProgress: 1,
      }).kind,
    ).toBe('skip');
  });

  it('holds HUD-less requests that are not a merge follow-on', () => {
    expect(
      armGameLaunchBurst({
        ...base,
        fromMerge: false,
        mode: 'gameLobby',
        morphProgress: 0,
      }).kind,
    ).toBe('hold');
  });

  it('force-plays from the lab even when not coming from merge', () => {
    expect(
      armGameLaunchBurst({
        ...base,
        force: true,
        fromMerge: false,
        mode: 'hubSplit',
        morphProgress: 0,
      }).kind,
    ).toBe('play');
  });

  it('round-trips the session seen flag', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    };
    expect(readBurstSeen(storage)).toBe(false);
    writeBurstSeen(storage);
    expect(readBurstSeen(storage)).toBe(true);
    expect(mem.get(GAME_LAUNCH_BURST_SEEN_KEY)).toBe('1');
  });

  it('does not retouch Stagehand HoloC or portal holds', () => {
    expect(HUBSPLIT_HOLO_C).toMatchObject({
      left: 31.2,
      top: 24,
      width: 37.6,
      height: 48,
    });
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(PORTAL_HOLD_MS).toEqual({ charge: 420, emit: 560 });
  });
});
