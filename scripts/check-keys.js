// Check if environment variables are properly set
require('dotenv').config({ path: '.env.local' });

const keys = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_PASS: process.env.ADMIN_PASS,
};

console.log('🔍 Environment Variables Шалгах:\n');

let allValid = true;

// Check NEXT_PUBLIC_SUPABASE_URL
if (!keys.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL - байхгүй');
  allValid = false;
} else if (!keys.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co')) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL - зөв формат биш (supabase.co агуулах ёстой)');
  allValid = false;
} else {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL - ${keys.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`);
}

// Check NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!keys.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY - байхгүй');
  allValid = false;
} else if (keys.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ')) {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY - JWT формат зөв (${keys.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...)`);
} else {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY - JWT формат биш (eyJ-ээс эхлэх ёстой)');
  allValid = false;
}

// Check SUPABASE_SERVICE_ROLE_KEY
if (!keys.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY - байхгүй');
  allValid = false;
} else if (keys.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY - JWT формат зөв (${keys.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)`);
} else {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY - JWT формат биш (eyJ-ээс эхлэх ёстой)');
  allValid = false;
}

// Check ADMIN_PASS
if (!keys.ADMIN_PASS) {
  console.log('❌ ADMIN_PASS - байхгүй');
  allValid = false;
} else if (keys.ADMIN_PASS === 'change_me') {
  console.log('⚠️  ADMIN_PASS - анхдагч утга байна ("change_me"), production-д өөрчлөх хэрэгтэй');
} else {
  console.log('✅ ADMIN_PASS - тохируулагдсан');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (allValid) {
  console.log('✅ Бүх environment variables зөв тохируулагдсан!');
} else {
  console.log('❌ Зарим environment variables дутуу эсвэл буруу байна.');
  console.log('\n📖 Дэлгэрэнгүй: env.example файлыг хараарай');
}

process.exit(allValid ? 0 : 1);

