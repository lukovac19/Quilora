-- user_plans: canonical SaaS billing row per user (webhook writes only).
-- genesis_slots: bundled lifetime + Sage price points (self-contained: table created here if missing).

create table if not exists public.genesis_slots (
  id uuid primary key default gen_random_uuid(),
  price_point text not null,
  slots_total integer not null,
  slots_used integer not null default 0,
  created_at timestamptz not null default now(),
  unique (price_point)
);

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free'
    check (plan in ('free', 'bookworm', 'sage', 'lifetime_early', 'lifetime_standard', 'lifetime_plus_sage')),
  subscription_id text,
  subscription_status text
    check (subscription_status is null or subscription_status in ('active', 'cancelled', 'past_due')),
  token_balance integer not null default 0,
  tokens_per_cycle integer not null default 0,
  subscription_period_end timestamptz,
  is_lifetime boolean not null default false,
  genesis_seat_number integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_plans_subscription_id on public.user_plans (subscription_id)
  where subscription_id is not null;

drop trigger if exists trg_user_plans_updated on public.user_plans;
create trigger trg_user_plans_updated
  before update on public.user_plans
  for each row execute function public.set_updated_at();

alter table public.user_plans enable row level security;

-- Read own row; no client writes (service_role bypasses RLS)
drop policy if exists user_plans_select_own on public.user_plans;
create policy user_plans_select_own on public.user_plans
  for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.user_plans from anon;
grant select on public.user_plans to authenticated;
grant all on public.user_plans to service_role;

-- Widen price_point CHECK (e.g. legacy 80/119 only) and seed $176 tier row
do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'genesis_slots'
      and c.conname = 'genesis_slots_price_point_check'
  ) then
    alter table public.genesis_slots drop constraint genesis_slots_price_point_check;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'genesis_slots'
      and c.conname = 'genesis_slots_price_point_check'
  ) then
    alter table public.genesis_slots add constraint genesis_slots_price_point_check
      check (price_point in ('80', '119', '176'));
  end if;

  insert into public.genesis_slots (price_point, slots_total, slots_used)
  values ('176', 100000, 0)
  on conflict (price_point) do nothing;
end $$;
