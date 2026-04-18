-- Provider-neutral billing columns + rename legacy Paddle tables/columns.
-- Run after 0010_polar_billing.sql.

-- Subscriptions: merge legacy Paddle external ids into Polar columns, then drop Paddle columns.
update public.subscriptions s
set
  polar_customer_id = coalesce(s.polar_customer_id, s.paddle_customer_id),
  polar_subscription_id = coalesce(s.polar_subscription_id, s.paddle_subscription_id)
where s.paddle_customer_id is not null
   or s.paddle_subscription_id is not null;

alter table public.subscriptions
  drop column if exists paddle_customer_id,
  drop column if exists paddle_subscription_id;

alter table public.subscriptions rename column polar_customer_id to billing_customer_id;
alter table public.subscriptions rename column polar_subscription_id to billing_subscription_id;
alter table public.subscriptions rename column polar_product_id to billing_product_id;

drop index if exists idx_subscriptions_polar_subscription;
drop index if exists idx_subscriptions_polar_customer;

create index if not exists idx_subscriptions_billing_subscription
  on public.subscriptions (billing_subscription_id)
  where billing_subscription_id is not null;

create index if not exists idx_subscriptions_billing_customer
  on public.subscriptions (billing_customer_id)
  where billing_customer_id is not null;

alter table public.subscriptions alter column billing_provider set default 'polar';

update public.subscriptions
set billing_provider = 'polar'
where billing_provider = 'paddle';

-- Customer billing profile
alter table public.customer_billing_profiles rename column polar_customer_id to billing_customer_id;

-- One-time order log
alter table public.billing_orders rename column polar_order_id to provider_order_id;
alter table public.billing_orders rename column polar_product_id to provider_product_id;

-- Prelaunch transaction audit trail (formerly paddle_transactions)
alter table public.paddle_transactions rename to billing_transactions;

alter table public.billing_transactions rename column paddle_transaction_id to external_transaction_id;
alter table public.billing_transactions rename column paddle_customer_id to external_customer_id;

drop index if exists idx_paddle_tx_user;
drop index if exists idx_paddle_tx_email;
drop index if exists idx_paddle_tx_reconciled;

create index if not exists idx_billing_tx_user on public.billing_transactions (user_id);
create index if not exists idx_billing_tx_email on public.billing_transactions (lower(customer_email));
create index if not exists idx_billing_tx_reconciled on public.billing_transactions (reconciled) where reconciled = false;

-- Refund idempotency
alter table public.billing_refund_attempts rename column paddle_transaction_id to external_transaction_id;

-- Paddle webhook dedup table no longer used (Polar uses polar_webhook_events).
drop table if exists public.paddle_webhook_dedup;
