// ════════════════════════════════════════════════════
// ADMIN ARCHIVED CHILDREN CLIENT
// v3 Gap 3 / Restore tool: UI for listing all soft-archived
// children across every parent account and restoring them
// with a single click. Matches the Frost-Prismatic aesthetic
// of AdminSubscriptionsClient (chrome bezels, glass cards,
// neon accents).
//
// Behaviour:
//   - Admins only (gate via useAuthStore().parent.is_admin)
//   - Search across child name, parent email, parent name
//   - Filter by parent tier
//   - Shows "would exceed limit" warning with restore blocked
//     if the parent's tier can't accommodate the restore
//   - Restore button opens a confirm modal with a reason field
//   - Success toast + list refresh after each restore
// ════════════════════════════════════════════════════
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  X,
  Users,
  Archive,
  AlertTriangle,
  Search,
  RotateCcw,
  Crown,
  Sparkles,
  Rocket,
  Clock,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { SubscriptionTier } from '@/lib/tier-config';

// ── Types ──────────────────────────────────────────
interface ArchivedChildRow {
  id: string;
  displayName: string;
  age: number;
  ageBand: string;
  deactivatedAt: string;
  createdAt: string;
  parent: {
    id: string;
    email: string;
    fullName: string | null;
    tier: SubscriptionTier;
    activeChildCount: number;
    maxChildren: number;
  } | null;
  wouldExceedLimit: boolean;
}

