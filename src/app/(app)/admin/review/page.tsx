// src/app/(app)/admin/review/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewQueue, { type ReviewQuestion } from '@/components/admin/ReviewQueue'

export default async function ReviewQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: questionsData, error } = await supabase
    .from('questions')
    .select(
      'id, question_text, answer_a, answer_b, answer_c, answer_d, correct_answer, ' +
      'book_title, edition, chapter, topic, page_start, page_end, difficulty, ' +
      'review_status, distractor_score, distractor_notes, originality_reviewed'
    )
    .eq('is_active', true)
    .in('review_status', ['pending', 'needs_revision'])
    .order('review_status', { ascending: false })
    .order('distractor_score', { ascending: true, nullsFirst: false })
    .limit(200)

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Failed to load review queue: {error.message}
      </div>
    )
  }

  const questions = (questionsData || []) as unknown as ReviewQuestion[]
  const pending = questions.filter((q) => q.review_status === 'pending').length
  const flagged = questions.filter((q) => q.review_status === 'needs_revision').length

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Review Queue</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pending} pending · {flagged} needs revision — approve questions to make them available to students
          </p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-5xl mb-3">✓</div>
            <p className="font-medium text-gray-600">Queue is empty</p>
            <p className="text-sm mt-1">All questions have been reviewed</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ReviewQueue initialQuestions={questions} />
        </div>
      )}
    </div>
  )
}
