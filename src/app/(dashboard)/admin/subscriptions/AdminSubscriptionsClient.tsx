// ════════════════════════════════════════════════════
// ADMIN SUBSCRIPTIONS — Cross-account billing management
// v3 Gap 1: Admin tool for canceling/changing subscriptions
// without forcing users into the hosted Stripe portal.
// Styled to match AdminContentClient (Frost-Prismatic).
// ════════════════════════════════════════════════════
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  X,
  Crown,
  Sparkles,
  Rocket,
  AlertTriangle,
  Search,
  Check,
  Clock,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { SubscriptionTier } from '@/lib/tier-config';

// ── Types ──────────────────────────────────────────
interface SubscriptionRow {
  id: string;
  email: string;
  fullName: string | null;
  tier: SubscriptionTier;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  subscriptionPeriodEnd: string | null;
  createdAt: string;
}

type ActionMode = 'cancel' | 'change' | null;

// ── Tier visuals ───────────────────────────────────
const TIER_META: Record<SubscriptionTier, { color: string; icon: typeof Sparkles; label: string }> = {
  free: { color: '#94A3B8', icon: Sparkles, label: 'Free' },
  plus: { color: '#3B82F6', icon: Crown, label: 'Plus' },
  forge: { color: '#F59E0B', icon: Rocket, label: 'Forge' },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-spark-green bg-spark-green/10 border-spark-green/20',
  trialing: 'text-spark-blue bg-spark-blue/10 border-spark-blue/20',
  past_due: 'text-spark-orange bg-spark-orange/10 border-spark-orange/20',
  canceled: 'text-white/40 bg-white/5 border-white/10',
  none: 'text-white/40 bg-white/5 border-white/10',
  paused: 'text-spark-purple bg-spark-purple/10 border-spark-purple/20',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main Client Component ──────────────────────────
export default function AdminSubscriptionsClient() {
  const isAdmin = useAuthStore((s) => s.parent?.is_admin);
  const addToast = useToastStore((s) => s.addToast);

  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<SubscriptionTier | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [modalRow, setModalRow] = useState<SubscriptionRow | null>(null);
  const [modalMode, setModalMode] = useState<ActionMode>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [immediate, setImmediate] = useState(false);
  const [targetTier, setTargetTier] = useState<SubscriptionTier>('plus');
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  // ── Fetch subscriptions ───────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ subscriptions: SubscriptionRow[] }>(
        '/api/admin/subscriptions'
      );
      setRows(data.subscriptions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load subscriptions';
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Filter rows ────────────────────────────────────
  const filtered = rows.filter((r) => {
    if (filterTier !== 'all' && r.tier !== filterTier) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.email.toLowerCase().includes(q) &&
        !(r.fullName ?? '').toLowerCase().includes(q) &&
        !(r.stripeCustomerId ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // ── Modal handlers ─────────────────────────────────
  function openCancel(row: SubscriptionRow) {
    setModalRow(row);
    setModalMode('cancel');
    setReason('');
    setImmediate(false);
  }

  function openChange(row: SubscriptionRow) {
    setModalRow(row);
    setModalMode('change');
    setReason('');
    setTargetTier(row.tier === 'plus' ? 'forge' : 'plus');
    setInterval('month');
  }

  function closeModal() {
    setModalRow(null);
    setModalMode(null);
    setSubmitting(false);
  }

  async function submitCancel() {
    if (!modalRow) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/admin/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({
          parentId: modalRow.id,
          immediate,
          reason: reason || undefined,
        }),
      });
      addToast('success', `Subscription canceled for ${modalRow.email}`);
      closeModal();
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cancel failed';
      addToast('error', msg);
      setSubmitting(false);
    }
  }

  async function submitChange() {
    if (!modalRow) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/admin/subscriptions/change', {
        method: 'POST',
        body: JSON.stringify({
          parentId: modalRow.id,
          targetTier,
          interval,
          reason: reason || undefined,
        }),
      });
      addToast(
        'success',
        `${modalRow.email} changed to ${TIER_META[targetTier].label}`
      );
      closeModal();
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Change failed';
      addToast('error', msg);
      setSubmitting(false);
    }
  }

  // ── Access gate ────────────────────────────────────
  if (isAdmin === false) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-spark-orange mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Admin access required
          </h2>
          <p className="font-body text-sm text-white/50">
            You must be an admin to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen p-6 max-w-7xl mx-auto"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* ── Header ── */}
      <Link href="/parent">
        <motion.div
          className="inline-flex items-center gap-2 text-white/60 hover:text-white font-body text-sm mb-6 transition-colors"
          whileHover={{ x: -2 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </motion.div>
      </Link>

      <motion.div variants={staggerItem} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            Subscription Management
          </h1>
          <p className="font-body text-sm text-white/40">
            {rows.length} total accounts · {filtered.length} shown
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white font-body text-sm transition-all"
          aria-label="Refresh subscriptions"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        variants={staggerItem}
        className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, name, or customer ID…"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm placeholder:text-white/30 focus:outline-none focus:border-spark-blue/50"
            aria-label="Search subscriptions"
          />
        </div>

        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value as SubscriptionTier | 'all')}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm focus:outline-none focus:border-spark-blue/50"
          aria-label="Filter by tier"
        >
          <option value="all">All tiers</option>
          <option value="free">Free</option>
          <option value="plus">Plus</option>
          <option value="forge">Forge</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm focus:outline-none focus:border-spark-blue/50"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past due</option>
          <option value="canceled">Canceled</option>
          <option value="paused">Paused</option>
          <option value="none">None</option>
        </select>
      </motion.div>

      {/* ── Table ── */}
      <motion.div variants={staggerItem} className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr className="text-left font-body text-xs text-white/40">
                <th className="px-4 py-3 font-semibold">Parent</th>
                <th className="px-4 py-3 font-semibold">Tier</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Trial Ends</th>
                <th className="px-4 py-3 font-semibold">Period Ends</th>
                <th className="px-4 py-3 font-semibold">Stripe Sub ID</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <RefreshCw className="w-6 h-6 text-white/30 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center font-body text-sm text-white/40">
                    No subscriptions match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const Icon = TIER_META[row.tier].icon;
                  const color = TIER_META[row.tier].color;
                  const hasSub = !!row.stripeSubscriptionId;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-body text-sm text-white">{row.email}</div>
                        {row.fullName && (
                          <div className="font-body text-xs text-white/40">{row.fullName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                          <span className="font-body text-sm" style={{ color }}>
                            {TIER_META[row.tier].label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md border text-2xs font-body ${
                            STATUS_COLORS[row.status] ?? STATUS_COLORS.none
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-data text-xs text-white/60">
                        {row.trialEndsAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-spark-blue" />
                            {formatDate(row.trialEndsAt)}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 font-data text-xs text-white/60">
                        {formatDate(row.subscriptionPeriodEnd)}
                      </td>
                      <td className="px-4 py-3 font-data text-xs text-white/30 max-w-[180px] truncate">
                        {row.stripeSubscriptionId || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openChange(row)}
                            disabled={!hasSub}
                            className="px-3 py-1 rounded-lg bg-spark-blue/10 border border-spark-blue/20 text-spark-blue text-xs font-body font-semibold hover:bg-spark-blue/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => openCancel(row)}
                            disabled={!hasSub}
                            className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-body font-semibold hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Action Modal ── */}
      <AnimatePresence>
        {modalRow && modalMode && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={submitting ? undefined : closeModal}
            />

            <motion.div
              className="relative glass-card-v2-elevated w-full max-w-md p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <button
                onClick={closeModal}
                disabled={submitting}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all disabled:opacity-30"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="font-display text-lg font-bold text-white mb-1">
                {modalMode === 'cancel' ? 'Cancel Subscription' : 'Change Plan'}
              </h2>
              <p className="font-body text-xs text-white/40 mb-4">{modalRow.email}</p>

              {modalMode === 'cancel' ? (
                <>
                  <div className="mb-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <p className="font-body text-sm text-red-300">
                      Currently on{' '}
                      <span className="font-semibold">
                        {TIER_META[modalRow.tier].label}
                      </span>
                      . Canceling will downgrade them to Free.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={immediate}
                      onChange={(e) => setImmediate(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-spark-blue"
                    />
                    <span className="font-body text-sm text-white/70">
                      Cancel immediately (default: cancel at period end)
                    </span>
                  </label>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {(['free', 'plus', 'forge'] as SubscriptionTier[])
                      .filter((t) => t !== modalRow.tier)
                      .map((t) => {
                        const Icon = TIER_META[t].icon;
                        const color = TIER_META[t].color;
                        const selected = targetTier === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setTargetTier(t)}
                            className={`p-3 rounded-xl border transition-all text-left ${
                              selected
                                ? 'bg-white/10 border-white/30'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4" style={{ color }} />
                              <span className="font-display text-sm font-bold text-white">
                                {TIER_META[t].label}
                              </span>
                              {selected && <Check className="w-4 h-4 text-spark-green ml-auto" />}
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {targetTier !== 'free' && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setInterval('month')}
                        className={`flex-1 py-2 rounded-lg font-body text-xs ${
                          interval === 'month'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'text-white/40 border border-white/5'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setInterval('year')}
                        className={`flex-1 py-2 rounded-lg font-body text-xs ${
                          interval === 'year'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'text-white/40 border border-white/5'
                        }`}
                      >
                        Yearly
                      </button>
                    </div>
                  )}
                </>
              )}

              <label className="block font-body text-xs text-white/40 mb-1">
                Reason (optional — logged to audit trail)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="e.g. User requested via support ticket #1234"
                className="w-full mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm placeholder:text-white/20 focus:outline-none focus:border-spark-blue/50 resize-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-body text-sm hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={modalMode === 'cancel' ? submitCancel : submitChange}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl font-display text-sm font-bold transition-all ${
                    modalMode === 'cancel'
                      ? 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30'
                      : 'bg-gradient-to-r from-spark-blue to-blue-600 text-white'
                  } disabled:opacity-50`}
                >
                  {submitting ? 'Working…' : modalMode === 'cancel' ? 'Confirm Cancel' : 'Apply Change'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
