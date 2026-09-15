// ════════════════════════════════════════════════════════════════
// Forge Hub Director — sole owner of MOTION_BIBLE transition timelines.
// GSAP at runtime; Theatre.js JSON via theatrePlayer (authored ignition).
// One interruptible timeline per play(); overwrite kills the previous.
// ════════════════════════════════════════════════════════════════

import gsap from 'gsap';
import { useForgeStore } from '@/stores/sceneStore';
import {
  peekDirectorClock,
  publishDirectorClock,
  resetDirectorClock,
  setDirectorClockId,
} from './director/clock';
import {
  CINEMATIC_IDS,
  DIRECTOR_LIVE_IDS,
  DIRECTOR_SLICE1_IDS,
  isCinematicId,
  isDirectorLiveId,
  isDirectorSlice1Id,
  isMotionBibleId,
  type DirectorLiveId,
  type DirectorRemainderId,
  type DirectorSlice1Id,
  type MotionBibleId,
} from './director/ids';
import {
  CINEMATIC_CAP_MS,
  INTERACTIVE_CAP_MS,
  REDUCED_MOTION_CROSSFADE_MS,
} from './director/timings';
import { buildRemainderTimeline } from './director/morphs';
import {
  buildSlice1Timeline,
  syncEmitBurstPortal,
  type BuiltTimeline,
  type TimelineIo,
} from './director/timelines';
import {
  applyIgnitionSample,
  sampleFirstVisitIgnition,
} from './director/theatrePlayer';

export type { MotionBibleId, DirectorSlice1Id, DirectorLiveId, DirectorRemainderId };
export type { DirectorClock } from './director/clock';

export interface PlayOptions {
  reducedMotion?: boolean;
  /** Tests: build paused and scrub. Runtime defaults to playing. */
  paused?: boolean;
}

export interface ForgeDirector {
  play(id: MotionBibleId, opts?: PlayOptions): gsap.core.Timeline;
  kill(): void;
  skip(): void;
  /** Scrub the active (or last built) timeline. Progress 0..1. */
  scrub(progress: number): void;
  progress(): number;
  durationMs(): number;
  activeId(): MotionBibleId | null;
  isPlaying(): boolean;
  registeredIds(): readonly DirectorLiveId[];
}

function storeIo(reducedMotion: boolean): TimelineIo {
  const store = () => useForgeStore.getState();
  return {
    reducedMotion,
    getPortalPhase: () => store().forge.portalPhase,
    dispatchIgnite: () => store().dispatchForgePortal({ type: 'IGNITE' }),
    dispatchAdvance: () => store().dispatchForgePortal({ type: 'ADVANCE' }),
    dispatchSkipToDocked: () =>
      store().dispatchForgePortal({ type: 'SKIP_TO_DOCKED' }),
    dispatchRetract: () => store().dispatchForgePortal({ type: 'RETRACT' }),
    setPortalPhase: (portalPhase) => store().setForgePortalPhase(portalPhase),
    setForgeMode: (mode) => store().setForgeMode(mode),
    setMorphProgress: (morphProgress) =>
      store().setForgeMorphProgress(morphProgress),
    patchSparky: (patch) => store().patchForgeSparky(patch),
    patchHoloBubble: (patch) => store().patchForgeHoloBubble(patch),
    getMode: () => store().forge.mode,
    getPreviousMode: () => store().forge.previousMode,
  };
}

function setStoreDirectorId(id: MotionBibleId | null): void {
  useForgeStore.getState().setForgeDirectorId(id);
}

class ForgeDirectorImpl implements ForgeDirector {
  private current: BuiltTimeline | null = null;
  private io: TimelineIo | null = null;

  registeredIds(): readonly DirectorLiveId[] {
    return DIRECTOR_LIVE_IDS;
  }

  activeId(): MotionBibleId | null {
    return peekDirectorClock().id;
  }

  progress(): number {
    return this.current?.timeline.progress() ?? peekDirectorClock().progress;
  }

  durationMs(): number {
    if (!this.current) return peekDirectorClock().durationMs;
    return Math.round(this.current.timeline.duration() * 1000);
  }

