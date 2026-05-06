-- AUDIT-FIX 2026-05-06: extend auth_events.event_type CHECK to allow 'email.resend'.
--
-- The /api/auth/resend-verification route now logs each successful resend
-- attempt to auth_events for admin trail completeness (matching the pattern
-- used by signin.*, oauth.*, mfa.*, and email.verified). The existing CHECK
-- constraint enumerates the allowed event_type values and would reject
-- 'email.resend' inserts. Widen the constraint additively — no existing
-- rows are affected.

ALTER TABLE public.auth_events
  DROP CONSTRAINT IF EXISTS auth_events_event_type_check;

ALTER TABLE public.auth_events
  ADD CONSTRAINT auth_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'signin.password',
    'signin.oauth',
    'signin.demo',
    'signin.passkey',
    'signout',
    'oauth.linked',
    'oauth.unlinked',
    'oauth.link_failed',
    'mfa.enrolled',
    'mfa.challenged',
    'mfa.verified',
    'mfa.disabled',
    'password.changed',
    'password.reset_requested',
    'email.verified',
    'email.resend'
  ]));
