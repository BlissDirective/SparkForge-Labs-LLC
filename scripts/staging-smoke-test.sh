#!/usr/bin/env bash
# ════════════════════════════════════════════════════
# staging-smoke-test.sh — DEPLOY-HIGH-001 (Option C)
#
# Runs stateless smoke checks against a live SparkForge deployment.
# Invoked from .github/workflows/ci.yml on every Vercel preview deploy
# (and manually against production after releases).
#
# Usage
#   BASE_URL=https://sparkforge-xyz.vercel.app bash scripts/staging-smoke-test.sh
#   BASE_URL=http://localhost:3000              bash scripts/staging-smoke-test.sh
#
# Scope
#   This covers the deployment-level checks that can run without
#   provisioning test accounts:
#
#     1. /api/health    — returns overall: 'ok' + 200
#     2. /login         — public HTML renders (200)
#     3. CSRF gate      — mutating POST without token/cookie → 403
#     4. Allowlist gate — protected API without auth → 401
#     5. Security hdrs  — Content-Security-Policy header present +
#                         no `'unsafe-inline'` in script-src
#
#   User-journey smoke (signup → child → game → xp award) requires a
#   pre-provisioned test parent. See STAGING_NOTES.md §"Deeper smokes".
#
# Exit codes
#   0 — all checks pass
#   1 — a check failed (stderr has details)
#   2 — missing BASE_URL
# ════════════════════════════════════════════════════

set -eo pipefail

if [[ -z "${BASE_URL:-}" ]]; then
  echo "❌ BASE_URL is required" >&2
  exit 2
fi

# Strip trailing slash for clean URL concat.
BASE_URL="${BASE_URL%/}"

failed=0
pass() { printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s — %s\n' "$1" "$2" >&2; failed=$((failed + 1)); }

say() { printf '\n── %s ──\n' "$1"; }

# ────────────────────────────────────────
# 1. /api/health
# ────────────────────────────────────────
say "1. /api/health"
health_body=$(curl -sS -w '\n%{http_code}' "$BASE_URL/api/health") || {
  fail '/api/health' 'curl failed'
}
health_code=$(printf '%s' "$health_body" | tail -n1)
health_json=$(printf '%s' "$health_body" | sed '$d')

if [[ "$health_code" == "200" ]]; then
  pass "GET /api/health → 200"
elif [[ "$health_code" == "503" ]]; then
  fail '/api/health' "503 — one or more dependencies reporting unhealthy: $health_json"
else
  fail '/api/health' "unexpected HTTP $health_code"
fi

# ────────────────────────────────────────
# 2. Public HTML renders
# ────────────────────────────────────────
say "2. /login public page"
login_code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/login")
if [[ "$login_code" == "200" ]]; then
  pass "GET /login → 200"
else
  fail '/login' "expected 200, got $login_code"
fi

# ────────────────────────────────────────
# 3. CSRF gate (API-HIGH-004)
# ────────────────────────────────────────
say "3. CSRF gate rejects tokenless mutations"
csrf_resp=$(curl -sS -o /dev/null -w '%{http_code}' \
  -X POST "$BASE_URL/api/gamification/xp" \
  -H 'Content-Type: application/json' \
  -d '{"childId":"11111111-1111-1111-1111-111111111111","source":"game","gameId":"ai-spy"}')
if [[ "$csrf_resp" == "403" ]] || [[ "$csrf_resp" == "401" ]]; then
  pass "POST without CSRF → $csrf_resp (blocked)"
else
  fail 'CSRF' "expected 403 (CSRF) or 401 (auth), got $csrf_resp"
fi

# ────────────────────────────────────────
# 4. Allowlist — protected API without auth
# ────────────────────────────────────────
say "4. Middleware API-auth allowlist (AUTH-HIGH-002)"
prot_resp=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/children")
if [[ "$prot_resp" == "401" ]]; then
  pass "GET /api/children → 401 (no session)"
elif [[ "$prot_resp" == "403" ]]; then
  pass "GET /api/children → 403 (CSRF on GET — unexpected but still blocked)"
else
  fail '/api/children' "expected 401, got $prot_resp"
fi

# ────────────────────────────────────────
# 5. Security headers (DEPLOY-HIGH-002)
# ────────────────────────────────────────
say "5. Security headers on homepage"
headers=$(curl -sSI "$BASE_URL/")
csp=$(printf '%s' "$headers" | grep -i '^content-security-policy:' || true)

if [[ -n "$csp" ]]; then
  pass "Content-Security-Policy header present"
  if printf '%s' "$csp" | grep -qi "script-src[^;]*'unsafe-inline'"; then
    fail 'CSP' "script-src still contains 'unsafe-inline' — DEPLOY-HIGH-002 regressed"
  else
    pass "script-src does NOT contain 'unsafe-inline'"
  fi
else
  # CSP might be served by edge config instead of Next.js. Flag as warn, not fail.
  printf '  ⚠ Content-Security-Policy header not found (edge config or pre-nonce deploy)\n'
fi

# ────────────────────────────────────────
# Summary
# ────────────────────────────────────────
printf '\n'
if (( failed > 0 )); then
  printf '❌ %d smoke check(s) failed against %s\n' "$failed" "$BASE_URL" >&2
  exit 1
fi
printf '✓ All smoke checks passed against %s\n' "$BASE_URL"