  isPlaying(): boolean {
    return Boolean(this.current && !this.current.timeline.paused());
  }

  play(id: MotionBibleId, opts: PlayOptions = {}): gsap.core.Timeline {
    if (!isMotionBibleId(id)) {
      throw new Error(`Director: unknown MOTION_BIBLE id "${id}"`);
    }
    if (!isDirectorLiveId(id)) {
      throw new Error(
        `Director: "${id}" is not a live MOTION_BIBLE id (${DIRECTOR_LIVE_IDS.join(', ')})`,
      );
    }
    if (useForgeStore.getState().forge.poseLock) {
      this.kill();
      return gsap.timeline({ paused: true });
    }

    this.kill();

    const reducedMotion = Boolean(opts.reducedMotion);
    const io = storeIo(reducedMotion);
    this.io = io;

    resetDirectorClock({
      id,
      freezeBreathe:
        reducedMotion || (id !== 'welcome-idle' && id !== 'emit-burst'),
    });
    setDirectorClockId(id);
    setStoreDirectorId(id);

    const built = isDirectorSlice1Id(id)
      ? buildSlice1Timeline(id, io)
      : buildRemainderTimeline(id, io);
    this.assertCaps(built, reducedMotion);
    this.current = built;

    built.timeline.eventCallback('onComplete', () => {
      const clock = peekDirectorClock();
      clock.progress = 1;
      if (id === 'first-visit-ignition') {
        clock.id = 'welcome-idle';
        clock.freezeBreathe = reducedMotion;
        clock.skippable = false;
        setStoreDirectorId('welcome-idle');
      }
      if (id === 'emit-burst') {
        clock.skippable = false;
      }
      io.setMorphProgress(1);
      publishDirectorClock();
    });

    // Seek t=0 so portal IGNITE / welcome pose apply even when paused.
    built.timeline.pause(0, true);
    this.applyScrubSideEffects(0);

    if (!opts.paused) {
      built.timeline.play(0);
    }
    return built.timeline;
  }

  kill(): void {
    if (this.current) {
      this.current.timeline.kill();
      this.current = null;
    }
    const clock = peekDirectorClock();
    clock.skippable = false;
    clock.id = null;
    clock.freezeBreathe = false;
    clock.progress = 0;
    clock.durationMs = 0;
    publishDirectorClock();
    setStoreDirectorId(null);
    this.io = null;
  }

  skip(): void {
    const id = this.activeId();
    if (!id || !this.current) return;
    if (!isCinematicId(id) && id !== 'emit-burst') return;

    if (id === 'emit-burst') {
      this.io?.dispatchSkipToDocked();
      const clock = peekDirectorClock();
      clock.progress = 1;
      clock.sparkyHop = 0;
      clock.cameraDollyPercent = 0;
      clock.skippable = false;
      if (this.io?.reducedMotion) {
        clock.bloom = 0;
        clock.beams = 0;
        clock.contentIn = 1;
        clock.contentOut = 0;
        clock.reducedMotionCrossfade = 1;
        clock.freezeBreathe = true;
      } else {
        clock.bloom = 0.45;
        clock.freezeBreathe = false;
      }
      this.current.timeline.progress(1);
      this.current.timeline.pause();
      this.io?.setMorphProgress(1);
      publishDirectorClock();
      return;
    }

    if (id === 'first-visit-ignition') {
      this.io?.patchSparky({ spot: 'nearCore', behaviour: 'idle' });
      this.io?.patchHoloBubble({ state: 'hidden' });
      this.play('welcome-idle', { reducedMotion: this.io?.reducedMotion });
    }
  }

  scrub(progress: number): void {
    if (!this.current) return;
    const p = Math.min(1, Math.max(0, progress));
    this.current.timeline.pause();
    this.current.timeline.progress(p, false);
    this.applyScrubSideEffects(p);
    peekDirectorClock().progress = p;
    this.io?.setMorphProgress(p);
    publishDirectorClock();
  }

