# Stage 8 Part 3 v3-FINAL (B) — Pricing Page Replacement

**Version:** v3-FINAL (corrected)
**Build Phase:** 24 (Stage 8 Part 3 — Landing + Pricing, Part B: Public Pricing Page)
**Date:** March 1, 2026 | **Audited:** March 10, 2026
**GCUD:** V10
**Prerequisites:** Stage 8 Parts 1-2 complete, Stage 8 Part 3A v3-FINAL (ScrollJourney + Acts)
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS
**Supersedes:** STAGE8_Parent_Dashboard_v2_PART3 (pricing page section only)

---

## Overview

This document creates the standalone `/pricing` route for SparkForge. It replaces the v2 pricing page section with a v3 station-aesthetic version featuring aurora background, LED accent strips on tier cards, chrome bezel on comparison table, emissive glow CTAs, and Frost-Prismatic hex color palette. Decision 8.4: separate `/pricing` route (not embedded in scroll journey) with back-link to landing page.

**Part B scope:** 1 file — the `/pricing` page. Part A created the Scroll Journey components. Part C will integrate into the marketing page and provide full verification.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 8.4 | Separate `/pricing` route (not in scroll journey) with back-link | `src/app/(marketing)/pricing/page.tsx` |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/app/(marketing)/pricing/page.tsx` | REPLACE | Standalone pricing page with v3 station aesthetic |

### v2 → v3 Changes

| Aspect | v2 | v3-FINAL |
|--------|-----|---------|
| Background | Static `bg-surface-deep` | Aurora gradient with animated blobs (visual continuity with ScrollJourney) |
| Tier card styling | `glass-card` class | Station-aesthetic cards with LED accent strips (top + bottom) per tier color |
| Comparison table | `glass-card` wrapper | Chrome bezel styling: border, top/bottom LED strips, refined alternating rows |
| CTA buttons | `spark-purple` gradient | Emissive glow: blue-to-indigo gradient with `shadow-[color]/20` + hover intensify |
| Form inputs | `bg-white/5 border` | `bg-white/[0.04]` + `focus:ring` emerald with `ring-1` focus state |
| Navigation | None (direct URL) | Back to SparkForge arrow link |
| Color palette | `spark-*` utility classes | Frost-Prismatic hex values (`#3B82F6`, `#6366F1`, etc.) for station consistency |

### v2 Features Preserved (ALL)

- [x] All tier data from `tier-config.ts` (`TIER_DISPLAY`, `getYearlySavingsPercent`)
- [x] Monthly/Yearly billing toggle with savings badge
- [x] 3 tier cards (Free, Plus, Forge) with feature lists and CTA buttons
- [x] Feature comparison table (10 rows: labs, games/week, prompts, profiles, etc.)
- [x] For Schools CTA section with 4-field contact form
- [x] FAQ accordion (6 questions) with animated expand/collapse
- [x] Bottom CTA with signup link
- [x] [BUG-8A] All imports from `tier-config.ts` (zero references to `tiers.ts`)
- [x] [ENH-8D] For Schools: school name, email, students dropdown, message textarea
- [x] [ACC] ARIA: `aria-expanded` on FAQ, `aria-pressed` on toggles, `aria-label` on form inputs

