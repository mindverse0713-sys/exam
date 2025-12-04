'use server'

import { redirect } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { startExamSchema, submitExamSchema } from '@/lib/schemas'

export async function startExam(formData: FormData) {
  'use server'
  
  let errorMessage = ''
  
  try {
    const rawData = {
      name: formData.get('name')?.toString() || '',
      grade: parseInt(formData.get('grade')?.toString() || '0'),
      variant: formData.get('variant')?.toString() || '',
    }

    // Validate input
    if (!rawData.name.trim()) {
      errorMessage = 'Нэрээ оруулна уу'
      throw new Error(errorMessage)
    }

    if (![10, 11, 12].includes(rawData.grade)) {
      errorMessage = 'Зөв анги сонгоно уу (10, 11, эсвэл 12)'
      throw new Error(errorMessage)
    }

    if (!['A', 'B'].includes(rawData.variant)) {
      errorMessage = 'Зөв хувилбар сонгоно уу (A эсвэл B)'
      throw new Error(errorMessage)
    }

    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errorMessage = 'Database тохиргоо дутуу байна: NEXT_PUBLIC_SUPABASE_URL байхгүй. Vercel дээр Environment Variables тохируулах хэрэгтэй.'
      throw new Error(errorMessage)
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errorMessage = 'Database тохиргоо дутуу байна: NEXT_PUBLIC_SUPABASE_ANON_KEY байхгүй. Vercel дээр Environment Variables тохируулах хэрэгтэй.'
      throw new Error(errorMessage)
    }

    // Validate with Zod
    let parsed
    try {
      parsed = startExamSchema.parse({
        name: rawData.name,
        grade: rawData.grade as 10 | 11 | 12,
        variant: rawData.variant as 'A' | 'B',
      })
    } catch (zodError: any) {
      errorMessage = zodError.errors?.[0]?.message || 'Form validation алдаа'
      throw new Error(errorMessage)
    }

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

    if (error) {
      console.error('Supabase error:', error)
      
      // Provide more specific error messages
      if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        errorMessage = 'Database алдаа: RLS policy тохируулаагүй байна. FIX_NOW.sql файлыг Supabase SQL Editor дээр ажиллуулах хэрэгтэй.'
      } else if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        errorMessage = 'Database алдаа: Table үүсээгүй байна. SUPABASE_SETUP.sql файлыг Supabase SQL Editor дээр ажиллуулах хэрэгтэй.'
      } else {
        errorMessage = `Database алдаа: ${error.message || error.code || 'Тодорхойгүй алдаа'}`
      }
      throw new Error(errorMessage)
    }

    if (!data || !data.id) {
      errorMessage = 'Attempt үүсгэхэд алдаа: Data буцаагүй'
      throw new Error(errorMessage)
    }

    redirect(`/exam/${data.id}`)
  } catch (error: any) {
    console.error('startExam error:', error)
    
    // If it's a redirect error, re-throw it
    if (error && typeof error === 'object' && 'digest' in error && error.digest?.includes('NEXT_REDIRECT')) {
      throw error
    }
    
    // Use our error message or the error's message
    const finalMessage = errorMessage || (error instanceof Error ? error.message : 'Сорил эхлүүлэхэд алдаа гарлаа')
    
    // Create a more descriptive error
    throw new Error(finalMessage)
  }
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

