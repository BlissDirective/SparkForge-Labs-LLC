// POST /api/auth/passkeys/authenticate-options
// AUTH-ENH Passkey / WebAuthn (Ultra) — Phase 5 task #3
//
// Generate a PublicKeyCredentialRequestOptions blob for login. Unlike
// register-options, the caller may be unauthenticated — they can pass
// a `parentEmail` to target a specific account, or omit it for discovery
// (conditional-UI autofill) mode.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api-helpers';
import { startPasskeyAuthentication } from '@/lib/auth/passkey-server';
import { createAdminClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

const BodySchema = z.object({
  parentEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('PASSKEY_AUTH')) {
    return apiError('Passkey auth is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  // Discovery mode — no email supplied. Serve an options blob with no
  // `allowCredentials`, letting the authenticator autofill from its
  // resident keys. Challenge is still tracked; bind it to a synthetic
  // key so verify can find it.
  if (!parsed.data.parentEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const rpId = new URL(appUrl).hostname;
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      userVerification: 'preferred',
    });
    // In discovery mode we persist the challenge keyed to '__discovery__'
    // — verify-authentication will look it up by the credential's
    // parent_id resolved from the submitted credentialId.
    const admin = createAdminClient();
    await admin.from('passkey_challenges').upsert({
      parent_id: '00000000-0000-0000-0000-000000000000',
      kind: 'authentication',
      challenge: options.challenge,
      expected_origin: appUrl.replace(/\/$/, ''),
      expected_rp_id: rpId,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    return apiSuccess({ options, discovery: true });
  }

  // Targeted mode — look up parentId by email.
  const admin = createAdminClient();
  const { data: parent } = await admin
    .from('parents')
    .select('id')
    .eq('email', parsed.data.parentEmail.toLowerCase())
    .maybeSingle();
  if (!parent) {
    // Do not leak account existence: return a generic "no passkey" error
    // that matches what we'd return for a real account with no passkeys.
    return apiError('No passkey is registered for that account.', 404, 'NO_PASSKEY');
  }

  try {
    const options = await startPasskeyAuthentication(parent.id);
    return apiSuccess({ options, discovery: false });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : 'Failed to generate authentication options',
      500,
      'PASSKEY_AUTH_OPTIONS_FAILED',
    );
  }
}
