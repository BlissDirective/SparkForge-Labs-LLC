// ════════════════════════════════════════════════════════════════
// DELETE /api/auth/delete-account — PAY-MED-003 (Opt B)
// ════════════════════════════════════════════════════════════════
// Orchestrated hard-delete of a parent account:
//
//   1. Require the authed session (NOT consent-gated — an
//      unconsented parent must still be able to delete).
//   2. Require body `{ confirm: 'DELETE' }` as a type-to-confirm
//      guard against CSRF-adjacent mistakes (CSRF header is
//      already validated by middleware for DELETE methods).
//   3. If the parent has a Stripe customer:
//        a. cancel any active subscription (immediate, not at
//           period end — the parent is leaving now);
//        b. delete the Stripe customer.
//      Both calls are wrapped in try/catch so a half-broken
//      Stripe-side state doesn't block the auth.users delete.
//      The caller still sees a 500 if auth.users delete fails,
//      which is the only step that actually leaves a zombie
//      account.
//   4. Delete the Supabase auth user via admin client. `auth.users
//      ON DELETE CASCADE` flows to `parents`, and the existing
//      parent cascade chain deletes children, progress, sessions,
//      prompt_history, child_badges. `subscription_events.parent_id`
//      gets SET NULL (DB-MED-002 / sql/017) preserving audit trail.
//   5. Emit a subscription_events entry "account_deleted" so the
//      cleanup is discoverable in the admin audit log.
//
// Demo (anonymous) users may invoke this to revoke their demo
// session explicitly. Admin users may also delete their own account.
// ════════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  parseBody,
  requireAuth,
  applyRateLimit,
} from '@/lib/api-helpers';
import { getStripe } from '@/lib/stripe';
import { logSubscriptionEvent } from '@/lib/subscription-events';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const DeleteAccountSchema = z.object({
  confirm: z.literal('DELETE', {
    errorMap: () => ({ message: 'Type DELETE to confirm' }),
  }),
});

export async function DELETE(req: NextRequest) {
  // Tight rate limit — account deletion is rare + irreversible.
  const limited = await applyRateLimit(
    req,
    'auth-delete-account',
    undefined,
    RATE_LIMITS.auth,
  );
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, DeleteAccountSchema);
  if (!parsed.success) return parsed.response;

  const userId = auth.user.id;
  const admin = createAdminClient();

  // ─── Step 1: cancel + delete Stripe side (best-effort) ──────────
  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;
  let subscriptionCancelled = false;
  let customerDeleted = false;

  if (!auth.user.isDemo) {
    const { data: parent } = await admin
      .from('parents')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', userId)
      .single();

    stripeCustomerId = parent?.stripe_customer_id ?? null;
    stripeSubscriptionId = parent?.stripe_subscription_id ?? null;

    const stripe = getStripe();
    if (stripe && stripeCustomerId) {
      // Cancel active subscription first so Stripe stops billing.
      if (
        stripeSubscriptionId &&
        parent?.subscription_status !== 'canceled'
      ) {
        try {
          await stripe.subscriptions.cancel(stripeSubscriptionId);
          subscriptionCancelled = true;
        } catch (err) {
          console.error(
            '[delete-account] stripe.subscriptions.cancel failed:',
            err,
          );
          Sentry.captureException(err, {
            tags: { route: 'delete-account', step: 'cancel-subscription' },
            extra: { userId, stripeSubscriptionId },
          });
          // Continue — subscription-cancel failures should not block
          // the user from deleting their account. Stripe side may be
          // orphaned; operator can clean up manually from the
          // Stripe dashboard.
        }
      }

      try {
        await stripe.customers.del(stripeCustomerId);
        customerDeleted = true;
      } catch (err) {
        console.error('[delete-account] stripe.customers.del failed:', err);
        Sentry.captureException(err, {
          tags: { route: 'delete-account', step: 'delete-customer' },
          extra: { userId, stripeCustomerId },
        });
        // Continue. Worst case: orphan Stripe customer, no PII (we
        // sent email-only). Alertable via Sentry for manual cleanup.
      }
    }

    // ─── Step 2: audit log entry ──────────────────────────────────
    // Use the same dual-write helper as the Stripe webhook so the
    // admin audit log stays consistent. `stripe_event_id` here is a
    // synthetic id so the unique constraint isn't violated on rare
    // same-second deletes.
    try {
      await logSubscriptionEvent(admin, {
        stripeEventId: `app-delete-${userId}-${Date.now()}`,
        eventType: 'account_deleted',
        parentId: userId,
        data: {
          reason: 'user-initiated delete-account',
          stripeCustomerId,
          stripeSubscriptionId,
          subscriptionCancelled,
          customerDeleted,
          at: new Date().toISOString(),
        },
      });
    } catch (err) {
      // Audit logging failure is not user-blocking.
      console.error('[delete-account] audit log failed:', err);
      Sentry.captureException(err, {
        tags: { route: 'delete-account', step: 'audit-log' },
      });
    }
  }

  // ─── Step 3: delete the auth user (cascades the parents row) ────
  //
  // auth.users deletion cascades to parents, which cascades to
  // children + progress + sessions + prompt_history + child_badges.
  // subscription_events.parent_id is set to NULL per sql/017
  // (DB-MED-002), preserving the audit trail with an anonymized row.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error(
      '[delete-account] auth.admin.deleteUser failed:',
      deleteError,
    );
    Sentry.captureException(deleteError, {
      tags: { route: 'delete-account', step: 'auth-delete' },
      extra: { userId },
    });
    return apiError(
      'Account deletion failed. Please contact support — your data has not been removed.',
      500,
      'SERVER_ERROR',
    );
  }

  return apiSuccess(
    {
      deleted: true,
      subscriptionCancelled,
      customerDeleted,
    },
    200,
  );
}
