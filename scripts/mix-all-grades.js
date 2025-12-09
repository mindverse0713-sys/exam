// Script to mix questions from all grades (10, 11, 12) and redistribute
// This will create unique question sets for each grade/variant

const fs = require('fs');
const path = require('path');

// Read original exams (not shuffled, to get all questions)
const originalExams = JSON.parse(fs.readFileSync(path.join(__dirname, 'exams-output.json'), 'utf8'));

// Collect all questions from all grades
const allQuestions = [];

for (const exam of originalExams) {
  const questions = exam.sections_public.mcq;
  const answers = exam.answer_key.mcqKey;
  
  questions.forEach((q, index) => {
    allQuestions.push({
      question: q,
      answer: answers[String(index + 1)],
      originalGrade: exam.grade,
      originalVariant: exam.variant,
      originalIndex: index + 1
    });
  });
}

console.log(`📚 Нийт ${allQuestions.length} асуулт олдлоо\n`);

// Shuffle function (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle all questions
console.log('🔄 Бүх ангийн асуултуудыг холиж байна...\n');
const shuffledAll = shuffleArray(allQuestions);

// Distribute questions to each exam (20 questions per exam)
// We have 6 exams total (10A, 10B, 11A, 11B, 12A, 12B)
const questionsPerExam = 20;
const examConfigs = [
  { grade: 10, variant: 'A' },
  { grade: 10, variant: 'B' },
  { grade: 11, variant: 'A' },
  { grade: 11, variant: 'B' },
  { grade: 12, variant: 'A' },
  { grade: 12, variant: 'B' },
];

const newExams = [];

for (let i = 0; i < examConfigs.length; i++) {
  const config = examConfigs[i];
  const startIndex = i * questionsPerExam;
  const endIndex = startIndex + questionsPerExam;
  const examQuestions = shuffledAll.slice(startIndex, endIndex);
  
  // Build new exam structure
  const mcq = examQuestions.map((item, index) => ({
    q: item.question.q,
    options: item.question.options
  }));
  
  const mcqKey = {};
  examQuestions.forEach((item, index) => {
    mcqKey[String(index + 1)] = item.answer;
  });
  
  const newExam = {
    grade: config.grade,
    variant: config.variant,
    sections_public: {
      mcq: mcq
    },
    answer_key: {
      mcqKey: mcqKey
    },
    active: true
  };
  
  newExams.push(newExam);
  
  console.log(`✅ ${config.grade}-р анги, Хувилбар ${config.variant}: ${examQuestions.length} асуулт хуваарилагдлаа`);
  console.log(`   Эхний асуулт: ${examQuestions[0].question.q.substring(0, 50)}...`);
}

console.log('\n💾 Өгөгдөл хадгалж байна...\n');

// Save mixed exams
const outputFile = path.join(__dirname, 'exams-output-mixed.json');
fs.writeFileSync(outputFile, JSON.stringify(newExams, null, 2));
console.log(`✅ Холигдсон өгөгдөл хадгалагдлаа: ${outputFile}\n`);

// Generate SQL
const generateSQL = require('./generate-sql.js');
const sqlContent = generateSQL(newExams);

const sqlFile = path.join(__dirname, 'insert-all-exams.sql');
fs.writeFileSync(sqlFile, sqlContent);
console.log(`✅ SQL файл үүсгэгдлээ: ${sqlFile}\n`);

// Verify
console.log('🔍 Шалгалт хийж байна...\n');
let allValid = true;

for (const exam of newExams) {
  const mcq = exam.sections_public.mcq;
  const answers = exam.answer_key.mcqKey;
  
  if (mcq.length !== 20) {
    console.error(`❌ ${exam.grade}-${exam.variant}: ${mcq.length} асуулт байна (20 байх ёстой)`);
    allValid = false;
  }
  
  if (Object.keys(answers).length !== 20) {
    console.error(`❌ ${exam.grade}-${exam.variant}: ${Object.keys(answers).length} хариулт байна (20 байх ёстой)`);
    allValid = false;
  }
  
  // Check all answers are A, B, C, or D
  for (const [key, answer] of Object.entries(answers)) {
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      console.error(`❌ ${exam.grade}-${exam.variant}: Асуулт ${key}-ийн хариулт буруу: ${answer}`);
      allValid = false;
    }
  }
  
  if (allValid) {
    console.log(`✅ ${exam.grade}-р анги, Хувилбар ${exam.variant}: Бүх зүйл зөв`);
  }
}

if (allValid) {
  console.log('\n✅ Бүх сорилууд зөв бэлтгэгдсэн!');
  console.log(`\n📊 Нийт: ${newExams.length} сорил`);
  console.log('  - 10-р анги: A, B');
  console.log('  - 11-р анги: A, B');
  console.log('  - 12-р анги: A, B');
} else {
  console.log('\n❌ Зарим алдаа олдлоо.');
  process.exit(1);
}

