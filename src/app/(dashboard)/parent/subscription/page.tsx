// ════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT — Current plan, upgrade/downgrade
// v2: Uses tier-config.ts, Frost-Prismatic, success/cancel banners
// v3: S8 audit fixes (Batch 2) + 3D cockpit broadcasts (Batch 6)
// Enhancements: #2 tier badge color glow, #5 animated gradient
//   border on "Most Popular", #8 Suspense wrapper for useSearchParams
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect, Suspense } from 'react';
import { csrfHeader } from '@/lib/api';
import { motion, type Variants } from 'motion/react';
import { useParentStore } from '@/stores/parentStore';
import {
  TIER_DISPLAY, getYearlySavingsPercent,
  type SubscriptionTier,
} from '@/lib/tier-config';
import { Check, Sparkles, Crown, Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BlurText from '@/components/bits/BlurText';

// Parent-calm motion (DESIGN §8): quiet fades, no spring/scale pops.
const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};
import { useSearchParams } from 'next/navigation';
import { toast } from '@/stores/toastStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { TrialBanner } from '@/components/parent/TrialBanner';
import { DunningBanner } from '@/components/parent/DunningBanner';
import { DowngradeConfirmModal } from '@/components/parent/DowngradeConfirmModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { UsageDashboard } from '@/components/parent/UsageDashboard';
import { CelebrationBanner } from '@/components/parent/CelebrationBanner';
import { isDowngrade } from '@/lib/tier-config';
import { useCockpitStore } from '@/stores/cockpitStore';
import {
  queuePendingCelebration,
  useAutoDispatchPendingCelebration,
  peekPendingCelebration,
} from '@/hooks/usePendingCelebration';

const TIER_ICONS: Record<SubscriptionTier, typeof Sparkles> = {
  free: Sparkles,
  plus: Crown,
  forge: Rocket,
};

// ENH #2: Tier-specific accent colors (icon + highlights)
const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: '#64748B',
  plus: '#4F6EF7',
  forge: '#D97706',
};

