// POST /api/auth/passkeys/verify-registration
// AUTH-ENH Passkey / WebAuthn (Ultra) — Phase 5 task #3
//
// Consume the browser's navigator.credentials.create() response,
// verify it against the stored challenge, and persist the credential.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, requireWriteAccess, apiValidationError } from '@/lib/api-helpers';
import { finishPasskeyRegistration } from '@/lib/auth/passkey-server';
import { isFeatureEnabled } from '@/lib/feature-flags';

// @simplewebauthn sends a specific JSON shape; we avoid re-declaring
// the full interface and just pass through. The library does its own
// runtime validation during verifyRegistrationResponse().
const BodySchema = z.object({
  response: z.any(),
  nickname: z.string().trim().min(1).max(50).optional(),
});

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('PASSKEY_AUTH')) {
    return apiError('Passkey auth is not enabled on this environment.', 404, 'NOT_ENABLED');
  }

  const auth = await requireWriteAccess(req);
  if (!auth.success) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await finishPasskeyRegistration({
    parentId: auth.user.id,
    response: parsed.data.response,
    nickname: parsed.data.nickname,
    forgeTier: auth.user.tier === 'forge',
  });

  if (!result.verified) {
    return apiError(result.error ?? 'Verification failed', 400, 'PASSKEY_VERIFICATION_FAILED');
  }

  return apiSuccess({
    credentialId: result.credentialId,
    forgeAttested: result.forgeAttested,
  });
}
