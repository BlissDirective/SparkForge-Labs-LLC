-- ════════════════════════════════════════════════════
-- DB-ENH-002 (Recommended): Realtime progress sync
--
-- Adds progress + children to the supabase_realtime publication so
-- clients can subscribe to row-level change events via Supabase
-- Realtime channels. Parent dashboards and the child's own session
-- both use this to auto-refresh without polling.
--
-- RLS still applies to realtime notifications — Supabase's Realtime
-- broker evaluates the subscribing session's JWT against RLS before
-- emitting the event. Parents only see their own children's events;
-- children only see their own row. Service-role bypass never reaches
-- realtime listeners.
-- ════════════════════════════════════════════════════

-- Create the publication if it doesn't exist (idempotent — Supabase
-- creates it on project init, but this guards local/dev projects).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add progress: fires on INSERT (new completion) + UPDATE (score
-- edit / attempts increment). Children react to their own row,
-- parents react to all progress rows for their children.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE progress;
  END IF;
END $$;

-- Add children: fires on UPDATE (xp / streak / streak_shield / level).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'children'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE children;
  END IF;
END $$;

-- REPLICA IDENTITY FULL — required so Realtime can emit DELETE
-- events with full row data (not just the PK). Without this, a
-- DELETE notification carries only `id` and downstream cache
-- invalidation has no child_id to key on.
ALTER TABLE progress REPLICA IDENTITY FULL;
ALTER TABLE children REPLICA IDENTITY FULL;

-- Verification
DO $$
BEGIN
  ASSERT (
    SELECT count(*) FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename IN ('progress', 'children')
  ) = 2, 'progress + children must be in supabase_realtime publication';
  RAISE NOTICE 'DB-ENH-002 migration OK';
END $$;
