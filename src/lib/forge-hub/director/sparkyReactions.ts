// ════════════════════════════════════════════════════════════════
// Director Sparky cues — MOTION_BIBLE reactions bound to Stagehand's
// five Tier-1 desk seats only (W3-03 sparkySpots + forge.sparky.spot).
// Do not invent seats. Reduced-motion teleports (character-spec exception).
// ════════════════════════════════════════════════════════════════

import {
  SPARKY_SPOT_IDS,
  attendSpotForPanel,
  defaultSpotForMode,
  isSparkySpot,
} from '@/config/sparkySpots';
import { sparkyLine } from '@/lib/forge-hub/catalog';
import type {
  ForgeHoloBubbleState,
  ForgeMode,
  ForgePanelId,
  ForgeSparkyBehaviour,
  ForgeSparkyExpression,
  ForgeSparkyReaction,
  ForgeSparkySpot,
  ForgeSparkyState,
} from '@/lib/forge-hub/types';
import type { DirectorLiveId } from './ids';

/** Stagehand lock — the only seats Director may write. */
export const DIRECTOR_SPARKY_SEATS = SPARKY_SPOT_IDS;

export interface SparkyCueContext {
  reducedMotion: boolean;
  currentSpot: ForgeSparkySpot;
  hoveredPanel: ForgePanelId;
  previousMode: ForgeMode | null;
  destMode: ForgeMode | null;
}

export interface SparkyCue {
  start: Partial<ForgeSparkyState>;
  end: Partial<ForgeSparkyState>;
  startBubble?: Partial<ForgeHoloBubbleState>;
  endBubble?: Partial<ForgeHoloBubbleState>;
}

function seat(id: ForgeSparkySpot): ForgeSparkySpot {
  if (!isSparkySpot(id)) {
    throw new Error(`Director: invented Sparky seat "${String(id)}"`);
  }
  return id;
}

function movingTo(
  from: ForgeSparkySpot,
  to: ForgeSparkySpot,
  reducedMotion: boolean,
): boolean {
  if (reducedMotion) return false;
  return from !== to;
}

function patch(
  ctx: SparkyCueContext,
  from: ForgeSparkySpot,
  to: ForgeSparkySpot,
  extras: {
    behaviour: ForgeSparkyBehaviour;
    expression: ForgeSparkyExpression;
    reaction: ForgeSparkyReaction | null;
    attendPanel?: ForgePanelId;
  },
): Partial<ForgeSparkyState> {
  return {
    spot: seat(to),
    behaviour: extras.behaviour,
    expression: extras.expression,
    reaction: extras.reaction,
    attendPanel: extras.attendPanel ?? null,
    moving: movingTo(from, to, ctx.reducedMotion),
  };
}

function labsAttendSpot(ctx: SparkyCueContext): {
  spot: ForgeSparkySpot;
  reaction: ForgeSparkyReaction;
  attendPanel: ForgePanelId;
} {
  const hovered = ctx.hoveredPanel;
  if (hovered === 'holoR') {
    return { spot: seat('rightLip'), reaction: 'pointR', attendPanel: 'holoR' };
  }
  const fromHover = hovered
    ? attendSpotForPanel(hovered, seat('nearCore'))
    : seat('leftLip');
  const spot = fromHover === 'rightLip' ? seat('rightLip') : seat('leftLip');
  return {
    spot,
    reaction: spot === 'rightLip' ? 'pointR' : 'pointL',
    attendPanel: spot === 'rightLip' ? 'holoR' : 'holoL',
  };
}

function focusReturnSpot(ctx: SparkyCueContext): ForgeSparkySpot {
  const dest = ctx.destMode ?? ctx.previousMode ?? 'labsBrowse';
  const mode = dest === 'focus' ? 'labsBrowse' : dest;
  return seat(defaultSpotForMode(mode));
}

function currentOrNearCore(ctx: SparkyCueContext): ForgeSparkySpot {
  return isSparkySpot(ctx.currentSpot)
    ? seat(ctx.currentSpot)
    : seat('nearCore');
}

/**
 * MOTION_BIBLE start / end (attend) seats + reactions.
 * RM: teleport to the end seat, skip hops / walks / wave / lean clips.
 */
