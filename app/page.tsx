import { Suspense } from 'react'
import StartForm from './components/StartForm'

function LoadingFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">Ачаалж байна...</div>
      </div>
    </main>
  )
}

export default function StartPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <StartForm />
      </Suspense>
    </main>
  )
}

