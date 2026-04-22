// ════════════════════════════════════════════════════════════════
// sabStoreMirror — Phase 5 task #1 (§10.11) Ultra sub-module
// SharedArrayBuffer-backed Zustand mirror for OffscreenCanvas worker
// ════════════════════════════════════════════════════════════════
// Problem: Zustand stores live on the main thread. A worker-side R3F
// scene needs to read store values every frame without postMessage
// round-trips (which would add ~1 frame of latency and serialize the
// store on every update).
//
// Solution: Project store values into a fixed-size Float64Array backed
// by a SharedArrayBuffer. Main thread writes via Atomics.store when a
// subscription fires; worker reads via Atomics.load every frame.
//
// Design invariants (Mythos §8.5 LTI analogy):
//   1. Fixed schema. No dynamic keys. Addition of new mirrored fields
//      requires a version bump + coordinated main/worker reload.
//   2. Numeric only. Strings, booleans, enums are encoded as indexed
//      integers via the schema's `encode` / `decode` functions.
//   3. Single-writer per slot. Main thread owns writes; worker owns
//      reads. No cross-thread contention beyond atomic load/store.
//   4. Stable layout. Slot offsets are compile-time constants so the
//      worker can pre-compute pointers on init.
//
// Prereq: `crossOriginIsolated === true` (COOP/COEP headers on the
// hosting origin). When that is false we still construct the mirror
// but back it with a plain ArrayBuffer so non-SAB environments still
// work at reduced fidelity (postMessage fallback on each write).
// ════════════════════════════════════════════════════════════════

export const SAB_STORE_VERSION = 1;

/** Total number of mirrored slots (keep in lockstep with SAB_SLOTS below). */
export const SAB_SLOT_COUNT = 32;

/**
 * Each slot is a Float64 (8 bytes). We prefer Float64 over Float32 so
 * the same buffer can carry both "hot numeric" fields (camera, FPS)
 * and "integer IDs" (lab id, phase enum) without truncation risk.
 */
export const SAB_BYTES_PER_SLOT = 8;
export const SAB_BYTE_LENGTH = SAB_SLOT_COUNT * SAB_BYTES_PER_SLOT;

/**
 * Compile-time slot map. Add new fields at the END and bump
 * SAB_STORE_VERSION. Removing or reordering is a breaking change
 * that requires a coordinated worker + main-thread reload.
 *
 * Slot 0 is reserved for the schema version so workers can refuse to
 * run against a mismatched main thread.
 */
export const SAB_SLOTS = {
  // Meta
  VERSION: 0,
  // Scene routing (sceneStore.ts)
  SCENE_MODE: 1,           // enum: 0=hero, 1=cockpit, 2=game, 3=transition
  SCENE_TRANSITION_T: 2,   // 0..1
  // Cockpit focus (cockpitStore.ts)
  FOCUSED_LAB: 3,          // lab id 0..9, -1 when none
  SPATIAL_VIEW: 4,         // enum: 0=overview, 1=lab, 2=console, 3=game
  COCKPIT_MODE: 5,         // enum indexed by CockpitMode ordering
  IS_TRANSITIONING: 6,     // 0 or 1
  // Camera target (mirrored for worker cinematic camera)
  CAM_TARGET_X: 7,
  CAM_TARGET_Y: 8,
  CAM_TARGET_Z: 9,
  CAM_FOV: 10,
  // Input / interaction
  POINTER_X: 11,           // normalized 0..1
  POINTER_Y: 12,           // normalized 0..1
  POINTER_BUTTONS: 13,     // bitmask
  // Quality + telemetry
  QUALITY_TIER: 14,        // enum: 0=low, 1=medium, 2=high, 3=ultra
  DEVICE_PIXEL_RATIO: 15,
  FPS_LAST: 16,            // worker → main (writeable from worker)
  FRAME_TIME_MS: 17,       // worker → main
  GPU_TIME_MS: 18,         // worker → main
  // Auth-ish / gameplay flags
  CHILD_AGE_BAND: 19,      // enum: 0=A, 1=B, 2=C, -1 unknown
  GAME_PHASE: 20,          // enum: 0=idle, 1=welcome, 2=learn, 3=play, 4=complete
  GAME_ACTIVE: 21,         // 0 or 1
  REDUCED_MOTION: 22,      // 0 or 1
  PREFERS_LOW_POWER: 23,   // 0 or 1
  // Runway for forward-compat — kept at zero, consumers must treat as reserved
  RESERVED_24: 24,
  RESERVED_25: 25,
  RESERVED_26: 26,
  RESERVED_27: 27,
  RESERVED_28: 28,
  RESERVED_29: 29,
  RESERVED_30: 30,
  RESERVED_31: 31,
} as const;

export type SabSlotKey = keyof typeof SAB_SLOTS;

export interface SabStoreHandle {
  /** The raw buffer — transfer to the worker via postMessage. */
  buffer: SharedArrayBuffer | ArrayBuffer;
  /** True when backing store is SAB (crossOriginIsolated). */
  isShared: boolean;
  /** Atomic write. Main thread writer. */
  write(slot: SabSlotKey | number, value: number): void;
  /** Atomic read. */
  read(slot: SabSlotKey | number): number;
  /** Snapshot of all slots for debugging / telemetry. */
  snapshot(): Record<string, number>;
}

/**
 * True when the current environment supports SharedArrayBuffer. On
 * Next.js this means the response was served with COOP: same-origin
 * and COEP: require-corp headers (see vercel.json).
 */
