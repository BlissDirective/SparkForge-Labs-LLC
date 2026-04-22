// POST /api/auth/mfa/verify-enrollment — Finalize TOTP enrollment
// AUTH-ENH-006 (Recommended)
//
// Client sends { factorId, code }. Server creates a challenge + verifies
// it atomically. On success the factor transitions to 'verified' and
// Supabase begins requiring AAL2 on sign-in. We also persist 8 fresh
// backup codes and return the plaintext once.

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireWriteAccess,
  applyRateLimit,
  parseBody,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { persistBackupCodesForParent } from '@/lib/auth/mfa';
import { logAuthEvent } from '@/lib/auth/audit';

const Schema = z.object({
  factorId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, 'TOTP code must be 6 digits'),
});

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('MFA_TOTP')) {
    return apiError('MFA is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const limited = await applyRateLimit(req, 'auth-mfa-verify-enroll', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const auth = await requireWriteAccess(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, Schema);
  if (!parsed.success) return parsed.response;

  const supabase = await createServerSupabase();

  // Supabase challengeAndVerify does both in one round-trip — no
  // challenge row to persist client-side during enrollment.
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: parsed.data.factorId,
    code: parsed.data.code,
  });

  if (error || !data) {
    await logAuthEvent({
      parentId: auth.user.id,
      eventType: 'mfa.challenged',
      metadata: { factorId: parsed.data.factorId, ok: false, stage: 'enroll' },
      req,
    });
    return apiError(
      'Code did not match. Double-check the 6-digit code in your authenticator app.',
      401,
      'INVALID_CREDENTIALS',
    );
  }

  // Enrollment successful → generate + store backup codes.
  let backupCodes: string[];
  try {
    backupCodes = await persistBackupCodesForParent(auth.user.id);
  } catch (err) {
    console.error('[mfa/verify-enrollment] backup code persist failed:', err);
    // MFA is enrolled even if backup codes failed — surface the partial
    // success so the client can re-request codes.
    return apiSuccess({
      enrolled: true,
      backupCodes: [],
      backupCodesFailed: true,
    });
  }

  await logAuthEvent({
    parentId: auth.user.id,
    eventType: 'mfa.enrolled',
    metadata: { factorId: parsed.data.factorId, backupCodeCount: backupCodes.length },
    req,
  });

  return apiSuccess({
    enrolled: true,
    backupCodes,
  });
}
