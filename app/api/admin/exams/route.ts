import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PASS = process.env.ADMIN_PASS || 'change_me'

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const password = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('pass')
  return password === ADMIN_PASS
}

// GET: Бүх сорилууд эсвэл нэг сорил авах
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Нэвтрэх эрх хүрэхгүй' }, { status: 401 })
  }

  const gradeParam = request.nextUrl.searchParams.get('grade')
  const variantParam = request.nextUrl.searchParams.get('variant')

  try {
    // Always fetch all active exams; filter in code to handle numeric/text grades
    const { data: exams, error } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('active', true)

    if (error) {
      console.error('Exams fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map sections_public and normalize grade as string
    let mappedExams = exams?.map((exam: any) => ({
      ...exam,
      grade: exam.grade?.toString?.() || '',
      public_sections: exam.sections_public || exam.public_sections
    })) || []

    // Optional client-side filter (after normalizing grade)
    if (gradeParam) {
      mappedExams = mappedExams.filter((e: any) => e.grade === gradeParam)
    }
    if (variantParam) {
      mappedExams = mappedExams.filter((e: any) => e.variant === variantParam)
    }

    return NextResponse.json({ exams: mappedExams })
  } catch (err) {
    console.error('GET /api/admin/exams error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT: Сорилын мэдээлэл засах
export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Нэвтрэх эрх хүрэхгүй' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, grade, variant, public_sections, answer_key } = body

    if (!id || !grade || !variant) {
      return NextResponse.json({ error: 'ID, grade, variant шаардлагатай' }, { status: 400 })
    }

    const updateData: any = {}

    if (public_sections) {
      // Validate matching right side - ensure it contains text, not numbers
      if (public_sections.matching && public_sections.matching.right) {
        const invalidItems = public_sections.matching.right
          .map((item: any, idx: number) => {
            const strValue = String(item || '').trim()
            const isNumber = typeof item === 'number' || 
                            /^[\d.]+$/.test(strValue) || 
                            /^\d+\.?\d*$/.test(strValue)
            if (isNumber && strValue !== '') {
              return { index: idx, value: item }
            }
            return null
          })
          .filter((item: any) => item !== null)
        
        if (invalidItems.length > 0) {
          console.error('Invalid matching right items (numbers instead of text):', invalidItems)
          return NextResponse.json({ 
            error: `Харгалзуулах асуултын баруун талд тоонууд байна. Текст оруулах хэрэгтэй. Алдаатай байрлал: ${invalidItems.map((i: any) => i.index + 1).join(', ')}` 
          }, { status: 400 })
        }
      }
      
      updateData.sections_public = public_sections // Use correct column name
    }

    if (answer_key) {
      updateData.answer_key = answer_key
    }

    const { data, error } = await supabaseAdmin
      .from('exams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Exam update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exam: data })
  } catch (err) {
    console.error('PUT /api/admin/exams error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Шинэ сорил үүсгэх
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Нэвтрэх эрх хүрэхгүй' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { grade, variant, public_sections, answer_key } = body

    if (!grade || !variant) {
      return NextResponse.json({ error: 'grade, variant шаардлагатай' }, { status: 400 })
    }

    // Check if exam already exists (including inactive ones)
    const { data: existing } = await supabaseAdmin
      .from('exams')
      .select('id, active')
      .eq('grade', grade)
      .eq('variant', variant)
      .maybeSingle()

    if (existing) {
      if (existing.active) {
        return NextResponse.json({ error: 'Энэ сорил аль хэдийн байна. Устгаад дахин үүсгэнэ үү?' }, { status: 400 })
      } else {
        // Reactivate existing exam
        const { data: reactivated, error: reactivateError } = await supabaseAdmin
          .from('exams')
          .update({ 
            active: true,
            sections_public: public_sections || { mcq: [], matching: { left: [], right: [] } },
            answer_key: answer_key || { mcqKey: {}, matchKey: {} }
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (reactivateError) {
          return NextResponse.json({ error: reactivateError.message }, { status: 500 })
        }

        const mappedExam = {
          ...reactivated,
          public_sections: reactivated.sections_public || reactivated.public_sections
        }
        return NextResponse.json({ exam: mappedExam }, { status: 200 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert({
        grade,
        variant,
        sections_public: public_sections || { mcq: [], matching: { left: [], right: [] } }, // Use correct column name
        answer_key: answer_key || { mcqKey: {}, matchKey: {} },
        active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Exam create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map sections_public to public_sections for frontend compatibility
    const mappedExam = {
      ...data,
      public_sections: data.sections_public || data.public_sections
    }

    return NextResponse.json({ exam: mappedExam }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/exams error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Сорил устгах (active = false болгох)
export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Нэвтрэх эрх хүрэхгүй' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID шаардлагатай' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('exams')
      .update({ active: false })
      .eq('id', id)

    if (error) {
      console.error('Exam delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/exams error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