export function sparkyCueFor(
  id: DirectorLiveId,
  ctx: SparkyCueContext,
): SparkyCue {
  const current = currentOrNearCore(ctx);
  const rm = ctx.reducedMotion;

  switch (id) {
    case 'welcome-idle': {
      const near = seat('nearCore');
      const idle = patch(ctx, current, near, {
        behaviour: 'idle',
        expression: 'idle',
        reaction: null,
      });
      return {
        start: idle,
        end: idle,
        endBubble: { state: 'hidden', tip: null },
      };
    }
    case 'login-success-hubsplit': {
      const near = seat('nearCore');
      const start = patch(ctx, current, near, {
        behaviour: 'attend',
        expression: 'happy',
        reaction: null,
      });
      const end = rm
        ? patch(ctx, near, near, {
            behaviour: 'idle',
            expression: 'happy',
            reaction: null,
          })
        : patch(ctx, near, near, {
            behaviour: 'react',
            expression: 'happy',
            reaction: 'wave',
          });
      return {
        start,
        end,
        endBubble: { state: 'tip', tip: sparkyLine(0) },
      };
    }
    case 'hub-labsbrowse': {
      const near = seat('nearCore');
      const attend = labsAttendSpot(ctx);
      const start = patch(ctx, current, near, {
        behaviour: 'attend',
        expression: 'happy',
        reaction: null,
      });
      const end = patch(ctx, near, attend.spot, {
        behaviour: 'attend',
        expression: 'happy',
        reaction: rm ? null : attend.reaction,
        attendPanel: attend.attendPanel,
      });
      return { start, end };
    }
    case 'labsbrowse-hub': {
      const lip = seat('leftLip');
      const near = seat('nearCore');
      return {
        start: patch(ctx, current, lip, {
          behaviour: 'return',
          expression: 'idle',
          reaction: null,
        }),
        end: patch(ctx, lip, near, {
          behaviour: 'idle',
          expression: 'idle',
          reaction: null,
        }),
      };
    }
    case 'focus-in': {
      const near = seat('nearCore');
      const look = ctx.hoveredPanel
        ? seat(attendSpotForPanel(ctx.hoveredPanel, near))
        : near;
      const point: ForgeSparkyReaction | null =
        rm || look === 'nearCore'
          ? null
          : look === 'leftLip'
            ? 'pointL'
            : look === 'rightLip'
              ? 'pointR'
              : null;
      const start = patch(ctx, current, near, {
        behaviour: 'attend',
        expression: 'idle',
        reaction: null,
        attendPanel: 'holoC',
      });
      const end = patch(ctx, near, look, {
        behaviour: 'attend',
        expression: 'idle',
        reaction: point,
        attendPanel: 'holoC',
      });
      return { start, end };
    }
    case 'focus-out': {
      const near = seat('nearCore');
      const home = focusReturnSpot(ctx);
      return {
        start: patch(ctx, current, near, {
          behaviour: 'return',
          expression: 'idle',
          reaction: null,
        }),
        end: patch(ctx, near, home, {
          behaviour: 'idle',
          expression: 'idle',
          reaction: null,
        }),
      };
    }
    case 'dual-enter': {
      const near = seat('nearCore');
      const front = seat('frontCenter');
      return {
        start: patch(ctx, current, near, {
          behaviour: 'idle',
          expression: 'idle',
          reaction: null,
        }),
        end: patch(ctx, near, front, {
          behaviour: 'idle',
          expression: 'idle',
          reaction: null,
        }),
      };
    }
    case 'dual-exit': {
      const front = seat('frontCenter');
      const near = seat('nearCore');
      return {
        start: patch(ctx, current, front, {
          behaviour: 'return',
          expression: 'idle',
          reaction: null,
        }),
        end: patch(ctx, front, near, {
          behaviour: 'idle',
          expression: 'idle',
          reaction: null,
        }),
      };
    }
    case 'whisper-expand': {
      const near = seat('nearCore');
      const front = seat('frontCenter');
      return {
        start: patch(ctx, current, near, {
          behaviour: 'attend',
          expression: 'idle',
          reaction: null,
        }),
        startBubble: { state: 'tip' },
        end: patch(ctx, near, front, {
          behaviour: 'whisper',
          expression: 'speaking',
          reaction: null,
          attendPanel: 'holoC',
        }),
        endBubble: { state: 'whisper', tip: sparkyLine(2) },
      };
    }
    case 'whisper-close': {
      const front = seat('frontCenter');
      const prior = seat('nearCore');
      return {
        start: patch(ctx, current, front, {
          behaviour: 'whisper',
          expression: 'speaking',
          reaction: null,
          attendPanel: 'holoC',
        }),
        startBubble: { state: 'whisper' },
        end: patch(ctx, front, prior, {
          behaviour: 'idle',
          expression: 'idle',
          reaction: null,
        }),
        endBubble: { state: 'hidden', tip: null },
      };
    }
    case 'lobby-playstage-merge': {
      // TAP §5 arcade play stays rightLip; /content sit is leftLip later.
      const lip = seat('rightLip');
      const start = patch(ctx, current, lip, {
        behaviour: 'attend',
        expression: 'excited',
        reaction: null,
        attendPanel: 'holoC',
      });
      const end = patch(ctx, lip, lip, {
        behaviour: 'attend',
        expression: 'excited',
        reaction: null,
        attendPanel: 'holoC',
      });
      return { start, end };
    }
    case 'playstage-lobby-split': {
      const lip = seat('rightLip');
      return {
        start: patch(ctx, current, lip, {
          behaviour: 'return',
          expression: 'happy',
          reaction: null,
        }),
        end: patch(ctx, lip, lip, {
          behaviour: 'idle',
          expression: 'happy',
          reaction: null,
        }),
      };
    }
    case 'emit-burst': {
      const here = current;
      const hold = patch(ctx, here, here, {
        behaviour: 'idle',
        expression: 'idle',
        reaction: null,
      });
      const emit = rm
        ? hold
        : patch(ctx, here, here, {
            behaviour: 'react',
            expression: 'excited',
            reaction: 'surprised',
          });
      return { start: hold, end: emit };
    }
    case 'first-visit-ignition': {
      const behind = seat('behindCore');
      const near = seat('nearCore');
      if (rm) {
        const idle = patch(ctx, current, near, {
          behaviour: 'idle',
          expression: 'idle',
          reaction: null,
        });
        return {
          start: idle,
          end: idle,
          endBubble: { state: 'hidden', tip: null },
        };
      }
      return {
        start: patch(ctx, current, behind, {
          behaviour: 'attend',
          expression: 'happy',
          reaction: null,
        }),
        end: patch(ctx, behind, near, {
          behaviour: 'react',
          expression: 'happy',
          reaction: 'wave',
        }),
        endBubble: { state: 'tip', tip: sparkyLine(1) },
      };
    }
    case 'game-launch-burst': {
      const lip = seat('rightLip');
      const attend = patch(ctx, current, lip, {
        behaviour: 'attend',
        expression: 'excited',
        reaction: null,
        attendPanel: 'holoC',
      });
      const cheer = rm
        ? attend
        : patch(ctx, lip, lip, {
            behaviour: 'react',
            expression: 'celebrating',
            reaction: 'cheer',
            attendPanel: 'holoC',
          });
      return {
        start: attend,
        end: cheer,
        endBubble: rm
          ? { state: 'hidden', tip: null }
          : { state: 'ping', tip: sparkyLine(1) },
      };
    }
    default: {
      const never: never = id;
      throw new Error(`Director Sparky cue missing for ${String(never)}`);
    }
  }
}

