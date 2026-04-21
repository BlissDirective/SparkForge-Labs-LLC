'use client';

// ════════════════════════════════════════════════════════════════
// useFieldValidation — P2 §8.10 (Opt B)
// ════════════════════════════════════════════════════════════════
// Reusable "onTouched" validation for form fields that don't use
// react-hook-form (our 3D auth panels use R3F + custom Input3D
// components, so adopting rhf would require rebuilding those).
//
// Behavior contract (rhf `mode: 'onTouched'` parity):
//
//   1. Before the field is touched (first blur), NO error shown
//      even if value is invalid — don't yell at the user mid-type.
//   2. On first blur, validate and show error (or green state).
//   3. After first blur, every onChange re-validates live so the
//      error clears as the user fixes it, not only after another
//      blur.
//
// The hook is Zod-native: pass any ZodSchema and the hook will
// surface the schema's error messages directly.
//
// Usage inside a 3D panel:
//
//   const email = useFieldValidation('', emailSchema);
//   <Input3D
//     value={email.value}
//     onChange={email.onChange}
//     onBlur={email.onBlur}
//     errorMessage={email.showError ? email.error : undefined}
//   />
//
// Multiple hooks can be composed via `useFormValidation` below for
// whole-form submit gating.
// ════════════════════════════════════════════════════════════════

import { useCallback, useMemo, useState } from 'react';
import type { ZodSchema } from 'zod';

export interface FieldValidation<T> {
  /** The current raw value. */
  value: T;
  /** Set the value (pass this as onChange). */
  onChange: (next: T) => void;
  /** Mark the field as touched (pass this as onBlur). */
  onBlur: () => void;
  /** The current validation error message, or null if valid. */
  error: string | null;
  /** Whether the user has interacted with the field. */
  isTouched: boolean;
  /** Whether the value passes the schema right now. */
  isValid: boolean;
  /** Convenience: show error only after first touch (onTouched rule). */
  showError: boolean;
  /** Reset the field back to initial state. */
  reset: () => void;
  /** Force validation display (e.g. on submit even if never touched). */
  forceValidate: () => void;
}

export function useFieldValidation<T>(
  initial: T,
  schema: ZodSchema<T>,
): FieldValidation<T> {
  const [value, setValue] = useState<T>(initial);
  const [isTouched, setIsTouched] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  const parse = useMemo(() => {
    const result = schema.safeParse(value);
    if (result.success) return { valid: true, error: null };
    // Zod error → first issue's message for single-field display.
    const first = result.error.issues[0]?.message ?? 'Invalid input';
    return { valid: false, error: first };
  }, [schema, value]);

  const onChange = useCallback((next: T) => {
    setValue(next);
  }, []);

  const onBlur = useCallback(() => {
    setIsTouched(true);
  }, []);

  const reset = useCallback(() => {
    setValue(initial);
    setIsTouched(false);
    setForceShow(false);
  }, [initial]);

  const forceValidate = useCallback(() => {
    setForceShow(true);
    setIsTouched(true);
  }, []);

  return {
    value,
    onChange,
    onBlur,
    error: parse.error,
    isTouched,
    isValid: parse.valid,
    showError: (isTouched || forceShow) && !parse.valid,
    reset,
    forceValidate,
  };
}

/**
 * Compose multiple useFieldValidation hooks into form-level helpers.
 * Call `forceValidateAll()` on submit so untouched-but-empty fields
 * light up errors instead of silently failing submission.
 */
export function useFormValidation<F extends Record<string, FieldValidation<unknown>>>(
  fields: F,
): {
  isFormValid: boolean;
  forceValidateAll: () => void;
  resetAll: () => void;
} {
  const isFormValid = Object.values(fields).every((f) => f.isValid);
  const forceValidateAll = useCallback(() => {
    Object.values(fields).forEach((f) => f.forceValidate());
  }, [fields]);
  const resetAll = useCallback(() => {
    Object.values(fields).forEach((f) => f.reset());
  }, [fields]);
  return { isFormValid, forceValidateAll, resetAll };
}
