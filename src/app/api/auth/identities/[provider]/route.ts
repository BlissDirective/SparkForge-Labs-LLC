// DELETE /api/auth/identities/[provider] — Unlink a linked OAuth identity
// AUTH-ENH-003 (Max)
//
// Safety:
//   - Rejects unlink if it would leave the account with zero auth
//     methods (last provider + no email/password). This is the only
//     meaningful footgun — otherwise the parent would lock themselves
//     out. Supabase does NOT enforce this on the server side.
//   - Rejects unlink on demo sessions.
//   - Logs 'oauth.unlinked' to auth_events via service-role insert.
//
// The actual Supabase unlink call goes through the authed server
// client so the session user is the implicit subject — no admin
// elevation needed.

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireWriteAccess,
  ERROR_CODES,
} from '@/lib/api-helpers';
import { isOAuthProvider } from '@/lib/auth/oauth';
import { logAuthEvent } from '@/lib/auth/audit';

interface RouteCtx {
  params: Promise<{ provider: string }>;
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireWriteAccess(req);
  if (!auth.success) return auth.response;

  const { provider: rawProvider } = await ctx.params;
  if (!isOAuthProvider(rawProvider)) {
    return apiError('Unsupported OAuth provider', 400, 'BAD_REQUEST');
  }

  const supabase = await createServerSupabase();
  const { data: identitiesData, error: listError } =
    await supabase.auth.getUserIdentities();

  if (listError || !identitiesData?.identities) {
    console.error('[auth/identities] getUserIdentities error:', listError);
    return apiError('Could not load identities.', 500, ERROR_CODES.SERVER_ERROR);
  }

  const identities = identitiesData.identities;
  const target = identities.find((i) => i.provider === rawProvider);

  if (!target) {
    return apiError(
      `No linked ${rawProvider} account to unlink.`,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  // Safety: the parent must retain at least one auth method after
  // unlinking. Supabase auto-creates an 'email' identity for
  // password-based signups; OAuth-only accounts only have provider
  // identities. Treat any non-target identity as a valid fallback.
  const remainingAfterUnlink = identities.filter(
    (i) => (i.identity_id ?? i.id) !== (target.identity_id ?? target.id),
  );

  if (remainingAfterUnlink.length === 0) {
    return apiError(
      'Cannot unlink your last sign-in method. Set a password or link another provider first.',
      409,
      'BAD_REQUEST',
    );
  }

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(target);

  if (unlinkError) {
    console.error('[auth/identities] unlinkIdentity error:', unlinkError);
    await logAuthEvent({
      parentId: auth.user.id,
      eventType: 'oauth.link_failed',
      provider: rawProvider,
      metadata: { op: 'unlink', error: unlinkError.message },
      req,
    });
    return apiError(
      'Could not unlink account. Please try again.',
      500,
      ERROR_CODES.SERVER_ERROR,
    );
  }

  await logAuthEvent({
    parentId: auth.user.id,
    eventType: 'oauth.unlinked',
    provider: rawProvider,
    req,
  });

  return apiSuccess({ provider: rawProvider, unlinked: true });
}
