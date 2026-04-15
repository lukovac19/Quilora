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
create table public.profiles (
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

create index idx_profiles_email on public.profiles (email);

-- ---------------------------------------------------------------------------
-- sandboxes (+ read_only for downgrade flow beyond 5th sandbox)
-- ---------------------------------------------------------------------------
create table public.sandboxes (
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

create index idx_sandboxes_user on public.sandboxes (user_id) where is_deleted = false;

-- ---------------------------------------------------------------------------
-- sandbox_content (per-page text for reading mode; RLS via sandbox ownership)
-- ---------------------------------------------------------------------------
create table public.sandbox_content (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  page_number integer not null,
  page_text text not null,
  created_at timestamptz not null default now(),
  unique (sandbox_id, page_number)
);

create index idx_sandbox_content_sandbox on public.sandbox_content (sandbox_id);

-- ---------------------------------------------------------------------------
-- blocks, connectors, highlights, notes
-- ---------------------------------------------------------------------------
create table public.blocks (
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

create index idx_blocks_sandbox on public.blocks (sandbox_id);

create table public.connectors (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_block_id uuid not null references public.blocks (id) on delete cascade,
  target_block_id uuid not null references public.blocks (id) on delete cascade,
  link_type text not null check (link_type in ('relationship', 'contrast', 'cause_and_effect')),
  ai_analysis text,
  created_at timestamptz not null default now()
);

create index idx_connectors_sandbox on public.connectors (sandbox_id);

create table public.highlights (
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

create index idx_highlights_sandbox on public.highlights (sandbox_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  page_number integer not null,
  position_y float not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notes_sandbox on public.notes (sandbox_id);

-- ---------------------------------------------------------------------------
-- credit_events, mastery_sessions, subscriptions, genesis_slots
-- ---------------------------------------------------------------------------
create table public.credit_events (
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

create index idx_credit_events_user on public.credit_events (user_id, created_at desc);

create table public.mastery_sessions (
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

create index idx_mastery_sessions_user on public.mastery_sessions (user_id);

create table public.subscriptions (
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

create index idx_subscriptions_user on public.subscriptions (user_id);

create table public.genesis_slots (
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
create table public.paddle_webhook_dedup (
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
