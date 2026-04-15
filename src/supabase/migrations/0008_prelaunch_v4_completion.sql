-- Pre-Launch v4 completion: Genesis discount flag, orphan recovery stages, refund idempotency, profile lock updates.

alter table public.profiles
  add column if not exists genesis_lifetime_discount boolean not null default false;

comment on column public.profiles.genesis_lifetime_discount is
  'v4 Phase 7 / PAY-08: 20% off standard Sage (and higher) renewals for Genesis holders — enforced at renewal pricing time.';

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
