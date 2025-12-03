# Vercel Deploy Setup Guide

## ✅ Fixed Issues

1. TypeScript error in `StartForm.tsx` - зассан ✅
2. Build амжилттай боллоо ✅

## 📋 Vercel дээр Environment Variables тохируулах

### 1. Vercel Dashboard руу орох
- https://vercel.com/dashboard
- Project-оо сонгох (`exam`)

### 2. Settings → Environment Variables руу орох

### 3. Дараах 4 Environment Variables нэмэх:

```
NEXT_PUBLIC_SUPABASE_URL=https://dusmzbsxikdgbcnsdgcg.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c216YnN4aWtkZ2JjbnNkZ2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDU3NzksImV4cCI6MjA4MDMyMTc3OX0.aONBGrDjRb8LV7Ih-qCCF869CDJKBMgZV2H53R87yDo

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c216YnN4aWtkZ2JjbnNkZ2NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc0NTc3OSwiZXhwIjoyMDgwMzIxNzc5fQ.ZsVzNTiObxNAux9KXxyvlhpMJ_UmhlPK_hjeJZuJJ4E

ADMIN_PASS=change_me
```

### 4. Environment сонгох:
- ✅ Production
- ✅ Preview  
- ✅ Development

(Бүгд сонгох)

### 5. Save хийх

### 6. Дахин Deploy хийх:
- Deployments tab руу очих
- Latest deployment → "..." → Redeploy
- Эсвэл шинэ commit push хийх (automatic deploy)

## ⚠️ Чухал анхааруулга

1. `ADMIN_PASS`-ийг production-д аюулгүй нууц үг болгох
2. `SUPABASE_SERVICE_ROLE_KEY` нь нууц материал - хэзээ ч public-д бүү илгээ
3. Environment variables нэмсний дараа redeploy хийх шаардлагатай

## 🔍 Deploy алдааг шалгах

Хэрэв deploy алдаа гарвал:
1. Build Logs шалгах
2. Environment Variables зөв тохируулсан эсэхийг шалгах
3. Supabase database тохируулсан эсэхийг шалгах

