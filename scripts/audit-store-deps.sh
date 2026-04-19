#!/usr/bin/env bash
# ════════════════════════════════════════════════════
# audit-store-deps.sh — STATE-HIGH-003 (Option C)
#
# Walks src/stores/ and reports:
#   - Cross-store imports per store (which OTHER stores each imports)
#   - Consumer count per store (how many files outside src/stores
#     import it)
#   - Flags any store with >= 3 cross-store deps as HIGH COUPLING
#
# Exits non-zero on any flagged finding so this can be wired into
# CI later. Today it's advisory — run locally before adding a new
# store.
#
# USAGE:
#   bash scripts/audit-store-deps.sh
# ════════════════════════════════════════════════════

# NOTE: intentionally NOT using `set -e` here. The grep -v / grep -c
# calls legitimately return non-zero when the match set is empty,
# and we want those cases to fall through to "0" / empty string,
# not abort the whole audit.

ROOT="src/stores"
MAX_ALLOWED_DEPS=2    # 3+ imports triggers a flag
flagged=0

if [[ ! -d "$ROOT" ]]; then
  echo "❌ $ROOT does not exist" >&2
  exit 1
fi

printf '%-28s %4s %s\n' "STORE" "CONS" "CROSS-STORE IMPORTS"
printf '%-28s %4s %s\n' "────────────────────────────" "────" "─────────────────────────────────"

# Snapshot the file list first so we don't care about pipeline exits
mapfile -t STORE_FILES < <(find "$ROOT" -maxdepth 1 -type f -name '*.ts' | sort)

for file in "${STORE_FILES[@]}"; do
  name=$(basename "$file" .ts)

  # Cross-store imports: list of OTHER stores this file imports.
  # Each pipeline segment can legitimately return empty / non-zero;
  # we capture whatever comes out.
  deps_raw=$(grep -oE "from '@/stores/[^']+'" "$file" 2>/dev/null | sed -e "s|from '@/stores/||" -e "s|'||" || true)
  # Filter out self-reference and dedupe
  deps=$(echo "$deps_raw" | grep -v "^${name}$" 2>/dev/null | sort -u | tr '\n' ',' | sed 's/,$//' || true)

  # Count deps
  dep_count=0
  if [[ -n "$deps" ]]; then
    IFS=',' read -r -a _arr <<< "$deps"
    dep_count=${#_arr[@]}
  fi

  # Consumer count: files outside src/stores/ that import this store.
  consumers=$(grep -rl "from '@/stores/${name}'" src 2>/dev/null | grep -v "^src/stores/" 2>/dev/null | wc -l | tr -d ' ')
  consumers=${consumers:-0}

  marker=""
  if (( dep_count > MAX_ALLOWED_DEPS )); then
    marker=" ⚠ HIGH COUPLING"
    flagged=$((flagged + 1))
  fi

  printf '%-28s %4s %s%s\n' "$name" "$consumers" "${deps:-—}" "$marker"
done

echo ""
if (( flagged > 0 )); then
  printf '❌ %d store(s) exceeded the cross-store import budget (max %d).\n' \
    "$flagged" "$MAX_ALLOWED_DEPS" >&2
  echo "   Consider merging or inverting the dependency." >&2
  exit 1
fi

printf '✓ All stores within coupling budget (max %d cross-store imports each).\n' "$MAX_ALLOWED_DEPS"
