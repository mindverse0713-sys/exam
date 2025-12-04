-- ============================================
-- ЭНЭ SQL-ИЙГ SUPABASE ДЭЭР АЖИЛЛУУЛАХ
-- Copy-paste бүх зүйлийг нэг дор
-- ============================================

-- 1. Хуучин policy-уудыг устгах
DROP POLICY IF EXISTS "Allow public insert on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public select on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public update on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public delete on attempts" ON attempts;

-- 2. RLS идэвхжүүлэх
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- 3. INSERT policy үүсгэх (энэ нь хамгийн чухал!)
CREATE POLICY "Allow public insert on attempts" 
ON attempts
FOR INSERT 
TO public
WITH CHECK (true);

-- 4. Бусад operation-уудыг хориглох
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

-- ✅ ДУУСЛАА! Одоо form ажиллах ёстой

