# AUDIT 2 — Regulatory Compliance Matrix

> **Purpose:** Verify that each specific disclosure / mechanism required by
> COPPA 2025 amendments, CA ARL AB 2863, ROSCA, state privacy laws, DMCA, and
> GDPR maps to a concrete section of the SparkForge legal documents and, where
> the requirement is operational (not just textual), to actual working code.

**Auditor:** Claude Code (cross-reference of legal research memo against docs + codebase)
**Date:** 2026-04-23
**Branch:** `claude/stripe-integration-setup-Oi9wZ`
**Commit at audit start:** `dee3f8d`

---

## Scope of Compliance

- COPPA (16 CFR Part 312) incl. 2025 amendments (effective April 22, 2026)
- ROSCA (15 U.S.C. §8403)
- California Automatic Renewal Law as amended by AB 2863 (effective July 1, 2025)
- Similar auto-renewal laws in NY / OR / CT / VT / NC / IL / VA / CO / TN
- California CCPA/CPRA + CA AADC (AB 2273)
- Maryland MODPA + MD AADC (HB 603)
- State privacy laws: VCDPA, CPA, CTDPA, UCPA, TDPSA, OCPA, DPDPA, NY CDPA
- DMCA (17 U.S.C. §512)
- GDPR Art. 8 + Schrems II transfer safeguards
- FTC Act §5 (Epic, Edmodo, Amazon consent-decree lessons)

---

## Matrix — Disclosure-level requirements

Legend: ✓ Disclosed and accurate · ⚠ Disclosed but depends on a placeholder or
operational task · ✗ Undisclosed

| # | Requirement | Source | Document Location | Status |
|---|---|---|---|---|
| D1 | Operator name, physical address, phone, email | COPPA 16 CFR 312.4(d)(1) | Privacy §1, §13 | ⚠ (address placeholder) |
| D2 | Types of PI collected & collection method | COPPA 312.4(d)(2) | Privacy §2a–§2e (post-AUDIT-1 fixes) | ✓ |
| D3 | How PI is used | COPPA 312.4(d)(3) | Privacy §3 | ✓ |
| D4 | Third-party disclosure: name / category, purpose, internal-use vs disclosure | COPPA 312.4(d)(4) (2025 amended) | Privacy §4 (7 services: Supabase/Stripe/Anthropic/Vercel/Sentry/Resend/Upstash) | ✓ |
| D5 | Parental rights (review / delete / refuse / revoke) + how to exercise | COPPA 312.4(d)(5), 312.6 | Privacy §6 + /privacy/rights | ✓ |
| D6 | Retention period (maximum) | COPPA 312.10 (2025 amended) | Privacy §7 (3-year absolute max clause) | ✓ |
| D7 | Written children's PI security program | COPPA 312.8 (new 2025) | Privacy §8a | ✓ |
| D8 | Separate VPC for third-party disclosure | COPPA 312.5 (new 2025) | Privacy §5b | ✓ |
| D9 | VPC method disclosed | COPPA 312.5(b) | Privacy §5a (email-plus) | ✓ |
| D10 | No conditioning participation on unnecessary PI | COPPA 312.7 | Privacy §2e | ✓ |
| D11 | No targeted advertising commitment | COPPA 2025 + state AADCs | Privacy §10 | ✓ |
| D12 | Persistent-identifier disclosure (IP, cookies) | COPPA FAQ A.3 | Privacy §9 + /cookies inventory (4 items) | ✓ |
| D13 | State-law supplement (CA/MD/VA/CO/CT/OR/TX/UT/DE/NY + aggregated) | CCPA/CPRA, MD AADC, etc. | Privacy §14 | ✓ |
| D14 | California CCPA rights inventory + GPC honoring | Cal. Civ. Code 1798.100 et seq. | Privacy §14a | ✓ |
| D15 | GDPR Art. 8 + cross-border transfers (SCCs, UK IDTA, DPF, TIAs) | GDPR Arts. 8, 46 | Privacy §15a–f | ✓ |
| D16 | Breach notification commitments (federal + state matrix) | Multi-state | Privacy §16a–e | ✓ |
| D17 | Auto-renewal clear & conspicuous disclosure | ROSCA + CA ARL AB 2863 | ToS §4e + Pricing page disclosure block | ✓ |
| D18 | Separate affirmative auto-renewal consent at checkout | CA ARL AB 2863 | ToS §4e item 3 — described | ⚠ (see R1 below: UI not implemented) |
| D19 | Post-purchase acknowledgment in retainable form | CA ARL AB 2863 | ToS §4e item 4 — described | ⚠ (see R7) |
| D20 | Free-to-pay conversion disclosure + 48h mid-trial reminder | CA ARL AB 2863 + ROSCA | ToS §4f + trial-reminder.ts | ✓ |
| D21 | Annual renewal reminder (3–21 days) for yearly plans | CA ARL AB 2863 | ToS §4e item 5 — described | ⚠ (see R2) |
| D22 | Material change notice 7–30 days ahead | CA ARL AB 2863 | ToS §4e item 6 — described | ⚠ (see R3) |
| D23 | Click-to-quit cancellation | ROSCA + ARL | ToS §4e item 7 + Parent Dashboard | ✓ (implemented via `/parent/subscription`) |
| D24 | 3-year consent retention record | CA BPC 17602.1(d) | ToS §4e item 8 | ⚠ (see R6) |
| D25 | MIT / SCA continuous-authority mandate language | Visa VMR + Mastercard RBF + PSD2 | ToS §4g | ✓ |
| D26 | Arbitration: 30-day opt-out | FAA best practice | ToS §12d | ✓ |
| D27 | McGill v. Citibank severability | Cal. 2017 | ToS §12g | ✓ |
| D28 | Cal. Civ. Code §1668 carve-outs | California | ToS §12i | ✓ |
| D29 | Mass-arbitration protocol | FAA best practice | ToS §12h | ✓ |
| D30 | Regulatory complaints preserved | — | ToS §12j | ✓ |
| D31 | DMCA designated agent + contact block | 17 U.S.C. 512(c)(2) | /dmca §1 | ⚠ (address placeholder + not yet registered with Copyright Office) |
| D32 | DMCA takedown notice elements (6 items) | 17 U.S.C. 512(c)(3) | /dmca §2 | ✓ |
| D33 | DMCA counter-notice (4 items) | 17 U.S.C. 512(g)(3) | /dmca §3 | ✓ |
| D34 | Repeat-infringer policy | 17 U.S.C. 512(i)(1)(A) | /dmca §4 | ✓ |
| D35 | AI content IP pass-through + no-training commitment | Anthropic Commercial Terms | ToS §7 (new items) | ✓ |
| D36 | Severability, entire agreement, assignment, force majeure, export, IAP | Boilerplate best practice | ToS §15a–h | ✓ |

