// ════════════════════════════════════════════════════════════════
// P2 §8.10 — useFieldValidation onTouched contract
// ════════════════════════════════════════════════════════════════
// Locks in the 3-rule onTouched behavior:
//   1. Before first blur: no error shown even if invalid.
//   2. On first blur: error surfaces if invalid.
//   3. After first blur: live onChange re-validates so the error
//      clears as the user fixes it.

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  useFieldValidation,
  useFormValidation,
} from '@/hooks/useFieldValidation';

const emailSchema = z
  .string()
  .min(1, 'required')
  .email('invalid email');

describe('P2 §8.10 — useFieldValidation', () => {
  it('starts clean: not touched, no showError even with invalid initial', () => {
    const { result } = renderHook(() => useFieldValidation('not-an-email', emailSchema));
    expect(result.current.isTouched).toBe(false);
    expect(result.current.isValid).toBe(false);
    expect(result.current.showError).toBe(false);
    expect(result.current.error).toBe('invalid email');
  });

  it('onBlur flips isTouched + surfaces showError if invalid', () => {
    const { result } = renderHook(() => useFieldValidation('', emailSchema));
    act(() => result.current.onBlur());
    expect(result.current.isTouched).toBe(true);
    expect(result.current.showError).toBe(true);
    expect(result.current.error).toBe('required');
  });

  it('onBlur does NOT show error when valid', () => {
    const { result } = renderHook(() => useFieldValidation('ok@example.com', emailSchema));
    act(() => result.current.onBlur());
    expect(result.current.isTouched).toBe(true);
    expect(result.current.showError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('after first blur, onChange re-validates live', () => {
    const { result } = renderHook(() => useFieldValidation('', emailSchema));
    // Step 1: touch the empty field → "required"
    act(() => result.current.onBlur());
    expect(result.current.showError).toBe(true);

    // Step 2: user types a partial value → still invalid → error persists
    act(() => result.current.onChange('foo'));
    expect(result.current.showError).toBe(true);
    expect(result.current.error).toBe('invalid email');

    // Step 3: user completes the email → error clears live (no blur)
    act(() => result.current.onChange('foo@bar.com'));
    expect(result.current.showError).toBe(false);
    expect(result.current.isValid).toBe(true);
  });

  it('forceValidate shows error even without prior blur', () => {
    const { result } = renderHook(() => useFieldValidation('', emailSchema));
    expect(result.current.showError).toBe(false);
    act(() => result.current.forceValidate());
    expect(result.current.showError).toBe(true);
    expect(result.current.isTouched).toBe(true);
  });

  it('reset returns to pristine state', () => {
    const { result } = renderHook(() => useFieldValidation('', emailSchema));
    act(() => {
      result.current.onBlur();
      result.current.onChange('x');
    });
    expect(result.current.isTouched).toBe(true);
    act(() => result.current.reset());
    expect(result.current.isTouched).toBe(false);
    expect(result.current.value).toBe('');
    expect(result.current.showError).toBe(false);
  });
});

describe('P2 §8.10 — useFormValidation composition', () => {
  it('isFormValid is true only when every field is valid', () => {
    const { result } = renderHook(() => {
      const email = useFieldValidation('ok@example.com', emailSchema);
      const other = useFieldValidation('', z.string().min(1, 'required'));
      return { email, other, form: useFormValidation({ email, other }) };
    });
    expect(result.current.form.isFormValid).toBe(false);
    act(() => result.current.other.onChange('filled'));
    expect(result.current.form.isFormValid).toBe(true);
  });
});
