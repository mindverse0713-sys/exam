-- Create attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade IN (10, 11, 12)),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  duration_sec INTEGER,
  score INTEGER,
  total INTEGER DEFAULT 20,
  answers_mcq JSONB DEFAULT '{}',
  answers_match JSONB DEFAULT '{}',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exams table (server-only)
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL CHECK (grade IN (10, 11, 12)),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  sections_public JSONB NOT NULL,
  answer_key JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grade, variant)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attempts_grade ON attempts(grade);
CREATE INDEX IF NOT EXISTS idx_attempts_variant ON attempts(variant);
CREATE INDEX IF NOT EXISTS idx_attempts_started_at ON attempts(started_at);
CREATE INDEX IF NOT EXISTS idx_exams_grade_variant ON exams(grade, variant);

-- Enable Row Level Security
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attempts
-- Allow public INSERT (students can submit)
CREATE POLICY "Allow public insert on attempts" ON attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Deny all SELECT/UPDATE/DELETE for public (only service role can access)
CREATE POLICY "Deny public select on attempts" ON attempts
  FOR SELECT
  TO public
  USING (false);

CREATE POLICY "Deny public update on attempts" ON attempts
  FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "Deny public delete on attempts" ON attempts
  FOR DELETE
  TO public
  USING (false);

-- RLS Policies for exams
-- Deny all public access (only service role can access)
CREATE POLICY "Deny public select on exams" ON exams
  FOR SELECT
  TO public
  USING (false);

CREATE POLICY "Deny public insert on exams" ON exams
  FOR INSERT
  TO public
  WITH CHECK (false);

CREATE POLICY "Deny public update on exams" ON exams
  FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "Deny public delete on exams" ON exams
  FOR DELETE
  TO public
  USING (false);

