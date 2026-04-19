import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// AUTH-HIGH-001 (2B): fail-fast fallbacks.
// `http://localhost:0` is a guaranteed connection-refused URL, so if a
// misconfigured deploy slips through (no env vars set) we get a noisy
// runtime error instead of silently routing real traffic to a domain
// an attacker could register (the previous `placeholder.supabase.co`).
// The empty-string key is similarly inert — Supabase will reject it.
// Static `next build` never invokes these factories, so module-load
// is still safe even when env vars are missing on CI.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:0';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function assertSupabaseEnv(context: 'anon' | 'service') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not configured. Add it to .env.local (see .env.local.example).'
    );
  }
  if (context === 'anon' && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. Add it to .env.local (see .env.local.example).'
    );
  }
  if (context === 'service' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. This is required for admin/server-role operations. Add it to .env.local (never commit it).'
    );
  }
}

export async function createServerSupabase() {
  assertSupabaseEnv('anon');
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        // AUTH-CRIT-001 (1B): Force httpOnly/Secure/SameSite=Lax on every
        // Supabase-managed cookie regardless of defaults from @supabase/ssr.
        // This is defense-in-depth — Supabase already sets these, but we
        // enforce them explicitly so no future library change weakens it.
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          } catch { /* Server Component */ }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          } catch { /* Server Component */ }
        },
      },
    }
  );
}

export function createAdminClient() {
  assertSupabaseEnv('service');
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
