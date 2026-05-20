#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# sync-env-to-github-secrets.sh
#
# Pulls all environment variables from Vercel (production by
# default) and upserts them as GitHub Actions Secrets on the
# target repository.
#
# Public NEXT_PUBLIC_FF_* feature-flag vars are also pushed as
# GitHub Actions Variables (plaintext) so they're visible in the
# Actions UI without decryption — pass --secrets-only to skip that.
#
# Prereqs (install locally, run from repo root):
#   npm i -g vercel          # Vercel CLI
#   gh auth login            # GitHub CLI — needs 'secrets' scope:
#                            #   gh auth refresh -s secrets
#   vercel link              # link this repo to the Vercel project
#
# Usage:
#   bash scripts/sync-env-to-github-secrets.sh
#   bash scripts/sync-env-to-github-secrets.sh --repo owner/repo
#   bash scripts/sync-env-to-github-secrets.sh --env preview
#   bash scripts/sync-env-to-github-secrets.sh --secrets-only
#   bash scripts/sync-env-to-github-secrets.sh --dry-run
#   bash scripts/sync-env-to-github-secrets.sh --from-file .env.local
# ════════════════════════════════════════════════════════════════

set -euo pipefail

# ── defaults ────────────────────────────────────────────────────
REPO=""            # auto-detected from git remote if empty
VERCEL_ENV="production"
DRY_RUN=0
SECRETS_ONLY=0
FROM_FILE=""       # if set, skip vercel env pull and read this file
TMPFILE=""

# ── vars that Vercel auto-injects — skip them in GitHub ─────────
SKIP_VARS=(
  VERCEL_ENV
  VERCEL_GIT_COMMIT_SHA
  NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  OTEL_EXPORTER_OTLP_ENDPOINT
  NODE_ENV
  NEXT_RUNTIME
  CI
  PORT
  CHROME_EXECUTABLE
  OPENAPI_SOURCE
  SKIP_ENV_VALIDATION
  NEXT_PUBLIC_DEBUG_RENDERER
)

# ── feature-flag vars pushed as GH Variables (not Secrets) ──────
# They are not secrets; keeping them as plaintext Variables lets
# you toggle them in the GitHub Actions UI without a repo admin.
FF_VARS=(
  NEXT_PUBLIC_FF_WELCOME_ACHIEVEMENT
  NEXT_PUBLIC_FF_LEVEL_CEREMONY
  NEXT_PUBLIC_FF_PARENT_DASHBOARD
  NEXT_PUBLIC_FF_CONTENT_AGENT
  NEXT_PUBLIC_FF_OFFLINE_MODE
  NEXT_PUBLIC_FF_OFFSCREEN_RENDER
  NEXT_PUBLIC_FF_OFFSCREEN_RENDER_TELEMETRY
  NEXT_PUBLIC_FF_OFFSCREEN_RENDER_AUTOQUALITY
  NEXT_PUBLIC_FF_PASSKEY_AUTH
  NEXT_PUBLIC_FF_SIGNED_DEMO_TOKENS
  NEXT_PUBLIC_FF_COMMAND_PALETTE
  NEXT_PUBLIC_FF_PRORATION_PREVIEW
  NEXT_PUBLIC_FF_OPTIMISTIC_OFFLINE_CACHE
  NEXT_PUBLIC_FF_MFA_TOTP
  NEXT_PUBLIC_FF_BATCHED_COCKPIT
)

# ── arg parsing ──────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)         REPO="$2"; shift 2 ;;
    --env)          VERCEL_ENV="$2"; shift 2 ;;
    --dry-run)      DRY_RUN=1; shift ;;
    --secrets-only) SECRETS_ONLY=1; shift ;;
    --from-file)    FROM_FILE="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,35p' "$0"
      exit 0
      ;;
    *) echo "Unknown flag: $1  (try --help)"; exit 2 ;;
  esac
done

# ── helpers ──────────────────────────────────────────────────────
die() { echo "❌ $*" >&2; exit 1; }

in_array() {
  local needle="$1"; shift
  local item
  for item in "$@"; do [[ "$item" == "$needle" ]] && return 0; done
  return 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "'$1' not found. $2"
}

cleanup() { [[ -n "$TMPFILE" && -f "$TMPFILE" ]] && rm -f "$TMPFILE"; }
trap cleanup EXIT

# ── preflight ────────────────────────────────────────────────────
require_cmd gh    "Install GitHub CLI: https://cli.github.com, then: gh auth login && gh auth refresh -s secrets"

if [[ -z "$FROM_FILE" ]]; then
  require_cmd vercel "Install Vercel CLI: npm i -g vercel, then: vercel login && vercel link"
  [[ -d ".vercel" ]] || die "Repo not linked to Vercel. Run: vercel link"
fi

