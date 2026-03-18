'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Question, ExamSessionQuestion, Answer } from '@/types'
import QuestionCard from './QuestionCard'
import AnswerFeedback from './AnswerFeedback'
import StudyProgress from './StudyProgress'
import { CheckCircle, ArrowRight } from 'lucide-react'

interface Props {
  sessionId: string
  sessionQuestions: (ExamSessionQuestion & { question: Question })[]
  startIndex: number
  isCompleted: boolean
}

export default function StudySession({ sessionId, sessionQuestions, startIndex, isCompleted }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(isCompleted ? sessionQuestions.length : startIndex)
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const total = sessionQuestions.length
  const done = index >= total

  const currentSQ = done ? null : sessionQuestions[index]
  const currentQ = currentSQ?.question ?? null

  const handleAnswer = useCallback(async (answer: Answer) => {
    if (!currentSQ) return
    setSelectedAnswer(answer)
    setSubmitted(true)
    setSaving(true)

    // Save answer to server
    await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_question_id: currentSQ.id,
        user_answer: answer,
      }),
    })

    setSaving(false)
  }, [currentSQ])

  const handleNext = useCallback(async () => {
    setSelectedAnswer(null)
    setSubmitted(false)
    if (index + 1 >= total) {
      // Mark session complete — await so scoring finishes before navigating
      await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' })
      setIndex(total)
    } else {
      setIndex(index + 1)
    }
  }, [index, total, sessionId])

  if (done) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B2A4A] mb-2">Study Session Complete!</h2>
          <p className="text-gray-500 mb-6">You answered {total} questions</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/study')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              New Session
            </button>
            <button
              onClick={() => router.push('/progress')}
              className="px-6 py-2.5 bg-[#C0392B] text-white rounded-lg text-sm font-medium hover:bg-[#a93226]"
            >
              View Progress
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <StudyProgress current={index + 1} total={total} />

      {currentQ && (
        <QuestionCard
          question={currentQ}
          selectedAnswer={selectedAnswer}
          submitted={submitted}
          onAnswer={handleAnswer}
          mode="study"
        />
      )}

      {submitted && currentQ && (
        <>
          <AnswerFeedback
            question={currentQ}
            selectedAnswer={selectedAnswer!}
          />
          <button
            onClick={handleNext}
            disabled={saving}
            className="w-full mt-4 bg-[#1B2A4A] hover:bg-[#243660] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {index + 1 >= total ? 'Finish Session' : 'Next Question'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  )
}
