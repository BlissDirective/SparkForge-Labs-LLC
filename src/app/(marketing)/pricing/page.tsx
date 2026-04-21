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
// ENHANCEMENTS (7):
// [ENH-1] prefers-reduced-motion: disables hover/stagger animations
// [ENH-2] Pulse animation on "Most Popular" badge
// [ENH-3] Smooth scroll anchor from "Compare Plans" to tier cards
// [ENH-4] Memoized renderFeatureValue with useCallback
// [ENH-5] Scanline overlay on comparison table (station aesthetic)
// [ENH-6] Inline form validation feedback on school contact form
// [ENH-7] Animated count-up for yearly savings percentage
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

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
// For Schools form state + validation
// ════════════════════════════════════════════════════

interface SchoolFormData {
  schoolName: string;
  contactEmail: string;
  estimatedStudents: string;
  message: string;
}

// [ENH-6] Inline validation error types
interface FormErrors {
  schoolName?: string;
  contactEmail?: string;
  estimatedStudents?: string;
}

// ════════════════════════════════════════════════════
// [ENH-7] Animated counter hook
// ════════════════════════════════════════════════════
function useAnimatedCounter(target: number, duration: number = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target === prevTarget.current && count !== 0) return;
    prevTarget.current = target;

    if (target === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let rafId: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return count;
}

// ════════════════════════════════════════════════════
// PRICING PAGE COMPONENT
// ════════════════════════════════════════════════════

