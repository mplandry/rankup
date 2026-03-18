'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function DedupeButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleDedupe() {
    if (!confirm('Find and remove all duplicate questions? This cannot be undone.')) return
    setLoading(true)
    setResult(null)
    const res = await fetch('/api/questions/dedupe', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setResult(data.removed === 0 ? 'No duplicates found' : `Removed ${data.removed} duplicate${data.removed !== 1 ? 's' : ''}`)
      router.refresh()
    } else {
      setResult(`Error: ${data.error}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-gray-500">{result}</span>
      )}
      <button
        onClick={handleDedupe}
        disabled={loading}
        className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        Remove Duplicates
      </button>
    </div>
  )
}
