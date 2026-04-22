// POST /api/auth/mfa/challenge — Create a TOTP challenge row
// AUTH-ENH-006 (Recommended)
//
// Called during login after password succeeds but AAL is still aal1.
// Client posts { factorId } (normally the first entry from
// listFactors filtered to status=verified + factor_type=totp).
// Server asks Supabase for a challenge id and returns it.

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

const Schema = z.object({ factorId: z.string().uuid() });

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('MFA_TOTP')) {
    return apiError('MFA is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const limited = await applyRateLimit(req, 'auth-mfa-challenge', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (auth.user.isDemo) {
    return apiError('Demo sessions cannot use MFA.', 403, ERROR_CODES.FORBIDDEN);
  }

  const parsed = await parseBody(req, Schema);
  if (!parsed.success) return parsed.response;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.mfa.challenge({
    factorId: parsed.data.factorId,
  });
  if (error || !data) {
    console.error('[mfa/challenge] error:', error);
    return apiError('Could not start MFA challenge.', 500, ERROR_CODES.SERVER_ERROR);
  }

  return apiSuccess({
    challengeId: data.id,
    expiresAt: data.expires_at,
  });
}
