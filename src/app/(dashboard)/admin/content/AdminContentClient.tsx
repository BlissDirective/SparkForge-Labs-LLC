// ════════════════════════════════════════════════════
// ADMIN CONTENT REVIEW — Queue manager + run history
// v2 [ENH-9B]: Run History tab
// v2 [ENH-9C]: Bulk select/approve/reject
// v2 [ENH-8E]: Frost-Prismatic styling
// v2 [ACC]: ARIA labels, keyboard navigation, focus mgmt
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import {
  Check,
  X,
  Eye,
  RefreshCw,
  Play,
  AlertTriangle,
  Clock,
  BookOpen,
  Sparkles,
  ArrowLeft,
  History,
  FileText,
  Shield,
  Zap,
  Loader2,
  HelpCircle,
  Mail,
  Gamepad2,
  Trophy,
  TrendingUp,
  GitBranch,
  Search,
  BarChart3,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────
interface QueueItem {
  id: string;
  title: string;
  type: string;
  target_age_band: string;
  world: number;
  difficulty: string;
  content_json: {
    content_body?: string;
    quiz_questions?: {
      question: string;
      options: string[];
      correct_index: number;
      explanation?: string;
      hint?: string;
    }[];
    xp_reward?: number;
    estimated_duration_minutes?: number;
  };
  safety_check: {
    passed: boolean;
    flags: string[];
    flesch_kincaid_grade: number;
    notes: string;
    recommendation: string;
  };
  source_urls: string[];
  status: string;
  rejection_reason?: string;
  generated_at: string;
}

interface Stats {
  pending: number;
  flagged: number;
  approvedToday: number;
  rejectedToday: number;
}

interface AgentRun {
  id: string;
  run_id: string;
  findings_count: number;
  generated_count: number;
  approved_count: number;
  flagged_count: number;
  rejected_count: number;
  errors: string[];
  duration_ms: number | null;
  completed_at: string | null;
  created_at: string;
}

const LAB_NAMES: Record<number, string> = {
  1: 'What IS AI?',
  2: 'Teaching Machines',
  3: 'The Brain Inside',
  4: 'AI That Creates',
  5: 'AI Helpers',
  6: 'AI & Ethics',
  7: 'Computer Vision',
  8: 'Words & Language',
  9: 'Build with AI',
  10: "AI's Future",
};

const BAND_COLORS: Record<string, string> = {
  A: '#3B82F6',
  B: '#8B5CF6',
  C: '#F59E0B',
};

// ── Type-to-icon mapping (Lucide, not emoji) ───────
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'lesson':
      return <BookOpen className="w-4 h-4 text-spark-blue" />;
    case 'quiz':
      return <HelpCircle className="w-4 h-4 text-spark-purple" />;
    case 'spark_fact':
      return <Zap className="w-4 h-4 text-spark-orange" />;
    case 'game_scenario':
      return <Gamepad2 className="w-4 h-4 text-green-400" />;
    case 'game_challenge':
      return <Trophy className="w-4 h-4 text-amber-400" />;
    case 'trending_topic':
      return <TrendingUp className="w-4 h-4 text-cyan-400" />;
    case 'branching_lesson':
      return <GitBranch className="w-4 h-4 text-pink-400" />;
    default:
      return <FileText className="w-4 h-4 text-white/40" />;
  }
}

