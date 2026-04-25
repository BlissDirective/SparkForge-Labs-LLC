import { createBrowserClient } from '@supabase/ssr';

// AUTH-HIGH-001 (2B): fail-fast fallbacks.
// `http://localhost:0` is a guaranteed connection-refused URL, so if the
// browser bundle ever ships without a real NEXT_PUBLIC_SUPABASE_URL set
// at build time we'll get a noisy runtime error instead of silently
// routing real traffic to a domain an attacker could register.
// Static `next build` never invokes this factory, so module-load is safe
// even when env vars are missing in CI.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:0';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase env vars are not configured. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set at build time (see .env.local.example).'
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
