-- =============================================================================
-- Quilora — clean database setup (Supabase SQL Editor)
-- =============================================================================
-- Prerequisites (only):
--   - auth.users (Supabase built-in)
--   - public.profiles exists with data (this script only ALTERs it; never DROP/CREATE profiles)
--
-- Idempotent patterns:
--   - CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS
--   - CREATE OR REPLACE for all functions
--   - DROP TRIGGER IF EXISTS before CREATE TRIGGER
--   - DROP POLICY IF EXISTS before CREATE POLICY (where re-run matters)
--
-- Order: extensions → profiles columns → tables → indexes → functions →
--         grants → triggers → RLS policies → storage → seed data
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) public.profiles — extend existing table only (never drop/recreate)
--    Tier values are not DB-enforced; validate tier in application code.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
  ) then
    alter table public.profiles add column email text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    alter table public.profiles add column full_name text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_url'
  ) then
    alter table public.profiles add column avatar_url text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'tier'
  ) then
    alter table public.profiles add column tier text not null default 'bookworm';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'credit_balance'
  ) then
    alter table public.profiles add column credit_balance integer not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'streak_count'
  ) then
    alter table public.profiles add column streak_count integer not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'streak_goal'
  ) then
    alter table public.profiles add column streak_goal integer not null default 1;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'genesis_badge'
  ) then
    alter table public.profiles add column genesis_badge boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'alpha_lab_access'
  ) then
    alter table public.profiles add column alpha_lab_access boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'last_streak_date'
  ) then
    alter table public.profiles add column last_streak_date date;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'created_at'
  ) then
    alter table public.profiles add column created_at timestamptz not null default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'updated_at'
  ) then
    alter table public.profiles add column updated_at timestamptz not null default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'plan_selection_completed'
  ) then
    alter table public.profiles add column plan_selection_completed boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'prelaunch_holding'
  ) then
    alter table public.profiles add column prelaunch_holding boolean not null default true;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'first_prelaunch_purchase_at'
  ) then
    alter table public.profiles add column first_prelaunch_purchase_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'prelaunch_cancelled_at'
  ) then
    alter table public.profiles add column prelaunch_cancelled_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'checkout_email_verified_at'
  ) then
    alter table public.profiles add column checkout_email_verified_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'genesis_slot_price_point'
  ) then
    alter table public.profiles add column genesis_slot_price_point text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'genesis_lifetime_discount'
  ) then
    alter table public.profiles add column genesis_lifetime_discount boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'billing_plan'
  ) then
    alter table public.profiles add column billing_plan text not null default 'free';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'dodo_customer_id'
  ) then
    alter table public.profiles add column dodo_customer_id text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'token_balance'
  ) then
    alter table public.profiles add column token_balance integer not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'subscription_status'
  ) then
    alter table public.profiles add column subscription_status text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'subscription_period_end'
  ) then
    alter table public.profiles add column subscription_period_end timestamptz;
  end if;
end $$;

-- Tier is validated in application code, not in the database
do $$
begin
  if exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'profiles'
      and con.conname = 'profiles_tier_check'
  ) then
    alter table public.profiles drop constraint profiles_tier_check;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'profiles' and c.conname = 'profiles_billing_plan_check'
  ) then
    alter table public.profiles
      add constraint profiles_billing_plan_check check (billing_plan in ('free', 'basic', 'pro', 'enterprise'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'profiles' and c.conname = 'profiles_subscription_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_subscription_status_check check (
        subscription_status is null or subscription_status in ('active', 'cancelled', 'past_due')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'profiles' and c.conname = 'profiles_genesis_slot_price_point_check'
  ) then
    alter table public.profiles
      add constraint profiles_genesis_slot_price_point_check check (
        genesis_slot_price_point is null or genesis_slot_price_point in ('80', '119', '176')
      );
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'plan_selection_completed'
  ) then
    execute $c$comment on column public.profiles.plan_selection_completed is
      'User explicitly confirmed Bookworm on pricing, or legacy backfill; paired with subscriptions/tier for billing gate.'$c$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'prelaunch_holding'
  ) then
    execute $c$comment on column public.profiles.prelaunch_holding is
      'v4 Phase 4: true until public launch — credits allocated but canvas gated in product.'$c$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'genesis_lifetime_discount'
  ) then
    execute $c$comment on column public.profiles.genesis_lifetime_discount is
      'v4 Phase 7 / PAY-08: 20% off standard Sage (and higher) renewals for Genesis holders — enforced at renewal pricing time.'$c$;
  end if;