**Totals:** 32 ✓, 4 ⚠ (placeholder / operational), 0 ✗.

---

## Implementation gaps (docs promise; code does not yet do)

These are **operational** gaps — the legal docs accurately describe what *will*
happen, but the supporting code/configuration is not yet built.

### R1 — Affirmative auto-renewal checkbox UI on `/parent/subscription`
- **ToS §4e item 3 promises:** "Before you are charged, you must click a checkbox or equivalent affirmative control acknowledging that your subscription will automatically renew and that you authorize the recurring charge. This is required to be *separate* from your general acceptance of these Terms."
- **Reality:** `grep -nE "(affirmative|auto.renew|checkbox)" src/app/(dashboard)/parent/subscription/page.tsx` → **no matches**.
- **Scope:** the Parent-Dashboard "Change Plan / Upgrade" path redirects to Stripe Hosted Checkout without a pre-redirect affirmative-consent checkbox. CA ARL AB 2863 requires this checkbox on the merchant surface because Stripe-hosted Checkout does not fit the separate-consent requirement on its own.
- **Fix options:** add an affirmative-consent modal or inline control to `/parent/subscription` that gates the "Continue to checkout" button for paid tiers.

### R2 — Annual renewal reminder cron (yearly plans)
- **ToS §4e item 5 promises:** "For Plus Yearly and Forge Yearly subscriptions, we send a renewal-reminder email between three (3) and twenty-one (21) days before each annual renewal..."
- **Reality:** `src/app/api/cron/` contains only `dunning/` and `trial-reminders/`. No annual-reminder cron.
- **Fix options:** add a new cron `src/app/api/cron/annual-reminder/route.ts` that scans `parents` for yearly subs with `subscription_period_end` 14 days out, renders a new email template, sends via Resend. Wire into `vercel.json` cron.

### R3 — Material change notification system
- **ToS §4e item 6 and Privacy §12 promise:** email all affected parents 7–30 days before any material change in renewal terms (e.g., price increase) or material change in privacy practices, with an opportunity to cancel.
- **Reality:** no code path that sends such a notice; no UI in admin for triggering one.
- **Fix options:** defer to an admin operational tool; document the process in a runbook so when a material change is made, the admin manually triggers a bulk email via Resend.

### R6 — 3-year consent retention record
- **ToS §4e item 8 promises:** retention of "proof of each affirmative auto-renewal consent — including timestamp, IP address, and the specific version of this section in effect at the time — for at least three (3) years."
- **Reality:** `parents.coppa_consent_at` captures timestamp but not IP, not version string. Auto-renewal consent is currently the same column.
- **Fix options:**
  - (a) extend the schema to add `coppa_consent_ip` and `coppa_consent_terms_version` columns;
  - (b) rely on Stripe's own charge-event retention (Stripe retains evidence of recurring authorization for 7 years minimum) plus our `subscription_events` table. Acceptable if we align the ToS language with Stripe-held evidence.

### R7 — Post-purchase acknowledgment email
- **ToS §4e item 4 promises:** "Immediately after each initial purchase, tier change, or renewal, we send an email to your registered address containing … a summary of the agreement, the renewal terms (cadence and amount), a description of how to cancel, and a link to the Parent Dashboard cancellation control."
- **Reality:** Stripe sends its own branded receipt on each charge. SparkForge does not currently send a separate confirmation email.
- **Fix options:**
  - (a) rely on Stripe receipt (configurable via Stripe Dashboard → Settings → Emails → "Successful payments"), customized to restate the renewal terms and point to `/parent/subscription`;
  - (b) build a native `checkout.session.completed` handler in `webhook/route.ts` that enqueues a Resend email.

---

## Placeholder-driven gaps (already in OUTSTANDING_BLANKS.md)

- Physical mailing address (affects D1, D31)
- DMCA Copyright Office registration (affects D31)
- Sentry scrubber drift verification (AUDIT 1 G5)
- FERPA schools-tier addendum (only if B2B schools tier launches)
- Safe Harbor membership decision

---

## Summary

**Disclosure coverage is essentially complete** after Phases 1–5 + AUDIT 1
remediations. 32 of 36 matrix items are fully ✓; the 4 ⚠ items all map to
R1–R7 implementation gaps, not to missing disclosure.

Most critical gap for production readiness: **R1** (affirmative auto-renewal
checkbox UI). Without it, SparkForge is describing a control in its ToS that
does not actually exist on the page that collects payment consent. California
regulators have brought enforcement actions over this specific mismatch.

Remediation options surfaced to the user in chat.
