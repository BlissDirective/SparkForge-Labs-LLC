// ════════════════════════════════════════════════════════════════
// GSAP timeline factories — one timeline per MOTION_BIBLE id.
// Overlapping windows match the bible `t=` ranges (not sequential sums).
// Slab windows use Stagehand LAYOUT_MORPH_MS (420). Portal 420/560 stays.
// ════════════════════════════════════════════════════════════════

import gsap from 'gsap';
import type { PortalPhase } from '@/lib/forge-hub/portalMachine';
import { PORTAL_HOLD_MS } from '@/lib/forge-hub/portalMachine';
import type {
  ForgeHoloBubbleState,
  ForgeMode,
  ForgeSparkyState,
} from '@/lib/forge-hub/types';
import { playForgeSting, type ForgeStingId } from './stings';
import { peekDirectorClock, publishDirectorClock, type DirectorClock } from './clock';
import type { DirectorSlice1Id } from './ids';
import {
  applyIgnitionSample,
  loadTheatreBeat,
  sampleFirstVisitIgnition,
} from './theatrePlayer';
import { applyLiveSlotsToClock, snapClockToMode } from './targets';
import {
  BEAMS_MS,
  CAMERA_MICRO_DOLLY,
  EMIT_BURST_MS,
  FIRST_VISIT_IGNITION_MS,
  INTERACTIVE_CHARGE_MS,
  LOGIN_SLAB_WINDOW_MS,
  LOGIN_SUCCESS_HUBSPLIT_MS,
  REDUCED_MOTION_CROSSFADE_MS,
  SPARKY_HOP_MS,
  SPARKY_PING_MS,
  emitBurstPhaseAt,
  msToSec,
} from './timings';

export interface TimelineIo {
  reducedMotion: boolean;
  getPortalPhase: () => PortalPhase;
  dispatchIgnite: () => void;
  dispatchAdvance: () => void;
  dispatchSkipToDocked: () => void;
  dispatchRetract: () => void;
  setPortalPhase: (phase: PortalPhase) => void;
  setForgeMode: (mode: ForgeMode) => void;
  setMorphProgress: (progress: number) => void;
  patchSparky: (patch: Partial<ForgeSparkyState>) => void;
  patchHoloBubble: (patch: Partial<ForgeHoloBubbleState>) => void;
}

export interface BuiltTimeline {
  id: DirectorSlice1Id;
  timeline: gsap.core.Timeline;
  durationMs: number;
  skippable: boolean;
}

const TL_DEFAULTS = { overwrite: 'auto' as const, ease: 'power2.inOut' };

function syncClock(durationMs: number, io: TimelineIo): void {
  const clock = peekDirectorClock();
  clock.progress = durationMs <= 0 ? 1 : clock.progress;
  if (clock.id === 'first-visit-ignition' && !io.reducedMotion) {
    const timeMs = clock.progress * (durationMs || clock.durationMs);
    applyIgnitionSample(clock, sampleFirstVisitIgnition(timeMs), io);
  }
  clock.cameraDollyPercent = Math.max(
    -CAMERA_MICRO_DOLLY,
    Math.min(CAMERA_MICRO_DOLLY, clock.cameraDollyPercent),
  );
  applyLiveSlotsToClock(clock);
  if (clock.layoutFrom && clock.layoutTo) {
    io.setMorphProgress(clock.layoutT);
  }
  publishDirectorClock();
}

function bindProgress(
  tl: gsap.core.Timeline,
  durationMs: number,
  io: TimelineIo,
): void {
  tl.eventCallback('onUpdate', () => {
    const clock = peekDirectorClock();
    clock.progress = durationMs <= 0 ? 1 : tl.progress();
    syncClock(durationMs, io);
  });
}

