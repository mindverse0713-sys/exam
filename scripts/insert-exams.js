// Script to insert exams via admin API
// Usage: 
//   ADMIN_PASS=your_password node scripts/insert-exams.js
//   ADMIN_PASS=your_password API_URL=https://your-site.vercel.app node scripts/insert-exams.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ADMIN_PASS = process.env.ADMIN_PASS;
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Helper to ask for input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Insert exam function
async function insertExam(examData, password, apiUrl) {
  const response = await fetch(`${apiUrl}/api/admin/exams?pass=${password}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grade: examData.grade.toString(),
      variant: examData.variant,
      public_sections: examData.sections_public,
      answer_key: examData.answer_key
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }

  return await response.json();
}

async function main() {
  // Get admin password
  let password = ADMIN_PASS;
  if (!password) {
    password = await askQuestion('Админ нууц үг оруулна уу: ');
    if (!password) {
      console.error('❌ Нууц үг шаардлагатай!');
      process.exit(1);
    }
  }

  // Get API URL
  let apiUrl = API_URL;
  if (apiUrl === 'http://localhost:3000') {
    const useProduction = await askQuestion('Production URL ашиглах уу? (y/n, default: n): ');
    if (useProduction.toLowerCase() === 'y') {
      apiUrl = await askQuestion('Production URL оруулна уу (жишээ: https://your-site.vercel.app): ');
      if (!apiUrl) {
        console.error('❌ URL шаардлагатай!');
        process.exit(1);
      }
    }
  }

  console.log(`\n🌐 API URL: ${apiUrl}`);
  console.log(`📝 Нууц үг: ${'*'.repeat(password.length)}\n`);

  // Test connection
  try {
    console.log('🔍 Холболт шалгаж байна...');
    const testResponse = await fetch(`${apiUrl}/api/admin/auth?pass=${password}`);
    if (!testResponse.ok) {
      throw new Error('Нууц үг буруу эсвэл серверт холбогдох боломжгүй');
    }
    console.log('✅ Холболт амжилттай!\n');
  } catch (error) {
    console.error(`❌ Холболтын алдаа: ${error.message}`);
    console.error('   Сервер ажиллаж байгаа эсэхийг шалгана уу.');
    process.exit(1);
  }

  const examsFile = path.join(__dirname, 'exams-output.json');
  const exams = JSON.parse(fs.readFileSync(examsFile, 'utf8'));

  console.log(`📚 ${exams.length} сорил олдлоо...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const exam of exams) {
    try {
      console.log(`⏳ ${exam.grade}-р анги, Хувилбар ${exam.variant} оруулж байна...`);
      const result = await insertExam(exam, password, apiUrl);
      console.log(`✅ Амжилттай: ${exam.grade}-р анги, Хувилбар ${exam.variant}`);
      if (result.exam?.id) {
        console.log(`   ID: ${result.exam.id}\n`);
      }
      successCount++;
    } catch (error) {
      console.error(`❌ Алдаа: ${exam.grade}-р анги, Хувилбар ${exam.variant}`);
      console.error(`   ${error.message}\n`);
      failCount++;
    }
  }

  console.log('\n=== Дүгнэлт ===');
  console.log(`✅ Амжилттай: ${successCount}`);
  if (failCount > 0) {
    console.log(`❌ Алдаатай: ${failCount}`);
  }
  console.log(`📊 Нийт: ${exams.length}`);
}

main().catch(console.error);

