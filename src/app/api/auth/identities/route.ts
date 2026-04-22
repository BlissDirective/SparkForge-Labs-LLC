// GET /api/auth/identities — List the caller's linked auth identities
// AUTH-ENH-003 (Max)
//
// Returns an array of `{ provider, identityId, email, createdAt,
// lastSignInAt }` for every identity currently linked to the session
// user. Source: `supabase.auth.getUserIdentities()`.
//
// Used by the Linked Accounts section on /settings to render the
// list + link/unlink affordances.

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireAuth,
  ERROR_CODES,
} from '@/lib/api-helpers';

export interface LinkedIdentitySummary {
  identityId: string;
  provider: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (auth.user.isDemo) {
    return apiError(
      'Demo sessions cannot view linked accounts.',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUserIdentities();

  if (error || !data?.identities) {
    console.error('[auth/identities] getUserIdentities error:', error);
    return apiError(
      'Could not load linked accounts.',
      500,
      ERROR_CODES.SERVER_ERROR,
    );
  }

  const identities: LinkedIdentitySummary[] = data.identities.map((i) => ({
    identityId: i.identity_id ?? i.id,
    provider: i.provider,
    email: (i.identity_data?.email as string | undefined) ?? null,
    createdAt: i.created_at ?? null,
    lastSignInAt: i.last_sign_in_at ?? null,
  }));

  return apiSuccess({ identities });
}
