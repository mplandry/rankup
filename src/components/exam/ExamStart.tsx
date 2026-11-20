'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Clock, FileText, AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
import { EXAM_QUESTION_COUNT, EXAM_TIME_LIMIT_SECS } from '@/lib/constants'
import { formatTime } from '@/lib/utils/score'
import { track } from '@/lib/analytics'

interface ExistingSession {
  id: string
  started_at: string
  total_questions: number
}

interface Props {
  availableCount: number
  requiredCount: number
  existingSession?: ExistingSession | null
}

export default function ExamStart({ availableCount, requiredCount, existingSession }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmingNew, setConfirmingNew] = useState(false)
  const canStart = availableCount >= requiredCount

  async function handleStart(forceNew: boolean) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'exam', force_new: forceNew }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start exam')
      track(forceNew ? 'exam_started_new' : 'exam_started')
      router.push(`/exam/${data.session_id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  function handleResume() {
    if (!existingSession) return
    setLoading(true)
    // No API call needed — the session row already exists and is still
    // in_progress, so just navigate straight to it.
    router.push(`/exam/${existingSession.id}`)
  }

  if (existingSession) {
    const startedAt = new Date(existingSession.started_at)
    const startedLabel = startedAt.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-8">
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="font-bold text-[#1B2A4A] dark:text-[#e2e8f0] text-lg">Exam In Progress</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Started {startedLabel} · {existingSession.total_questions} questions
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm rounded-lg px-4 py-3 mb-6">
          You have an exam that hasn&apos;t been submitted yet. Pick up right where you left off, or discard it and start over.
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleResume}
          disabled={loading}
          className="w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resuming…</> : 'Resume Exam'}
        </button>

        {!confirmingNew ? (
          <button
            onClick={() => setConfirmingNew(true)}
            disabled={loading}
            className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-2 underline disabled:opacity-50"
          >
            Discard it and start a new exam instead
          </button>
        ) : (
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              This permanently discards your in-progress exam and its answers so far. This can&apos;t be undone.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleStart(true)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Starting…' : 'Discard & Start New'}
              </button>
              <button
                onClick={() => setConfirmingNew(false)}
                disabled={loading}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-5 mb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-xl flex items-center justify-center">
          <Flame className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <div className="font-bold text-[#1B2A4A] dark:text-[#e2e8f0] text-lg">Promotional Exam Simulation</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Just like the real thing</div>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-3 mb-6">
        <RuleRow icon={<FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />}>
          <strong>{EXAM_QUESTION_COUNT} questions</strong> drawn from the full question bank
        </RuleRow>
        <RuleRow icon={<Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />}>
          <strong>{formatTime(EXAM_TIME_LIMIT_SECS)}</strong> time limit — exam auto-submits when time expires
        </RuleRow>
        <RuleRow icon={<AlertTriangle className="w-4 h-4 text-orange-500 dark:text-orange-400" />}>
          No feedback during the exam — results shown after submission
        </RuleRow>
        <RuleRow icon={<Flame className="w-4 h-4 text-red-500 dark:text-red-400" />}>
          Passing score: <strong>70%</strong> or higher
        </RuleRow>
      </div>

      {/* Availability */}
      <div className={`rounded-lg px-4 py-3 mb-6 text-sm ${
        canStart ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
      }`}>
        {canStart
          ? `${availableCount} exam-eligible questions available ✓`
          : `Only ${availableCount} exam-eligible questions available. Need at least ${requiredCount}. Ask your admin to add more questions.`
        }
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={() => handleStart(false)}
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
      <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  )
}
