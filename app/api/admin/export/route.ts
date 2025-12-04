import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'
import { join } from 'path'

const ADMIN_PASS = process.env.ADMIN_PASS || 'change_me'

// Template файлын байршил
const TEMPLATE_PATH = join(process.cwd(), 'templates', 'анализ хийх хүснэгт.xlsx')

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

    type AttemptRow = typeof attempts[0]

    // 1. Grade-ээр бүлэглэх
    const byGrade: Record<number, AttemptRow[]> = {}
    for (const attempt of attempts as AttemptRow[]) {
      if (!byGrade[attempt.grade]) {
        byGrade[attempt.grade] = []
      }
      byGrade[attempt.grade].push(attempt)
    }

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
      }
    }

    // 3. Template файл байгаа эсэхийг шалгах
    let useTemplate = false
    let templateWorkbook: XLSX.WorkBook | null = null

    try {
      const templateBuffer = readFileSync(TEMPLATE_PATH)
      templateWorkbook = XLSX.read(templateBuffer, { type: 'buffer' })
      useTemplate = true
    } catch (templateError) {
      console.warn('Template файл олдсонгүй, одоогийн формат ашиглана:', templateError)
      useTemplate = false
    }

    let workbook: XLSX.WorkBook

    if (useTemplate && templateWorkbook) {
      // Template ашиглах
      workbook = templateWorkbook

      // Нэг ангид нэг sheet
      for (const [gradeStr, gradeAttempts] of Object.entries(byGrade)) {
        const sheetName = `${gradeStr}-р анги`
        let worksheet = workbook.Sheets[sheetName]

        // Хэрэв sheet байхгүй бол template-ийн эхний sheet-ийг хуулна
        if (!worksheet) {
          const firstSheetName = workbook.SheetNames[0]
          if (firstSheetName) {
            const firstSheet = workbook.Sheets[firstSheetName]
            // Sheet хуулах
            const newSheet = JSON.parse(JSON.stringify(firstSheet))
            workbook.Sheets[sheetName] = newSheet
            worksheet = newSheet
          }
        }

        if (!worksheet) {
          continue
        }

        // Template-ийн бүтцийг олох (сурагчийн мэдээлэл хэдээс эхэлдэг)
        // Default: 11-р мөр (header 10-р мөр байна гэж үзнэ)
        const startRow = 11 // Энэ утгыг template-ийн бүтцэд тохируулах хэрэгтэй
        const colMap: Record<string, string> = {
          number: 'A',      // №
          name: 'B',        // Сурагчийн нэр
          score: 'W',       // Авсан
          percent: 'X',     // Дүн (%)
          level: 'Y',       // Түвшин
        }

        // Асуултын баганууд (1-20)
        const questionCols: string[] = []
        for (let i = 1; i <= 20; i++) {
          const colIndex = i + 2 // C баганаас эхлэнэ (C=1, D=2, ...)
          questionCols.push(XLSX.utils.encode_col(colIndex))
        }

        // Сурагчдын мэдээллийг бөглөх
        ;(gradeAttempts as AttemptRow[]).forEach((attempt, index) => {
          const row = startRow + index
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
            for (let q = 1; q <= 20; q++) {
              qScores.push(0)
            }
          }

          // Сурагч алга бол (score null/undefined) дүн хоосон байх
          const hasScore = attempt.score !== null && attempt.score !== undefined
          
          const score = hasScore
            ? (typeof attempt.score === 'number' ? attempt.score : qScores.reduce((a, b) => a + b, 0))
            : null
          const total =
            typeof attempt.total === 'number' && attempt.total > 0 ? attempt.total : qScores.length || 20

          let percent: number | '' | null = null
          if (hasScore && total > 0 && score !== null) {
            percent = Math.round((score / total) * 100)
          }

          let level = ''
          if (hasScore && typeof percent === 'number') {
            if (percent >= 90) level = 'I'
            else if (percent >= 80) level = 'II'
            else if (percent >= 70) level = 'III'
            else if (percent >= 60) level = 'IV'
            else if (percent >= 50) level = 'V'
            else if (percent >= 40) level = 'VI'
            else if (percent >= 30) level = 'VII'
            else level = 'VIII'
          }

          // Cell-үүдэд утга оруулах
          const cellNumber = `${colMap.number}${row}`
          const cellName = `${colMap.name}${row}`
          const cellScore = `${colMap.score}${row}`
          const cellPercent = `${colMap.percent}${row}`
          const cellLevel = `${colMap.level}${row}`

          if (!worksheet[cellNumber]) worksheet[cellNumber] = { t: 'n', v: 0 }
          if (!worksheet[cellName]) worksheet[cellName] = { t: 's', v: '' }
          if (!worksheet[cellScore]) worksheet[cellScore] = { t: 'n', v: null }
          if (!worksheet[cellPercent]) worksheet[cellPercent] = { t: 'n', v: null }
          if (!worksheet[cellLevel]) worksheet[cellLevel] = { t: 's', v: '' }

          worksheet[cellNumber].v = index + 1
          worksheet[cellName].v = attempt.student_name || ''
          // Сурагч алга бол хоосон байх
          worksheet[cellScore].v = hasScore ? (score ?? '') : ''
          worksheet[cellPercent].v = hasScore && typeof percent === 'number' ? percent : ''
          worksheet[cellLevel].v = level

          // Асуултын баганууд (1-20)
          questionCols.forEach((col, qIndex) => {
            const cellRef = `${col}${row}`
            if (!worksheet[cellRef]) {
              worksheet[cellRef] = { t: 'n', v: 0 }
            }
            worksheet[cellRef].v = qScores[qIndex] || 0
          })
        })
      }
    } else {
      // Template байхгүй бол одоогийн формат ашиглах
      workbook = XLSX.utils.book_new()

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
            for (let q = 1; q <= 20; q++) {
              qScores.push(0)
            }
          }

          // Сурагч алга бол (score null/undefined) дүн хоосон байх
          const hasScore = attempt.score !== null && attempt.score !== undefined
          
          const score = hasScore
            ? (typeof attempt.score === 'number' ? attempt.score : qScores.reduce((a, b) => a + b, 0))
            : null
          const total =
            typeof attempt.total === 'number' && attempt.total > 0 ? attempt.total : qScores.length || 20

          let percent: number | '' | null = null
          if (hasScore && total > 0 && score !== null) {
            percent = Math.round((score / total) * 100)
          }

          let level = ''
          if (hasScore && typeof percent === 'number') {
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
            hasScore ? (score ?? '') : '',
            hasScore && typeof percent === 'number' ? percent : '',
            level,
          ]

          dataRows.push(row)
        })

        const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows])
        XLSX.utils.book_append_sheet(workbook, worksheet, `${gradeStr}-р анги`)
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
