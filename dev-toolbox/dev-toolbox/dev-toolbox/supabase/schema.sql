-- Dev Toolbox — Supabase/Postgres schema
-- NOT required for the MVP (all MVP tools are client-side, no DB calls).
-- This is the forward-looking schema for Phase 2 (accounts) onward.

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, mirrors auth.users
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- subscriptions: current plan per user. Populated/updated by Stripe webhooks.
-- ---------------------------------------------------------------------------
create type plan_tier as enum ('free', 'pro', 'team');
create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan plan_tier not null default 'free',
  status subscription_status not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- teams: for the Team plan (shared workspace, shared snippets/api keys)
-- ---------------------------------------------------------------------------
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create type team_role as enum ('owner', 'admin', 'member');

create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role team_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table teams enable row level security;
alter table team_members enable row level security;
create policy "Members can view their team" on teams
  for select using (
    id in (select team_id from team_members where user_id = auth.uid())
  );
create policy "Members can view team membership" on team_members
  for select using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- tool_usage_events: lightweight append-only log, drives "Popular Tools"
-- on the homepage via a materialized view, refreshed on a schedule.
-- user_id is nullable — anonymous usage is tracked too (no login required
-- to use any tool), keyed by an anonymous session id instead.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- saved_snippets: Pro feature — users save frequently-used input snippets
-- (e.g. a recurring JSON payload they reformat often).
-- ---------------------------------------------------------------------------
create table if not exists saved_snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tool_slug text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table saved_snippets enable row level security;
create policy "Users manage own snippets" on saved_snippets
  for all using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- api_keys: for the future public API (Pro/Team feature)
-- ---------------------------------------------------------------------------
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  key_prefix text not null, -- e.g. "dtb_live_" + first 6 chars, shown in UI
  key_hash text not null,   -- the actual key is hashed, never stored in plaintext
  label text,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table api_keys enable row level security;
create policy "Users manage own api keys" on api_keys
  for all using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ai_credit_ledger: append-only ledger (never a single mutable balance
-- column) so AI usage billing has a built-in audit trail from day one.
-- ---------------------------------------------------------------------------
create type ai_ledger_entry_type as enum ('credit_purchase', 'plan_grant', 'debit_usage', 'refund');

create table if not exists ai_credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  entry_type ai_ledger_entry_type not null,
  amount integer not null, -- positive for credits/grants, negative for debits
  ai_tool_slug text,       -- which AI tool consumed credits, if entry_type = 'debit_usage'
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table ai_credit_ledger enable row level security;
create policy "Users can view own ledger" on ai_credit_ledger
  for select using (auth.uid() = user_id);

-- A user's current AI credit balance is simply the sum of their ledger —
-- computed on read, never stored, so it can never drift out of sync:
--   select coalesce(sum(amount), 0) from ai_credit_ledger where user_id = :uid;

-- ---------------------------------------------------------------------------
-- Auto-create profile row when a new user registers
-- Supabase fires this trigger after any INSERT into auth.users
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS policy: allow users to upsert their own usage events
-- (inserts come from client-side tracking, not server)
-- ---------------------------------------------------------------------------
create policy "Users can insert own usage events" on tool_usage_events
  for insert with check (auth.uid() = user_id);

create policy "Users can view own usage events" on tool_usage_events
  for select using (auth.uid() = user_id);
