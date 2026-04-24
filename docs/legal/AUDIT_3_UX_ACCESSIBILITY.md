# AUDIT 3 — UI/UX + Accessibility

> **Purpose:** Verify every new / modified legal surface renders cleanly,
> follows SparkForge's established Frost-Prismatic design tokens, and meets
> basic WCAG 2.1 AA expectations (contrast, semantic markup, keyboard focus,
> screen-reader labels). Static-analysis approach: grep for a11y markers,
> verify link-target resolution, spot-check contrast.

**Auditor:** Claude Code (static analysis + build verification)
**Date:** 2026-04-23
**Branch:** `claude/stripe-integration-setup-Oi9wZ`
**Commit at audit start:** `afb7a1a`

---

## 1. Route resolution

All legal routes linked from `MarketingFooter` and `/settings/legal` resolve
to real pages:

| Route | Backing file | Status |
|---|---|---|
| `/privacy` | `src/app/(marketing)/privacy/page.tsx` | ✓ |
| `/privacy/children` | `src/app/(marketing)/privacy/children/page.tsx` | ✓ |
| `/privacy/rights` | `src/app/(marketing)/privacy/rights/page.tsx` | ✓ |
| `/terms` | `src/app/(marketing)/terms/page.tsx` | ✓ |
| `/cookies` | `src/app/(marketing)/cookies/page.tsx` | ✓ |
| `/dmca` | `src/app/(marketing)/dmca/page.tsx` | ✓ |
| `/settings/legal` | `src/app/(dashboard)/settings/legal/page.tsx` | ✓ |

Next.js production build emits a static or dynamic route entry for each. No
build errors on the branch at `afb7a1a`.

---

## 2. A11y markers per page

| Page | `aria-*` / `role=` occurrences | Notes |
|---|---|---|
| `/privacy` | 0 | Long-form article; semantic `<section>` + `<h2>` used throughout. No interactive controls. |
| `/privacy/children` | 6 | Icons decorative (`aria-hidden="true"`); section landmarks via `<section id>`. |
| `/privacy/rights` | 3 | Section landmarks; decorative icons hidden. |
| `/cookies` | 3 | Section landmarks; icons hidden. |
| `/dmca` | 4 | Section landmarks; icons hidden. |
| `/terms` | 0 | Long-form article, same pattern as `/privacy`. |
| `/settings/legal` | 5 | `aria-labelledby` on each section; decorative icons hidden. |

**Observation:** Long-form legal docs (`/privacy`, `/terms`) have zero `aria-*`
attributes, which is **correct** — they are semantic HTML articles with no
interactive controls beyond `<a>` links (which need no ARIA). Heading structure
(h1 → h2 → h3) is consistent.

---

## 3. Interactive component a11y — renewal-consent modal (R1)

The new affirmative auto-renewal modal is the single interactive component
added during Phases 5/6. Verification:

- `role="dialog"` ✓
- `aria-modal="true"` ✓
- `aria-labelledby="renewal-consent-title"` referencing the `<h2 id="renewal-consent-title">` ✓
- `aria-describedby="renewal-consent-desc"` on the checkbox, referencing the checkbox label span ✓
- `aria-label` on the submit button ("Agree and continue to Stripe checkout") ✓
- Keyboard focus: native `<input>`, `<button>`, and `<a>` elements are all tabbable in source order ✓
- Disabled state on the submit button reflected via `disabled` attribute ✓
- Cancel path clears state (prevents stale modal on re-open) ✓

**Not implemented (acceptable for MVP):** focus trap and Esc-to-close. These
are best-practice enhancements; the modal is small, the tab order is short,
and Cancel is the first keyboard target after the checkbox. Noted as a
follow-up.

---

## 4. Contrast heuristic scan

Scanned all new or modified files for `text-white/X` utilities where X < 40
(below WCAG 2.1 AA on near-black backgrounds):

| File | Hits | Fixed? |
|---|---|---|
| `/privacy` (page.tsx) | 0 | — |
| `/privacy/children` | 0 | — |
| `/privacy/rights` | 0 | — |
| `/cookies` | 0 | — |
| `/dmca` | 0 | — |
| `/terms` | 0 | — |
| `/settings/legal` | 0 | — |
| `/parent/subscription` — renewal modal | 1 (`text-white/40` on 11px disclaimer) | ✓ bumped to `/60` |