  private applyScrubSideEffects(progress: number): void {
    const id = this.current?.id;
    const io = this.io;
    if (!id || !io) return;
    const durationMs = this.current?.durationMs ?? 0;
    const timeMs = progress * durationMs;

    if (id === 'emit-burst') {
      if (io.reducedMotion) {
        io.dispatchSkipToDocked();
        return;
      }
      syncEmitBurstPortal(timeMs, io, 'scrub');
    }
    if (id === 'first-visit-ignition' && !io.reducedMotion) {
      applyIgnitionSample(
        peekDirectorClock(),
        sampleFirstVisitIgnition(timeMs),
        io,
      );
    }
  }

  private assertCaps(built: BuiltTimeline, reducedMotion: boolean): void {
    const dur = Math.round(built.timeline.duration() * 1000);
    if (reducedMotion) {
      if (built.id !== 'welcome-idle' && dur > REDUCED_MOTION_CROSSFADE_MS + 20) {
        throw new Error(
          `Director RM timeline ${built.id} is ${dur}ms; cap is ${REDUCED_MOTION_CROSSFADE_MS}ms`,
        );
      }
      return;
    }
    if (built.id === 'welcome-idle') return;
    if (CINEMATIC_IDS.includes(built.id)) {
      if (dur > CINEMATIC_CAP_MS + 20) {
        throw new Error(
          `Director cinematic ${built.id} is ${dur}ms; cap is ${CINEMATIC_CAP_MS}ms`,
        );
      }
      return;
    }
    if (dur > INTERACTIVE_CAP_MS + 20) {
      throw new Error(
        `Director interactive ${built.id} is ${dur}ms; cap is ${INTERACTIVE_CAP_MS}ms`,
      );
    }
  }
}

let singleton: ForgeDirectorImpl | null = null;

export function getForgeDirector(): ForgeDirector {
  if (!singleton) singleton = new ForgeDirectorImpl();
  return singleton;
}

/** Test helper — drop the singleton between cases. */
export function resetForgeDirector(): void {
  singleton?.kill();
  singleton = null;
  resetDirectorClock();
}

export function playForgeTransition(
  id: MotionBibleId,
  opts?: PlayOptions,
): gsap.core.Timeline {
  return getForgeDirector().play(id, opts);
}

export {
  MOTION_BIBLE_IDS,
  DIRECTOR_SLICE1_IDS,
  DIRECTOR_REMAINDER_IDS,
  DIRECTOR_LIVE_IDS,
  CINEMATIC_IDS,
  isMotionBibleId,
  isCinematicId,
  isDirectorSlice1Id,
  isDirectorRemainderId,
  isDirectorLiveId,
} from './director/ids';
export {
  INTERACTIVE_CAP_MS,
  CINEMATIC_CAP_MS,
  EMIT_BURST_MS,
  LOGIN_SUCCESS_HUBSPLIT_MS,
  LOGIN_SLAB_WINDOW_MS,
  INTERACTIVE_MORPH_MS,
  SPLIT_SLAB_WINDOW_MS,
  WHISPER_EXPAND_WINDOW_MS,
  YAW_TUCK_MS,
  FIRST_VISIT_IGNITION_MS,
  REDUCED_MOTION_CROSSFADE_MS as DIRECTOR_RM_MS,
  WELCOME_SIDE_SCALE,
  LAYOUT_MORPH_MS,
  CAMERA_MICRO_DOLLY,
  emitBurstPhaseAt,
  clampCameraDollyPercent,
} from './director/timings';
export {
  peekDirectorClock,
  subscribeDirectorClock,
  getDirectorClockVersion,
  resetDirectorClock,
  isDirectorRmCrossfade,
} from './director/clock';
export {
  FORGE_STING_IDS,
  playForgeSting,
  isForgeStingId,
} from './director/stings';
export {
  HUBSPLIT_HOLO_C,
  registerMorphTargets,
  morphTargetsFor,
  lerpMorphSlots,
  liveDirectorSlots,
  applyLiveSlotsToClock,
} from './director/targets';
export { loadTheatreBeat, maybeLoadForgeTheatreStudio, sampleFirstVisitIgnition } from './director/theatrePlayer';
