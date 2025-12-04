// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Load env vars
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase Connection шалгаж байна...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables тохируулаагүй байна');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey);

async function testConnection() {
  try {
    console.log('1. Public client connection test...');
    // Test connection by checking if we can query (will fail due to RLS but connection works)
    const { error: publicError } = await supabase.from('attempts').select('id').limit(1);
    
    if (publicError && publicError.code === '42501') {
      console.log('   ✅ Connection амжилттай (RLS policy хориглож байна - энэ нь хэвийн)');
    } else if (publicError && publicError.message.includes('relation') || publicError.message.includes('does not exist')) {
      console.log('   ⚠️  Connection амжилттай, гэхдээ "attempts" table олдсонгүй');
      console.log('   💡 Supabase дээр database setup хийх хэрэгтэй');
    } else if (publicError) {
      console.log(`   ⚠️  Connection алдаа: ${publicError.message}`);
    } else {
      console.log('   ✅ Connection амжилттай');
    }

    console.log('\n2. Admin client connection test...');
    if (!serviceRoleKey) {
      console.log('   ⚠️  Service role key байхгүй');
    } else {
      const { error: adminError } = await supabaseAdmin.from('exams').select('id').limit(1);
      
      if (adminError && (adminError.message.includes('relation') || adminError.message.includes('does not exist'))) {
        console.log('   ⚠️  Connection амжилттай, гэхдээ "exams" table олдсонгүй');
        console.log('   💡 Supabase дээр database setup хийх хэрэгтэй');
      } else if (adminError) {
        console.log(`   ⚠️  Connection алдаа: ${adminError.message}`);
      } else {
        console.log('   ✅ Connection амжилттай');
      }
    }

    console.log('\n✅ Connection test дууссан!');
    
  } catch (error) {
    console.error('❌ Connection test алдаа:', error.message);
    process.exit(1);
  }
}

testConnection();