end $$;

-- genesis_slots first (no FK to other app tables) — reserve/release use %rowtype at CREATE FUNCTION time
create table if not exists public.genesis_slots (
  id uuid primary key default gen_random_uuid(),
  price_point text not null,
  slots_total integer not null,
  slots_used integer not null default 0,
  created_at timestamptz not null default now(),
  unique (price_point)
);

-- ---------------------------------------------------------------------------
-- 2) Core tables (no legacy paddle_* names; Dodo-ready column names)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.sandboxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Untitled Sandbox',
  pdf_filename text,
  pdf_url text,
  pdf_text text,
  page_count integer,
  read_only boolean not null default false,
  created_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table if not exists public.sandbox_content (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  page_number integer not null,
  page_text text not null,
  created_at timestamptz not null default now(),
  unique (sandbox_id, page_number)
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('source', 'lens', 'connector', 'evidence', 'mastery', 'freestyle')),
  content jsonb not null default '{}',
  position_x float not null default 0,
  position_y float not null default 0,
  width float not null default 200,
  height float not null default 100,
  color text not null default '#ffffff',
  shape text not null default 'rectangle',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connectors (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_block_id uuid not null references public.blocks (id) on delete cascade,
  target_block_id uuid not null references public.blocks (id) on delete cascade,
  link_type text not null check (link_type in ('relationship', 'contrast', 'cause_and_effect')),
  ai_analysis text,
  created_at timestamptz not null default now()
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  page_number integer not null,
  start_offset integer not null,
  end_offset integer not null,
  color text not null default 'yellow',
  text_content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  page_number integer not null,
  position_y float not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'source_upload',
      'library_activation',
      'lens_activation',
      'entity_extract_confirm',
      'evidence_anchor',
      'evidence_micro_search',
      'connector_ai_analysis',
      'mastery_blitz',
      'study_chat',
      'freestyle_prompt',
      'boost_pack_purchase',
      'monthly_renewal',
      'manual_adjustment'
    )
  ),
  credits_used integer not null,
  credits_before integer not null,
  credits_after integer not null,
  sandbox_id uuid references public.sandboxes (id) on delete set null,
  metadata jsonb not null default '{}',
  idempotency_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.mastery_sessions (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('normal', 'hard', 'ranking')),
  score integer,
  total_questions integer,
  completed boolean not null default false,
  answers jsonb not null default '[]',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

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

-- Constraint + seed for genesis_slots (table created earlier in this script)
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'genesis_slots'
  ) then
    return;
  end if;

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
    alter table public.genesis_slots
      add constraint genesis_slots_price_point_check check (price_point in ('80', '119', '176'));
  end if;

  insert into public.genesis_slots (price_point, slots_total, slots_used)
  values ('80', 50, 0), ('119', 150, 0), ('176', 100000, 0)
  on conflict (price_point) do nothing;
end $$;

