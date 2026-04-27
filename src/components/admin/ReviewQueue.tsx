// src/components/admin/ReviewQueue.tsx
'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, XCircle, SkipForward, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react'

export interface ReviewQuestion {
  id: string
  question_text: string
  answer_a: string
  answer_b: string
  answer_c: string
  answer_d: string
  correct_answer: string
  book_title: string
  edition: string | null
  chapter: string
  topic: string | null
  page_start: number | null
  page_end: number | null
  difficulty: string
  review_status: 'pending' | 'approved' | 'needs_revision'
  distractor_score: number | null
  distractor_notes: string | null
  originality_reviewed: boolean
}

interface Props {
  initialQuestions: ReviewQuestion[]
}

export default function ReviewQueue({ initialQuestions }: Props) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [index, setIndex] = useState(0)
  const [notes, setNotes] = useState('')
  const [originality, setOriginality] = useState(false)
  const [saving, setSaving] = useState(false)

  const current = questions[index] ?? null
  const total = questions.length

  const advanceOrEnd = useCallback((updatedId: string, newStatus: string) => {
    setQuestions((prev) =>
      prev.map((q) => q.id === updatedId ? { ...q, review_status: newStatus as ReviewQuestion['review_status'] } : q)
    )
    setNotes('')
    setOriginality(false)
    setIndex((i) => Math.min(i + 1, total - 1))
  }, [total])

  const handleAction = useCallback(async (
    status: 'approved' | 'needs_revision',
    skipOnly = false
  ) => {
    if (!current || saving) return
    if (skipOnly) {
      setNotes('')
      setOriginality(false)
      setIndex((i) => Math.min(i + 1, total - 1))
      return
    }

    setSaving(true)
    try {
      await fetch(`/api/questions/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_status: status,
          review_notes: notes || null,
          originality_reviewed: originality,
          ...(originality ? { originality_reviewed_at: new Date().toISOString() } : {}),
        }),
      })
      advanceOrEnd(current.id, status)
    } finally {
      setSaving(false)
    }
  }, [current, saving, notes, originality, advanceOrEnd])

  if (!current) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium text-gray-600">Queue is empty</p>
          <p className="text-sm mt-1">All questions have been reviewed</p>
        </div>
      </div>
    )
  }

  const pendingCount = questions.filter((q) => q.review_status === 'pending').length
  const flaggedCount = questions.filter((q) => q.review_status === 'needs_revision').length
  const isLowScore = (current.distractor_score ?? 100) < 60

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left: Queue list */}
      <div className="w-56 shrink-0 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        <div className="px-3 py-3 border-b border-gray-200 bg-white">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Review Queue</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {pendingCount} pending · {flaggedCount} flagged
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => { setIndex(i); setNotes(''); setOriginality(false); }}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                i === index
                  ? 'bg-[#1B2A4A] text-white'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-xs font-semibold mb-1 ${
                i === index
                  ? q.review_status === 'needs_revision' ? 'text-amber-300' : 'text-blue-300'
                  : q.review_status === 'needs_revision' ? 'text-amber-500' : 'text-gray-400'
              }`}>
                {q.review_status === 'needs_revision' ? 'NEEDS REVISION' : 'PENDING'}
                {q.distractor_score !== null && q.distractor_score < 60 && (
                  <span className="ml-1">· Score: {q.distractor_score}</span>
                )}
              </div>
              <div className={`text-xs leading-tight line-clamp-2 ${i === index ? 'text-white/90' : 'text-gray-600'}`}>
                {q.question_text}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Question detail */}
      <div className="flex-1 min-w-0 space-y-3 overflow-auto">
        {/* Source reference */}
        <div className="bg-[#1B2A4A] rounded-xl px-5 py-4 flex items-center gap-4">
          <BookOpen className="w-6 h-6 text-blue-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">
              {current.book_title}{current.edition ? `, ${current.edition}` : ''}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Chapter </span>
                <span className="text-xs font-semibold text-blue-300">{current.chapter}</span>
              </div>
              {(current.page_start || current.page_end) && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Pages </span>
                  <span className="text-xs font-semibold text-blue-300">
                    {current.page_start}
                    {current.page_end && current.page_end !== current.page_start
                      ? `–${current.page_end}` : ''}
                  </span>
                </div>
              )}
              {current.topic && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Topic </span>
                  <span className="text-xs font-semibold text-blue-300">{current.topic}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Distractor warning */}
        {isLowScore && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <div className="text-xs font-bold text-amber-800">
                Low Distractor Score: {current.distractor_score}/100
              </div>
              {current.distractor_notes && (
                <div className="text-xs text-amber-700 mt-1">{current.distractor_notes}</div>
              )}
            </div>
          </div>
        )}

        {/* Question card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              current.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              current.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>{current.difficulty}</span>
          </div>
          <p className="text-[#1B2A4A] font-semibold text-sm leading-relaxed mb-4">
            {current.question_text}
          </p>
          <div className="space-y-2">
            {(['a', 'b', 'c', 'd'] as const).map((letter) => {
              const key = letter.toUpperCase()
              const text = current[`answer_${letter}` as keyof ReviewQuestion] as string
              const isCorrect = key === current.correct_answer
              const isFlagged = isLowScore && current.distractor_notes
                ?.toLowerCase().includes(`option ${key.toLowerCase()}`)
              return (
                <div
                  key={letter}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 ${
                    isCorrect
                      ? 'border-green-400 bg-green-50'
                      : isFlagged
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCorrect ? 'bg-green-500 text-white' : 'border-2 border-gray-400 text-gray-600'
                  }`}>{key}</span>
                  <span className="text-sm text-gray-800 flex-1">{text}</span>
                  {isCorrect && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-bold">CORRECT</span>}
                  {isFlagged && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-semibold">⚠ FLAGGED</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Originality toggle */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#1B2A4A]">Originality Verified</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Confirm not verbatim from
              {current.page_start ? ` pp. ${current.page_start}${current.page_end && current.page_end !== current.page_start ? `–${current.page_end}` : ''}` : ' source'}
            </div>
          </div>
          <button
            onClick={() => setOriginality((v) => !v)}
            className="flex items-center gap-2"
          >
            {originality
              ? <ToggleRight className="w-8 h-8 text-green-500" />
              : <ToggleLeft className="w-8 h-8 text-gray-400" />
            }
            <span className={`text-xs font-medium ${originality ? 'text-green-600' : 'text-gray-400'}`}>
              {originality ? 'Verified' : 'Not verified'}
            </span>
          </button>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="text-xs font-semibold text-gray-500 block mb-2">
            Review Notes (required if marking Needs Revision)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note about why this needs revision..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none min-h-[60px] focus:outline-none focus:border-[#1B2A4A]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handleAction('needs_revision')}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Needs Revision
          </button>
          <button
            onClick={() => handleAction('approved', true)}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 font-semibold text-sm hover:bg-gray-100 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" /> Skip
          </button>
          <button
            onClick={() => handleAction('approved')}
            disabled={saving}
            className="flex-[2] py-3 rounded-lg bg-[#1B2A4A] text-white font-bold text-sm hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        </div>

        {/* Progress */}
        <div className="text-xs text-gray-400 text-center">
          Question {index + 1} of {total}
        </div>
      </div>
    </div>
  )
}
