# Алдааны Шалтгаан ба Шийдэл

## 🔴 Алдаа: "Server Components render error"

Энэ алдаа нь дараах шалтгаануудаас үүдэлтэй:

### 1. Environment Variables тохируулаагүй (Хамгийн магадлалтай)

**Шийдэл:**
Vercel Dashboard → Settings → Environment Variables дээр дараах 4 утгыг нэмэх:

```
NEXT_PUBLIC_SUPABASE_URL=https://dusmzbsxikdgbcnsdgcg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_PASS=change_me
```

**Environment-үүд:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Дараа нь:** Redeploy хийх

### 2. Database Table-ууд үүсээгүй

**Шийдэл:**
1. Supabase Dashboard → SQL Editor
2. `supabase/SUPABASE_SETUP.sql` файлыг copy-paste хийж RUN
3. `scripts/seed-exams.sql` файлыг copy-paste хийж RUN

### 3. Error Handling сайжруулсан

Одоо илүү тодорхой алдааны мэдээлэл харагдана:
- Environment variable дутуу байвал тодорхой мессеж
- Supabase connection алдааны дэлгэрэнгүй мэдээлэл

## ✅ Засварууд

1. ✅ Error handling сайжруулсан
2. ✅ Environment variable шалгах код нэмсэн
3. ✅ Илүү тодорхой алдааны мэдээлэл

## 🚀 Дараагийн алхмууд

1. Vercel дээр Environment Variables тохируулах
2. Supabase Database setup хийх (SQL Editor)
3. Redeploy хийх
4. Тест хийх

