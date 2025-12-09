'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type MCQQuestion = {
  q: string
  options: { A: string; B: string; C: string; D: string }
}

type MatchingSection = {
  left: string[]
  right: string[]
}

type PublicSections = {
  mcq: MCQQuestion[]
  matching?: MatchingSection
}

type AnswerKey = {
  mcqKey: Record<string, string>
  matchKey?: Record<string, number>
}

type Exam = {
  id: string
  grade: string
  variant: string
  public_sections: PublicSections
  answer_key: AnswerKey
  active: boolean
}

const ALLOWED_GRADES = ['10', '11', '12'] as const

export default function ExamsEditorPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<string>('10')
  const [selectedVariant, setSelectedVariant] = useState<string>('A')
  const [currentExam, setCurrentExam] = useState<Exam | null>(null)
  const [saving, setSaving] = useState(false)

  const MAX_MCQ = 20
  const buildDefaultMcq = () =>
    Array(MAX_MCQ)
      .fill(null)
      .map(() => ({
        q: '',
        options: { A: '', B: '', C: '', D: '' }
      }))

  const buildDefaultAnswerKeys = () => ({
    mcqKey: Object.fromEntries(Array(MAX_MCQ).fill(0).map((_, i) => [String(i + 1), 'A']))
  })

  const rebuildMcqKey = (len: number, prevKey: Record<string, string> = {}) =>
    Object.fromEntries(
      Array(len)
        .fill(0)
        .map((_, i) => [String(i + 1), prevKey[String(i + 1)] || 'A'])
    )

  // Check for existing auth on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('admin_auth')
    const storedPass = sessionStorage.getItem('admin_pass')
    if (stored === 'true' && storedPass) {
      setPassword(storedPass)
      setIsAuthenticated(true)
      loadExamsWithPassword(storedPass)
    }
  }, [])

  // Authentication
  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/exams?pass=${password}`)
      if (res.ok) {
        sessionStorage.setItem('admin_auth', 'true')
        sessionStorage.setItem('admin_pass', password)
        setIsAuthenticated(true)
        loadExams()
      } else {
        const data = await res.json()
        alert(`Нууц үг буруу байна: ${data.error || res.status}`)
      }
    } catch (err) {
      console.error(err)
      alert('Алдаа гарлаа: ' + (err instanceof Error ? err.message : 'Unknown'))
    }
    setLoading(false)
  }

  // Load exams with password
  const loadExamsWithPassword = async (pass: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/exams?pass=${pass}`)
      const data = await res.json()
      if (res.ok) {
        const normalized = (data.exams || []).map((e: Exam) => ({
          ...e,
          grade: e.grade?.toString?.() || '',
        }))
        setExams(normalized)

        // Try to keep current selection; otherwise pick first available
        const exam =
          normalized.find(
            (e: Exam) => e.grade === selectedGrade && e.variant === selectedVariant
          ) || normalized[0] || null
        setCurrentExam(exam || null)

        // If no current selection, set defaults from the first exam
        if (!currentExam && exam) {
          setSelectedGrade(exam.grade)
          setSelectedVariant(exam.variant)
        }
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  // Load exams
  const loadExams = async () => {
    loadExamsWithPassword(password)
  }

  // Load exam when grade/variant changes
  useEffect(() => {
    if (isAuthenticated && exams.length > 0) {
      const exam = exams.find(
        (e) => e.grade === selectedGrade && e.variant === selectedVariant
      )
      setCurrentExam(exam || null)
    }
  }, [selectedGrade, selectedVariant, exams, isAuthenticated])

  // Delete exam
  const handleDeleteExam = async () => {
    if (!currentExam) return

    const confirmed = confirm(
      `${selectedGrade}-р анги, Хувилбар ${selectedVariant} сорил устгах уу?`
    )
    if (!confirmed) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/exams?id=${currentExam.id}&pass=${password}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        alert('Сорил устгагдлаа!')
        setCurrentExam(null)
        loadExams()
      } else {
        const data = await res.json()
        alert(`Алдаа: ${data.error}`)
      }
    } catch (err) {
      console.error(err)
      alert('Алдаа гарлаа')
    }
    setSaving(false)
  }

  // Create new exam
  const handleCreateExam = async () => {
    const confirmed = confirm(
      `${selectedGrade}-р анги, Хувилбар ${selectedVariant} шинэ сорил үүсгэх үү?`
    )
    if (!confirmed) return

    setSaving(true)
    try {
      // Create empty exam template
    const newExam = {
        grade: selectedGrade.trim(),
        variant: selectedVariant,
        public_sections: {
          mcq: buildDefaultMcq(),
        },
        answer_key: buildDefaultAnswerKeys()
      }

      const res = await fetch(`/api/admin/exams?pass=${password}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam)
      })

      if (res.ok) {
        const data = await res.json()
        alert('Шинэ сорил үүсгэгдлээ!')
        // Шинээр үүссэн сорилыг шууд сонгоно
        const created = data.exam
        if (created) {
          setCurrentExam(created)
          // answer_key/public_sections шинэ state дээр
          setExams((prev) => [...(prev || []), created])
        } else {
          loadExams()
        }
      } else {
        const data = await res.json()
        const errorMsg = data.error || ''
        if (errorMsg.includes('аль хэдийн байна') || errorMsg.includes('duplicate')) {
          // Exam already exists - load it instead
          await loadExams()
          // Wait for state update
          setTimeout(() => {
            const existingExam = exams.find(
              (e) => e.grade === selectedGrade && e.variant === selectedVariant
            )
            if (existingExam) {
              setCurrentExam(existingExam)
              alert('Сорил аль хэдийн байна. Одоо засаж болно.')
            } else {
              // Try one more time after state updates
              loadExams().then(() => {
                setTimeout(() => {
                  const examAfterReload = exams.find(
                    (e) => e.grade === selectedGrade && e.variant === selectedVariant
                  )
                  if (examAfterReload) {
                    setCurrentExam(examAfterReload)
                    alert('Сорил олдлоо. Одоо засаж болно.')
                  } else {
                    alert(`Алдаа: ${errorMsg}`)
                  }
                }, 300)
              })
            }
          }, 300)
        } else {
          alert(`Алдаа: ${errorMsg}`)
        }
      }
    } catch (err) {
      console.error(err)
      alert('Алдаа гарлаа')
    }
    setSaving(false)
  }

  // Save exam
  const handleSave = async () => {
    if (!currentExam) {
      alert('Сорил сонгоно уу')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/exams?pass=${password}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentExam)
      })

      if (res.ok) {
        alert('Амжилттай хадгалагдлаа!')
        loadExams()
      } else {
        const data = await res.json()
        alert(`Алдаа: ${data.error}`)
      }
    } catch (err) {
      console.error(err)
      alert('Алдаа гарлаа')
    }
    setSaving(false)
  }

  // Update MCQ question
  const updateMCQQuestion = (index: number, field: string, value: string) => {
    if (!currentExam) return
    const newMcq = [...currentExam.public_sections.mcq]
    if (field === 'q') {
      newMcq[index].q = value
    } else {
      newMcq[index].options[field as 'A' | 'B' | 'C' | 'D'] = value
    }
    setCurrentExam({
      ...currentExam,
      public_sections: { ...currentExam.public_sections, mcq: newMcq }
    })
  }

  // Update MCQ answer key
  const updateMCQAnswerKey = (questionNum: number, answer: string) => {
    if (!currentExam) return
    setCurrentExam({
      ...currentExam,
      answer_key: {
        ...currentExam.answer_key,
        mcqKey: { ...currentExam.answer_key.mcqKey, [questionNum]: answer }
      }
    })
  }

  // Add MCQ question (max 20)
  const addMcqQuestion = () => {
    if (!currentExam) return
    const len = currentExam.public_sections.mcq.length
    if (len >= MAX_MCQ) {
      alert(`Сонгох асуулт ${MAX_MCQ}-оос ихгүй байна`)
      return
    }
    const newMcq = [
      ...currentExam.public_sections.mcq,
      { q: '', options: { A: '', B: '', C: '', D: '' } }
    ]
    const newMcqKey = rebuildMcqKey(newMcq.length, currentExam.answer_key.mcqKey)
    setCurrentExam({
      ...currentExam,
      public_sections: { ...currentExam.public_sections, mcq: newMcq },
      answer_key: { ...currentExam.answer_key, mcqKey: newMcqKey }
    })
  }

  // Remove MCQ question
  const removeMcqQuestion = (index: number) => {
    if (!currentExam) return
    const len = currentExam.public_sections.mcq.length
    if (len <= 1) {
      alert('Дор хаяж 1 асуулт байх ёстой')
      return
    }
    const newMcq = currentExam.public_sections.mcq.filter((_, i) => i !== index)
    const newMcqKey = rebuildMcqKey(newMcq.length, currentExam.answer_key.mcqKey)
    setCurrentExam({
      ...currentExam,
      public_sections: { ...currentExam.public_sections, mcq: newMcq },
      answer_key: { ...currentExam.answer_key, mcqKey: newMcqKey }
    })
  }

  // Reset exam to default template
  const resetExamTemplate = () => {
    if (!currentExam) return
    const confirmed = confirm('Сорилыг хоосон төлөвт reset хийх үү?')
    if (!confirmed) return
    setCurrentExam({
      ...currentExam,
      public_sections: {
        mcq: buildDefaultMcq()
      },
      answer_key: buildDefaultAnswerKeys()
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Админ нэвтрэх</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Нууц үг"
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Сорил засах</h1>
            <button
              onClick={() => router.push('/admin')}
              className="text-blue-600 hover:underline"
            >
              ← Буцах
            </button>
          </div>

          {/* Grade and Variant Selector */}
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Анги</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-4 py-2 border rounded w-32"
              >
                {ALLOWED_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Хувилбар</label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="px-4 py-2 border rounded"
              >
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              {!currentExam ? (
                <button
                  onClick={handleCreateExam}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  ➕ Шинэ сорил үүсгэх
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Хадгалж байна...' : '💾 Хадгалах'}
                  </button>
                  <button
                    onClick={handleDeleteExam}
                    disabled={saving}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    🗑️ Устгах
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Exam Content */}
        {loading ? (
          <div className="text-center py-12">Ачааллаж байна...</div>
        ) : !currentExam ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">
              {selectedGrade}-р анги, Хувилбар {selectedVariant} сорил олдсонгүй
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* MCQ Questions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Сонгох (20 хүртэл)</h2>
                <div className="flex gap-2">
                  <button
                    onClick={addMcqQuestion}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    ➕ Асуулт нэмэх
                  </button>
                  <button
                    onClick={resetExamTemplate}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {currentExam?.public_sections?.mcq?.map((question, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="font-bold">{index + 1}.</span>
                      <input
                        type="text"
                        value={question.q}
                        onChange={(e) => updateMCQQuestion(index, 'q', e.target.value)}
                        className="flex-1 px-2 py-1 border rounded"
                        placeholder="Асуулт"
                      />
                      <button
                        onClick={() => removeMcqQuestion(index)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        🗑 Устгах
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <div key={opt} className="flex items-center gap-2">
                          <span className="font-medium">{opt})</span>
                          <input
                            type="text"
                            value={question.options[opt]}
                            onChange={(e) => updateMCQQuestion(index, opt, e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 ml-6 flex items-center gap-2">
                      <span className="text-sm font-medium">Зөв хариулт:</span>
                      <select
                        value={currentExam?.answer_key?.mcqKey?.[String(index + 1)] || 'A'}
                        onChange={(e) => updateMCQAnswerKey(index + 1, e.target.value)}
                        className="px-2 py-1 border rounded bg-green-50"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