export function syncEmitBurstPortal(
  timeMs: number,
  io: TimelineIo,
  mode: 'play' | 'scrub',
): PortalPhase {
  const desired = emitBurstPhaseAt(timeMs);
  if (mode === 'scrub') {
    io.setPortalPhase(desired);
    return desired;
  }
  const current = io.getPortalPhase();
  if (current === desired) return desired;
  if (desired === 'charge') {
    if (current !== 'idle') io.dispatchRetract();
    io.dispatchIgnite();
    return io.getPortalPhase();
  }
  if (desired === 'emit') {
    if (current === 'idle') {
      io.dispatchIgnite();
    }
    if (io.getPortalPhase() === 'charge') io.dispatchAdvance();
    return io.getPortalPhase();
  }
  // docked
  if (current === 'idle') {
    io.dispatchSkipToDocked();
    return io.getPortalPhase();
  }
  if (current === 'charge') {
    io.dispatchAdvance();
  }
  if (io.getPortalPhase() === 'emit') io.dispatchAdvance();
  if (io.getPortalPhase() !== 'docked') io.dispatchSkipToDocked();
  return io.getPortalPhase();
}

function stingIfMotion(io: TimelineIo, id: ForgeStingId): void {
  playForgeSting(id, { reducedMotion: io.reducedMotion });
}

/** MOTION_BIBLE RM: skip cinematic tokens; pose snaps; content 200 ms fade. */
function zeroCinematicTokens(clock: DirectorClock): void {
  clock.sparkyHop = 0;
  clock.sparkyPing = 0;
  clock.bloom = 0;
  clock.beams = 0;
  clock.cameraDollyPercent = 0;
  clock.appearScale = 1;
}

function reducedMotionCrossfade(
  id: DirectorSlice1Id,
  io: TimelineIo,
  snapPose: () => void,
): BuiltTimeline {
  const clock = peekDirectorClock();
  const durationMs = REDUCED_MOTION_CROSSFADE_MS;
  clock.id = id;
  clock.durationMs = durationMs;
  clock.skippable = id === 'emit-burst' || id === 'first-visit-ignition';
  clock.freezeBreathe = true;
  zeroCinematicTokens(clock);
  clock.reducedMotionCrossfade = 0;
  clock.contentOut = 1;
  clock.contentIn = 0;
  // Pose / reducer snap is synchronous so paused + scrub(0) tests (and
  // pause(0, suppressEvents) at play) already sit on the destination.
  snapPose();

  const tl = gsap.timeline({
    paused: true,
    defaults: TL_DEFAULTS,
  });
  tl.to(
    clock,
    {
      reducedMotionCrossfade: 1,
      contentOut: 0,
      contentIn: 1,
      duration: msToSec(durationMs),
      ease: 'none',
    },
    0,
  );
  tl.call(
    () => {
      zeroCinematicTokens(clock);
      clock.freezeBreathe = true;
    },
    [],
    msToSec(durationMs),
  );
  bindProgress(tl, durationMs, io);
  return { id, timeline: tl, durationMs, skippable: clock.skippable };
}

export function buildWelcomeIdle(io: TimelineIo): BuiltTimeline {
  const clock = peekDirectorClock();
  clock.id = 'welcome-idle';
  clock.durationMs = 0;
  clock.skippable = false;
  clock.freezeBreathe = io.reducedMotion;
  clock.progress = 1;
  zeroCinematicTokens(clock);
  clock.contentOut = 0;
  clock.contentIn = 1;
  clock.reducedMotionCrossfade = io.reducedMotion ? 1 : 0;
  snapClockToMode(clock, 'welcome');
  io.setForgeMode('welcome');
  io.setMorphProgress(0);
  publishDirectorClock();

  const tl = gsap.timeline({ paused: true, defaults: TL_DEFAULTS });
  // Ambient coordinator only — Stagehand owns panelBreathe. Zero-length
  // timeline so overwrite still has a handle to kill.
  tl.set(clock, { progress: 1 }, 0);
  bindProgress(tl, 0, io);
  return {
    id: 'welcome-idle',
    timeline: tl,
    durationMs: 0,
    skippable: false,
  };
}

