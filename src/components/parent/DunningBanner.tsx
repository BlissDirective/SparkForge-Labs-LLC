'use client';

// PAY-ENH-003 (Ultra): dunning / grace-period banner
//
// Shown on /parent/subscription when the parent is in a dunning
// sequence. Surfaces remaining grace hours and a direct "Update
// payment" CTA that routes through /api/stripe/portal.

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { inGraceWindow, hoursLeftInGrace } from '@/lib/stripe/dunning';
import Link from 'next/link';

export function DunningBanner() {
  const parent = useAuthStore((s) => s.parent);

  const inGrace = useMemo(() => {
    if (!parent) return false;
    return inGraceWindow({
      grace_period_ends_at: parent.grace_period_ends_at ?? null,
      dunning_stage: parent.dunning_stage ?? null,
    });
  }, [parent]);

  const hoursLeft = useMemo(
    () => hoursLeftInGrace(parent?.grace_period_ends_at ?? null),
    [parent?.grace_period_ends_at],
  );

  if (!parent) return null;

  // Three visual states:
  //   - In grace (warning amber)
  //   - Demoted after grace (red — stage >= 3)
  //   - Everything else → render nothing
  const stage = parent.dunning_stage;
  const demoted = typeof stage === 'number' && stage >= 3;

  if (!inGrace && !demoted) return null;

  if (demoted) {
    return (
      <div
        role="alert"
        className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-100"
      >
        <p className="font-semibold mb-1">Your plan was paused</p>
        <p className="text-sm mb-3">
          We couldn't process payment during the 7-day grace window. Your family
          has free-tier access; all progress is preserved.
        </p>
        <Link
          href="/pricing"
          className="inline-block px-3 py-1.5 rounded border border-red-400/40 text-sm hover:bg-red-500/20"
        >
          Restart subscription
        </Link>
      </div>
    );
  }

  const urgent = hoursLeft !== null && hoursLeft < 48;

  return (
    <div
      role="alert"
      className={`mb-4 rounded-md border px-4 py-3 ${
        urgent
          ? 'border-red-500/40 bg-red-500/10 text-red-100'
          : 'border-amber-400/40 bg-amber-500/10 text-amber-100'
      }`}
    >
      <p className="font-semibold mb-1">
        {urgent ? 'Payment needed soon' : 'Payment failed — grace period active'}
      </p>
      <p className="text-sm mb-3">
        {hoursLeft !== null && hoursLeft > 0 ? (
          <>
            Your plan is active for another{' '}
            <strong>{hoursLeft} {hoursLeft === 1 ? 'hour' : 'hours'}</strong>.
            Update your card to avoid interruption.
          </>
        ) : (
          'Grace period ends soon. Update your card to keep access.'
        )}
      </p>
      <button
        type="button"
        onClick={async () => {
          const res = await fetch('/api/stripe/portal', { method: 'POST' });
          const json = await res.json();
          if (json?.data?.url) window.location.assign(json.data.url);
        }}
        className={`px-3 py-1.5 rounded border text-sm ${
          urgent
            ? 'border-red-400/40 hover:bg-red-500/20'
            : 'border-amber-400/40 hover:bg-amber-500/20'
        }`}
      >
        Update payment method
      </button>
    </div>
  );
}