# Auto-detect GitHub repo from git remote
if [[ -z "$REPO" ]]; then
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
  if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+/[^/.]+)(\.git)?$ ]]; then
    REPO="${BASH_REMATCH[1]}"
  else
    die "Could not auto-detect GitHub repo from origin remote. Pass --repo owner/repo"
  fi
fi

echo "════════════════════════════════════════════════════"
echo "  SparkForge  ›  Vercel → GitHub Secrets sync"
echo "════════════════════════════════════════════════════"
echo "  Vercel env : $VERCEL_ENV"
echo "  GitHub repo: $REPO"
echo "  Dry run    : $([[ $DRY_RUN -eq 1 ]] && echo yes || echo no)"
echo "  FF as vars : $([[ $SECRETS_ONLY -eq 1 ]] && echo no || echo yes)"
echo ""

# ── pull env from Vercel ─────────────────────────────────────────
if [[ -n "$FROM_FILE" ]]; then
  [[ -f "$FROM_FILE" ]] || die "File not found: $FROM_FILE"
  ENV_FILE="$FROM_FILE"
  echo "📂  Reading from: $FROM_FILE"
else
  TMPFILE=$(mktemp /tmp/sparkforge-env-XXXXXX)
  ENV_FILE="$TMPFILE"
  echo "⬇️   Pulling env vars from Vercel ($VERCEL_ENV)…"
  vercel env pull --environment "$VERCEL_ENV" --yes "$TMPFILE" >/dev/null 2>&1 \
    || die "vercel env pull failed. Check: vercel whoami && vercel link"
  echo "    ✓ pulled"
fi

echo ""

# ── parse and sync ───────────────────────────────────────────────
secrets_pushed=0
secrets_skipped=0
vars_pushed=0
vars_skipped=0
skipped_auto=0
failed=0

while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
  line="${raw_line%$'\r'}"
  [[ -z "${line// }"      ]] && continue
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" != *=* ]] && continue

  key="${line%%=*}"
  val="${line#*=}"
  key="${key#"${key%%[![:space:]]*}"}"
  key="${key%"${key##*[![:space:]]}"}"
  # strip surrounding quotes
  if [[ "$val" =~ ^\"(.*)\"$ ]]; then val="${BASH_REMATCH[1]}"; fi
  if [[ "$val" =~ ^\'(.*)\'$ ]]; then val="${BASH_REMATCH[1]}"; fi
  # skip empty values
  [[ -z "$val" ]] && continue

  # skip auto-injected / system vars
  if in_array "$key" "${SKIP_VARS[@]}"; then
    echo "  ⏭   $key  (Vercel auto-injected — skipping)"
    skipped_auto=$((skipped_auto+1))
    continue
  fi

  # decide: GitHub Variable (FF flags) or GitHub Secret
  is_ff=0
  if [[ $SECRETS_ONLY -eq 0 ]] && in_array "$key" "${FF_VARS[@]}"; then
    is_ff=1
  fi

  if [[ $is_ff -eq 1 ]]; then
    # GitHub Actions Variable (plaintext)
    if [[ $DRY_RUN -eq 1 ]]; then
      echo "  +   $key  (would set as GitHub Variable)"
      vars_pushed=$((vars_pushed+1))
    else
      if printf '%s' "$val" | gh variable set "$key" --body "$val" --repo "$REPO" 2>/dev/null; then
        echo "  ✓   $key  (Variable)"
        vars_pushed=$((vars_pushed+1))
      else
        echo "  ✗   $key  (variable set failed)"
        failed=$((failed+1))
      fi
    fi
  else
    # GitHub Actions Secret (encrypted)
    if [[ $DRY_RUN -eq 1 ]]; then
      echo "  +   $key  (would set as GitHub Secret)"
      secrets_pushed=$((secrets_pushed+1))
    else
      if printf '%s' "$val" | gh secret set "$key" --body "$val" --repo "$REPO" 2>/dev/null; then
        echo "  ✓   $key  (Secret)"
        secrets_pushed=$((secrets_pushed+1))
      else
        echo "  ✗   $key  (secret set failed)"
        failed=$((failed+1))
      fi
    fi
  fi

done < "$ENV_FILE"

echo ""
echo "════════════════════════════════════════════════════"
echo "  Summary"
echo "════════════════════════════════════════════════════"
echo "  Secrets set   : $secrets_pushed"
echo "  Variables set : $vars_pushed"
echo "  Auto-skipped  : $skipped_auto  (Vercel-injected vars)"
echo "  Failed        : $failed"
[[ $DRY_RUN -eq 1 ]] && echo ""  && echo "  (dry-run — nothing was written)"
echo ""

if [[ $failed -gt 0 ]]; then
  echo "⚠️  Some entries failed. Common causes:"
  echo "    • gh CLI missing 'secrets' scope → gh auth refresh -s secrets"
  echo "    • Not a repo admin"
  exit 1
fi

echo "✅  Sync complete. Secrets are now available in GitHub Actions."
echo "    View at: https://github.com/$REPO/settings/secrets/actions"
