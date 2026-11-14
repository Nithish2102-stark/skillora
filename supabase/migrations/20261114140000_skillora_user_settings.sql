begin;

-- Store preferences separately from learner profile and catalogue records.
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  location text,
  learning_pace text not null default 'balanced'
    check (learning_pace in ('relaxed', 'balanced', 'intensive')),
  daily_study_minutes integer not null default 30
    check (daily_study_minutes between 5 and 1440),
  learning_interests text[] not null default '{}',
  email_notifications boolean not null default true,
  in_app_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.set_updated_at();

revoke all on table public.user_settings from public, anon;
grant select, insert, update, delete on table public.user_settings to authenticated;

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
drop policy if exists "user_settings_insert_own" on public.user_settings;
drop policy if exists "user_settings_update_own" on public.user_settings;
drop policy if exists "user_settings_delete_own" on public.user_settings;

create policy "user_settings_select_own"
on public.user_settings for select to authenticated
using (auth.uid() = user_id);

create policy "user_settings_insert_own"
on public.user_settings for insert to authenticated
with check (auth.uid() = user_id);

create policy "user_settings_update_own"
on public.user_settings for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_settings_delete_own"
on public.user_settings for delete to authenticated
using (auth.uid() = user_id);

commit;
