# Production Алдааг Засах

## 🔴 Алдаа: "Server Components render error"

Production дээр generic алдаа харагдаж байна. Энэ нь ихэвчлэн:

### 1. Environment Variables тохируулаагүй ⚠️ (Хамгийн магадлалтай)

**Шийдэл:**

Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://dusmzbsxikdgbcnsdgcg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c216YnN4aWtkZ2JjbnNkZ2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDU3NzksImV4cCI6MjA4MDMyMTc3OX0.aONBGrDjRb8LV7Ih-qCCF869CDJKBMgZV2H53R87yDo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c216YnN4aWtkZ2JjbnNkZ2NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc0NTc3OSwiZXhwIjoyMDgwMzIxNzc5fQ.ZsVzNTiObxNAux9KXxyvlhpMJ_UmhlPK_hjeJZuJJ4E
ADMIN_PASS=change_me
```

Environment-үүд: ✅ Production, ✅ Preview, ✅ Development

### 2. Database Setup хийгдээгүй

**Шийдэл:**

Supabase Dashboard → SQL Editor:

1. **SUPABASE_SETUP.sql** ажиллуулах (tables үүсгэх)
2. **seed-exams.sql** ажиллуулах (exam data оруулах)
3. **FIX_NOW.sql** ажиллуулах (RLS policy)

### 3. Error Handling сайжруулсан ✅

- ✅ Error state нэмсэн (StartForm дээр)
- ✅ Илүү тодорхой error messages
- ✅ Environment variables шалгах

## 🚀 Алхам алхмаар засвар

### Step 1: Vercel Environment Variables

1. Vercel Dashboard → Settings → Environment Variables
2. 4 variables нэмэх (дээрх утгууд)
3. Save

### Step 2: Supabase Database

1. Supabase Dashboard → SQL Editor
2. 3 SQL файл ажиллуулах:
   - `supabase/SUPABASE_SETUP.sql`
   - `scripts/seed-exams.sql`
   - `FIX_NOW.sql`

### Step 3: Redeploy

- Automatic redeploy эсвэл manual redeploy

## ✅ Засварууд

1. ✅ Error handling сайжруулсан
2. ✅ Error messages илүү тодорхой
3. ✅ Environment variable validation
4. ✅ Error state UI-д нэмсэн

## 🔍 Алдаа шалгах

Production-д алдаа гарвал:
- Browser Console (F12) шалгах
- Vercel Build Logs шалгах
- Network tab шалгах

Одоо error message илүү тодорхой харагдана!

