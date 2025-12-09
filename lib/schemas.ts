import { z } from 'zod'

export const startExamSchema = z.object({
  name: z.string().min(1, 'Нэрээ оруулна уу'),
  grade: z.enum(['10', '11', '12'], {
    errorMap: () => ({ message: '10, 11, 12-р ангид л сорил нээлттэй' }),
  }),
  variant: z.union([z.literal('A'), z.literal('B')]),
})

export const submitExamSchema = z.object({
  attemptId: z.string().uuid(),
  answersMcq: z.record(z.string(), z.string()),
  answersMatch: z.record(z.string(), z.number()),
  clientStartedAt: z.number().optional(),
})