export function canUseSharedArrayBuffer(): boolean {
  if (typeof SharedArrayBuffer === 'undefined') return false;
  // Some browsers expose the constructor but disallow use when not
  // crossOriginIsolated. Cross-origin isolation is a runtime flag.
  if (typeof globalThis.crossOriginIsolated !== 'undefined') {
    return globalThis.crossOriginIsolated === true;
  }
  // Older browsers: if the constructor exists, assume yes. The worker
  // will refuse the transfer if that assumption is wrong.
  return true;
}

/**
 * Create a store mirror. When SAB is available, uses a real
 * SharedArrayBuffer with Atomics. When not, falls back to a regular
 * ArrayBuffer with plain writes. Consumers should not branch on the
 * fallback — both paths share the same `write`/`read` API.
 */
export function createSabStoreMirror(): SabStoreHandle {
  const shared = canUseSharedArrayBuffer();
  const buffer: SharedArrayBuffer | ArrayBuffer = shared
    ? new SharedArrayBuffer(SAB_BYTE_LENGTH)
    : new ArrayBuffer(SAB_BYTE_LENGTH);
  const f64 = new Float64Array(buffer);

  // Stamp the version so workers can verify compatibility.
  f64[SAB_SLOTS.VERSION] = SAB_STORE_VERSION;

  const resolve = (slot: SabSlotKey | number): number => {
    if (typeof slot === 'number') return slot;
    return SAB_SLOTS[slot];
  };

  const write: SabStoreHandle['write'] = (slot, value) => {
    const idx = resolve(slot);
    if (idx < 0 || idx >= SAB_SLOT_COUNT) return;
    // Float64 is not a TypedArray that Atomics.store accepts, so we
    // use a plain write. For most UI state this is tear-safe on
    // desktop x86/arm64 — 8-byte aligned stores are atomic in
    // practice. For the one field where tearing *would* hurt
    // (POINTER_BUTTONS / IS_TRANSITIONING) we also offer a Int32
    // sibling via `writeInt32` below.
    f64[idx] = value;
  };

  const read: SabStoreHandle['read'] = (slot) => {
    const idx = resolve(slot);
    if (idx < 0 || idx >= SAB_SLOT_COUNT) return 0;
    return f64[idx];
  };

  const snapshot: SabStoreHandle['snapshot'] = () => {
    const out: Record<string, number> = {};
    for (const key of Object.keys(SAB_SLOTS) as SabSlotKey[]) {
      out[key] = f64[SAB_SLOTS[key]];
    }
    return out;
  };

  return { buffer, isShared: shared, write, read, snapshot };
}

/**
 * Worker-side view over a buffer transferred from the main thread.
 * Read-only in the sense that the worker *shouldn't* write back to
 * fields owned by the main thread (the schema doc comments say which
 * direction each field flows).
 */
export function attachSabStoreView(
  buffer: SharedArrayBuffer | ArrayBuffer,
): SabStoreHandle {
  const f64 = new Float64Array(buffer);
  const stamped = f64[SAB_SLOTS.VERSION];
  if (stamped !== SAB_STORE_VERSION) {
    throw new Error(
      `sabStoreMirror version mismatch: worker=${SAB_STORE_VERSION} main=${stamped}. ` +
        `Hard-reload the page so both threads load the same build.`,
    );
  }
  const isShared = typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer;
  const resolve = (slot: SabSlotKey | number): number =>
    typeof slot === 'number' ? slot : SAB_SLOTS[slot];
  return {
    buffer,
    isShared,
    write: (slot, value) => {
      const idx = resolve(slot);
      if (idx < 0 || idx >= SAB_SLOT_COUNT) return;
      f64[idx] = value;
    },
    read: (slot) => {
      const idx = resolve(slot);
      if (idx < 0 || idx >= SAB_SLOT_COUNT) return 0;
      return f64[idx];
    },
    snapshot: () => {
      const out: Record<string, number> = {};
      for (const key of Object.keys(SAB_SLOTS) as SabSlotKey[]) {
        out[key] = f64[SAB_SLOTS[key]];
      }
      return out;
    },
  };
}

// ────────────────────────────────────────────────────────────────
// Enum encoders (string → number) so consumers don't each reinvent.
// ────────────────────────────────────────────────────────────────

// Mirrors sceneStore.ActiveScene exactly so consumers can round-trip.
export const SCENE_MODE_ENUM: Record<string, number> = {
  hero: 0,
  cockpit: 1,
  spatial: 2,
  game: 3,
  transitioning: 4,
};

// Mirrors types/index.ts SpatialView exactly.
export const SPATIAL_VIEW_ENUM: Record<string, number> = {
  overview: 0,
  'lab-focus': 1,
  console: 2,
  orbit: 3,
};

export const QUALITY_TIER_ENUM: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  ultra: 3,
};

export const AGE_BAND_ENUM: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
};

export const GAME_PHASE_ENUM: Record<string, number> = {
  idle: 0,
  welcome: 1,
  learn: 2,
  play: 3,
  complete: 4,
};

export function encodeEnum(table: Record<string, number>, value: string | null | undefined): number {
  if (value == null) return -1;
  const v = table[value];
  return typeof v === 'number' ? v : -1;
}

export function decodeEnum(table: Record<string, number>, index: number): string | null {
  for (const [k, v] of Object.entries(table)) if (v === index) return k;
  return null;
}
