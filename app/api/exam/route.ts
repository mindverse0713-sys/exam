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

    // Transform sections for client
    const sections = { ...exam.sections_public }
    
    // Transform MCQ options from object to array
    if (sections.mcq && Array.isArray(sections.mcq)) {
      sections.mcq = sections.mcq.map((q: any, idx: number) => {
        // If options is already an array, use it
        if (Array.isArray(q.options)) {
          return { i: idx + 1, q: q.q, options: q.options }
        }
        // If options is an object, convert to array [A, B, C, D]
        if (q.options && typeof q.options === 'object') {
          const optArray = ['A', 'B', 'C', 'D'].map(letter => q.options[letter] || '')
          return { i: idx + 1, q: q.q, options: optArray }
        }
        // Fallback
        return { i: idx + 1, q: q.q || '', options: [] }
      })
    }
    
    // Shuffle matching right side for client and create mapping
    // shuffleMapping[i] = original index (1-based) of item at shuffled position i+1
    let shuffleMapping: number[] = []
    if (sections.matching && sections.matching.right) {
      const original = [...sections.matching.right]
      const shuffled = [...sections.matching.right]
      // Fisher-Yates shuffle with index tracking
      const indices = original.map((_, idx) => idx) // Track original indices
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap both arrays and indices
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        [indices[i], indices[j]] = [indices[j], indices[i]]
      }
      // Create mapping: shuffled position -> original index (1-based)
      shuffleMapping = indices.map(idx => idx + 1)
      sections.match = {
        left: sections.matching.left || [],
        right: shuffled
      }
    } else if (sections.match && sections.match.right) {
      const original = [...sections.match.right]
      const shuffled = [...sections.match.right]
      // Fisher-Yates shuffle with index tracking
      const indices = original.map((_, idx) => idx) // Track original indices
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap both arrays and indices
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        [indices[i], indices[j]] = [indices[j], indices[i]]
      }
      // Create mapping: shuffled position -> original index (1-based)
      shuffleMapping = indices.map(idx => idx + 1)
      sections.match.right = shuffled
    }

    // Store shuffle mapping in attempt's meta field for later grading
    if (shuffleMapping.length > 0) {
      await supabaseAdmin
        .from('attempts')
        .update({ meta: { shuffleMapping } })
        .eq('id', attemptId)
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

