# OUTSTANDING_BLANKS — Legal Document Placeholders & Pre-Launch Items

> **Purpose:** Single punch list of placeholders, open decisions, and pre-launch
> finalization items for SparkForge Privacy Policy, Terms of Service, and related
> legal pages. Every bracketed placeholder (e.g. `[MAILING ADDRESS]`) in the app
> must be resolved here before production deployment.
>
> **Audience:** Business owner + licensed attorney performing pre-launch review.

**Last updated:** 2026-04-23
**Branch:** `claude/stripe-integration-setup-Oi9wZ`

---

## 1. Locked Decisions (do not change without coordinated doc update)

| Item | Value | Source |
|---|---|---|
| Legal entity | **SparkForge LLC** | Business owner, 2026-04-23 |
| State of formation | **Illinois** | Business owner, 2026-04-23 |
| Primary domain | **sparkforge-labs.com** | Business owner, 2026-04-23 |
| Contact phone | **(773) 629-2320** | Business owner, 2026-04-23 |
| Privacy contact email | **privacy@sparkforge-labs.com** | Derived from domain |
| Legal contact email | **legal@sparkforge-labs.com** | Derived from domain |
| Support contact email | **support@sparkforge-labs.com** | Derived from domain |
| DMCA designated agent | **Conrad Steinmeyer, Owner, admin@sparkforge-labs.com** | Business owner, 2026-04-23 |
| VPC method | **Email-plus (internal use only)** under 16 CFR 312.5(b)(2) | Business owner, 2026-04-23 |
| Governing law | **Illinois** | Derived from LLC state |

---

## 2. Bracketed Placeholders in App Code (MUST be replaced pre-launch)

| Placeholder token | File | Section | Required by |
|---|---|---|---|
| `[MAILING ADDRESS — to be finalized before production launch]` | `src/app/(marketing)/privacy/page.tsx` | §1 Operator Identification | 16 CFR 312.4(d)(1) |
| `[MAILING ADDRESS — to be finalized before production launch]` | `src/app/(marketing)/privacy/page.tsx` | §13 Contact Us | 16 CFR 312.4(d)(1) |
| `[MAILING ADDRESS — to be finalized before production launch]` | `src/app/(marketing)/terms/page.tsx` | §14 Contact | Consumer-protection best practice |

**Resolution steps:**
1. Finalize the physical mailing address for SparkForge LLC (may be registered-agent address of record in Illinois, or a separate business/PO-box address).
2. Grep `\[MAILING ADDRESS` in `src/app/(marketing)` to find every occurrence.
3. Replace token with the final address in each file.
4. Run `npm run build` to verify, then commit.

Expected occurrences after Phase 2 adds `/dmca`, `/privacy/children`, `/privacy/rights`, `/cookies`: more placeholders may be introduced — re-grep before launch.

---

## 3. Open Decisions Requiring Business-Owner Input

### 3.1 Mailing address
- Status: **PLACEHOLDER**
- Required by: COPPA 16 CFR 312.4(d)(1); Illinois LLC public filing; Copyright Office DMCA agent registration.
- Options:
  - (a) Use Illinois registered-agent address (public record)
  - (b) Use owner's business/home address
  - (c) Rent a PO Box or commercial mail receiving agency (CMRA) address

### 3.2 DMCA designated agent registration
- Status: Agent **identified** (Conrad Steinmeyer, admin@sparkforge-labs.com). **Not yet registered** with U.S. Copyright Office.
- Required by: 17 USC §512(c)(2) for DMCA safe-harbor eligibility (Prompt Lab outputs may trigger IP claims).
- Action: Register at https://www.copyright.gov/dmca-directory/ once mailing address is finalized (designation requires physical address + phone + email). Registration fee: $6. Renews every 3 years.

### 3.3 International user policy
- Status: **UNDECIDED**
- Decision: Does SparkForge accept signups from EU / UK / Canadian / Australian users? If yes, GDPR / UK GDPR / PIPEDA / Privacy Act 1988 compliance layers are needed.
- Recommended for MVP: **Geo-block EU/UK** at the middleware layer until GDPR-K compliance is architected, then re-enable.

### 3.4 Schools / B2B tier
- Status: **NOT OFFERED AT LAUNCH** (pricing page has "For Schools" contact form, but no product). If launched, requires:
  - Separate Schools DPA compliant with FERPA "school official" exception (34 CFR §99.31(a)(1))
  - State-specific student-data agreements (CA AB 1584 at minimum)
  - Re-review of COPPA school-authorization pathway per 2014 FTC/DoE joint guidance
  - **Edmodo lesson (2023 FTC case):** operator retains COPPA responsibility even under school authorization.

### 3.5 COPPA Safe Harbor membership
- Status: **NOT A MEMBER** of any FTC-approved program.
- Options: kidSAFE Seal Program, PRIVO, iKeepSafe, ESRB Privacy Certified, CARU/BBB National Programs, TrustArc.
- Benefit: presumption of compliance; annual audit; faster FTC complaint handling. Cost: annual fees ($2K–$15K depending on program).
- Recommendation: **Defer 6–12 months post-launch**; re-evaluate after real user volume.

