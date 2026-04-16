# SparkForge Final Pre-Release Audit

**Version:** 1.0 | **Date:** April 15, 2026 | **Auditor:** Claude Code (Opus 4.6)
**Scope:** Full-stack security, performance, UX, database, payments, deployment, state management
**Codebase:** ~500 source files | 35 games | 15 stores | 35+ API routes | 9 SQL tables | 172 3D components
**Branch:** `claude/sparkforge-final-audit-ftjfL`

---

## TABLE OF CONTENTS

1. [Executive Summary & Methodology](#1-executive-summary--methodology)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Database & SQL Security](#3-database--sql-security)
4. [Payment Processing (Stripe)](#4-payment-processing-stripe)
5. [API Security & Input Validation](#5-api-security--input-validation)
6. [UI/UX, Design & Interactivity](#6-uiux-design--interactivity)
7. [Performance & 3D Rendering](#7-performance--3d-rendering)
8. [Deployment, Infrastructure & DevOps](#8-deployment-infrastructure--devops)
9. [State Management & Data Flow](#9-state-management--data-flow)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. EXECUTIVE SUMMARY & METHODOLOGY

### 1.1 Audit Objective

This is the **final pre-release audit** of SparkForge, the gamified AI learning platform for children ages 7-16. The goal is to identify every remaining bug, security vulnerability, and UX gap before production launch. Each finding includes **2-4 selectable solution options** for the implementation phase.

### 1.2 Audit Results Summary

| Section | Critical | High | Medium | Low | Enhancements |
|---------|----------|------|--------|-----|-------------|
| 2. Auth & Authorization | 3 | 4 | 3 | 2 | 7 |
| 3. Database & SQL | 2 | 3 | 4 | 2 | 6 |
| 4. Payment Processing | 1 | 3 | 3 | 1 | 5 |
| 5. API Security | 2 | 4 | 3 | 2 | 6 |
| 6. UI/UX & Design | 1 | 5 | 6 | 3 | 10 |
| 7. Performance & 3D | 2 | 3 | 4 | 2 | 8 |
| 8. Deployment & DevOps | 1 | 3 | 3 | 2 | 5 |
| 9. State Management | 1 | 3 | 3 | 1 | 5 |
| **TOTALS** | **13** | **28** | **29** | **15** | **52** |

**Total Findings: 85 bugs + 52 enhancements = 137 items**

### 1.3 Methodology

**Direct Code Review:** Every API route handler, middleware, store, and security-critical path was read and analyzed line-by-line. SQL schema, RLS policies, and migration files were cross-referenced against runtime code.

**Cross-Reference Against Prior Audits:** Existing findings from `AUDIT_REPORT.md` (March 24), `CODE_AUDIT_SUMMARY_MATRIX_20260315.md`, `SparkForge-Design-UI-UX-Audit.md` (April 14), game content audits (April 6-10), and `AUDIT_REPORT_03.29.2026.md` were reviewed. **No findings below duplicate prior audits** — only net-new issues and issues that were flagged but never resolved are included.

**OWASP Top 10:2025 Compliance Check:** All API routes audited against OWASP A01-A10:2025 categories (Broken Access Control, Security Misconfiguration, Injection, Insecure Design, Data Exposure, Authentication Failures, Integrity Failures, Logging Failures, Deserialization, Exceptional Conditions).

### 1.4 Reference Sources Per Section

Each section draws on curated knowledge from top-tier open-source projects and industry standards:

| Section | Reference Sources |
|---------|------------------|
| **Auth** | [Supabase Auth](https://github.com/supabase/auth) (21k stars), [NextAuth.js](https://github.com/nextauthjs/next-auth) (25k stars), [Clerk Next.js](https://github.com/clerk/clerk-nextjs), OWASP Authentication Cheat Sheet, Next.js Security Advisory CVE-2025-29927 |
| **Database** | [pgdsat](https://github.com/HexaCluster/pgdsat) (PostgreSQL Security Assessment), [Supabase](https://github.com/supabase/supabase) (75k stars), Percona PostgreSQL Security Best Practices, Bytebase Postgres Security Guide |
| **Payments** | [Stripe Samples](https://github.com/stripe-samples) (official, 36 repos), [Next.js SaaS Starter](https://github.com/nextjs/saas-starter), Stripe Security Best Practices 2026, PCI DSS 4.0 compliance |
| **API Security** | [OWASP Top 10:2025](https://owasp.org/Top10/) (global standard), [Zod](https://github.com/colinhacks/zod) (35k stars), Next.js Data Security Guide, AccuKnox API Security Checklist 2026 |
| **UI/UX** | [shadcn/ui](https://github.com/shadcn-ui/ui) (80k stars), [Radix UI](https://github.com/radix-ui/primitives) (16k stars), [Ariakit](https://github.com/ariakit/ariakit), WCAG 2.2 AA/AAA, Apple HIG, Material Design 3 |
| **Performance** | [Three.js](https://github.com/mrdoob/three.js) (103k stars), [React Three Fiber](https://github.com/pmndrs/react-three-fiber) (28k stars), Three.js 100 Performance Tips (2026), Web Vitals standards |
| **Deployment** | [Next.js](https://github.com/vercel/next.js) (130k stars), [Gitleaks](https://github.com/gitleaks/gitleaks) (18k stars), Vercel Security Best Practices, Next.js Security Advisories March 2026 |
| **State Mgmt** | [Zustand](https://github.com/pmndrs/zustand) (50k stars), [Jotai](https://github.com/pmndrs/jotai) (19k stars), [TanStack Query](https://github.com/TanStack/query) (44k stars), Zustand 2026 Performance Patterns |

### 1.5 Severity Definitions

| Level | Definition | Action Required |
|-------|-----------|----------------|
| **Critical** | Runtime crash, security vulnerability, data loss/exposure, auth bypass | Fix before launch |
| **High** | Significant functional/UX degradation, broken user flows, compliance gap | Fix before launch |
| **Medium** | Polish gaps, edge-case failures, performance concerns, partial implementations | Fix in first patch |
| **Low** | Tech debt, minor improvements, future-proofing | Backlog |

### 1.6 Solution Options Format

Each finding provides **2-4 selectable options** for the user to choose during implementation:

```
Option A: [Quick fix — minimal changes, fastest to implement]
Option B: [Standard fix — balanced approach, recommended]
Option C: [Comprehensive fix — most robust, highest effort]
Option D: [Alternative approach — different architecture/strategy]
```

---

## 2. AUTHENTICATION & AUTHORIZATION

### Reference Sources
- [Supabase Auth](https://github.com/supabase/auth) (21k stars) — JWT-based auth server powering Supabase
- [NextAuth.js / Auth.js](https://github.com/nextauthjs/next-auth) (25k stars) — Framework-agnostic auth
- [Clerk + Supabase](https://github.com/clerk/clerk-supabase-nextjs) — RLS integration patterns
- OWASP Authentication Cheat Sheet 2025
- Next.js CVE-2025-29927 (middleware bypass via `x-middleware-subrequest`)

### 2a. Bugs & Findings

---

#### AUTH-CRIT-001: Login API Returns Access Token in Response Body

**Severity:** CRITICAL | **File:** `src/app/api/auth/login/route.ts:27-30`
**OWASP:** A07:2025 — Authentication Failures

**Issue:** The login endpoint returns `session.accessToken` directly in the JSON response body. This exposes the JWT to any JavaScript running on the page (XSS vector). Supabase SSR already manages sessions via httpOnly cookies — the API should not additionally return the token in the body.

```typescript
// Current code (line 27-30):
return apiSuccess({
  user: { id: data.user.id, email: data.user.email },
  session: { accessToken: data.session.access_token }, // EXPOSED
});
```

**Impact:** If any XSS vulnerability exists (third-party script, browser extension, future dependency compromise), the attacker can steal the access token from the response and impersonate the user.

**Options:**
- **Option A (Quick):** Remove `session` from response, return only `{ user: { id, email }, authenticated: true }`. Client uses Supabase SSR cookie for subsequent requests.
- **Option B (Recommended):** Remove token from body AND set explicit `httpOnly` + `Secure` + `SameSite=Lax` cookie attributes on the Supabase session cookie in the response.
- **Option C (Comprehensive):** Option B + add token rotation — issue short-lived access tokens (5 min) with refresh token in httpOnly cookie, matching Supabase's built-in PKCE flow.

---

#### AUTH-CRIT-002: Demo Session Cookie Grants Full Dashboard Access Without Any Authentication

**Severity:** CRITICAL | **File:** `src/middleware.ts:52-54`, `src/app/api/auth/demo/route.ts`
**OWASP:** A01:2025 — Broken Access Control

**Issue:** The middleware checks `request.cookies.get('sparkforge-demo-active')?.value === '1'` and if true, bypasses the entire auth check. This cookie is httpOnly but its value is a trivially guessable static string `'1'`. An attacker can set this cookie manually via a browser extension or intercepting proxy and gain full dashboard access — including any API route that doesn't independently verify auth (e.g., content browsing, game data).

Additionally, the demo route's rate limit (3/hr/IP) uses in-memory storage that resets on every serverless cold start, making it ineffective on Vercel.

```typescript
// middleware.ts line 52-54:
const isDemoSession = request.cookies.get('sparkforge-demo-active')?.value === '1';
if (!user && !isDemoSession && !isPublic && !isAPI && !isStatic && !isAsset) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

**Impact:** Any user can bypass authentication entirely by setting a single cookie. Demo users can access dashboard routes that may expose other users' data if API routes don't independently verify auth.

**Options:**
- **Option A (Quick):** Replace static `'1'` value with a signed HMAC token: `hmac(demoId + expiresAt, DEMO_SECRET)`. Middleware validates the signature before granting access.
- **Option B (Recommended):** Create a real Supabase anonymous session for demo users via `supabase.auth.signInAnonymously()`. This gives them a proper JWT that's scoped and time-limited, and all API routes' `requireAuth()` checks work naturally.
- **Option C (Comprehensive):** Option B + create a dedicated `demo` role in RLS policies that has read-only access to published content and zero access to parent/child data. Demo users get their own isolated sandbox.

---

#### AUTH-CRIT-003: Auth Callback Open Redirect via `next` Query Parameter

**Severity:** CRITICAL | **File:** `src/app/api/auth/callback/route.ts:9,15`
**OWASP:** A01:2025 — Broken Access Control

**Issue:** The callback route reads `const next = searchParams.get('next') ?? '/home'` and redirects to `${origin}${next}`. While `origin` is derived from `req.url`, the `next` parameter is not validated. An attacker can craft a callback URL like `/api/auth/callback?code=VALID&next=//evil.com` or `next=/%2F%2Fevil.com` which some browsers resolve as an absolute URL, enabling phishing via redirect after login.

```typescript
// Current (line 9, 15):
const next = searchParams.get('next') ?? '/home';
return NextResponse.redirect(`${origin}${next}`);
```

**Impact:** After a legitimate login, users can be redirected to a malicious site that mimics SparkForge to steal credentials or session tokens.

**Options:**
- **Option A (Quick):** Validate `next` starts with `/` and does not contain `//`: `if (!next.startsWith('/') || next.startsWith('//')) next = '/home';`
- **Option B (Recommended):** Maintain an allowlist of valid redirect paths: `['/home', '/labs', '/arcade', '/profile', '/settings', '/parent']`. Reject anything not in the list.
- **Option C (Comprehensive):** Use Next.js `redirect()` with `RedirectType.replace` and validate against a regex pattern that only allows internal relative paths: `/^\/[a-zA-Z0-9\-\/]*$/`.

---

#### AUTH-HIGH-001: Placeholder Credentials in Supabase Server Client

**Severity:** HIGH | **File:** `src/lib/supabase/server.ts:6-7,32`
**OWASP:** A05:2025 — Security Misconfiguration

**Issue:** The server client falls back to `'https://placeholder.supabase.co'` and `'placeholder-key'` when env vars are missing. The admin client falls back to `'placeholder-service-key'`. These placeholders create a Supabase client that will make real HTTP requests to `placeholder.supabase.co` — a domain that could be registered by an attacker to intercept credentials and data.

```typescript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
```

**Impact:** If deployed without env vars (accidental misconfiguration), all database queries and auth calls go to a potentially attacker-controlled domain.

**Options:**
- **Option A (Quick):** Change fallbacks to empty strings and add a runtime guard: `if (!SUPABASE_URL) throw new Error('SUPABASE_URL not configured')`.
- **Option B (Recommended):** Use `'http://localhost:0'` as fallback (guaranteed to fail fast with connection refused) and log a clear error. Build-time static generation still succeeds because the client is never called during build.
- **Option C (Comprehensive):** Remove all fallbacks. Use a build-time env check in `next.config.ts` that warns but doesn't fail, and a runtime check in `createServerSupabase`/`createAdminClient` that throws immediately.

---

#### AUTH-HIGH-002: Middleware Allows ALL API Routes Through Without Auth

**Severity:** HIGH | **File:** `src/middleware.ts:47,54`
**OWASP:** A01:2025 — Broken Access Control

**Issue:** The middleware check `const isAPI = request.nextUrl.pathname.startsWith('/api')` allows ALL API routes through without auth. This means the middleware provides zero protection for API endpoints — auth is solely enforced by each route handler's `requireAuth()` call. If any route handler forgets to call `requireAuth()`, it's completely unprotected.

**Impact:** Defense-in-depth violation. Any new API route added without `requireAuth()` is silently exposed. The health endpoint already demonstrates this — it uses `createAdminClient()` without auth.

**Options:**
- **Option A (Quick):** Add a comment-level audit marker and grep script that checks all route files for `requireAuth` or `requireAdmin` calls. Run in CI.
- **Option B (Recommended):** Remove the blanket `/api` bypass. Instead, define public API paths explicitly: `/api/health`, `/api/auth/login`, `/api/auth/signup`, `/api/auth/callback`, `/api/auth/demo`, `/api/stripe/webhook`. All other `/api/*` routes require auth at the middleware level.
- **Option C (Comprehensive):** Create an API middleware wrapper (`withAuth`) that wraps all route handlers by default. Routes that need to be public use `withPublic` explicitly. This inverts the default from "open" to "closed".

---

#### AUTH-HIGH-003: In-Memory Rate Limiter Ineffective on Serverless

**Severity:** HIGH | **File:** `src/lib/rate-limit.ts:12-21`
**OWASP:** A07:2025 — Authentication Failures

**Issue:** The rate limiter uses `new Map()` stored in module-level memory. On Vercel (serverless), each function invocation may run in a different isolate with its own memory. The rate limit `Map` is not shared across instances, so an attacker can bypass rate limits by simply making requests fast enough to hit different serverless instances.

The cleanup `setInterval` (line 15-21) also leaks in serverless — it keeps the process alive and may not fire reliably.

**Impact:** Auth rate limiting (5/min) is effectively unenforced in production. An attacker can brute-force login credentials without meaningful throttling.

**Options:**
- **Option A (Quick):** Use Vercel KV (Redis-compatible) with `@upstash/ratelimit`: ~10 lines of code, persistent across all instances, sliding window algorithm.
- **Option B (Recommended):** Use `@upstash/ratelimit` with Upstash Redis. Supports sliding window, fixed window, and token bucket algorithms. Free tier handles 10K requests/day. Add as middleware helper.
- **Option C (Comprehensive):** Option B + add progressive penalties: after 5 failed login attempts, increase lockout window exponentially (1min, 5min, 15min, 1hr). Store lockout state in Redis.
- **Option D (Alternative):** Use Vercel's built-in WAF rate limiting (available on Pro plan) at the edge layer, before the function even runs.

---

#### AUTH-HIGH-004: Signup Uses Admin Client to Create User — Bypasses Email Verification

**Severity:** HIGH | **File:** `src/app/api/auth/signup/route.ts:22-26`
**OWASP:** A07:2025 — Authentication Failures

**Issue:** Signup uses `supabase.auth.admin.createUser({ email_confirm: false })` which creates the user via the admin API without requiring email verification. The subsequent `generateLink()` call (line 49) sends a confirmation email, but the user can already log in before confirming because the account exists in Supabase Auth.

```typescript
const { data: authData } = await supabase.auth.admin.createUser({
  email, password, email_confirm: false,  // User can log in immediately
});
```

**Impact:** Anyone can create accounts with emails they don't own. This enables account enumeration, spam signups, and potential abuse of the platform by creating accounts with others' emails.

**Options:**
- **Option A (Quick):** Change to `email_confirm: true` — Supabase won't allow login until the email is verified. Update the client to show "Check your email" screen.
- **Option B (Recommended):** Switch from admin API to `supabase.auth.signUp()` (user-facing). This uses Supabase's built-in email confirmation flow, handles duplicate detection, and doesn't require the service role key on the signup path.
- **Option C (Comprehensive):** Option B + add a `parents.email_verified_at` column that gets set by the callback handler. Show a "verify email" banner in the dashboard until confirmed. Restrict access to paid features until verified.

---

#### AUTH-MED-001: Password Validation Missing Special Character Requirement

**Severity:** MEDIUM | **File:** `src/lib/validations.ts:7-13`

**Issue:** The `SignupSchema` enforces uppercase, lowercase, and number but no special character. OWASP 2025 recommends minimum 8 chars with complexity OR minimum 12 chars without. Current policy is adequate but leaves room for weak passwords like `Password1`.

**Options:**
- **Option A (Keep current):** 8+ chars with upper/lower/number is acceptable per NIST 800-63B.
- **Option B (Recommended):** Add special character requirement: `.regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain a special character')`. Update UI password strength indicator.
- **Option C (Alternative):** Switch to length-based: minimum 12 characters, no complexity requirements. Add a password strength meter (zxcvbn library) for UX guidance.

---

#### AUTH-MED-002: COPPA Consent Not Enforced at Access Level

**Severity:** MEDIUM | **File:** `src/app/api/auth/consent/route.ts`, `src/middleware.ts`

**Issue:** COPPA consent is recorded in the `parents.coppa_consent_at` column, but there's no enforcement check — a parent who signs up but never completes COPPA consent (Step 3) can still create child profiles and let children use the platform. The middleware doesn't check consent status, and the children API doesn't verify consent before allowing child creation.

**Impact:** Potential COPPA compliance violation if children under 13 use the platform without verified parental consent.

**Options:**
- **Option A (Quick):** Add a consent check in `POST /api/children`: `if (!parent.coppa_consent_at) return apiError('Parental consent required', 403)`.
- **Option B (Recommended):** Add a consent check to `requireAuth()` in api-helpers that returns a special error code `CONSENT_REQUIRED` for non-consented parents. Client-side interceptor redirects to consent step.
- **Option C (Comprehensive):** Option B + add a middleware-level check that redirects non-consented parents to `/onboarding/consent` for any dashboard route.

---

#### AUTH-MED-003: No Account Lockout After Failed Login Attempts

**Severity:** MEDIUM | **File:** `src/app/api/auth/login/route.ts`

**Issue:** The login endpoint has rate limiting (5/min) but no account lockout. An attacker can try 5 passwords per minute continuously — that's 7,200 attempts per day. With the in-memory rate limiter being ineffective on serverless (AUTH-HIGH-003), there's effectively no limit.

**Options:**
- **Option A (Quick):** Track failed attempts per email in the rate limiter. After 10 consecutive failures, lock the account for 30 minutes.
- **Option B (Recommended):** Use Supabase Auth's built-in `SECURITY_CAPTCHA` setting to add a CAPTCHA after 3 failed attempts. Requires Supabase dashboard config.
- **Option C (Comprehensive):** Implement progressive delays: 1st-3rd attempt instant, 4th-5th 5s delay, 6th-10th 30s delay, 11th+ account locked for 1hr. Notify account owner via email after 5 failures.

---

#### AUTH-LOW-001: Demo Session ID Uses `Math.random()` — Not Cryptographically Secure

**Severity:** LOW | **File:** `src/app/api/auth/demo/route.ts:14`

**Issue:** `Math.random().toString(36).slice(2, 9)` is predictable. While demo sessions don't access real data, the ID could be guessed for session hijacking if demo sessions gain more capabilities.

**Options:**
- **Option A (Quick):** Use `crypto.randomUUID()` instead.
- **Option B (Recommended):** Use `crypto.getRandomValues()` for a 128-bit random ID: `Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex')`.

---

#### AUTH-LOW-002: Logout Doesn't Invalidate Server-Side Session

**Severity:** LOW | **File:** `src/app/api/auth/logout/route.ts`

**Issue:** Logout calls `supabase.auth.signOut()` which clears the local session cookie, but if an attacker has already captured the JWT (via AUTH-CRIT-001), they can continue using it until it expires. Supabase JWTs typically have a 1-hour expiry.

**Options:**
- **Option A (Current is acceptable):** JWT expiry handles this. Document that tokens are valid for up to 1 hour post-logout.
- **Option B (Recommended):** Call `supabase.auth.admin.signOut(userId, 'global')` from the server to invalidate all sessions for the user, not just the current one.

---
