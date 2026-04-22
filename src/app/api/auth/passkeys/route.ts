// GET /api/auth/passkeys       — list the caller's registered passkeys
// DELETE /api/auth/passkeys    — revoke one (body: { credentialId })
// AUTH-ENH Passkey / WebAuthn (Ultra) — Phase 5 task #3
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, requireWriteAccess, apiValidationError } from '@/lib/api-helpers';
import { listPasskeys, revokePasskey } from '@/lib/auth/passkey-server';
import { getAuthenticatorModel } from '@/lib/auth/fido-mds';
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function GET(req: NextRequest) {
  if (!isFeatureEnabled('PASSKEY_AUTH')) {
    return apiError('Passkey auth is not enabled on this environment.', 404, 'NOT_ENABLED');
  }
  const auth = await requireWriteAccess(req);
  if (!auth.success) return auth.response;

  const passkeys = await listPasskeys(auth.user.id);
  return apiSuccess({
    passkeys: passkeys.map((p) => ({
      ...p,
      authenticatorModel: getAuthenticatorModel(p.aaguid),
    })),
  });
}

const DeleteSchema = z.object({
  credentialId: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  if (!isFeatureEnabled('PASSKEY_AUTH')) {
    return apiError('Passkey auth is not enabled on this environment.', 404, 'NOT_ENABLED');
  }
  const auth = await requireWriteAccess(req);
  if (!auth.success) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  const revoked = await revokePasskey(auth.user.id, parsed.data.credentialId);
  if (!revoked) return apiError('Passkey not found or already revoked', 404, 'NOT_FOUND');

  return apiSuccess({ revoked: true });
}
