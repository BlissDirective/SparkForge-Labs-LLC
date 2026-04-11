#!/usr/bin/env node
/* eslint-disable no-console */
// ════════════════════════════════════════════════════
// BACKFILL — stripe_subscription_id + trial_ends_at
// v3 Gap 1 + Gap 2
// ════════════════════════════════════════════════════
//
// For every parent that has a stripe_customer_id but no
// stripe_subscription_id, queries Stripe for the customer's
// active subscription and writes it back, along with trial
// and period-end metadata.
//
// Usage:
//   npx tsx scripts/backfill-stripe-subs.ts              # dry run
//   npx tsx scripts/backfill-stripe-subs.ts --commit     # apply writes
//
// Requires:
//   STRIPE_SECRET_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ════════════════════════════════════════════════════
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const COMMIT = process.argv.includes('--commit');

const STRIPE_API_VERSION = '2026-02-25.clover' as const;

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  const stripe = new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION });
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(COMMIT ? '[backfill] COMMIT MODE — changes WILL be written.' : '[backfill] DRY RUN — no changes will be written.');
  console.log('[backfill] Fetching candidate parents…');

  const { data: parents, error } = await supabase
    .from('parents')
    .select('id, email, stripe_customer_id, stripe_subscription_id, subscription_tier')
    .not('stripe_customer_id', 'is', null)
    .is('stripe_subscription_id', null);

  if (error) {
    console.error('[backfill] Supabase query failed:', error);
    process.exit(1);
  }

  if (!parents || parents.length === 0) {
    console.log('[backfill] No candidates found. All parents already have stripe_subscription_id.');
    return;
  }

  console.log(`[backfill] Found ${parents.length} parent(s) needing backfill.`);

  let updated = 0;
  let skipped = 0;
  let errored = 0;

  for (const parent of parents) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: parent.stripe_customer_id!,
        limit: 1,
        status: 'all',
      });

      if (subs.data.length === 0) {
        console.log(`  [skip] ${parent.email} — no Stripe subscriptions`);
        skipped++;
        continue;
      }

      const sub = subs.data[0];
      const trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
      // Stripe API 2026-02-25+: current_period_end moved to SubscriptionItem
      const periodEndUnix = sub.items.data[0]?.current_period_end;
      const periodEnd = periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : null;

      console.log(
        `  [write] ${parent.email} → sub=${sub.id} status=${sub.status}${
          trialEndsAt ? ` trial_end=${trialEndsAt}` : ''
        }`
      );

      if (COMMIT) {
        const { error: updateError } = await supabase
          .from('parents')
          .update({
            stripe_subscription_id: sub.id,
            trial_ends_at: trialEndsAt,
            subscription_period_end: periodEnd,
          })
          .eq('id', parent.id);

        if (updateError) {
          console.error(`  [error] ${parent.email}:`, updateError);
          errored++;
          continue;
        }
      }
      updated++;
    } catch (err) {
      console.error(`  [error] ${parent.email}:`, err);
      errored++;
    }
  }

  console.log('');
  console.log('[backfill] Done.');
  console.log(`  ${updated} updated${COMMIT ? '' : ' (dry-run)'}`);
  console.log(`  ${skipped} skipped (no Stripe subs)`);
  console.log(`  ${errored} errors`);

  if (!COMMIT && updated > 0) {
    console.log('');
    console.log('[backfill] Re-run with --commit to apply the above writes.');
  }
}

main().catch((err) => {
  console.error('[backfill] Fatal error:', err);
  process.exit(1);
});
