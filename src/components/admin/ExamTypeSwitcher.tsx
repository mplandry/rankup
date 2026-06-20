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
        window.location.href = "/admin"
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Viewing as:</span>
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => handleSwitch('lieutenant')}
          disabled={loading}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${examType === 'lieutenant' ? 'bg-white dark:bg-[#111827] text-[#1B2A4A] dark:text-[#e2e8f0] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Lieutenant
        </button>
        <button
          onClick={() => handleSwitch('captain')}
          disabled={loading}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${examType === 'captain' ? 'bg-white dark:bg-[#111827] text-[#1B2A4A] dark:text-[#e2e8f0] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Captain
        </button>
      </div>
    </div>
  )
}
