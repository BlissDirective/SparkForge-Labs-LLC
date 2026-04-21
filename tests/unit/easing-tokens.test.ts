// ════════════════════════════════════════════════════════════════
// P2 §5.9 — Easing token shape + contract
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  SF_EASE_STANDARD,
  SF_EASE_EMPHASIZED,
  SF_EASE_DECELERATE,
  SF_EASE_ACCELERATE,
  SF_EASE_BOUNCE,
  SF_SPRING_GSAP,
  SF_EASINGS,
} from '@/lib/easings';

describe('P2 §5.9 — easing tokens', () => {
  const tokens = [
    SF_EASE_STANDARD,
    SF_EASE_EMPHASIZED,
    SF_EASE_DECELERATE,
    SF_EASE_ACCELERATE,
    SF_EASE_BOUNCE,
  ];

  it('every token has bezier + css + gsap', () => {
    for (const t of tokens) {
      expect(t.bezier).toHaveLength(4);
      t.bezier.forEach((n) => expect(typeof n).toBe('number'));
      expect(t.css).toMatch(/^cubic-bezier\(/);
      expect(typeof t.gsap).toBe('string');
      expect(t.gsap.length).toBeGreaterThan(0);
    }
  });

  it('bezier → css stringification matches tuple order', () => {
    const [a, b, c, d] = SF_EASE_STANDARD.bezier;
    expect(SF_EASE_STANDARD.css).toBe(`cubic-bezier(${a}, ${b}, ${c}, ${d})`);
  });

  it('SF_EASINGS name → token map covers all 5 names', () => {
    expect(Object.keys(SF_EASINGS).sort()).toEqual(
      ['standard', 'emphasized', 'decelerate', 'accelerate', 'bounce'].sort(),
    );
  });

  it('SF_SPRING_GSAP exposes spring params', () => {
    expect(SF_SPRING_GSAP.type).toBe('spring');
    expect(SF_SPRING_GSAP.mass).toBeGreaterThan(0);
    expect(SF_SPRING_GSAP.damping).toBeGreaterThan(0);
    expect(SF_SPRING_GSAP.stiffness).toBeGreaterThan(0);
  });
});
