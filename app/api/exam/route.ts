import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const attemptId = searchParams.get('attemptId')

  if (!attemptId) {
    return NextResponse.json({ error: 'Attempt ID шаардлагатай' }, { status: 400 })
  }

  try {
    // Get attempt to find grade/variant
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('grade, variant')
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt олдсонгүй' }, { status: 404 })
    }

    // Get exam (public sections only, NO answer key)
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select('sections_public')
      .eq('grade', attempt.grade)
      .eq('variant', attempt.variant)
      .eq('active', true)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Сорил олдсонгүй' }, { status: 404 })
    }

    // Shuffle matching right side for client
    const sections = { ...exam.sections_public }
    if (sections.match && sections.match.right) {
      const shuffled = [...sections.match.right]
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      sections.match.right = shuffled
    }

    return NextResponse.json({
      grade: attempt.grade,
      variant: attempt.variant,
      sections,
      durationSec: 1200, // 20 minutes
    })
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json({ error: 'Алдаа гарлаа' }, { status: 500 })
  }
}

