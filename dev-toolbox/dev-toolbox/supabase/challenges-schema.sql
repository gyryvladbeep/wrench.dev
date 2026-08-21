-- ═══════════════════════════════════════════════════════
-- Wrench Challenges — Database Schema
-- ═══════════════════════════════════════════════════════

-- Roles
CREATE TYPE challenge_role AS ENUM ('qa', 'frontend', 'backend');

-- Difficulty
CREATE TYPE challenge_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Challenge type
CREATE TYPE challenge_type AS ENUM (
  'find_bug',        -- Find the bug/error in code/data
  'fix_code',        -- Fix broken code/JSON/regex
  'write_regex',     -- Write a regex for a pattern
  'decode',          -- Decode base64/JWT/hex
  'test_cases',      -- Write test cases (text answer)
  'api_analysis',    -- Analyze API request/response
  'sql_fix'          -- Fix SQL query
);

-- ── Challenges table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role            challenge_role       NOT NULL,
  difficulty      challenge_difficulty NOT NULL DEFAULT 'medium',
  type            challenge_type       NOT NULL,
  title           text                 NOT NULL,
  title_ru        text,
  description     text                 NOT NULL,
  description_ru  text,
  input_data      text                 NOT NULL, -- The code/JSON/data shown to user
  hint            text,
  hint_ru         text,
  correct_answer  text                 NOT NULL, -- Checked server-side
  answer_type     text                 NOT NULL DEFAULT 'exact', -- exact | contains | regex
  explanation     text                 NOT NULL, -- Shown after solving
  explanation_ru  text,
  points          integer              NOT NULL DEFAULT 10,
  is_daily        boolean              NOT NULL DEFAULT false,
  daily_date      date,                           -- Set when scheduled as daily
  is_active       boolean              NOT NULL DEFAULT true,
  created_at      timestamptz          NOT NULL DEFAULT now()
);

-- ── Daily schedule ──────────────────────────────────────
-- Each role gets one daily challenge per day
CREATE TABLE IF NOT EXISTS daily_challenges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id),
  role         challenge_role NOT NULL,
  scheduled_for date NOT NULL,
  UNIQUE(role, scheduled_for)
);

-- ── User attempts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id    uuid NOT NULL REFERENCES challenges(id),
  is_correct      boolean      NOT NULL DEFAULT false,
  answer_given    text,
  time_seconds    integer,     -- How long it took
  attempts_count  integer      NOT NULL DEFAULT 1,
  hints_used      integer      NOT NULL DEFAULT 0,
  points_earned   integer      NOT NULL DEFAULT 0,
  completed_at    timestamptz  NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id) -- One result per challenge per user
);

-- ── Streaks ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak  integer NOT NULL DEFAULT 0,
  longest_streak  integer NOT NULL DEFAULT 0,
  last_active     date,
  total_solved    integer NOT NULL DEFAULT 0,
  total_points    integer NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_challenges_role       ON challenges(role);
CREATE INDEX IF NOT EXISTS idx_challenges_daily      ON daily_challenges(scheduled_for, role);
CREATE INDEX IF NOT EXISTS idx_attempts_user         ON challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_challenge    ON challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_attempts_completed    ON challenge_attempts(completed_at);

-- ── RLS ─────────────────────────────────────────────────
ALTER TABLE challenges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks       ENABLE ROW LEVEL SECURITY;

-- Anyone can read challenges
CREATE POLICY "challenges_read"       ON challenges       FOR SELECT USING (is_active = true);
CREATE POLICY "daily_read"            ON daily_challenges FOR SELECT USING (true);

-- Users can read/write own attempts
CREATE POLICY "attempts_select"       ON challenge_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert"       ON challenge_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_update"       ON challenge_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Users can read/write own streaks
CREATE POLICY "streaks_select"        ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks_upsert"        ON user_streaks FOR ALL USING (auth.uid() = user_id);

-- ── Leaderboard view ────────────────────────────────────
CREATE OR REPLACE VIEW daily_leaderboard AS
SELECT
  ca.user_id,
  p.email,
  dc.role,
  dc.scheduled_for,
  ca.time_seconds,
  ca.points_earned,
  ca.hints_used,
  ROW_NUMBER() OVER (PARTITION BY dc.role, dc.scheduled_for ORDER BY ca.time_seconds ASC) as rank
FROM challenge_attempts ca
JOIN daily_challenges dc ON dc.challenge_id = ca.challenge_id
JOIN auth.users p ON p.id = ca.user_id
WHERE ca.is_correct = true
  AND dc.scheduled_for = CURRENT_DATE;

-- ═══════════════════════════════════════════════════════
-- Stripe Subscriptions Schema
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id   text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan                 text NOT NULL DEFAULT 'free', -- 'free' | 'pro'
  status               text NOT NULL DEFAULT 'active', -- 'active' | 'canceled' | 'past_due'
  current_period_end   timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug    text NOT NULL,
  used_at      date NOT NULL DEFAULT CURRENT_DATE,
  count        integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, tool_slug, used_at)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_usage_select"      ON ai_usage      FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_usage_insert"      ON ai_usage      FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_usage_update"      ON ai_usage      FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, used_at);
