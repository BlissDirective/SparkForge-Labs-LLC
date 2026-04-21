'use client';

// ════════════════════════════════════════════════════════════════
// PasswordStrengthMeter — UX-MED-004 (Opt A)
// ════════════════════════════════════════════════════════════════
// Live password strength indicator. Five-segment bar (one per
// enforcement rule) + a checklist with green checkmark as each rule
// becomes satisfied. Driven by src/lib/validation/passwordStrength.ts
// so rules stay in exact lock-step with the server-side signup zod
// schema.
//
// Rendered as plain HTML. In the 3D SignupPanel3D it's mounted via
// drei's <Html> transform below the password field.

import { Check } from 'lucide-react';
import { scorePassword, type PasswordScore } from '@/lib/validation/passwordStrength';

const STRENGTH_LABEL: Record<PasswordScore['strength'], string> = {
  none: 'Start typing',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

const STRENGTH_COLOR: Record<PasswordScore['strength'], string> = {
  none: 'bg-white/15',
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  good: 'bg-blue-500',
  strong: 'bg-emerald-500',
};

const STRENGTH_TEXT: Record<PasswordScore['strength'], string> = {
  none: 'text-white/40',
  weak: 'text-red-400',
  fair: 'text-amber-400',
  good: 'text-blue-400',
  strong: 'text-emerald-400',
};

interface PasswordStrengthMeterProps {
  /** The password to evaluate. */
  password: string;
  /** Optional className passed through to the outer wrapper. */
  className?: string;
  /**
   * When true, the rule checklist is only shown once the user has
   * typed at least one character (avoids a wall of red on an empty
   * signup form). Default: true.
   */
  hideRulesUntilTyped?: boolean;
}

export function PasswordStrengthMeter({
  password,
  className,
  hideRulesUntilTyped = true,
}: PasswordStrengthMeterProps) {
  const { score, rules, strength } = scorePassword(password);
  const showRules = !hideRulesUntilTyped || password.length > 0;

  return (
    <div
      className={`w-full ${className ?? ''}`}
      role="group"
      aria-label="Password strength"
    >
      {/* Five-segment progress bar */}
      <div
        className="flex gap-1"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              i < score ? STRENGTH_COLOR[strength] : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <div
        className={`mt-2 flex items-center justify-between font-body text-xs ${STRENGTH_TEXT[strength]}`}
      >
        <span>Password strength: {STRENGTH_LABEL[strength]}</span>
        <span
          className="text-white/40"
          aria-live="polite"
          aria-atomic="true"
        >
          {score}/5
        </span>
      </div>

      {/* Per-rule checklist */}
      {showRules && (
        <ul className="mt-3 space-y-1.5" role="list">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className={`flex items-center gap-2 font-body text-xs transition-colors ${
                rule.satisfied ? 'text-emerald-400' : 'text-white/40'
              }`}
            >
              <span
                className={`flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-full ${
                  rule.satisfied
                    ? 'bg-emerald-500/20'
                    : 'border border-white/20'
                }`}
                aria-hidden="true"
              >
                {rule.satisfied && (
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                )}
              </span>
              <span>
                {rule.label}
                <span className="sr-only">
                  {rule.satisfied ? ' — satisfied' : ' — not yet satisfied'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
