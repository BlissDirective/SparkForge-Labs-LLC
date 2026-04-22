'use client';

// ════════════════════════════════════════════════════════════════
// ProrationPreview — PAY-ENH Proration Preview (Recommended)
// Phase 5 task #8 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// Shows the user exactly what they'll be charged / credited when
// switching plans — prorated line items + tax + total.
//
// Usage:
//   <ProrationPreview targetPriceId="price_xxx" />
//
// Data source: POST /api/stripe/invoice-preview. Cached 60s server-
// side. Client also debounces price changes to 300ms so rapid plan
// toggles don't hammer Stripe.
// ════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';

interface ProrationPreviewProps {
  targetPriceId: string;
  currencyOverride?: string;
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

export function ProrationPreview({ targetPriceId, currencyOverride }: ProrationPreviewProps) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; summary: InvoiceSummary }
    | { status: 'error'; message: string }
    | { status: 'not-enabled' }
  >({ status: 'idle' });

  useEffect(() => {
    if (!targetPriceId) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setState({ status: 'loading' });
      try {
        const res = await fetch('/api/stripe/invoice-preview', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ targetPriceId }),
        });
        if (res.status === 404) {
          if (!cancelled) setState({ status: 'not-enabled' });
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setState({ status: 'error', message: json.error ?? 'Unable to preview.' });
          return;
        }
        setState({ status: 'ready', summary: json.data as InvoiceSummary });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Network error.',
          });
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [targetPriceId]);

  if (state.status === 'not-enabled') return null;

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div
        className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60"
        aria-live="polite"
      >
        Calculating preview…
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div
        role="alert"
        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      >
        {state.message}
      </div>
    );
  }

  const { summary } = state;
  const currency = (currencyOverride ?? summary.currency).toUpperCase();

  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm">
      <h3 className="font-medium mb-2 text-white/90">Upcoming charge</h3>
      <ul className="space-y-1">
        {summary.items.map((item, i) => (
          <li key={i} className="flex items-baseline justify-between gap-4">
            <span className="text-white/70 truncate">
              {item.description || 'Subscription line'}
              {item.proration && <span className="ml-2 text-white/60 text-xs">(prorated)</span>}
            </span>
            <span
              className={`font-mono text-xs shrink-0
                ${item.amountCents < 0 ? 'text-emerald-300' : 'text-white/90'}`}
            >
              {formatCents(item.amountCents, currency)}
            </span>
          </li>
        ))}
      </ul>
      <hr className="my-2 border-white/10" />
      <dl className="text-xs text-white/70 space-y-0.5">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="font-mono">{formatCents(summary.subtotalCents, currency)}</dd>
        </div>
        {summary.taxCents > 0 && (
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd className="font-mono">{formatCents(summary.taxCents, currency)}</dd>
          </div>
        )}
        <div className="flex justify-between text-white/90 font-medium">
          <dt>Due today</dt>
          <dd className="font-mono">{formatCents(summary.amountDueCents, currency)}</dd>
        </div>
      </dl>
      {summary.amountDueCents === 0 && (
        <p className="text-white/50 text-xs mt-2">
          No charge due now. Your new plan starts at the end of the current period.
        </p>
      )}
    </div>
  );
}

function formatCents(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
