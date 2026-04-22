// POST /api/stripe/invoice-preview
// PAY-ENH Proration Preview (Recommended) — Phase 5 task #8
//
// Body: { targetPriceId: string }
// Returns a preview of the upcoming invoice if the caller's active
// subscription were switched to `targetPriceId` today with default
// proration behavior.
//
// Uses Stripe's `/invoices/upcoming` (aka `invoices.retrieveUpcoming`)
// with `subscription_items` override. Full invoice: line items + tax
// (when Stripe Tax is enabled for the account — Max tier) + credits.
//
// Cached per (userId, targetPriceId) for 60s since `/invoices/upcoming`
// is rate-limited (100 req/s on stripe mode-1 account, but per-customer
// it's far tighter in practice).
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, requireAuth, apiValidationError } from '@/lib/api-helpers';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';

const BodySchema = z.object({
  targetPriceId: z.string().min(1),
});

// Poor-man's in-memory cache. Serverless = per-instance, which is
// fine at Recommended tier — Max moves this to Redis/Upstash.
const cache = new Map<string, { at: number; payload: unknown }>();
const CACHE_TTL_MS = 60_000;

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('PRORATION_PREVIEW')) {
    // Feature flag off → return a 404 so the UI hides the preview.
    return apiError('Proration preview not enabled.', 404, 'NOT_ENABLED');
  }

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;
  if (auth.user.isDemo) {
    return apiError('Demo sessions cannot preview invoices.', 403, 'FORBIDDEN');
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);
  const { targetPriceId } = parsed.data;

  const cacheKey = `${auth.user.id}:${targetPriceId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return apiSuccess(cached.payload);
  }

  const stripe = getStripe();
  if (!stripe) return apiError('Stripe not configured on this environment.', 503, 'NOT_CONFIGURED');

  // Resolve the caller's Stripe customer + active subscription from
  // the parents row (populated by the existing checkout + webhook flow).
  const admin = createAdminClient();
  const { data: parent } = await admin
    .from('parents')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (!parent?.stripe_customer_id || !parent?.stripe_subscription_id) {
    return apiError(
      'No active subscription to preview a change against.',
      400,
      'NO_SUBSCRIPTION',
    );
  }

  try {
    // Fetch current sub to identify the subscription item to replace.
    const sub = await stripe.subscriptions.retrieve(parent.stripe_subscription_id);
    const firstItem = sub.items.data[0];
    if (!firstItem) {
      return apiError('Subscription has no line items.', 500, 'BAD_SUB');
    }

    const preview = await stripe.invoices.createPreview({
      customer: parent.stripe_customer_id,
      subscription: parent.stripe_subscription_id,
      subscription_details: {
        items: [
          {
            id: firstItem.id,
            price: targetPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
        proration_date: Math.floor(Date.now() / 1000),
      },
    });

    const summary = summarizeInvoice(preview);
    cache.set(cacheKey, { at: Date.now(), payload: summary });
    return apiSuccess(summary);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe preview failed.';
    return apiError(msg, 502, 'STRIPE_PREVIEW_FAILED');
  }
}

interface InvoiceSummary {
  currency: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  amountDueCents: number;
  periodStart: number | null;
  periodEnd: number | null;
  items: Array<{
    description: string;
    amountCents: number;
    periodStart: number | null;
    periodEnd: number | null;
    proration: boolean;
  }>;
}

function summarizeInvoice(invoice: {
  currency: string;
  subtotal: number;
  tax?: number | null;
  total: number;
  amount_due: number;
  period_start?: number | null;
  period_end?: number | null;
  lines: { data: Array<{
    description: string | null;
    amount: number;
    period?: { start: number | null; end: number | null } | null;
    proration?: boolean | null;
  }> };
}): InvoiceSummary {
  return {
    currency: invoice.currency,
    subtotalCents: invoice.subtotal,
    taxCents: invoice.tax ?? 0,
    totalCents: invoice.total,
    amountDueCents: invoice.amount_due,
    periodStart: invoice.period_start ?? null,
    periodEnd: invoice.period_end ?? null,
    items: invoice.lines.data.map((l) => ({
      description: l.description ?? '',
      amountCents: l.amount,
      periodStart: l.period?.start ?? null,
      periodEnd: l.period?.end ?? null,
      proration: l.proration === true,
    })),
  };
}
