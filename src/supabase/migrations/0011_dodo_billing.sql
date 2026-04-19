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
