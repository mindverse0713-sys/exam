# ⚡ Шууд Засвар - RLS Policy Алдаа

## 🔴 Алдаа
```
new row violates row-level security policy for table "attempts"
```

## ✅ Шийдэл (2 арга)

### Арга 1: RLS Policy үүсгэх (Зөвлөмжлөх арга)

1. **Supabase Dashboard руу орох:**
   - https://supabase.com/dashboard/project/dusmzbsxikdgbcnsdgcg
   - Зүүн цэсээс **SQL Editor** сонгох

2. **New Query үүсгэх**

3. **Дараах SQL-ийг copy-paste хийж RUN:**

```sql
-- FIX: Allow public to INSERT into attempts table
DROP POLICY IF EXISTS "Allow public insert on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public select on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public update on attempts" ON attempts;
DROP POLICY IF EXISTS "Deny public delete on attempts" ON attempts;

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on attempts" 
ON attempts
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Deny public select on attempts" 
ON attempts
FOR SELECT 
TO public
USING (false);
```

4. **"Success" мессеж харагдах ёстой**

5. **Website-ийг refresh хийж, дахин оролдох**

### Арга 2: RLS хориглох (Түр засвар - аюулгүй биш)

Хэрэв RLS policy үүсгэх боломжгүй бол:

1. Supabase Dashboard → Authentication → Policies
2. `attempts` table дээр RLS-ийг хориглох (түр зуур)

⚠️ **Анхаар:** Энэ нь аюулгүй биш байж магадгүй. Арга 1-ийг дагаарай!

## 📋 Шалгах

Амжилттай болсны дараа:
- Website дээр form бөглөж "Эхлэх" дарна
- Алдаа гарч болохгүй
- `/exam/[attemptId]` хуудас руу очих ёстой

## 🔍 Хэрэв асуудал үргэлжилбэл

1. Supabase Table Editor дээр `attempts` table байгаа эсэхийг шалгах
2. Settings → API → RLS policies шалгах
3. Browser console дээр илүү дэлгэрэнгүй алдааг шалгах

