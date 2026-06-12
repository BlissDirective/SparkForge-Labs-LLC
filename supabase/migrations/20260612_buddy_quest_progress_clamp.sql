-- ════════════════════════════════════════════════════
-- Social hardening: bound buddy-quest progress (fable-audit-v1 §2.5)
--
-- `my_progress` / `buddy_progress` previously only had `>= 0` checks,
-- and `requirement_count` only `> 0`. SocialEngine marks a quest
-- complete at `progress >= requirement_count`, so an unclamped writer
-- could insta-complete quests. No current endpoint writes progress,
-- but any future writer is now bounded at the database layer.
-- ════════════════════════════════════════════════════

ALTER TABLE buddy_quests
  ADD CONSTRAINT buddy_quests_my_progress_clamped
    CHECK (my_progress <= requirement_count);

ALTER TABLE buddy_quests
  ADD CONSTRAINT buddy_quests_buddy_progress_clamped
    CHECK (buddy_progress <= requirement_count);

-- A runaway requirement (e.g. 1,000,000) would soft-lock the buddy
-- feature for the pair. Templates today top out well under 100.
ALTER TABLE buddy_quests
  ADD CONSTRAINT buddy_quests_requirement_bounded
    CHECK (requirement_count BETWEEN 1 AND 100);
