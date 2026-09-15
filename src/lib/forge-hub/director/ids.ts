// ════════════════════════════════════════════════════════════════
// MOTION_BIBLE transition ids — stable, do not rename.
// Source: docs/forge-hub/MOTION_BIBLE.md §3 / §4.
// ════════════════════════════════════════════════════════════════

export const MOTION_BIBLE_IDS = [
  'welcome-idle',
  'login-success-hubsplit',
  'hub-labsbrowse',
  'lobby-playstage-merge',
  'playstage-lobby-split',
  'whisper-expand',
  'emit-burst',
  'first-visit-ignition',
  'whisper-close',
  'focus-in',
  'focus-out',
  'dual-enter',
  'dual-exit',
  'labsbrowse-hub',
  'level-up',
  'outfit-swap',
] as const;

export type MotionBibleId = (typeof MOTION_BIBLE_IDS)[number];

/** W2-02 slice 1 — registered GSAP / Theatre stub timelines. */
export const DIRECTOR_SLICE1_IDS = [
  'welcome-idle',
  'login-success-hubsplit',
  'emit-burst',
  'first-visit-ignition',
] as const satisfies readonly MotionBibleId[];

export type DirectorSlice1Id = (typeof DIRECTOR_SLICE1_IDS)[number];

export const CINEMATIC_IDS: readonly MotionBibleId[] = [
  'emit-burst',
  'first-visit-ignition',
  'level-up',
  'outfit-swap',
];

export function isMotionBibleId(value: string): value is MotionBibleId {
  return (MOTION_BIBLE_IDS as readonly string[]).includes(value);
}

export function isCinematicId(id: MotionBibleId): boolean {
  return CINEMATIC_IDS.includes(id);
}

export function isDirectorSlice1Id(id: MotionBibleId): id is DirectorSlice1Id {
  return (DIRECTOR_SLICE1_IDS as readonly MotionBibleId[]).includes(id);
}
