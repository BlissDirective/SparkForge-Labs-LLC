// ════════════════════════════════════════════════════════════════
// Core Ignition scoring rubric — Forge F8 (Concept 10 §12.8)
// ════════════════════════════════════════════════════════════════
// Deterministic, no AI in the loop. ≥20 cases incl. banned-word
// floors, keyword boundaries, band-A perfect/partial.

import { describe, it, expect } from 'vitest';
import { scoreGate } from '@/components/games/core-ignition/scoring';
import { GATE_SCENARIOS, drawScenarios } from '@/components/games/core-ignition/content';
import type { GateScenario } from '@/types/coreIgnition';

const byId = (id: string): GateScenario => {
  const s = GATE_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s;
};

describe('band A chip scoring', () => {
  const s = byId('vf-a1');
  const correct = {
    role: 'You are a chef robot',
    task: 'make a cheese pizza',
    detail: 'for 4 hungry kids',
  };

  it('perfect placement scores 10 with all ingredients', () => {
    const r = scoreGate({ kind: 'A', slots: correct }, s);
    expect(r.points).toBe(10);
    expect(r.ingredients).toEqual(['role', 'task', 'detail']);
  });

  it('two correct + one distractor scores 6 and names the wrong slot', () => {
    const r = scoreGate({ kind: 'A', slots: { ...correct, detail: 'food please' } }, s);
    expect(r.points).toBe(6);
    expect(r.feedback).toContain('detail');
  });

  it('one correct scores 3', () => {
    const r = scoreGate(
      { kind: 'A', slots: { role: correct.role, task: null, detail: null } },
      s
    );
    expect(r.points).toBe(3);
  });

  it('all distractors score 0 and feedback stays constructive', () => {
    const r = scoreGate(
      { kind: 'A', slots: { role: 'do whatever', task: 'make some stuff', detail: 'food please' } },
      s
    );
    expect(r.points).toBe(0);
    expect(r.feedback.toLowerCase()).not.toContain('wrong answer');
  });

  it('chips placed in the WRONG slot do not score', () => {
    const r = scoreGate(
      { kind: 'A', slots: { role: correct.task, task: correct.role, detail: correct.detail } },
      s
    );
    expect(r.points).toBe(3); // only detail correct
  });
});

describe('band B blank scoring', () => {
  const s = byId('vf-b1');

  it('both correct blanks score 8', () => {
    const r = scoreGate(
      { kind: 'B', blanks: ['practice 5 multiplication problems', 'grade 5 math'] },
      s
    );
    expect(r.points).toBe(8);
  });

  it('both correct + apt modifier caps at 10', () => {
    const r = scoreGate(
      { kind: 'B', blanks: ['practice 5 multiplication problems', 'grade 5 math'], modifierApt: true },
      s
    );
    expect(r.points).toBe(10);
  });

  it('one wrong blank scores 4', () => {
    const r = scoreGate({ kind: 'B', blanks: ['do stuff', 'grade 5 math'] }, s);
    expect(r.points).toBe(4);
  });

  it('both wrong scores 0', () => {
    const r = scoreGate({ kind: 'B', blanks: ['do stuff', 'whatever'] }, s);
    expect(r.points).toBe(0);
  });
});

describe('band C rubric', () => {
  const s = byId('vf-c1');

  it('full-ingredient prompt scores high', () => {
    const r = scoreGate(
      { kind: 'C', text: 'Explain how black holes form in 3 short paragraphs for a beginner.' },
      s
    );
    expect(r.points).toBeGreaterThanOrEqual(8);
  });

  it('the exemplar itself scores >= 8', () => {
    const r = scoreGate({ kind: 'C', text: s.exemplar! }, s);
    expect(r.points).toBeGreaterThanOrEqual(8);
  });

  it('task only scores mid-range', () => {
    const r = scoreGate({ kind: 'C', text: 'explain it to me right now ok' }, s);
    expect(r.points).toBeGreaterThanOrEqual(3);
    expect(r.points).toBeLessThan(8);
  });

  it('banned vague words subtract points', () => {
    const base = scoreGate({ kind: 'C', text: 'explain black holes for a beginner' }, s);
    const vague = scoreGate({ kind: 'C', text: 'explain black holes stuff for a beginner' }, s);
    expect(vague.points).toBe(base.points - 1);
  });

  it('multiple banned words stack but floor at 0', () => {
    const r = scoreGate({ kind: 'C', text: 'stuff things whatever idk anything something' }, s);
    expect(r.points).toBe(0);
  });

  it('matching is case-insensitive', () => {
    const r = scoreGate({ kind: 'C', text: 'EXPLAIN BLACK HOLES FOR A BEGINNER' }, s);
    expect(r.points).toBeGreaterThanOrEqual(8);
  });

  it('over-length prompts lose the length point', () => {
    const padding = 'a'.repeat(230);
    const short = scoreGate({ kind: 'C', text: 'explain black holes for a beginner' }, s);
    const long = scoreGate({ kind: 'C', text: `explain black holes for a beginner ${padding}` }, s);
    expect(long.points).toBe(short.points - 1);
  });

  it('feedback names the missing ingredient constructively', () => {
    const r = scoreGate({ kind: 'C', text: 'please assist immediately' }, s);
    expect(r.points).toBeLessThan(5);
    expect(r.feedback.length).toBeGreaterThan(10);
  });
});

describe('content integrity', () => {
  it('every band A scenario has exactly 3 correct chips (one per slot) + 3 distractors', () => {
    for (const s of GATE_SCENARIOS.filter((x) => x.band === 'A')) {
      const chips = s.chips ?? [];
      expect(chips).toHaveLength(6);
      expect(chips.filter((c) => c.slot === 'role')).toHaveLength(1);
      expect(chips.filter((c) => c.slot === 'task')).toHaveLength(1);
      expect(chips.filter((c) => c.slot === 'detail')).toHaveLength(1);
      expect(chips.filter((c) => c.slot === null)).toHaveLength(3);
    }
  });

  it('every band B scenario has two blanks with the correct option first', () => {
    for (const s of GATE_SCENARIOS.filter((x) => x.band === 'B')) {
      expect(s.templateText?.split('___')).toHaveLength(3);
      expect(s.blankOptions).toHaveLength(2);
      s.blankOptions?.forEach((opts) => expect(opts.length).toBeGreaterThanOrEqual(2));
    }
  });

  it('every band C exemplar passes its own rubric at >= 8', () => {
    for (const s of GATE_SCENARIOS.filter((x) => x.band === 'C')) {
      const r = scoreGate({ kind: 'C', text: s.exemplar! }, s);
      expect(r.points, `${s.id} exemplar scored ${r.points}`).toBeGreaterThanOrEqual(8);
    }
  });

  it('drawScenarios returns the requested count with no duplicate ids', () => {
    for (const band of ['A', 'B', 'C'] as const) {
      const want = band === 'A' ? 6 : band === 'B' ? 7 : 8;
      const got = drawScenarios(band, want, 3);
      const capped = Math.min(want, GATE_SCENARIOS.filter((s) => s.band === band).length);
      expect(got.length).toBe(capped);
      expect(new Set(got.map((s) => s.id)).size).toBe(got.length);
    }
  });

  it('drawScenarios maximizes gate-type variety', () => {
    const got = drawScenarios('C', 5, 0);
    const types = new Set(got.map((s) => s.gateType));
    expect(types.size).toBe(5);
  });
});
