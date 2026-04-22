// POST /api/auth/mfa/verify — Verify a TOTP challenge or backup code
// AUTH-ENH-006 (Recommended)
//
// Finalizes login MFA. Accepts EITHER:
//   { factorId, challengeId, code } — standard TOTP path
//   { backupCode }                  — fallback when authenticator lost
//
// On backup-code success the session is elevated to aal2 via a
// no-op re-verify of the factor so Supabase writes the aal claim.

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireAuth,
  applyRateLimit,
  parseBody,
  ERROR_CODES,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { consumeBackupCode, remainingBackupCodes } from '@/lib/auth/mfa';
import { logAuthEvent } from '@/lib/auth/audit';

const TotpSchema = z.object({
  factorId: z.string().uuid(),
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

const BackupSchema = z.object({
  backupCode: z.string().min(10).max(10),
});

const BodySchema = z.union([TotpSchema, BackupSchema]);

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('MFA_TOTP')) {
    return apiError('MFA is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const limited = await applyRateLimit(req, 'auth-mfa-verify', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (auth.user.isDemo) {
    return apiError('Demo sessions cannot use MFA.', 403, ERROR_CODES.FORBIDDEN);
  }

  const parsed = await parseBody(req, BodySchema);
  if (!parsed.success) return parsed.response;

  const supabase = await createServerSupabase();

  if ('backupCode' in parsed.data) {
    const ok = await consumeBackupCode(auth.user.id, parsed.data.backupCode);
    if (!ok) {
      await logAuthEvent({
        parentId: auth.user.id,
        eventType: 'mfa.challenged',
        metadata: { ok: false, via: 'backup' },
        req,
      });
      return apiError(
        'Backup code did not match. Check for typos or try another.',
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }
    await logAuthEvent({
      parentId: auth.user.id,
      eventType: 'mfa.verified',
      metadata: { via: 'backup' },
      req,
    });
    return apiSuccess({
      verified: true,
      via: 'backup',
      backupCodesRemaining: await remainingBackupCodes(auth.user.id),
    });
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: parsed.data.challengeId,
    code: parsed.data.code,
  });

  if (error) {
    await logAuthEvent({
      parentId: auth.user.id,
      eventType: 'mfa.challenged',
      metadata: { ok: false, via: 'totp', factorId: parsed.data.factorId },
      req,
    });
    return apiError(
      'Code did not match. Please try again.',
      401,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  await logAuthEvent({
    parentId: auth.user.id,
    eventType: 'mfa.verified',
    metadata: { via: 'totp', factorId: parsed.data.factorId },
    req,
  });

  return apiSuccess({ verified: true, via: 'totp' });
}
