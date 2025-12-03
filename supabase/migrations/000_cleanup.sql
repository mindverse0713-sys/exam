-- Cleanup script: Drop existing policies and tables if they exist
-- Run this first if you have existing tables/policies

-- Drop policies if they exist
DROP POLICY IF EXISTS "Allow public insert on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public select on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public update on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public delete on attempts" ON attempts;

DROP POLICY IF EXISTS "Deny public select on exams" ON exams;
DROP POLICY IF EXISTS "Deny public insert on exams" ON exams;
DROP POLICY IF EXISTS "Deny public update on exams" ON exams;
DROP POLICY IF EXISTS "Deny public delete on exams" ON exams;

-- Drop tables if they exist (CAREFUL: This will delete all data!)
-- Uncomment these if you want to start fresh
-- DROP TABLE IF EXISTS attempts CASCADE;
-- DROP TABLE IF EXISTS exams CASCADE;

