-- =============================================================================
-- Quilora: ALL MIGRATIONS COMBINED (Supabase SQL Editor)
-- Order: 0001, 0002, 0003, 0004, 0005, 0006, 0007, 0008, 0009, 0011, 0012
-- Note: There is NO 0010_*.sql in this repository.
--
-- Idempotency (this combined file): all CREATE TABLE use IF NOT EXISTS; all
-- CREATE INDEX / CREATE UNIQUE INDEX use IF NOT EXISTS so re-runs skip objects
-- that already exist. Other statements (DROP, ALTER, policies, triggers) may
-- still need a clean DB or manual conflict resolution.
-- =============================================================================


-- =============================================================================
-- FILE: 0001_backend_foundation.sql
-- =============================================================================

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



-- =============================================================================
-- FILE: 0002_quilora_complete_schema.sql
-- =============================================================================

-- Quilora complete application schema (replaces legacy tables from 0001 where names conflict)
-- Run after 0001 or on fresh DB. Safe to re-run only if legacy tables exist (uses IF EXISTS drops).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Drop legacy objects from 0001 (dependency order)
-- ---------------------------------------------------------------------------
drop table if exists sandbox_connectors cascade;
drop table if exists sandbox_blocks cascade;
drop table if exists sandbox_content cascade;
drop table if exists mastery_runs cascade;
drop table if exists study_sessions cascade;
drop table if exists credit_ledger cascade;
drop table if exists payment_events cascade;
drop table if exists subscriptions cascade;
drop table if exists genesis_slot_inventory cascade;
drop table if exists sandboxes cascade;
drop table if exists user_profiles cascade;
drop type if exists credit_event_type cascade;
drop type if exists payment_status cascade;
drop type if exists payment_provider cascade;
drop type if exists quilora_tier cascade;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  tier text not null default 'bookworm' check (tier in ('bookworm', 'bibliophile', 'genesis')),
  credit_balance integer not null default 0,
  streak_count integer not null default 0,
  streak_goal integer not null default 1,
  genesis_badge boolean not null default false,
  alpha_lab_access boolean not null default false,
  last_streak_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles (email);

-- ---------------------------------------------------------------------------
-- sandboxes (+ read_only for downgrade flow beyond 5th sandbox)
-- ---------------------------------------------------------------------------
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

create index if not exists idx_sandboxes_user on public.sandboxes (user_id) where is_deleted = false;

-- ---------------------------------------------------------------------------
-- sandbox_content (per-page text for reading mode; RLS via sandbox ownership)
-- ---------------------------------------------------------------------------
create table if not exists public.sandbox_content (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  page_number integer not null,
  page_text text not null,
  created_at timestamptz not null default now(),
  unique (sandbox_id, page_number)
);

create index if not exists idx_sandbox_content_sandbox on public.sandbox_content (sandbox_id);

-- ---------------------------------------------------------------------------
-- blocks, connectors, highlights, notes
-- ---------------------------------------------------------------------------
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

create index if not exists idx_blocks_sandbox on public.blocks (sandbox_id);

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

create index if not exists idx_connectors_sandbox on public.connectors (sandbox_id);

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

create index if not exists idx_highlights_sandbox on public.highlights (sandbox_id);

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

create index if not exists idx_notes_sandbox on public.notes (sandbox_id);

-- ---------------------------------------------------------------------------
-- credit_events, mastery_sessions, subscriptions, genesis_slots
-- ---------------------------------------------------------------------------
create table if not exists public.credit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'source_upload',
      'library_activation',
      'lens_activation',
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

create unique index if not exists credit_events_user_idempot
  on public.credit_events (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_credit_events_user on public.credit_events (user_id, created_at desc);

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

create index if not exists idx_mastery_sessions_user on public.mastery_sessions (user_id);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  paddle_subscription_id text,
  paddle_customer_id text,
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

create table if not exists public.genesis_slots (
  id uuid primary key default gen_random_uuid(),
  price_point text not null check (price_point in ('80', '119')),
  slots_total integer not null,
  slots_used integer not null default 0,
  created_at timestamptz not null default now(),
  unique (price_point)
);

insert into public.genesis_slots (price_point, slots_total, slots_used)
values ('80', 50, 0), ('119', 150, 0)
on conflict (price_point) do nothing;

-- ---------------------------------------------------------------------------
-- Auth: auto-create profile
-- ---------------------------------------------------------------------------
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
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    0
  );
  return new;
exception
  when unique_violation then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Profile sensitive columns (block direct client updates)
-- ---------------------------------------------------------------------------
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
  then
    raise exception 'PROFILE_PROTECTED_FIELDS';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_lock on public.profiles;
