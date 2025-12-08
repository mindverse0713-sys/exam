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
    
    // Debug: Log the raw data structure
    console.log('=== EXAM API DEBUG ===')
    console.log('Raw sections_public type:', typeof exam.sections_public)
    console.log('Raw sections_public:', JSON.stringify(exam.sections_public, null, 2))
    console.log('Matching data:', sections.matching)
    if (sections.matching) {
      console.log('Matching right type:', typeof sections.matching.right)
      console.log('Matching right is array:', Array.isArray(sections.matching.right))
      console.log('Matching right length:', sections.matching.right?.length)
      console.log('Matching right values:', sections.matching.right)
      if (sections.matching.right) {
        sections.matching.right.forEach((item: any, idx: number) => {
          console.log(`  Right[${idx}]:`, item, 'Type:', typeof item, 'IsNumber:', typeof item === 'number')
        })
      }
    }
    
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
      // Debug: Log what we're getting
      console.log('=== MATCHING RIGHT PROCESSING ===')
      console.log('Matching right before processing:', sections.matching.right)
      console.log('Type of right items:', sections.matching.right.map((item: any) => typeof item))
      console.log('Right items details:')
      sections.matching.right.forEach((item: any, idx: number) => {
        console.log(`  [${idx}]: "${item}" (type: ${typeof item}, length: ${String(item).length})`)
      })
      
      // Filter out numbers and keep only valid text entries
      const original = (sections.matching.right || [])
        .map((item: any, idx: number) => {
          const strValue = String(item || '').trim()
          
          // Check if item is a number (including decimals)
          const isNumber = typeof item === 'number' || 
                          (strValue.length <= 10 && /^[\d.]+$/.test(strValue)) || 
                          /^\d+\.?\d*$/.test(strValue) ||
                          /^[\d]+\.?[\d]*$/.test(strValue)
          
          // If it's a number, skip it completely
          if (isNumber && strValue !== '') {
            return null
          }
          
          // Skip empty or very short values
          if (strValue === '' || strValue.length < 2) {
            return null
          }
          
          // Skip if it's only digits and dots
          if (/^[\d.\s]+$/.test(strValue)) {
            return null
          }
          
          // Return valid text
          return strValue
        })
        .filter((item: string | null): item is string => item !== null && item.trim() !== '' && item.length >= 2)
      
      console.log('Matching right after processing:', original)
      console.log('Filtered out count:', (sections.matching.right?.length || 0) - original.length)
      const shuffled = [...original]
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
        left: (sections.matching.left || []).map((item: any) => String(item || '')).filter((item: string) => item.trim() !== ''),
        right: shuffled
      }
    } else if (sections.match && sections.match.right) {
      // Ensure all items are strings and filter out invalid entries
      const original = (sections.match.right || [])
        .map((item: any, idx: number) => {
          const strValue = String(item || '').trim()
          
          // Check if item looks like a number (including decimals)
          const isNumber = typeof item === 'number' || 
                          /^[\d.]+$/.test(strValue) || 
                          /^\d+\.?\d*$/.test(strValue) ||
                          /^[\d]+\.?[\d]*$/.test(strValue) ||
                          (strValue.length <= 5 && /^[\d.]+$/.test(strValue.replace(/[^\d.]/g, '')))
          
          if (isNumber && strValue !== '') {
            console.error(`ERROR: Matching right item ${idx} is a number (${item}) instead of text!`)
            return null
          }
          
          if (strValue === '' || strValue.length < 2 || /^[\d.\s]+$/.test(strValue)) {
            return null
          }
          
          return strValue
        })
        .filter((item: string | null): item is string => item !== null && item.trim() !== '' && item.length >= 2)
      const shuffled = [...original]
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
        left: (sections.match.left || []).map((item: any) => String(item || '')).filter((item: string) => item.trim() !== ''),
        right: shuffled
      }
    }

    // Store shuffle mapping in attempt's meta field for later grading
    if (shuffleMapping.length > 0) {
      await supabaseAdmin
        .from('attempts')
        .update({ meta: { shuffleMapping } })
        .eq('id', attemptId)
    }

    // Final validation - remove any numbers that slipped through
    if (sections.match && sections.match.right) {
      console.log('=== FINAL VALIDATION ===')
      console.log('Before final validation:', sections.match.right)
      console.log('Types:', sections.match.right.map((item: any) => typeof item))
      
      sections.match.right = sections.match.right
        .map((item: any, idx: number) => {
          const strValue = String(item || '').trim()
          const isNumber = typeof item === 'number' || 
                          (strValue.length <= 10 && /^[\d.]+$/.test(strValue)) || 
                          /^\d+\.?\d*$/.test(strValue)
          
          if (isNumber) {
            console.log(`Filtering out number at index ${idx}: ${item}`)
            return null
          }
          
          return strValue
        })
        .filter((item: string | null): item is string => item !== null && item.trim() !== '' && item.length >= 2)
      
      console.log('After final validation:', sections.match.right)
      
      // If still has numbers, force filter one more time
      const stillHasNumbers = sections.match.right.some((item: any) => {
        const strValue = String(item || '').trim()
        return typeof item === 'number' || /^[\d.]+$/.test(strValue)
      })
      
      if (stillHasNumbers) {
        console.error('CRITICAL: Still has numbers after final validation! Force filtering...')
        sections.match.right = sections.match.right
          .filter((item: any) => {
            const strValue = String(item || '').trim()
            const isNumber = typeof item === 'number' || /^[\d.]+$/.test(strValue)
            return !isNumber && strValue.length >= 2
          })
        console.log('After force filter:', sections.match.right)
      }
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

