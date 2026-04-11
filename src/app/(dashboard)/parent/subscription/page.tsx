// ════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT — Current plan, upgrade/downgrade
// v2: Uses tier-config.ts, Frost-Prismatic, success/cancel banners
// v3: S8 audit fixes (Batch 2) + 3D cockpit broadcasts (Batch 6)
// Enhancements: #2 tier badge color glow, #5 animated gradient
//   border on "Most Popular", #8 Suspense wrapper for useSearchParams
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { useUIStore } from '@/stores/uiStore';
import { TrialBanner } from '@/components/parent/TrialBanner';
import { DowngradeConfirmModal } from '@/components/parent/DowngradeConfirmModal';
import { UsageDashboard } from '@/components/parent/UsageDashboard';
import { isDowngrade } from '@/lib/tier-config';

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
  const { tier } = useParentStore();
  const searchParams = useSearchParams();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const triggerCelebration = useUIStore((s) => s.triggerCelebration);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  // v3 Gap 3: Downgrade/change modal
  const [downgradeTarget, setDowngradeTarget] = useState<SubscriptionTier | null>(null);

  const showSuccess = searchParams.get('success') === 'true';
  const showCanceled = searchParams.get('canceled') === 'true';

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

  // B1: CeremonyFX on successful subscription return
  useEffect(() => {
    if (showSuccess) {
      broadcast({
        type: 'celebration-start',
        source: 'subscription-upgrade',
        color: '#FFD700',
        label: 'Subscription Active!',
      });
      triggerCelebration('confetti', { reason: 'subscription-upgrade' });
    }
  }, [showSuccess, broadcast, triggerCelebration]);

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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
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
        <p className="font-body text-sm text-white/40 mb-6">
          Current plan:{' '}
          <span className="text-spark-blue font-semibold">{TIER_DISPLAY[tier].name}</span>
        </p>
      </motion.div>

      {/* v3 Gap 2: Active trial countdown (inline variant) */}
      <TrialBanner variant="inline" />

      {/* v3 Gap 4: Current usage so upgrade narrative is self-evident */}
      <motion.div variants={staggerItem} className="mb-6">
        <UsageDashboard variant="card" showUpgradeCTA={false} defaultExpanded={false} />
      </motion.div>

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

      {/* Billing toggle */}
      <motion.div variants={staggerItem} className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => {
            setBilling('monthly');
            broadcast({ type: 'toggle-switch', source: 'billing-toggle', color: '#00BBFF', label: 'Monthly' });
          }}
          className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
            billing === 'monthly'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/40 hover:text-white/60'
          }`}
          aria-pressed={billing === 'monthly'}
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
              : 'text-white/40 hover:text-white/60'
          }`}
          aria-pressed={billing === 'yearly'}
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
                className={`glass-card rounded-2xl p-6 relative ${
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
                <p className="font-body text-xs text-white/40 mb-3">{t.tagline}</p>

                <div className="mb-4">
                  <span className="font-display text-3xl font-bold text-white">
                    ${price === 0 ? '0' : price.toFixed(2)}
                  </span>
                  {price > 0 && (
                    <span className="font-body text-sm text-white/30 ml-1">
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
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/30 font-display text-sm cursor-not-allowed"
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
            className="font-body text-sm text-white/30 underline hover:text-white/50 transition-colors"
          >
            Manage subscription via Stripe →
          </button>
        </motion.div>
      )}

      {/* v3 Gap 3: In-app downgrade/change flow */}
      <DowngradeConfirmModal
        isOpen={downgradeTarget !== null}
        onClose={() => setDowngradeTarget(null)}
        currentTier={tier}
        targetTier={downgradeTarget ?? 'free'}
        interval={billing === 'monthly' ? 'month' : 'year'}
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
