'use server'

import { redirect } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { startExamSchema, submitExamSchema } from '@/lib/schemas'

export async function startExam(formData: FormData) {
  const rawData = {
    name: formData.get('name')?.toString() || '',
    grade: parseInt(formData.get('grade')?.toString() || '0'),
    variant: formData.get('variant')?.toString() || '',
  }

  // Validate
  const parsed = startExamSchema.parse({
    name: rawData.name,
    grade: rawData.grade as 10 | 11 | 12,
    variant: rawData.variant as 'A' | 'B',
  })

  // Create attempt
  const { data, error } = await supabase
    .from('attempts')
    .insert({
      student_name: parsed.name,
      grade: parsed.grade,
      variant: parsed.variant,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error('Attempt үүсгэхэд алдаа гарлаа')
  }

  redirect(`/exam/${data.id}`)
}

export async function submitExam(formData: FormData) {
  const attemptId = formData.get('attemptId')?.toString()
  const answersMcqJson = formData.get('answersMcq')?.toString()
  const answersMatchJson = formData.get('answersMatch')?.toString()
  const clientStartedAt = formData.get('clientStartedAt')?.toString()

  if (!attemptId || !answersMcqJson || !answersMatchJson) {
    throw new Error('Мэдээлэл дутуу байна')
  }

  const answersMcq = JSON.parse(answersMcqJson)
  const answersMatch = JSON.parse(answersMatchJson)
  const startedAtMs = clientStartedAt ? parseInt(clientStartedAt) : null

  // Validate
  const parsed = submitExamSchema.parse({
    attemptId,
    answersMcq,
    answersMatch,
    clientStartedAt: startedAtMs,
  })

  // Get attempt to find grade/variant
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('grade, variant, started_at')
    .eq('id', attemptId)
    .single()

  if (attemptError || !attempt) {
    throw new Error('Attempt олдсонгүй')
  }

  // Get exam answer key (server-side only)
  const { data: exam, error: examError } = await supabaseAdmin
    .from('exams')
    .select('answer_key')
    .eq('grade', attempt.grade)
    .eq('variant', attempt.variant)
    .eq('active', true)
    .single()

  if (examError || !exam) {
    throw new Error('Сорил олдсонгүй')
  }

  const answerKey = exam.answer_key as {
    mcqKey: Record<string, string>
    matchKey: Record<string, number>
  }

  // Grade MCQ (12 questions)
  let mcqScore = 0
  for (const [qNum, correctAnswer] of Object.entries(answerKey.mcqKey)) {
    if (answersMcq[qNum] === correctAnswer) {
      mcqScore++
    }
  }

  // Grade Matching (8 questions)
  let matchScore = 0
  for (const [qNum, correctIndex] of Object.entries(answerKey.matchKey)) {
    const studentAnswer = parseInt(answersMatch[qNum]?.toString() || '0')
    if (studentAnswer === correctIndex) {
      matchScore++
    }
  }

  const totalScore = mcqScore + matchScore
  const submittedAt = new Date()

  // Calculate duration
  let durationSec: number | null = null
  if (startedAtMs) {
    durationSec = Math.floor((submittedAt.getTime() - startedAtMs) / 1000)
  } else if (attempt.started_at) {
    const started = new Date(attempt.started_at)
    durationSec = Math.floor((submittedAt.getTime() - started.getTime()) / 1000)
  }

  // Update attempt (using admin client)
  const { error: updateError } = await supabaseAdmin
    .from('attempts')
    .update({
      submitted_at: submittedAt.toISOString(),
      duration_sec: durationSec,
      score: totalScore,
      answers_mcq: answersMcq,
      answers_match: answersMatch,
    })
    .eq('id', attemptId)

  if (updateError) {
    throw new Error('Хариулт хадгалахад алдаа гарлаа')
  }

  redirect('/thanks')
}

