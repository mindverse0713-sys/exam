# Graphic Design Quiz Site (MN)

Монгол хэл дээрх график дизайн сорилын сайт. Next.js 14+ (App Router), Supabase, TypeScript ашигласан.

## 🎯 Features

- ✅ Студент сорилын интерфэйс (20 минут, 20 асуулт)
- ✅ 10/11/12-р анги, Variant A/B
- ✅ Админ хяналтын самбар - ангиар Excel экспорт
- ✅ Server-side grading (зөв хариулт клиентэд харагдахгүй)
- ✅ 20 минутын countdown таймер, auto-submit
- ✅ 12 MCQ + 8 Matching асуулт
- ✅ Row Level Security (RLS) Supabase дээр

## 🚀 Setup

### 1. Install dependencies:
```bash
npm install
```

### 2. Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASS=change_me
```

### 3. Supabase Setup:

a) Supabase project үүсгэх

b) SQL Editor дээр `supabase/migrations/001_initial_schema.sql` файлыг ажиллуулах

c) `scripts/seed-exams.sql` файлыг ажиллуулах (exam data seed хийх)

### 4. Run development server:
```bash
npm run dev
```

### 5. Access:
- Student: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## 📁 Project Structure

```
├── app/
│   ├── page.tsx              # Start page (student form)
│   ├── exam/[attemptId]/     # Exam page with timer
│   ├── thanks/               # Thank you page
│   ├── admin/                # Admin dashboard
│   ├── api/
│   │   ├── exam/            # Get exam data (public sections only)
│   │   └── admin/           # Admin APIs (export, attempts)
│   └── actions.ts            # Server actions (startExam, submitExam)
├── lib/
│   ├── supabase.ts          # Supabase clients
│   └── schemas.ts           # Zod validation schemas
├── supabase/
│   └── migrations/          # Database schema
└── scripts/
    └── seed-exams.sql       # Seed data for exams
```

## 🔐 Security Features

- ✅ Answer keys зөвхөн server-side хадгалагдана
- ✅ Client-д answer key дамжуулахгүй (Network tab-аар шалгах боломжтой)
- ✅ RLS policies: attempts table дээр public insert, select хориглогдсон
- ✅ Admin authentication (password-based)
- ✅ Server-side grading only

## 📊 Excel Export

Admin самбар дээр анги/хувилбар/огноогоор шүүж, анги бүрт тусад нь sheet-тэй Excel файл татаж болно.

## 🎓 Usage

1. **Студент**: Нэр, анги, хувилбар сонгоод сорил эхлүүлнэ
2. **Сорил**: 20 минут, 12 MCQ + 8 Matching асуулт
3. **Илгээх**: Auto-submit цаг дуусахад эсвэл гараар илгээнэ
4. **Админ**: `/admin` руу нэвтэрч, үр дүнг харж, Excel татна

## ⚠️ Important Notes

- Оноо болон зөв хариулт сурагчид хэзээ ч харагдахгүй
- Supabase RLS policy зөв тохируулсан байх ёстой
- `ADMIN_PASS` environment variable-ийг production-д өөрчлөх шаардлагатай

