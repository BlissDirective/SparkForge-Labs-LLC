import { createBrowserClient } from '@supabase/ssr';

// AUDIT-FIX: Provide fallback values during build-time static generation
// when env vars are not available. The client will fail at runtime if
// env vars are truly missing, but this prevents build crashes.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
