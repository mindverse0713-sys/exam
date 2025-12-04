#!/bin/bash
# API Keys шалгах скрипт

echo "🔍 API Keys шалгаж байна..."
echo ""

source .env.local 2>/dev/null || {
  echo "❌ .env.local файл олдсонгүй"
  exit 1
}

errors=0

# Check URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL байхгүй"
  errors=$((errors + 1))
elif [[ ! "$NEXT_PUBLIC_SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
  echo "⚠️  NEXT_PUBLIC_SUPABASE_URL формат буруу"
  errors=$((errors + 1))
else
  echo "✅ NEXT_PUBLIC_SUPABASE_URL: OK"
fi

# Check Anon Key
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY байхгүй"
  errors=$((errors + 1))
elif [[ ! "$NEXT_PUBLIC_SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
  echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY формат буруу (eyJ-ээс эхлэх ёстой)"
  errors=$((errors + 1))
else
  echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: OK (${#NEXT_PUBLIC_SUPABASE_ANON_KEY} chars)"
fi

# Check Service Role Key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY байхгүй"
  errors=$((errors + 1))
elif [[ ! "$SUPABASE_SERVICE_ROLE_KEY" =~ ^eyJ ]]; then
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY формат буруу (eyJ-ээс эхлэх ёстой)"
  errors=$((errors + 1))
else
  echo "✅ SUPABASE_SERVICE_ROLE_KEY: OK (${#SUPABASE_SERVICE_ROLE_KEY} chars)"
fi

# Check Admin Pass
if [ -z "$ADMIN_PASS" ]; then
  echo "❌ ADMIN_PASS байхгүй"
  errors=$((errors + 1))
elif [ "$ADMIN_PASS" = "change_me" ]; then
  echo "⚠️  ADMIN_PASS: анхдагч утга (production-д өөрчлөх хэрэгтэй)"
else
  echo "✅ ADMIN_PASS: OK"
fi

echo ""
if [ $errors -eq 0 ]; then
  echo "✅ Бүх API keys зөв тохируулагдсан!"
  exit 0
else
  echo "❌ $errors алдаа олдлоо"
  exit 1
fi

