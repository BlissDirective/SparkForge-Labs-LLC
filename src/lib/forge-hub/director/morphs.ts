// ════════════════════════════════════════════════════════════════
// Remaining MOTION_BIBLE interactive morphs (W2 remainder).
// Canonical order: charge → beams → slabs → fade first fifth →
// wipe last fifth → Sparky → sting. One GSAP timeline per id.
// Portal 420/560 is emit-burst only — not nested here.
// ════════════════════════════════════════════════════════════════

import gsap from 'gsap';
import type { ForgeMode } from '@/lib/forge-hub/types';
import { peekDirectorClock } from './clock';
import type { DirectorRemainderId } from './ids';
import type { ForgeStingId } from './stings';
import {
  applySparkyCue,
  cueContextFromIo,
  sparkyCueFor,
} from './sparkyReactions';
import { applyLiveSlotsToClock, snapClockToMode } from './targets';
import {
  bindProgress,
  reducedMotionCrossfade,
  stingIfMotion,
  TL_DEFAULTS,
  type BuiltTimeline,
  type TimelineIo,
} from './timelines';
import {
  BEAMS_MS,
  CAMERA_MICRO_DOLLY,
  INTERACTIVE_CHARGE_MS,
  INTERACTIVE_MORPH_MS,
  LOGIN_SLAB_WINDOW_MS,
  SPARKY_HOP_MS,
  SPARKY_PING_MS,
  SPLIT_SLAB_WINDOW_MS,
  WHISPER_EXPAND_WINDOW_MS,
  msToSec,
} from './timings';

const FOCUS_OUT_DEFAULT: ForgeMode = 'labsBrowse';
const DUAL_EXIT_DEFAULT: ForgeMode = 'hubSplit';
const ANY_FROM_FALLBACK: ForgeMode = 'hubSplit';

export interface LayoutMorphSpec {
  id: DirectorRemainderId;
  from: ForgeMode;
  to: ForgeMode;
  sting: ForgeStingId;
  slabWindowMs?: number;
  chargeAtMs?: number;
  beamsAtMs?: number;
  slabAtMs?: number;
  pingAtMs?: number;
  stingAtMs?: number;
  hop?: boolean;
  roomDim?: { from: number; to: number; atMs: number; durationMs: number };
  destMode?: ForgeMode;
}

function resolveAnyFrom(
  io: TimelineIo,
  dest: ForgeMode,
  fallback: ForgeMode,
): ForgeMode {
  const mode = io.getMode();
  if (mode === dest) return io.getPreviousMode() ?? fallback;
  if (mode === 'flat' || mode === 'cinematic') return fallback;
  return mode;
}

function remainderCue(io: TimelineIo, id: DirectorRemainderId, destMode?: ForgeMode) {
  return sparkyCueFor(
    id,
    cueContextFromIo({ ...io, destMode: destMode ?? null }),
  );
}

