// ════════════════════════════════════════════════════
// DOWNGRADE CONFIRM MODAL — In-app plan change
// v3 Gap 3: Two-step flow
//   Step 1: Show feature delta + effective date
//   Step 2 (optional): Child archive selection if new tier's
//          maxChildren is less than the current count
//
// Matches PaywallModal pattern: glass-card-v2-elevated + motion + AnimatePresence
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  AlertTriangle,
  ArrowRight,
  Check,
  Minus,
  Plus,
  Calendar,
} from 'lucide-react';
import {
  TIER_DISPLAY,
  TIER_CONFIG,
  getFeatureDelta,
  isDowngrade,
  type SubscriptionTier,
} from '@/lib/tier-config';
import { apiFetch, ApiError } from '@/lib/api';
import { useToastStore } from '@/stores/toastStore';

interface DowngradeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentTier: SubscriptionTier;
  targetTier: SubscriptionTier;
  /** Billing interval when switching between paid tiers. */
  interval?: 'month' | 'year';
}

interface ChildSummary {
  id: string;
  display_name: string;
  age_band: 'A' | 'B' | 'C';
  xp: number;
  level: number;
}

interface MeResponse {
  subscriptionPeriodEnd: string | null;
  subscriptionTier: SubscriptionTier;
}

function formatEffectiveDate(iso: string | null): string {
  if (!iso) return 'the end of your current billing period';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'the end of your current billing period';
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DowngradeConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  currentTier,
  targetTier,
  interval = 'month',
}: DowngradeConfirmModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'review' | 'archive' | 'submitting'>('review');
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch<MeResponse>('/api/auth/me'),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => apiFetch<ChildSummary[]>('/api/children'),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const delta = getFeatureDelta(currentTier, targetTier);
  const goingDown = isDowngrade(currentTier, targetTier);
  const targetLimits = TIER_CONFIG[targetTier];
  const overLimit = Math.max(0, children.length - targetLimits.maxChildren);
  const effectiveDate = formatEffectiveDate(me?.subscriptionPeriodEnd ?? null);
  const archiveQuotaReached = selectedChildIds.size >= overLimit;

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('review');
      setSelectedChildIds(new Set());
      setError(null);
    }
  }, [isOpen, currentTier, targetTier]);

  function toggleChild(id: string) {
    setSelectedChildIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < overLimit) {
        next.add(id);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (overLimit > 0 && step === 'review') {
      setStep('archive');
      return;
    }
    if (overLimit > 0 && selectedChildIds.size < overLimit) {
      setError(`Please select ${overLimit} child profile${overLimit === 1 ? '' : 's'} to archive.`);
      return;
    }

    setStep('submitting');
    setError(null);

    try {
      const result = await apiFetch<{
        action: string;
        targetTier: string;
        currentPeriodEnd: string | null;
      }>('/api/stripe/subscription/change', {
        method: 'POST',
        body: JSON.stringify({
          targetTier,
          interval,
          archiveChildIds: Array.from(selectedChildIds),
        }),
      });

      const actionMessage =
        result.action === 'cancel_scheduled'
          ? `Your plan will switch to ${TIER_DISPLAY[targetTier].name} on ${formatEffectiveDate(result.currentPeriodEnd)}.`
          : `You're now on ${TIER_DISPLAY[targetTier].name}. Pro-rated changes apply immediately.`;

      addToast('success', actionMessage, 6000);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setStep(overLimit > 0 ? 'archive' : 'review');
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={step === 'submitting' ? undefined : onClose}
            aria-label="Close modal"
          />

          <motion.div
            className="relative glass-card-v2-elevated w-full max-w-lg p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: 'spring', damping: 25 },
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <button
              onClick={onClose}
              disabled={step === 'submitting'}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── Header ── */}
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  goingDown ? 'bg-spark-orange/10' : 'bg-spark-blue/10'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${goingDown ? 'text-spark-orange' : 'text-spark-blue'}`}
                />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  {goingDown ? 'Confirm Downgrade' : 'Confirm Plan Change'}
                </h2>
                <div className="flex items-center gap-1.5 font-body text-xs text-white/70">
                  <span>{TIER_DISPLAY[currentTier].name}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{TIER_DISPLAY[targetTier].name}</span>
                </div>
              </div>
            </div>

            {step === 'review' && (
              <>
                {/* ── Effective date ── */}
                <div className="mt-4 mb-4 p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-spark-blue flex-shrink-0" />
                  <div>
                    <div className="font-body text-xs text-white/70">
                      Changes apply on
                    </div>
                    <div className="font-display text-sm text-white font-semibold">
                      {effectiveDate}
                    </div>
                  </div>
                </div>

                {/* ── Feature delta ── */}
                {delta.lost.length > 0 && (
                  <div className="mb-4">
                    <div className="font-body text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
                      What you&apos;ll lose
                    </div>
                    <ul className="space-y-1.5">
                      {delta.lost.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 font-body text-sm text-white/70">
                          <Minus className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {delta.gained.length > 0 && (
                  <div className="mb-4">
                    <div className="font-body text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
                      What you&apos;ll gain
                    </div>
                    <ul className="space-y-1.5">
                      {delta.gained.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 font-body text-sm text-white/70">
                          <Plus className="w-4 h-4 text-spark-green flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── Over-limit warning ── */}
                {overLimit > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-spark-orange/5 border border-spark-orange/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-spark-orange flex-shrink-0 mt-0.5" />
                      <div className="font-body text-xs text-spark-orange">
                        <strong className="font-semibold">
                          {TIER_DISPLAY[targetTier].name} allows up to {targetLimits.maxChildren}{' '}
                          child profile{targetLimits.maxChildren === 1 ? '' : 's'}
                        </strong>
                        . You currently have {children.length}. You&apos;ll need to choose{' '}
                        {overLimit} profile{overLimit === 1 ? '' : 's'} to archive.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 'archive' && (
              <>
                <div className="mt-4 mb-2">
                  <div className="font-body text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
                    Select {overLimit} profile{overLimit === 1 ? '' : 's'} to archive
                  </div>
                  <p className="font-body text-xs text-white/70 mb-3">
                    Archived profiles are paused — their progress is kept, but they
                    won&apos;t count toward your {TIER_DISPLAY[targetTier].name} limit.
                  </p>
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {children.map((child) => {
                    const selected = selectedChildIds.has(child.id);
                    const disabled = !selected && archiveQuotaReached;
                    return (
                      <button
                        key={child.id}
                        onClick={() => toggleChild(child.id)}
                        disabled={disabled}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selected
                            ? 'bg-spark-orange/10 border-spark-orange/40'
                            : disabled
                            ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            selected
                              ? 'bg-spark-orange border-spark-orange'
                              : 'border-white/20'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-display text-sm text-white">
                            {child.display_name}
                          </div>
                          <div className="font-body text-xs text-white/70">
                            Age band {child.age_band} · Level {child.level} · {child.xp} XP
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mb-4 text-center font-body text-xs text-white/50">
                  {selectedChildIds.size} of {overLimit} selected
                </div>
              </>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 font-body text-sm text-red-300">
                {error}
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={step === 'submitting'}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-body text-sm hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleConfirm}
                disabled={
                  step === 'submitting' ||
                  (step === 'archive' && !archiveQuotaReached)
                }
                className={`flex-1 py-3 rounded-xl font-display text-sm font-bold transition-all disabled:opacity-50 ${
                  goingDown
                    ? 'bg-gradient-to-r from-spark-orange to-amber-600 text-white'
                    : 'bg-gradient-to-r from-spark-blue to-blue-600 text-white'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {step === 'submitting'
                  ? 'Applying…'
                  : step === 'review' && overLimit > 0
                  ? 'Continue'
                  : goingDown
                  ? 'Confirm Downgrade'
                  : 'Confirm Change'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
