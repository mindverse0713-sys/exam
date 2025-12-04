import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

const ADMIN_PASS = process.env.ADMIN_PASS || 'change_me'

export async function GET(request: NextRequest) {
  // Check auth
  const authHeader = request.headers.get('authorization')
  const password = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('pass')

  if (password !== ADMIN_PASS) {
    return NextResponse.json({ error: 'Нэвтрэх эрх хүрэхгүй' }, { status: 401 })
  }

  const gradeParam = request.nextUrl.searchParams.get('grade')
  const variantParam = request.nextUrl.searchParams.get('variant')
  const dateFrom = request.nextUrl.searchParams.get('dateFrom')
  const dateTo = request.nextUrl.searchParams.get('dateTo')

  try {
    // Build query
    let query = supabaseAdmin
      .from('attempts')
      .select('*')
      .order('started_at', { ascending: false })

    if (gradeParam && gradeParam !== 'all') {
      query = query.eq('grade', parseInt(gradeParam))
    }

    if (variantParam && variantParam !== 'all') {
      query = query.eq('variant', variantParam)
    }

    if (dateFrom) {
      query = query.gte('started_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('started_at', dateTo)
    }

    const { data: attempts, error } = await query

    if (error) {
      throw error
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ error: 'Өгөгдөл олдсонгүй' }, { status: 404 })
    }

    // Group by grade
    const byGrade: Record<number, typeof attempts> = {}
    for (const attempt of attempts) {
      if (!byGrade[attempt.grade]) {
        byGrade[attempt.grade] = []
      }
      byGrade[attempt.grade].push(attempt)
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Create sheet for each grade
    for (const [gradeStr, gradeAttempts] of Object.entries(byGrade)) {
      const rows = gradeAttempts.map((attempt: typeof attempts[0]) => ({
        'Оюутан': attempt.student_name,
        'Анги': attempt.grade,
        'Хувилбар': attempt.variant,
        'Эхэлсэн': attempt.started_at ? new Date(attempt.started_at).toLocaleString('mn-MN') : '',
        'Дууссан': attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('mn-MN') : '',
        'Хугацаа (сек)': attempt.duration_sec || '',
        'Оноо': attempt.score ?? '',
        'Нийт': attempt.total || 20,
      }))

      const worksheet = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(workbook, worksheet, `${gradeStr}-р анги`)
    }

    // If variant filter is specific, also create variant-specific sheet
    if (variantParam && variantParam !== 'all' && gradeParam && gradeParam !== 'all') {
      const variantAttempts = attempts.filter(
        (a: typeof attempts[0]) => a.grade === parseInt(gradeParam) && a.variant === variantParam
      )
      if (variantAttempts.length > 0) {
        const rows = variantAttempts.map((attempt: typeof attempts[0]) => ({
          'Оюутан': attempt.student_name,
          'Анги': attempt.grade,
          'Хувилбар': attempt.variant,
          'Эхэлсэн': attempt.started_at ? new Date(attempt.started_at).toLocaleString('mn-MN') : '',
          'Дууссан': attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('mn-MN') : '',
          'Хугацаа (сек)': attempt.duration_sec || '',
          'Оноо': attempt.score ?? '',
          'Нийт': attempt.total || 20,
        }))

        const worksheet = XLSX.utils.json_to_sheet(rows)
        XLSX.utils.book_append_sheet(workbook, worksheet, `Хувилбар ${variantParam}`)
      }
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return file
    const filename = `results_${new Date().toISOString().split('T')[0]}.xlsx`
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Экспорт хийхэд алдаа гарлаа' }, { status: 500 })
  }
}

