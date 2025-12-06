-- Fix missing columns in exams table (public_sections, answer_key)
-- Run this in Supabase SQL Editor, then refresh the page.

ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS public_sections jsonb,
  ADD COLUMN IF NOT EXISTS answer_key jsonb;

-- Optional: set defaults to empty objects to avoid null issues
ALTER TABLE public.exams
  ALTER COLUMN public_sections SET DEFAULT '{"mcq":[],"matching":{"left":[],"right":[]}}'::jsonb,
  ALTER COLUMN answer_key SET DEFAULT '{"mcqKey":{},"matchKey":{}}'::jsonb;

-- Ensure active column exists
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Grant access if needed
GRANT ALL ON TABLE public.exams TO anon;
GRANT ALL ON TABLE public.exams TO authenticated;
GRANT ALL ON TABLE public.exams TO service_role;

