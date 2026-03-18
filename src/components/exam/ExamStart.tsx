'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Clock, FileText, AlertTriangle, Loader2 } from 'lucide-react'
import { EXAM_QUESTION_COUNT, EXAM_TIME_LIMIT_SECS } from '@/lib/constants'
import { formatTime } from '@/lib/utils/score'

interface Props {
  availableCount: number
  requiredCount: number
}

export default function ExamStart({ availableCount, requiredCount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canStart = availableCount >= requiredCount

  async function handleStart() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'exam' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start exam')
      router.push(`/exam/${data.session_id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-5 mb-5 border-b border-gray-100">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <Flame className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <div className="font-bold text-[#1B2A4A] text-lg">Promotional Exam Simulation</div>
          <div className="text-sm text-gray-500">Just like the real thing</div>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-3 mb-6">
        <RuleRow icon={<FileText className="w-4 h-4 text-blue-500" />}>
          <strong>{EXAM_QUESTION_COUNT} questions</strong> drawn from the full question bank
        </RuleRow>
        <RuleRow icon={<Clock className="w-4 h-4 text-amber-500" />}>
          <strong>{formatTime(EXAM_TIME_LIMIT_SECS)}</strong> time limit — exam auto-submits when time expires
        </RuleRow>
        <RuleRow icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}>
          No feedback during the exam — results shown after submission
        </RuleRow>
        <RuleRow icon={<Flame className="w-4 h-4 text-red-500" />}>
          Passing score: <strong>70%</strong> or higher
        </RuleRow>
      </div>

      {/* Availability */}
      <div className={`rounded-lg px-4 py-3 mb-6 text-sm ${
        canStart ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
      }`}>
        {canStart
          ? `${availableCount} exam-eligible questions available ✓`
          : `Only ${availableCount} exam-eligible questions available. Need at least ${requiredCount}. Ask your admin to add more questions.`
        }
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={!canStart || loading}
        className="w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting Exam…</> : 'Start Exam'}
      </button>
    </div>
  )
}

function RuleRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  )
}