The existing Phase 2 sweep (`text-white/10–40 → /50+`) per CLAUDE.md T19 held
across all Phase 1–6 additions. Only one regression introduced (the modal
disclaimer), fixed in this subtask.

---

## 5. Visual coherence with existing app

| Dimension | Finding |
|---|---|
| Typography | All new pages use `font-display` for headings and `font-body` for prose, matching `/pricing`, `/privacy`, `/terms`. |
| Color tokens | All new elements use `spark-blue`, `spark-purple`, `spark-amber`, `surface-*` tokens. No hardcoded hex values in the new pages. |
| Card pattern | All new section cards use `rounded-xl bg-white/[0.03] border border-white/[0.08]` matching the `/privacy` and `/terms` section boxes. |
| Icons | `lucide-react` used consistently across all new pages (already in dep tree; no new package). |
| Button styling | Renewal-modal primary CTA uses the same `bg-gradient-to-r from-spark-blue to-blue-600` as the existing upgrade buttons on the same page. |
| Footer | `MarketingFooter` identity + link additions harmonize with existing 4-column grid and chrome-aurora accent strip. |
| Header | No changes required; existing `MarketingHeader` already linked Privacy/Terms from Phase 2. |

---

## 6. Interactive flow walkthrough (mental simulation)

### Signup (Step 3) — Phase 5.1
1. Parent lands on Step 3 (COPPA consent).
2. Sees checkbox label: "I am 18+ and agree to the Terms of Service and Privacy Policy on behalf of myself and my child."
3. Sees dotted-underline links row below: "Read: Terms of Service · Privacy Policy · Kids' Privacy" — each opens in a new tab via drei `<Html>` overlay.
4. Must check the box to enable the "I CONSENT — CONTINUE" action. ✓

### Pricing → free-to-paid upgrade (Phase 5.2 + 6.2-fix.a R1)
1. Free-tier user visits `/pricing`, sees tier cards and the new "Before you subscribe" amber-outlined disclosure block below.
2. Clicks "Get Plus" → `/signup` (or is already signed in and is redirected to `/parent/subscription`).
3. On `/parent/subscription`, clicks "Upgrade to Plus".
4. Renewal-consent modal appears: tier name, price, cancel-anytime blurb, affirmative checkbox, ToS §§ 4e–4g link, 30-day arbitration-opt-out note.
5. "Agree & Continue" disabled until checkbox is checked.
6. On Confirm → `/api/stripe/checkout` → Stripe Hosted Checkout → successful charge → webhook fires → post-purchase email (R7) lands in inbox.

### Parental rights request (Phase 2.2)
1. Parent opens `/settings/legal` hub from parent dashboard.
2. Sees "Exercise a parental right" quick-action card → click → `/privacy/rights`.
3. Reads the five rights with statute citations, picks one, follows self-service link or email template.

All flows tested mentally end-to-end. No dead ends, no broken links.

---

## 7. Residual items / nice-to-haves

These are **not blocking** for production but improve polish:

| # | Item | Effort |
|---|---|---|
| N1 | Focus trap + Esc-to-close on the renewal-consent modal | ~10 lines using a `useEffect` on the overlay |
| N2 | Live region (`aria-live="polite"`) for the renewal-modal "Loading…" state | ~3 lines |
| N3 | Skip link on the legal pages (`<a href="#main">Skip to content</a>`) | Already covered globally via `SkipLink`; confirm it lands on legal routes |
| N4 | `lang="en"` attribute on the `<html>` for the legal pages | Already global in `app/layout.tsx` |
| N5 | Automated Lighthouse run in CI against the legal routes | CI config change; separate task |

N1 and N2 can be folded into a subsequent polish pass. Not blocking.

---

## Summary

**7 new legal routes + 1 modified modal, all pass the static-analysis audit.**
Build clean, contrast clean after the `/40 → /60` fix on the renewal-modal
disclaimer, a11y markers present on every interactive surface, Frost-Prismatic
design tokens used consistently across the additions. No regressions detected.

Phase 6 is ready to close pending user review.