export function buildLayoutMorph(
  io: TimelineIo,
  spec: LayoutMorphSpec,
): BuiltTimeline {
  const slabWindowMs = spec.slabWindowMs ?? LOGIN_SLAB_WINDOW_MS;
  const chargeAtMs = spec.chargeAtMs ?? 0;
  const beamsAtMs = spec.beamsAtMs ?? 50;
  const slabAtMs = spec.slabAtMs ?? INTERACTIVE_CHARGE_MS;
  const pingAtMs = spec.pingAtMs ?? 480;
  const stingAtMs = spec.stingAtMs ?? 560;
  const durationMs = INTERACTIVE_MORPH_MS;
  const cue = remainderCue(io, spec.id, spec.destMode ?? spec.to);

  if (io.reducedMotion) {
    return reducedMotionCrossfade(spec.id, io, () => {
      const clock = peekDirectorClock();
      snapClockToMode(clock, spec.to);
      io.setForgeMode(spec.to);
      io.setMorphProgress(1);
      clock.roomDim = spec.roomDim?.to ?? 0;
      clock.bubbleScale = 0;
      applySparkyCue(io, cue.end, cue.endBubble);
    });
  }

  const clock = peekDirectorClock();
  clock.id = spec.id;
  clock.durationMs = durationMs;
  clock.skippable = false;
  clock.freezeBreathe = true;
  clock.appearScale = 1;
  clock.layoutFrom = spec.from;
  clock.layoutTo = spec.to;
  clock.layoutT = 0;
  clock.roomDim = spec.roomDim?.from ?? 0;
  clock.bubbleScale = 0;
  applyLiveSlotsToClock(clock);
  clock.contentOut = 1;
  clock.contentIn = 0;
  clock.bloom = 0;
  clock.beams = 0;
  clock.sparkyPing = 0;
  clock.sparkyHop = 0;
  clock.cameraDollyPercent = 0;
  io.setForgeMode(spec.from);
  io.setMorphProgress(0);
  applySparkyCue(io, cue.start, cue.startBubble);

  const chargeSec = msToSec(INTERACTIVE_CHARGE_MS);
  const beamsStart = msToSec(beamsAtMs);
  const beamsDur = msToSec(BEAMS_MS);
  const slabStart = msToSec(slabAtMs);
  const slabDur = msToSec(slabWindowMs);
  const fadeDur = slabDur / 5;
  const wipeStart = slabStart + slabDur * 0.8;
  const wipeDur = slabDur / 5;
  const pingStart = msToSec(pingAtMs);
  const pingDur = msToSec(SPARKY_PING_MS);
  const stingStart = msToSec(stingAtMs);

  const tl = gsap.timeline({ paused: true, defaults: TL_DEFAULTS });

  tl.to(
    clock,
    { bloom: 1, duration: chargeSec, ease: 'power2.out' },
    msToSec(chargeAtMs),
  );
  tl.to(
    clock,
    { bloom: 0.2, duration: msToSec(40), ease: 'power1.in' },
    msToSec(chargeAtMs) + chargeSec,
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

  if (spec.roomDim) {
    tl.to(
      clock,
      {
        roomDim: spec.roomDim.to,
        duration: msToSec(spec.roomDim.durationMs),
        ease: 'power1.inOut',
      },
      msToSec(spec.roomDim.atMs),
    );
  }

  tl.to(
    clock,
    { sparkyPing: 1, duration: pingDur, ease: 'power2.out' },
    pingStart,
  );

  if (spec.hop && cue.start.spot === cue.end.spot) {
    const hopDur = msToSec(Math.min(SPARKY_HOP_MS, durationMs - pingAtMs));
    tl.to(
      clock,
      { sparkyHop: 1, duration: hopDur / 2, ease: 'power2.out' },
      pingStart,
    );
    tl.to(
      clock,
      { sparkyHop: 0, duration: hopDur / 2, ease: 'power2.in' },
      pingStart + hopDur / 2,
    );
  }

  tl.to(
    clock,
    { cameraDollyPercent: 0, duration: msToSec(40), ease: 'power1.out' },
    stingStart,
  );

  tl.call(
    () => {
      stingIfMotion(io, spec.sting);
      io.setForgeMode(spec.to);
      applySparkyCue(io, cue.end, cue.endBubble);
    },
    [],
    stingStart,
  );

  tl.call(
    () => {
      clock.freezeBreathe = false;
      clock.layoutT = 1;
      clock.roomDim = spec.roomDim?.to ?? clock.roomDim;
      applyLiveSlotsToClock(clock);
    },
    [],
    msToSec(durationMs),
  );

  bindProgress(tl, durationMs, io);
  return { id: spec.id, timeline: tl, durationMs, skippable: false };
}

export function buildWhisperMorph(
  io: TimelineIo,
  kind: 'whisper-expand' | 'whisper-close',
): BuiltTimeline {
  const expand = kind === 'whisper-expand';
  const durationMs = INTERACTIVE_MORPH_MS;
  const startScale = expand ? 0 : 1;
  const endScale = expand ? 1 : 0;
  const startDim = expand ? 0 : 1;
  const endDim = expand ? 1 : 0;
  const sting: ForgeStingId = expand
    ? 'sting.whisperOpen'
    : 'sting.whisperClose';
  const cue = remainderCue(io, kind);

  if (io.reducedMotion) {
    return reducedMotionCrossfade(kind, io, () => {
      const clock = peekDirectorClock();
      const mode = io.getMode() === 'flat' ? 'hubSplit' : io.getMode();
      snapClockToMode(clock, mode);
      io.setMorphProgress(1);
      clock.roomDim = endDim;
      clock.bubbleScale = endScale;
      applySparkyCue(io, cue.end, cue.endBubble);
    });
  }

  const clock = peekDirectorClock();
  const mode = io.getMode() === 'flat' ? 'hubSplit' : io.getMode();
  clock.id = kind;
  clock.durationMs = durationMs;
  clock.skippable = false;
  clock.freezeBreathe = true;
  clock.appearScale = 1;
  snapClockToMode(clock, mode);
  clock.layoutT = 1;
  clock.roomDim = startDim;
  clock.bubbleScale = startScale;
  clock.contentOut = 1;
  clock.contentIn = 0;
  clock.bloom = 0;
  clock.beams = 0;
  clock.sparkyPing = 0;
  clock.sparkyHop = 0;
  clock.cameraDollyPercent = 0;
  io.setMorphProgress(0);
  applySparkyCue(io, cue.start, cue.startBubble);

  const chargeSec = msToSec(INTERACTIVE_CHARGE_MS);
  const expandDur = msToSec(WHISPER_EXPAND_WINDOW_MS);
  const fadeDur = expandDur / 5;
  const wipeStart = msToSec(80) + expandDur * 0.8;

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
    { beams: 1, duration: msToSec(BEAMS_MS), ease: 'power1.out' },
    msToSec(50),
  );
  tl.to(
    clock,
    {
      roomDim: endDim,
      bubbleScale: endScale,
      cameraDollyPercent: CAMERA_MICRO_DOLLY * 0.5,
      duration: expandDur,
      ease: 'power2.inOut',
    },
    msToSec(80),
  );
  tl.to(
    clock,
    { contentOut: 0, duration: fadeDur, ease: 'power1.out' },
    msToSec(80),
  );
  tl.to(
    clock,
    { contentIn: 1, duration: fadeDur, ease: 'power1.in' },
    wipeStart,
  );
  tl.to(
    clock,
    { sparkyPing: 1, duration: msToSec(SPARKY_PING_MS), ease: 'power2.out' },
    msToSec(480),
  );
  tl.to(
    clock,
    { cameraDollyPercent: 0, duration: msToSec(40), ease: 'power1.out' },
    msToSec(560),
  );
  tl.call(
    () => {
      stingIfMotion(io, sting);
      applySparkyCue(io, cue.end, cue.endBubble);
    },
    [],
    msToSec(560),
  );
  tl.call(
    () => {
      clock.freezeBreathe = false;
      clock.bubbleScale = endScale;
      clock.roomDim = endDim;
    },
    [],
    msToSec(durationMs),
  );

  bindProgress(tl, durationMs, io);
  return { id: kind, timeline: tl, durationMs, skippable: false };
}