create table if not exists public.dodo_webhook_dedup (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

create table if not exists public.provider_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  provider_payment_id text unique,
  provider_customer_id text,
  customer_email text,
  product_kind text,
  event_id text,
  amount_minor integer,
  currency text,
  status text not null default 'completed',
  reconciled boolean not null default false,
  raw_custom_data jsonb not null default '{}'::jsonb,
  recovery_stage smallint not null default 0,
  recovery_last_sent_at timestamptz,
  support_alert_7d_sent_at timestamptz,
  auto_refund_30d_at timestamptz,
  auto_refund_30d_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  to_email text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_passthrough (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  expected_checkout_email text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_admin_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor text,
  user_id uuid references public.profiles (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_refund_attempts (
  id uuid primary key default gen_random_uuid(),
  provider_payment_id text not null,
  reason text not null,
  status text not null,
  http_status int,
  response_excerpt text,
  created_at timestamptz not null default now(),
  unique (provider_payment_id, reason)
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

create table if not exists public.ai_document_chunks (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id text not null,
  chunk_id text not null,
  page_number integer not null,
  paragraph_index integer not null default 0,
  source_title text,
  chunk_text text not null,
  token_estimate integer,
  start_char integer,
  end_char integer,
  embedding real[],
  created_at timestamptz not null default now(),
  unique (sandbox_id, document_id, chunk_id)
);

comment on column public.provider_transactions.recovery_stage is
  'EC-04 Email 1.5 staging: 0 none, 1 first recovery (>=6h), 2 second (>=24h), 3 support path, 4 refund attempted.';

-- ---------------------------------------------------------------------------
-- 3) Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_sandboxes_user on public.sandboxes (user_id) where is_deleted = false;
create index if not exists idx_sandbox_content_sandbox on public.sandbox_content (sandbox_id);
create index if not exists idx_blocks_sandbox on public.blocks (sandbox_id);
create index if not exists idx_connectors_sandbox on public.connectors (sandbox_id);
create index if not exists idx_highlights_sandbox on public.highlights (sandbox_id);
create index if not exists idx_notes_sandbox on public.notes (sandbox_id);
create unique index if not exists credit_events_user_idempot
  on public.credit_events (user_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists idx_credit_events_user on public.credit_events (user_id, created_at desc);
create index if not exists idx_mastery_sessions_user on public.mastery_sessions (user_id);
create index if not exists idx_subscriptions_user on public.subscriptions (user_id);
create index if not exists idx_paddle_tx_user on public.provider_transactions (user_id);
create index if not exists idx_paddle_tx_email on public.provider_transactions (lower(customer_email));
create index if not exists idx_paddle_tx_reconciled on public.provider_transactions (reconciled) where reconciled = false;
create index if not exists idx_email_outbox_pending on public.email_outbox (created_at) where sent_at is null;
create index if not exists idx_checkout_pass_user on public.checkout_passthrough (user_id);
create index if not exists idx_billing_refund_reason on public.billing_refund_attempts (reason, created_at desc);
create index if not exists idx_ai_document_chunks_sandbox_doc on public.ai_document_chunks (sandbox_id, document_id);
create index if not exists idx_user_plans_subscription_id on public.user_plans (subscription_id)
  where subscription_id is not null;

-- ---------------------------------------------------------------------------
-- 4) Functions (dependencies first — before triggers / other functions)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.apply_bookworm_readonly_overflow(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ranked as (
    select id, row_number() over (order by created_at asc) as rn
    from public.sandboxes
    where user_id = p_user_id and is_deleted = false
  )
  update public.sandboxes s
  set read_only = true
  from ranked r
  where s.id = r.id and r.rn > 5;
end;
$$;

grant execute on function public.apply_bookworm_readonly_overflow(uuid) to service_role;

create or replace function public.enforce_bookworm_sandbox_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count int;
  t text;
begin
  if tg_op = 'INSERT' and new.is_deleted = false then
    select tier into t from public.profiles where id = new.user_id;
    if t = 'bookworm' then
      select count(*) into active_count
      from public.sandboxes s
      where s.user_id = new.user_id and s.is_deleted = false;
      if active_count >= 5 then
        raise exception 'SANDBOX_LIMIT_BOOKWORM' using errcode = 'P0001';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.apply_credit_ledger(
  p_user_id uuid,
  p_event_type text,
  p_credits_delta integer,
  p_sandbox_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bal int;
  new_bal int;
  spend int;
begin
  if auth.role() <> 'service_role' then
    if uid is null or uid <> p_user_id then
      raise exception 'NOT_ALLOWED';
    end if;
    if p_credits_delta > 0 then
      raise exception 'NOT_ALLOWED';
    end if;
  end if;

  if p_idempotency_key is not null then
    if exists (
      select 1 from public.credit_events e
      where e.user_id = p_user_id and e.idempotency_key = p_idempotency_key
    ) then
      select credit_balance into bal from public.profiles where id = p_user_id;
      return jsonb_build_object('ok', true, 'duplicate', true, 'credit_balance', bal);
    end if;
  end if;

  select credit_balance into bal from public.profiles where id = p_user_id for update;
  if bal is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  new_bal := bal + p_credits_delta;
  if new_bal < 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', 'Insufficient credits. Please purchase a Boost Pack to continue.'
    );
  end if;

  spend := abs(p_credits_delta);

  update public.profiles set credit_balance = new_bal, updated_at = now() where id = p_user_id;

  insert into public.credit_events (
    user_id, event_type, credits_used, credits_before, credits_after, sandbox_id, metadata, idempotency_key
  ) values (
    p_user_id,
    p_event_type,
    spend,
    bal,
    new_bal,
    p_sandbox_id,
    coalesce(p_metadata, '{}'::jsonb),
    p_idempotency_key
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'credit_balance', new_bal);
end;
$$;

grant execute on function public.apply_credit_ledger(uuid, text, integer, uuid, jsonb, text) to authenticated, service_role;

create or replace function public.touch_reader_streak(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (timezone('utc', now()))::date;
  last_d date;
  streak int;
  goal int;
begin
  if auth.role() <> 'service_role' and (uid is null or uid <> p_user_id) then
    raise exception 'NOT_ALLOWED';
  end if;

  select last_streak_date, streak_count, streak_goal
  into last_d, streak, goal
  from public.profiles where id = p_user_id for update;

  if last_d is null then
    streak := 1;
  elsif last_d = today then
    null;
  elsif last_d = today - 1 then
    streak := streak + 1;
  else
    streak := 1;
  end if;

  update public.profiles
  set last_streak_date = today,
      streak_count = streak,
      updated_at = now()
  where id = p_user_id;

  return jsonb_build_object('ok', true, 'streak_count', streak, 'streak_goal', goal);
end;
$$;

grant execute on function public.touch_reader_streak(uuid) to authenticated, service_role;

create or replace function public.reserve_genesis_slot(p_price_point text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row_rec public.genesis_slots%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into row_rec from public.genesis_slots where price_point = p_price_point for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;
  if row_rec.slots_used >= row_rec.slots_total then
    return jsonb_build_object('ok', false, 'reason', 'SOLD_OUT');
  end if;

  update public.genesis_slots
  set slots_used = slots_used + 1
  where price_point = p_price_point;

  return jsonb_build_object('ok', true, 'slots_used', row_rec.slots_used + 1, 'slots_total', row_rec.slots_total);
end;
$$;

grant execute on function public.reserve_genesis_slot(text) to service_role;

create or replace function public.release_genesis_slot(p_price_point text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row_rec public.genesis_slots%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into row_rec from public.genesis_slots where price_point = p_price_point for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;
  if row_rec.slots_used <= 0 then
    return jsonb_build_object('ok', true, 'slots_used', 0);
  end if;

  update public.genesis_slots
  set slots_used = slots_used - 1
  where price_point = p_price_point;

  return jsonb_build_object('ok', true, 'slots_used', row_rec.slots_used - 1, 'slots_total', row_rec.slots_total);
end;
$$;

grant execute on function public.release_genesis_slot(text) to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, credit_balance)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    0
  );
  return new;
exception
  when unique_violation then
    return new;
end;
$$;

create or replace function public.finalize_public_launch()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'NOT_ALLOWED';
  end if;
  insert into public.app_settings (key, value, updated_at)
  values ('public_launch', '{"complete": true}'::jsonb, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  update public.profiles set prelaunch_holding = false, updated_at = now();
end;
$$;

grant execute on function public.finalize_public_launch() to service_role;

create or replace function public.profiles_enforce_locked_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.tier is distinct from old.tier
     or new.credit_balance is distinct from old.credit_balance
     or new.genesis_badge is distinct from old.genesis_badge
     or new.alpha_lab_access is distinct from old.alpha_lab_access
     or new.prelaunch_holding is distinct from old.prelaunch_holding
     or new.first_prelaunch_purchase_at is distinct from old.first_prelaunch_purchase_at
     or new.prelaunch_cancelled_at is distinct from old.prelaunch_cancelled_at
     or new.checkout_email_verified_at is distinct from old.checkout_email_verified_at
     or new.genesis_slot_price_point is distinct from old.genesis_slot_price_point
     or new.genesis_lifetime_discount is distinct from old.genesis_lifetime_discount
  then
    raise exception 'PROFILE_PROTECTED_FIELDS';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Triggers (DROP IF EXISTS first)
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists trg_profiles_lock on public.profiles;
create trigger trg_profiles_lock
  before update on public.profiles
  for each row execute function public.profiles_enforce_locked_columns();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_blocks_updated on public.blocks;
create trigger trg_blocks_updated before update on public.blocks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_notes_updated on public.notes;
create trigger trg_notes_updated before update on public.notes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_plans_updated on public.user_plans;
create trigger trg_user_plans_updated
  before update on public.user_plans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_sandbox_limit on public.sandboxes;
create trigger trg_sandbox_limit
  before insert on public.sandboxes
  for each row execute function public.enforce_bookworm_sandbox_limit();

-- ---------------------------------------------------------------------------
-- 6) Row level security + policies
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles' and not c.relrowsecurity
  ) then
    alter table public.profiles enable row level security;
  end if;
end $$;

alter table public.sandboxes enable row level security;
alter table public.sandbox_content enable row level security;
alter table public.blocks enable row level security;
alter table public.connectors enable row level security;
alter table public.highlights enable row level security;
alter table public.notes enable row level security;
alter table public.credit_events enable row level security;
alter table public.mastery_sessions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.dodo_webhook_dedup enable row level security;
alter table public.ai_document_chunks enable row level security;
alter table public.user_plans enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

drop policy if exists sandboxes_select on public.sandboxes;
create policy sandboxes_select on public.sandboxes
  for select using (auth.uid() = user_id and is_deleted = false);
drop policy if exists sandboxes_insert on public.sandboxes;
create policy sandboxes_insert on public.sandboxes
  for insert with check (auth.uid() = user_id);
drop policy if exists sandboxes_update on public.sandboxes;
create policy sandboxes_update on public.sandboxes
  for update using (auth.uid() = user_id and is_deleted = false);
drop policy if exists sandboxes_delete on public.sandboxes;
create policy sandboxes_delete on public.sandboxes
  for delete using (auth.uid() = user_id);

drop policy if exists sandbox_content_all on public.sandbox_content;
create policy sandbox_content_all on public.sandbox_content for all using (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
);

drop policy if exists blocks_all on public.blocks;
create policy blocks_all on public.blocks for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists connectors_all on public.connectors;
create policy connectors_all on public.connectors for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists highlights_all on public.highlights;
create policy highlights_all on public.highlights for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists notes_all on public.notes;
create policy notes_all on public.notes for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists credit_events_select on public.credit_events;
create policy credit_events_select on public.credit_events for select using (auth.uid() = user_id);

drop policy if exists mastery_select on public.mastery_sessions;
create policy mastery_select on public.mastery_sessions for select using (auth.uid() = user_id);
drop policy if exists mastery_insert on public.mastery_sessions;
create policy mastery_insert on public.mastery_sessions for insert with check (auth.uid() = user_id);
drop policy if exists mastery_update on public.mastery_sessions;
create policy mastery_update on public.mastery_sessions for update using (auth.uid() = user_id);

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions for select using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'genesis_slots'
  ) then
    return;
  end if;

  alter table public.genesis_slots enable row level security;
  drop policy if exists genesis_slots_read on public.genesis_slots;
  create policy genesis_slots_read on public.genesis_slots for select to authenticated using (true);
end $$;

drop policy if exists ai_document_chunks_all on public.ai_document_chunks;
create policy ai_document_chunks_all on public.ai_document_chunks for all using (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
);

drop policy if exists user_plans_select_own on public.user_plans;
create policy user_plans_select_own on public.user_plans
  for select to authenticated
  using (auth.uid() = user_id);

-- PostgREST / supabase-js: table privileges (RLS still applies)
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.sandboxes to authenticated;
grant select, insert, update, delete on public.sandbox_content to authenticated;
grant select, insert, update, delete on public.blocks to authenticated;
grant select, insert, update, delete on public.connectors to authenticated;
grant select, insert, update, delete on public.highlights to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select on public.credit_events to authenticated;
grant select, insert, update on public.mastery_sessions to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on public.ai_document_chunks to authenticated;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'genesis_slots'
  ) then
    return;
  end if;

  grant select on table public.genesis_slots to authenticated;
end $$;

grant all on table public.profiles to service_role;
grant all on table public.sandboxes to service_role;
grant all on table public.sandbox_content to service_role;
grant all on table public.blocks to service_role;
grant all on table public.connectors to service_role;
grant all on table public.highlights to service_role;
grant all on table public.notes to service_role;
grant all on table public.credit_events to service_role;
grant all on table public.mastery_sessions to service_role;
grant all on table public.subscriptions to service_role;
grant all on table public.dodo_webhook_dedup to service_role;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'genesis_slots'
  ) then
    return;
  end if;

  grant all on table public.genesis_slots to service_role;
end $$;
grant all on table public.app_settings to service_role;
grant all on table public.provider_transactions to service_role;
grant all on table public.email_outbox to service_role;
grant all on table public.checkout_passthrough to service_role;
grant all on table public.billing_admin_actions to service_role;
grant all on table public.billing_refund_attempts to service_role;
grant all on table public.user_plans to service_role;
grant all on table public.ai_document_chunks to service_role;

-- ---------------------------------------------------------------------------
-- 7) Service-role tables (no user policies)
-- ---------------------------------------------------------------------------
revoke all on public.app_settings from anon, authenticated;
grant all on public.app_settings to service_role;

