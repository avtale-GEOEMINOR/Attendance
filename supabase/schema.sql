-- ============================================================================
-- ATTENDANCE APP — DATABASE SCHEMA
-- Run this entire file once in the Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES — extends Supabase auth.users with role + approval status
-- ----------------------------------------------------------------------------
create type user_role as enum ('faculty', 'student');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role user_role not null,
  program text,                                  -- student's program/branch (optional)
  enrollment_no text,                             -- student's roll/enrollment number (optional)
  is_approved boolean not null default false,     -- faculty needs admin approval; students are auto-approved
  created_at timestamptz not null default now()
);

-- Students are auto-approved, faculty are not. Enforced by trigger so client can't fake it.
create function handle_new_profile() returns trigger as $$
begin
  if new.role = 'student' then
    new.is_approved := true;
  else
    new.is_approved := false;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_profile_approval
  before insert on profiles
  for each row execute function handle_new_profile();

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Faculty/students need to see basic info (name) of others in shared course contexts.
-- We allow reading name+role+email for any authenticated user; sensitive approval flag stays private via app logic.
create policy "Authenticated users can view minimal profile info"
  on profiles for select
  using (auth.role() = 'authenticated');


-- ----------------------------------------------------------------------------
-- 2. COURSES — created by faculty, each has a unique join code/slug
-- ----------------------------------------------------------------------------
create table courses (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references profiles(id) on delete cascade,
  title text not null,                     -- e.g. "Digital Marketing"
  code text,                               -- optional course code e.g. "GE-OE-204"
  join_slug text not null unique,          -- random slug used in the shareable enroll link
  sheet_url text,                          -- linked Google Sheet (roster + attendance export)
  created_at timestamptz not null default now()
);

alter table courses enable row level security;

create policy "Faculty can manage their own courses"
  on courses for all
  using (auth.uid() = faculty_id)
  with check (auth.uid() = faculty_id);

create policy "Anyone authenticated can view a course by slug (to enroll)"
  on courses for select
  using (auth.role() = 'authenticated');


-- ----------------------------------------------------------------------------
-- 3. ENROLLMENTS — student requests to join a course; faculty approves/rejects
-- ----------------------------------------------------------------------------
create type enrollment_status as enum ('pending', 'approved', 'rejected');

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  status enrollment_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (course_id, student_id)
);

alter table enrollments enable row level security;

create policy "Students can view their own enrollments"
  on enrollments for select
  using (auth.uid() = student_id);

create policy "Students can request enrollment"
  on enrollments for insert
  with check (auth.uid() = student_id);

create policy "Faculty can view enrollments for their courses"
  on enrollments for select
  using (
    exists (
      select 1 from courses
      where courses.id = enrollments.course_id
      and courses.faculty_id = auth.uid()
    )
  );

create policy "Faculty can update enrollments for their courses"
  on enrollments for update
  using (
    exists (
      select 1 from courses
      where courses.id = enrollments.course_id
      and courses.faculty_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------------------
-- 4. SESSIONS — one row per attendance-taking event (e.g. "12 Jun, 10am lecture")
-- ----------------------------------------------------------------------------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  session_date date not null default current_date,
  label text,                              -- e.g. "Lecture 5" (optional)
  created_at timestamptz not null default now()
);

alter table sessions enable row level security;

create policy "Faculty can manage sessions for their own courses"
  on sessions for all
  using (
    exists (
      select 1 from courses
      where courses.id = sessions.course_id
      and courses.faculty_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from courses
      where courses.id = sessions.course_id
      and courses.faculty_id = auth.uid()
    )
  );

create policy "Enrolled students can view sessions for their course"
  on sessions for select
  using (
    exists (
      select 1 from enrollments
      where enrollments.course_id = sessions.course_id
      and enrollments.student_id = auth.uid()
      and enrollments.status = 'approved'
    )
  );


-- ----------------------------------------------------------------------------
-- 5. ATTENDANCE RECORDS — one row per (session, student)
-- ----------------------------------------------------------------------------
create type attendance_status as enum ('present', 'absent');

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  status attendance_status not null default 'absent',
  marked_at timestamptz not null default now(),
  unique (session_id, student_id)
);

alter table attendance_records enable row level security;

create policy "Faculty can manage attendance for their own courses"
  on attendance_records for all
  using (
    exists (
      select 1 from sessions
      join courses on courses.id = sessions.course_id
      where sessions.id = attendance_records.session_id
      and courses.faculty_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sessions
      join courses on courses.id = sessions.course_id
      where sessions.id = attendance_records.session_id
      and courses.faculty_id = auth.uid()
    )
  );

create policy "Students can view their own attendance records"
  on attendance_records for select
  using (auth.uid() = student_id);


-- ----------------------------------------------------------------------------
-- Helpful indexes
-- ----------------------------------------------------------------------------
create index idx_courses_faculty on courses(faculty_id);
create index idx_courses_join_slug on courses(join_slug);
create index idx_enrollments_course on enrollments(course_id);
create index idx_enrollments_student on enrollments(student_id);
create index idx_sessions_course on sessions(course_id);
create index idx_attendance_session on attendance_records(session_id);
create index idx_attendance_student on attendance_records(student_id);

-- ============================================================================
-- DONE. Next steps after running this:
-- 1. Go to Authentication > Providers and make sure Email is enabled.
-- 2. Go to Authentication > Settings and DISABLE "Confirm email" for easier testing
--    (or configure SMTP if you want real email confirmations).
-- 3. Copy your Project URL and anon key into .env.local (see README).
-- ============================================================================
