// ════════════════════════════════════════════════════════════════
// Theatre.js beat player — first-visit-ignition + game-launch-burst.
// GSAP is the master clock (W2-05 scrubber). This module samples the
// committed JSON onto the Director clock. Studio loads only on
// /dev/forge-hub?studio=1 in development (TAP §2.6 / bible §5.4 / §5.8).
// ════════════════════════════════════════════════════════════════

import type { MotionBibleId } from './ids';
import ignitionBeat from '@/lib/forge-hub/beats/first-visit-ignition.json';
import burstBeat from '@/lib/forge-hub/beats/game-launch-burst.json';
import {
  CAMERA_MICRO_DOLLY,
  FIRST_VISIT_IGNITION_MS,
  GAME_LAUNCH_BURST_MS,
} from './timings';
import type { ForgeHoloBubbleState, ForgeSparkyState } from '@/lib/forge-hub/types';
import type { DirectorClock } from './clock';

/** Store writes used by Theatre samples — subset of TimelineIo. */
export interface IgnitionStoreIo {
  patchSparky: (patch: Partial<ForgeSparkyState>) => void;
  patchHoloBubble: (patch: Partial<ForgeHoloBubbleState>) => void;
}

export type BurstStoreIo = IgnitionStoreIo;

export interface TheatreKeyframe {
  t: number;
  v: number;
}

export type TheatreTrackName =
  | 'bloom'
  | 'cameraDollyPercent'
  | 'appearScale'
  | 'contentOut'
  | 'contentIn'
  | 'sparkyPing'
  | 'sparkyHop';

export interface TheatreTracks {
  bloom: TheatreKeyframe[];
  cameraDollyPercent: TheatreKeyframe[];
  appearScale: TheatreKeyframe[];
  contentOut: TheatreKeyframe[];
  contentIn: TheatreKeyframe[];
  sparkyPing: TheatreKeyframe[];
  sparkyHop?: TheatreKeyframe[];
}

export type TheatreBeatId = 'first-visit-ignition' | 'game-launch-burst';

export interface TheatreBeatManifest {
  id: MotionBibleId;
  status: 'stub' | 'authored';
  runtime: 'theatre.js';
  durationMs: number;
  skipTo: MotionBibleId;
  project?: string;
  sheet?: string;
  object?: string;
  stingAtMs?: number;
  notes?: string;
  tracks?: TheatreTracks;
  theatreState?: unknown;
}

export interface IgnitionSample {
  bloom: number;
  cameraDollyPercent: number;
  appearScale: number;
  contentOut: number;
  contentIn: number;
  sparkyPing: number;
  sting: boolean;
}

export interface BurstSample {
  bloom: number;
  cameraDollyPercent: number;
  appearScale: number;
  contentOut: number;
  contentIn: number;
  sparkyPing: number;
  sparkyHop: number;
  sting: boolean;
}

const MANIFESTS: Record<TheatreBeatId, TheatreBeatManifest> = {
  'first-visit-ignition': ignitionBeat as TheatreBeatManifest,
  'game-launch-burst': burstBeat as TheatreBeatManifest,
};

function durationFallback(id: TheatreBeatId): number {
  return id === 'game-launch-burst'
    ? GAME_LAUNCH_BURST_MS
    : FIRST_VISIT_IGNITION_MS;
}

export function loadTheatreBeat(id: TheatreBeatId): TheatreBeatManifest {
  const beat = MANIFESTS[id];
  return {
    ...beat,
    durationMs: beat.durationMs || durationFallback(id),
  };
}

export function sampleTrack(
  frames: readonly TheatreKeyframe[] | undefined,
  timeMs: number,
  fallback = 0,
): number {
  if (!frames || frames.length === 0) return fallback;
  if (timeMs <= frames[0]!.t) return frames[0]!.v;
  const last = frames[frames.length - 1]!;
  if (timeMs >= last.t) return last.v;
  for (let i = 0; i < frames.length - 1; i += 1) {
    const a = frames[i]!;
    const b = frames[i + 1]!;
    if (timeMs <= b.t) {
      const span = b.t - a.t;
      const u = span <= 0 ? 1 : (timeMs - a.t) / span;
      return a.v + (b.v - a.v) * u;
    }
  }
  return last.v;
}

function clampDolly(dolly: number): number {
  return Math.max(-CAMERA_MICRO_DOLLY, Math.min(CAMERA_MICRO_DOLLY, dolly));
}

export function sampleFirstVisitIgnition(timeMs: number): IgnitionSample {
  const beat = loadTheatreBeat('first-visit-ignition');
  const t = Math.min(Math.max(0, timeMs), beat.durationMs);
  const tracks = beat.tracks;
  const stingAt = beat.stingAtMs ?? 1400;
  return {
    bloom: sampleTrack(tracks?.bloom, t, 0),
    cameraDollyPercent: clampDolly(sampleTrack(tracks?.cameraDollyPercent, t, 0)),
    appearScale: sampleTrack(tracks?.appearScale, t, 0),
    contentOut: sampleTrack(tracks?.contentOut, t, 1),
    contentIn: sampleTrack(tracks?.contentIn, t, 0),
    sparkyPing: sampleTrack(tracks?.sparkyPing, t, 0),
    sting: t >= stingAt,
  };
}

