-- Quilora backend foundation schema
-- Applies tiering, credits, payments, sandboxes, graph entities, and mastery persistence.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'quilora_tier') then
    create type quilora_tier as enum ('bookworm', 'bibliophile', 'genesis');
  end if;

  if not exists (select 1 from pg_type where typname = 'credit_event_type') then
    create type credit_event_type as enum (
      'upload_ingestion',
      'library_activation',
      'lens_activation',
      'mastery_blitz',
      'study_chat_prompt',
      'freestyle_prompt',
      'boost_pack_purchase',
      'monthly_refresh',
      'manual_adjustment',
      'legacy_grant'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_provider') then
    create type payment_provider as enum ('paddle');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
  end if;
end
$$;

create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  tier quilora_tier not null default 'bookworm',
  credit_balance integer not null default 0 check (credit_balance >= 0),
  low_balance_threshold integer not null default 100,
  sandbox_limit integer,
  genesis_badge boolean not null default false,
  alpha_lab_access boolean not null default false,
  lifetime_bookworm boolean not null default false,
  lifetime_discount_pct numeric(5,2) not null default 0,
  bibliophile_rollover_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider payment_provider not null default 'paddle',
  provider_customer_id text,
  provider_subscription_id text,
  tier quilora_tier not null,
  monthly_credits integer not null default 0,
  first_month_discount_pct numeric(5,2) not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  renews_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user_active on subscriptions(user_id, is_active);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  provider payment_provider not null default 'paddle',
  provider_event_id text not null unique,
  provider_customer_id text,
  provider_checkout_id text,
  provider_subscription_id text,
  status payment_status not null default 'pending',
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type credit_event_type not null,
  delta integer not null,
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);
create index if not exists idx_credit_ledger_user_created on credit_ledger(user_id, created_at desc);

create table if not exists sandboxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source_document_name text,
  is_frozen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sandboxes_user_id on sandboxes(user_id);

create table if not exists sandbox_blocks (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references sandboxes(id) on delete cascade,
  block_type text not null,
  label text not null,
  x numeric(10,2) not null default 0,
  y numeric(10,2) not null default 0,
  width numeric(10,2) not null default 240,
  height numeric(10,2) not null default 120,
  color text,
  shape text,
  tags text[] not null default '{}',
  favorite boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sandbox_blocks_sandbox on sandbox_blocks(sandbox_id);

create table if not exists sandbox_connectors (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references sandboxes(id) on delete cascade,
  from_block_id uuid not null references sandbox_blocks(id) on delete cascade,
  to_block_id uuid not null references sandbox_blocks(id) on delete cascade,
  link_type text not null,
  analysis text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (sandbox_id, from_block_id, to_block_id, link_type)
);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sandbox_id uuid references sandboxes(id) on delete set null,
  source_document_name text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);
create index if not exists idx_study_sessions_user on study_sessions(user_id, last_active_at desc);

create table if not exists mastery_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sandbox_id uuid references sandboxes(id) on delete set null,
  mode text not null,
  depth integer not null default 1,
  score numeric(6,2),
  passed boolean,
  evidence_weight numeric(6,2),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_mastery_runs_user on mastery_runs(user_id, created_at desc);

create table if not exists genesis_slot_inventory (
  slot_tier text primary key,
  slot_cap integer not null check (slot_cap > 0),
  sold_count integer not null default 0 check (sold_count >= 0),
  updated_at timestamptz not null default now()
);

insert into genesis_slot_inventory (slot_tier, slot_cap, sold_count)
values ('genesis_80', 50, 0), ('genesis_119', 150, 0)
on conflict (slot_tier) do nothing;

