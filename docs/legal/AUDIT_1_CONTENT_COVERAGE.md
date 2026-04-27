# AUDIT 1 — Content Coverage (Code ↔ Legal Documents)

> **Purpose:** Verify that every data category the SparkForge codebase actually
> collects, and every third-party service it actually uses, is disclosed in the
> Privacy Policy and Terms of Service. Flag any mismatch for attorney review or
> follow-up doc changes.

**Auditor:** Claude Code (automated grep + manual cross-reference)
**Date:** 2026-04-23
**Branch:** `claude/stripe-integration-setup-Oi9wZ`
**Commit at audit:** `b6b1300`

---

## Methodology

1. Enumerated every Supabase table from `sql/*.sql` (excluding `_ARCHIVED` and
   `ci-auth-stubs.sql`).
2. Scanned `package.json` and `src/lib/**` for third-party SDK clients.
3. Cross-referenced each finding against:
   - Privacy §2 (information we collect)
   - Privacy §4 (third-party services)
   - ToS §4 (subscription mechanics)
4. Ran `grep` for stale domain / entity references (`sparkforge.app`, `sparkforge.ai`, `BlissDirective`) across the whole app.

---

## Results

### ✓ Covered (no action needed)

| Data category | Code source | Privacy Policy section |
|---|---|---|
| Parent email, password hash | Supabase `auth.users` | §2a |
| COPPA consent timestamp | `parents.coppa_consent_at` | §2a, §5 |
| Subscription tier/status/customer/sub ID | `parents.subscription_*`, `stripe_*_id` | §2a, §3, §4 (Stripe) |
| Child display name, age band, avatar, prefs | `children` table | §2b |
| Game progress, XP, level, badges, streak | `children.*`, `progress`, `child_badges` | §2c |
| Session duration | `sessions` table | §2c, §7 retention |
| Prompt Lab prompts + responses (daily purge) | `prompt_history` | §2c, §4 (Anthropic), §7 |
| Stripe subscription events (admin-only) | `subscription_events`, `subscription_events_detail` | §4 (Stripe), §8a |
| Sentry error data, scrubbed | instrumentation.ts `beforeSend` | §4 (Sentry) |
| Third parties: Supabase, Stripe, Anthropic, Vercel, Sentry | imports + SDK clients | §4 (all five disclosed) |

### ✗ Gaps identified

| # | Finding | Code source | Why it matters |
|---|---|---|---|
| **G1** | **Resend is undisclosed** in Privacy §4 sub-processor list | `src/lib/email-templates/*` plus the cron jobs that send transactional email | Resend receives parent email addresses (PI). Disclosure is required under COPPA 16 CFR 312.4(d)(2) and CCPA service-provider transparency rules. Resend is mentioned in ToS §15d force-majeure list but not in Privacy §4. |
| **G2** | **Upstash Redis is undisclosed** | `src/lib/rate-limit.ts` using `@upstash/ratelimit` + `@upstash/redis` | Upstash stores rate-limit counters keyed by IP address. IP addresses are persistent identifiers and therefore PI under COPPA FAQ A.3. Disclosure required. |
| **G3** | **Passkey credentials + MFA backup codes not disclosed** in Privacy §2 | `sql/020_passkey_credentials.sql`, `sql/023_mfa_backup_codes.sql` | Passkey public keys and MFA backup codes are authentication data held about the parent. Not children's PI, but still should be disclosed in §2a parent account info for completeness and state-law (CCPA, CO, VA) transparency. |
| **G4** | **Auth events / audit log (IP, user-agent on security events) not explicitly disclosed** | `sql/022_auth_events.sql`, `sql/014_audit_log.sql` | Login attempts, MFA challenges, admin actions are stored with IP + user-agent. Partially covered by Privacy §9 (Supabase auth cookies) and §4 (Vercel HTTP logs), but not named as a distinct dataset. |
| **G5** | **Privacy §4 Sentry entry says "beforeSend PII scrubbing ... strips all child-related fields"** — verify scrubber still matches the CHILD_PII_KEYS list in `instrumentation.ts` | `instrumentation.ts` | Runtime check; if the list has drifted, the disclosure over-promises. Confirm before production launch. |

### Stale-reference check

Grep for `sparkforge.app`, `sparkforge.ai`, `BlissDirective` across the app:

```
$ grep -rE "(BlissDirective|sparkforge\.app|sparkforge\.ai)" src/ 2>/dev/null | head
(no results within src/)
```

All in-app references normalized by Phase 1. Historical docs in `docs/` may
retain old names — that is acceptable and intentional (they are superseded
reference material).

---

## Severity assessment

| # | Severity | Rationale |
|---|---|---|
| G1 Resend | **HIGH** | COPPA §312.4(d)(2) requires disclosure of third-party recipients of child/parent PI; Resend handles parent email, which is in the operator's custody and subject to COPPA for parents of under-13 users. |
| G2 Upstash | **MEDIUM–HIGH** | IP addresses are PI under COPPA FAQ A.3. Disclosure is required even though the purpose (rate limiting) fits the "support for internal operations" exception. |
| G3 Passkey / MFA | **LOW–MEDIUM** | Adult account data; adds CCPA/CPRA right-of-access surface area. Not a COPPA violation. |
| G4 Auth events / audit log | **LOW** | Indirectly covered by existing §9 and §4 disclosures; explicit listing improves accuracy. |
| G5 Sentry scrubber drift | **LOW** (runtime verification task) | Only problematic if the code has drifted from the disclosure. |

---

## Recommended remediation (for user decision)

Each gap maps to a small Phase 3-style Privacy Policy edit. See chat for
selectable options.
