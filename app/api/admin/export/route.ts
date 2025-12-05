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
    console.log('=== Excel export эхэллээ ===')
    console.log('Filter params:', { gradeParam, variantParam, dateFrom, dateTo })

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
      console.error('Supabase error:', error)
      throw error
    }

    if (!attempts || attempts.length === 0) {
      console.log('Өгөгдөл олдсонгүй')
      return NextResponse.json({ error: 'Өгөгдөл олдсонгүй' }, { status: 404 })
    }

    console.log(`Нийт ${attempts.length} оролдлого олдлоо`)

    type AttemptRow = typeof attempts[0]

    // 1. Grade-ээр бүлэглэх
    const byGrade: Record<number, AttemptRow[]> = {}
    for (const attempt of attempts as AttemptRow[]) {
      if (!byGrade[attempt.grade]) {
        byGrade[attempt.grade] = []
      }
      byGrade[attempt.grade].push(attempt)
    }

    console.log('Ангиуд:', Object.keys(byGrade))
    console.log('Анги бүрийн сурагч:', Object.entries(byGrade).map(([g, arr]) => `${g}-р анги: ${arr.length}`))

    // 2. Grade+Variant бүрээр answer_key татах
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
        console.log(`Answer key олдлоо: ${key}`)
      } else {
        console.warn(`Answer key олдсонгүй: ${key}`)
      }
    }

    // 3. Workbook үүсгэх
    const workbook = XLSX.utils.book_new()

    for (const [gradeStr, gradeAttempts] of Object.entries(byGrade)) {
      const gradeNum = parseInt(gradeStr, 10)
      console.log(`\n=== Анги ${gradeNum} боловсруулж байна ===`)
      console.log(`Сурагчдын тоо: ${gradeAttempts.length}`)

      if (gradeAttempts.length === 0) {
        console.warn(`Анги ${gradeNum} хоосон байна, алгасах`)
        continue
      }

      // Header үүсгэх
      const header: (string | number)[] = ['№', 'Сурагчийн нэр']
      for (let i = 1; i <= 20; i++) {
        header.push(i)
      }
      header.push('Авсан', 'Дүн (%)', 'Түвшин')

      const dataRows: (string | number)[][] = []

      // Сурагч бүрийн мэдээллийг боловсруулах
      for (let index = 0; index < gradeAttempts.length; index++) {
        const attempt = gradeAttempts[index]
        console.log(`  Сурагч ${index + 1}: ${attempt.student_name}`)

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

          // Matching (13–20)
          const answersMatch = (attempt.answers_match || {}) as Record<string, number>
          for (let q = 1; q <= 8; q++) {
            const keyStr = String(q)
            const correctIndex = answerKey.matchKey?.[keyStr]
            const studentRaw = answersMatch?.[keyStr]
            const studentIndex = typeof studentRaw === 'number' ? studentRaw : 0

            if (correctIndex != null && !Number.isNaN(studentIndex) && studentIndex > 0) {
              qScores.push(studentIndex === correctIndex ? 1 : 0)
            } else {
              qScores.push(0)
            }
          }
        } else {
          // Answer key байхгүй бол бүх асуулт 0
          for (let q = 1; q <= 20; q++) {
            qScores.push(0)
          }
        }

        // Дүн тооцох
        const hasSubmitted = attempt.submitted_at !== null && attempt.submitted_at !== undefined
        const hasScore = attempt.score !== null && attempt.score !== undefined

        const score = hasScore
          ? (typeof attempt.score === 'number' ? attempt.score : qScores.reduce((a, b) => a + b, 0))
          : hasSubmitted
          ? qScores.reduce((a, b) => a + b, 0)
          : null

        const total =
          typeof attempt.total === 'number' && attempt.total > 0 ? attempt.total : 20

        let percent: number | string = ''
        const finalScore = score !== null ? score : (hasSubmitted ? qScores.reduce((a, b) => a + b, 0) : null)
        if (finalScore !== null && total > 0) {
          percent = Math.round((finalScore / total) * 100)
        }

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
          index + 1,
          attempt.student_name || '',
          ...qScores,
          finalScore !== null ? finalScore : '',
          percent,
          level,
        ]

        dataRows.push(row)
        console.log(`    Дүн: ${finalScore}, Хувь: ${percent}%, Түвшин: ${level}`)
      }

      console.log(`  Нийт мөр: ${dataRows.length}`)

      // Sheet үүсгэх
      const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows])
      const sheetName = `${gradeNum}-р анги`
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      console.log(`  Sheet "${sheetName}" нэмэгдлээ`)
    }

    console.log('\n=== Workbook үүссэн ===')
    console.log('Sheet name-үүд:', workbook.SheetNames)
    console.log('Sheet тоо:', workbook.SheetNames.length)

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return file
    const filename = `results_${new Date().toISOString().split('T')[0]}.xlsx`
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (err) {
    console.error('Excel export error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
