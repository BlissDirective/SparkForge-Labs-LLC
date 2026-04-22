// AUTH-ENH-003 (Max): auth-event logging helper
//
// Service-role insert into `auth_events`. Callers are API routes that
// have already authenticated the parent (or know the parent_id from a
// trusted source like exchangeCodeForSession).
//
// Never throws — logging failures are swallowed and console.error'd
// so they can never cascade into a failed sign-in. auth_events is
// observability, not source-of-truth.

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getClientIP } from '@/lib/api-helpers';

export type AuthEventType =
  | 'signin.password'
  | 'signin.oauth'
  | 'signin.demo'
  | 'signin.passkey'
  | 'signout'
  | 'oauth.linked'
  | 'oauth.unlinked'
  | 'oauth.link_failed'
  | 'mfa.enrolled'
  | 'mfa.challenged'
  | 'mfa.verified'
  | 'mfa.disabled'
  | 'password.changed'
  | 'password.reset_requested'
  | 'email.verified';

export interface AuthEventInput {
  parentId: string;
  eventType: AuthEventType;
  provider?: string | null;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
}

export async function logAuthEvent(input: AuthEventInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('auth_events').insert({
      parent_id: input.parentId,
      event_type: input.eventType,
      provider: input.provider ?? null,
      ip: input.req ? getClientIP(input.req) : null,
      user_agent: input.req?.headers.get('user-agent')?.slice(0, 512) ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    // Intentional: audit logging must never break the parent operation.
    console.error('[auth/audit] logAuthEvent failed:', err);
  }
}
