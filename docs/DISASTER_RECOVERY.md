# SparkForge — Disaster Recovery Runbook

**Last updated:** April 21, 2026
**Owner:** Platform / Infra
**Referenced by:** `CLAUDE.md §12`, `DEPLOYMENT.md`, `T18 DEPLOY-MED-001`

---

## 1. Backup architecture

| Layer | Provider | Strategy | Retention | RPO | RTO |
|---|---|---|---|---|---|
| Postgres database | Supabase Pro | **Automatic daily snapshots** + **Point-in-Time Recovery (PITR)** | 7 days (daily) · 7 days (PITR) | **≤ 2 min** (PITR) · 24 h (snapshot) | ~30 min (snapshot) · ~1 h (PITR) |
| Storage buckets | Supabase Storage | Daily object-level backup via cron | 14 days | 24 h | ~1 h per bucket |
| Code + migrations | GitHub | Protected branches, required reviews | Forever | N/A | Redeploy (~5 min) |
| Secrets / env vars | Vercel | Environment-level per-branch | Forever | N/A | Re-enter from 1Password vault |

**RPO** = Recovery Point Objective (max data loss)
**RTO** = Recovery Time Objective (max downtime)

---

## 2. Supabase PITR — Enablement (one-time)

PITR requires the Supabase **Pro plan or higher**.

1. Supabase Dashboard → Your project → **Project Settings → Database**.
2. Scroll to **Point-in-Time Recovery**.
3. Click **Enable** → confirm cost increment (~$10/mo for 7-day window at
   small scale).
4. Note the retention window — PITR lets you restore to any second within
   the last **7 days** (upgrade to 14 days for $25/mo if required).
5. Return to **Project Settings → Database → Backups** and verify:
   - Daily snapshot frequency: **Enabled**
   - Download manual snapshot: **Available** (take one now).

**Verify manually** by downloading a snapshot in the dashboard — if the
download works, daily snapshots are healthy.

---

## 3. Recovery drills

Run a drill **monthly** in the staging project. A drill proves the runbook
still works before a real incident forces you to use it.

### 3.1 PITR drill (staging)

1. In staging, delete one row from `test_drill_rows` (create the table
   first if missing: `CREATE TABLE test_drill_rows (id uuid PRIMARY KEY
   DEFAULT gen_random_uuid(), note text, created_at timestamptz DEFAULT
   now());` + insert 5 rows with timestamps spanning the last hour).
2. Note the deletion timestamp (UTC).
3. Wait **5 minutes**.
4. Run `scripts/disaster-recovery.sh pitr-drill` and follow prompts.
5. Confirm the deleted row is present in the restored snapshot.
6. Record the RPO / RTO achieved in the drill log (bottom of this file).

### 3.2 Snapshot restore drill

1. Take a manual snapshot in staging.
2. Delete a larger dataset (truncate `content_queue` if populated).
3. Follow §4.2 below on the staging project.
4. Record timings.

---

## 4. Real-incident procedures

### 4.1 PITR restore (recommended for small / recent incidents)

1. Identify the incident **UTC timestamp** to the second — the latest
   "known good" second is your target.
2. Open Supabase Dashboard → Project Settings → Database → **Point-in-Time
   Recovery** → **Restore**.
3. Select the target timestamp. A new **branch project** is created
   (does NOT overwrite production yet).
4. Wait ~10-30 min for the restored project to spin up.
5. Connect the restored project with `psql` (the dashboard shows the
   one-off connection string).
6. Verify the missing / corrupted data is present:
   ```sql
   SELECT count(*) FROM parents;
   SELECT count(*) FROM children;
   SELECT count(*) FROM progress;
   ```
7. Option A: **Promote the branch** — the dashboard has a one-click
   promote that swaps the restored DB into production. ~5 min downtime.
   All new writes since the restore point are lost (by design).
8. Option B: **Copy specific tables** from the branch into production via
   `pg_dump`:
   ```bash
   pg_dump "$RESTORED_URL" -t parents -t children > /tmp/restore.sql
   psql "$PROD_URL" < /tmp/restore.sql
   ```
9. Post-incident:
   - Update status page.
   - Record the final RPO / RTO.
   - Open a retro issue in GitHub.

### 4.2 Snapshot restore (larger / older incidents)

1. Supabase Dashboard → Backups → pick a snapshot older than the
   incident.
2. Click **Restore as new project**.
3. Follow steps 5-9 from §4.1.

### 4.3 Total region outage

If Supabase us-east-1 is fully down:

1. Wait for Supabase's status page to confirm ETA.
2. If ETA > 2 h, spin up a **recovery project** in another region:
   - Restore the most recent manual snapshot to a new project.
   - Apply migrations: `npm run db:migrate:remote` (targets
     `NEXT_PUBLIC_SUPABASE_URL` env).
   - Rotate `NEXT_PUBLIC_SUPABASE_URL` and
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
   - Redeploy.
3. Post-outage: re-sync any writes to the recovered project using
   `scripts/disaster-recovery.sh reconcile`.

---

## 5. Required environment (for recovery script)

| Env var | Purpose |
|---|---|
| `SUPABASE_DB_URL`        | Production Postgres URL (service role) |
| `SUPABASE_STAGING_URL`   | Staging Postgres URL (for drills) |
| `SUPABASE_RESTORED_URL`  | Populated at restore-time — the branch project |

Keep all three in 1Password "SparkForge / Supabase DR". Do **not** add
them to `.env.local`.

---

## 6. Drill log

| Date | Env | Drill type | RPO achieved | RTO achieved | Notes |
|---|---|---|---|---|---|
| _TBD_ | staging | PITR | — | — | First drill after PITR enablement |

---

## 7. Escalation

1. **Minor incident (< 5 rows)** → on-call platform engineer runs §4.1.
2. **Medium incident** → notify founder + post in #alerts.
3. **Major incident (full data loss > 1 table)** → page both founders,
   open Google Doc for coordination, notify Supabase support.

Supabase support: https://supabase.com/dashboard/support (SLA: 4 h on Pro)

---

## 8. Related docs

- `DEPLOYMENT.md` §Environment — env var inventory
- `CLAUDE.md §12 Progress tracking` — when a recovery is in progress,
  add a BLOCKED row to PROGRESS.md so other agents don't push.
- `sql/README.md` — migration order (re-run on a fresh project).
