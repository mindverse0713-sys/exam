# Хөгжүүлэлтийн төлөвлөгөө

## ✅ Дууссан
- [x] Excel export
- [x] Admin dashboard
- [x] Суралцагчийн шалгалт өгөх систем
- [x] Scoring system

## 🚧 Одоо хийж байгаа

### 1. Admin Exam Editor
**Зорилго:** Admin өөрөө асуулт үүсгэж, засч, answer key тохируулах

#### Features:
- `/admin/exams` page үүсгэх
- Анги, хувилбар сонгох
- Асуултууд жагсаалт харах
- Асуулт нэмэх/засах/устгах
- Answer key засах

#### UI Structure:
```
/admin/exams
├── Grade selector (10/11/12)
├── Variant selector (A/B)
├── Questions list
│   ├── MCQ Questions (1-12)
│   │   ├── Question text
│   │   ├── Options (A, B, C, D)
│   │   └── Correct answer (select)
│   └── Matching Questions (13-20)
│       ├── Left items (questions)
│       ├── Right items (answers)
│       └── Correct mapping
└── Save/Preview buttons
```

### 2. Харгалзуулах даалгавар сайжруулах

#### Одоогийн асуудлууд:
- Shuffle хийснээс хариулт буруу тооцогдож байна
- Admin answer key тохируулахад хэцүү

#### Шийдэл:
- Left side: Fixed (1-8 дугаартай)
- Right side: Shuffle (A-H үсгээр)
- Answer key: `{"1": "A", "2": "C", ...}` гэх мэт
- Admin editor дээр drag-drop эсвэл dropdown

## 📋 Дараагийн features

### 3. Нэмэлт боломжууд
- [ ] Bulk import (Excel →  Database)
- [ ] Image upload асуултанд
- [ ] Timer тохиргоо (admin-аас)
- [ ] Олон сорил variant (C, D, E...)
- [ ] Сурагчийн түүх харах
- [ ] PDF export

## 🎯 Одоогийн алхам

1. **Exam editor UI үүсгэх** - `/admin/exams` page
2. **API routes** - exam CRUD operations
3. **Form components** - асуулт засах forms
4. **Testing** - бүх функцийг тест хийх

---

**Эхлэх үү?** Би эхний feature (Admin Exam Editor) эхлүүлье.

