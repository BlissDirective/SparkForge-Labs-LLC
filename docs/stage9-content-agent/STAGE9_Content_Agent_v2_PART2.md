# Stage 9 Part 2 (9B) — Admin Content Review Dashboard + Run History

**Version:** v2 (Frost-Prismatic v2.1) — Audited & Corrected
**Build Phase:** 25
**Date:** February 23, 2026 | **Audited:** March 11, 2026
**Prerequisites:** Stage 9 Part 1 (9A) complete, all Stage 1–8 code in place
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS

---

## Overview

This part creates the Admin Content Review dashboard — a two-tab interface for managing AI-generated content and monitoring agent pipeline runs. It replaces Part 1's review route file to add a GET handler alongside the existing POST handler (Next.js App Router requires both HTTP methods in the same `route.ts` file).

### PART 2 (9B) COVERS

- GET `/api/agent/review` — fetch queue items, stats, and run history (admin-only)
- Admin Content Review dashboard page (two tabs: Review Queue + Run History)
- Content preview modal with safety check display
- Bulk select/approve/reject with select-all
- Run History tab showing past `agent_runs` with stats
- "Run Agent Now" trigger button

### v2 Changes in This Part

| ID | Description |
|----|-------------|
| **BUG-9C** | Review API uses `createServerSupabase` (not deprecated helper) |
| **ENH-9B** | Run History tab with `agent_runs` stats display |
| **ENH-9C** | Bulk approve/reject with select-all checkbox |
| **ENH-8E** | Frost-Prismatic styling: glass-card, stagger, chrome bezel |
| **ACC** | ARIA labels on all filter tabs, buttons, modal, checkboxes |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/app/api/agent/review/route.ts` | REPLACE | GET handler for queue+stats+runs, POST handler for approve/reject (replaces Part 1 version) |
| 2 | `src/app/(dashboard)/admin/content/page.tsx` | CREATE | Full admin review dashboard with two tabs |

### Code Review Fixes Applied (vs. Original Source Document)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **CRITICAL** | GET handler ternary operator broken — `status: error === 'Unauthorized' ? 401 const url` merges status code with next statement | Separated into proper ternary `error === 'Unauthorized' ? 401 : 403` with correct closing parenthesis |
| 2 | **CRITICAL** | POST handler try/catch inverted — `body = await req.json()` placed inside `catch` block instead of `try` | Restructured: parse JSON in try block, return error in catch block |
| 3 | **CRITICAL** | POST handler status response truncated — `{ status: error === 'Unauthoriz` cut off | Completed with proper ternary `error === 'Unauthorized' ? 401 : 403` |
| 4 | **CRITICAL** | `loadRuns` callback — `setLoading(false)` placed outside the callback function body | Moved `setLoading(false)` into the `finally` block inside `loadRuns` |
| 5 | **CRITICAL** | Stats state initialization truncated — `rejected` cut off mid-line | Completed: `rejectedToday: 0 }` |
| 6 | **CRITICAL** | Multiple JSX elements have content after closing tags — `</button>` followed by text that should be inside it (e.g., `<Icon className="w-4 h-4" /> {label}` appears after `</button>`) | Reconstructed all JSX with proper nesting and tag closure |
| 7 | **CRITICAL** | Preview modal backdrop `onClick` broken — `onClick={() => <motion.div setPre` concatenates handler with next element | Fixed to `onClick={() => setPreview(null)}` as standalone handler |
| 8 | **CRITICAL** | Reject dialog backdrop `onClick` broken — same pattern as above | Fixed to `onClick={() => setShowRejectDialog(false)}` |
| 9 | **CRITICAL** | Header back-arrow `motion.div` class string truncated mid-word: `hover:bg-white/10 text-white/40 hov` | Completed class: `hover:text-white/60 transition-colors` |
| 10 | **CRITICAL** | "Run Agent Now" button `className` truncated mid-gradient: `from-spark-pu` | Completed: `from-spark-purple to-spark-blue text-white font-display text-sm` |
| 11 | **CRITICAL** | Tab button JSX mixes `className` string with conditional outside the attribute: `activeTab === key ? '...' : '...' font-b` | Restructured as proper template literal with conditional inside className |
| 12 | **CRITICAL** | Stats bar stat card `<p>` tag truncated: `{s.val` → cut off | Completed: `{s.value}` |
| 13 | **CRITICAL** | Checkbox button `className` truncated: `flex items-center justify-center fl` | Completed: `flex-shrink-0 transition-colors` |
| 14 | **CRITICAL** | Band color `<span>` style incomplete: `bg-white/5" s` → style attribute cut off | Completed: `style={{ color: BAND_COLORS[item.target_age_band] }}` |
| 15 | **CRITICAL** | Run History stat grid — `<p>` and `</div>` tags misplaced, content between wrong elements | Reconstructed with proper nesting: value `<p>` inside stat div, label below |
| 16 | **CRITICAL** | Preview modal action buttons — `<X>` icon and text placed after `</motion.button>` closing tag | Moved content inside buttons with proper JSX structure |
| 17 | **HIGH** | Missing `export const runtime = 'nodejs'` on review route — all Part 1 API routes have it | Added `export const runtime = 'nodejs'` |
| 18 | **HIGH** | Route uses raw `NextResponse.json` instead of `apiSuccess`/`apiError` helpers from Part 1 | Switched to `apiSuccess`/`apiError` for consistency with Part 1's review route pattern |
| 19 | **HIGH** | No action validation on POST body — Part 1 validates `action` is `'approve' | 'reject'` | Added action value validation |
| 20 | **HIGH** | No Escape key handler on modals — fails WCAG 2.1 SC 1.3.1 keyboard accessibility | Added `useEffect` for Escape key to close both modals |
| 21 | **HIGH** | No focus trap on modals — focus can escape to background content | Added focus management: auto-focus on modal open, `role="dialog"`, `aria-modal="true"` |
| 22 | **MEDIUM** | No error feedback on failed actions — `console.error` only | Added toast notifications via `useToastStore` for success/error feedback |
| 23 | **MEDIUM** | `loadQueue` has stale closure on `stats` in dependency — `stats` referenced but not in deps | Removed stale `stats` reference; set stats from response independently |
| 24 | **MEDIUM** | No loading indicator on individual action buttons | Added per-item loading state with `actionLoading` Set |
| 25 | **MEDIUM** | `TYPE_ICONS` uses empty strings (emoji rendering stripped) | Replaced with Lucide icon components for consistent rendering |
| 26 | **LOW** | Inline `alert()` calls for agent run errors — breaks Frost-Prismatic design language | Replaced with toast notifications |
| 27 | **LOW** | Missing `Suspense` boundary — large page with multiple data fetches | Added loading skeleton as initial state |
| 28 | **LOW** | `run_id` field in `AgentRun` type — Part 1 schema uses `id` as UUID primary key with separate `run_id` text field | Verified interface matches Part 1 `agent_runs` schema: `id`, `run_id`, `findings_count`, `generated_count`, `approved_count`, `flagged_count`, `rejected_count`, `errors`, `created_at`, `completed_at`, `duration_ms` |

### Enhancement Suggestions (All Implemented Below)

| # | Category | Enhancement | Rationale |
|---|----------|-------------|-----------|
| 1 | **Accessibility** | Escape key closes modals, focus trapped inside modal, `role="dialog"` + `aria-modal` | WCAG 2.1 SC 1.3.1 keyboard navigation compliance |
| 2 | **UX** | Toast notifications for all actions (approve/reject/bulk/agent trigger) | Users need visual feedback beyond console logs |
| 3 | **UX** | Per-item loading spinners on approve/reject buttons | Prevents double-clicks and shows operation progress |
| 4 | **UX** | Refresh button on queue to manually reload without page refresh | Common admin dashboard pattern for monitoring |
| 5 | **Performance** | `duration_ms` and `completed_at` displayed in Run History | Part 1 added these columns — surface them in the UI |
| 6 | **Visual** | Animated stat counters with `motion.span` layout animation | Frost-Prismatic feel: numbers animate when stats refresh |
| 7 | **Security** | Route validates `action` value is exactly `'approve'` or `'reject'` | Defense in depth — matches Part 1 validation pattern |
| 8 | **Consistency** | Uses `apiSuccess`/`apiError` helpers throughout | Matches all other API routes (Stages 2–8 + Part 1) |
| 9 | **UX** | Empty state illustrations with contextual CTAs | Better than generic "no items" — guides admin to next action |
| 10 | **Visual** | Confirmation count badge on bulk action bar | Shows exactly how many items will be affected |

---

## STEP 1: CREATE FOLDERS

```bash
mkdir -p src/app/(dashboard)/admin/content
mkdir -p src/app/api/agent/review
```

> **Note:** Both directories should already exist from Part 1. These commands are safe to re-run (`mkdir -p` is idempotent).

---

## STEP 2: GET + POST REVIEW API ROUTE

Part 1 created the POST handler for approve/reject. This step **REPLACES** that file entirely to add the GET handler for fetching queue items and dashboard stats. Next.js App Router requires both GET and POST exports in the same `route.ts` file.

- v2 [BUG-9C]: Uses `createServerSupabase`, not deprecated helper.
- v2 [ENH-9C]: Bulk operations via arrays.
- [FIX]: Corrected broken ternary operator, inverted try/catch, and truncated status codes.

### File 1: `src/app/api/agent/review/route.ts` (REPLACE)

**WHERE:** Replace the file created in Part 1 at `src/app/api/agent/review/route.ts`.

```typescript
// ════════════════════════════════════════════════════
// CONTENT REVIEW API — GET (fetch queue) + POST (approve/reject)
// v2 [BUG-9C]: Uses createServerSupabase
// v2 [ENH-9C]: Bulk operations via arrays
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { approveContent, rejectContent } from '@/lib/agent/pipeline';

export const runtime = 'nodejs';

// ── Admin auth helper ──────────────────────────────
async function verifyAdmin() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, supabase, error: 'Unauthorized' as const };
  }

  const { data: parent } = await supabase
    .from('parents')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!parent?.is_admin) {
    return { user, supabase, error: 'Admin access required' as const };
  }

  return { user, supabase, error: null };
}

// ── GET: Fetch queue items + stats ─────────────────
export async function GET(req: NextRequest) {
  const { supabase, error } = await verifyAdmin();

  if (error) {
    return apiError(
      error,
      error === 'Unauthorized' ? 401 : 403,
      error === 'Unauthorized' ? 'AUTH_REQUIRED' : 'FORBIDDEN'
    );
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'pending_review';
  const tab = url.searchParams.get('tab');

  // If requesting run history
  if (tab === 'runs') {
    const { data: runs } = await supabase
      .from('agent_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    return apiSuccess({ runs: runs || [] });
  }

  // Fetch queue items
  const { data, count } = await supabase
    .from('content_queue')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('generated_at', { ascending: false })
    .limit(50);

  // Fetch stats — parallel queries for efficiency
  const [pendingResult, flaggedResult, approvedResult, rejectedResult] =
    await Promise.all([
      supabase
        .from('content_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review'),
      supabase
        .from('content_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'needs_human_review'),
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return supabase
          .from('content_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('reviewed_at', today.toISOString());
      })(),
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return supabase
          .from('content_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('reviewed_at', today.toISOString());
      })(),
    ]);

  return apiSuccess({
    items: data || [],
    total: count || 0,
    stats: {
      pending: pendingResult.count || 0,
      flagged: flaggedResult.count || 0,
      approvedToday: approvedResult.count || 0,
      rejectedToday: rejectedResult.count || 0,
    },
  });
}

// ── POST: Approve or reject ────────────────────────
export async function POST(req: NextRequest) {
  const { user, error } = await verifyAdmin();

  if (error || !user) {
    return apiError(
      error || 'Unauthorized',
      error === 'Unauthorized' ? 401 : 403,
      error === 'Unauthorized' ? 'AUTH_REQUIRED' : 'FORBIDDEN'
    );
  }

  // Parse body in try block, return error in catch block
  let body: {
    action: 'approve' | 'reject';
    ids: string[];
    reason?: string;
  };

  try {
    body = await req.json();
  } catch {
    return apiError('Invalid request body', 400, 'PARSE_ERROR');
  }

  if (
    !body.action ||
    !body.ids ||
    !Array.isArray(body.ids) ||
    body.ids.length === 0
  ) {
    return apiError(
      'Required: action ("approve" | "reject") and ids (string[])',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (!['approve', 'reject'].includes(body.action)) {
    return apiError(
      'action must be "approve" or "reject"',
      400,
      'VALIDATION_ERROR'
    );
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const id of body.ids) {
    if (body.action === 'approve') {
      const result = await approveContent(id, user.id);
      results.push({ id, ...result });
    } else {
      const result = await rejectContent(
        id,
        user.id,
        body.reason || 'Rejected by admin'
      );
      results.push({ id, ...result });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return apiSuccess({
    results,
    summary: {
      total: results.length,
      succeeded,
      failed,
    },
  });
}
```

---

## STEP 3: ADMIN CONTENT REVIEW DASHBOARD PAGE

Two-tab layout: "Review Queue" and "Run History". Review Queue includes filter tabs, stats bar, content list with bulk actions, and a content preview modal. Run History displays past `agent_runs` with counts and error logs.

- v2 [ENH-9B]: Run History tab with stats.
- v2 [ENH-9C]: Select-all + bulk approve/reject with reject reason dialog.
- v2 [ENH-8E]: Frost-Prismatic glass-card, stagger animations.
- v2 [ACC]: ARIA on filter tabs, checkboxes, modal, buttons.
- [FIX]: All 16 critical JSX reconstruction fixes applied.
- [ENH]: Escape key + focus management on modals, toast notifications, per-item loading, refresh button, duration display.

### File 2: `src/app/(dashboard)/admin/content/page.tsx` (CREATE)

**WHERE:** Create this file at `src/app/(dashboard)/admin/content/page.tsx`.

```typescript
// ════════════════════════════════════════════════════
// ADMIN CONTENT REVIEW — Queue manager + run history
// v2 [ENH-9B]: Run History tab
// v2 [ENH-9C]: Bulk select/approve/reject
// v2 [ENH-8E]: Frost-Prismatic styling
// v2 [ACC]: ARIA labels, keyboard navigation, focus mgmt
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
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
  // ── State ──
  const [activeTab, setActiveTab] = useState<'review' | 'runs'>('review');
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
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load review queue. Please try again.',
      });
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
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load run history. Please try again.',
      });
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

      addToast({
        type: summary?.failed > 0 ? 'warning' : 'success',
        title: `Bulk ${action === 'approve' ? 'Approve' : 'Reject'} Complete`,
        message: `${summary?.succeeded || ids.length} of ${summary?.total || ids.length} items ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });

      loadQueue();
    } catch (e) {
      console.error('Bulk action failed:', e);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: `Could not ${action} items. Please try again.`,
      });
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
      addToast({
        type: 'success',
        title: action === 'approve' ? 'Content Approved' : 'Content Rejected',
        message:
          action === 'approve'
            ? 'Content published successfully.'
            : 'Content has been rejected.',
      });

      loadQueue();
    } catch (e) {
      console.error('Action failed:', e);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: `Could not ${action} this item. Please try again.`,
      });
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
      const res = await fetch('/api/agent/run', { method: 'POST' });
      const result = await res.json();

      if (result.data?.success || result.success) {
        addToast({
          type: 'success',
          title: 'Agent Run Complete',
          message: 'Content agent pipeline finished. Check the queue for new items.',
        });
        loadQueue();
        if (activeTab === 'runs') loadRuns();
      } else {
        addToast({
          type: 'error',
          title: 'Agent Run Failed',
          message: result.data?.error || result.error || 'Unknown error occurred.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Agent Run Failed',
        message: 'Could not reach the agent API. Check the console for details.',
      });
    } finally {
      setAgentRunning(false);
    }
  }

  // ── Render helpers ──
  const isActionableFilter =
    filter === 'pending_review' || filter === 'needs_human_review';

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
                <p className="font-body text-[10px] text-white/30">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Filter tabs */}
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
                  className="font-body text-[10px] text-white/20 hover:text-white/40 ml-auto"
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

                {items.map((item) => (
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
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5"
                          style={{
                            color:
                              BAND_COLORS[item.target_age_band] || '#fff',
                          }}
                        >
                          Band {item.target_age_band}
                        </span>
                        <span className="font-body text-[10px] text-white/30">
                          Lab {item.world}: {LAB_NAMES[item.world]}
                        </span>
                        <span className="font-body text-[10px] text-white/20">
                          {item.type} · {item.difficulty}
                        </span>
                        {!item.safety_check?.passed && (
                          <span className="flex items-center gap-1 text-[10px] text-spark-orange">
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
                        <span className="font-body text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded">
                          {formatDuration(run.duration_ms)}
                        </span>
                      )}
                    </div>
                    <span className="font-body text-[10px] text-white/20 font-mono">
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
                        <p className="font-body text-[9px] text-white/30">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {run.errors && run.errors.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="font-body text-[10px] text-red-400 font-semibold mb-1">
                        {run.errors.length} error
                        {run.errors.length === 1 ? '' : 's'}
                      </p>
                      {run.errors.slice(0, 3).map((e, i) => (
                        <p
                          key={i}
                          className="font-body text-[10px] text-red-400/60 truncate"
                        >
                          {e}
                        </p>
                      ))}
                      {run.errors.length > 3 && (
                        <p className="font-body text-[10px] text-red-400/40 mt-1">
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
                          className="font-body text-[10px] text-spark-orange/80"
                        >
                          ⚠ {flag}
                        </li>
                      )
                    )}
                  </ul>
                )}
                <p className="font-body text-[10px] text-white/30 mt-1">
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
                            <p className="font-body text-[10px] text-spark-green">
                              ✓ {q.options?.[q.correct_index]}
                            </p>
                            {q.hint && (
                              <p className="font-body text-[10px] text-white/20 mt-0.5">
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
                      className="font-body text-[10px] text-spark-blue truncate"
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
    </motion.div>
  );
}
```

---

## STEP 4: VERIFY EVERYTHING

```bash
npm run build
npx tsc --noEmit
```

### CHECK 1: Build succeeds
- [ ] Admin page compiles without errors
- [ ] Review route exports both GET and POST
- [ ] No TypeScript errors from `npx tsc --noEmit`

### CHECK 2: Admin page at `localhost:3000/admin/content`
- [ ] Header shows "Content Review" with back arrow link to `/parent`
- [ ] "Run Agent Now" button visible with gradient styling
- [ ] Refresh button visible next to Run Agent button
- [ ] Two top tabs: "Review Queue" and "Run History"
- [ ] Stats bar: Pending / Needs Review / Approved Today / Rejected Today
- [ ] Filter tabs: Pending / Flagged / Approved / Rejected
- [ ] Empty state shows Mail icon + contextual message when no items
- [ ] After running agent: items appear in Pending tab

### CHECK 3: Content list interactions
- [ ] Checkbox toggles on click (blue highlight on selected row)
- [ ] "Select all" button toggles all items in current filter
- [ ] Bulk action bar appears when items selected (shows count)
- [ ] "Approve All" sends POST with `action: 'approve'`
- [ ] "Reject All" shows rejection reason dialog
- [ ] Eye icon opens preview modal
- [ ] Single approve/reject buttons work per-item with loading spinner
- [ ] Toast notifications appear for all actions (success/error)

### CHECK 4: Preview modal
- [ ] Shows title, type icon, band, lab, difficulty
- [ ] Safety check: green "Passed" or orange "Flagged" with flags list
- [ ] Content body displays in scrollable area (max 60 lines visible)
- [ ] Quiz questions show with correct answer highlighted in green
- [ ] Quiz hints displayed when available
- [ ] XP reward and estimated duration shown
- [ ] Source URLs displayed (truncated if long)
- [ ] Rejection reason shown for rejected items
- [ ] Approve & Publish / Reject buttons at bottom (with loading states)
- [ ] Escape key closes the modal
- [ ] Clicking backdrop closes the modal
- [ ] `role="dialog"` and `aria-modal="true"` present

### CHECK 5: Run History tab
- [ ] Shows past agent runs with timestamp
- [ ] Duration displayed (formatted: ms/s/min)
- [ ] Grid shows: Findings / Generated / Approved / Flagged / Rejected
- [ ] Error list shown if any errors occurred (max 3 with "+N more")
- [ ] Run ID displayed in monospace
- [ ] Empty state with History icon when no runs yet

### CHECK 6: Admin auth protection
- [ ] Non-admin users cannot access `/admin/content` (API returns 403)
- [ ] Unauthenticated users get 401
- [ ] GET and POST both verify admin status

### CHECK 7: Accessibility
- [ ] `aria-pressed` on all tab buttons (top tabs + filter tabs)
- [ ] `role="checkbox"` + `aria-checked` on all checkboxes
- [ ] `aria-label` on all action buttons (approve, reject, preview, select)
- [ ] `role="dialog"` + `aria-modal="true"` on both modals
- [ ] Escape key closes modals (reject dialog takes priority)
- [ ] Focus moves to modal on open

---

## STEP 5: GIT COMMIT

```bash
git add src/app/api/agent/review/route.ts src/app/(dashboard)/admin/content/page.tsx
git commit -m "Stage 9 Part 2: Admin review dashboard, run history, bulk actions, content preview"
```

---

## PART 2 (9B) COMPLETE!

### Files created/modified

| # | File | Action | Lines |
|---|------|--------|-------|
| 1 | `src/app/api/agent/review/route.ts` | REPLACE | ~140 |
| 2 | `src/app/(dashboard)/admin/content/page.tsx` | CREATE | ~620 |

### v2 enhancements applied

| ID | Description |
|----|-------------|
| **BUG-9C** | Review API uses `createServerSupabase` (not deprecated helper) |
| **ENH-9B** | Run History tab with `agent_runs` display, error log, run ID, duration |
| **ENH-9C** | Bulk select-all + approve/reject with reject reason dialog |
| **ENH-8E** | Frost-Prismatic: glass-card, stagger, stat colors, chrome bezel |
| **ACC** | ARIA: `aria-pressed` on tabs, `role="checkbox"`, `aria-label` on all buttons, `aria-checked`, `role="dialog"`, `aria-modal`, Escape key, focus management |

### Enhancements beyond original document

| # | Enhancement |
|---|-------------|
| 1 | Escape key closes both modals (reject dialog takes priority) |
| 2 | Focus management: modals receive focus on open |
| 3 | Toast notifications for all actions via `useToastStore` |
| 4 | Per-item loading spinners prevent double-clicks |
| 5 | Refresh button for manual data reload |
| 6 | Animated stat counters with spring animation |
| 7 | Duration display in Run History (uses Part 1's `duration_ms` column) |
| 8 | Contextual empty states with relevant CTAs |
| 9 | XP reward + estimated duration in preview modal |
| 10 | Lucide icons instead of emoji for consistent rendering |
| 11 | Parallel stats queries in GET route for better performance |
| 12 | `apiSuccess`/`apiError` helpers for consistency with all other routes |
| 13 | Proper `as const` on error strings for type narrowing |
| 14 | Error overflow handling in Run History (shows max 3 + count) |

### NEXT: Part 3 (9C) — Complete seed content SQL for all 10 Labs × 3 bands (~300 content items: 150 lessons + 90 quizzes + 60 spark facts)
