import { z } from 'zod'

export const startExamSchema = z.object({
  name: z.string().min(1, 'Нэрээ оруулна уу'),
  // Allow formats like 9, 9-1, 11A, 12-B зэрэг текстэн анги
  grade: z
    .string()
    .min(1, 'Ангиа оруулна уу')
    .regex(/^[0-9A-Za-z_-]+$/, 'Анги зөв форматтай байх хэрэгтэй (жишээ: 9-1, 10A)'),
  variant: z.union([z.literal('A'), z.literal('B')]),
})

export const submitExamSchema = z.object({
  attemptId: z.string().uuid(),
  answersMcq: z.record(z.string(), z.string()),
  answersMatch: z.record(z.string(), z.number()),
  clientStartedAt: z.number().optional(),
})

