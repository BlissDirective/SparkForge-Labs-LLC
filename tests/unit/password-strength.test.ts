// ════════════════════════════════════════════════════════════════
// Unit tests — UX-MED-004 (Opt A) scorePassword + isPasswordValid
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  scorePassword,
  isPasswordValid,
} from '@/lib/validation/passwordStrength';

describe('scorePassword — UX-MED-004 (A)', () => {
  it('empty string → score 0, strength none', () => {
    const r = scorePassword('');
    expect(r.score).toBe(0);
    expect(r.strength).toBe('none');
    expect(r.rules.every((x) => !x.satisfied)).toBe(true);
  });

  it('only lowercase letters (short) → score 1, weak', () => {
    const r = scorePassword('abc');
    expect(r.score).toBe(1);
    expect(r.strength).toBe('weak');
  });

  it('long lowercase-only → length + lowercase rules only → score 2, fair', () => {
    const r = scorePassword('abcdefghij');
    expect(r.score).toBe(2);
    expect(r.strength).toBe('fair');
  });

  it('"Password1" → 4 rules (missing special) → good', () => {
    const r = scorePassword('Password1');
    expect(r.score).toBe(4);
    expect(r.strength).toBe('good');
    const special = r.rules.find((x) => x.id === 'special')!;
    expect(special.satisfied).toBe(false);
  });

  it('"Password1!" → all 5 rules → strong', () => {
    const r = scorePassword('Password1!');
    expect(r.score).toBe(5);
    expect(r.strength).toBe('strong');
    expect(r.rules.every((x) => x.satisfied)).toBe(true);
  });

  it('special characters match the exact signup regex set', () => {
    // Each of these is in the enforced regex [!@#$%^&*(),.?":{}|<>]
    const specials = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];
    for (const c of specials) {
      const r = scorePassword(`Aa1${c}12345`);
      const special = r.rules.find((x) => x.id === 'special')!;
      expect(special.satisfied, `"${c}" should count as special`).toBe(true);
    }
  });

  it('rejects characters outside the approved set as NOT special', () => {
    // `[`, `]`, `-`, `=`, `+`, `_`, `/`, `\`, `;` are NOT in the regex
    const rejected = ['[', ']', '-', '=', '+', '_', '/', '\\', ';'];
    for (const c of rejected) {
      const r = scorePassword(`Aa1${c}12345`);
      const special = r.rules.find((x) => x.id === 'special')!;
      expect(special.satisfied, `"${c}" should NOT count as special`).toBe(false);
    }
  });

  it('short password with all charclasses → score 4 (no length), strength good', () => {
    const r = scorePassword('Ab1!');
    expect(r.score).toBe(4);
    expect(r.strength).toBe('good');
    const length = r.rules.find((x) => x.id === 'length')!;
    expect(length.satisfied).toBe(false);
  });
});

describe('isPasswordValid', () => {
  it('returns true only for passwords that satisfy all 5 rules', () => {
    expect(isPasswordValid('Password1!')).toBe(true);
    expect(isPasswordValid('Password1')).toBe(false); // no special
    expect(isPasswordValid('password1!')).toBe(false); // no uppercase
    expect(isPasswordValid('PASSWORD1!')).toBe(false); // no lowercase
    expect(isPasswordValid('Password!')).toBe(false); // no digit
    expect(isPasswordValid('Pa1!')).toBe(false); // too short
    expect(isPasswordValid('')).toBe(false);
  });
});
