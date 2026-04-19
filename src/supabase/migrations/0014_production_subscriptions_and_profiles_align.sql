-- Align production DBs that still have legacy `profiles` (display_name, credits, genesis)
-- and/or missing `public.subscriptions`. Safe to run on already-migrated Quilora DBs (IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- subscriptions (Dodo / legacy Paddle rows) — create if missing
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_subscription_id text,
  provider_customer_id text,
  tier text not null check (tier in ('bookworm', 'bibliophile', 'genesis')),
  status text not null check (status in ('active', 'cancelled', 'past_due')),
  price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  first_month_discount_applied boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

-- ---------------------------------------------------------------------------
-- profiles — add Quilora columns if legacy DB only had display_name / credits / genesis
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists credit_balance integer not null default 0;
alter table public.profiles add column if not exists streak_count integer not null default 0;
alter table public.profiles add column if not exists streak_goal integer not null default 1;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists genesis_badge boolean not null default false;
alter table public.profiles add column if not exists plan_selection_completed boolean not null default false;
alter table public.profiles add column if not exists alpha_lab_access boolean not null default false;
alter table public.profiles add column if not exists last_streak_date date;

-- Backfill from legacy column names where present
update public.profiles
set full_name = coalesce(nullif(trim(full_name), ''), nullif(trim(display_name), ''))
where exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
)
and (full_name is null or trim(full_name) = '')
and display_name is not null
and trim(display_name) <> '';

update public.profiles
set credit_balance = coalesce(credits, credit_balance, 0)
where exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'credits'
)
and coalesce(credits, 0) <> coalesce(credit_balance, 0);

update public.profiles
set genesis_badge = coalesce(genesis_badge, genesis, false)
where exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'genesis'
)
and coalesce(genesis, false) = true;
