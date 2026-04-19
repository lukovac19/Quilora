-- Harden new-user profile creation: idempotent insert + non-fatal failure so auth.users signup is not blocked
-- by unexpected constraint errors (still logged as warnings in Postgres).

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
  )
  on conflict (id) do nothing;
  return new;
exception
  when unique_violation then
    return new;
  when others then
    raise warning 'handle_new_user: profile insert failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;
