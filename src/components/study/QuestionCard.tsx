'use client'

import type { Question, Answer } from '@/types'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  question: Question
  selectedAnswer: Answer | null
  submitted: boolean
  onAnswer: (answer: Answer) => void
  mode: 'study' | 'exam'
}

const OPTIONS: Answer[] = ['A', 'B', 'C', 'D']
const OPTION_KEY: Record<Answer, keyof Question> = {
  A: 'answer_a',
  B: 'answer_b',
  C: 'answer_c',
  D: 'answer_d',
}

export default function QuestionCard({ question, selectedAnswer, submitted, onAnswer, mode }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
      {/* Difficulty badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          question.difficulty === 'easy' && 'bg-green-100 text-green-700',
          question.difficulty === 'medium' && 'bg-yellow-100 text-yellow-700',
          question.difficulty === 'hard' && 'bg-red-100 text-red-700',
        )}>
          {question.difficulty}
        </span>
      </div>

      {/* Question text */}
      <p className="text-[#1B2A4A] font-medium text-lg leading-relaxed mb-6">
        {question.question_text}
      </p>

      {/* Answer options */}
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const text = question[OPTION_KEY[opt]] as string
          const isSelected = selectedAnswer === opt
          const isCorrect = opt === question.correct_answer
          const showResult = submitted && mode === 'study'

          let optClass = 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer'
          let icon = null

          if (showResult) {
            if (isCorrect) {
              optClass = 'border-green-500 bg-green-50 cursor-default'
              icon = <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            } else if (isSelected && !isCorrect) {
              optClass = 'border-red-400 bg-red-50 cursor-default'
              icon = <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            } else {
              optClass = 'border-gray-200 bg-gray-50 opacity-60 cursor-default'
            }
          } else if (isSelected) {
            optClass = 'border-[#1B2A4A] bg-[#1B2A4A]/5 cursor-pointer'
          }

          return (
            <button
              key={opt}
              onClick={() => !submitted && onAnswer(opt)}
              disabled={submitted}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
                optClass
              )}
            >
              <span className={cn(
                'w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0',
                showResult && isCorrect && 'border-green-500 bg-green-500 text-white',
                showResult && isSelected && !isCorrect && 'border-red-400 bg-red-400 text-white',
                !showResult && isSelected && 'border-[#1B2A4A] bg-[#1B2A4A] text-white',
                !showResult && !isSelected && 'border-gray-400 text-gray-600',
              )}>
                {opt}
              </span>
              <span className="flex-1 text-sm text-gray-800">{text}</span>
              {icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
