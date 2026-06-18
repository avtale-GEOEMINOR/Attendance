-- ============================================================================
-- MIGRATION 2 — Faculty codes, course codes, readable join codes, roll numbers
-- Run this in the Supabase SQL Editor AFTER the original schema.sql.
-- Safe to run on a database that already has data — only adds columns/policies,
-- nothing is dropped or altered destructively.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Faculty short code (e.g. "AVT") — used as part of student roll numbers
-- ----------------------------------------------------------------------------
alter table profiles add column if not exists faculty_code text;

-- ----------------------------------------------------------------------------
-- 2. Course short code (e.g. "DM") + readable join code (e.g. "DM2026")
--    join_code replaces the old random join_slug as what's actually shared
--    with students. join_slug is kept (nullable now) for backward
--    compatibility with any links already shared — both will resolve.
-- ----------------------------------------------------------------------------
alter table courses add column if not exists course_code text;
alter table courses add column if not exists join_code text unique;
alter table courses alter column join_slug drop not null;

-- ----------------------------------------------------------------------------
-- 3. Per-course roll number on enrollments — format FACULTYCODE_COURSECODE_001
--    Assigned when an enrollment is approved (handled in application code,
--    not a trigger, since it needs to look up the next available number).
-- ----------------------------------------------------------------------------
alter table enrollments add column if not exists roll_number text;

-- A roll number should be unique within a course (not globally, since the
-- same numbering pattern could theoretically repeat across different courses
-- run by different faculty — though the faculty+course code prefix makes
-- that very unlikely in practice).
create unique index if not exists idx_enrollments_course_roll
  on enrollments(course_id, roll_number)
  where roll_number is not null;

-- ----------------------------------------------------------------------------
-- 4. Helpful index for the new join_code lookup path
-- ----------------------------------------------------------------------------
create index if not exists idx_courses_join_code on courses(join_code);

-- ============================================================================
-- DONE. After running this:
-- 1. Existing courses will have join_code = NULL until faculty re-save them,
--    or you can backfill manually — the app will auto-generate one the next
--    time the course is loaded if missing (see app code).
-- 2. Existing approved enrollments will have roll_number = NULL until you
--    re-trigger approval, or backfill via the new "Assign roll numbers"
--    button added to the faculty roster view.
-- 3. Existing faculty accounts (created before this migration) will have
--    faculty_code = NULL. The roll-number feature falls back to "FAC" for
--    these until you set a real code. To set one manually for your own
--    account, run (replace the email and code):
--
--    update profiles set faculty_code = 'AVT' where email = 'you@example.com';
-- ============================================================================
