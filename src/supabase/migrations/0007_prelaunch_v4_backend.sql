-- Pre-Launch User Flow v4 — backend tables, profile flags, Genesis release, cron helpers.

-- ---------------------------------------------------------------------------
-- Global launch switch (Phase 5 — when true, canvas unlocks for everyone)
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
-- profiles — pre-launch holding & purchase audit (service_role updates only)
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
  'v4 Phase 4: true until public launch — credits allocated but canvas gated in product.';

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
-- Email queue (Email 0–4 registry — worker or manual send from ops)
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
-- Checkout passthrough (EC-05 — bind Paddle email to Supabase user)
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
-- Release Genesis slot (refund / cancel — EC-07)
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
