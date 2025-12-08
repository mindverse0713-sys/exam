'use client'

import { useState, useEffect } from 'react'

interface Attempt {
  id: string
  student_name: string
  grade: string
  variant: string
  started_at: string
  submitted_at: string | null
  duration_sec: number | null
  score: number | null
  total: number
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [filterVariant, setFilterVariant] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    // Check if already authenticated
    const stored = sessionStorage.getItem('admin_auth')
    const storedPass = sessionStorage.getItem('admin_pass')
    if (stored === 'true' && storedPass) {
      setIsAuthenticated(true)
      setPassword(storedPass)
      loadAttempts()
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setIsAuthenticated(true)
        sessionStorage.setItem('admin_auth', 'true')
        sessionStorage.setItem('admin_pass', password)
        loadAttempts()
      } else {
        alert('Нууц үг буруу')
      }
    } catch (err) {
      alert('Нэвтрэхэд алдаа')
    } finally {
      setLoading(false)
    }
  }

  async function loadAttempts() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterGrade !== 'all') params.append('grade', filterGrade)
      if (filterVariant !== 'all') params.append('variant', filterVariant)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const res = await fetch(`/api/admin/attempts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${password || sessionStorage.getItem('admin_pass')}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        // Normalize grade to string
        const normalized = (data || []).map((a: Attempt) => ({
          ...a,
          grade: a.grade?.toString?.() || '',
        }))
        setAttempts(normalized)
      } else if (res.status === 401) {
        setIsAuthenticated(false)
        sessionStorage.removeItem('admin_auth')
      }
    } catch (err) {
      console.error('Load attempts error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (filterGrade !== 'all') params.append('grade', filterGrade)
      if (filterVariant !== 'all') params.append('variant', filterVariant)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const pass = password || sessionStorage.getItem('admin_pass') || ''
      params.append('pass', pass)

      const res = await fetch(`/api/admin/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${pass}`,
        },
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `results_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        alert('Экспорт хийхэд алдаа')
      }
    } catch (err) {
      alert('Экспорт хийхэд алдаа')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAttempts()
    }
  }, [filterGrade, filterVariant, dateFrom, dateTo, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Админ нэвтрэх</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Нууц үг
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Боловсруулж байна...' : 'Нэвтрэх'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Админ хяналтын самбар</h1>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Анги</label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Бүгд</option>
                {Array.from(new Set(attempts.map((a) => a.grade).filter(Boolean)))
                  .sort()
                  .map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Хувилбар</label>
              <select
                value={filterVariant}
                onChange={(e) => setFilterVariant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Бүгд</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Эхэлсэн огноо (from)</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Эхэлсэн огноо (to)</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {exporting ? 'Экспорт хийж байна...' : 'Excel татах'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Ачаалж байна...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Оюутан
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Анги
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Хувилбар
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Эхэлсэн
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дууссан
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Хугацаа (сек)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Оноо
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Нийт
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Өгөгдөл олдсонгүй
                      </td>
                    </tr>
                  ) : (
                    attempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {attempt.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{attempt.grade}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{attempt.variant}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {attempt.started_at
                            ? new Date(attempt.started_at).toLocaleString('mn-MN')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {attempt.submitted_at
                            ? new Date(attempt.submitted_at).toLocaleString('mn-MN')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {attempt.duration_sec ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          {attempt.score ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{attempt.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

