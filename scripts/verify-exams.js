// Verify all exams data is correct
const fs = require('fs');
const path = require('path');

const exams = JSON.parse(fs.readFileSync(path.join(__dirname, 'exams-output.json'), 'utf8'));

console.log('=== Сорил шалгалт ===\n');

let allValid = true;

for (const exam of exams) {
  const grade = exam.grade;
  const variant = exam.variant;
  const mcq = exam.sections_public.mcq;
  const answers = exam.answer_key.mcqKey;

  // Check 1: 20 questions
  if (mcq.length !== 20) {
    console.error(`❌ ${grade}-${variant}: ${mcq.length} асуулт байна (20 байх ёстой)`);
    allValid = false;
    continue;
  }

  // Check 2: All questions have q and options
  for (let i = 0; i < mcq.length; i++) {
    const q = mcq[i];
    if (!q.q || !q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D) {
      console.error(`❌ ${grade}-${variant}: Асуулт ${i + 1} дутуу байна`);
      allValid = false;
    }
  }

  // Check 3: 20 answers
  const answerKeys = Object.keys(answers);
  if (answerKeys.length !== 20) {
    console.error(`❌ ${grade}-${variant}: ${answerKeys.length} хариулт байна (20 байх ёстой)`);
    allValid = false;
    continue;
  }

  // Check 4: All answers are A, B, C, or D
  for (const key of answerKeys) {
    const answer = answers[key];
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      console.error(`❌ ${grade}-${variant}: Асуулт ${key}-ийн хариулт буруу: ${answer}`);
      allValid = false;
    }
  }

  // Check 5: Variant B reordering (if applicable)
  if (variant === 'B') {
    const variantA = exams.find(e => e.grade === grade && e.variant === 'A');
    if (variantA) {
      // B[1] should be A[11], B[11] should be A[1]
      if (mcq[0].q !== variantA.sections_public.mcq[10].q) {
        console.error(`❌ ${grade}-${variant}: Эхний асуулт буруу дараалалтай`);
        allValid = false;
      }
      if (mcq[10].q !== variantA.sections_public.mcq[0].q) {
        console.error(`❌ ${grade}-${variant}: 11-р асуулт буруу дараалалтай`);
        allValid = false;
      }
    }
  }

  console.log(`✅ ${grade}-р анги, Хувилбар ${variant}: Бүх зүйл зөв`);
}

console.log('\n=== Дүгнэлт ===');
if (allValid) {
  console.log('✅ Бүх сорилууд зөв бэлтгэгдсэн!');
  console.log(`\nНийт: ${exams.length} сорил`);
  console.log('  - 10-р анги: A, B');
  console.log('  - 11-р анги: A, B');
  console.log('  - 12-р анги: A, B');
} else {
  console.log('❌ Зарим алдаа олдлоо. Дээрх алдаануудыг засах хэрэгтэй.');
  process.exit(1);
}

