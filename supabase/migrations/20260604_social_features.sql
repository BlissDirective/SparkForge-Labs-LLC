-- ════════════════════════════════════════════════════
-- MIGRATION: COPPA-Safe Social Features (Phase 8)
-- Date: 2026-06-04
-- Study Buddies (friends), invite codes, buddy quests,
-- preset-only safe messages, parent approvals, buddy badges.
--
-- COPPA: no real names, no free-form text, no photos/geo;
-- every connection requires parent approval; messages are
-- restricted to a server-controlled template catalog.
-- ════════════════════════════════════════════════════

-- ─── Friend Connections ───
-- One row per (child -> buddy) direction so each side carries its own
-- parent_approved flag. A connection is mutually active only when both
-- direction rows have parent_approved = true.
CREATE TABLE IF NOT EXISTS friend_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  buddy_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  pair_key TEXT NOT NULL, -- sorted "min:max" child id pair, links both directions
  status TEXT NOT NULL DEFAULT 'pending_parent'
    CHECK (status IN ('pending_parent', 'pending_friend', 'active', 'blocked', 'declined')),
  parent_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, buddy_id),
  CHECK (child_id <> buddy_id)
);

CREATE INDEX idx_friend_conn_child ON friend_connections(child_id, status);
CREATE INDEX idx_friend_conn_pair ON friend_connections(pair_key);

-- ─── Invite Codes ───
CREATE TABLE IF NOT EXISTS friend_invite_codes (
  code TEXT PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  redeemed BOOLEAN NOT NULL DEFAULT false,
  redeemed_by UUID REFERENCES children(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_invite_codes_child ON friend_invite_codes(child_id);

-- ─── Parent Approvals ───
-- A pending decision surfaced to a child's parent for one connection.
CREATE TABLE IF NOT EXISTS parent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES friend_connections(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  buddy_display_name TEXT NOT NULL,
  buddy_avatar TEXT NOT NULL DEFAULT 'happy',
  decision TEXT CHECK (decision IN ('approve', 'decline')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX idx_parent_approvals_child ON parent_approvals(child_id) WHERE decision IS NULL;

-- ─── Buddy Quests ───
CREATE TABLE IF NOT EXISTS buddy_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_key TEXT NOT NULL,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  buddy_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🤝',
  requirement_count INTEGER NOT NULL DEFAULT 1 CHECK (requirement_count > 0),
  my_progress INTEGER NOT NULL DEFAULT 0 CHECK (my_progress >= 0),
  buddy_progress INTEGER NOT NULL DEFAULT 0 CHECK (buddy_progress >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'claimed', 'expired')),
  xp_reward INTEGER NOT NULL DEFAULT 0,
  gem_reward INTEGER NOT NULL DEFAULT 0,
  week_starting DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_buddy_quests_child ON buddy_quests(child_id, week_starting DESC);

-- ─── Safe Messages (preset-only audit trail) ───
CREATE TABLE IF NOT EXISTS safe_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  to_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  text TEXT NOT NULL,       -- denormalized from the server catalog
  emoji TEXT NOT NULL DEFAULT '😊',
  reported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_safe_messages_pair ON safe_messages(from_child_id, to_child_id, created_at DESC);
CREATE INDEX idx_safe_messages_to ON safe_messages(to_child_id, created_at DESC);

-- ─── Buddy Badges (shared achievements) ───
CREATE TABLE IF NOT EXISTS buddy_badges_earned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_key TEXT NOT NULL,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  buddy_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, buddy_id, badge_id)
);

CREATE INDEX idx_buddy_badges_child ON buddy_badges_earned(child_id);

-- ════════════════════════════════════════════════════
-- RLS Policies — children read their own rows; service
-- role (API routes) manages all. Mirrors the quest system.
-- ════════════════════════════════════════════════════
ALTER TABLE friend_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_badges_earned ENABLE ROW LEVEL SECURITY;

-- Helper predicate inlined: child_id belongs to the authenticated parent.
CREATE POLICY friend_conn_select_owner ON friend_connections
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));
CREATE POLICY invite_codes_select_owner ON friend_invite_codes
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));
CREATE POLICY parent_approvals_select_owner ON parent_approvals
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));
CREATE POLICY buddy_quests_select_owner ON buddy_quests
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));
-- Safe messages: a parent may read messages sent to OR from their child
-- (full communication history visibility is a COPPA requirement).
CREATE POLICY safe_messages_select_owner ON safe_messages
  FOR SELECT USING (
    from_child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
    OR to_child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );
CREATE POLICY buddy_badges_select_owner ON buddy_badges_earned
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- NOTE: no INSERT/UPDATE/DELETE policies are defined. All writes happen
-- server-side through the admin (service-role) client in the API routes,
-- which bypasses RLS. Direct writes from the anon/authenticated client are
-- therefore denied by default — closing the cross-child write surface while
-- the API enforces ownership (requireAuth + verifyChildOwnership) and COPPA
-- rules (parent approval, preset-only messages).
