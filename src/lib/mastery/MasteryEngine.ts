// ════════════════════════════════════════════════════════════════════════
// MASTERY ENGINE — Phase 10.2: Mastery Path System
// ════════════════════════════════════════════════════════════════════════
// Topic (lab) mastery trees with prerequisites, mastery certificates
// (shareable with parent approval), and an Expert Mode unlock per mastered
// topic. Mastery status is DERIVED from each lab's completion percent; the
// database stores only the stateful overlay (mastered_at, certificate,
// expert unlock).
// ════════════════════════════════════════════════════════════════════════

export type MasteryStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

/** A lab is "mastered" at or above this completion percent. */
export const MASTERY_PERCENT = 80;

/**
 * Prerequisite graph: a lab is unlocked only once ALL its prerequisite labs
 * are mastered. Foundational labs have no prerequisites. Lab ids 1-11 map to
 * the canonical lab system (Lab 11 = Agentic AI, the advanced capstone).
 */
export const LAB_PREREQUISITES: Record<number, number[]> = {
  1: [],
  2: [1],
  3: [1],
  4: [2],
  5: [2],
  6: [3],
  7: [3],
  8: [2],
  9: [5],
  10: [6],
  11: [3, 7],
};

export interface CertificateState {
  issued: boolean;
  parentApproved: boolean;
}

export interface TopicMastery {
  labId: number;
  name: string;
  status: MasteryStatus;
  percent: number;
  /** Labs that must be mastered first (only the unmet ones, for display). */
  blockedBy: number[];
  expertUnlocked: boolean;
  certificate: CertificateState;
}

/** Per-lab overlay persisted in the database. */
export interface MasteryOverlay {
  labId: number;
  masteredAt: string | null;
  expertUnlocked: boolean;
  certificateIssued: boolean;
  certificateApproved: boolean;
}

export function isMastered(percent: number): boolean {
  return percent >= MASTERY_PERCENT;
}

/** All prerequisites mastered (or none required)? */
export function isLabUnlocked(labId: number, masteredLabIds: Set<number>): boolean {
  const prereqs = LAB_PREREQUISITES[labId] ?? [];
  return prereqs.every((p) => masteredLabIds.has(p));
}

/** Prerequisite labs that are NOT yet mastered (for "blocked by" display). */
export function unmetPrerequisites(labId: number, masteredLabIds: Set<number>): number[] {
  return (LAB_PREREQUISITES[labId] ?? []).filter((p) => !masteredLabIds.has(p));
}

export function computeStatus(
  labId: number,
  percent: number,
  masteredLabIds: Set<number>,
): MasteryStatus {
  if (isMastered(percent)) return 'mastered';
  if (!isLabUnlocked(labId, masteredLabIds)) return 'locked';
  if (percent > 0) return 'in_progress';
  return 'available';
}

/**
 * Build the full topic-mastery view. `percents` maps labId -> completion
 * percent; `overlays` maps labId -> persisted overlay; `names` maps
 * labId -> display name.
 */
export function buildMasteryTree(
  percents: Record<number, number>,
  overlays: Record<number, MasteryOverlay>,
  names: Record<number, string>,
): TopicMastery[] {
  // A lab counts as mastered if it's at/above threshold now OR was recorded
  // as mastered before (mastery is sticky — dropping below 80% later doesn't
  // revoke it).
  const masteredLabIds = new Set<number>();
  for (const idStr of Object.keys(names)) {
    const id = Number(idStr);
    if (isMastered(percents[id] ?? 0) || overlays[id]?.masteredAt) masteredLabIds.add(id);
  }

  return Object.keys(names)
    .map(Number)
    .sort((a, b) => a - b)
    .map((labId) => {
      const percent = percents[labId] ?? 0;
      const overlay = overlays[labId];
      const sticky = isMastered(percent) || !!overlay?.masteredAt;
      const status: MasteryStatus = sticky
        ? 'mastered'
        : computeStatus(labId, percent, masteredLabIds);
      return {
        labId,
        name: names[labId] ?? `Lab ${labId}`,
        status,
        percent,
        blockedBy: status === 'locked' ? unmetPrerequisites(labId, masteredLabIds) : [],
        expertUnlocked: !!overlay?.expertUnlocked,
        certificate: {
          issued: !!overlay?.certificateIssued,
          parentApproved: !!overlay?.certificateApproved,
        },
      };
    });
}

export function countMastered(topics: TopicMastery[]): number {
  return topics.filter((t) => t.status === 'mastered').length;
}

/** Eligible to claim mastery (mastered now, not yet recorded/certified). */
export function canClaimMastery(percent: number, overlay: MasteryOverlay | undefined): boolean {
  return isMastered(percent) && !overlay?.certificateIssued;
}

export function getMasteryGreeting(masteredCount: number, total: number): string {
  if (masteredCount === 0) return 'Master a lab to earn your first certificate!';
  if (masteredCount >= total && total > 0) return `Incredible — you mastered all ${total} labs! 🎓`;
  return `You've mastered ${masteredCount} of ${total} labs. Keep climbing!`;
}
