'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamTypeSwitcher({ currentExamType }: { currentExamType: string }) {
  const [examType, setExamType] = useState(currentExamType)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSwitch(newType: string) {
    if (newType === examType) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/exam-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_type: newType }),
      })
      if (res.ok) {
        setExamType(newType)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs text-gray-500 font-medium">Viewing as:</span>
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleSwitch('lieutenant')}
          disabled={loading}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${examType === 'lieutenant' ? 'bg-white text-[#1B2A4A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Lieutenant
        </button>
        <button
          onClick={() => handleSwitch('captain')}
          disabled={loading}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${examType === 'captain' ? 'bg-white text-[#1B2A4A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Captain
        </button>
      </div>
    </div>
  )
}
