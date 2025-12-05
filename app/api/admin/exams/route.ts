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
    let query = supabaseAdmin
      .from('exams')
      .select('*')
      .eq('active', true)

    if (gradeParam) {
      query = query.eq('grade', parseInt(gradeParam))
    }

    if (variantParam) {
      query = query.eq('variant', variantParam)
    }

    const { data: exams, error } = await query

    if (error) {
      console.error('Exams fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exams })
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

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (public_sections) {
      updateData.public_sections = public_sections
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

    // Check if exam already exists
    const { data: existing } = await supabaseAdmin
      .from('exams')
      .select('id')
      .eq('grade', grade)
      .eq('variant', variant)
      .eq('active', true)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Энэ сорил аль хэдийн байна' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert({
        grade,
        variant,
        public_sections: public_sections || { mcq: [], matching: { left: [], right: [] } },
        answer_key: answer_key || { mcqKey: {}, matchKey: {} },
        active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Exam create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exam: data }, { status: 201 })
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

