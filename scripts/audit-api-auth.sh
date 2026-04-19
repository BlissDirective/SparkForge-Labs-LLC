#!/usr/bin/env bash
# ════════════════════════════════════════════════════
# audit-api-auth.sh — AUTH-HIGH-002 defense-in-depth check
#
# Walks every src/app/api/**/route.ts and asserts that one of the
# following is true for each file:
#
#   1. The route's path is explicitly listed below as PUBLIC_ALLOWLIST
#      (matches the allowlist in src/middleware.ts).
#   2. The file contains `requireAuth` or `requireAdmin` (Supabase
#      session / admin-role enforcement via api-helpers).
#   3. The file verifies a webhook signature via Stripe's
#      `constructEvent` (the Stripe webhook is signed, not authed).
#
# Exits non-zero on any uncategorized route. Run locally with:
#
#   bash scripts/audit-api-auth.sh
#
# Also executed in .github/workflows/ci.yml.
# ════════════════════════════════════════════════════

set -euo pipefail

# Paths must mirror src/middleware.ts PUBLIC_API_PATHS + CRON_API_PATHS.
# Listed relative to src/app, so route.ts at src/app/api/foo/bar/route.ts
# maps to the key "api/foo/bar".
PUBLIC_ALLOWLIST=(
  "api/auth/callback"
  "api/auth/login"
  "api/auth/logout"
  "api/auth/signup"
  "api/auth/demo"
  "api/health"
  "api/stripe/webhook"
  "api/cron/trial-reminders"
  "api/agent/schedule"
  "api/agent/trending"
)

is_in_allowlist() {
  local key="$1"
  for entry in "${PUBLIC_ALLOWLIST[@]}"; do
    if [[ "$key" == "$entry" ]]; then
      return 0
    fi
  done
  return 1
}

missing=()

while IFS= read -r -d '' file; do
  # "src/app/api/foo/bar/route.ts" → "api/foo/bar"
  rel="${file#src/app/}"
  rel="${rel%/route.ts}"

  if is_in_allowlist "$rel"; then
    continue
  fi

  # Accepted auth patterns:
  #   - requireAuth / requireAdmin    → centralized helpers
  #   - supabase.auth.getUser()       → direct Supabase session check
  #   - constructEvent                → Stripe webhook signature verify
  if grep -qE 'requireAuth|requireAdmin|auth\.getUser\(|constructEvent' "$file"; then
    continue
  fi

  missing+=("$file")
done < <(find src/app/api -type f -name 'route.ts' -print0 | sort -z)

if (( ${#missing[@]} > 0 )); then
  printf '\n❌ Unprotected API routes detected:\n'
  for m in "${missing[@]}"; do
    printf '   - %s\n' "$m"
  done
  printf '\nEach route.ts must either:\n'
  printf '  1. Be listed in PUBLIC_ALLOWLIST in this script AND in\n'
  printf '     PUBLIC_API_PATHS/CRON_API_PATHS in src/middleware.ts, OR\n'
  printf '  2. Contain requireAuth/requireAdmin (api-helpers), OR\n'
  printf '  3. Verify a webhook signature (Stripe constructEvent).\n\n'
  exit 1
fi

printf '✓ All %d API routes enforce auth or are on the allowlist.\n' \
  "$(find src/app/api -type f -name 'route.ts' | wc -l)"
