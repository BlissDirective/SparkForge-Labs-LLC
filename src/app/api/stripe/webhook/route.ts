// ════════════════════════════════════════════════════
// STRIPE WEBHOOK — Handle subscription lifecycle events
// v2: Graceful fallback if STRIPE_SECRET_KEY missing (ENH-8A)
// v2: Logs events to subscription_events table
// v2: Uses createAdminClient for webhook (no user auth)
// v3 (Gap 1): Persists stripe_subscription_id for programmatic control
// v3 (Gap 2): Persists trial_ends_at + subscription_period_end
// PAY-CRIT-001 (6B): Idempotency guard via subscription_events.processed
//   flag. Replayed events short-circuit before re-running business logic.
//   Requires migration sql/008_subscription_events_processed.sql.
// DB-CRIT-001 (4C): Sensitive Stripe payload lives in
//   subscription_events_detail (admin-only). Metadata-only data in
//   subscription_events is parent-readable.
//   Requires migration sql/009_subscription_events_split.sql.
// ════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe, getCustomerId } from '@/lib/stripe';
import { logSubscriptionEvent } from '@/lib/subscription-events';
import { checkRateLimit, RATE_LIMITS, rateLimitKey } from '@/lib/rate-limit';
// T16 DEPLOY-MED-002 (Opt B): wrap handler body in a Sentry span so
// webhook processing time, event-type mix, and error rate show up in
// the Performance dashboard.
import { traceStripeWebhook } from '@/lib/sentry-transactions';
import type { SubscriptionTier } from '@/lib/tier-config';

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs';

// Convert Stripe's unix-seconds timestamp to ISO 8601 string (or null)
function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

// Stripe API 2026-02-25+: current_period_end moved from Subscription
// to SubscriptionItem. Read it from the first item (all items on a
// single subscription share the same period window).
function getPeriodEnd(sub: Stripe.Subscription): number | null | undefined {
  return sub.items.data[0]?.current_period_end;
}

// Map Stripe statuses to application statuses (S8-WARN-002 fix)
const STRIPE_STATUS_MAP: Record<string, string> = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'canceled',
  canceled: 'canceled',
  incomplete: 'active',
  incomplete_expired: 'canceled',
  paused: 'paused',
};