export default function PricingPage() {
  // [ENH-1] Detect prefers-reduced-motion
  const prefersReducedMotion = useReducedMotion();

  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [schoolForm, setSchoolForm] = useState<SchoolFormData>({
    schoolName: '',
    contactEmail: '',
    estimatedStudents: '',
    message: '',
  });
  const [schoolSubmitted, setSchoolSubmitted] = useState(false);

  // [ENH-6] Form validation state
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

  // [ENH-7] Animated savings counter
  const savingsPercent = getYearlySavingsPercent('plus');
  const animatedSavings = useAnimatedCounter(
    billing === 'yearly' ? savingsPercent : savingsPercent,
    800
  );

  // [ENH-1] Conditional animation variants — no motion when reduced
  const safeStaggerContainer = prefersReducedMotion
    ? { initial: {}, animate: {} }
    : staggerContainer;
  const safeStaggerItem = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : staggerItem;

  // [ENH-6] Validate a single field
  const validateField = useCallback((field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'schoolName':
        if (!value.trim()) return 'School name is required';
        if (value.trim().length < 2) return 'School name must be at least 2 characters';
        return undefined;
      case 'contactEmail':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return undefined;
      case 'estimatedStudents':
        if (!value) return 'Please select a student range';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  // [ENH-6] Handle blur for inline validation
  function handleFieldBlur(field: keyof FormErrors) {
    setFormTouched((prev) => ({ ...prev, [field]: true }));
    const value = schoolForm[field];
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  }

  // [ENH-6] Enhanced submit with validation
  function handleSchoolSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate all fields
    const errors: FormErrors = {
      schoolName: validateField('schoolName', schoolForm.schoolName),
      contactEmail: validateField('contactEmail', schoolForm.contactEmail),
      estimatedStudents: validateField('estimatedStudents', schoolForm.estimatedStudents),
    };

    setFormErrors(errors);
    setFormTouched({ schoolName: true, contactEmail: true, estimatedStudents: true });

    // If any errors, don't submit
    if (Object.values(errors).some(Boolean)) return;

    // In production: POST to /api/school-interest or send email
    // TODO: POST to /api/school-interest or send email
    setSchoolSubmitted(true);
  }

  // [ENH-4] Memoized feature value renderer
  // D1: Enhanced feature values with animated CSS comparison bars for numeric values
  const renderFeatureValue = useCallback((val: FeatureValue, tier?: SubscriptionTier) => {
    if (val === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
    if (val === false) return <X className="w-4 h-4 text-white/15 mx-auto" />;

    // Numeric values get visual bar treatment
    const numericMatch = typeof val === 'string' && val.match(/^(\d+)/);
    if (numericMatch && tier) {
      const num = parseInt(numericMatch[1], 10);
      const maxVal = tier === 'forge' ? num : (tier === 'plus' ? num * 1.2 : num * 4);
      const barWidth = Math.min(100, (num / maxVal) * 100);
      const tierColor = TIER_COLORS[tier];

      return (
        <div className="flex flex-col items-center gap-1">
          <span className="font-data text-sm text-white/80">{val}</span>
          <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: tierColor }}
              initial={{ width: 0 }}
              whileInView={{ width: `${barWidth}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      );
    }

    // "Unlimited" and "All 10" get full bar
    if (typeof val === 'string' && (val === 'Unlimited' || val === 'All 10') && tier) {
      const tierColor = TIER_COLORS[tier];
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="font-data text-sm" style={{ color: tierColor }}>{val}</span>
          <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: tierColor }}
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      );
    }

    return <span className="font-body text-sm text-white/70">{val}</span>;
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* [ENH-2] Keyframes moved to globals.css (HIGH-005 audit fix) */}

      {/* ─── [v3] Aurora background — visual continuity with ScrollJourney ─── */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117] via-[#0B1628] to-[#0D1117]" />
        <div className="absolute top-[15%] left-[25%] w-[500px] h-[500px] rounded-full bg-[#3B82F6]/[0.04] blur-[100px]" />
        <div className="absolute top-[40%] right-[15%] w-[400px] h-[400px] rounded-full bg-[#8B5CF6]/[0.03] blur-[80px]" />
        <div className="absolute bottom-[20%] left-[35%] w-[350px] h-[350px] rounded-full bg-[#F59E0B]/[0.02] blur-[70px]" />
      </div>

      <motion.div
        className="px-6 py-16 max-w-5xl mx-auto relative"
        variants={safeStaggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* ─── [v3] Back to home link ─── */}
        <motion.div variants={safeStaggerItem} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white/60 transition-colors font-body text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to SparkForge
          </Link>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* HERO SECTION                                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={safeStaggerItem} className="text-center mb-12 relative">
          {/* [v3] Emissive glow accent */}
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#3B82F6]/[0.06] blur-[80px] pointer-events-none"
            aria-hidden="true"
          />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3 relative">
            Simple, Kid-Friendly Pricing
          </h1>
          <p className="font-body text-base text-white/70 relative">
            Start free. Upgrade when your explorer is ready for more.
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* BILLING TOGGLE                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={safeStaggerItem} className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-xl font-display text-sm font-bold transition-all ${
              billing === 'monthly'
                ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25'
                : 'text-white/70 hover:text-white/60'
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
                : 'text-white/70 hover:text-white/60'
            }`}
            aria-pressed={billing === 'yearly'}
          >
            Yearly
            {/* [ENH-7] Animated savings counter */}
            <span className="absolute -top-2.5 -right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-2xs font-bold text-white">
              Save {animatedSavings}%
            </span>
          </button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TIER CARDS                                         */}
        {/* [ENH-3] Anchor target for smooth scroll            */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div
          id="tier-cards"
          variants={safeStaggerItem}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 scroll-mt-8"
        >
          {(['free', 'plus', 'forge'] as SubscriptionTier[]).map((slug) => {
            const t = TIER_DISPLAY[slug];
            const isPopular = t.highlight;
            const price = billing === 'monthly' ? t.monthlyPrice : t.yearlyPrice;
            const Icon = TIER_ICONS[slug];
            const color = TIER_COLORS[slug];

            return (
              <motion.div
                key={slug}
                className={`relative p-8 ${
                  /* Phase 4 §10.15: Glassmorphism 2.0 — popular tier uses
                     elevated variant with richer saturate + brighter top
                     edge. Non-popular tiers use base v2 with per-edge
                     border gradient. */
                  isPopular ? 'glass-card-v2-elevated ring-1 ring-[#3B82F6]/20 md:scale-105' : 'glass-card-v2'
                } border-0 ${
                  isPopular
                    ? ''
                    : ''
                }`}
                // [ENH-1] Disable hover lift when reduced motion preferred
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
              >
                {/* [ENH-2] "Most Popular" badge with pulse animation */}
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#3B82F6] text-xs font-bold text-white badge-pulse">
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
                <p className="font-body text-sm text-white/70 mb-5">{t.tagline}</p>

                {/* Price display */}
                {price === 0 ? (
                  <p className="font-display text-4xl font-bold text-white mb-6">Free</p>
                ) : (
                  <div className="flex items-end gap-1 mb-6">
                    <span className="font-display text-4xl font-bold text-white">
                      ${price.toFixed(2)}
                    </span>
                    <span className="font-body text-sm text-white/60 mb-1">
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
        <motion.div variants={safeStaggerItem} className="mb-16">
          {/* [ENH-3] "Compare Plans" links to tier cards via smooth scroll */}
          <h2 className="font-display text-2xl font-bold text-white text-center mb-8">
            <a
              href="#tier-cards"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('tier-cards')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
              }}
              className="hover:text-[#3B82F6] transition-colors cursor-pointer"
              aria-label="Scroll up to tier cards for quick reference"
            >
              Compare Plans
            </a>
          </h2>

          {/* [v3] Chrome bezel styling on table + [ENH-5] scanline overlay */}
          {/* Phase 4 §10.15: Glassmorphism 2.0 */}
          <div className="overflow-hidden glass-card-v2 relative">
            {/* [ENH-5] Scanline overlay — station CRT aesthetic */}
            <div
              className="absolute inset-0 scanline-overlay pointer-events-none z-10"
              aria-hidden="true"
            />

            {/* [v3] Top LED strip */}
            <div
              className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent relative z-20"
              aria-hidden="true"
            />

            {/* Header row */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/[0.04] relative z-20">
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
                className={`grid grid-cols-4 gap-4 p-4 items-center relative z-20 ${
                  i % 2 === 0 ? 'bg-white/[0.015]' : ''
                }`}
              >
                <p className="font-body text-sm text-white/60">{row.label}</p>
                <div className="text-center">{renderFeatureValue(row.free, 'free')}</div>
                <div className="text-center">{renderFeatureValue(row.plus, 'plus')}</div>
                <div className="text-center">{renderFeatureValue(row.forge, 'forge')}</div>
              </div>
            ))}

            {/* [v3] Bottom LED strip */}
            <div
              className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent relative z-20"
              aria-hidden="true"
            />
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FOR SCHOOLS CTA                                    */}
        {/* ═══════════════════════════════════════════════════ */}
        <motion.div variants={safeStaggerItem} className="mb-16">
          {/* Phase 4 §10.15: Glassmorphism 2.0 */}
          <div className="p-8 md:p-12 relative overflow-hidden glass-card-v2">
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
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
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
                  <form onSubmit={handleSchoolSubmit} className="space-y-3" noValidate>
                    {/* [ENH-6] School Name with inline validation */}
                    <div>
                      <label htmlFor="school-name" className="font-body text-xs text-white/70 block mb-1">
                        School / District Name
                      </label>
                      <input
                        id="school-name"
                        type="text"
                        required
                        value={schoolForm.schoolName}
                        onChange={(e) => {
                          setSchoolForm({ ...schoolForm, schoolName: e.target.value });
                          if (formTouched.schoolName) {
                            setFormErrors((prev) => ({ ...prev, schoolName: validateField('schoolName', e.target.value) }));
                          }
                        }}
                        onBlur={() => handleFieldBlur('schoolName')}
                        className={`w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border text-white font-body text-sm focus:outline-none transition-all placeholder:text-white/55 ${
                          formTouched.schoolName && formErrors.schoolName
                            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/30'
                            : 'border-white/[0.08] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30'
                        }`}
                        placeholder="e.g., Lincoln Elementary"
                        aria-label="School or district name"
                        aria-invalid={formTouched.schoolName && !!formErrors.schoolName}
                        aria-describedby={formErrors.schoolName ? 'school-name-error' : undefined}
                      />
                      {formTouched.schoolName && formErrors.schoolName && (
                        <p id="school-name-error" className="font-body text-xs text-red-400 mt-1" role="alert">
                          {formErrors.schoolName}
                        </p>
                      )}
                    </div>

                    {/* [ENH-6] Contact Email with inline validation */}
                    <div>
                      <label htmlFor="school-email" className="font-body text-xs text-white/70 block mb-1">
                        Contact Email
                      </label>
                      <input
                        id="school-email"
                        type="email"
                        required
                        value={schoolForm.contactEmail}
                        onChange={(e) => {
                          setSchoolForm({ ...schoolForm, contactEmail: e.target.value });
                          if (formTouched.contactEmail) {
                            setFormErrors((prev) => ({ ...prev, contactEmail: validateField('contactEmail', e.target.value) }));
                          }
                        }}
                        onBlur={() => handleFieldBlur('contactEmail')}
                        className={`w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border text-white font-body text-sm focus:outline-none transition-all placeholder:text-white/55 ${
                          formTouched.contactEmail && formErrors.contactEmail
                            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/30'
                            : 'border-white/[0.08] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30'
                        }`}
                        placeholder="admin@school.edu"
                        aria-label="Contact email address"
                        aria-invalid={formTouched.contactEmail && !!formErrors.contactEmail}
                        aria-describedby={formErrors.contactEmail ? 'school-email-error' : undefined}
                      />
                      {formTouched.contactEmail && formErrors.contactEmail && (
                        <p id="school-email-error" className="font-body text-xs text-red-400 mt-1" role="alert">
                          {formErrors.contactEmail}
                        </p>
                      )}
                    </div>

                    {/* [ENH-6] Estimated Students with inline validation */}
                    <div>
                      <label htmlFor="school-students" className="font-body text-xs text-white/70 block mb-1">
                        Estimated Students
                      </label>
                      <select
                        id="school-students"
                        value={schoolForm.estimatedStudents}
                        onChange={(e) => {
                          setSchoolForm({ ...schoolForm, estimatedStudents: e.target.value });
                          if (formTouched.estimatedStudents) {
                            setFormErrors((prev) => ({ ...prev, estimatedStudents: validateField('estimatedStudents', e.target.value) }));
                          }
                        }}
                        onBlur={() => handleFieldBlur('estimatedStudents')}
                        className={`w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border text-white font-body text-sm focus:outline-none transition-all ${
                          formTouched.estimatedStudents && formErrors.estimatedStudents
                            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/30'
                            : 'border-white/[0.08] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30'
                        }`}
                        aria-label="Estimated number of students"
                        aria-invalid={formTouched.estimatedStudents && !!formErrors.estimatedStudents}
                        aria-describedby={formErrors.estimatedStudents ? 'school-students-error' : undefined}
                      >
                        <option value="" className="bg-[#0D1117]">Select range</option>
                        <option value="25-50" className="bg-[#0D1117]">25–50</option>
                        <option value="51-200" className="bg-[#0D1117]">51–200</option>
                        <option value="201-500" className="bg-[#0D1117]">201–500</option>
                        <option value="501-1000" className="bg-[#0D1117]">501–1,000</option>
                        <option value="1000+" className="bg-[#0D1117]">1,000+</option>
                      </select>
                      {formTouched.estimatedStudents && formErrors.estimatedStudents && (
                        <p id="school-students-error" className="font-body text-xs text-red-400 mt-1" role="alert">
                          {formErrors.estimatedStudents}
                        </p>
                      )}
                    </div>

                    {/* Message (optional — no validation needed) */}
                    <div>
                      <label htmlFor="school-message" className="font-body text-xs text-white/70 block mb-1">
                        Message (optional)
                      </label>
                      <textarea
                        id="school-message"
                        rows={2}
                        value={schoolForm.message}
                        onChange={(e) => setSchoolForm({ ...schoolForm, message: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-body text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all resize-none placeholder:text-white/55"
                        placeholder="Tell us about your needs..."
                        aria-label="Optional message"
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-display text-sm font-bold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow"
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
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
          variants={safeStaggerItem}
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
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/60 flex-shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
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
        <motion.div variants={safeStaggerItem} className="text-center pb-8 relative">
          {/* [v3] Emissive glow accent */}
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full bg-[#3B82F6]/[0.05] blur-[60px] pointer-events-none"
            aria-hidden="true"
          />
          <h2 className="font-display text-2xl font-bold text-white mb-3 relative">
            Ready to spark your child&apos;s AI journey?
          </h2>
          <p className="font-body text-sm text-white/70 mb-6 relative">
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