export function sampleGameLaunchBurst(timeMs: number): BurstSample {
  const beat = loadTheatreBeat('game-launch-burst');
  const t = Math.min(Math.max(0, timeMs), beat.durationMs);
  const tracks = beat.tracks;
  const stingAt = beat.stingAtMs ?? 200;
  return {
    bloom: sampleTrack(tracks?.bloom, t, 0),
    cameraDollyPercent: clampDolly(sampleTrack(tracks?.cameraDollyPercent, t, 0)),
    appearScale: sampleTrack(tracks?.appearScale, t, 1),
    contentOut: sampleTrack(tracks?.contentOut, t, 0),
    contentIn: sampleTrack(tracks?.contentIn, t, 1),
    sparkyPing: sampleTrack(tracks?.sparkyPing, t, 0),
    sparkyHop: sampleTrack(tracks?.sparkyHop, t, 0),
    sting: t >= stingAt,
  };
}

/** Write a sampled ignition frame onto the GSAP clock + forge slice. */
export function applyIgnitionSample(
  clock: DirectorClock,
  sample: IgnitionSample,
  io: IgnitionStoreIo,
): void {
  clock.bloom = sample.bloom;
  clock.cameraDollyPercent = sample.cameraDollyPercent;
  clock.appearScale = sample.appearScale;
  clock.contentOut = sample.contentOut;
  clock.contentIn = sample.contentIn;
  clock.sparkyPing = sample.sparkyPing;
  clock.sparkyHop = 0;
  clock.beams = 0;

  // Wave window (t ≥ 1100): Sparky nearCore + optional HoloBubble tip.
  // Smith clip `ignition.wave` is a later request; v1 uses sparkyPing.
  if (sample.sparkyPing > 0.02) {
    io.patchSparky({ spot: 'nearCore', behaviour: 'react' });
    io.patchHoloBubble({ state: 'tip' });
  } else if (sample.appearScale >= 0.999 && sample.contentIn >= 0.999) {
    io.patchSparky({ spot: 'nearCore', behaviour: 'idle' });
    io.patchHoloBubble({ state: 'hidden' });
  } else {
    io.patchSparky({ spot: 'nearCore', behaviour: 'attend' });
    io.patchHoloBubble({ state: 'hidden' });
  }
}

/**
 * Cheer burst on already-merged PlayStage. Does not retarget portal
 * 420/560. Smith clip `cheer` is a later request; v1 uses sparkyPing + hop.
 */
export function applyBurstSample(
  clock: DirectorClock,
  sample: BurstSample,
  io: BurstStoreIo,
): void {
  clock.bloom = sample.bloom;
  clock.cameraDollyPercent = sample.cameraDollyPercent;
  clock.appearScale = sample.appearScale;
  clock.contentOut = sample.contentOut;
  clock.contentIn = sample.contentIn;
  clock.sparkyPing = sample.sparkyPing;
  clock.sparkyHop = sample.sparkyHop;
  clock.beams = 0;
  clock.roomDim = 1;

  if (sample.sparkyPing > 0.02 || sample.sparkyHop > 0.02) {
    io.patchSparky({ spot: 'rightLip', behaviour: 'react' });
    io.patchHoloBubble({ state: 'ping' });
  } else {
    io.patchSparky({ spot: 'rightLip', behaviour: 'attend' });
    io.patchHoloBubble({ state: 'hidden' });
  }
}

/**
 * Studio overlay is /dev/forge-hub?studio=1 in development only.
 * Production never loads the studio bundle (dynamic import is skipped).
 */
export async function maybeLoadForgeTheatreStudio(
  enabled: boolean,
): Promise<'skipped' | 'loaded'> {
  if (!enabled) return 'skipped';
  if (process.env.NODE_ENV === 'production') return 'skipped';
  if (typeof window === 'undefined') return 'skipped';
  try {
    const [{ default: studio }, { getProject, types }] = await Promise.all([
      import('@theatre/studio'),
      import('@theatre/core'),
    ]);
    studio.initialize();
    const beats: TheatreBeatId[] = ['first-visit-ignition', 'game-launch-burst'];
    for (const id of beats) {
      const beat = loadTheatreBeat(id);
      const project = getProject(
        beat.project ?? 'SparkForgeForgeHub',
        beat.theatreState ? { state: beat.theatreState as never } : undefined,
      );
      const sheet = project.sheet(beat.sheet ?? id);
      if (id === 'game-launch-burst') {
        sheet.object(beat.object ?? 'burst', {
          bloom: types.number(0, { range: [0, 1] }),
          cameraDollyPercent: types.number(0, {
            range: [-CAMERA_MICRO_DOLLY, CAMERA_MICRO_DOLLY],
          }),
          appearScale: types.number(1, { range: [0, 1] }),
          contentOut: types.number(0, { range: [0, 1] }),
          contentIn: types.number(1, { range: [0, 1] }),
          sparkyPing: types.number(0, { range: [0, 1] }),
          sparkyHop: types.number(0, { range: [0, 1] }),
        });
      } else {
        sheet.object(beat.object ?? 'ignition', {
          bloom: types.number(0, { range: [0, 1] }),
          cameraDollyPercent: types.number(0, {
            range: [-CAMERA_MICRO_DOLLY, CAMERA_MICRO_DOLLY],
          }),
          appearScale: types.number(0, { range: [0, 1] }),
          contentOut: types.number(1, { range: [0, 1] }),
          contentIn: types.number(0, { range: [0, 1] }),
          sparkyPing: types.number(0, { range: [0, 1] }),
        });
      }
    }
    return 'loaded';
  } catch {
    return 'skipped';
  }
}
