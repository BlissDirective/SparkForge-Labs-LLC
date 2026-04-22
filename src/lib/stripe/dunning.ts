// PAY-ENH-003 (Ultra): Dunning state machine + schedule
//
// Pure functions that the webhook + cron both use to decide WHEN a
// dunning stage fires and WHAT to send. No DB access here — callers
// pass in the parent row and act on the returned decisions.

export type DunningStage = 0 | 1 | 2 | 3 | 4;

export interface DunningStageDefinition {
  stage: DunningStage;
  /** Days after dunning_started_at that this stage fires. Stage 0 is
   * immediate (on webhook). */
  dayOffset: number;
  /** Template function must exist in email-templates/dunning.ts */
  templateKey: 'payment-failed' | 'retry-coming' | 'grace-ending' | 'downgraded' | 'win-back';
  subject: string;
  /** True iff this stage demotes the parent to free tier on fire. */
  demotesToFree: boolean;
}

export const DUNNING_SCHEDULE: readonly DunningStageDefinition[] = [
  {
    stage: 0,
    dayOffset: 0,
    templateKey: 'payment-failed',
    subject: 'Payment failed — we\'re retrying automatically',
    demotesToFree: false,
  },
  {
    stage: 1,
    dayOffset: 3,
    templateKey: 'retry-coming',
    subject: 'Update your card — subscription retry in 4 days',
    demotesToFree: false,
  },
  {
    stage: 2,
    dayOffset: 6,
    templateKey: 'grace-ending',
    subject: 'Grace period ending tomorrow — please update payment',
    demotesToFree: false,
  },
  {
    stage: 3,
    dayOffset: 7,
    templateKey: 'downgraded',
    subject: 'Your SparkForge plan was paused',
    demotesToFree: true,
  },
  {
    stage: 4,
    dayOffset: 30,
    templateKey: 'win-back',
    subject: 'Come back — 50% off your first month',
    demotesToFree: false,
  },
] as const;

export const GRACE_PERIOD_DAYS = 7;

/**
 * Compute the Date a given stage should fire at, relative to the
 * moment dunning started (first failed payment).
 */
export function stageDueAt(startedAt: Date, stage: DunningStage): Date {
  const def = DUNNING_SCHEDULE[stage];
  if (!def) throw new Error(`Unknown dunning stage ${stage}`);
  return new Date(startedAt.getTime() + def.dayOffset * 24 * 60 * 60 * 1000);
}

/**
 * Return the next stage to fire for a parent, or null if the sequence
 * is exhausted or not yet due. `now` is injected so tests/backfills
 * can pass a fixed time.
 */
export function nextDueStage(input: {
  currentStage: DunningStage | null;
  startedAt: Date;
  now?: Date;
}): DunningStage | null {
  const now = input.now ?? new Date();
  const current = input.currentStage;
  // Not in a sequence yet → webhook path starts at stage 0 manually.
  if (current === null) return null;
  // Sequence complete.
  if (current >= 4) return null;
  const candidate = (current + 1) as DunningStage;
  const due = stageDueAt(input.startedAt, candidate);
  return now >= due ? candidate : null;
}

/**
 * Has the parent's grace period expired? Returns false when grace is
 * unset (not in dunning) or still in the future.
 */
export function graceExpired(
  graceEndsAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!graceEndsAt) return false;
  const end = typeof graceEndsAt === 'string' ? new Date(graceEndsAt) : graceEndsAt;
  return now.getTime() >= end.getTime();
}

/**
 * Is the parent currently in the grace window? (Dunning started,
 * grace hasn't expired.) Used by the UI to show a countdown banner.
 */
export function inGraceWindow(parent: {
  grace_period_ends_at?: string | null;
  dunning_stage?: number | null;
}, now: Date = new Date()): boolean {
  if (parent.dunning_stage === null || parent.dunning_stage === undefined) {
    return false;
  }
  if (parent.dunning_stage >= 3) return false;   // already demoted
  return !graceExpired(parent.grace_period_ends_at, now);
}

/**
 * Convenience for the /parent/subscription UI: how many whole hours
 * remain in the grace window. Negative or null → not shown.
 */
export function hoursLeftInGrace(
  graceEndsAt: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!graceEndsAt) return null;
  const end = typeof graceEndsAt === 'string' ? new Date(graceEndsAt) : graceEndsAt;
  const delta = end.getTime() - now.getTime();
  if (delta <= 0) return 0;
  return Math.floor(delta / (60 * 60 * 1000));
}
