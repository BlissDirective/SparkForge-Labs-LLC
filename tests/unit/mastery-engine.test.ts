// ════════════════════════════════════════════════════
// Phase 10.2 — Mastery Engine (Mastery Path System)
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  MASTERY_PERCENT,
  LAB_PREREQUISITES,
  isMastered,
  isLabUnlocked,
  unmetPrerequisites,
  computeStatus,
  buildMasteryTree,
  countMastered,
  canClaimMastery,
  getMasteryGreeting,
  type MasteryOverlay,
} from '@/lib/mastery/MasteryEngine';

const NAMES: Record<number, string> = { 1: 'What IS AI?', 2: 'Teaching AI', 3: 'Neural Nets', 7: 'Robotics', 11: 'Agentic AI' };

describe('mastery thresholds & prerequisites', () => {
  it('masters at or above the threshold', () => {
    expect(isMastered(MASTERY_PERCENT)).toBe(true);
    expect(isMastered(MASTERY_PERCENT - 1)).toBe(false);
  });

  it('unlocks a lab only when all prerequisites are mastered', () => {
    expect(isLabUnlocked(1, new Set())).toBe(true); // foundation
    expect(isLabUnlocked(3, new Set())).toBe(false); // needs 1
    expect(isLabUnlocked(3, new Set([1]))).toBe(true);
    // Lab 11 needs both 3 and 7.
    expect(isLabUnlocked(11, new Set([3]))).toBe(false);
    expect(isLabUnlocked(11, new Set([3, 7]))).toBe(true);
  });

  it('reports unmet prerequisites', () => {
    expect(unmetPrerequisites(11, new Set([3]))).toEqual([7]);
    expect(unmetPrerequisites(1, new Set())).toEqual([]);
  });

  it('every prerequisite refers to an earlier-or-valid lab', () => {
    for (const [lab, prereqs] of Object.entries(LAB_PREREQUISITES)) {
      for (const p of prereqs) expect(p).toBeLessThan(Number(lab));
    }
  });
});

describe('status computation', () => {
  it('derives locked / available / in_progress / mastered', () => {
    const mastered = new Set([1]);
    expect(computeStatus(1, 90, mastered)).toBe('mastered');
    expect(computeStatus(2, 0, mastered)).toBe('available'); // unlocked by 1, not started
    expect(computeStatus(2, 40, mastered)).toBe('in_progress');
    expect(computeStatus(3, 0, new Set())).toBe('locked'); // needs 1
  });
});

describe('mastery tree', () => {
  it('builds sticky mastery + blockedBy + counts', () => {
    const percents = { 1: 100, 2: 50, 3: 0, 7: 0, 11: 0 };
    const overlays: Record<number, MasteryOverlay> = {};
    const tree = buildMasteryTree(percents, overlays, NAMES);

    const byId = Object.fromEntries(tree.map((t) => [t.labId, t]));
    expect(byId[1].status).toBe('mastered');
    expect(byId[2].status).toBe('in_progress');
    expect(byId[3].status).toBe('available'); // 1 mastered -> unlocked
    expect(byId[11].status).toBe('locked');
    expect(byId[11].blockedBy.sort()).toEqual([3, 7]);
    expect(countMastered(tree)).toBe(1);
  });

  it('keeps mastery sticky via overlay even if percent later drops', () => {
    const percents = { 1: 10 };
    const overlays: Record<number, MasteryOverlay> = {
      1: { labId: 1, masteredAt: '2026-01-01', expertUnlocked: true, certificateIssued: true, certificateApproved: false },
    };
    const tree = buildMasteryTree(percents, overlays, { 1: 'What IS AI?' });
    expect(tree[0].status).toBe('mastered');
    expect(tree[0].expertUnlocked).toBe(true);
    expect(tree[0].certificate.issued).toBe(true);
    expect(tree[0].certificate.parentApproved).toBe(false);
  });
});

describe('claim + greeting', () => {
  it('can claim only when mastered and not yet certified', () => {
    expect(canClaimMastery(90, undefined)).toBe(true);
    expect(canClaimMastery(50, undefined)).toBe(false);
    const issued: MasteryOverlay = { labId: 1, masteredAt: 'x', expertUnlocked: true, certificateIssued: true, certificateApproved: false };
    expect(canClaimMastery(90, issued)).toBe(false);
  });

  it('adapts greeting to mastered count', () => {
    expect(getMasteryGreeting(0, 11)).toMatch(/first certificate/i);
    expect(getMasteryGreeting(3, 11)).toMatch(/3 of 11/i);
    expect(getMasteryGreeting(11, 11)).toMatch(/all 11/i);
  });
});
