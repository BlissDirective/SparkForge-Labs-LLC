#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# disaster-recovery.sh — T18 DEPLOY-MED-001 (Opt B)
# ════════════════════════════════════════════════════════════════
# Operator script for Supabase disaster recovery tasks. Wraps the
# common drill + restore operations documented in
# docs/DISASTER_RECOVERY.md so operators aren't typing pg_dump
# invocations under pressure.
#
# Commands:
#   ./disaster-recovery.sh snapshot          — take a manual snapshot
#   ./disaster-recovery.sh verify            — prove backups are healthy
#   ./disaster-recovery.sh pitr-drill        — guided staging PITR drill
#   ./disaster-recovery.sh dump-table <name> — ad-hoc table export
#   ./disaster-recovery.sh restore-table <name> — reload table from dump
#   ./disaster-recovery.sh reconcile         — compare prod vs restored
#                                              for post-outage cleanup
#
# Required env (keep in 1Password "SparkForge / Supabase DR"):
#   SUPABASE_DB_URL         production psql connection string
#   SUPABASE_STAGING_URL    staging psql connection string
#   SUPABASE_RESTORED_URL   populated at restore-time
# ════════════════════════════════════════════════════════════════
set -euo pipefail

BACKUP_DIR="${SUPABASE_BACKUP_DIR:-./.sparkforge-backups}"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)

need() {
  if [ -z "${!1:-}" ]; then
    echo "ERROR: $1 must be set (see docs/DISASTER_RECOVERY.md §5)" >&2
    exit 1
  fi
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command '$1' not installed" >&2
    exit 1
  fi
}

need_cmd psql
need_cmd pg_dump

mkdir -p "$BACKUP_DIR"

cmd_snapshot() {
  need SUPABASE_DB_URL
  local out="$BACKUP_DIR/snapshot-$TIMESTAMP.sql.gz"
  echo "→ Dumping $SUPABASE_DB_URL to $out"
  pg_dump --no-owner --no-privileges \
    --exclude-schema=cron --exclude-schema=pgsodium --exclude-schema=realtime --exclude-schema=supabase_functions \
    "$SUPABASE_DB_URL" | gzip -9 > "$out"
  echo "✓ Snapshot: $out ($(du -h "$out" | cut -f1))"
}

cmd_verify() {
  need SUPABASE_DB_URL
  echo "→ Connecting to production DB…"
  psql "$SUPABASE_DB_URL" -c "SELECT now() AS server_time, pg_database_size(current_database())/1024/1024 AS size_mb;"
  echo "→ Recent row counts (sanity):"
  psql "$SUPABASE_DB_URL" -c "
    SELECT 'parents'  AS tbl, count(*) FROM parents
    UNION ALL
    SELECT 'children', count(*) FROM children
    UNION ALL
    SELECT 'progress', count(*) FROM progress;
  "
  echo "✓ Database reachable and has expected tables."
  echo ""
  echo "Verify daily snapshots in Supabase Dashboard:"
  echo "  https://supabase.com/dashboard/project/_/database/backups"
}

cmd_pitr_drill() {
  need SUPABASE_STAGING_URL
  cat <<EOF
🧪 PITR drill — staging only.
Follows docs/DISASTER_RECOVERY.md §3.1.

Steps:
  1. Insert marker rows into staging.test_drill_rows.
  2. Record timestamp T0.
  3. Delete one marker row.
  4. Open the Supabase Dashboard → PITR → Restore to T0.
  5. Connect to the restored project and confirm the deleted row exists.

This script prepares steps 1-3 and prints the timestamp you need for
step 4.
EOF
  read -rp "Proceed in STAGING? (yes/no) " answer
  [ "$answer" = "yes" ] || { echo "Aborted."; exit 0; }

  psql "$SUPABASE_STAGING_URL" <<'SQL'
    CREATE TABLE IF NOT EXISTS test_drill_rows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      note text,
      created_at timestamptz DEFAULT now()
    );
    INSERT INTO test_drill_rows (note) VALUES
      ('drill-row-A'),
      ('drill-row-B'),
      ('drill-row-C');
SQL

  local t0
  t0=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "→ T0 (UTC): $t0 — note this for the Dashboard PITR restore."
  sleep 2

  psql "$SUPABASE_STAGING_URL" -c "DELETE FROM test_drill_rows WHERE note = 'drill-row-A';"
  echo "✓ Deleted drill-row-A. Go restore to $t0 via the Dashboard, then verify it reappears."
}

cmd_dump_table() {
  need SUPABASE_DB_URL
  local tbl="${1:?usage: dump-table <table>}"
  local out="$BACKUP_DIR/${tbl}-$TIMESTAMP.sql"
  pg_dump --no-owner --no-privileges --data-only --table "public.${tbl}" \
    "$SUPABASE_DB_URL" > "$out"
  echo "✓ Dumped $tbl → $out"
}

cmd_restore_table() {
  need SUPABASE_DB_URL
  local tbl="${1:?usage: restore-table <table>}"
  local file="${2:?usage: restore-table <table> <dump-file>}"
  [ -f "$file" ] || { echo "File not found: $file" >&2; exit 1; }
  echo "⚠  About to replace data in public.$tbl from $file on:"
  echo "    $SUPABASE_DB_URL"
  read -rp "Type RESTORE to proceed: " answer
  [ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 0; }
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "TRUNCATE public.$tbl RESTART IDENTITY CASCADE;"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$file"
  echo "✓ Restored $tbl."
}

cmd_reconcile() {
  need SUPABASE_DB_URL
  need SUPABASE_RESTORED_URL
  echo "→ Row-count diff between production and restored projects:"
  for tbl in parents children progress content_queue subscription_events; do
    local p r
    p=$(psql "$SUPABASE_DB_URL" -tAc "SELECT count(*) FROM $tbl;" 2>/dev/null || echo '?')
    r=$(psql "$SUPABASE_RESTORED_URL" -tAc "SELECT count(*) FROM $tbl;" 2>/dev/null || echo '?')
    printf "  %-30s prod=%s  restored=%s\n" "$tbl" "$p" "$r"
  done
}

case "${1:-help}" in
  snapshot)        cmd_snapshot ;;
  verify)          cmd_verify ;;
  pitr-drill)      cmd_pitr_drill ;;
  dump-table)      shift; cmd_dump_table "$@" ;;
  restore-table)   shift; cmd_restore_table "$@" ;;
  reconcile)       cmd_reconcile ;;
  *)
    cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  snapshot              Take a manual pg_dump snapshot to $BACKUP_DIR/
  verify                Print row counts + confirm DB is reachable
  pitr-drill            Guided PITR drill (staging only)
  dump-table  <tbl>     Dump a single table to $BACKUP_DIR/
  restore-table <tbl> <file>
                        Truncate + reload a table from a dump
  reconcile             Row-count diff between prod + restored projects

See docs/DISASTER_RECOVERY.md for full procedures.
EOF
    exit 1
    ;;
esac