export function buildEmitBurst(io: TimelineIo): BuiltTimeline {
  if (io.reducedMotion) {
    return reducedMotionCrossfade('emit-burst', io, () => {
      io.dispatchSkipToDocked();
    });
  }

  const clock = peekDirectorClock();
  const durationMs = EMIT_BURST_MS;
  clock.id = 'emit-burst';
  clock.durationMs = durationMs;
  clock.skippable = true;
  clock.freezeBreathe = false;
  clock.bloom = 0;
  clock.sparkyHop = 0;
  clock.cameraDollyPercent = 0;
  clock.contentOut = 1;
  clock.contentIn = 0;
  clock.appearScale = 1;
  clock.layoutFrom = null;
  clock.layoutTo = null;

  const chargeSec = msToSec(PORTAL_HOLD_MS.charge);
  const emitSec = msToSec(PORTAL_HOLD_MS.emit);
  const hopSec = msToSec(SPARKY_HOP_MS);
  const stingAt = chargeSec;

  const tl = gsap.timeline({ paused: true, defaults: TL_DEFAULTS });

  tl.call(() => {
    syncEmitBurstPortal(0, io, 'play');
  }, [], 0);

  tl.to(
    clock,
    {
      bloom: 1,
      cameraDollyPercent: CAMERA_MICRO_DOLLY,
      duration: chargeSec,
      ease: 'power2.in',
    },
    0,
  );

  tl.call(() => {
    syncEmitBurstPortal(PORTAL_HOLD_MS.charge, io, 'play');
    stingIfMotion(io, 'sting.emitBurst');
    return undefined;
  }, [], stingAt);

  tl.to(
    clock,
    {
      sparkyHop: 1,
      duration: hopSec / 2,
      ease: 'power2.out',
    },
    chargeSec,
  );
  tl.to(
    clock,
    {
      sparkyHop: 0,
      duration: hopSec / 2,
      ease: 'power2.in',
    },
    chargeSec + hopSec / 2,
  );

  tl.to(
    clock,
    {
      bloom: 0.45,
      cameraDollyPercent: 0,
      duration: emitSec,
      ease: 'power1.out',
    },
    chargeSec,
  );

  tl.call(() => {
    syncEmitBurstPortal(EMIT_BURST_MS, io, 'play');
    clock.freezeBreathe = false;
  }, [], msToSec(durationMs));

  bindProgress(tl, durationMs, io);
  return { id: 'emit-burst', timeline: tl, durationMs, skippable: true };
}

export function buildLoginSuccessHubsplit(io: TimelineIo): BuiltTimeline {
  if (io.reducedMotion) {
    return reducedMotionCrossfade('login-success-hubsplit', io, () => {
      const clock = peekDirectorClock();
      snapClockToMode(clock, 'hubSplit');
      io.setForgeMode('hubSplit');
      // Pose snaps; fifths are skipped. Content fades via contentIn.
      io.setMorphProgress(1);
    });
  }

  const clock = peekDirectorClock();
  const durationMs = LOGIN_SUCCESS_HUBSPLIT_MS;
  clock.id = 'login-success-hubsplit';
  clock.durationMs = durationMs;
  clock.skippable = false;
  clock.freezeBreathe = true;
  clock.appearScale = 1;
  clock.layoutFrom = 'welcome';
  clock.layoutTo = 'hubSplit';
  clock.layoutT = 0;
  applyLiveSlotsToClock(clock);
  clock.contentOut = 1;
  clock.contentIn = 0;
  clock.bloom = 0;
  clock.beams = 0;
  clock.sparkyPing = 0;
  clock.cameraDollyPercent = 0;
  io.setForgeMode('welcome');
  io.setMorphProgress(0);

  const chargeSec = msToSec(INTERACTIVE_CHARGE_MS);
  const beamsStart = msToSec(50);
  const beamsDur = msToSec(BEAMS_MS);
  const slabStart = msToSec(INTERACTIVE_CHARGE_MS);
  const slabDur = msToSec(LOGIN_SLAB_WINDOW_MS);
  const fadeDur = slabDur / 5;
  const wipeStart = slabStart + slabDur * 0.8;
  const wipeDur = slabDur / 5;
  const pingStart = msToSec(480);
  const pingDur = msToSec(SPARKY_PING_MS);
  const stingStart = msToSec(560);

  const tl = gsap.timeline({ paused: true, defaults: TL_DEFAULTS });

  tl.to(
    clock,
    { bloom: 1, duration: chargeSec, ease: 'power2.out' },
    0,
  );
  tl.to(
    clock,
    { bloom: 0.2, duration: msToSec(40), ease: 'power1.in' },
    chargeSec,
  );

  tl.to(
    clock,
    { beams: 1, duration: beamsDur, ease: 'power1.out' },
    beamsStart,
  );

  tl.to(
    clock,
    {
      layoutT: 1,
      cameraDollyPercent: CAMERA_MICRO_DOLLY * 0.5,
      duration: slabDur,
      ease: 'power2.inOut',
    },
    slabStart,
  );

  tl.to(
    clock,
    { contentOut: 0, duration: fadeDur, ease: 'power1.out' },
    slabStart,
  );
  tl.to(
    clock,
    { contentIn: 1, duration: wipeDur, ease: 'power1.in' },
    wipeStart,
  );

  tl.to(
    clock,
    { sparkyPing: 1, duration: pingDur, ease: 'power2.out' },
    pingStart,
  );

  tl.to(
    clock,
    { cameraDollyPercent: 0, duration: msToSec(40), ease: 'power1.out' },
    msToSec(560),
  );

  tl.call(
    () => {
      stingIfMotion(io, 'sting.loginSuccess');
      io.setForgeMode('hubSplit');
    },
    [],
    stingStart,
  );

  tl.call(
    () => {
      clock.freezeBreathe = false;
      clock.layoutT = 1;
      applyLiveSlotsToClock(clock);
    },
    [],
    msToSec(durationMs),
  );

  bindProgress(tl, durationMs, io);
  return {
    id: 'login-success-hubsplit',
    timeline: tl,
    durationMs,
    skippable: false,
  };
}

