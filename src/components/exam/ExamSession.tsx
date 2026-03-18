'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ExamQuestion, ExamSessionQuestion, Answer } from '@/types'
import ExamTimer from './ExamTimer'
import ExamQuestionNav from './ExamQuestionNav'
import QuestionCard from '../study/QuestionCard'
import { Flag, Send, Loader2 } from 'lucide-react'

interface Props {
  sessionId: string
  timeLimitSecs: number
  startedAt: string
  sessionQuestions: (ExamSessionQuestion & { question: ExamQuestion })[]
}

export default function ExamSession({ sessionId, timeLimitSecs, startedAt, sessionQuestions }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    const init: Record<string, Answer> = {}
    sessionQuestions.forEach((sq) => {
      if (sq.user_answer) init[sq.id] = sq.user_answer as Answer
    })
    return init
  })
  const [flagged, setFlagged] = useState<Set<string>>(() => {
    const init = new Set<string>()
    sessionQuestions.forEach((sq) => {
      if (sq.flagged) init.add(sq.id)
    })
    return init
  })
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const pendingSaves = useRef<Promise<unknown>[]>([])
  const startedAtMs = new Date(startedAt).getTime()
  const elapsed = Math.floor((Date.now() - startedAtMs) / 1000)
  const remaining = Math.max(0, timeLimitSecs - elapsed)

  const currentSQ = sessionQuestions[index]
  const currentQ = currentSQ?.question

  const handleAnswer = useCallback(async (answer: Answer) => {
    const sq = sessionQuestions[index]
    setAnswers((prev) => ({ ...prev, [sq.id]: answer }))
    const save = fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_question_id: sq.id, user_answer: answer }),
    })
    pendingSaves.current.push(save)
    save.finally(() => {
      pendingSaves.current = pendingSaves.current.filter((p) => p !== save)
    })
  }, [index, sessionQuestions])

  const toggleFlag = useCallback(() => {
    const sq = sessionQuestions[index]
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(sq.id)) next.delete(sq.id)
      else next.add(sq.id)
      fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_question_id: sq.id, flagged: !prev.has(sq.id) }),
      })
      return next
    })
  }, [index, sessionQuestions])

  const submitExam = useCallback(async () => {
    setSubmitting(true)
    // Wait for any in-flight answer saves before scoring
    await Promise.allSettled(pendingSaves.current)
    const res = await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' })
    if (res.ok) {
      router.push(`/exam/${sessionId}/results`)
    } else {
      setSubmitting(false)
    }
  }, [sessionId, router])

  const answeredCount = Object.keys(answers).length
  const unansweredCount = sessionQuestions.length - answeredCount

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Question */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#1B2A4A] text-white sticky top-0 z-10">
          <div className="text-sm font-medium">
            Question {index + 1} / {sessionQuestions.length}
          </div>
          <ExamTimer initialSecs={remaining} onExpire={submitExam} />
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="flex items-center gap-2 bg-[#C0392B] hover:bg-[#a93226] px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Exam
          </button>
        </div>

        <div className="p-6 max-w-2xl mx-auto w-full">
          {currentQ && (
            <QuestionCard
              question={{ ...currentQ, correct_answer: 'A', explanation: null } as never}
              selectedAnswer={answers[currentSQ.id] ?? null}
              submitted={false}
              onAnswer={handleAnswer}
              mode="exam"
            />
          )}

          {/* Flag button */}
          <button
            onClick={toggleFlag}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              flagged.has(currentSQ?.id)
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-gray-300 text-gray-600 hover:border-amber-300 hover:text-amber-600'
            }`}
          >
            <Flag className="w-4 h-4" />
            {flagged.has(currentSQ?.id) ? 'Flagged for review' : 'Flag for review'}
          </button>

          {/* Prev / Next */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={index === 0}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => setIndex(Math.min(sessionQuestions.length - 1, index + 1))}
              disabled={index === sessionQuestions.length - 1}
              className="flex-1 py-2.5 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#243660] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Right: Nav grid */}
      <div className="w-56 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Progress</div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold text-green-600">{answeredCount}</span> answered ·{' '}
            <span className="font-semibold text-gray-400">{unansweredCount}</span> left
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <ExamQuestionNav
            total={sessionQuestions.length}
            current={index}
            answered={sessionQuestions.reduce((acc, sq, i) => {
              if (answers[sq.id]) acc.add(i)
              return acc
            }, new Set<number>())}
            flaggedIndexes={sessionQuestions.reduce((acc, sq, i) => {
              if (flagged.has(sq.id)) acc.add(i)
              return acc
            }, new Set<number>())}
            onSelect={setIndex}
          />
        </div>
      </div>

      {/* Submit Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-2">Submit Exam?</h3>
            <p className="text-gray-600 text-sm mb-1">
              You have answered <strong>{answeredCount}</strong> of{' '}
              <strong>{sessionQuestions.length}</strong> questions.
            </p>
            {unansweredCount > 0 && (
              <p className="text-amber-600 text-sm mb-4">
                {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Continue
              </button>
              <button
                onClick={submitExam}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#C0392B] text-white rounded-lg text-sm font-medium hover:bg-[#a93226] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
