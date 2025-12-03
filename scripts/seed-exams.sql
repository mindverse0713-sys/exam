-- Seed exam data for Grade 10, Variant A
INSERT INTO exams (grade, variant, sections_public, answer_key, active) VALUES (
  10,
  'A',
  '{
    "mcq": [
      {
        "i": 1,
        "q": "Kerning гэж юу вэ?",
        "options": [
          "Мөр хоорондын зай",
          "Нийт үсгийн зай",
          "Үсэг хосын хоорондын зай",
          "Абзацын зай"
        ]
      },
      {
        "i": 2,
        "q": "Leading гэж юу вэ?",
        "options": [
          "Үсэг хосын хоорондын зай",
          "Мөр хоорондын зай",
          "Үсгийн өргөн",
          "Текст хэмжээ"
        ]
      },
      {
        "i": 3,
        "q": "Tracking гэж юу вэ?",
        "options": [
          "Мөр хоорондын зай",
          "Нийт үсгийн зай/өргөн",
          "Үсэг хосын зай",
          "Текст бүрхэг"
        ]
      },
      {
        "i": 4,
        "q": "RGB гэж юу вэ?",
        "options": [
          "Байгалийн өнгөний загвар",
          "Цахим дэлгэцний өнгөний загвар",
          "Хэвлэх өнгөний загвар",
          "Харанхуй/Гэгээний загвар"
        ]
      },
      {
        "i": 5,
        "q": "CMYK гэж юу вэ?",
        "options": [
          "Цахим дэлгэцний өнгөний загвар",
          "Хэвлэх өнгөний загвар",
          "Байгалийн өнгөний загвар",
          "Гэрэлтүүлгийн загвар"
        ]
      },
      {
        "i": 6,
        "q": "DPI гэж юу вэ?",
        "options": [
          "Цэг тутамд инч (хэвлэх чанар)",
          "Пиксел тутамд инч",
          "Гэрэлтүүлгийн хэмжээ",
          "Өнгөний гүн"
        ]
      },
      {
        "i": 7,
        "q": "Raster гэж юу вэ?",
        "options": [
          "Муруй, хэлбэрт суурилсан график",
          "Пикселд суурилсан график",
          "Вектор формат",
          "SVG график"
        ]
      },
      {
        "i": 8,
        "q": "Vector гэж юу вэ?",
        "options": [
          "Пикселд суурилсан график",
          "Муруй, хэлбэрт суурилсан график",
          "Растер формат",
          "JPEG график"
        ]
      },
      {
        "i": 9,
        "q": "PNG формат ямар давуу талтай вэ?",
        "options": [
          "Ил тод суурь дэмждэг",
          "Фото зургаар түгээмэл",
          "Вебд тохиромжтой",
          "Бага хэмжээтэй"
        ]
      },
      {
        "i": 10,
        "q": "JPEG формат ямар тохиромжтой вэ?",
        "options": [
          "Ил тод зургийн хувьд",
          "Фото зургаар түгээмэл, шахалттай",
          "Вектор график",
          "SVG зургийн хувьд"
        ]
      },
      {
        "i": 11,
        "q": "SVG формат ямар давуу талтай вэ?",
        "options": [
          "Фото зургаар тохиромжтой",
          "Вебд тохиромжтой вектор формат",
          "Хэвлэхэд тохиромжтой",
          "Ил тод суурь дэмждэг"
        ]
      },
      {
        "i": 12,
        "q": "Typography гэж юу вэ?",
        "options": [
          "Зургийн уран сайхны хэлбэр",
          "Үсгийн уран сайхны хэлбэр",
          "Өнгөний хэрэглээ",
          "Композицийн дүрэм"
        ]
      }
    ],
    "match": {
      "left": [
        "Kerning",
        "Leading",
        "Tracking",
        "Raster",
        "Vector",
        "SVG",
        "PNG",
        "JPEG"
      ],
      "right": [
        "Вебд тохиромжтой вектор формат",
        "Нийт үсгийн зай/өргөн",
        "Ил тод суурь дэмждэг",
        "Пикселд суурилсан график",
        "Мөр хоорондын зай",
        "Фото зургаар түгээмэл, шахалттай",
        "Үсэг хосын хоорондын зай",
        "Муруй, хэлбэрт суурилсан график"
      ]
    }
  }'::jsonb,
  '{
    "mcqKey": {
      "1": "C",
      "2": "B",
      "3": "B",
      "4": "B",
      "5": "B",
      "6": "A",
      "7": "B",
      "8": "B",
      "9": "A",
      "10": "B",
      "11": "B",
      "12": "B"
    },
    "matchKey": {
      "1": 7,
      "2": 5,
      "3": 2,
      "4": 4,
      "5": 8,
      "6": 1,
      "7": 3,
      "8": 6
    }
  }'::jsonb,
  true
) ON CONFLICT (grade, variant) DO NOTHING;