export function buildFirstVisitIgnition(io: TimelineIo): BuiltTimeline {
  // Skip the Theatre cinematic entirely under RM (bible: skip beat + 200 ms).
  if (io.reducedMotion) {
    return reducedMotionCrossfade('first-visit-ignition', io, () => {
      const live = peekDirectorClock();
      snapClockToMode(live, 'welcome');
      io.setForgeMode('welcome');
      io.setMorphProgress(1);
      io.patchSparky({ spot: 'nearCore', behaviour: 'idle' });
      io.patchHoloBubble({ state: 'hidden' });
    });
  }

  const beat = loadTheatreBeat('first-visit-ignition');

  const clock = peekDirectorClock();
  const durationMs = beat.durationMs || FIRST_VISIT_IGNITION_MS;
  const stingAt = beat.stingAtMs ?? 1400;
  clock.id = 'first-visit-ignition';
  clock.durationMs = durationMs;
  clock.skippable = true;
  clock.freezeBreathe = true;
  // Cinematic settle-from-empty — rects are Stagehand welcome (HoloC live seat).
  snapClockToMode(clock, 'welcome');
  io.setForgeMode('cinematic');
  io.setMorphProgress(0);
  applyIgnitionSample(clock, sampleFirstVisitIgnition(0), io);

  const cursor = { t: 0 };
  const tl = gsap.timeline({ paused: true, defaults: TL_DEFAULTS });
  tl.to(
    cursor,
    { t: 1, duration: msToSec(durationMs), ease: 'none' },
    0,
  );

  tl.call(() => {
    stingIfMotion(io, 'sting.ignition');
  }, [], msToSec(stingAt));

  tl.call(
    () => {
      applyIgnitionSample(clock, sampleFirstVisitIgnition(durationMs), io);
      clock.cameraDollyPercent = 0;
      clock.freezeBreathe = false;
      clock.appearScale = 1;
      clock.contentIn = 1;
      clock.contentOut = 0;
      io.setForgeMode('welcome');
      io.patchSparky({ spot: 'nearCore', behaviour: 'idle' });
    },
    [],
    msToSec(durationMs),
  );

  bindProgress(tl, durationMs, io);
  return {
    id: 'first-visit-ignition',
    timeline: tl,
    durationMs,
    skippable: true,
  };
}

export function buildSlice1Timeline(
  id: DirectorSlice1Id,
  io: TimelineIo,
): BuiltTimeline {
  switch (id) {
    case 'welcome-idle':
      return buildWelcomeIdle(io);
    case 'emit-burst':
      return buildEmitBurst(io);
    case 'login-success-hubsplit':
      return buildLoginSuccessHubsplit(io);
    case 'first-visit-ignition':
      return buildFirstVisitIgnition(io);
    default: {
      const never: never = id;
      throw new Error(`Director slice 1 missing factory for ${never}`);
    }
  }
}
