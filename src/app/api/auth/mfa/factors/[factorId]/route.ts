// DELETE /api/auth/mfa/factors/[factorId] — Unenroll a TOTP factor
// AUTH-ENH-006 (Recommended)
//
// Requires current TOTP code (or backup code) in the request body so
// a stolen session cookie alone cannot disable MFA. This is the
// single most security-sensitive auth operation after password change.

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireWriteAccess,
  applyRateLimit,
  parseBody,
  ERROR_CODES,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { consumeBackupCode } from '@/lib/auth/mfa';
import { logAuthEvent } from '@/lib/auth/audit';

const Schema = z.object({
  code: z.string().min(6).max(12),        // 6-digit TOTP or 10-char backup
  backupCode: z.boolean().optional(),     // hint; server still tries both
});

interface RouteCtx {
  params: Promise<{ factorId: string }>;
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  if (!isFeatureEnabled('MFA_TOTP')) {
    return apiError('MFA is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const limited = await applyRateLimit(req, 'auth-mfa-unenroll', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const auth = await requireWriteAccess(req);
  if (!auth.success) return auth.response;

  const { factorId } = await ctx.params;
  const uuid = z.string().uuid().safeParse(factorId);
  if (!uuid.success) {
    return apiError('Invalid factor id.', 400, 'BAD_REQUEST');
  }

  const parsed = await parseBody(req, Schema);
  if (!parsed.success) return parsed.response;

  const supabase = await createServerSupabase();

  // Try TOTP first (most common path). If the code doesn't look like
  // a TOTP (6 digits) or the TOTP verify fails, try backup codes.
  let verified = false;
  const looksLikeTotp = /^\d{6}$/.test(parsed.data.code);

  if (looksLikeTotp && !parsed.data.backupCode) {
    const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: parsed.data.code,
    });
    verified = !vErr;
  }

  if (!verified) {
    verified = await consumeBackupCode(auth.user.id, parsed.data.code);
  }

  if (!verified) {
    await logAuthEvent({
      parentId: auth.user.id,
      eventType: 'mfa.challenged',
      metadata: { factorId, ok: false, stage: 'unenroll' },
      req,
    });
    return apiError(
      'Code did not match. MFA was not removed.',
      401,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
  if (unenrollError) {
    console.error('[mfa/factors DELETE] unenroll error:', unenrollError);
    return apiError(
      'Could not remove MFA factor. Please try again.',
      500,
      ERROR_CODES.SERVER_ERROR,
    );
  }

  // Clean up backup codes — no factor means backup codes are meaningless.
  try {
    const admin = createAdminClient();
    await admin.from('mfa_backup_codes').delete().eq('parent_id', auth.user.id);
  } catch (err) {
    console.error('[mfa/factors DELETE] backup code cleanup failed:', err);
    // Non-fatal — orphan codes are scoped to parent_id and will be
    // wiped by the next successful enrollment's persist helper.
  }

  await logAuthEvent({
    parentId: auth.user.id,
    eventType: 'mfa.disabled',
    metadata: { factorId },
    req,
  });

  return apiSuccess({ unenrolled: true });
}
