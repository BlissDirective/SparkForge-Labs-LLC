// GET /api/auth/mfa/factors — List the caller's MFA factors
// AUTH-ENH-006 (Recommended)

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireAuth,
  ERROR_CODES,
} from '@/lib/api-helpers';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { remainingBackupCodes } from '@/lib/auth/mfa';

export interface MfaFactorSummary {
  id: string;
  factorType: string;
  friendlyName: string | null;
  status: string;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  if (!isFeatureEnabled('MFA_TOTP')) {
    return apiError('MFA is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (auth.user.isDemo) {
    return apiError('Demo sessions cannot use MFA.', 403, ERROR_CODES.FORBIDDEN);
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) {
    console.error('[mfa/factors] error:', error);
    return apiError('Could not load MFA factors.', 500, ERROR_CODES.SERVER_ERROR);
  }

  const factors: MfaFactorSummary[] = (data.all ?? []).map((f) => ({
    id: f.id,
    factorType: f.factor_type,
    friendlyName: f.friendly_name ?? null,
    status: f.status,
    createdAt: f.created_at,
  }));

  const remaining = await remainingBackupCodes(auth.user.id);

  return apiSuccess({
    factors,
    backupCodesRemaining: remaining,
  });
}
