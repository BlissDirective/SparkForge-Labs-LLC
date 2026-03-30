// ════════════════════════════════════════════════════
// ADMIN CONTENT — Wrapper to prevent static prerender
// AUDIT-FIX: This page needs Supabase auth at runtime.
// force-dynamic prevents build-time prerendering.
// ════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

export { default } from './AdminContentClient';