// ── Tier visuals ───────────────────────────────────
const TIER_META: Record<SubscriptionTier, { color: string; icon: typeof Sparkles; label: string }> = {
  free: { color: '#94A3B8', icon: Sparkles, label: 'Free' },
  plus: { color: '#3B82F6', icon: Crown, label: 'Plus' },
  forge: { color: '#F59E0B', icon: Rocket, label: 'Forge' },
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo ago`;
  return `${Math.floor(diffDays / 365)} yr ago`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main Client Component ──────────────────────────
export default function AdminArchivedChildrenClient() {
  const isAdmin = useAuthStore((s) => s.parent?.is_admin);
  const addToast = useToastStore((s) => s.addToast);

  const [rows, setRows] = useState<ArchivedChildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<SubscriptionTier | 'all'>('all');

  const [modalRow, setModalRow] = useState<ArchivedChildRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  // ── Fetch archived children ───────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ archivedChildren: ArchivedChildRow[]; total: number }>(
        '/api/admin/children/archived'
      );
      setRows(data.archivedChildren);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load archived children';
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Filter rows ───────────────────────────────────
  const filtered = rows.filter((r) => {
    if (filterTier !== 'all' && r.parent?.tier !== filterTier) return false;
    if (search) {
      const q = search.toLowerCase();
      const inName = r.displayName.toLowerCase().includes(q);
      const inEmail = (r.parent?.email ?? '').toLowerCase().includes(q);
      const inFullName = (r.parent?.fullName ?? '').toLowerCase().includes(q);
      if (!inName && !inEmail && !inFullName) return false;
    }
    return true;
  });

  // ── Modal handlers ────────────────────────────────
  function openRestore(row: ArchivedChildRow) {
    if (row.wouldExceedLimit) {
      addToast(
        'error',
        `Restoring ${row.displayName} would exceed the parent's ${row.parent?.tier.toUpperCase()} limit of ${row.parent?.maxChildren} profile(s). Archive another first, or upgrade.`
      );
      return;
    }
    setModalRow(row);
    setReason('');
  }

  function closeModal() {
    setModalRow(null);
    setSubmitting(false);
    setReason('');
  }

  async function submitRestore() {
    if (!modalRow) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/admin/children/${modalRow.id}/restore`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim() || undefined,
        }),
      });
      addToast(
        'success',
        `${modalRow.displayName} restored to ${modalRow.parent?.email}`
      );
      closeModal();
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Restore failed';
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
          <div className="flex items-center gap-3 mb-1">
            <Archive className="w-6 h-6 text-spark-purple" />
            <h1 className="font-display text-2xl font-bold text-white">
              Archived Child Profiles
            </h1>
          </div>
          <p className="font-body text-sm text-white/40">
            Soft-archived from tier downgrades. Click Restore to reactivate.
          </p>
          <p className="font-body text-xs text-white/30 mt-1">
            {rows.length} total archived · {filtered.length} shown
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white font-body text-sm transition-all"
          aria-label="Refresh archived children"
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
            placeholder="Search child name, parent email, or parent name…"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm placeholder:text-white/30 focus:outline-none focus:border-spark-blue/50"
            aria-label="Search archived children"
          />
        </div>

        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value as SubscriptionTier | 'all')}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm focus:outline-none focus:border-spark-blue/50"
          aria-label="Filter by parent tier"
        >
          <option value="all">All tiers</option>
          <option value="free">Free</option>
          <option value="plus">Plus</option>
          <option value="forge">Forge</option>
        </select>
      </motion.div>

      {/* ── Table ── */}
      <motion.div variants={staggerItem} className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr className="text-left font-body text-xs text-white/40">
                <th className="px-4 py-3 font-semibold">Child</th>
                <th className="px-4 py-3 font-semibold">Parent</th>
                <th className="px-4 py-3 font-semibold">Tier / Slots</th>
                <th className="px-4 py-3 font-semibold">Archived</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <RefreshCw className="w-6 h-6 text-white/30 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center font-body text-sm text-white/40">
                    {rows.length === 0
                      ? 'No archived children — everything is active!'
                      : 'No archived children match your filters'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const parent = row.parent;
                  const tier = parent?.tier ?? 'free';
                  const TierIcon = TIER_META[tier].icon;
                  const tierColor = TIER_META[tier].color;
                  const canRestore = !row.wouldExceedLimit;

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-spark-purple/10 border border-spark-purple/20 flex items-center justify-center">
                            <Users className="w-4 h-4 text-spark-purple" />
                          </div>
                          <div>
                            <div className="font-body text-sm text-white">
                              {row.displayName}
                            </div>
                            <div className="font-body text-xs text-white/40">
                              age {row.age} · band {row.ageBand}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {parent ? (
                          <>
                            <div className="font-body text-sm text-white/80">
                              {parent.email}
                            </div>
                            {parent.fullName && (
                              <div className="font-body text-xs text-white/40">
                                {parent.fullName}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="font-body text-xs text-white/30">orphaned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TierIcon className="w-3.5 h-3.5" style={{ color: tierColor }} />
                          <span className="font-body text-sm" style={{ color: tierColor }}>
                            {TIER_META[tier].label}
                          </span>
                        </div>
                        {parent && (
                          <div
                            className={`font-data text-2xs ${
                              parent.activeChildCount >= parent.maxChildren
                                ? 'text-spark-orange'
                                : 'text-white/40'
                            }`}
                          >
                            {parent.activeChildCount} / {parent.maxChildren} active
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-data text-xs text-white/60">
                          <Clock className="w-3 h-3 text-white/30" />
                          <div>
                            <div>{formatRelative(row.deactivatedAt)}</div>
                            <div className="text-2xs text-white/30">
                              {formatDate(row.deactivatedAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openRestore(row)}
                            disabled={!canRestore}
                            title={
                              canRestore
                                ? 'Restore this child profile'
                                : `Would exceed parent's tier limit (${parent?.activeChildCount}/${parent?.maxChildren})`
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-spark-green/10 border border-spark-green/20 text-spark-green text-xs font-body font-semibold hover:bg-spark-green/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                        </div>
                        {!canRestore && (
                          <div className="text-right mt-1">
                            <span className="font-body text-2xs text-spark-orange inline-flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              At limit
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Restore Confirmation Modal ── */}
      <AnimatePresence>
        {modalRow && (
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
              className="relative glass-card rounded-2xl w-full max-w-md p-6"
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

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-spark-green/10 border border-spark-green/20 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-spark-green" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Restore {modalRow.displayName}
                  </h2>
                  <p className="font-body text-xs text-white/40">
                    Reactivate this profile for {modalRow.parent?.email}
                  </p>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-spark-green/5 border border-spark-green/10">
                <p className="font-body text-sm text-white/80 mb-2">
                  This will:
                </p>
                <ul className="space-y-1 font-body text-xs text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-spark-green mt-0.5">•</span>
                    Clear the archived flag (preserves XP, badges, progress)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-spark-green mt-0.5">•</span>
                    Make the profile visible in the parent's dashboard again
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-spark-green mt-0.5">•</span>
                    Count toward the parent's active child limit (
                    {(modalRow.parent?.activeChildCount ?? 0) + 1} /{' '}
                    {modalRow.parent?.maxChildren} after restore)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-spark-green mt-0.5">•</span>
                    Log an entry in subscription_events for audit
                  </li>
                </ul>
              </div>

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
                  Cancel
                </button>
                <button
                  onClick={submitRestore}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-spark-green to-emerald-600 text-white font-display text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Restoring…' : 'Confirm Restore'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