// Map a Stripe Price ID back to the app's tier slug by comparing against env.
function tierFromPriceId(priceId: string | null | undefined): SubscriptionTier | null {
  if (!priceId) return null;
  if (
    priceId === process.env.STRIPE_PLUS_MONTHLY_ID ||
    priceId === process.env.STRIPE_PLUS_YEARLY_ID
  ) {
    return 'plus';
  }
  if (
    priceId === process.env.STRIPE_FORGE_MONTHLY_ID ||
    priceId === process.env.STRIPE_FORGE_YEARLY_ID
  ) {
    return 'forge';
  }
  return null;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    );
  }

  // PAY-MED-001 (B): Global 100/min throttle before signature
  // verification. Stripe's legitimate delivery rate is well under this
  // threshold; exceeding it almost certainly means a leaked webhook
  // secret is being abused to flood the CPU-intensive constructEvent
  // call. Single global key (no per-IP partition) so an attacker
  // can't bypass by rotating sources.
  const rlResult = await checkRateLimit(
    rateLimitKey('stripe-webhook', 'global'),
    RATE_LIMITS.stripeWebhook,
  );
  if (!rlResult.allowed) {
    const msg = `[stripe-webhook] rate limit hit — ${RATE_LIMITS.stripeWebhook.maxRequests} req/min exceeded; retry after ${rlResult.retryAfterSeconds}s`;
    console.warn(msg);
    Sentry.captureMessage(msg, { level: 'warning' });
    return NextResponse.json(
      { error: 'Too many webhook events' },
      {
        status: 429,
        headers: { 'Retry-After': String(rlResult.retryAfterSeconds) },
      },
    );
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      {
        error:
          'Webhook secret not configured. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook',
      },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    // PAY-HIGH-001 (B): Explicit 60s replay-tolerance window.
    // Stripe defaults to 5 minutes, which combined with the
    // `processed` idempotency column still leaves a 5-minute window
    // where a captured payload could be resubmitted before the DB
    // short-circuit fires. 60s matches Stripe's recommendation for
    // high-security webhooks and is well within the handful of
    // seconds that legitimate Stripe retries take.
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
      60,
    );
  } catch (err: unknown) {
    // API-MED-002 (B): log full signature-verification error
    // server-side, but DO NOT leak it in the 400 body — Stripe
    // diagnostics can reveal timing / secret-comparison internals.
    console.error('[stripe-webhook] signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // DB-CRIT-001 (4C): Dual-write metadata + detail via centralized helper.
  // Metadata in subscription_events (parent-readable via RLS), raw payload
  // in subscription_events_detail (admin-only).
  await logSubscriptionEvent(supabase, {
    stripeEventId: event.id,
    eventType: event.type,
    parentId: null, // filled below if identifiable
    data: event.data.object as unknown as Record<string, unknown>,
  });

  // PAY-CRIT-001 (6B): Idempotency guard. Stripe delivers webhooks at
  // least once. Without this check, a replayed `checkout.session.completed`
  // could re-upgrade a parent who has since downgraded. Stripe expects
  // 2xx for replays — return 200 instead of erroring.
  const { data: existingEvent } = await supabase
    .from('subscription_events')
    .select('processed')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent?.processed === true) {
    return NextResponse.json({ received: true, replay: true, skipped: true });
  }

  return traceStripeWebhook(event.type, async () => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const supabaseId = session.metadata?.supabase_id;
      const tier = session.metadata?.tier ?? 'plus';

      if (supabaseId) {
        // v3 Gap 1: Retrieve the full subscription to capture ID + trial info
        let stripeSubscriptionId: string | null = null;
        let trialEndsAt: string | null = null;
        let periodEnd: string | null = null;

        if (session.subscription) {
          stripeSubscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;

          try {
            const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            trialEndsAt = toIso(sub.trial_end);
            periodEnd = toIso(getPeriodEnd(sub));
          } catch (err) {
            console.error('[webhook] Failed to retrieve subscription:', err);
          }
        }

        // PAY-HIGH-002 (B): defensive customer-id resolution. Falls
        // back to the existing value on the parents row if the webhook
        // payload somehow lacks a resolvable customer (deleted /
        // expanded-but-null / string edge cases).
        const resolvedCustomerId = getCustomerId(session.customer);
        if (!resolvedCustomerId) {
          console.warn(
            '[webhook] checkout.session.completed missing customer id; event=%s',
            event.id,
          );
        }

        const checkoutUpdate: Record<string, unknown> = {
          subscription_tier: tier,
          subscription_status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
          trial_ends_at: trialEndsAt,
          subscription_period_end: periodEnd,
        };
        if (resolvedCustomerId) {
          checkoutUpdate.stripe_customer_id = resolvedCustomerId;
        }

        await supabase
          .from('parents')
          .update(checkoutUpdate)
          .eq('id', supabaseId);

        // Update event with parent_id for audit trail
        await supabase
          .from('subscription_events')
          .update({ parent_id: supabaseId })
          .eq('stripe_event_id', event.id);

        // R7: send the CA ARL post-purchase acknowledgment email. Supplements
        // (does not replace) Stripe's default receipt. Best-effort; any
        // failure is logged but does not fail the webhook.
        try {
          const { sendEmail, isEmailConfigured } = await import('@/lib/email');
          if (isEmailConfigured() && (tier === 'plus' || tier === 'forge')) {
            const { renderPostPurchase } = await import('@/lib/email-templates/post-purchase');
            const { data: parent } = await supabase
              .from('parents')
              .select('email, full_name')
              .eq('id', supabaseId)
              .maybeSingle();
            const parentEmail =
              parent?.email ||
              session.customer_email ||
              session.customer_details?.email ||
              null;
            if (parentEmail) {
              // Determine amount and interval from session metadata or
              // retrieve the subscription line item if present.
              const intervalRaw = session.metadata?.interval;
              const interval: 'month' | 'year' = intervalRaw === 'year' ? 'year' : 'month';
              const amountTotal = session.amount_total ?? 0;
              const amount = amountTotal > 0 ? amountTotal / 100 : 0;
              const appUrl =
                process.env.NEXT_PUBLIC_URL ??
                process.env.NEXT_PUBLIC_APP_URL ??
                'https://sparkforge-labs.com';
              const manageUrl = `${appUrl.replace(/\/$/, '')}/parent/subscription`;
              const rendered = renderPostPurchase({
                parentName: parent?.full_name ?? '',
                parentEmail,
                tier,
                interval,
                amount,
                nextRenewsAt: periodEnd ? new Date(periodEnd) : null,
                hasTrial: Boolean(trialEndsAt),
                manageUrl,
              });
              await sendEmail({
                to: parentEmail,
                subject: rendered.subject,
                html: rendered.html,
                text: rendered.text,
                tags: { kind: 'post_purchase_ack', tier, interval },
              });
            }
          }
        } catch (err) {
          console.error(
            '[webhook] post-purchase email failed (non-fatal):',
            err instanceof Error ? err.message : String(err)
          );
        }
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      // PAY-HIGH-002 (B): skip if customer can't be resolved rather
      // than issuing an UPDATE against `'[object Object]'`.
      const customerId = getCustomerId(sub.customer);
      if (!customerId) {
        console.warn(
          '[webhook] %s missing customer id; event=%s',
          event.type,
          event.id,
        );
        break;
      }
      const status = STRIPE_STATUS_MAP[sub.status] ?? 'active';

      // v3 Gap 1+2: persist subscription ID, trial end, period end, and
      // derive tier from the price if metadata drifted.
      const priceId = sub.items.data[0]?.price.id;
      const derivedTier = tierFromPriceId(priceId);

      // Audit §2.7: a price ID that is present but unmapped means the env-var
      // price IDs have drifted from Stripe. Don't silently skip — surface it,
      // otherwise tier state corrupts invisibly.
      if (priceId && !derivedTier) {
        Sentry.captureMessage(
          `[webhook] unmapped Stripe price id "${priceId}" on ${event.type} (event=${event.id}); `
          + 'check STRIPE_PRICE_* env vars — tier left unchanged',
          { level: 'error' },
        );
      }

      const updates: Record<string, unknown> = {
        subscription_status: status,
        stripe_subscription_id: sub.id,
        trial_ends_at: toIso(sub.trial_end),
        subscription_period_end: toIso(getPeriodEnd(sub)),
      };

      // Only overwrite tier if we can derive it from the active price.
      // (Avoids clobbering on transient events that don't change the plan.)
      if (derivedTier) {
        updates.subscription_tier = derivedTier;
      }

      await supabase
        .from('parents')
        .update(updates)
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      // PAY-HIGH-002 (B): guard the customer-id lookup.
      const deletedCustomerId = getCustomerId(sub.customer);
      if (!deletedCustomerId) {
        console.warn(
          '[webhook] customer.subscription.deleted missing customer id; event=%s',
          event.id,
        );
        break;
      }
      // v3 Gap 1: Clear stripe_subscription_id so a re-subscribe creates a
      // fresh row without tripping the UNIQUE constraint.
      await supabase
        .from('parents')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          trial_ends_at: null,
          subscription_period_end: null,
        })
        .eq('stripe_customer_id', deletedCustomerId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // PAY-HIGH-002 (B): guard the customer-id lookup.
      const invoiceCustomerId = getCustomerId(invoice.customer);
      if (!invoiceCustomerId) {
        console.warn(
          '[webhook] invoice.payment_failed missing customer id; event=%s',
          event.id,
        );
        break;
      }

      // PAY-ENH-003 (Ultra): Start or continue the dunning sequence.
      // Grace window is 7 days; subscription_status flips to past_due
      // immediately but the tier remains valid during grace.
      const { data: parentRow } = await supabase
        .from('parents')
        .select('id, email, full_name, subscription_tier, dunning_stage, dunning_started_at, dunning_tier_before')
        .eq('stripe_customer_id', invoiceCustomerId)
        .single();

      const startedAt =
        parentRow?.dunning_started_at
          ? new Date(parentRow.dunning_started_at)
          : new Date();
      const graceEndsAt = new Date(
        startedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      );

      // Stash the tier-before only on the first transition into dunning.
      // Repeated invoice.payment_failed events (Stripe Smart Retries fire
      // one per attempt) must not overwrite the captured "pre-dunning" tier.
      const tierBefore =
        parentRow?.dunning_tier_before ??
        (parentRow?.subscription_tier as 'plus' | 'forge' | 'free' | undefined);

      await supabase
        .from('parents')
        .update({
          subscription_status: 'past_due',
          dunning_stage: parentRow?.dunning_stage ?? 0,
          dunning_started_at: parentRow?.dunning_started_at ?? startedAt.toISOString(),
          dunning_last_sent_at:
            parentRow?.dunning_stage === undefined ? new Date().toISOString() : null,
          grace_period_ends_at: graceEndsAt.toISOString(),
          dunning_tier_before:
            tierBefore && tierBefore !== 'free' ? tierBefore : null,
        })
        .eq('stripe_customer_id', invoiceCustomerId);

      // PAY-ENH-003: send the immediate "payment failed" email (stage 0)
      // exactly once per dunning cycle. The cron handles stages 1-4.
      if (parentRow && parentRow.dunning_stage === undefined && parentRow.email) {
        try {
          const { sendEmail, isEmailConfigured } = await import('@/lib/email');
          const { renderDunningEmail } = await import('@/lib/email-templates/dunning');
          if (isEmailConfigured()) {
            const origin = new URL(req.url).origin;
            const rendered = renderDunningEmail('payment-failed', {
              parentName: parentRow.full_name,
              portalUrl: `${origin}/parent/subscription`,
              pricingUrl: `${origin}/pricing`,
              graceEndsAt,
            });
            await sendEmail({
              to: parentRow.email,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
              tags: { type: 'dunning', stage: '0' },
            });
          }
        } catch (err) {
          console.error('[webhook] dunning stage 0 email failed:', err);
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceCustomerId = getCustomerId(invoice.customer);
      if (!invoiceCustomerId) break;

      // PAY-ENH-003: Recovery. If the parent was in dunning, clear
      // all dunning_* + grace_* fields and restore subscription_status.
      // If they had been demoted to free (stage>=3), reinstate the
      // pre-dunning tier.
      const { data: parentRow } = await supabase
        .from('parents')
        .select('id, dunning_stage, dunning_tier_before, subscription_tier')
        .eq('stripe_customer_id', invoiceCustomerId)
        .single();

      if (parentRow?.dunning_stage !== null && parentRow?.dunning_stage !== undefined) {
        const restoredTier =
          parentRow.subscription_tier === 'free' && parentRow.dunning_tier_before
            ? parentRow.dunning_tier_before
            : parentRow.subscription_tier;
        await supabase
          .from('parents')
          .update({
            subscription_status: 'active',
            subscription_tier: restoredTier,
            dunning_stage: null,
            dunning_started_at: null,
            dunning_last_sent_at: null,
            dunning_tier_before: null,
            grace_period_ends_at: null,
          })
          .eq('stripe_customer_id', invoiceCustomerId);
      }
      break;
    }
  }

  // PAY-CRIT-001 (6B): Mark processed AFTER business logic completes.
  // If any handler throws above, this UPDATE is skipped and the event
  // remains processable on the next delivery attempt. Unknown event types
  // are also marked processed to prevent indefinite Stripe retries on
  // events we have no handler for.
  await supabase
    .from('subscription_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id);

  return NextResponse.json({ received: true });
  });
}
