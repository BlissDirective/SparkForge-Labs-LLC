// POST /api/auth/consent — Record COPPA parental consent (Step 3)
// S3-HIGH-001: Consent is recorded ONLY when the parent explicitly confirms
// the COPPA checkbox in Step 3 of signup. This ensures coppa_consent_at
// reflects the actual moment of consent, not account creation time.
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { CoppaConsentSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, CoppaConsentSchema);
  if (!parsed.success) return parsed.response;

  const { email } = parsed.data;

  const supabase = createAdminClient();

  // Find the parent by email and set consent timestamp
  const { data, error } = await supabase
    .from('parents')
    .update({ coppa_consent_at: new Date().toISOString() })
    .eq('email', email)
    .is('coppa_consent_at', null)
    .select('id')
    .single();

  if (error || !data) {
    return apiError('Unable to record consent. Account may not exist or consent already recorded.', 400);
  }

  return apiSuccess({ consentRecorded: true });
}
