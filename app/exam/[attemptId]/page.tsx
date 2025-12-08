'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { submitExam } from '@/app/actions'

interface ExamData {
  grade: number
  variant: string
  sections: {
    mcq: Array<{ i: number; q: string; options: string[] }>
    match: {
      left: string[]
      right: string[]
    }
  }
  durationSec: number
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [examData, setExamData] = useState<ExamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Timer state
  const [timeLeft, setTimeLeft] = useState(1200) // 20 minutes in seconds
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Answers state
  const [answersMcq, setAnswersMcq] = useState<Record<string, string>>({})
  const [answersMatch, setAnswersMatch] = useState<Record<string, number>>({})

  const [isSubmitting, setIsSubmitting] = useState(false)

  async function doSubmit() {
    try {
      const formData = new FormData()
      formData.append('attemptId', attemptId)
      formData.append('answersMcq', JSON.stringify(answersMcq))
      formData.append('answersMatch', JSON.stringify(answersMatch))
      if (startedAt) {
        formData.append('clientStartedAt', startedAt.toString())
      }
      await submitExam(formData)
      router.push('/thanks')
    } catch (err) {
      alert('Илгээхэд алдаа: ' + (err instanceof Error ? err.message : 'Тодорхойгүй'))
      setIsSubmitting(false)
    }
  }

  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    await doSubmit()
  }, [isSubmitting, attemptId, answersMcq, answersMatch, startedAt, router])

  // Load exam data
  useEffect(() => {
    async function loadExam() {
      try {
        const res = await fetch(`/api/exam?attemptId=${attemptId}`)
        if (!res.ok) {
          throw new Error('Сорил ачаалахад алдаа')
        }
        const data = await res.json()
        setExamData(data)
        setTimeLeft(data.durationSec)
        setStartedAt(Date.now())
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Алдаа гарлаа')
        setLoading(false)
      }
    }
    loadExam()
  }, [attemptId])

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitting && examData && startedAt) {
      handleAutoSubmit()
    }
  }, [timeLeft, isSubmitting, examData, startedAt, handleAutoSubmit])

  // Timer countdown
  useEffect(() => {
    if (!startedAt || timeLeft <= 0 || isSubmitting || !examData) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [startedAt, isSubmitting, examData])

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    await doSubmit()
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Ачаалж байна...</div>
        </div>
      </main>
    )
  }

  if (error || !examData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <div className="text-lg">{error || 'Сорил олдсонгүй'}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-xl font-bold mb-2">
            График дизайн сорил — {examData.grade}-р анги — Хувилбар {examData.variant} — 20 минут
          </h1>
          <div className="text-lg font-semibold text-red-600">
            Хугацаа: {formatTime(timeLeft)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-8">
          {/* Section I: MCQ */}
          <section>
            <h2 className="text-xl font-bold mb-4">I. ДУГУЙЛАХ — 12 асуулт (сонголт 4)</h2>
            <div className="space-y-6">
              {examData.sections.mcq.map((q) => (
                <div key={q.i} className="border-b pb-4">
                  <div className="font-medium mb-2">
                    {q.i}. {q.q}
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt, idx) => {
                      const optLabel = ['A', 'B', 'C', 'D'][idx]
                      return (
                        <label key={idx} className="flex items-center">
                          <input
                            type="radio"
                            name={`mcq-${q.i}`}
                            value={optLabel}
                            checked={answersMcq[q.i.toString()] === optLabel}
                            onChange={() => setAnswersMcq({ ...answersMcq, [q.i.toString()]: optLabel })}
                            className="mr-2"
                          />
                          <span>{optLabel}. {opt}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section II: Matching */}
          <section>
            <h2 className="text-xl font-bold mb-4">II. ХАРГАЛЗУУЛАХ — 8 асуулт</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Зүүн</h3>
                <ul className="space-y-2">
                  {examData.sections.match.left.map((item, idx) => (
                    <li key={idx} className="p-2 bg-gray-50 rounded">
                      {idx + 1}. {String(item || '')}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Баруун (шуурандсан)</h3>
                {examData.sections.match.right && examData.sections.match.right.length > 0 ? (
                  <ul className="space-y-2">
                    {examData.sections.match.right.map((item, idx) => (
                      <li key={idx} className="p-2 bg-gray-50 rounded">
                        {idx + 1}. {String(item || '')}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 bg-yellow-100 border-2 border-yellow-300 rounded text-yellow-800">
                    <strong>Анхаар:</strong> Харгалзуулах асуултын баруун тал хоосон байна. Админ хуудаснаас зөв текст өгөгдөл оруулах хэрэгтэй.
                  </div>
                )}
              </div>
            </div>

            {/* Matching table */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">
                Сонгосон хариултаа тэмдэглэх хүснэгт (баруун талын дугаарыг бичнэ үү)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2">Зүүн №</th>
                      <th className="border border-gray-300 px-4 py-2">Сонгосон баруун №</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examData.sections.match.left.map((_, leftIdx) => {
                      const qNum = (leftIdx + 1).toString()
                      return (
                        <tr key={leftIdx}>
                          <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                            {qNum}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              max={examData.sections.match.right?.length || 0}
                              value={answersMatch[qNum] || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value)
                                const maxVal = examData.sections.match.right?.length || 0
                                if (val >= 1 && val <= maxVal) {
                                  setAnswersMatch({ ...answersMatch, [qNum]: val })
                                } else if (e.target.value === '') {
                                  const newAnswers = { ...answersMatch }
                                  delete newAnswers[qNum]
                                  setAnswersMatch(newAnswers)
                                }
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                              placeholder="№"
                              disabled={!examData.sections.match.right || examData.sections.match.right.length === 0}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Submit button */}
          <div className="pt-6 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
            >
              {isSubmitting ? 'Илгээж байна...' : 'Илгээх'}
            </button>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Оноо болон зөв хариулт танд харагдахгүй.
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}

