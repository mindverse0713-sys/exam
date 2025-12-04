# Production Алдаа Засвар

## 🔴 Алдаа: "Server Components render error"

Production дээр generic алдаа харагдаж байна. Энэ нь ихэвчлэн:

1. **Environment Variables тохируулаагүй** (хамгийн магадлалтай)
2. **Database setup хийгдээгүй**
3. **RLS Policy тохируулаагүй**

## ✅ Зассан зүйлс

1. ✅ **Error Boundary нэмсэн** (`app/error.tsx`)
   - Production дээр илүү тодорхой алдааны мэдээлэл харуулна

2. ✅ **Error Handling сайжруулсан**
   - Илүү тодорхой алдааны мессежүүд
   - RLS policy алдааг тусгайлан тэмдэглэх

3. ✅ **Environment Variables шалгах**
   - Runtime дээр шалгах логик нэмсэн

## 🚀 Vercel дээр тохируулах

### 1. Environment Variables нэмэх

Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://dusmzbsxikdgbcnsdgcg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c216YnN4aWtkZ2JjbnNkZ2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDU3NzksImV4cCI6MjA4MDMyMTc3OX0.aONBGrDjRb8LV7Ih-qCCF869CDJKBMgZV2H53R87yDo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c216YnN4aWtkZ2JjbnNkZ2NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc0NTc3OSwiZXhwIjoyMDgwMzIxNzc5fQ.ZsVzNTiObxNAux9KXxyvlhpMJ_UmhlPK_hjeJZuJJ4E
ADMIN_PASS=change_me
```

Environment-үүд: ✅ Production, ✅ Preview, ✅ Development

### 2. Database Setup (Supabase)

1. Supabase Dashboard → SQL Editor
2. `supabase/SUPABASE_SETUP.sql` ажиллуулах
3. `scripts/seed-exams.sql` ажиллуулах  
4. `FIX_NOW.sql` ажиллуулах (RLS policy)

### 3. Redeploy

Environment variables нэмсний дараа:
- Automatic redeploy болно эсвэл
- Manual redeploy хийх

## 📋 Шалгах

Амжилттай болсны дараа:
- ✅ Алдаа илүү тодорхой харагдана
- ✅ RLS policy алдаа тусгайлан тэмдэглэгдэнэ
- ✅ Form ажиллах ёстой

## ⚠️ Алдаа харагдахгүй бол

1. Vercel Build Logs шалгах
2. Browser Console шалгах (F12)
3. Network tab шалгах

