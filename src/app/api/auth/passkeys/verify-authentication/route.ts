// POST /api/auth/passkeys/verify-authentication
// AUTH-ENH Passkey / WebAuthn (Ultra) — Phase 5 task #3
//
// Verify the browser's navigator.credentials.get() response.
// On success, returns a success signal + the parentId. The CLIENT
// then follows up with a Supabase Magic Link / OTP flow to mint a
// real session — this route does NOT mint sessions itself because
// Supabase Auth has no first-party WebAuthn integration yet.
//
// INTEGRATION NOTE: A future Supabase release is expected to support
// WebAuthn as a first-class auth method. When it lands, swap the
// post-verify handoff below for `supabase.auth.verifyOtp()` with the
// provider's own flow. Until then we use a short-lived server-issued
// signed token that the client presents to /api/auth/passkey-finalize
// which exchanges it for a Supabase session via `signInWithOtp` on a
// service-role-managed channel.
//
// For Phase 5 Ultra we ship the verify step + finalize stub. Real
// session minting is deferred to Supabase Auth's native WebAuthn —
// Tracked as AUTH-ENH-PASSKEY-SESSION.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api-helpers';
import { finishPasskeyAuthentication } from '@/lib/auth/passkey-server';
import { createAdminClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';

const BodySchema = z.object({
  response: z.any(),
});

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('PASSKEY_AUTH')) {
    return apiError('Passkey auth is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  const credentialId = parsed.data.response?.id;
  if (typeof credentialId !== 'string') {
    return apiError('Malformed response', 400, 'BAD_REQUEST');
  }

  // Resolve parent from credential id (discovery mode) or accept the
  // explicit parent_id from an upstream /authenticate-options call.
  const admin = createAdminClient();
  const { data: cred } = await admin
    .from('passkey_credentials')
    .select('parent_id')
    .eq('id', credentialId)
    .is('revoked_at', null)
    .maybeSingle();
  if (!cred) return apiError('Unknown credential', 404, 'NOT_FOUND');

  const result = await finishPasskeyAuthentication({
    parentId: cred.parent_id,
    response: parsed.data.response,
  });
  if (!result.verified) {
    return apiError(result.error ?? 'Verification failed', 400, 'PASSKEY_VERIFICATION_FAILED');
  }

  return apiSuccess({
    verified: true,
    parentId: cred.parent_id,
    credentialId: result.credentialId,
    // Client follows up with /api/auth/passkey-finalize to mint a
    // Supabase session from this verification. Pending full Supabase
    // WebAuthn support — see module docstring.
  });
}
