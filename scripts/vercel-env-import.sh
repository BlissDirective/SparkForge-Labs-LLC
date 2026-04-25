#!/usr/bin/env bash
# ════════════════════════════════════════════════════
# vercel-env-import.sh
# Bulk-imports environment variables from .env.local
# (or any --file path) into a Vercel project, scoped to
# the chosen target (production / preview / development).
#
# Refuses to push obvious placeholder values from
# .env.example so dev sentinels can't ship to prod.
#
# Prereqs:
#   1) npm i -g vercel  (or use npx)
#   2) vercel login
#   3) vercel link  (run from repo root, picks the project)
#
# Usage:
#   bash scripts/vercel-env-import.sh
#   bash scripts/vercel-env-import.sh --file .env.production --target production
#   bash scripts/vercel-env-import.sh --target preview
#   bash scripts/vercel-env-import.sh --overwrite
#   bash scripts/vercel-env-import.sh --dry-run
# ════════════════════════════════════════════════════

set -euo pipefail

FILE=".env.local"
TARGET="production"
OVERWRITE=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)      FILE="$2"; shift 2 ;;
    --target)    TARGET="$2"; shift 2 ;;
    --overwrite) OVERWRITE=1; shift ;;
    --dry-run)   DRY_RUN=1; shift ;;
    -h|--help)
      sed -n '2,25p' "$0"
      exit 0
      ;;
    *) echo "unknown flag: $1"; exit 2 ;;
  esac
done

if [[ ! -f "$FILE" ]]; then
  echo "❌ env file not found: $FILE"
  exit 1
fi

case "$TARGET" in
  production|preview|development) ;;
  *) echo "❌ --target must be one of: production, preview, development"; exit 2 ;;
esac

# Sentinel substrings from .env.example. If a value contains any of these
# we refuse to push it (prevents accidentally shipping a placeholder).
PLACEHOLDERS=(
  "your-key"
  "your-anon-key"
  "your-secret-key"
  "your-publishable-key"
  "your-webhook-secret"
  "your-dsn"
  "your-sentry-org"
  "your-resend-api-key"
  "your-upstash-rest-token"
  "your-hcaptcha-or-turnstile-site-key"
  "your-auth-token"
  "YOUR-PROJECT-ID"
  "generate-a-random"
  "price_plus_monthly"
  "price_plus_yearly"
  "price_forge_monthly"
  "price_forge_yearly"
  "noreply@yourdomain.com"
  "ci-placeholder"
)

is_placeholder() {
  local val="$1"
  for needle in "${PLACEHOLDERS[@]}"; do
    if [[ "$val" == *"$needle"* ]]; then
      return 0
    fi
  done
  return 1
}

ensure_vercel_cli() {
  if ! command -v vercel >/dev/null 2>&1; then
    echo "❌ 'vercel' CLI not found on PATH. Install with: npm i -g vercel"
    exit 1
  fi
  if [[ ! -d ".vercel" ]]; then
    echo "❌ This repo is not linked to a Vercel project."
    echo "   Run: vercel link"
    exit 1
  fi
}

# Extract a printable list of existing env var names for the chosen target
existing_vars() {
  vercel env ls "$TARGET" 2>/dev/null | awk 'NR>2 && NF>0 {print $1}' || true
}

main() {
  ensure_vercel_cli
  echo "📥 Reading: $FILE"
  echo "🎯 Target:  $TARGET"
  echo "♻️  Overwrite: $([[ $OVERWRITE -eq 1 ]] && echo yes || echo no)"
  echo "🧪 Dry run: $([[ $DRY_RUN -eq 1 ]] && echo yes || echo no)"
  echo ""

  local existing
  existing="$(existing_vars)"

  local pushed=0 skipped=0 placeholders=0 already=0

  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    # strip CR
    local line="${raw_line%$'\r'}"
    # skip blank + comment
    [[ -z "${line// }" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    # only KEY=VALUE
    [[ "$line" != *=* ]] && continue

    local key="${line%%=*}"
    local val="${line#*=}"
    # trim whitespace from key
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    # strip optional surrounding double quotes from value
    if [[ "$val" =~ ^\".*\"$ ]]; then
      val="${val:1:${#val}-2}"
    fi

    # Refuse placeholder values
    if is_placeholder "$val"; then
      echo "  ⏭   $key  (placeholder — refusing to push)"
      placeholders=$((placeholders+1))
      continue
    fi

    # Already set?
    if echo "$existing" | grep -qx "$key"; then
      if [[ $OVERWRITE -eq 1 ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then
          echo "  ♻   $key  (would remove + re-add)"
        else
          vercel env rm "$key" "$TARGET" --yes >/dev/null 2>&1 || true
        fi
      else
        echo "  =   $key  (already set, use --overwrite to replace)"
        already=$((already+1))
        continue
      fi
    fi

    if [[ $DRY_RUN -eq 1 ]]; then
      echo "  +   $key  (would push)"
      pushed=$((pushed+1))
      continue
    fi

    if printf '%s' "$val" | vercel env add "$key" "$TARGET" >/dev/null 2>&1; then
      echo "  ✓   $key"
      pushed=$((pushed+1))
    else
      echo "  ✗   $key  (vercel env add failed)"
      skipped=$((skipped+1))
    fi
  done < "$FILE"

  echo ""
  echo "Summary:"
  echo "  pushed:        $pushed"
  echo "  already-set:   $already (use --overwrite to replace)"
  echo "  placeholders:  $placeholders (rejected by sentinel)"
  echo "  failed:        $skipped"
}

main
