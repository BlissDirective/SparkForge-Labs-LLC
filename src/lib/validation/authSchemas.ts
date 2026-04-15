// ════════════════════════════════════════════════════════════════════
// authSchemas — Phase 5 P.8-MAX (§8.10)
// ════════════════════════════════════════════════════════════════════
// Zod schemas for auth forms (login, signup, reset password, child
// profile creation). Centralized so the same rules apply across:
//   - 3D panels (LoginPanel3D, SignupPanel3D, ResetPasswordPanel3D)
//   - any future HTML fallback auth forms
//   - server-side API route validation
//
// Error messages are child-family-friendly: no technical jargon, always
// actionable ("Use at least 8 characters" not "minLength 8 violated").
// ════════════════════════════════════════════════════════════════════

import { z } from 'zod';

// ─── Field schemas (reused) ────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your email')
  .email('That doesn\'t look like a valid email. Double-check and try again.');

export const passwordLoginSchema = z
  .string()
  .min(1, 'Please enter your password');

// Stricter password rules on signup: 8+ chars, 1 uppercase, 1 lowercase, 1 number.
// No special-character requirement (friction for kids' parents).
export const passwordSignupSchema = z
  .string()
  .min(8, 'Use at least 8 characters for security')
  .regex(/[A-Z]/, 'Include at least one uppercase letter (A-Z)')
  .regex(/[a-z]/, 'Include at least one lowercase letter (a-z)')
  .regex(/[0-9]/, 'Include at least one number (0-9)');

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Please enter a display name')
  .max(20, 'Display name must be 20 characters or less');

// ─── Form schemas ──────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSignupSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const childProfileSchema = z.object({
  displayName: displayNameSchema,
});
export type ChildProfileInput = z.infer<typeof childProfileSchema>;

export const coppaConsentSchema = z.object({
  coppaChecked: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm you are 18 or older to continue.' }),
  }),
});

// ─── Helper: convert a ZodError into field → first message map ─────

export type FieldErrors<T extends Record<string, unknown>> = Partial<
  Record<keyof T, string>
>;

/**
 * Run a Zod schema; return null on success or a { field: message } map
 * suitable for direct display next to each input.
 *
 * @example
 *   const errors = validateForm(loginSchema, { email, password });
 *   if (errors) {
 *     setFieldErrors(errors);
 *     return;
 *   }
 */
export function validateForm<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): FieldErrors<z.infer<T>> | null {
  const result = schema.safeParse(data);
  if (result.success) return null;

  const errors: FieldErrors<z.infer<T>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof z.infer<T>;
    // Only keep the FIRST error per field — avoid overwhelming the user
    // with 4 messages on a complex password regex failure.
    if (field !== undefined && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

/**
 * Validate a single field for live blur feedback. Returns the error
 * message string, or null if valid.
 */
export function validateField<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): string | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Invalid input';
}
