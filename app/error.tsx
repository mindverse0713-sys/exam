'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    if (error.digest) {
      console.error('Error digest:', error.digest)
    }
  }, [error])

  // Extract meaningful error message
  const getErrorMessage = () => {
    // Check for generic production error message
    if (error.message && error.message.includes('Server Components render error')) {
      return 'Сервер дээр алдаа гарлаа. Магадгүй Database тохиргоо дутуу байж магадгүй. Vercel дээр Environment Variables шалгана уу (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).'
    }
    
    // Check for environment variable errors
    if (error.message && (
      error.message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
      error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
      error.message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
      error.message.includes('environment variable is missing')
    )) {
      return error.message
    }
    
    // Check for database errors
    if (error.message && (
      error.message.includes('Database тохиргоо') ||
      error.message.includes('Table үүсээгүй') ||
      error.message.includes('RLS policy')
    )) {
      return error.message
    }
    
    if (error.message && error.message !== 'An error occurred in the Server Components render.') {
      return error.message
    }
    
    // Check for common production errors
    if (error.digest) {
      return 'Сервер дээр алдаа гарлаа. Дахин оролдоно уу. Хэрэв алдаа давтагдах бол Vercel дээр Environment Variables шалгана уу.'
    }
    
    return 'Тодорхойгүй алдаа гарлаа. Дахин оролдоно уу.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Алдаа гарлаа</h1>
        <div className="text-gray-700 mb-4 space-y-2">
          <p>{getErrorMessage()}</p>
          {error.digest && (
            <p className="text-xs text-gray-500 mt-2">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Дахин оролдох
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Эхлэл рүү буцах
          </button>
        </div>
      </div>
    </div>
  )
}