### Code Review Fixes Applied (vs. Original Source Document)

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | **CRITICAL** | pricing/page.tsx | Multiple truncated FAQ answer strings — all 6 answers cut off mid-sentence | Fully reconstructed all FAQ answers with complete, meaningful content |
| 2 | **CRITICAL** | pricing/page.tsx | Misplaced JSX attributes throughout: `aria-hidden="true"` after closing `/>`, `className` on wrong lines, `style={{` separated from element | Corrected all JSX attribute ordering to valid React syntax |
| 3 | **CRITICAL** | pricing/page.tsx | "Most Popular" badge span has closing `</span>` before opening content — JSX structurally broken | Reconstructed badge as single properly-nested span element |
| 4 | **CRITICAL** | pricing/page.tsx | Bottom LED accent strip on tier cards has `style` and `className` on separate lines outside the element | Merged all attributes into single valid `<div>` element |
| 5 | **CRITICAL** | pricing/page.tsx | Link CTA in tier cards: `isPopular` keyword floating outside JSX, `className` on separate line | Fixed ternary class logic into proper JSX attribute |
| 6 | **CRITICAL** | pricing/page.tsx | Bottom CTA Link: `className` and `href` separated, `<Rocket>` icon text on wrong line | Fully reconstructed bottom CTA Link as valid JSX |
| 7 | **HIGH** | pricing/page.tsx | HTML entities used instead of JSX: `&lt;`, `&gt;`, `&amp;` throughout | Converted all HTML entities to proper JSX/TSX syntax |
| 8 | **HIGH** | pricing/page.tsx | Hero emissive glow div truncated mid-attribute: `pointer-events-non` | Completed to `pointer-events-none` |
| 9 | **HIGH** | pricing/page.tsx | Form input `className` strings truncated at `focus:bo` | Completed all focus ring class strings |
| 10 | **HIGH** | pricing/page.tsx | Bottom CTA Link `className` truncated mid-class: `hover:shadow-xl hover:shadow-[#3B8` | Completed full shadow class value |
| 11 | **MEDIUM** | pricing/page.tsx | School form submit button `className` truncated | Completed full class string with flex/gap layout |
| 12 | **MEDIUM** | pricing/page.tsx | Unicode escape sequences (`\u{1F389}`, `\u2013`, `\u201316`) used instead of direct characters | Converted to direct emoji/text characters for readability |
| 13 | **LOW** | pricing/page.tsx | `Record<SubscriptionTier, typeof Sparkles>` type for icons — `typeof Sparkles` is `LucideIcon`, use the proper type | Changed to use `React.ComponentType` for clearer typing |
| 14 | **LOW** | pricing/page.tsx | Missing `role="region"` on FAQ section for screen reader navigation | Added landmark role to FAQ section |

### Enhancement Suggestions

| # | Category | Enhancement | Rationale |
|---|----------|-------------|-----------|
| 1 | **UI/UX** | Add `prefers-reduced-motion` media query check to disable hover animations for motion-sensitive users | Accessibility requirement matching WCAG 2.1 Level AA |
| 2 | **Visual** | Add subtle pulse animation on the "Most Popular" badge to draw attention | Guides users to the recommended tier without being intrusive |
| 3 | **Interactivity** | Add smooth scroll anchor from comparison table header to tier cards for quick reference | Improves navigation on long pricing pages |
| 4 | **Performance** | Memoize `renderFeatureValue` with `useCallback` to avoid re-creation on re-renders | Minor optimization for table rendering with 30 cells |
| 5 | **Visual** | Add a subtle scanline overlay on the comparison table matching the Station aesthetic from Stage 3 | Reinforces the "control station screen" aesthetic |
| 6 | **Functionality** | Add form validation feedback (inline error messages) on the school contact form | Better UX than relying solely on HTML5 `required` attribute |
| 7 | **Visual** | Add animated counter for yearly savings percentage (count up from 0 to N%) | Creates engagement and draws attention to savings value |

---

## Directory Setup

```bash
# Ensure pricing route directory exists
mkdir -p src/app/\(marketing\)/pricing
```

---

## Step 1: Pricing Page

**File:** `src/app/(marketing)/pricing/page.tsx` — **REPLACE** (~530 lines)

Full standalone replacement of the v2 public pricing page. All v2 features preserved with v3 station aesthetic enhancements: aurora background, LED accent strips on tier cards, chrome bezel on comparison table, emissive glow CTAs, and Frost-Prismatic hex color palette.

**NOTE on route path:** The v2 document placed this at `src/app/(public)/pricing/page.tsx`. The v3-FINAL version uses `src/app/(marketing)/pricing/page.tsx` to colocate with the marketing layout already established in Stage 3. If your project uses `(public)` instead of `(marketing)`, adjust the path accordingly — the code is identical either way.

