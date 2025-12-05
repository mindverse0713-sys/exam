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

    // Түр хугацаанд template-ийг идэвхгүй болгож, fallback формат ашиглах
    console.log('Template-ийг идэвхгүй болгож, fallback формат ашиглаж байна')
    useTemplate = false

    /*
    try {
      const templateBuffer = readFileSync(TEMPLATE_PATH)
      templateWorkbook = XLSX.read(templateBuffer, { type: 'buffer' })
      useTemplate = true
      console.log('Template файл амжилттай уншлаа. Sheet name-үүд:', templateWorkbook.SheetNames)
    } catch (templateError) {
      console.error('Template файл олдсонгүй, одоогийн формат ашиглана:', templateError)
      console.error('Template path:', TEMPLATE_PATH)
      useTemplate = false
    }
    */

    let workbook: XLSX.WorkBook

    if (false && useTemplate && templateWorkbook) {
      // Template ашиглах
      workbook = templateWorkbook as XLSX.WorkBook

      // Нэг ангид нэг sheet
      for (const [gradeStr, gradeAttempts] of Object.entries(byGrade)) {
        const gradeNum = parseInt(gradeStr, 10)
        const sheetName = `${gradeNum}-р анги`
        let worksheet = workbook.Sheets[sheetName]

        console.log(`=== Анги ${gradeNum} боловсруулж байна ===`)
        console.log(`Сурагчдын тоо: ${gradeAttempts.length}`)
        console.log(`Sheet хайж байна: "${sheetName}"`)
        console.log(`Боломжтой sheet name-үүд:`, workbook.SheetNames)

        // Хэрэв sheet байхгүй бол template-ийн эхний sheet-ийг хуулна
        if (!worksheet) {
          // Эхлээд template-ийн ямар нэг sheet-ийг олох
          let sourceSheetName = workbook.SheetNames.find(name => 
            name.includes('анги') || name.includes('Шалгалт') || name.includes('Sheet')
          ) || workbook.SheetNames[0]
          
          console.log(`Sheet "${sheetName}" олдсонгүй, source sheet "${sourceSheetName}"-ийг хуулж байна`)
          
          if (sourceSheetName) {
            const sourceSheet = workbook.Sheets[sourceSheetName]
            if (!sourceSheet) {
              console.error(`Source sheet "${sourceSheetName}" олдсонгүй`)
              continue
            }
            
            // Sheet хуулах - бүх cell-үүдийг хуулах
            const newSheet: XLSX.WorkSheet = {}
            
            // Бүх cell-үүдийг хуулах
            Object.keys(sourceSheet).forEach((key) => {
              if (key.startsWith('!')) {
                // Sheet metadata хуулах
                if (key === '!ref') {
                  newSheet[key] = sourceSheet[key]
                } else {
                  newSheet[key] = JSON.parse(JSON.stringify(sourceSheet[key]))
                }
              } else {
                // Cell утгууд хуулах
                const cell = sourceSheet[key]
                if (cell) {
                  newSheet[key] = {
                    t: cell.t,
                    v: cell.v,
                    s: cell.s ? JSON.parse(JSON.stringify(cell.s)) : undefined,
                    f: cell.f,
                    F: cell.F,
                    z: cell.z,
                    l: cell.l,
                    h: cell.h,
                    w: cell.w,
                    c: cell.c,
                    r: cell.r,
                  }
                }
              }
            })
            
            workbook.Sheets[sheetName] = newSheet
            // SheetNames array-д нэмэх
            if (!workbook.SheetNames.includes(sheetName)) {
              workbook.SheetNames.push(sheetName)
            }
            worksheet = newSheet
            console.log(`Sheet "${sheetName}" амжилттай үүсгэлээ, ${Object.keys(newSheet).length} cell хуулагдлаа`)
          }
        }

        if (!worksheet) {
          console.error(`Sheet "${sheetName}" үүсгэх боломжгүй, алгасах`)
          continue
        }

        console.log(`Sheet "${sheetName}" ашиглаж байна, ${gradeAttempts.length} сурагч бөглөх`)

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
        console.log(`Сурагчдын мэдээлэл бөглөж эхлэж байна, startRow: ${startRow}`)
        ;(gradeAttempts as AttemptRow[]).forEach((attempt, index) => {
          const row = startRow + index
          const comboKey = `${attempt.grade}-${attempt.variant}`
          const answerKey = examKeyMap.get(comboKey)
          
          console.log(`Сурагч ${index + 1}/${gradeAttempts.length}: ${attempt.student_name}, мөр ${row}`)

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

          // Сурагч сорил бөглөсөн эсэхийг шалгах (submitted_at байвал бөглөсөн)
          const hasSubmitted = attempt.submitted_at !== null && attempt.submitted_at !== undefined
          // Score байгаа эсэх
          const hasScore = attempt.score !== null && attempt.score !== undefined
          
          // Сорил бөглөсөн бол дүн тооцох, эсвэл score байвал ашиглах
          const score = hasScore
            ? (typeof attempt.score === 'number' ? attempt.score : qScores.reduce((a, b) => a + b, 0))
            : hasSubmitted
            ? qScores.reduce((a, b) => a + b, 0) // Бөглөсөн ч score null байвал тооцох
            : null
          const total =
            typeof attempt.total === 'number' && attempt.total > 0 ? attempt.total : qScores.length || 20

          let percent: number | '' | null = null
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

          // Cell-үүдэд утга оруулах
          if (!worksheet[cellNumber]) {
            worksheet[cellNumber] = { t: 'n', v: 0 }
          }
          if (!worksheet[cellName]) {
            worksheet[cellName] = { t: 's', v: '' }
          }
          if (!worksheet[cellScore]) {
            worksheet[cellScore] = { t: 'n', v: null }
          }
          if (!worksheet[cellPercent]) {
            worksheet[cellPercent] = { t: 'n', v: null }
          }
          if (!worksheet[cellLevel]) {
            worksheet[cellLevel] = { t: 's', v: '' }
          }

          worksheet[cellNumber].v = index + 1
          worksheet[cellName].v = attempt.student_name || ''
          // Сорил бөглөсөн бол дүн харуулах, алга бол хоосон
          worksheet[cellScore].v = finalScore !== null ? finalScore : ''
          worksheet[cellPercent].v = typeof percent === 'number' ? percent : ''
          worksheet[cellLevel].v = level

          // Асуултын баганууд (1-20)
          questionCols.forEach((col, qIndex) => {
            const cellRef = `${col}${row}`
            if (!worksheet[cellRef]) {
              worksheet[cellRef] = { t: 'n', v: 0 }
            }
            worksheet[cellRef].v = qScores[qIndex] || 0
          })
          
          console.log(`Сурагч ${index + 1}: ${attempt.student_name}, мөр ${row}, дүн: ${finalScore}`)
        })
      }
    } else {
      // Template байхгүй бол одоогийн формат ашиглах
      console.log('=== Fallback формат ашиглаж байна ===')
      console.log('byGrade keys:', Object.keys(byGrade))
      console.log('byGrade values count:', Object.values(byGrade).map(arr => arr.length))
      
      workbook = XLSX.utils.book_new()

      for (const [gradeStr, gradeAttempts] of Object.entries(byGrade)) {
        const gradeNum = parseInt(gradeStr, 10)
        console.log(`\n=== Анги ${gradeNum} боловсруулж байна (fallback) ===`)
        console.log(`Сурагчдын тоо: ${gradeAttempts.length}`)
        
        if (gradeAttempts.length === 0) {
          console.warn(`Анги ${gradeNum} хоосон байна, алгасах`)
          continue
        }
        
        const header: (string | number)[] = ['№', 'Сурагчийн нэр']
        for (let i = 1; i <= 20; i++) {
          header.push(i)
        }
        header.push('Авсан', 'Дүн (%)', 'Түвшин')

        const dataRows: (string | number)[][] = []

        ;(gradeAttempts as AttemptRow[]).forEach((attempt, index) => {
          console.log(`  Сурагч ${index + 1}: ${attempt.student_name}`)
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

          // Сурагч сорил бөглөсөн эсэхийг шалгах (submitted_at байвал бөглөсөн)
          const hasSubmitted = attempt.submitted_at !== null && attempt.submitted_at !== undefined
          // Score байгаа эсэх
          const hasScore = attempt.score !== null && attempt.score !== undefined
          
          // Сорил бөглөсөн бол дүн тооцох, эсвэл score байвал ашиглах
          const score = hasScore
            ? (typeof attempt.score === 'number' ? attempt.score : qScores.reduce((a, b) => a + b, 0))
            : hasSubmitted
            ? qScores.reduce((a, b) => a + b, 0) // Бөглөсөн ч score null байвал тооцох
            : null
          const total =
            typeof attempt.total === 'number' && attempt.total > 0 ? attempt.total : qScores.length || 20

          let percent: number | '' | null = null
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
            typeof percent === 'number' ? percent : '',
            level,
          ]

          dataRows.push(row)
        })

        console.log(`  Нийт мөр: ${dataRows.length}`)
        console.log(`  Header багана: ${header.length}`)
        console.log(`  Эхний мөр sample:`, dataRows[0]?.slice(0, 5))
        
        const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows])
        const sheetName = `${gradeNum}-р анги`
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        console.log(`  Sheet "${sheetName}" нэмэгдлээ`)
      }
      
      console.log('\n=== Workbook үүссэн ===')
      console.log('Sheet name-үүд:', workbook.SheetNames)
      console.log('Sheet тоо:', workbook.SheetNames.length)
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
