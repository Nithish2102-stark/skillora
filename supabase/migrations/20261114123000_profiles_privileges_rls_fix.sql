begin;

-- Keep unauthenticated clients out of learner profile data.
revoke all on table public.profiles from anon;

-- RLS remains the row-level boundary; these grants only make the
-- authenticated role eligible for the policies below.
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

alter table public.profiles enable row level security;

-- Keep signup profile creation owned by the trigger function, not by clients.
alter function public.handle_new_user()
  security definer
  set search_path = public;
revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end;
$$;

commit;
