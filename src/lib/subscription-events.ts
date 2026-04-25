// ════════════════════════════════════════════════════
// Subscription Events Helper
// Final-Audit 04-15-2026 finding DB-CRIT-001 (Option C)
//
// Centralizes the dual-write pattern across the Stripe webhook and the
// admin/cron audit log paths. Metadata (event_type, parent_id, processed
// flag) goes to `subscription_events` which has a parent SELECT policy.
// The raw payload goes to `subscription_events_detail` which is admin-only.
//
// All callers must use this helper instead of writing to either table
// directly. New writers added without using this helper will silently
// drop the data column (which no longer exists on subscription_events
// after sql/009).
// ════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SubscriptionEventInput {
  stripeEventId: string;
  eventType: string;
  parentId: string | null;
  data: Record<string, unknown>;
}

/**
 * Upsert a subscription event into both the metadata and detail tables.
 *
 * Both writes use `onConflict: 'stripe_event_id', ignoreDuplicates: true`,
 * so replays preserve any existing `processed` flag on the metadata row.
 *
 * Writes are sequential (not transactional). If the detail upsert fails
 * after the metadata upsert succeeds, the metadata row still records the
 * event arrival; the data is recoverable from Stripe's own event log via
 * the dashboard. Acceptable degradation for an audit log.
 */
export async function logSubscriptionEvent(
  supabase: SupabaseClient,
  event: SubscriptionEventInput,
): Promise<void> {
  await supabase.from('subscription_events').upsert(
    {
      stripe_event_id: event.stripeEventId,
      event_type: event.eventType,
      parent_id: event.parentId,
    },
    { onConflict: 'stripe_event_id', ignoreDuplicates: true },
  );

  await supabase.from('subscription_events_detail').upsert(
    {
      stripe_event_id: event.stripeEventId,
      data: event.data,
    },
    { onConflict: 'stripe_event_id', ignoreDuplicates: true },
  );
}