-- Grade 10, Variant B (similar structure, different questions/answers)
INSERT INTO exams (grade, variant, sections_public, answer_key, active) VALUES (
  10,
  'B',
  '{
    "mcq": [
      {
        "i": 1,
        "q": "CMYK-д C гэдэг нь?",
        "options": [
          "Cyan",
          "Crimson",
          "Coral",
          "Cobalt"
        ]
      },
      {
        "i": 2,
        "q": "RGB-д R гэдэг нь?",
        "options": [
          "Red",
          "Rose",
          "Ruby",
          "Rust"
        ]
      },
      {
        "i": 3,
        "q": "PPI гэж юу вэ?",
        "options": [
          "Пиксел тутамд инч (дэлгэцний чанар)",
          "Цэг тутамд инч",
          "Пиксел тутамд метр",
          "Гэрэлтүүлгийн хэмжээ"
        ]
      },
      {
        "i": 4,
        "q": "GIF формат ямар давуу талтай вэ?",
        "options": [
          "Анимэйшн дэмждэг",
          "Фото зургаар тохиромжтой",
          "Вектор график",
          "Хэвлэхэд тохиромжтой"
        ]
      },
      {
        "i": 5,
        "q": "Logo дизайнд ямар формат тохиромжтой вэ?",
        "options": [
          "JPEG",
          "PNG",
          "Vector (SVG/AI)",
          "GIF"
        ]
      },
      {
        "i": 6,
        "q": "Resolution гэж юу вэ?",
        "options": [
          "Өнгөний гүн",
          "Зургийн чанар/шийдэл",
          "Файлын хэмжээ",
          "Хэмжээ"
        ]
      },
      {
        "i": 7,
        "q": "Color Palette гэж юу вэ?",
        "options": [
          "Өнгөний сонголт/багц",
          "Гэрэлтүүлгийн хэмжээ",
          "Контраст",
          "Сэтгэл санаа"
        ]
      },
      {
        "i": 8,
        "q": "Contrast гэж юу вэ?",
        "options": [
          "Өнгөний сонголт",
          "Ялгаа/Эсрэг тэсрэг",
          "Гэрэлтүүлэг",
          "Хэмжээ"
        ]
      },
      {
        "i": 9,
        "q": "White Space гэж юу вэ?",
        "options": [
          "Цагаан өнгө",
          "Хоосон зай",
          "Гэрэлтүүлэг",
          "Контраст"
        ]
      },
      {
        "i": 10,
        "q": "Alignment гэж юу вэ?",
        "options": [
          "Хэмжээ",
          "Эгнээ/Зэрэгцүүлэлт",
          "Зайн тохируулга",
          "Өнгө"
        ]
      },
      {
        "i": 11,
        "q": "Hierarchy дизайн дээр юу харуулдаг вэ?",
        "options": [
          "Өнгөний дараалал",
          "Анхаарал татах дараалал",
          "Хэмжээний дараалал",
          "Орон зайн дараалал"
        ]
      },
      {
        "i": 12,
        "q": "Grid System гэж юу вэ?",
        "options": [
          "Зургийн систем",
          "Тохируулгын систем",
          "Цэсний систем",
          "Хэмжээний систем"
        ]
      }
    ],
    "match": {
      "left": [
        "CMYK",
        "RGB",
        "DPI",
        "PPI",
        "Raster",
        "Vector",
        "Contrast",
        "White Space"
      ],
      "right": [
        "Пиксел тутамд инч (дэлгэцний чанар)",
        "Хэвлэх өнгөний загвар",
        "Ялгаа/Эсрэг тэсрэг",
        "Цахим дэлгэцний өнгөний загвар",
        "Муруй, хэлбэрт суурилсан график",
        "Хоосон зай",
        "Цэг тутамд инч (хэвлэх чанар)",
        "Пикселд суурилсан график"
      ]
    }
  }'::jsonb,
  '{
    "mcqKey": {
      "1": "A",
      "2": "A",
      "3": "A",
      "4": "A",
      "5": "C",
      "6": "B",
      "7": "A",
      "8": "B",
      "9": "B",
      "10": "B",
      "11": "B",
      "12": "B"
    },
    "matchKey": {
      "1": 2,
      "2": 4,
      "3": 7,
      "4": 1,
      "5": 8,
      "6": 5,
      "7": 3,
      "8": 6
    }
  }'::jsonb,
  true
) ON CONFLICT (grade, variant) DO NOTHING;

-- Grade 11, Variant A (placeholder - can be expanded)
INSERT INTO exams (grade, variant, sections_public, answer_key, active) VALUES (
  11,
  'A',
  (SELECT sections_public FROM exams WHERE grade = 10 AND variant = 'A'),
  (SELECT answer_key FROM exams WHERE grade = 10 AND variant = 'A'),
  true
) ON CONFLICT (grade, variant) DO NOTHING;

-- Grade 11, Variant B
INSERT INTO exams (grade, variant, sections_public, answer_key, active) VALUES (
  11,
  'B',
  (SELECT sections_public FROM exams WHERE grade = 10 AND variant = 'B'),
  (SELECT answer_key FROM exams WHERE grade = 10 AND variant = 'B'),
  true
) ON CONFLICT (grade, variant) DO NOTHING;

-- Grade 12, Variant A
INSERT INTO exams (grade, variant, sections_public, answer_key, active) VALUES (
  12,
  'A',
  (SELECT sections_public FROM exams WHERE grade = 10 AND variant = 'A'),
  (SELECT answer_key FROM exams WHERE grade = 10 AND variant = 'A'),
  true
) ON CONFLICT (grade, variant) DO NOTHING;

-- Grade 12, Variant B
INSERT INTO exams (grade, variant, sections_public, answer_key, active) VALUES (
  12,
  'B',
  (SELECT sections_public FROM exams WHERE grade = 10 AND variant = 'B'),
  (SELECT answer_key FROM exams WHERE grade = 10 AND variant = 'B'),
  true
) ON CONFLICT (grade, variant) DO NOTHING;

