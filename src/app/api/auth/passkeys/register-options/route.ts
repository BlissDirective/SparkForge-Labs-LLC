// POST /api/auth/passkeys/register-options
// AUTH-ENH Passkey / WebAuthn (Ultra) — Phase 5 task #3
//
// Generate a PublicKeyCredentialCreationOptions blob for the browser
// to pass to navigator.credentials.create(). Caller must be logged in
// (real parent session, not demo).
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, requireWriteAccess, sanitizeErrorMessage } from '@/lib/api-helpers';
import { startPasskeyRegistration } from '@/lib/auth/passkey-server';
import { createAdminClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('PASSKEY_AUTH')) {
    return apiError('Passkey auth is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const auth = await requireWriteAccess(req);
  if (!auth.success) return auth.response;

  // Fetch existing credentials to exclude from registration so the
  // same authenticator is not registered twice.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('passkey_credentials')
    .select('id')
    .eq('parent_id', auth.user.id)
    .is('revoked_at', null);
  const existingIds = (existing ?? []).map((r) => r.id);

  try {
    const options = await startPasskeyRegistration({
      parentId: auth.user.id,
      parentEmail: auth.user.email,
      existingCredentialIds: existingIds,
      forgeTier: auth.user.tier === 'forge',
    });
    return apiSuccess({ options });
  } catch (err) {
    console.error('[passkeys] register-options failed:', err);
    return apiError(
      sanitizeErrorMessage(err, 'Failed to generate registration options'),
      500,
      'PASSKEY_REGISTER_OPTIONS_FAILED',
    );
  }
}
