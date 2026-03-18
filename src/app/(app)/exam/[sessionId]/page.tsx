import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamSession from '@/components/exam/ExamSession'
import type { ExamQuestion, ExamSessionQuestion } from '@/types'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function ExamSessionPage({ params }: Props) {
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

  if (!session || session.mode !== 'exam') redirect('/exam')
  if (session.status === 'completed') redirect(`/exam/${sessionId}/results`)

  // Load questions WITHOUT correct_answer (security: never send to client)
  const { data: sessionQuestions } = await supabase
    .from('exam_session_questions')
    .select(`
      id,
      session_id,
      question_id,
      question_order,
      user_answer,
      is_correct,
      flagged,
      answered_at,
      time_spent_secs,
      question:questions(
        id, source_id, book_title, edition, chapter, topic,
        page_start, page_end, question_text,
        answer_a, answer_b, answer_c, answer_d,
        study_eligible, exam_eligible, difficulty,
        is_active, created_by, created_at, updated_at
      )
    `)
    .eq('session_id', sessionId)
    .order('question_order')

  if (!sessionQuestions || sessionQuestions.length === 0) redirect('/exam')

  return (
    <ExamSession
      sessionId={sessionId}
      timeLimitSecs={session.time_limit_secs ?? 5400}
      startedAt={session.started_at}
      sessionQuestions={sessionQuestions as unknown as (ExamSessionQuestion & { question: ExamQuestion })[]}
    />
  )
}