// ENH #8: Inner component using useSearchParams wrapped in Suspense
function SubscriptionContent() {
  // PERF-HIGH-001 (Opt A): narrow single-field selector.
  const tier = useParentStore((s) => s.tier);
  const searchParams = useSearchParams();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  // Phase 2 audit fix (Section 3.5): Unified celebration state flow —
  // celebrations now dispatch through useAutoDispatchPendingCelebration
  // → uiStore.triggerCelebration (single entry point). Broadcast +
  // CeremonyFX + mode switch + auto-dismiss all flow from that.
  const cockpitReady = useCockpitStore((s) => s.cockpitReady);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  // v3 Gap 3: Downgrade/change modal
  const [downgradeTarget, setDowngradeTarget] = useState<SubscriptionTier | null>(null);
  // R1 (CA ARL AB 2863): affirmative auto-renewal consent for free->paid flows.
  // We cannot inject this checkbox into Stripe Hosted Checkout, so we gate the
  // redirect on it here.
  const [renewalConsentTier, setRenewalConsentTier] = useState<SubscriptionTier | null>(null);
  const [renewalConsentChecked, setRenewalConsentChecked] = useState(false);
  const [renewalConsentLoading, setRenewalConsentLoading] = useState(false);

  // UX-MED-006 (A) + PAY-MED-003: Delete account flow state
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteBusy) return;
    setDeleteBusy(true);
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error || 'Account deletion failed. Please contact support.');
        setDeleteBusy(false);
        return;
      }
      // Success — server has deleted the user. Reload to the marketing
      // home; AuthProvider will also catch the missing session and
      // redirect to /login, but window.location is more reliable from
      // a just-deleted session.
      window.location.href = '/';
    } catch {
      toast.error('Network error. Please check your connection and try again.');
      setDeleteBusy(false);
    }
  };

  // v3 Gap 5: Guaranteed celebration state — drives the HTML
  // CelebrationBanner independently of the 3D cockpit.
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);

  // PAY-HIGH-003 (B): Stripe now redirects back with ?session_id=cs_…
  // (instead of ?success=true). We call GET /api/stripe/session-status
  // to verify the session actually completed + belongs to this user.
  // While the webhook is still catching up, the page shows a
  // "Finalizing subscription…" state and polls up to POLL_TIMEOUT_MS.
  const sessionId = searchParams.get('session_id');
  const showCanceled = searchParams.get('canceled') === 'true';

  type VerifyState =
    | { status: 'idle' }
    | { status: 'verifying' }
    | { status: 'finalizing'; attempt: number }
    | { status: 'success' }
    | { status: 'failed'; reason: string };

  const [verify, setVerify] = useState<VerifyState>(
    sessionId ? { status: 'verifying' } : { status: 'idle' },
  );
  const showSuccess = verify.status === 'success';
  const showFinalizing =
    verify.status === 'verifying' || verify.status === 'finalizing';
  const showFailed = verify.status === 'failed';

  // 3D cockpit broadcast: page-navigate on mount
  useEffect(() => {
    broadcast({
      type: 'page-navigate',
      source: 'subscription-page',
      color: '#FFAA44',
      label: 'SUBSCRIPTION',
      targetPage: '/parent/subscription',
    });
  }, [broadcast]);

  // PAY-HIGH-003 (B): Verify the checkout session server-side, then
  // poll until the webhook has marked the parent as active.
  //
  //   POLL_INTERVAL_MS   — 2 s between retries
  //   MAX_POLL_ATTEMPTS  — 15 retries → 30 s total before giving up
  //
  // Outcomes:
  //   - session unpaid / expired / not-owned → verify = failed
  //   - paid + already active on first check → verify = success
  //   - paid but webhook lagging → verify = finalizing, poll
  //   - paid but webhook never arrives → verify = failed after timeout
  useEffect(() => {
    if (!sessionId) return;
    const POLL_INTERVAL_MS = 2000;
    const MAX_POLL_ATTEMPTS = 15;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function fetchStatus(attempt: number): Promise<void> {
      if (cancelled) return;
      try {
        const res = await fetch(
          `/api/stripe/session-status?session_id=${encodeURIComponent(sessionId!)}`,
        );
        const json = await res.json();
        const data = json?.data;

        if (!res.ok || !data) {
          setVerify({
            status: 'failed',
            reason:
              json?.error ||
              'We could not verify your checkout. If you were charged, please refresh in a moment.',
          });
          return;
        }

        // Unpaid session — treat as failure (user likely hit success_url
        // manually or the checkout expired).
        if (data.paymentStatus !== 'paid' && data.paymentStatus !== 'no_payment_required') {
          setVerify({
            status: 'failed',
            reason:
              data.status === 'expired'
                ? 'This checkout session has expired.'
                : 'Payment was not completed.',
          });
          return;
        }

        if (data.active) {
          setVerify({ status: 'success' });
          return;
        }

        // Paid but webhook hasn't updated the parents row yet.
        if (attempt >= MAX_POLL_ATTEMPTS) {
          setVerify({
            status: 'failed',
            reason:
              'Payment received — we are still finalizing your subscription. Refresh in a moment or contact support if this persists.',
          });
          return;
        }

        setVerify({ status: 'finalizing', attempt });
        timer = setTimeout(() => fetchStatus(attempt + 1), POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        setVerify({
          status: 'failed',
          reason: 'Network error while verifying checkout. Please refresh.',
        });
      }
    }

    fetchStatus(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  // v3 Gap 5: Robust cross-platform celebration dispatch
  //
  // Three layers of delivery, all firing independently so at least one
  // always reaches the user:
  //   1. HTML CelebrationBanner (mobile + desktop + no-cockpit fallback)
  //   2. sessionStorage bridge (survives Stripe redirect full reload)
  //   3. 3D broadcast + CeremonyFX (fires once cockpitReady === true)
  useEffect(() => {
    if (!showSuccess) return;

    // [Layer 1] Always render the HTML banner immediately
    setShowCelebrationBanner(true);

    // [Layer 2] Queue for any subsequent navigation/reload
    queuePendingCelebration({
      reason: 'subscription-upgrade',
      label: 'Subscription Active!',
      color: '#FFD700',
    });

    console.info('[celebration] HTML banner shown + sessionStorage queued');
  }, [showSuccess]);

  // [Layer 3] Phase 2 audit fix (Section 3.5): Unified celebration
  // state flow. Wait for cockpit to be ready, then auto-dispatch the
  // pending celebration through the single uiStore entry point. From
  // there, useCelebration3D handles mode switch, CeremonyFXBridge
  // renders the 3D effect, broadcast fires celebration-start for LED/
  // HUD reactions, and dismiss is owned solely by useCelebration3D
  // (no double-dismiss race).
  useAutoDispatchPendingCelebration(cockpitReady);

  // On cold mount we may also be landing here from a prior session
  // where the banner was queued but never consumed (e.g. user closed
  // the tab mid-celebration). Show the HTML banner so they don't miss it.
  useEffect(() => {
    if (showSuccess) return; // handled above
    const pending = peekPendingCelebration();
    if (pending) setShowCelebrationBanner(true);
  }, [showSuccess]);

  // v3 Gap 3: Two flows — (a) brand new checkout from free, (b) in-app
  // plan swap for existing paid users via DowngradeConfirmModal.
  async function handlePlanChange(targetTier: SubscriptionTier) {
    if (targetTier === tier) return;

    // Existing paid user → any non-same tier → route through modal
    // (covers plus↔forge and any→free). Modal handles confirmation,
    // feature delta, child archive selection, and the change endpoint.
    if (tier !== 'free') {
      setDowngradeTarget(targetTier);
      return;
    }

    // Free → paid: require affirmative auto-renewal consent BEFORE redirecting
    // to Stripe (CA ARL AB 2863 + ToS §4e item 3). Actual checkout fetch runs
    // inside confirmRenewalAndCheckout() once the parent checks the box.
    if (targetTier === 'free') return;
    setRenewalConsentChecked(false);
    setRenewalConsentTier(targetTier);
  }

  async function confirmRenewalAndCheckout() {
    const targetTier = renewalConsentTier;
    if (!targetTier || !renewalConsentChecked) return;

    const interval = billing === 'monthly' ? 'month' : 'year';
    setRenewalConsentLoading(true);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ tier: targetTier, interval }),
      });
      const data = await res.json();

      if (data.data?.url) {
        window.location.href = data.data.url;
      } else if (data.error) {
        toast.error(data.error);
        setRenewalConsentLoading(false);
      }
    } catch {
      toast.error('Failed to start checkout. Please try again.');
      setRenewalConsentLoading(false);
    }
  }

  async function handleManage() {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: csrfHeader() });
      const data = await res.json();

      if (data.data?.url) {
        window.location.href = data.data.url;
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to open billing portal. Please try again.');
    }
  }

  const yearlySavings = getYearlySavingsPercent('plus');

  return (
    <motion.div
      className="min-h-screen p-6 max-w-4xl mx-auto"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Back link */}
      <Link href="/parent">
        <motion.div
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: '#52586E' }}
          whileHover={{ x: -2 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </motion.div>
      </Link>

      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <BlurText text="Subscription" />
        </h1>
        <p className="text-sm mb-6" style={{ color: '#52586E' }}>
          Current plan:{' '}
          <span className="font-semibold" style={{ color: '#4F6EF7' }}>{TIER_DISPLAY[tier].name}</span>
        </p>
      </motion.div>

      {/* PAY-ENH-003: Dunning / grace banner. Renders nothing when not
          in a dunning sequence. */}
      <DunningBanner />

      {/* v3 Gap 2: Active trial countdown (inline variant) */}
      <TrialBanner variant="inline" />

      {/* v3 Gap 4: Current usage so upgrade narrative is self-evident */}
      <motion.div variants={staggerItem} className="mb-6">
        <UsageDashboard variant="card" showUpgradeCTA={false} defaultExpanded={false} />
      </motion.div>

      {/* PAY-HIGH-003 (B): Verification states from /api/stripe/session-status */}
      {showFinalizing && (
        <motion.div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.2)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#4F6EF7', borderTopColor: 'transparent' }}
            aria-hidden="true"
          />
          <p className="text-sm" style={{ color: '#52586E' }}>
            Finalizing subscription…{' '}
            {verify.status === 'finalizing' && verify.attempt > 2 && (
              <span className="text-xs" style={{ color: '#8C94AC' }}>
                (this should only take a few seconds)
              </span>
            )}
          </p>
        </motion.div>
      )}
      {showFailed && verify.status === 'failed' && (
        <motion.div
          className="mb-6 p-4 rounded-xl"
          style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm" style={{ color: '#C2410C' }}>{verify.reason}</p>
        </motion.div>
      )}
      {/* Success/canceled banners */}
      {showSuccess && (
        <motion.div
          className="mb-6 p-4 rounded-xl"
          style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1B8F4E' }}>
            Welcome to {TIER_DISPLAY[tier].name}! Your subscription is active.
          </p>
        </motion.div>
      )}
      {showCanceled && (
        <motion.div
          className="mb-6 p-4 rounded-xl"
          style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <p className="text-sm" style={{ color: '#52586E' }}>
            Checkout was canceled. No charges were made.
          </p>
        </motion.div>
      )}

      {/* Billing toggle — DASH-09: added aria-labels + role group */}
      <motion.div variants={staggerItem} className="flex items-center justify-center gap-3 mb-8" role="group" aria-label="Billing cycle">
        <button
          onClick={() => {
            setBilling('monthly');
            broadcast({ type: 'toggle-switch', source: 'billing-toggle', color: '#00BBFF', label: 'Monthly' });
          }}
          className="px-4 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40"
          style={
            billing === 'monthly'
              ? { background: 'rgba(79,110,247,0.1)', color: '#1A1D2B', border: '1px solid rgba(79,110,247,0.3)' }
              : { color: '#52586E', border: '1px solid transparent' }
          }
          aria-pressed={billing === 'monthly'}
          aria-label="Switch to monthly billing"
        >
          Monthly
        </button>
        <button
          onClick={() => {
            setBilling('yearly');
            broadcast({ type: 'toggle-switch', source: 'billing-toggle', color: '#00FF88', label: 'Yearly' });
          }}
          className="px-4 py-2 rounded-lg text-sm relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40"
          style={
            billing === 'yearly'
              ? { background: 'rgba(79,110,247,0.1)', color: '#1A1D2B', border: '1px solid rgba(79,110,247,0.3)' }
              : { color: '#52586E', border: '1px solid transparent' }
          }
          aria-pressed={billing === 'yearly'}
          aria-label="Switch to yearly billing"
        >
          Yearly
          {yearlySavings > 0 && (
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-2xs font-bold text-white" style={{ background: '#2ECC71' }}>
              Save {yearlySavings}%
            </span>
          )}
        </button>
      </motion.div>

      {/* Tier cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['free', 'plus', 'forge'] as SubscriptionTier[]).map((slug) => {
          const t = TIER_DISPLAY[slug];
          const Icon = TIER_ICONS[slug];
          const color = TIER_COLORS[slug];
          const isCurrent = tier === slug;
          const price = billing === 'monthly' ? t.monthlyPrice : t.yearlyPrice;
          const isPopular = t.highlight;

          return (
            <motion.div
              key={slug}
              className="relative rounded-2xl"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onHoverStart={() => broadcast({ type: 'button-press', source: `tier-${slug}`, color, label: t.name })}
            >
              <div
                className="p-6 relative rounded-2xl h-full"
                style={{
                  background: '#FFFFFF',
                  border: isPopular ? '2px solid #4F6EF7' : '1px solid #E6E9F4',
                  boxShadow: isPopular
                    ? '0 10px 34px rgba(79,110,247,0.18)'
                    : '0 8px 30px rgba(26,29,43,0.08)',
                }}
              >
                {isPopular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white z-10"
                    style={{ background: '#4F6EF7' }}
                  >
                    Most Popular
                  </span>
                )}

                <Icon className="w-8 h-8 mb-3" style={{ color }} />
                <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>{t.name}</h2>
                <p className="text-xs mb-3" style={{ color: '#52586E' }}>{t.tagline}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                    ${price === 0 ? '0' : price.toFixed(2)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm ml-1" style={{ color: '#8C94AC' }}>
                      /{billing === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6" role="list">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#2ECC71' }} />
                      <span className="text-xs" style={{ color: '#52586E' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    className="w-full py-3 rounded-xl text-sm font-bold cursor-default"
                    style={{ fontFamily: 'var(--font-display)', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.25)', color: '#1B8F4E' }}
                    disabled
                  >
                    Current Plan
                  </button>
                ) : slug === 'free' && tier === 'free' ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-display)', background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#8C94AC' }}
                  >
                    Free Forever
                  </button>
                ) : (
                  <motion.button
                    onClick={() => handlePlanChange(slug)}
                    className="w-full py-3 rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40"
                    style={
                      isDowngrade(tier, slug)
                        ? { fontFamily: 'var(--font-display)', background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#52586E' }
                        : { fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, #4F6EF7, #3B54D6)', color: '#FFFFFF' }
                    }
                    whileTap={{ scale: 0.98 }}
                    aria-label={
                      isDowngrade(tier, slug)
                        ? `Downgrade to ${t.name}`
                        : `Upgrade to ${t.name}`
                    }
                  >
                    {isDowngrade(tier, slug) ? 'Downgrade to' : 'Upgrade to'} {t.name}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Manage existing subscription */}
      {tier !== 'free' && (
        <motion.div variants={staggerItem} className="mt-8 text-center">
          <button
            onClick={handleManage}
            className="text-sm underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40 rounded-sm"
            style={{ color: '#4F6EF7' }}
          >
            Manage subscription via Stripe →
          </button>
        </motion.div>
      )}

      {/* UX-MED-006 (A) + PAY-MED-003: Delete account — irreversible
          action gated by type-to-confirm ConfirmDialog. */}
      <motion.div variants={staggerItem} className="mt-12 pt-8" style={{ borderTop: '1px solid #EEF2FA' }}>
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#52586E' }}>
            Danger Zone
          </h3>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: '#52586E' }}>
            Permanently delete your account and all associated child profiles,
            progress, and subscription data. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setDeleteAccountOpen(true)}
            className="text-xs underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 rounded-sm transition-colors"
            style={{ color: '#DC2626' }}
          >
            Delete my account
          </button>
        </div>
      </motion.div>

      {/* R1: CA ARL AB 2863 affirmative auto-renewal consent modal (free -> paid) */}
      {renewalConsentTier && (() => {
        const target = renewalConsentTier;
        const interval = billing === 'monthly' ? 'month' : 'year';
        const price = interval === 'month'
          ? TIER_DISPLAY[target].monthlyPrice
          : TIER_DISPLAY[target].yearlyPrice;
        const tierName = TIER_DISPLAY[target].name;
        const intervalLabel = interval === 'month' ? 'month' : 'year';
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="renewal-consent-title"
          >
            <div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#FFFFFF', border: '1px solid #E6E9F4', boxShadow: '0 20px 60px rgba(26,29,43,0.24)' }}
            >
              <h2
                id="renewal-consent-title"
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
              >
                Confirm your subscription
              </h2>
              <p className="text-sm mb-4" style={{ color: '#52586E' }}>
                Before we send you to Stripe, please confirm the auto-renewal terms below.
              </p>

              <div className="rounded-lg p-4 mb-4" style={{ background: '#F8FAFF', border: '1px solid #EEF2FA' }}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                    Spark {tierName}
                  </span>
                  <span className="font-data text-base" style={{ color: '#4F6EF7' }}>
                    ${price.toFixed(2)}/{intervalLabel}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#52586E' }}>
                  Renews automatically every {intervalLabel} at ${price.toFixed(2)} until you cancel.
                  {' '}Cancel any time from this page &mdash; no phone call required.
                  {interval === 'year' && ' For yearly plans, we email a reminder 3-21 days before each renewal.'}
                </p>
              </div>

              <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={renewalConsentChecked}
                  onChange={(e) => setRenewalConsentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded accent-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/50"
                  style={{ borderColor: '#E6E9F4', background: '#F6F8FD' }}
                  aria-describedby="renewal-consent-desc"
                />
                <span
                  id="renewal-consent-desc"
                  className="text-sm leading-relaxed transition-colors"
                  style={{ color: '#52586E' }}
                >
                  I understand this subscription will automatically renew at{' '}
                  <strong style={{ color: '#1A1D2B' }}>${price.toFixed(2)} per {intervalLabel}</strong>{' '}
                  until I cancel, and I authorize SparkForge LLC and Stripe to charge my payment method on each renewal.
                </span>
              </label>

              <p className="text-[11px] mb-5 leading-relaxed" style={{ color: '#8C94AC' }}>
                Full terms are in our{' '}
                <Link href="/terms#subscriptions" target="_blank" className="hover:underline" style={{ color: '#4F6EF7' }}>
                  Terms of Service &sect;&sect; 4e&ndash;4g
                </Link>.
                {' '}You can opt out of binding arbitration within 30 days of signup.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRenewalConsentTier(null);
                    setRenewalConsentChecked(false);
                  }}
                  disabled={renewalConsentLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40"
                  style={{ fontFamily: 'var(--font-display)', background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#52586E' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRenewalAndCheckout}
                  disabled={!renewalConsentChecked || renewalConsentLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40"
                  style={{ fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, #4F6EF7, #3B54D6)', color: '#FFFFFF' }}
                  aria-label="Agree and continue to Stripe checkout"
                >
                  {renewalConsentLoading ? 'Loading…' : 'Agree & Continue'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* v3 Gap 3: In-app downgrade/change flow */}
      <DowngradeConfirmModal
        isOpen={downgradeTarget !== null}
        onClose={() => setDowngradeTarget(null)}
        currentTier={tier}
        targetTier={downgradeTarget ?? 'free'}
        interval={billing === 'monthly' ? 'month' : 'year'}
      />

      {/* UX-MED-006 (A) + PAY-MED-003: Type-to-confirm delete-account */}
      <ConfirmDialog
        isOpen={deleteAccountOpen}
        onCancel={() => setDeleteAccountOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your SparkForge account?"
        message={
          <div className="space-y-3">
            <p>
              This will <strong className="text-white">permanently</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/70 text-xs ml-1">
              <li>Cancel any active subscription (no refund)</li>
              <li>Delete all child profiles, XP, badges, and progress</li>
              <li>Remove your Stripe customer record</li>
              <li>Sign you out immediately</li>
            </ul>
            <p className="text-xs text-white/55">
              You&apos;ll be signed out and redirected to the home page. Any
              in-flight session data will be lost.
            </p>
          </div>
        }
        confirmLabel="Delete account permanently"
        variant="danger"
        requireType="DELETE"
        lockOverlay
        isBusy={deleteBusy}
      />

      {/* v3 Gap 5: Guaranteed HTML celebration — fires regardless of
          mobile/desktop, cockpit state, or WebGPU availability. */}
      <CelebrationBanner
        show={showCelebrationBanner}
        title={`Welcome to ${TIER_DISPLAY[tier].name}!`}
        subtitle="Your subscription is active."
        color="#FFD700"
        duration={6000}
        onDismiss={() => setShowCelebrationBanner(false)}
      />
    </motion.div>
  );
}

// ENH #8: Suspense boundary wrapping useSearchParams per Next.js 14 best practice
export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-6 max-w-4xl mx-auto">
          <div className="h-8 w-48 rounded-lg animate-pulse mb-8" style={{ background: '#EEF2FA' }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl animate-pulse" style={{ background: '#EEF2FA' }} />
            ))}
          </div>
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
