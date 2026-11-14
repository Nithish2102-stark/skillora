begin;

-- This migration assumes the Skillora schema migration has already been applied.
-- It changes privileges and policies only; it does not change table structure.

-- Remove inherited/public access before granting the least privilege required by
-- the frontend. RLS remains the row-level boundary for every table.
revoke all on table
  public.profiles,
  public.skills,
  public.learner_skills,
  public.certifications,
  public.projects,
  public.career_roles,
  public.career_required_skills,
  public.learner_career_goals,
  public.courses,
  public.course_modules,
  public.lessons,
  public.enrollments,
  public.learning_roadmaps,
  public.roadmap_phases,
  public.roadmap_items,
  public.assessments,
  public.assessment_attempts,
  public.learning_progress
from public;

revoke all on table
  public.profiles,
  public.skills,
  public.learner_skills,
  public.certifications,
  public.projects,
  public.career_roles,
  public.career_required_skills,
  public.learner_career_goals,
  public.courses,
  public.course_modules,
  public.lessons,
  public.enrollments,
  public.learning_roadmaps,
  public.roadmap_phases,
  public.roadmap_items,
  public.assessments,
  public.assessment_attempts,
  public.learning_progress
from anon;

-- Public catalogue data is readable but never writable from client roles.
grant select on table
  public.skills,
  public.career_roles,
  public.career_required_skills,
  public.courses,
  public.course_modules,
  public.lessons,
  public.assessments
to anon, authenticated;

-- Learner-owned data is available only to authenticated users; policies below
-- constrain every row to the current auth.uid().
grant select, insert, update, delete on table
  public.profiles,
  public.learner_skills,
  public.certifications,
  public.projects,
  public.learner_career_goals,
  public.enrollments,
  public.learning_roadmaps,
  public.roadmap_phases,
  public.roadmap_items,
  public.assessment_attempts,
  public.learning_progress
to authenticated;

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.learner_skills enable row level security;
alter table public.certifications enable row level security;
alter table public.projects enable row level security;
alter table public.career_roles enable row level security;
alter table public.career_required_skills enable row level security;
alter table public.learner_career_goals enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.learning_roadmaps enable row level security;
alter table public.roadmap_phases enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.learning_progress enable row level security;

-- Recreate the named policies idempotently so old broad/conflicting variants
-- cannot remain active alongside the corrected policies.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "skills_public_read" on public.skills;
create policy "skills_public_read" on public.skills for select to anon, authenticated using (true);

drop policy if exists "career_roles_public_read" on public.career_roles;
create policy "career_roles_public_read" on public.career_roles for select to anon, authenticated using (true);

drop policy if exists "career_required_skills_public_read" on public.career_required_skills;
create policy "career_required_skills_public_read" on public.career_required_skills for select to anon, authenticated using (true);

drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read" on public.courses for select to anon, authenticated using (is_active = true);

drop policy if exists "course_modules_public_read" on public.course_modules;
create policy "course_modules_public_read" on public.course_modules for select to anon, authenticated using (true);

drop policy if exists "lessons_public_read" on public.lessons;
create policy "lessons_public_read" on public.lessons for select to anon, authenticated using (true);

drop policy if exists "assessments_public_read" on public.assessments;
create policy "assessments_public_read" on public.assessments for select to anon, authenticated using (true);

drop policy if exists "learner_skills_own" on public.learner_skills;
create policy "learner_skills_own" on public.learner_skills for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "certifications_own" on public.certifications;
create policy "certifications_own" on public.certifications for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_own" on public.projects;
create policy "projects_own" on public.projects for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "career_goals_own" on public.learner_career_goals;
create policy "career_goals_own" on public.learner_career_goals for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "enrollments_own" on public.enrollments;
create policy "enrollments_own" on public.enrollments for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "roadmaps_own" on public.learning_roadmaps;
create policy "roadmaps_own" on public.learning_roadmaps for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "roadmap_phases_own" on public.roadmap_phases;
create policy "roadmap_phases_own" on public.roadmap_phases for all to authenticated
using (exists (
  select 1 from public.learning_roadmaps r
  where r.id = roadmap_id and r.user_id = auth.uid()
))
with check (exists (
  select 1 from public.learning_roadmaps r
  where r.id = roadmap_id and r.user_id = auth.uid()
));

drop policy if exists "roadmap_items_own" on public.roadmap_items;
create policy "roadmap_items_own" on public.roadmap_items for all to authenticated
using (exists (
  select 1
  from public.roadmap_phases p
  join public.learning_roadmaps r on r.id = p.roadmap_id
  where p.id = phase_id and r.user_id = auth.uid()
))
with check (exists (
  select 1
  from public.roadmap_phases p
  join public.learning_roadmaps r on r.id = p.roadmap_id
  where p.id = phase_id and r.user_id = auth.uid()
));

drop policy if exists "assessment_attempts_own" on public.assessment_attempts;
create policy "assessment_attempts_own" on public.assessment_attempts for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "learning_progress_own" on public.learning_progress;
create policy "learning_progress_own" on public.learning_progress for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keep signup profile creation secure and retry-safe.
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
