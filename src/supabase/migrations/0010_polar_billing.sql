-- Polar billing extensions (keeps legacy Paddle columns for historical rows).

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('active', 'cancelled', 'past_due', 'incomplete', 'unpaid'));

alter table public.subscriptions
  add column if not exists polar_customer_id text,
  add column if not exists polar_subscription_id text,
  add column if not exists polar_product_id text,
  add column if not exists internal_plan_key text,
  add column if not exists is_lifetime boolean not null default false,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists billing_provider text not null default 'paddle';

create index if not exists idx_subscriptions_polar_subscription
  on public.subscriptions (polar_subscription_id)
  where polar_subscription_id is not null;

create index if not exists idx_subscriptions_polar_customer
  on public.subscriptions (polar_customer_id)
  where polar_customer_id is not null;

create table if not exists public.customer_billing_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  polar_customer_id text,
  updated_at timestamptz not null default now()
);

alter table public.customer_billing_profiles enable row level security;

create policy customer_billing_profiles_select_own
  on public.customer_billing_profiles for select
  using (auth.uid() = user_id);

create table if not exists public.polar_webhook_events (
  id uuid primary key default gen_random_uuid(),
  polar_event_id text not null unique,
  event_type text not null,
  received_at timestamptz not null default now(),
  processing_error text
);

create table if not exists public.billing_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  polar_order_id text not null unique,
  internal_plan_key text,
  polar_product_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_orders_user on public.billing_orders (user_id);