revoke all on public.provider_transactions from anon, authenticated;
grant all on public.provider_transactions to service_role;

revoke all on public.email_outbox from anon, authenticated;
grant all on public.email_outbox to service_role;

revoke all on public.checkout_passthrough from anon, authenticated;
grant all on public.checkout_passthrough to service_role;

revoke all on public.billing_admin_actions from anon, authenticated;
grant all on public.billing_admin_actions to service_role;

revoke all on public.billing_refund_attempts from anon, authenticated;
grant all on public.billing_refund_attempts to service_role;

revoke all on public.user_plans from anon;
grant select on public.user_plans to authenticated;
grant all on public.user_plans to service_role;

-- ---------------------------------------------------------------------------
-- 8) Storage buckets + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pdfs',
  'pdfs',
  false,
  52428800,
  array['application/pdf', 'application/epub+zip']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists pdfs_insert_own on storage.objects;
create policy pdfs_insert_own on storage.objects for insert to authenticated
with check (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);
drop policy if exists pdfs_select_own on storage.objects;
create policy pdfs_select_own on storage.objects for select to authenticated
using (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);
drop policy if exists pdfs_update_own on storage.objects;
create policy pdfs_update_own on storage.objects for update to authenticated
using (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);
drop policy if exists pdfs_delete_own on storage.objects;
create policy pdfs_delete_own on storage.objects for delete to authenticated
using (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
drop policy if exists avatars_select_public on storage.objects;
create policy avatars_select_public on storage.objects for select
using (bucket_id = 'avatars');
drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ---------------------------------------------------------------------------
-- 9) Seed / backfill
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value)
values ('public_launch', '{"complete": false}'::jsonb)
on conflict (key) do nothing;

update public.profiles
set plan_selection_completed = true
where plan_selection_completed is not distinct from false;

update public.profiles
set billing_plan = case tier
  when 'genesis' then 'enterprise'
  when 'bibliophile' then 'pro'
  when 'bookworm' then 'basic'
  else billing_plan
end
where tier is not null;
