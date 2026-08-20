-- ═══════════════════════════════════════════════════════
-- Profile & Activity Schema
-- ═══════════════════════════════════════════════════════

-- Extended user profiles
CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE,
  display_name    text,
  bio             text,
  avatar_color    text DEFAULT '#f59e0b',
  role_tag        text DEFAULT 'developer', -- 'qa', 'frontend', 'backend', 'fullstack', 'devops', 'developer'
  is_public       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Tool usage history
CREATE TABLE IF NOT EXISTS tool_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug  text NOT NULL,
  used_at    timestamptz DEFAULT now()
);

-- Achievements / badges
CREATE TABLE IF NOT EXISTS achievements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id     text NOT NULL,
  earned_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- RLS
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"  ON profiles     FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles     FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON profiles     FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "tool_history_select"  ON tool_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tool_history_insert"  ON tool_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "achievements_select"  ON achievements  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "achievements_insert"  ON achievements  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tool_history_user     ON tool_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_history_date     ON tool_history(user_id, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user     ON achievements(user_id);
