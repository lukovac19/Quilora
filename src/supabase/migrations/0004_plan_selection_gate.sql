-- EP-02: block app access until plan is chosen or paid subscription is active.
alter table public.profiles
  add column if not exists plan_selection_completed boolean not null default false;

comment on column public.profiles.plan_selection_completed is
  'User explicitly confirmed Bookworm on pricing, or legacy backfill; paired with subscriptions/tier for billing gate.';

-- One-time: existing accounts keep access (new signups default false from handle_new_user omitting column).
update public.profiles
set plan_selection_completed = true
where plan_selection_completed is not distinct from false;
