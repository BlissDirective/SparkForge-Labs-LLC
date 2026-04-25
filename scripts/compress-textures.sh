#!/usr/bin/env bash
# ════════════════════════════════════════════════════
# compress-textures.sh — PERF-HIGH-002 (Option C)
#
# Walks public/textures/ and (re)generates a .ktx2 sibling for every
# .png / .jpg / .jpeg that is newer than its KTX2 counterpart (or
# where the KTX2 doesn't exist yet). Idempotent — safe to run as
# often as you like. No-op if public/textures/ is empty or missing.
#
# Requires `basisu` on PATH. See docs/3D_ASSET_PIPELINE.md for
# installation instructions.
#
# USAGE:
#   bash scripts/compress-textures.sh              # normal maps auto-detected by "_normal" suffix
#   bash scripts/compress-textures.sh --force      # regenerate every KTX2 regardless of timestamp
#   bash scripts/compress-textures.sh --dry-run    # print actions without running basisu
# ════════════════════════════════════════════════════

set -euo pipefail

FORCE=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --force)   FORCE=1   ;;
    --dry-run) DRY_RUN=1 ;;
    *)         echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

ROOT="public/textures"

if [[ ! -d "$ROOT" ]]; then
  echo "ℹ  $ROOT does not exist (repo is procedural-first). Nothing to compress."
  exit 0
fi

if ! command -v basisu >/dev/null 2>&1; then
  echo "❌ basisu not found on PATH." >&2
  echo "   Install: see docs/3D_ASSET_PIPELINE.md §Tooling." >&2
  exit 1
fi

processed=0
skipped=0

# Process .png / .jpg / .jpeg recursively
while IFS= read -r -d '' src; do
  dst="${src%.*}.ktx2"

  # Decide whether to skip
  if [[ $FORCE -eq 0 && -f "$dst" && "$dst" -nt "$src" ]]; then
    skipped=$((skipped + 1))
    continue
  fi

  # Normal map heuristic — filename contains _normal or _nrm
  flags=(-ktx2 -q 180 -mipmap -mip_filter mitchell)
  if [[ "$src" == *_normal* || "$src" == *_nrm* ]]; then
    flags+=(-normal_map)
  fi

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] basisu ${flags[*]} $src -output_file $dst"
  else
    echo "→ $src"
    basisu "${flags[@]}" "$src" -output_file "$dst" >/dev/null
  fi
  processed=$((processed + 1))
done < <(find "$ROOT" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)

echo ""
printf '✓ Compressed: %d  ·  Skipped (up-to-date): %d\n' "$processed" "$skipped"
