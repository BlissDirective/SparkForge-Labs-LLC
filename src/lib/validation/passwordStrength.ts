// ════════════════════════════════════════════════════════════════
// passwordStrength — UX-MED-004 (Opt A)
// ════════════════════════════════════════════════════════════════
// Pure password scoring — zero dependencies, zero bundle cost.
// Score ranges 0–5 and exactly matches the rules enforced server-
// side by passwordSignupSchema (src/lib/validation/authSchemas.ts)
// which was tightened in Phase 3 Part 1 AUTH-MED-001.
//
// Rules (each contributes +1 to the score when satisfied):
//   1. length >= 8
//   2. contains at least one uppercase letter
//   3. contains at least one lowercase letter
//   4. contains at least one digit
//   5. contains at least one of the approved special characters
//
// Max score: 5. A password scoring 5 is guaranteed to satisfy the
// full signup zod schema — there's a one-to-one mapping between
// rules here and regexes there.

export interface PasswordRuleResult {
  /** Stable identifier — used as React key. */
  id: 'length' | 'uppercase' | 'lowercase' | 'digit' | 'special';
  /** Human-readable label shown in the UI. */
  label: string;
  /** Whether this rule is satisfied by the current password. */
  satisfied: boolean;
}

export interface PasswordScore {
  /** Number of rules satisfied, 0..5. */
  score: number;
  /** Per-rule breakdown. */
  rules: PasswordRuleResult[];
  /** Strength bucket derived from score — used for the progress bar color. */
  strength: 'none' | 'weak' | 'fair' | 'good' | 'strong';
}

// Must exactly match the regex in passwordSignupSchema.
const SPECIAL_CHAR_RE = /[!@#$%^&*(),.?":{}|<>]/;

export function scorePassword(pw: string): PasswordScore {
  const rules: PasswordRuleResult[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      satisfied: pw.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter (A-Z)',
      satisfied: /[A-Z]/.test(pw),
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter (a-z)',
      satisfied: /[a-z]/.test(pw),
    },
    {
      id: 'digit',
      label: 'One number (0-9)',
      satisfied: /[0-9]/.test(pw),
    },
    {
      id: 'special',
      label: 'One special character (! @ # $ % …)',
      satisfied: SPECIAL_CHAR_RE.test(pw),
    },
  ];

  const score = rules.reduce((n, r) => n + (r.satisfied ? 1 : 0), 0);

  // Empty inputs get 'none' explicitly so the meter renders a neutral
  // "no signal" bar rather than "weak — type to continue".
  let strength: PasswordScore['strength'];
  if (pw.length === 0) strength = 'none';
  else if (score <= 1) strength = 'weak';
  else if (score === 2) strength = 'fair';
  else if (score === 3 || score === 4) strength = 'good';
  else strength = 'strong';

  return { score, rules, strength };
}

/**
 * True when the password satisfies all 5 rules — exactly the set
 * enforced by passwordSignupSchema. Consumers that need the full
 * rule breakdown for UI display should call scorePassword() instead.
 */
export function isPasswordValid(pw: string): boolean {
  return scorePassword(pw).score === 5;
}
