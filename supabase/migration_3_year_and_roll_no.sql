-- ============================================================================
-- MIGRATION 3 — Add student year (FY/SY/TY) + rename enrollment_no to roll_no
-- Run in Supabase SQL Editor after migration_2_codes_and_rolls.sql
-- Safe to run on existing data — renames column, adds new nullable column.
-- ============================================================================

-- Rename enrollment_no to roll_no to match the UI label
alter table profiles rename column enrollment_no to roll_no;

-- Add year column for student's academic year (FY / SY / TY)
alter table profiles add column if not exists year text;

-- ============================================================================
-- DONE. Existing students will have roll_no = whatever they entered as
-- enrollment_no before, and year = NULL until they re-register or you
-- update manually. New signups will use the new fields.
-- ============================================================================
