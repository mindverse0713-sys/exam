'use client'

import { useSearchParams } from 'next/navigation'
import { startExam } from '../actions'
import { useState } from 'react'

export default function StartForm() {
  const searchParams = useSearchParams()
  const urlGrade = searchParams.get('g')
  const urlVariant = searchParams.get('v')
  
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<10 | 11 | 12 | ''>(urlGrade ? parseInt(urlGrade) as 10 | 11 | 12 : '')
  const [variant, setVariant] = useState<'A' | 'B' | ''>(urlVariant ? urlVariant as 'A' | 'B' : 'A')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLocked = !!(urlGrade || urlVariant)

  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !grade || !variant) return

    setError(null)
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('grade', grade.toString())
    formData.append('variant', variant)

    try {
      await startExam(formData)
    } catch (err) {
      let errorMessage =
        err instanceof Error ? err.message : 'Тодорхойгүй алдаа гарлаа'

      // Production generic message-ийг илүү ойлгомжтой болгох
      if (
        errorMessage.includes('Server Components render error') ||
        errorMessage.includes('Server Components render')
      ) {
        errorMessage =
          'Сервер дээр алдаа гарлаа. Магадгүй Vercel дээр Environment Variables эсвэл Supabase тохиргоо буруу байна. Багшид мэдээлнэ үү.'
      }

      setError(errorMessage)
      setIsSubmitting(false)
      console.error('Submit error:', err)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-2xl font-bold text-center mb-6">График дизайн сорил</h1>
      
      {isLocked && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          Анги/Хувилбар урьдчилан тохируулагдсан.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <strong>Алдаа:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Нэрээ оруулна уу
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Оюутны нэр"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Ангиа сонгоно уу (10 / 11 / 12)
          </label>
          <div className="flex gap-4">
            {[10, 11, 12].map((g) => (
              <label key={g} className="flex items-center">
                <input
                  type="radio"
                  name="grade"
                  value={g}
                  checked={grade === g}
                  onChange={() => setGrade(g as 10 | 11 | 12)}
                  disabled={!!(isLocked && urlGrade && parseInt(urlGrade) !== g)}
                  required
                  className="mr-2"
                />
                <span>{g}-р анги</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Хувилбар (A / B)
          </label>
          <div className="flex gap-4">
            {(['A', 'B'] as const).map((v) => (
              <label key={v} className="flex items-center">
                <input
                  type="radio"
                  name="variant"
                  value={v}
                  checked={variant === v}
                  onChange={() => setVariant(v)}
                  disabled={!!(isLocked && urlVariant && urlVariant !== v)}
                  required
                  className="mr-2"
                />
                <span>Хувилбар {v}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !grade || !variant}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Боловсруулж байна...' : 'Эхлэх'}
        </button>
      </form>
    </div>
  )
}

