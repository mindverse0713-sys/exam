// Generate SQL INSERT statements from exams JSON
const fs = require('fs');
const path = require('path');

const exams = JSON.parse(fs.readFileSync(path.join(__dirname, 'exams-output.json'), 'utf8'));

let sql = `-- ============================================
-- Сорил оруулах SQL
-- Supabase SQL Editor дээр ажиллуулах
-- ============================================

`;

for (const exam of exams) {
  const sectionsPublic = JSON.stringify(exam.sections_public).replace(/'/g, "''");
  const answerKey = JSON.stringify(exam.answer_key).replace(/'/g, "''");
  
  sql += `-- ${exam.grade}-р анги, Хувилбар ${exam.variant}
INSERT INTO exams (grade, variant, sections_public, answer_key, active)
VALUES (
  ${exam.grade},
  '${exam.variant}',
  '${sectionsPublic}'::jsonb,
  '${answerKey}'::jsonb,
  true
)
ON CONFLICT (grade, variant) 
DO UPDATE SET
  sections_public = EXCLUDED.sections_public,
  answer_key = EXCLUDED.answer_key,
  active = EXCLUDED.active;

`;
}

console.log(sql);

