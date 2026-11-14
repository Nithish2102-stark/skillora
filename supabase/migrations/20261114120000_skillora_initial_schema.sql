create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  education text,
  institution text,
  degree text,
  department text,
  graduation_year integer check (graduation_year is null or graduation_year between 1900 and 2200),
  experience_level text check (experience_level is null or experience_level in ('beginner', 'intermediate', 'advanced', 'professional')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.learner_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  proficiency integer not null default 0 check (proficiency between 0 and 100),
  target_proficiency integer not null default 70 check (target_proficiency between 0 and 100),
  experience_years numeric(4, 1) not null default 0 check (experience_years >= 0),
  evidence_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuing_organization text not null,
  issue_date date,
  expiry_date date,
  credential_url text,
  created_at timestamptz not null default now(),
  check (expiry_date is null or issue_date is null or expiry_date >= issue_date)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  technologies text[] not null default '{}',
  project_url text,
  github_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.career_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  category text not null,
  description text,
  experience_level text,
  created_at timestamptz not null default now()
);

create table public.career_required_skills (
  id uuid primary key default gen_random_uuid(),
  career_role_id uuid not null references public.career_roles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  required_proficiency integer not null check (required_proficiency between 0 and 100),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  unique (career_role_id, skill_id)
);

create table public.learner_career_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_role_id uuid not null references public.career_roles(id) on delete restrict,
  goal_type text not null default 'target',
  is_active boolean not null default true,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index learner_active_goal_idx on public.learner_career_goals(user_id) where is_active;

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  provider text not null,
  category text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  duration_hours numeric(6, 2) not null default 0 check (duration_hours >= 0),
  resource_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  sequence_number integer not null check (sequence_number > 0),
  unique (course_id, sequence_number)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  content_url text,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  sequence_number integer not null check (sequence_number > 0),
  unique (module_id, sequence_number)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'enrolled' check (status in ('enrolled', 'in-progress', 'completed', 'paused')),
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create table public.learning_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_role_id uuid not null references public.career_roles(id) on delete restrict,
  title text not null,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roadmap_phases (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.learning_roadmaps(id) on delete cascade,
  title text not null,
  description text,
  sequence_number integer not null check (sequence_number > 0),
  status text not null default 'not-started' check (status in ('not-started', 'in-progress', 'completed')),
  estimated_duration text,
  unique (roadmap_id, sequence_number)
);

create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.roadmap_phases(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'not-started' check (status in ('not-started', 'in-progress', 'completed')),
  sequence_number integer not null check (sequence_number > 0),
  unique (phase_id, sequence_number)
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  skill_id uuid references public.skills(id) on delete set null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  total_questions integer not null check (total_questions > 0)
);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  score numeric(6, 2) not null default 0 check (score >= 0),
  total_score numeric(6, 2) not null check (total_score > 0),
  status text not null default 'started' check (status in ('started', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check (score <= total_score)
);

create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completion_status text not null default 'not-started' check (completion_status in ('not-started', 'in-progress', 'completed')),
  time_spent_minutes integer not null default 0 check (time_spent_minutes >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index learner_skills_user_idx on public.learner_skills(user_id);
create index certifications_user_idx on public.certifications(user_id);
create index projects_user_idx on public.projects(user_id);
create index goals_user_idx on public.learner_career_goals(user_id);
create index enrollments_user_idx on public.enrollments(user_id);
create index roadmaps_user_idx on public.learning_roadmaps(user_id);
create index attempts_user_idx on public.assessment_attempts(user_id);
create index progress_user_idx on public.learning_progress(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger learner_skills_updated_at before update on public.learner_skills for each row execute procedure public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
create trigger goals_updated_at before update on public.learner_career_goals for each row execute procedure public.set_updated_at();
create trigger roadmaps_updated_at before update on public.learning_roadmaps for each row execute procedure public.set_updated_at();
create trigger progress_updated_at before update on public.learning_progress for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

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

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "skills_public_read" on public.skills for select using (true);
create policy "career_roles_public_read" on public.career_roles for select using (true);
create policy "career_required_skills_public_read" on public.career_required_skills for select using (true);
create policy "courses_public_read" on public.courses for select using (is_active = true);
create policy "course_modules_public_read" on public.course_modules for select using (true);
create policy "lessons_public_read" on public.lessons for select using (true);
create policy "assessments_public_read" on public.assessments for select using (true);

create policy "learner_skills_own" on public.learner_skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "certifications_own" on public.certifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_own" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "career_goals_own" on public.learner_career_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "enrollments_own" on public.enrollments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "roadmaps_own" on public.learning_roadmaps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "roadmap_phases_own" on public.roadmap_phases for all using (exists (select 1 from public.learning_roadmaps r where r.id = roadmap_id and r.user_id = auth.uid())) with check (exists (select 1 from public.learning_roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()));
create policy "roadmap_items_own" on public.roadmap_items for all using (exists (select 1 from public.roadmap_phases p join public.learning_roadmaps r on r.id = p.roadmap_id where p.id = phase_id and r.user_id = auth.uid())) with check (exists (select 1 from public.roadmap_phases p join public.learning_roadmaps r on r.id = p.roadmap_id where p.id = phase_id and r.user_id = auth.uid()));
create policy "assessment_attempts_own" on public.assessment_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learning_progress_own" on public.learning_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