create trigger trg_profiles_lock
  before update on public.profiles
  for each row execute function public.profiles_enforce_locked_columns();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_blocks_updated before update on public.blocks
  for each row execute function public.set_updated_at();

create trigger trg_notes_updated before update on public.notes
  for each row execute function public.set_updated_at();

create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sandbox limit (bookworm: max 5 active sandboxes)
-- ---------------------------------------------------------------------------
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

drop trigger if exists trg_sandbox_limit on public.sandboxes;
create trigger trg_sandbox_limit
  before insert on public.sandboxes
  for each row execute function public.enforce_bookworm_sandbox_limit();

-- ---------------------------------------------------------------------------
-- Credit ledger RPC (atomic; users may only spend; service_role may grant)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Streak: call when opening a sandbox
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Genesis slot reservation (atomic)
-- ---------------------------------------------------------------------------
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

grant execute on function public.apply_bookworm_readonly_overflow(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Bibliophile downgrade: mark excess sandboxes read-only
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.sandboxes enable row level security;
alter table public.sandbox_content enable row level security;
alter table public.blocks enable row level security;
alter table public.connectors enable row level security;
alter table public.highlights enable row level security;
alter table public.notes enable row level security;
alter table public.credit_events enable row level security;
alter table public.mastery_sessions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.genesis_slots enable row level security;

-- profiles
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

-- sandboxes (hide soft-deleted)
create policy sandboxes_select on public.sandboxes
  for select using (auth.uid() = user_id and is_deleted = false);
create policy sandboxes_insert on public.sandboxes
  for insert with check (auth.uid() = user_id);
create policy sandboxes_update on public.sandboxes
  for update using (auth.uid() = user_id and is_deleted = false);
create policy sandboxes_delete on public.sandboxes
  for delete using (auth.uid() = user_id);

-- sandbox_content
create policy sandbox_content_all on public.sandbox_content for all using (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
);

-- blocks
create policy blocks_all on public.blocks for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- connectors
create policy connectors_all on public.connectors for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- highlights
create policy highlights_all on public.highlights for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- notes
create policy notes_all on public.notes for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- credit_events: read-only for users
create policy credit_events_select on public.credit_events for select using (auth.uid() = user_id);

-- mastery_sessions
create policy mastery_select on public.mastery_sessions for select using (auth.uid() = user_id);
create policy mastery_insert on public.mastery_sessions for insert with check (auth.uid() = user_id);
create policy mastery_update on public.mastery_sessions for update using (auth.uid() = user_id);

-- subscriptions: read-only user
create policy subscriptions_select on public.subscriptions for select using (auth.uid() = user_id);

-- genesis_slots: read for authenticated
create policy genesis_slots_read on public.genesis_slots for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Webhook idempotency (service role only; no user policies)
-- ---------------------------------------------------------------------------
create table if not exists public.paddle_webhook_dedup (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.paddle_webhook_dedup enable row level security;

-- ---------------------------------------------------------------------------
-- Storage bucket policies (bucket must be created in dashboard or via storage)
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

create policy pdfs_insert_own on storage.objects for insert to authenticated
with check (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy pdfs_select_own on storage.objects for select to authenticated
using (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy pdfs_update_own on storage.objects for update to authenticated
using (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy pdfs_delete_own on storage.objects for delete to authenticated
using (
  bucket_id = 'pdfs'
  and split_part(name, '/', 1) = auth.uid()::text
);


-- =============================================================================
-- FILE: 0003_avatars_bucket.sql
-- =============================================================================

-- Public avatars for profile photos (path: {user_id}/{filename})
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

drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_select_public on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

create policy avatars_insert_own on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy avatars_select_public on storage.objects for select
using (bucket_id = 'avatars');

create policy avatars_update_own on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy avatars_delete_own on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);


-- =============================================================================
-- FILE: 0004_plan_selection_gate.sql
-- =============================================================================

-- EP-02: block app access until plan is chosen or paid subscription is active.
alter table public.profiles
  add column if not exists plan_selection_completed boolean not null default false;

comment on column public.profiles.plan_selection_completed is
  'User explicitly confirmed Bookworm on pricing, or legacy backfill; paired with subscriptions/tier for billing gate.';

-- One-time: existing accounts keep access (new signups default false from handle_new_user omitting column).
update public.profiles
set plan_selection_completed = true
where plan_selection_completed is not distinct from false;


-- =============================================================================
-- FILE: 0005_credit_event_types_evidence.sql
-- =============================================================================

-- EP-06: allow credit ledger event types used by the app (evidence + entity extract).
alter table public.credit_events drop constraint if exists credit_events_event_type_check;
alter table public.credit_events add constraint credit_events_event_type_check check (
  event_type in (
    'source_upload',
    'library_activation',
    'lens_activation',
    'entity_extract_confirm',
    'evidence_anchor',
    'evidence_micro_search',
    'mastery_blitz',
    'study_chat',
    'freestyle_prompt',
    'boost_pack_purchase',
    'monthly_renewal',
    'manual_adjustment'
  )
);


-- =============================================================================
-- FILE: 0006_credit_connector_ai.sql
-- =============================================================================

alter table public.credit_events drop constraint if exists credit_events_event_type_check;
alter table public.credit_events add constraint credit_events_event_type_check check (
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
);


-- =============================================================================
-- FILE: 0007_prelaunch_v4_backend.sql
-- =============================================================================

-- Pre-Launch User Flow v4 â€” backend tables, profile flags, Genesis release, cron helpers.

-- ---------------------------------------------------------------------------
-- Global launch switch (Phase 5 â€” when true, canvas unlocks for everyone)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('public_launch', '{"complete": false}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- profiles â€” pre-launch holding & purchase audit (service_role updates only)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists prelaunch_holding boolean not null default true;

alter table public.profiles
  add column if not exists first_prelaunch_purchase_at timestamptz;

alter table public.profiles
  add column if not exists prelaunch_cancelled_at timestamptz;

alter table public.profiles
  add column if not exists checkout_email_verified_at timestamptz;

alter table public.profiles
  add column if not exists genesis_slot_price_point text check (genesis_slot_price_point is null or genesis_slot_price_point in ('80', '119'));

comment on column public.profiles.prelaunch_holding is
  'v4 Phase 4: true until public launch â€” credits allocated but canvas gated in product.';

-- ---------------------------------------------------------------------------
-- Paddle transaction log (reconciliation EC-04, webhook audit)
-- ---------------------------------------------------------------------------
create table if not exists public.paddle_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  paddle_transaction_id text unique,
  paddle_customer_id text,
  customer_email text,
  product_kind text,
  event_id text,
  amount_minor integer,
  currency text,
  status text not null default 'completed',
  reconciled boolean not null default false,
  raw_custom_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_paddle_tx_user on public.paddle_transactions (user_id);
create index if not exists idx_paddle_tx_email on public.paddle_transactions (lower(customer_email));
create index if not exists idx_paddle_tx_reconciled on public.paddle_transactions (reconciled) where reconciled = false;

-- ---------------------------------------------------------------------------
-- Email queue (Email 0â€“4 registry â€” worker or manual send from ops)
-- ---------------------------------------------------------------------------
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  to_email text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_outbox_pending on public.email_outbox (created_at) where sent_at is null;

-- ---------------------------------------------------------------------------
-- Checkout passthrough (EC-05 â€” bind Paddle email to Supabase user)
-- ---------------------------------------------------------------------------
create table if not exists public.checkout_passthrough (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  expected_checkout_email text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_checkout_pass_user on public.checkout_passthrough (user_id);

-- ---------------------------------------------------------------------------
-- Admin manual account link audit (EC-05 support panel)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_admin_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor text,
  user_id uuid references public.profiles (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lock new profile billing columns from client updates
-- ---------------------------------------------------------------------------
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
  then
    raise exception 'PROFILE_PROTECTED_FIELDS';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- genesis_slots (0007 — must exist before release_genesis_slot %rowtype)
-- ---------------------------------------------------------------------------
create table if not exists public.genesis_slots (
  id uuid primary key default gen_random_uuid(),
  price_point text not null,
  slots_total integer not null,
  slots_used integer not null default 0,
  created_at timestamptz not null default now(),
  unique (price_point)
);

-- ---------------------------------------------------------------------------
-- Release Genesis slot (refund / cancel â€” EC-07)
-- ---------------------------------------------------------------------------
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

revoke all on public.app_settings from anon, authenticated;
grant all on public.app_settings to service_role;

revoke all on public.paddle_transactions from anon, authenticated;
grant all on public.paddle_transactions to service_role;

revoke all on public.email_outbox from anon, authenticated;
grant all on public.email_outbox to service_role;

revoke all on public.checkout_passthrough from anon, authenticated;
grant all on public.checkout_passthrough to service_role;

revoke all on public.billing_admin_actions from anon, authenticated;
grant all on public.billing_admin_actions to service_role;


-- =============================================================================
-- FILE: 0008_prelaunch_v4_completion.sql
-- =============================================================================

-- Pre-Launch v4 completion: Genesis discount flag, orphan recovery stages, refund idempotency, profile lock updates.

alter table public.profiles
  add column if not exists genesis_lifetime_discount boolean not null default false;

comment on column public.profiles.genesis_lifetime_discount is
  'v4 Phase 7 / PAY-08: 20% off standard Sage (and higher) renewals for Genesis holders â€” enforced at renewal pricing time.';

alter table public.paddle_transactions
  add column if not exists recovery_stage smallint not null default 0;

alter table public.paddle_transactions
  add column if not exists recovery_last_sent_at timestamptz;

alter table public.paddle_transactions
  add column if not exists support_alert_7d_sent_at timestamptz;

alter table public.paddle_transactions
  add column if not exists auto_refund_30d_at timestamptz;

alter table public.paddle_transactions
  add column if not exists auto_refund_30d_error text;

comment on column public.paddle_transactions.recovery_stage is
  'EC-04 Email 1.5 staging: 0 none, 1 first recovery (>=6h), 2 second (>=24h), 3 support path, 4 refund attempted.';

-- Idempotent server-side refund attempts (Paddle adjustments, EC-04 / EC-08)
create table if not exists public.billing_refund_attempts (
  id uuid primary key default gen_random_uuid(),
  paddle_transaction_id text not null,
  reason text not null,
  status text not null,
  http_status int,
  response_excerpt text,
  created_at timestamptz not null default now(),
  unique (paddle_transaction_id, reason)
);

revoke all on public.billing_refund_attempts from anon, authenticated;
grant all on public.billing_refund_attempts to service_role;

create index if not exists idx_billing_refund_reason on public.billing_refund_attempts (reason, created_at desc);

-- Lock genesis_lifetime_discount from client tampering
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


-- =============================================================================
-- FILE: 0009_ai_document_chunks.sql
-- =============================================================================

-- Optional persistence for page-aware chunks + embeddings (server / worker ingestion).
-- The Quilora web client currently uses an in-memory vector store by default (`VITE_VECTOR_STORE_PROVIDER=memory`).
-- Enable this table when you run a background worker with `DATABASE_URL` to sync embeddings.

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

create index if not exists idx_ai_document_chunks_sandbox_doc on public.ai_document_chunks (sandbox_id, document_id);

alter table public.ai_document_chunks enable row level security;

create policy ai_document_chunks_all on public.ai_document_chunks for all using (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.sandboxes s where s.id = sandbox_id and s.user_id = auth.uid())
);


-- =============================================================================
-- FILE: 0011_dodo_billing.sql
-- =============================================================================

-- Dodo Payments: rename Paddle-specific columns/tables and add SaaS billing fields on profiles.

-- Webhook dedup
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'paddle_webhook_dedup'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dodo_webhook_dedup'
  ) THEN
    ALTER TABLE public.paddle_webhook_dedup RENAME TO dodo_webhook_dedup;
  END IF;
END $$;

-- Transaction log (provider-neutral)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'paddle_transactions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'provider_transactions'
  ) THEN
    ALTER TABLE public.paddle_transactions RENAME TO provider_transactions;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_transactions' AND column_name = 'paddle_transaction_id'
  ) THEN
    ALTER TABLE public.provider_transactions RENAME COLUMN paddle_transaction_id TO provider_payment_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_transactions' AND column_name = 'paddle_customer_id'
  ) THEN
    ALTER TABLE public.provider_transactions RENAME COLUMN paddle_customer_id TO provider_customer_id;
  END IF;
END $$;

-- subscriptions provider ids
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'paddle_subscription_id'
  ) THEN
    ALTER TABLE public.subscriptions RENAME COLUMN paddle_subscription_id TO provider_subscription_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'paddle_customer_id'
  ) THEN
    ALTER TABLE public.subscriptions RENAME COLUMN paddle_customer_id TO provider_customer_id;
  END IF;
END $$;

-- Refund audit column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'billing_refund_attempts' AND column_name = 'paddle_transaction_id'
  ) THEN
    ALTER TABLE public.billing_refund_attempts RENAME COLUMN paddle_transaction_id TO provider_payment_id;
  END IF;
END $$;

-- Profiles: plan / tokens / Dodo customer (subscription rows still hold provider_subscription_id)
alter table public.profiles
  add column if not exists billing_plan text not null default 'free'
    check (billing_plan in ('free', 'basic', 'pro', 'enterprise'));

alter table public.profiles
  add column if not exists dodo_customer_id text;

alter table public.profiles
  add column if not exists token_balance integer not null default 0;

alter table public.profiles
  add column if not exists subscription_status text
    check (subscription_status is null or subscription_status in ('active', 'cancelled', 'past_due'));

alter table public.profiles
  add column if not exists subscription_period_end timestamptz;

-- Backfill billing_plan from legacy tier (best-effort)
update public.profiles
set billing_plan = case tier
  when 'genesis' then 'enterprise'
  when 'bibliophile' then 'pro'
  when 'bookworm' then 'basic'
  else billing_plan
end
where tier is not null;


-- =============================================================================
-- FILE: 0012_user_plans.sql
-- =============================================================================

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