// ── Format duration ────────────────────────────────
function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export default function AdminReviewPage() {
  const router = useRouter();
  const parent = useAuthStore((s) => s.parent);

  // ── Admin guard — redirect non-admins ──
  // Note: Server-side admin enforcement via API 403 responses — this is defense-in-depth UI redirect
  useEffect(() => {
    if (parent && !parent.is_admin) {
      router.replace('/home');
    }
  }, [parent, router]);

  // ── State ──
  const [activeTab, setActiveTab] = useState<'review' | 'runs' | 'analytics'>('review');
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    flagged: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [filter, setFilter] = useState('pending_review');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [pipelineMode, setPipelineMode] = useState<'standard' | 'enhanced' | 'full'>('enhanced');
  // Phase 7: Search, type filter, analytics
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const addToast = useToastStore((s) => s.addToast);
  const modalRef = useRef<HTMLDivElement>(null);
  const rejectDialogRef = useRef<HTMLDivElement>(null);

  // ── Escape key handler for modals ────────────────
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showRejectDialog) {
          setShowRejectDialog(false);
        } else if (preview) {
          setPreview(null);
        }
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [preview, showRejectDialog]);

  // ── Focus management for modals ──────────────────
  useEffect(() => {
    if (preview && modalRef.current) {
      modalRef.current.focus();
    }
  }, [preview]);

  useEffect(() => {
    if (showRejectDialog && rejectDialogRef.current) {
      rejectDialogRef.current.focus();
    }
  }, [showRejectDialog]);

  // ── Data loaders ──
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/review?status=${filter}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.data?.items || data.items || []);
      if (data.data?.stats || data.stats) {
        setStats(data.data?.stats || data.stats);
      }
    } catch (e) {
      console.error('Failed to load queue:', e);
      addToast('error', 'Could not load review queue. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/review?tab=runs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRuns(data.data?.runs || data.runs || []);
    } catch (e) {
      console.error('Failed to load runs:', e);
      addToast('error', 'Could not load run history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (activeTab === 'review') loadQueue();
    else loadRuns();
  }, [activeTab, filter, loadQueue, loadRuns]);

  // ── Selection helpers ──
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  // ── Actions ──
  async function handleBulkAction(action: 'approve' | 'reject') {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    try {
      const res = await fetch('/api/agent/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids,
          reason:
            action === 'reject'
              ? rejectReason || 'Rejected by admin'
              : undefined,
        }),
      });

      const result = await res.json();
      const summary = result.data?.summary || result.summary;

      setSelected(new Set());
      setRejectReason('');
      setShowRejectDialog(false);

      addToast(
        summary?.failed > 0 ? 'warning' : 'success',
        `${summary?.succeeded || ids.length} of ${summary?.total || ids.length} items ${action === 'approve' ? 'approved' : 'rejected'}.`
      );

      loadQueue();
    } catch (e) {
      console.error('Bulk action failed:', e);
      addToast('error', `Could not ${action} items. Please try again.`);
    }
  }

  async function handleSingleAction(
    id: string,
    action: 'approve' | 'reject'
  ) {
    setActionLoading((prev) => new Set(prev).add(id));

    try {
      const res = await fetch('/api/agent/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: [id],
          reason: action === 'reject' ? 'Rejected by admin' : undefined,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setPreview(null);
      addToast(
        'success',
        action === 'approve'
          ? 'Content published successfully.'
          : 'Content has been rejected.'
      );

      loadQueue();
    } catch (e) {
      console.error('Action failed:', e);
      addToast('error', `Could not ${action} this item. Please try again.`);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function triggerAgent() {
    setAgentRunning(true);
    try {
      const res = await fetch(`/api/agent/run?mode=${pipelineMode}`, { method: 'POST' });
      const result = await res.json();

      if (result.data?.success || result.success) {
        addToast('success', 'Content agent pipeline finished. Check the queue for new items.');
        loadQueue();
        if (activeTab === 'runs') loadRuns();
      } else {
        addToast('error', result.data?.error || result.error || 'Unknown error occurred.');
      }
    } catch {
      addToast('error', 'Could not reach the agent API. Check the console for details.');
    } finally {
      setAgentRunning(false);
    }
  }

  // ── Render helpers ──
  const isActionableFilter =
    filter === 'pending_review' || filter === 'needs_human_review';

  // Phase 7: Client-side search + type filter
  const filteredItems = items.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Phase 7: Analytics computation
  const analytics = {
    totalItems: items.length,
    byType: items.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    byWorld: items.reduce<Record<number, number>>((acc, item) => {
      acc[item.world] = (acc[item.world] || 0) + 1;
      return acc;
    }, {}),
    byBand: items.reduce<Record<string, number>>((acc, item) => {
      acc[item.target_age_band] = (acc[item.target_age_band] || 0) + 1;
      return acc;
    }, {}),
  };

  // Don't render admin UI until parent is verified as admin
  if (!parent?.is_admin) return null;

  return (
    <motion.div
      className="min-h-screen p-6 max-w-6xl mx-auto"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* ═══ HEADER ═══ */}
      <motion.div
        variants={staggerItem}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <Link href="/parent">
            <motion.div
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.div>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Content Review
            </h1>
            <p className="font-body text-xs text-white/30">
              Admin-only content management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <motion.button
            onClick={() =>
              activeTab === 'review' ? loadQueue() : loadRuns()
            }
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
            aria-label="Refresh data"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
          </motion.button>

          {/* Pipeline mode selector */}
          <select
            value={pipelineMode}
            onChange={(e) => setPipelineMode(e.target.value as 'standard' | 'enhanced' | 'full')}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 font-body text-sm focus:outline-none focus:ring-2 focus:ring-spark-blue/40"
            aria-label="Pipeline generation mode"
          >
            <option value="standard">Standard (lessons/quizzes/facts)</option>
            <option value="enhanced">Enhanced (+ scenarios/challenges/branching)</option>
            <option value="full">Full (+ trending topics)</option>
          </select>

          {/* Phase 9: Generate New Game button */}
          <motion.button
            onClick={async () => {
              addToast('info', 'Starting new game generation...');
              try {
                const res = await fetch('/api/agent/game-generator', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                });
                const result = await res.json();
                if (res.ok && result.data?.concept) {
                  const c = result.data.concept;
                  const passedGates = (result.data.gates || []).filter((g: { status: string }) => g.status === 'passed').length;
                  addToast('success', `New game "${c.name}" (${c.tier}) generated! ${passedGates} gates passed. Review in Architecture Queue.`);
                } else {
                  addToast('error', result.error || 'Game generation failed.');
                }
              } catch {
                addToast('error', 'Could not reach game generator API.');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/20 text-amber-400 font-display text-sm hover:border-amber-400/40 transition-colors"
            whileTap={{ scale: 0.98 }}
            aria-label="Generate new game"
          >
            <Gamepad2 className="w-4 h-4" /> New Game
          </motion.button>

          {/* Run Agent button */}
          <motion.button
            onClick={triggerAgent}
            disabled={agentRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.98 }}
            aria-label="Run content agent"
          >
            {agentRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {agentRunning ? 'Running Agent...' : 'Run Agent Now'}
          </motion.button>
        </div>
      </motion.div>

      {/* ═══ TOP TABS: Review / Run History ═══ */}
      <motion.div variants={staggerItem} className="flex gap-2 mb-6">
        {(
          [
            { key: 'review' as const, label: 'Review Queue', icon: FileText },
            { key: 'runs' as const, label: 'Run History', icon: History },
            { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-display text-sm transition-all ${
              activeTab === key
                ? 'bg-spark-blue/20 text-spark-blue border border-spark-blue/30'
                : 'text-white/30 bg-white/5 border border-white/10 hover:border-white/20'
            }`}
            aria-pressed={activeTab === key}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </motion.div>

      {/* ═══ REVIEW QUEUE TAB ═══ */}
      {activeTab === 'review' && (
        <>
          {/* Stats bar */}
          <motion.div
            variants={staggerItem}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
          >
            {[
              { label: 'Pending', value: stats.pending, color: '#F59E0B' },
              {
                label: 'Needs Review',
                value: stats.flagged,
                color: '#EF4444',
              },
              {
                label: 'Approved Today',
                value: stats.approvedToday,
                color: '#10B981',
              },
              {
                label: 'Rejected Today',
                value: stats.rejectedToday,
                color: '#6B7280',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="glass-card rounded-xl p-3 text-center"
              >
                <motion.p
                  className="font-display text-2xl font-bold"
                  style={{ color: s.color }}
                  key={s.value}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {s.value}
                </motion.p>
                <p className="font-body text-xs text-white/30">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Phase 7: Search bar + content type filter */}
          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 font-body outline-none focus:ring-1 focus:ring-spark-blue/30"
                aria-label="Search content queue"
              />
            </div>

            {/* Content type filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 font-body text-xs focus:outline-none focus:ring-1 focus:ring-spark-blue/30"
              aria-label="Filter by content type"
            >
              <option value="all">All Types</option>
              <option value="lesson">Lessons</option>
              <option value="quiz">Quizzes</option>
              <option value="spark_fact">Spark Facts</option>
              <option value="game_scenario">Game Scenarios</option>
              <option value="game_challenge">Game Challenges</option>
              <option value="trending_topic">Trending Topics</option>
              <option value="branching_lesson">Branching Lessons</option>
            </select>

            {/* Manual create button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-spark-green/15 text-spark-green font-display text-xs hover:bg-spark-green/25 transition-colors"
              aria-label="Create content manually"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create
            </button>
          </motion.div>

          {/* Status filter tabs */}
          <motion.div
            variants={staggerItem}
            className="flex flex-wrap gap-2 mb-4"
          >
            {[
              { key: 'pending_review', label: 'Pending' },
              { key: 'needs_human_review', label: 'Flagged' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setSelected(new Set());
                }}
                className={`px-4 py-2 rounded-lg font-body text-xs transition-all ${
                  filter === f.key
                    ? 'bg-spark-blue/20 text-spark-blue border border-spark-blue/30'
                    : 'text-white/30 bg-white/5 border border-white/10 hover:border-white/20'
                }`}
                aria-pressed={filter === f.key}
              >
                {f.label}
              </button>
            ))}
          </motion.div>

          {/* Bulk actions bar */}
          <AnimatePresence>
            {selected.size > 0 && isActionableFilter && (
              <motion.div
                className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="font-body text-xs text-white/40">
                  {selected.size} selected
                </span>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-spark-green/15 text-spark-green font-display text-xs"
                  aria-label={`Approve ${selected.size} items`}
                >
                  <Check className="w-3 h-3" /> Approve All
                </button>
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 font-display text-xs"
                  aria-label={`Reject ${selected.size} items`}
                >
                  <X className="w-3 h-3" /> Reject All
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="font-body text-xs text-white/20 hover:text-white/40 ml-auto"
                >
                  Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content list */}
          <motion.div variants={staggerItem}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <Mail className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="font-body text-sm text-white/40">
                  No items in this queue
                </p>
                <p className="font-body text-xs text-white/20 mt-1">
                  {filter === 'pending_review'
                    ? 'Run the agent to generate new content.'
                    : 'Items will appear here as they are processed.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select all */}
                {isActionableFilter && items.length > 1 && (
                  <button
                    onClick={selectAll}
                    className="font-body text-xs text-white/20 hover:text-white/40 mb-1"
                    aria-label={
                      selected.size === items.length
                        ? 'Deselect all items'
                        : `Select all ${items.length} items`
                    }
                  >
                    {selected.size === items.length
                      ? 'Deselect all'
                      : `Select all ${items.length}`}
                  </button>
                )}

                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    className={`glass-card rounded-xl p-4 flex items-center gap-3 transition-all ${
                      selected.has(item.id)
                        ? 'border-spark-blue/40 bg-spark-blue/5'
                        : ''
                    }`}
                    whileHover={{ y: -1 }}
                  >
                    {/* Checkbox */}
                    {isActionableFilter && (
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected.has(item.id)
                            ? 'border-spark-blue bg-spark-blue'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        aria-label={`Select ${item.title}`}
                        aria-checked={selected.has(item.id)}
                        role="checkbox"
                      >
                        {selected.has(item.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    )}

                    {/* Content info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TypeIcon type={item.type} />
                        <p className="font-display text-sm font-bold text-white truncate">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold bg-white/5"
                          style={{
                            color:
                              BAND_COLORS[item.target_age_band] || '#fff',
                          }}
                        >
                          Band {item.target_age_band}
                        </span>
                        <span className="font-body text-xs text-white/30">
                          Lab {item.world}: {LAB_NAMES[item.world]}
                        </span>
                        <span className="font-body text-xs text-white/20">
                          {item.type} · {item.difficulty}
                        </span>
                        {!item.safety_check?.passed && (
                          <span className="flex items-center gap-1 text-xs text-spark-orange">
                            <AlertTriangle className="w-3 h-3" /> Safety
                            flagged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreview(item)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
                        aria-label={`Preview ${item.title}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isActionableFilter && (
                        <>
                          <button
                            onClick={() =>
                              handleSingleAction(item.id, 'approve')
                            }
                            disabled={actionLoading.has(item.id)}
                            className="p-2 rounded-lg bg-spark-green/10 hover:bg-spark-green/20 text-spark-green transition-colors disabled:opacity-50"
                            aria-label={`Approve ${item.title}`}
                          >
                            {actionLoading.has(item.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleSingleAction(item.id, 'reject')
                            }
                            disabled={actionLoading.has(item.id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                            aria-label={`Reject ${item.title}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ═══ RUN HISTORY TAB ═══ */}
      {activeTab === 'runs' && (
        <motion.div variants={staggerItem}>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="font-body text-sm text-white/40 mb-3">
                No agent runs yet
              </p>
              <p className="font-body text-xs text-white/20">
                Click &quot;Run Agent Now&quot; to trigger the first content
                generation pipeline.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/30" />
                      <p className="font-display text-sm font-bold text-white">
                        {new Date(run.created_at).toLocaleString()}
                      </p>
                      {run.duration_ms && (
                        <span className="font-body text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded">
                          {formatDuration(run.duration_ms)}
                        </span>
                      )}
                    </div>
                    <span className="font-body text-xs text-white/20 font-mono">
                      {run.run_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    {[
                      {
                        label: 'Findings',
                        value: run.findings_count,
                        color: '#3B82F6',
                      },
                      {
                        label: 'Generated',
                        value: run.generated_count,
                        color: '#8B5CF6',
                      },
                      {
                        label: 'Approved',
                        value: run.approved_count,
                        color: '#10B981',
                      },
                      {
                        label: 'Flagged',
                        value: run.flagged_count,
                        color: '#F59E0B',
                      },
                      {
                        label: 'Rejected',
                        value: run.rejected_count,
                        color: '#EF4444',
                      },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p
                          className="font-display text-lg font-bold"
                          style={{ color: s.color }}
                        >
                          {s.value}
                        </p>
                        <p className="font-body text-2xs text-white/30">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {run.errors && run.errors.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="font-body text-xs text-red-400 font-semibold mb-1">
                        {run.errors.length} error
                        {run.errors.length === 1 ? '' : 's'}
                      </p>
                      {run.errors.slice(0, 3).map((e, i) => (
                        <p
                          key={i}
                          className="font-body text-xs text-red-400/60 truncate"
                        >
                          {e}
                        </p>
                      ))}
                      {run.errors.length > 3 && (
                        <p className="font-body text-xs text-red-400/40 mt-1">
                          + {run.errors.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ PREVIEW MODAL ═══ */}
      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Preview: ${preview.title}`}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPreview(null)}
            />

            {/* Modal content */}
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              className="relative glass-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 outline-none"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Close button */}
              <button
                onClick={() => setPreview(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <TypeIcon type={preview.type} />
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    {preview.title}
                  </h2>
                  <p className="font-body text-xs text-white/40">
                    {preview.type} · Band {preview.target_age_band} · Lab{' '}
                    {preview.world}: {LAB_NAMES[preview.world]}
                  </p>
                </div>
              </div>

              {/* Safety check */}
              <div
                className={`p-3 rounded-xl mb-4 ${
                  preview.safety_check?.passed
                    ? 'bg-spark-green/5 border border-spark-green/20'
                    : 'bg-spark-orange/5 border border-spark-orange/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield
                    className="w-4 h-4"
                    style={{
                      color: preview.safety_check?.passed
                        ? '#10B981'
                        : '#F59E0B',
                    }}
                  />
                  <p
                    className="font-display text-xs font-bold"
                    style={{
                      color: preview.safety_check?.passed
                        ? '#10B981'
                        : '#F59E0B',
                    }}
                  >
                    Safety: {preview.safety_check?.passed ? 'Passed' : 'Flagged'}
                  </p>
                </div>
                {preview.safety_check?.flags?.length > 0 && (
                  <ul className="space-y-1 mt-1">
                    {preview.safety_check.flags.map(
                      (flag: string, i: number) => (
                        <li
                          key={i}
                          className="font-body text-xs text-spark-orange/80"
                        >
                          ⚠ {flag}
                        </li>
                      )
                    )}
                  </ul>
                )}
                <p className="font-body text-xs text-white/30 mt-1">
                  Reading level: grade{' '}
                  {preview.safety_check?.flesch_kincaid_grade || '?'} ·{' '}
                  {preview.safety_check?.recommendation || 'unknown'}
                </p>
              </div>

              {/* Content body */}
              <div className="glass-card rounded-xl p-4 mb-4">
                <h3 className="font-display text-xs font-bold text-white/40 mb-2">
                  Content
                </h3>
                <div className="font-body text-sm text-white/70 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {preview.content_json?.content_body || 'No content body'}
                </div>
              </div>

              {/* Quiz questions */}
              {preview.content_json?.quiz_questions &&
                preview.content_json.quiz_questions.length > 0 && (
                  <div className="glass-card rounded-xl p-4 mb-4">
                    <h3 className="font-display text-xs font-bold text-white/40 mb-2">
                      Quiz Questions (
                      {preview.content_json.quiz_questions.length})
                    </h3>
                    <div className="space-y-2">
                      {preview.content_json.quiz_questions.map(
                        (q, i: number) => (
                          <div key={i} className="p-2 rounded-lg bg-white/5">
                            <p className="font-body text-xs text-white/70 mb-1">
                              Q{i + 1}: {q.question}
                            </p>
                            <p className="font-body text-xs text-spark-green">
                              ✓ {q.options?.[q.correct_index]}
                            </p>
                            {q.hint && (
                              <p className="font-body text-xs text-white/20 mt-0.5">
                                Hint: {q.hint}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* XP & Duration meta */}
              {(preview.content_json?.xp_reward ||
                preview.content_json?.estimated_duration_minutes) && (
                <div className="flex gap-3 mb-4">
                  {preview.content_json?.xp_reward && (
                    <div className="glass-card rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-spark-orange" />
                      <span className="font-data text-xs text-spark-orange">
                        {preview.content_json.xp_reward} XP
                      </span>
                    </div>
                  )}
                  {preview.content_json?.estimated_duration_minutes && (
                    <div className="glass-card rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span className="font-body text-xs text-white/40">
                        ~{preview.content_json.estimated_duration_minutes} min
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Source URLs */}
              {preview.source_urls?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-display text-xs font-bold text-white/40 mb-1">
                    Sources
                  </h3>
                  {preview.source_urls.map((url: string, i: number) => (
                    <p
                      key={i}
                      className="font-body text-xs text-spark-blue truncate"
                    >
                      {url}
                    </p>
                  ))}
                </div>
              )}

              {/* Rejection reason (if rejected) */}
              {preview.rejection_reason && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 mb-4">
                  <p className="font-body text-xs text-red-400">
                    Rejection reason: {preview.rejection_reason}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              {isActionableFilter && (
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => handleSingleAction(preview.id, 'approve')}
                    disabled={actionLoading.has(preview.id)}
                    className="flex-1 py-3 rounded-xl bg-spark-green/15 text-spark-green font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    {actionLoading.has(preview.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve & Publish
                  </motion.button>
                  <motion.button
                    onClick={() => handleSingleAction(preview.id, 'reject')}
                    disabled={actionLoading.has(preview.id)}
                    className="flex-1 py-3 rounded-xl bg-red-500/15 text-red-400 font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="w-4 h-4" /> Reject
                  </motion.button>
                </div>
              )}

              {/* Phase 8: Generate 3D Architecture button */}
              <motion.button
                onClick={async () => {
                  if (!preview) return;
                  addToast('info', 'Starting 3D architecture generation...');
                  try {
                    const res = await fetch('/api/agent/architect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contentId: preview.id,
                        contentType: preview.type,
                        contentTitle: preview.title,
                        contentBody: typeof preview.content_json === 'object'
                          ? (preview.content_json as Record<string, unknown>).content_body || preview.title
                          : preview.title,
                      }),
                    });
                    const result = await res.json();
                    if (res.ok) {
                      const gates = result.data?.gates || [];
                      const passed = gates.filter((g: { status: string }) => g.status === 'passed').length;
                      const failed = gates.filter((g: { status: string }) => g.status === 'failed').length;
                      addToast('success', `Architecture generated: ${passed} gates passed, ${failed} failed, ${result.data?.generatedComponents?.length || 0} components created.`);
                    } else {
                      addToast('error', result.error || 'Architecture generation failed.');
                    }
                  } catch {
                    addToast('error', 'Could not reach architect API.');
                  }
                }}
                className="w-full mt-3 py-2.5 rounded-xl bg-purple-500/15 text-purple-400 font-display text-xs flex items-center justify-center gap-2 hover:bg-purple-500/25 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate 3D Architecture
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BULK REJECT DIALOG ═══ */}
      <AnimatePresence>
        {showRejectDialog && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Reject ${selected.size} items`}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRejectDialog(false)}
            />

            {/* Dialog content */}
            <motion.div
              ref={rejectDialogRef}
              tabIndex={-1}
              className="relative glass-card rounded-2xl w-full max-w-sm p-6 outline-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3 className="font-display text-lg font-bold text-white mb-3">
                Reject {selected.size} Item{selected.size === 1 ? '' : 's'}
              </h3>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (optional)..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-body text-sm placeholder:text-white/20 focus:border-spark-blue/40 focus:outline-none mb-4 resize-none"
                aria-label="Rejection reason"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectDialog(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 font-display text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={() => handleBulkAction('reject')}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-display font-bold text-sm"
                  whileTap={{ scale: 0.98 }}
                >
                  Reject All
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ANALYTICS TAB — Phase 7 ═══ */}
      {activeTab === 'analytics' && (
        <motion.div variants={staggerItem} className="space-y-6">
          <h3 className="font-display text-lg text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-spark-blue" /> Content Analytics
          </h3>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="font-display text-3xl font-bold text-spark-blue">{analytics.totalItems}</p>
              <p className="font-body text-xs text-white/30">Total in Queue</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="font-display text-3xl font-bold text-green-400">{Object.keys(analytics.byType).length}</p>
              <p className="font-body text-xs text-white/30">Content Types</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="font-display text-3xl font-bold text-amber-400">{Object.keys(analytics.byWorld).length}</p>
              <p className="font-body text-xs text-white/30">Labs Covered</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="font-display text-3xl font-bold text-purple-400">{Object.keys(analytics.byBand).length}</p>
              <p className="font-body text-xs text-white/30">Age Bands</p>
            </div>
          </div>

          {/* By Type breakdown */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="font-display text-sm text-white/60 mb-3">By Content Type</h4>
            <div className="space-y-2">
              {Object.entries(analytics.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <TypeIcon type={type} />
                  <span className="font-body text-xs text-white/60 flex-1">{type.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-spark-blue/60 rounded-full"
                      style={{ width: `${(count / analytics.totalItems) * 100}%` }}
                    />
                  </div>
                  <span className="font-data text-xs text-white/40 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Lab breakdown */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="font-display text-sm text-white/60 mb-3">By Lab</h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(labId => (
                <div key={labId} className="text-center p-2 rounded-lg bg-white/5">
                  <p className="font-data text-lg text-white/80">{analytics.byWorld[labId] || 0}</p>
                  <p className="font-body text-[10px] text-white/30">Lab {labId}</p>
                </div>
              ))}
            </div>
          </div>

          {/* By Age Band */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="font-display text-sm text-white/60 mb-3">By Age Band</h4>
            <div className="grid grid-cols-3 gap-3">
              {(['A', 'B', 'C'] as const).map(band => (
                <div key={band} className="text-center p-3 rounded-lg bg-white/5">
                  <p className="font-data text-2xl text-white/80">{analytics.byBand[band] || 0}</p>
                  <p className="font-body text-xs text-white/30">
                    Band {band} ({band === 'A' ? '7-10' : band === 'B' ? '11-13' : '14-16'})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
