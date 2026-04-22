// POST /api/auth/mfa/enroll — Start TOTP enrollment
// AUTH-ENH-006 (Recommended)
//
// Calls supabase.auth.mfa.enroll({ factorType: 'totp' }) and returns
// the factorId + TOTP secret + QR SVG to the client. The factor is
// in 'unverified' state until the client POSTs a valid first code
// to /api/auth/mfa/verify-enrollment.

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireWriteAccess,
  applyRateLimit,
  ERROR_CODES,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('MFA_TOTP')) {
    return apiError('MFA is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const limited = await applyRateLimit(req, 'auth-mfa-enroll', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const auth = await requireWriteAccess(req);
  if (!auth.success) return auth.response;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'SparkForge TOTP',
  });

  if (error || !data) {
    console.error('[mfa/enroll] error:', error);
    return apiError(
      'Could not start MFA enrollment. Please try again.',
      500,
      ERROR_CODES.SERVER_ERROR,
    );
  }

  // data shape: { id, type, totp: { qr_code (SVG data URL), secret, uri } }
  return apiSuccess({
    factorId: data.id,
    qrCodeSvg: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  });
}