export function buildRemainderTimeline(
  id: DirectorRemainderId,
  io: TimelineIo,
): BuiltTimeline {
  switch (id) {
    case 'hub-labsbrowse':
      return buildLayoutMorph(io, {
        id,
        from: 'hubSplit',
        to: 'labsBrowse',
        sting: 'sting.hubLabsBrowse',
      });
    case 'labsbrowse-hub':
      return buildLayoutMorph(io, {
        id,
        from: 'labsBrowse',
        to: 'hubSplit',
        sting: 'sting.labsBrowseHub',
      });
    case 'focus-in':
      return buildLayoutMorph(io, {
        id,
        from: resolveAnyFrom(io, 'focus', ANY_FROM_FALLBACK),
        to: 'focus',
        sting: 'sting.focusIn',
      });
    case 'focus-out': {
      const to = io.getPreviousMode() ?? FOCUS_OUT_DEFAULT;
      const dest = to === 'focus' ? FOCUS_OUT_DEFAULT : to;
      return buildLayoutMorph(io, {
        id,
        from: 'focus',
        to: dest,
        destMode: dest,
        sting: 'sting.focusOut',
      });
    }
    case 'dual-enter':
      return buildLayoutMorph(io, {
        id,
        from: resolveAnyFrom(io, 'dual', ANY_FROM_FALLBACK),
        to: 'dual',
        sting: 'sting.dualEnter',
      });
    case 'dual-exit': {
      const to = io.getPreviousMode() ?? DUAL_EXIT_DEFAULT;
      return buildLayoutMorph(io, {
        id,
        from: 'dual',
        to: to === 'dual' ? DUAL_EXIT_DEFAULT : to,
        sting: 'sting.dualExit',
      });
    }
    case 'lobby-playstage-merge':
      return buildLayoutMorph(io, {
        id,
        from: 'gameLobby',
        to: 'playStage',
        sting: 'sting.gameLaunch',
        hop: true,
        roomDim: { from: 0, to: 1, atMs: 400, durationMs: 100 },
      });
    case 'playstage-lobby-split':
      return buildLayoutMorph(io, {
        id,
        from: 'playStage',
        to: 'gameLobby',
        sting: 'sting.lobbyReturn',
        hop: true,
        slabWindowMs: SPLIT_SLAB_WINDOW_MS,
        chargeAtMs: 80,
        beamsAtMs: 130,
        slabAtMs: 160,
        pingAtMs: 460,
        stingAtMs: 540,
        roomDim: { from: 1, to: 0, atMs: 0, durationMs: 80 },
      });
    case 'whisper-expand':
      return buildWhisperMorph(io, 'whisper-expand');
    case 'whisper-close':
      return buildWhisperMorph(io, 'whisper-close');
    default: {
      const never: never = id;
      throw new Error(`Director remainder missing factory for ${never}`);
    }
  }
}