### 3.6 Apple App Store / Google Play distribution
- Status: **WEB ONLY at launch.**
- If mobile apps launch, ToS needs acknowledgment that store-channel subscriptions are additionally subject to Apple/Google developer agreements; product needs Kids Category or Designed for Families / Teacher Approved compliance.

---

## 4. Required Attorney Review Matrix

Licensed attorney review required on all items below before production launch:

| Doc / Area | Current state | Research-backed gaps to address in Phase 3/4 |
|---|---|---|
| `/privacy` Privacy Policy | 13 sections; identity-corrected | VPC method disclosure; 2025 COPPA amendments (written security program, purpose-limited retention); state laws (CCPA/CPRA, MD AADC, CA AADC, CO SB 24-041, OR HB 2008, CT CTDPA, TX TDPSA, NY CDPA, VA VCDPA); GDPR-K disclosures; breach-notification commitment; no-conditioning statement; separate VPC for third-party disclosure |
| `/terms` Terms of Service | 14 sections; identity-corrected; Illinois governing law | CA ARL (AB 2863 eff. 2025-07-01): separate affirmative checkbox, click-to-quit, annual reminder, 3-year consent retention, free-to-pay conversion disclosure, material-change notice. ROSCA 15 USC §8403. Arbitration: 30-day opt-out, small-claims carve-out, McGill v. Citibank severability, mass-arbitration protections. Cal. Civ. Code §1668 liability carve-outs. Missing: severability, entire agreement, assignment, force majeure, export-controls, Apple/Google IAP acknowledgment, DMCA agent cross-reference, SCA/PSD2 MIT language for EU. |
| `/privacy/children` (Phase 2) | Not yet created | COPPA direct notice under 16 CFR 312.4(c); child-friendly plain language (reading age ~9–12) |
| `/privacy/rights` (Phase 2) | Not yet created | COPPA 312.6 parental rights — review, delete, refuse further collection, revoke consent; identity-verification workflow |
| `/cookies` (Phase 2) | Not yet created | Persistent-identifier disclosure under COPPA FAQ A.3; CCPA cookie disclosures |
| `/dmca` (Phase 2) | Not yet created | 17 USC §512(c)(3) takedown notice form; designated agent block |

---

## 5. Regulatory Context (as of April 2026)

Reference points the attorney reviewer should verify are current:

- **COPPA 2025 Rule Amendments** — published Federal Register 2025-04-22; full compliance deadline **2026-04-22**. Key changes: separate VPC required for third-party disclosure including targeted advertising; written children's PI security program; purpose-limited retention; mobile phone number recognized as "online contact info" for VPC.
- **FTC Click-to-Cancel Rule** — **VACATED** by 8th Circuit 2025-07-08 (procedural). Enforcement falls back to ROSCA + state auto-renewal laws + FTC Act §5.
- **California ARL (AB 2863)** — effective 2025-07-01. Materially strengthens California's Automatic Renewal Law; applies to any merchant with California customers (near-universal for consumer web products).
- **Maryland AADC (HB 603)** — in force 2024-10-01; DPIA deadline 2026-04-01; covers users under **18**.
- **Student Privacy Pledge** — retired by FPF 2025-04-25; do NOT list as signatory in any SparkForge doc.
- **State comprehensive privacy laws in force 2026** — 20 states (per MultiState tracker): CA, VA, CO, CT, UT, TX, OR, DE, IA, NE, NH, NJ, MN, MD, RI, IN, KY, TN, MT, FL.

---

## 6. Operational Tasks Before Production Launch

- [ ] Finalize and replace every `[MAILING ADDRESS …]` placeholder (see §2)
- [ ] Register DMCA designated agent with U.S. Copyright Office
- [ ] Complete Phase 3 (Privacy content expansion) and Phase 4 (ToS content expansion) from the execution plan
- [ ] Attorney review and sign-off on all `/privacy`, `/terms`, `/privacy/children`, `/privacy/rights`, `/cookies`, `/dmca`
- [ ] Stripe Dashboard: set Privacy Policy URL to `https://sparkforge-labs.com/privacy` and ToS URL to `https://sparkforge-labs.com/terms` in Branding settings
- [ ] Effective-date update (currently 2026-03-30 in both docs) — bump to publication date after attorney review
- [ ] Email the registered parent list if material changes affect existing child data (per Privacy §12 and ToS §13)
- [ ] Verify Sentry `instrumentation.ts` PII scrubbing matches disclosures in Privacy §8
- [ ] Verify Supabase region = US for Privacy §4 accuracy (or update disclosures if EU region is used)
- [ ] Confirm Anthropic account is on Commercial Terms (not Consumer) — required for the no-training commitment in Privacy §4 and ToS §7

---

## 7. Change Log for This File

| Date | Change | Author |
|---|---|---|
| 2026-04-23 | Initial creation (Phase 1 Subtask 1.4) | Claude Code session |
