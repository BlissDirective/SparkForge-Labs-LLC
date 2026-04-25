// ════════════════════════════════════════════════════
// ADMIN SUBSCRIPTIONS — Wrapper to prevent static prerender
// v3 Gap 1: Needs Supabase auth at runtime for admin gate
// ════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

export { default } from './AdminSubscriptionsClient';
