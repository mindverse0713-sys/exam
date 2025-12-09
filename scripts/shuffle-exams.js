// Script to shuffle exam questions and regenerate SQL
// This will shuffle questions within each exam while keeping answers correct

const fs = require('fs');
const path = require('path');

// Read existing exams
const exams = JSON.parse(fs.readFileSync(path.join(__dirname, 'exams-output.json'), 'utf8'));

// Shuffle function (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle questions for each exam
function shuffleExam(exam) {
  const questions = exam.sections_public.mcq;
  const answers = exam.answer_key.mcqKey;
  
  // Create array of question indices
  const indices = questions.map((_, i) => i);
  const shuffledIndices = shuffleArray(indices);
  
  // Create new questions array with shuffled order
  const shuffledQuestions = shuffledIndices.map((originalIndex) => questions[originalIndex]);
  
  // Create new answers object with updated question numbers
  const shuffledAnswers = {};
  shuffledIndices.forEach((originalIndex, newIndex) => {
    const originalQNum = String(originalIndex + 1);
    const newQNum = String(newIndex + 1);
    shuffledAnswers[newQNum] = answers[originalQNum];
  });
  
  return {
    ...exam,
    sections_public: {
      mcq: shuffledQuestions
    },
    answer_key: {
      mcqKey: shuffledAnswers
    }
  };
}

// Shuffle all exams
console.log('🔄 Асуултуудыг холиж байна...\n');

const shuffledExams = exams.map((exam) => {
  const grade = exam.grade;
  const variant = exam.variant;
  console.log(`⏳ ${grade}-р анги, Хувилбар ${variant} холиж байна...`);
  return shuffleExam(exam);
});

console.log('\n✅ Бүх асуултууд амжилттай холигдлоо!\n');

// Save shuffled exams
const outputFile = path.join(__dirname, 'exams-output-shuffled.json');
fs.writeFileSync(outputFile, JSON.stringify(shuffledExams, null, 2));
console.log(`💾 Холигдсон өгөгдөл хадгалагдлаа: ${outputFile}\n`);

// Generate SQL
const generateSQL = require('./generate-sql.js');
const sqlContent = generateSQL(shuffledExams);

const sqlFile = path.join(__dirname, 'insert-all-exams.sql');
fs.writeFileSync(sqlFile, sqlContent);
console.log(`💾 SQL файл үүсгэгдлээ: ${sqlFile}\n`);

console.log('✅ Бүх зүйл бэлэн! Одоо SQL файлыг Supabase дээр ажиллуулж болно.');

