import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react'
import { isPassing } from '@/lib/utils/score'
import type { Question, ExamSessionQuestion, CategoryBreakdown } from '@/types'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function ExamResultsPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session || session.status !== 'completed') redirect(`/exam/${sessionId}`)

  const { data: sessionQuestions } = await supabase
    .from('exam_session_questions')
    .select('*, question:questions(*)')
    .eq('session_id', sessionId)
    .order('question_order')

  const questions = (sessionQuestions || []) as (ExamSessionQuestion & { question: Question })[]

  // Build chapter breakdown
  const chapterMap = new Map<string, { total: number; correct: number }>()
  questions.forEach((sq) => {
    const ch = sq.question.chapter
    const entry = chapterMap.get(ch) || { total: 0, correct: 0 }
    entry.total++
    if (sq.is_correct) entry.correct++
    chapterMap.set(ch, entry)
  })
  const breakdown: CategoryBreakdown[] = Array.from(chapterMap.entries())
    .map(([chapter, v]) => ({
      chapter,
      topic: null,
      total: v.total,
      correct: v.correct,
      pct: Math.round((v.correct / v.total) * 100),
    }))
    .sort((a, b) => a.pct - b.pct)

  const pct = session.score_percent ?? 0
  const passing = isPassing(pct)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Score Card */}
      <div className={`rounded-2xl p-8 text-center mb-8 ${
        passing ? 'bg-green-600' : 'bg-[#C0392B]'
      }`}>
        <div className="inline-flex w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-4">
          {passing
            ? <Trophy className="w-8 h-8 text-white" />
            : <XCircle className="w-8 h-8 text-white" />}
        </div>
        <div className="text-5xl font-bold text-white mb-2">{pct}%</div>
        <div className="text-xl font-semibold text-white/90 mb-1">
          {passing ? 'PASS' : 'NOT PASSING'}
        </div>
        <div className="text-white/70 text-sm">
          {session.score} correct out of {session.total_questions} questions
        </div>
        {!passing && (
          <div className="text-white/70 text-sm mt-1">Passing score is 70%</div>
        )}
      </div>

      {/* Chapter Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-[#1B2A4A] mb-4">Performance by Chapter</h2>
        <div className="space-y-3">
          {breakdown.map((b) => (
            <div key={b.chapter}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{b.chapter}</span>
                <span className={`font-semibold ${b.pct >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {b.correct}/{b.total} ({b.pct}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${b.pct >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Missed Questions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-[#1B2A4A] mb-4">
          Missed Questions ({questions.filter((q) => !q.is_correct).length})
        </h2>
        <div className="space-y-4 max-h-96 overflow-auto">
          {questions
            .filter((sq) => !sq.is_correct)
            .map((sq, i) => (
              <div key={sq.id} className="border border-red-100 rounded-lg p-4 bg-red-50">
                <div className="text-sm font-medium text-gray-800 mb-2">
                  {i + 1}. {sq.question.question_text}
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="text-red-600">
                    Your answer: <strong>{sq.user_answer ?? 'Not answered'}</strong>
                  </span>
                  <span className="text-green-600">
                    Correct: <strong>{sq.question.correct_answer}</strong>
                  </span>
                </div>
                {sq.question.explanation && (
                  <p className="text-xs text-gray-600 mt-2">{sq.question.explanation}</p>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {sq.question.chapter} · p.{sq.question.page_start}
                  {sq.question.page_end && sq.question.page_end !== sq.question.page_start
                    ? `–${sq.question.page_end}` : ''}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/exam"
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <RotateCcw className="w-4 h-4" />
          Take Another Exam
        </Link>
        <Link
          href="/study"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#243660]"
        >
          Study Weak Areas
        </Link>
      </div>
    </div>
  )
}
