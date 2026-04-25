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
import { motion } from 'motion/react';
import { useParentStore } from '@/stores/parentStore';
import {
  TIER_DISPLAY, getYearlySavingsPercent,
  type SubscriptionTier,
} from '@/lib/tier-config';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Check, Sparkles, Crown, Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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

// ENH #2: Tier-specific glow colors
const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: '#94A3B8',
  plus: '#3B82F6',
  forge: '#F59E0B',
};

// ENH #2: Tier-specific shadow glow classes
const TIER_GLOW: Record<SubscriptionTier, string> = {
  free: 'shadow-[0_0_20px_rgba(148,163,184,0.15)]',
  plus: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
  forge: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
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

    // Free → paid: start a fresh Stripe Checkout session
    if (targetTier === 'free') return;

    const interval = billing === 'monthly' ? 'month' : 'year';

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
      }
    } catch {
      toast.error('Failed to start checkout. Please try again.');
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
          className="inline-flex items-center gap-2 text-white/60 hover:text-white font-body text-sm mb-6 transition-colors"
          whileHover={{ x: -2 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </motion.div>
      </Link>

      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Subscription</h1>
        <p className="font-body text-sm text-white/70 mb-6">
          Current plan:{' '}
          <span className="text-spark-blue font-semibold">{TIER_DISPLAY[tier].name}</span>
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
          className="mb-6 p-4 rounded-xl bg-spark-blue/10 border border-spark-blue/20 flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          aria-live="polite"
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-spark-blue border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <p className="font-body text-sm text-white/70">
            Finalizing subscription…{' '}
            {verify.status === 'finalizing' && verify.attempt > 2 && (
              <span className="text-white/70 text-xs">
                (this should only take a few seconds)
              </span>
            )}
          </p>
        </motion.div>
      )}
      {showFailed && verify.status === 'failed' && (
        <motion.div
          className="mb-6 p-4 rounded-xl bg-spark-orange/10 border border-spark-orange/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          aria-live="assertive"
        >
          <p className="font-body text-sm text-white/80">{verify.reason}</p>
        </motion.div>
      )}
      {/* Success/canceled banners */}
      {showSuccess && (
        <motion.div
          className="mb-6 p-4 rounded-xl bg-spark-green/10 border border-spark-green/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-display text-sm font-bold text-spark-green">
            Welcome to {TIER_DISPLAY[tier].name}! Your subscription is active.
          </p>
        </motion.div>
      )}
      {showCanceled && (
        <motion.div
          className="mb-6 p-4 rounded-xl bg-spark-orange/10 border border-spark-orange/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-body text-sm text-white/60">
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
          className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
            billing === 'monthly'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/70 hover:text-white/60'
          }`}
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
          className={`px-4 py-2 rounded-lg font-body text-sm relative transition-all ${
            billing === 'yearly'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/70 hover:text-white/60'
          }`}
          aria-pressed={billing === 'yearly'}
          aria-label="Switch to yearly billing"
        >
          Yearly
          {yearlySavings > 0 && (
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded bg-spark-green text-2xs font-bold text-black">
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
              className={`relative rounded-2xl ${
                isPopular ? '' : ''
              }`}
              whileHover={{ y: -4 }}
              onHoverStart={() => broadcast({ type: 'button-press', source: `tier-${slug}`, color, label: t.name })}
            >
              {/* ENH #5: Animated gradient border on "Most Popular" card */}
              {isPopular && (
                <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'conic-gradient(from 0deg, #00BBFF, #AA66FF, #FF66AA, #FFAA44, #00FF88, #00BBFF)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              )}

              <div
                className={`glass-card-v2 p-6 relative ${
                  isPopular ? '' : ''
                } ${TIER_GLOW[slug]}`}
              >
                {/* ENH #2: Tier badge glow behind icon */}
                <div
                  className="absolute top-4 right-4 w-10 h-10 rounded-full blur-xl opacity-30 pointer-events-none"
                  style={{ backgroundColor: color }}
                />

                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-spark-blue text-xs font-bold text-white z-10">
                    Most Popular
                  </span>
                )}

                <Icon className="w-8 h-8 mb-3" style={{ color }} />
                <h2 className="font-display text-lg font-bold text-white">{t.name}</h2>
                <p className="font-body text-xs text-white/70 mb-3">{t.tagline}</p>

                <div className="mb-4">
                  <span className="font-display text-3xl font-bold text-white">
                    ${price === 0 ? '0' : price.toFixed(2)}
                  </span>
                  {price > 0 && (
                    <span className="font-body text-sm text-white/60 ml-1">
                      /{billing === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6" role="list">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-spark-green flex-shrink-0 mt-0.5" />
                      <span className="font-body text-xs text-white/60">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    className="w-full py-3 rounded-xl bg-spark-green/10 border border-spark-green/20 text-spark-green font-display text-sm font-bold cursor-default"
                    disabled
                  >
                    Current Plan
                  </button>
                ) : slug === 'free' && tier === 'free' ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display text-sm cursor-not-allowed"
                  >
                    Free Forever
                  </button>
                ) : (
                  <motion.button
                    onClick={() => handlePlanChange(slug)}
                    className={`w-full py-3 rounded-xl font-display text-sm font-bold ${
                      isDowngrade(tier, slug)
                        ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                        : 'bg-gradient-to-r from-spark-blue to-blue-600 text-white'
                    }`}
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
            className="font-body text-sm text-white/60 underline hover:text-white/50 transition-colors"
          >
            Manage subscription via Stripe →
          </button>
        </motion.div>
      )}

      {/* UX-MED-006 (A) + PAY-MED-003: Delete account — irreversible
          action gated by type-to-confirm ConfirmDialog. */}
      <motion.div variants={staggerItem} className="mt-12 pt-8 border-t border-white/5">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="font-display text-sm font-semibold text-white/60 mb-2">
            Danger Zone
          </h3>
          <p className="font-body text-xs text-white/70 mb-4 leading-relaxed">
            Permanently delete your account and all associated child profiles,
            progress, and subscription data. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setDeleteAccountOpen(true)}
            className="font-body text-xs text-red-400/70 underline hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 rounded-sm transition-colors"
          >
            Delete my account
          </button>
        </div>
      </motion.div>

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
          <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
