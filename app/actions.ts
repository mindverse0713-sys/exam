'use server'

import { redirect } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { startExamSchema, submitExamSchema } from '@/lib/schemas'

export async function startExam(formData: FormData) {
  let errorMessage = ''
  
  try {
    const rawData = {
      name: formData.get('name')?.toString() || '',
      grade: (formData.get('grade')?.toString() || '').trim(),
      variant: formData.get('variant')?.toString() || '',
    }

    // Validate input
    if (!rawData.name.trim()) {
      errorMessage = 'Нэрээ оруулна уу'
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
        grade: rawData.grade,
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
  let errorMessage = ''
  
  try {
    const attemptId = formData.get('attemptId')?.toString()
    const answersMcqJson = formData.get('answersMcq')?.toString()
    const answersMatchJson = formData.get('answersMatch')?.toString()
    const clientStartedAt = formData.get('clientStartedAt')?.toString()

    if (!attemptId || !answersMcqJson) {
      errorMessage = 'Мэдээлэл дутуу байна'
      throw new Error(errorMessage)
    }

    let answersMcq: any
    let answersMatch: any = {}
    
    try {
      answersMcq = JSON.parse(answersMcqJson)
      // answersMatch is optional (only for exams with matching questions)
      if (answersMatchJson) {
        answersMatch = JSON.parse(answersMatchJson)
      }
    } catch (parseError) {
      errorMessage = 'Хариултын формат буруу байна'
      throw new Error(errorMessage)
    }

    const startedAtMs = clientStartedAt ? parseInt(clientStartedAt) : null

    // Check environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errorMessage = 'Database тохиргоо дутуу байна: SUPABASE_SERVICE_ROLE_KEY байхгүй. Vercel дээр Environment Variables тохируулах хэрэгтэй.'
      throw new Error(errorMessage)
    }

    // Validate
    let parsed
    try {
      parsed = submitExamSchema.parse({
        attemptId,
        answersMcq,
        answersMatch,
        clientStartedAt: startedAtMs,
      })
    } catch (zodError: any) {
      errorMessage = zodError.errors?.[0]?.message || 'Form validation алдаа'
      throw new Error(errorMessage)
    }

    // Get attempt to find grade/variant and shuffle mapping
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('grade, variant, started_at, meta')
      .eq('id', attemptId)
      .single()

    if (attemptError) {
      console.error('Supabase attempt error:', attemptError)
      if (attemptError.message?.includes('does not exist') || attemptError.message?.includes('relation')) {
        errorMessage = 'Database алдаа: Table үүсээгүй байна. SUPABASE_SETUP.sql файлыг Supabase SQL Editor дээр ажиллуулах хэрэгтэй.'
      } else {
        errorMessage = `Attempt олох алдаа: ${attemptError.message || attemptError.code || 'Тодорхойгүй алдаа'}`
      }
      throw new Error(errorMessage)
    }

    if (!attempt) {
      errorMessage = 'Attempt олдсонгүй'
      throw new Error(errorMessage)
    }

    // Get exam answer key (server-side only)
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select('answer_key')
      .eq('grade', attempt.grade)
      .eq('variant', attempt.variant)
      .eq('active', true)
      .single()

    if (examError) {
      console.error('Supabase exam error:', examError)
      if (examError.message?.includes('does not exist') || examError.message?.includes('relation')) {
        errorMessage = 'Database алдаа: Table үүсээгүй байна. SUPABASE_SETUP.sql файлыг Supabase SQL Editor дээр ажиллуулах хэрэгтэй.'
      } else {
        errorMessage = `Сорил олох алдаа: ${examError.message || examError.code || 'Тодорхойгүй алдаа'}`
      }
      throw new Error(errorMessage)
    }

    if (!exam) {
      errorMessage = 'Сорил олдсонгүй'
      throw new Error(errorMessage)
    }

    const answerKey = exam.answer_key as {
      mcqKey: Record<string, string>
      matchKey?: Record<string, number>
    }

    // Grade MCQ (20 questions)
    let mcqScore = 0
    if (answerKey.mcqKey) {
      for (const [qNum, correctAnswer] of Object.entries(answerKey.mcqKey)) {
        if (answersMcq[qNum] === correctAnswer) {
          mcqScore++
        }
      }
    }

    // Grade Matching (optional, only if matchKey exists)
    let matchScore = 0
    if (answerKey.matchKey && answersMatch) {
      const shuffleMapping = (attempt.meta as any)?.shuffleMapping as number[] | undefined
      for (const [qNum, correctIndex] of Object.entries(answerKey.matchKey)) {
        const studentShuffledIndex = parseInt(answersMatch[qNum]?.toString() || '0')
        // Convert shuffled index (1-based) to original index (1-based)
        let studentOriginalIndex = studentShuffledIndex
        if (shuffleMapping && shuffleMapping.length > 0 && studentShuffledIndex > 0 && studentShuffledIndex <= shuffleMapping.length) {
          studentOriginalIndex = shuffleMapping[studentShuffledIndex - 1] // Convert to 0-based for array access
        }
        if (studentOriginalIndex === correctIndex) {
          matchScore++
        }
      }
    }

    const totalScore = mcqScore + matchScore
    const submittedAt = new Date()

    // Calculate total questions (MCQ count + matching count if exists)
    const totalQuestions = (answerKey.mcqKey ? Object.keys(answerKey.mcqKey).length : 0) + 
                          (answerKey.matchKey ? Object.keys(answerKey.matchKey).length : 0)

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
        total: totalQuestions || 20, // Default to 20 if calculation fails
        answers_mcq: answersMcq,
        answers_match: answersMatch || {},
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      if (updateError.message?.includes('does not exist') || updateError.message?.includes('relation')) {
        errorMessage = 'Database алдаа: Table үүсээгүй байна. SUPABASE_SETUP.sql файлыг Supabase SQL Editor дээр ажиллуулах хэрэгтэй.'
      } else {
        errorMessage = `Хариулт хадгалах алдаа: ${updateError.message || updateError.code || 'Тодорхойгүй алдаа'}`
      }
      throw new Error(errorMessage)
    }

    redirect('/thanks')
  } catch (error: any) {
    console.error('submitExam error:', error)
    
    // If it's a redirect error, re-throw it (don't catch redirects)
    if (error && typeof error === 'object' && 'digest' in error && 
        (error.digest?.includes('NEXT_REDIRECT') || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    
    // Use our error message or the error's message
    let finalMessage = errorMessage
    
    if (!finalMessage && error instanceof Error) {
      finalMessage = error.message
    }
    
    if (!finalMessage) {
      finalMessage = 'Хариулт илгээхэд алдаа гарлаа. Дахин оролдоно уу.'
    }
    
    // Create error with proper message
    const finalError = new Error(finalMessage)
    
    // Preserve error details for debugging
    if (error?.digest) {
      (finalError as any).digest = error.digest
    }
    
    throw finalError
  }
}

