-- ============================================
-- FIX RLS Policy Issue for attempts table
-- Энэ файлыг Supabase SQL Editor дээр ажиллуулах
-- ============================================

-- Step 1: Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Allow public insert on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public select on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public update on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public delete on attempts" ON attempts;

-- Step 2: Ensure RLS is enabled
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Step 3: Create INSERT policy that allows public to insert
-- This is the critical fix - allows anyone (public) to insert into attempts table
CREATE POLICY "Allow public insert on attempts" 
ON attempts
FOR INSERT 
TO public
WITH CHECK (true);

-- Step 4: Deny SELECT/UPDATE/DELETE for public
CREATE POLICY "Deny public select on attempts" 
ON attempts
FOR SELECT 
TO public
USING (false);

CREATE POLICY "Deny public update on attempts" 
ON attempts
FOR UPDATE 
TO public
USING (false);

CREATE POLICY "Deny public delete on attempts" 
ON attempts
FOR DELETE 
TO public
USING (false);

-- ============================================
-- Done! Now public users can INSERT into attempts table
-- ============================================

