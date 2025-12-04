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

    // ==== ANALYSIS-STYLE EXCEL (\"анализ хийх хүснэгт\" загвар) ====
    // Нэг sheet = нэг анги. Багана:
    // A: Сурагчийн нэр
    // B–AY: 1–50 (асуулт тус бүрийн оноо: 1 = зөв, 0 = буруу, хоосон = байхгүй)
    // AZ: Авсан (нийт оноо)
    // BA: Дүн (%) – ойролцоо хувь

    type AttemptRow = typeof attempts[0]

    // 1. Grade-ээр бүлэглэх
    const byGrade: Record<number, AttemptRow[]> = {}
    for (const attempt of attempts as AttemptRow[]) {
      if (!byGrade[attempt.grade]) {
        byGrade[attempt.grade] = []
      }
      byGrade[attempt.grade].push(attempt)
    }

    // 2. Grade+Variant бүрээр answer_key татах (асуулт бүрийн зөв хариу)
    type AnswerKey = {
      mcqKey: Record<string, string>
      matchKey: Record<string, number>
    }

    const examKeyMap = new Map<string, AnswerKey>()
    const combos = new Set<string>()

    for (const attempt of attempts as AttemptRow[]) {
      combos.add(`${attempt.grade}-${attempt.variant}`)
    }

    for (const key of combos) {
      const [gradeStrKey, variantKey] = key.split('-')
      const gradeKey = parseInt(gradeStrKey, 10)

      const { data: exam, error: examError } = await supabaseAdmin
        .from('exams')
        .select('answer_key')
        .eq('grade', gradeKey)
        .eq('variant', variantKey)
        .eq('active', true)
        .single()

      if (!examError && exam?.answer_key) {
        examKeyMap.set(key, exam.answer_key as AnswerKey)
      }
    }

    // 3. Workbook үүсгэх
    const workbook = XLSX.utils.book_new()

    // 4. Нэг ангид нэг sheet (\"анализ хийх хүснэгт\" загвар)
    // A: №
    // B: Сурагчийн нэр
    // C–V: 1–20 (асуулт тус бүрийн оноо: 1 = зөв, 0 = буруу)
    // W: Авсан (нийт оноо)
    // X: Дүн (%) – ойролцоо хувь
    // Y: Түвшин (I–VIII гэх мэт, хувиас тооцсон)
    for (const [gradeStr, gradeAttempts] of Object.entries(byGrade)) {
      const header: (string | number)[] = ['№', 'Сурагчийн нэр']
      for (let i = 1; i <= 20; i++) {
        header.push(i)
      }
      header.push('Авсан', 'Дүн (%)', 'Түвшин')

      const dataRows: (string | number)[][] = []

      ;(gradeAttempts as AttemptRow[]).forEach((attempt, index) => {
        const comboKey = `${attempt.grade}-${attempt.variant}`
        const answerKey = examKeyMap.get(comboKey)

        const qScores: number[] = []

        if (answerKey) {
          // MCQ (1–12)
          const answersMcq = (attempt.answers_mcq || {}) as Record<string, string>
          for (let q = 1; q <= 12; q++) {
            const keyStr = String(q)
            const correct = answerKey.mcqKey?.[keyStr]
            const student = answersMcq?.[keyStr]
            if (correct && student) {
              qScores.push(student === correct ? 1 : 0)
            } else {
              qScores.push(0)
            }
          }

          // Matching (13–20) – индексийг 1–8 гэж үзээд +12 шилжүүлнэ
          const answersMatch = (attempt.answers_match || {}) as Record<string, number>
          for (let q = 1; q <= 8; q++) {
            const keyStr = String(q)
            const correctIndex = answerKey.matchKey?.[keyStr]
            const studentRaw = answersMatch?.[keyStr]
            // answersMatch утгуудыг тоо гэж үзнэ (1–8 индекс).
            // TypeScript-д 'never' алдаа гарахаас сэргийлж, нэмэлт parse хийхгүй.
            const studentIndex = typeof studentRaw === 'number' ? studentRaw : 0

            if (correctIndex != null && !Number.isNaN(studentIndex) && studentIndex > 0) {
              qScores.push(studentIndex === correctIndex ? 1 : 0)
            } else {
              qScores.push(0)
            }
          }
        } else {
          // Хэрэв answer_key олдоогүй бол эхний 20-г 0-ээр дүүргэнэ
          for (let q = 1; q <= 20; q++) {
            qScores.push(0)
          }
        }

        // нийт 20 багана – 20 асуултын оноо
        const qColumns: (number | string)[] = []
        for (let i = 0; i < 20; i++) {
          if (i < qScores.length) {
            qColumns.push(qScores[i])
          } else {
            qColumns.push('')
          }
        }

        const score =
          typeof attempt.score === 'number' ? attempt.score : qScores.reduce((a, b) => a + b, 0)
        const total =
          typeof attempt.total === 'number' && attempt.total > 0 ? attempt.total : qScores.length || 20

        let percent: number | '' = ''
        if (total > 0) {
          percent = Math.round((score / total) * 100)
        }

        // Түвшин (ойролцоогоор I–VIII)
        let level = ''
        if (typeof percent === 'number') {
          if (percent >= 90) level = 'I'
          else if (percent >= 80) level = 'II'
          else if (percent >= 70) level = 'III'
          else if (percent >= 60) level = 'IV'
          else if (percent >= 50) level = 'V'
          else if (percent >= 40) level = 'VI'
          else if (percent >= 30) level = 'VII'
          else level = 'VIII'
        }

        const row: (string | number)[] = [
          index + 1, // №
          attempt.student_name || '',
          ...qColumns,
          score,
          percent,
          level,
        ]

        dataRows.push(row)
      })

      const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows])
      XLSX.utils.book_append_sheet(workbook, worksheet, `${gradeStr}-р анги`)
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