```typescript
// ════════════════════════════════════════════════════
// PUBLIC PRICING PAGE — v3-FINAL Station Aesthetic
// ════════════════════════════════════════════════════
// Decision 8.4: Separate /pricing route (not in scroll journey).
// Reuses aurora background and emissive CSS styling for visual
// continuity with the landing page scroll journey.
//
// v3 CHANGES over v2:
// [v3] Station-aesthetic aurora background with animated gradient
// [v3] Emissive glow CTAs matching scroll journey Act 5
// [v3] Chrome bezel styling on comparison table
// [v3] LED accent strips on tier cards
// [v3] Frost-Prismatic color palette consistency
// [v3] Enhanced For Schools section with station-themed styling
//
// v2 FEATURES PRESERVED:
// [v2] All tier data from tier-config.ts (TIER_DISPLAY, getYearlySavingsPercent)
// [v2] Monthly/Yearly billing toggle with savings badge
// [v2] 3 tier cards (Free, Plus, Forge) with feature lists
// [v2] Feature comparison table (10 rows)
// [v2] For Schools CTA with contact form
// [v2] FAQ accordion with expand/collapse
// [v2] Bottom CTA
// [BUG-8A] All imports use tier-config.ts
// [ENH-8D] For Schools contact form
// [ENH-8E] Frost-Prismatic visual treatment
// [ACC] ARIA: aria-expanded, aria-pressed, aria-label, role=list
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TIER_DISPLAY,
  getYearlySavingsPercent,
  type SubscriptionTier,
} from '@/lib/tier-config';
import { staggerContainer, staggerItem } from '@/lib/animations';
import {
  Check,
  X,
  Sparkles,
  Crown,
  Rocket,
  ChevronDown,
  GraduationCap,
  School,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ════════════════════════════════════════════════════
// Tier display helpers
// ════════════════════════════════════════════════════

const TIER_ICONS: Record<SubscriptionTier, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  free: Sparkles,
  plus: Crown,
  forge: Rocket,
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: '#94A3B8',   // Slate for free tier
  plus: '#3B82F6',   // Blue — Frost-Prismatic primary
  forge: '#F59E0B',  // Amber — Forge accent
};

// ════════════════════════════════════════════════════
// Feature comparison data
// ════════════════════════════════════════════════════

type FeatureValue = true | false | string;

interface ComparisonRow {
  label: string;
  free: FeatureValue;
  plus: FeatureValue;
  forge: FeatureValue;
}

const COMPARISON: ComparisonRow[] = [
  { label: 'Labs unlocked',              free: '1–3',      plus: 'All 10',    forge: 'All 10' },
  { label: 'Games per week',             free: '3',        plus: 'Unlimited', forge: 'Unlimited' },
  { label: 'Prompt Lab tries/day',       free: '5',        plus: '50',        forge: '200' },
  { label: 'Child profiles',             free: '1',        plus: '3',         forge: '5' },
  { label: 'Parent progress reports',    free: false,      plus: true,        forge: true },
  { label: 'Offline content access',     free: false,      plus: true,        forge: true },
  { label: 'Agent-generated content',    free: false,      plus: true,        forge: true },
  { label: 'Early access to new content', free: false,     plus: false,       forge: true },
  { label: 'Priority support',           free: false,      plus: false,       forge: true },
  { label: 'Exclusive avatar items',     free: false,      plus: false,       forge: true },
];

// ════════════════════════════════════════════════════
// FAQ data
// ════════════════════════════════════════════════════

const FAQS = [
  {
    q: 'Is SparkForge safe for my child?',
    a: 'SparkForge is COPPA 2025 compliant. We collect minimal data (display name, age band, progress). All AI interactions are filtered and monitored. No personal information is ever shared with third parties. Parents have full visibility and control through the parent dashboard.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel your subscription at any time from the parent dashboard. You keep access until the end of your billing period. No cancellation fees, no hidden charges. Your child\'s progress and badges are preserved even if you downgrade to the free plan.',
  },
  {
    q: 'What ages is SparkForge for?',
    a: 'SparkForge is designed for children ages 7–16, with content automatically adapted across three age bands: Explorer (7–9), Adventurer (10–12), and Innovator (13–16). Each band gets age-appropriate vocabulary, complexity, and challenges.',
  },
  {
    q: 'How does the free plan work?',
    a: 'The free plan gives full access to Labs 1–3, plus a preview (first lesson) of Labs 4–10. You get 3 game plays per week and 5 Prompt Lab tries per day. It\'s a great way to explore SparkForge before upgrading. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards through Stripe, our secure payment processor. Apple Pay and Google Pay are also supported.',
  },
  {
    q: 'Can multiple children share one account?',
    a: 'Yes! Each plan supports multiple child profiles (1 for Free, 3 for Plus, 5 for Forge). Each child gets their own progress, badges, and adaptive difficulty — so siblings can learn at their own pace without interfering with each other\'s journey.',
  },
];

// ════════════════════════════════════════════════════
// For Schools form state
// ════════════════════════════════════════════════════

interface SchoolFormData {
  schoolName: string;
  contactEmail: string;
  estimatedStudents: string;
  message: string;
}

// ════════════════════════════════════════════════════
// PRICING PAGE COMPONENT
// ════════════════════════════════════════════════════

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [schoolForm, setSchoolForm] = useState<SchoolFormData>({
    schoolName: '',
    contactEmail: '',
    estimatedStudents: '',
    message: '',
  });
  const [schoolSubmitted, setSchoolSubmitted] = useState(false);

  function handleSchoolSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production: POST to /api/school-interest or send email
    console.log('School interest:', schoolForm);
    setSchoolSubmitted(true);
  }

  const renderFeatureValue = useCallback((val: FeatureValue) => {
    if (val === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
    if (val === false) return <X className="w-4 h-4 text-white/15 mx-auto" />;
    return <span className="font-body text-sm text-white/70">{val}</span>;
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* ─── [v3] Aurora background — visual continuity with ScrollJourney ─── */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117] via-[#0B1628] to-[#0D1117]" />
        <div className="absolute top-[15%] left-[25%] w-[500px] h-[500px] rounded-full bg-[#3B82F6]/[0.04] blur-[100px]" />
        <div className="absolute top-[40%] right-[15%] w-[400px] h-[400px] rounded-full bg-[#8B5CF6]/[0.03] blur-[80px]" />
        <div className="absolute bottom-[20%] left-[35%] w-[350px] h-[350px] rounded-full bg-[#F59E0B]/[0.02] blur-[70px]" />
      </div>

      <motion.div
        className="px-6 py-16 max-w-5xl mx-auto relative"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* ─── [v3] Back to home link ─── */}
        <motion.div variants={staggerItem} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors font-body text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to SparkForge
          </Link>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* HERO SECTION                                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={staggerItem} className="text-center mb-12 relative">
          {/* [v3] Emissive glow accent */}
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#3B82F6]/[0.06] blur-[80px] pointer-events-none"
            aria-hidden="true"
          />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3 relative">
            Simple, Kid-Friendly Pricing
          </h1>
          <p className="font-body text-base text-white/40 relative">
            Start free. Upgrade when your explorer is ready for more.
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* BILLING TOGGLE                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={staggerItem} className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-xl font-display text-sm font-bold transition-all ${
              billing === 'monthly'
                ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25'
                : 'text-white/40 hover:text-white/60'
            }`}
            aria-pressed={billing === 'monthly'}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-xl font-display text-sm font-bold relative transition-all ${
              billing === 'yearly'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'text-white/40 hover:text-white/60'
            }`}
            aria-pressed={billing === 'yearly'}
          >
            Yearly
            <span className="absolute -top-2.5 -right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-[9px] font-bold text-white">
              Save {getYearlySavingsPercent('plus')}%
            </span>
          </button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TIER CARDS                                         */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {(['free', 'plus', 'forge'] as SubscriptionTier[]).map((slug) => {
            const t = TIER_DISPLAY[slug];
            const isPopular = t.highlight;
            const price = billing === 'monthly' ? t.monthlyPrice : t.yearlyPrice;
            const Icon = TIER_ICONS[slug];
            const color = TIER_COLORS[slug];

            return (
              <motion.div
                key={slug}
                className={`relative rounded-2xl p-8 border bg-white/[0.02] backdrop-blur-sm ${
                  isPopular
                    ? 'border-[#3B82F6]/30 ring-1 ring-[#3B82F6]/10 md:scale-105'
                    : 'border-white/[0.06]'
                }`}
                whileHover={{ y: -4 }}
              >
                {/* "Most Popular" badge */}
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#3B82F6] text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}

                {/* [v3] LED accent strip at top */}
                <div
                  className="absolute top-0 left-[10%] right-[10%] h-[2px] rounded-full"
                  style={{
                    background: `linear-gradient(to right, transparent, ${color}, transparent)`,
                    opacity: isPopular ? 0.5 : 0.2,
                  }}
                  aria-hidden="true"
                />

                <Icon className="w-10 h-10 mb-4" style={{ color }} />
                <h2 className="font-display text-xl font-bold text-white">{t.name}</h2>
                <p className="font-body text-sm text-white/40 mb-5">{t.tagline}</p>

                {/* Price display */}
                {price === 0 ? (
                  <p className="font-display text-4xl font-bold text-white mb-6">Free</p>
                ) : (
                  <div className="flex items-end gap-1 mb-6">
                    <span className="font-display text-4xl font-bold text-white">
                      ${price.toFixed(2)}
                    </span>
                    <span className="font-body text-sm text-white/30 mb-1">
                      /{billing === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                )}

                {/* Feature list */}
                <ul className="space-y-2.5 mb-8" role="list">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="font-body text-sm text-white/60">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Link
                  href="/signup"
                  className={`block w-full py-3 rounded-xl text-center font-display font-bold text-sm transition-all ${
                    isPopular
                      ? 'bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white shadow-lg shadow-[#3B82F6]/20 hover:shadow-xl hover:shadow-[#3B82F6]/30'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:border-white/20 hover:bg-white/[0.08]'
                  }`}
                  aria-label={slug === 'free' ? 'Start free' : `Get ${t.name}`}
                >
                  {slug === 'free' ? 'Start Free' : `Get ${t.name}`}
                </Link>

                {/* [v3] LED accent strip at bottom */}
                <div
                  className="absolute bottom-0 left-[10%] right-[10%] h-[1px] rounded-full"
                  style={{
                    background: `linear-gradient(to right, transparent, ${color}60, transparent)`,
                    opacity: 0.3,
                  }}
                  aria-hidden="true"
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FEATURE COMPARISON TABLE                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={staggerItem} className="mb-16">
          <h2 className="font-display text-2xl font-bold text-white text-center mb-8">
            Compare Plans
          </h2>

          {/* [v3] Chrome bezel styling on table */}
          <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
            {/* [v3] Top LED strip */}
            <div
              className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent"
              aria-hidden="true"
            />

            {/* Header row */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/[0.04]">
              <div />
              {(['free', 'plus', 'forge'] as SubscriptionTier[]).map((slug) => (
                <div key={slug} className="text-center">
                  <p className="font-display text-sm font-bold" style={{ color: TIER_COLORS[slug] }}>
                    {TIER_DISPLAY[slug].name}
                  </p>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 gap-4 p-4 items-center ${
                  i % 2 === 0 ? 'bg-white/[0.015]' : ''
                }`}
              >
                <p className="font-body text-sm text-white/60">{row.label}</p>
                <div className="text-center">{renderFeatureValue(row.free)}</div>
                <div className="text-center">{renderFeatureValue(row.plus)}</div>
                <div className="text-center">{renderFeatureValue(row.forge)}</div>
              </div>
            ))}

            {/* [v3] Bottom LED strip */}
            <div
              className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent"
              aria-hidden="true"
            />
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FOR SCHOOLS CTA                                    */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={staggerItem} className="mb-16">
          <div className="rounded-2xl p-8 md:p-12 relative overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
            {/* Background accent */}
            <div
              className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/[0.06] blur-[60px]"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              {/* Left: Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                    <GraduationCap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white">Spark Classroom</h2>
                    <p className="font-body text-sm text-emerald-400">For schools and districts</p>
                  </div>
                </div>

                <p className="font-body text-sm text-white/60 mb-4">
                  Bring AI literacy to your classroom with volume licensing,
                  teacher dashboards, progress reporting, and curriculum-aligned content
                  for students ages 7–16.
                </p>

                <ul className="space-y-2 mb-4" role="list">
                  {[
                    'Volume pricing for 25+ students',
                    'Teacher dashboard with class analytics',
                    'Curriculum-aligned lab assignments',
                    'Student rostering (Clever, ClassLink)',
                    'Custom branding options',
                    'Dedicated support contact',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="font-body text-xs text-white/50">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: Contact form */}
              <div>
                {schoolSubmitted ? (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <span className="text-5xl block mb-4">🎉</span>
                    <h3 className="font-display text-lg font-bold text-white mb-2">
                      Thanks for your interest!
                    </h3>
                    <p className="font-body text-sm text-white/50">
                      We&apos;ll reach out within 24 hours to discuss Spark Classroom
                      for your school.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSchoolSubmit} className="space-y-3">
                    {/* School Name */}
                    <div>
                      <label htmlFor="school-name" className="font-body text-xs text-white/40 block mb-1">
                        School / District Name
                      </label>
                      <input
                        id="school-name"
                        type="text"
                        required
                        value={schoolForm.schoolName}
                        onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-body text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all placeholder:text-white/20"
                        placeholder="e.g., Lincoln Elementary"
                        aria-label="School or district name"
                      />
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label htmlFor="school-email" className="font-body text-xs text-white/40 block mb-1">
                        Contact Email
                      </label>
                      <input
                        id="school-email"
                        type="email"
                        required
                        value={schoolForm.contactEmail}
                        onChange={(e) => setSchoolForm({ ...schoolForm, contactEmail: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-body text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all placeholder:text-white/20"
                        placeholder="admin@school.edu"
                        aria-label="Contact email address"
                      />
                    </div>

                    {/* Estimated Students */}
                    <div>
                      <label htmlFor="school-students" className="font-body text-xs text-white/40 block mb-1">
                        Estimated Students
                      </label>
                      <select
                        id="school-students"
                        value={schoolForm.estimatedStudents}
                        onChange={(e) => setSchoolForm({ ...schoolForm, estimatedStudents: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-body text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
                        aria-label="Estimated number of students"
                      >
                        <option value="" className="bg-[#0D1117]">Select range</option>
                        <option value="25-50" className="bg-[#0D1117]">25–50</option>
                        <option value="51-200" className="bg-[#0D1117]">51–200</option>
                        <option value="201-500" className="bg-[#0D1117]">201–500</option>
                        <option value="501-1000" className="bg-[#0D1117]">501–1,000</option>
                        <option value="1000+" className="bg-[#0D1117]">1,000+</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="school-message" className="font-body text-xs text-white/40 block mb-1">
                        Message (optional)
                      </label>
                      <textarea
                        id="school-message"
                        rows={2}
                        value={schoolForm.message}
                        onChange={(e) => setSchoolForm({ ...schoolForm, message: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-body text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all resize-none placeholder:text-white/20"
                        placeholder="Tell us about your needs..."
                        aria-label="Optional message"
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-display text-sm font-bold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow"
                      whileTap={{ scale: 0.98 }}
                    >
                      <School className="w-4 h-4" /> Get Spark Classroom Info
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FAQ ACCORDION                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div
          variants={staggerItem}
          className="max-w-2xl mx-auto mb-16"
          role="region"
          aria-label="Frequently asked questions"
        >
          <h2 className="font-display text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 flex items-center justify-between text-left"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="font-display text-sm font-bold text-white pr-4">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 font-body text-sm text-white/50 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* BOTTOM CTA                                         */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={staggerItem} className="text-center pb-8 relative">
          {/* [v3] Emissive glow accent */}
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full bg-[#3B82F6]/[0.05] blur-[60px] pointer-events-none"
            aria-hidden="true"
          />
          <h2 className="font-display text-2xl font-bold text-white mb-3 relative">
            Ready to spark your child&apos;s AI journey?
          </h2>
          <p className="font-body text-sm text-white/40 mb-6 relative">
            No credit card required. Start exploring today.
          </p>
          <Link
            href="/signup"
            className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white font-display font-bold text-sm shadow-lg shadow-[#3B82F6]/20 hover:shadow-xl hover:shadow-[#3B82F6]/30 transition-all"
          >
            <Rocket className="w-5 h-5" /> Start Free — No Card Needed
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

---

## Environment Variables (UNCHANGED from v2)

The `.env.local` Stripe variables from Stage 8 v2 Part 3 remain authoritative. No changes needed. Listed here for reference only.

```bash
# ════════════════════════════════════════════════════
# STAGE 8 — Stripe & Subscription (from v2, UNCHANGED)
# ════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_your-key-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-secret-here

# Stripe Price IDs
STRIPE_PRICE_PLUS_MONTHLY=price_plus_monthly_id_here
STRIPE_PRICE_PLUS_YEARLY=price_plus_yearly_id_here
STRIPE_PRICE_FORGE_MONTHLY=price_forge_monthly_id_here
STRIPE_PRICE_FORGE_YEARLY=price_forge_yearly_id_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Verify Everything

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Lint
npx eslint src/app/\(marketing\)/pricing/page.tsx

# 3. Dev server
npm run dev
# Navigate to /pricing
# Test all visual items from checklist below
# Resize to mobile → verify responsive layout

# 4. Build
npm run build
```

---

## Pricing Page Verification Checklist

### Visual Verification (localhost:3000/pricing)

- [ ] Aurora background visible (gradient blobs, not flat color)
- [ ] "Back to SparkForge" arrow link in top-left
- [ ] Hero text "Simple, Kid-Friendly Pricing" centered
- [ ] Emissive glow accent behind hero text
- [ ] Monthly/Yearly toggle works, both states styled differently
- [ ] Yearly shows "Save X%" badge (emerald green)
- [ ] Three tier cards: Free / Plus (Most Popular, `scale-105`) / Forge
- [ ] Each tier card has LED accent strips (top + bottom) in tier color
- [ ] Free shows "Free", Plus shows "$7.99/mo", Forge shows "$14.99/mo"
- [ ] Yearly prices: Plus "$79.99/yr", Forge "$149.99/yr"
- [ ] Feature checkmarks render on each card (emerald green)
- [ ] CTA buttons: "Start Free" / "Get Spark Plus" / "Get Spark Forge"
- [ ] Plus CTA has emissive blue gradient; others have subtle border
- [ ] Feature comparison table: chrome bezel + LED strips + 10 rows
- [ ] "For Schools" section: form with 4 inputs, emerald accent
- [ ] Submit form shows "Thanks for your interest!" confirmation
- [ ] FAQ accordion: 6 questions, click to expand/collapse, chevron rotates
- [ ] Bottom CTA: "Start Free — No Card Needed" with emissive glow
- [ ] All animations smooth (stagger entry, hover lift on cards)

### ARIA / Accessibility

- [ ] `aria-pressed` on billing toggle buttons
- [ ] `aria-expanded` on FAQ accordion buttons
- [ ] `aria-controls` linking FAQ button to answer
- [ ] `aria-label` on all form inputs
- [ ] `role="list"` on feature lists
- [ ] `role="region"` on FAQ section
- [ ] `aria-hidden` on decorative elements (aurora, LED strips)

---

## Git Commit

```bash
git add -A
git commit -m "Stage 8 Part 3B: Pricing page with v3 station aesthetic"
```

---

## Part B Summary

| File | Type | Lines | V3 Enhancements |
|------|------|-------|-----------------|
| `src/app/(marketing)/pricing/page.tsx` | REPLACE | ~530 | Aurora bg, LED accent strips, chrome bezel table, emissive CTAs, back link, Frost-Prismatic colors. All v2 preserved. |

### Decision 8.4 Implementation

Pricing page lives on a dedicated `/pricing` route, separate from the scroll journey. The scroll journey Act 5 CTA links to `/pricing`. The pricing page includes a back-link to the landing page for navigation flow. Both pages share the aurora background aesthetic for visual continuity.

---

**NEXT:** Part C — Landing page integration (`page.tsx` REPLACE) + full verification + git commands

**Stage 8 Part 3 v3-FINAL Part B COMPLETE**
