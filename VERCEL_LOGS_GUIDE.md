# Vercel Logs дээр Messages хэрхэн харах вэ

## Алхам 1: Vercel Logs хуудас руу очих
1. Vercel dashboard руу орох
2. Дээд хэсэгт **"Logs"** tab дээр дарах
3. Эсвэл: https://vercel.com/altanbaganas-projects-c91d6135/exam/logs

## Алхам 2: Request сонгох
1. Жагсаалтаас `/api/admin/export` request-ийг олох
2. Status нь `200` (ногоон) байх ёстой
3. Request мөрөн дээр **ДАРАХ** (бүтэн мөрөн дээр дарах)

## Алхам 3: Messages харах
Request дээр дарсны дараа:
- Баруун талд дэлгэрэнгүй мэдээлэл гарна
- **"Messages"** гэсэн хэсэг харагдана
- Тэнд `console.log()` output-ууд байна:

```
=== Excel export эхэллээ ===
Filter params: { gradeParam: '10', variantParam: 'all', ... }
Нийт 1 оролдлого олдлоо
Ангиуд: ['10']
Анги бүрийн сурагч: ['10-р анги: 1']

=== Анги 10 боловсруулж байна ===
Сурагчдын тоо: 1
  Сурагч 1: altanbagana
    Дүн: 11, Хувь: 55%, Түвшин: V
  Нийт мөр: 1
  Sheet "10-р анги" нэмэгдлээ

=== Workbook үүссэн ===
Sheet name-үүд: ['10-р анги']
Sheet тоо: 1
```

## Алхам 4: Screenshot авах
1. Messages хэсгийг screenshot ав
2. Эсвэл: Text-ийг copy хийж илгээ

## Хэрэв Messages хоосон бол:
- Өгөгдөл олдоогүй байна (`Өгөгдөл олдсонгүй` гэсэн мессеж харагдана)
- Supabase дээр 10-р ангийн өгөгдөл байхгүй байна
- Admin dashboard дээр **"Анги: Бүгд"** сонгоод дахин татаж үз

## Debugging:
Хэрэв Messages хоосон байвал:
1. Admin dashboard дээр **"Анги: Бүгд"** сонго
2. **"Хувилбар: Бүгд"** сонго
3. "Excel татах" дарж дахин татаж үз
4. Vercel Logs дээр шинэ request-ийн Messages-ийг хар