export function cueContextFromIo(io: {
  reducedMotion: boolean;
  getSparkySpot: () => ForgeSparkySpot;
  getHoveredPanel: () => ForgePanelId;
  getPreviousMode: () => ForgeMode | null;
  getMode?: () => ForgeMode;
  destMode?: ForgeMode | null;
}): SparkyCueContext {
  const current = io.getSparkySpot();
  return {
    reducedMotion: io.reducedMotion,
    currentSpot: isSparkySpot(current) ? current : 'nearCore',
    hoveredPanel: io.getHoveredPanel(),
    previousMode: io.getPreviousMode(),
    destMode: io.destMode ?? null,
  };
}

export function applySparkyCue(
  io: {
    patchSparky: (patch: Partial<ForgeSparkyState>) => void;
    patchHoloBubble: (patch: Partial<ForgeHoloBubbleState>) => void;
  },
  patch: Partial<ForgeSparkyState>,
  bubble?: Partial<ForgeHoloBubbleState>,
): void {
  if (patch.spot && !isSparkySpot(patch.spot)) {
    throw new Error(`Director: invented Sparky seat "${patch.spot}"`);
  }
  io.patchSparky(patch);
  if (bubble) io.patchHoloBubble(bubble);
}

/** Theatre ignition: spawn behindCore, wave at nearCore once ping reads. */
export function ignitionSparkyPatch(
  sample: { sparkyPing: number; appearScale: number; contentIn: number },
): { sparky: Partial<ForgeSparkyState>; bubble?: Partial<ForgeHoloBubbleState> } {
  if (sample.sparkyPing > 0.02) {
    return {
      sparky: {
        spot: seat('nearCore'),
        behaviour: 'react',
        expression: 'happy',
        reaction: 'wave',
        moving: false,
        attendPanel: null,
      },
      bubble: { state: 'tip', tip: sparkyLine(1) },
    };
  }
  if (sample.appearScale >= 0.999 && sample.contentIn >= 0.999) {
    return {
      sparky: {
        spot: seat('nearCore'),
        behaviour: 'idle',
        expression: 'happy',
        reaction: null,
        moving: false,
        attendPanel: null,
      },
      bubble: { state: 'hidden', tip: null },
    };
  }
  return {
    sparky: {
      spot: seat('behindCore'),
      behaviour: 'attend',
      expression: 'happy',
      reaction: null,
      moving: true,
      attendPanel: null,
    },
    bubble: { state: 'hidden', tip: null },
  };
}

/** Theatre burst: cheer on the arcade rightLip attend seat. */
export function burstSparkyPatch(sample: {
  sparkyPing: number;
  sparkyHop: number;
}): { sparky: Partial<ForgeSparkyState>; bubble?: Partial<ForgeHoloBubbleState> } {
  if (sample.sparkyPing > 0.02 || sample.sparkyHop > 0.02) {
    return {
      sparky: {
        spot: seat('rightLip'),
        behaviour: 'react',
        expression: 'celebrating',
        reaction: 'cheer',
        moving: false,
        attendPanel: 'holoC',
      },
      bubble: { state: 'ping', tip: sparkyLine(1) },
    };
  }
  return {
    sparky: {
      spot: seat('rightLip'),
      behaviour: 'attend',
      expression: 'excited',
      reaction: null,
      moving: false,
      attendPanel: 'holoC',
    },
    bubble: { state: 'hidden', tip: null },
  };
}
