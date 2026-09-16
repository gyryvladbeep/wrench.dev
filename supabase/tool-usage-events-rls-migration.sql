-- ═══════════════════════════════════════════════════════════════
-- tool_usage_events — create table (if missing) with RLS enabled
-- ═══════════════════════════════════════════════════════════════
-- REVISED VERSION. The first version of this migration assumed the
-- table already existed in production (it's defined in
-- supabase/schema.sql) and only tried to flip on RLS. Running it
-- against the real database returned:
--   ERROR: 42P01: relation "tool_usage_events" does not exist
--
-- Turns out the table was designed (schema.sql) and partially wired
-- up (components/auth/ProfileClient.tsx reads from it for the
-- profile page's usage-stats section), but never actually created
-- in the live database, and nothing anywhere in the codebase writes
-- to it either (no insert call exists). So the original "RLS hole"
-- never held real data — there was nothing to leak. What it actually
-- means in practice: every visit to the profile page has been
-- silently failing that one query (no error shown, section just
-- stays empty), and the "Popular Tools" section on the homepage /
-- search does NOT use this table at all — it's a static `isPopular`
-- flag in lib/tools-registry.ts (getPopularTools()). The
-- popular_tools_30d materialized view below is defined but currently
-- unused by the app.
--
-- This migration creates the table (matching schema.sql exactly),
-- the view, and RLS — all idempotent, safe to run once now. It does
-- NOT add the missing tracking calls (nothing will actually get
-- inserted into this table until something in the app calls
-- .insert() on it) — that's a separate, bigger task: deciding how
-- anonymous_id is generated/stored client-side and where across ~82
-- tool pages to fire the tracking call. Until that's built, the
-- profile page's usage-stats section will correctly run (no more
-- error) but show zero rows, which is honest — there's no usage
-- data yet, not a bug.
--
-- One more thing fixed here versus the original schema.sql policies:
-- the insert policy as originally written (`auth.uid() = user_id`)
-- would have silently rejected every anonymous insert once
-- tracking is added, even though the table's own design (nullable
-- user_id + anonymous_id column) says anonymous usage should be
-- trackable without login. Fixed below to allow user_id IS NULL.

create table if not exists tool_usage_events (
  id bigint generated always as identity primary key,
  tool_slug text not null,
  user_id uuid references profiles(id) on delete set null,
  anonymous_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tool_usage_slug_time on tool_usage_events (tool_slug, created_at);

create materialized view if not exists popular_tools_30d as
select tool_slug, count(*) as uses
from tool_usage_events
where created_at > now() - interval '30 days'
group by tool_slug
order by uses desc;

alter table tool_usage_events enable row level security;

drop policy if exists "Users can insert own usage events" on tool_usage_events;
create policy "Users can insert own usage events" on tool_usage_events
  for insert with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Users can view own usage events" on tool_usage_events;
create policy "Users can view own usage events" on tool_usage_events
  for select using (auth.uid() = user_id);
