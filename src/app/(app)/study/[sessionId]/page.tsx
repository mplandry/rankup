import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudySession from '@/components/study/StudySession'
import type { Question, ExamSessionQuestion } from '@/types'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function StudySessionPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load session with questions
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session || session.mode !== 'study') redirect('/study')

  const { data: sessionQuestions } = await supabase
    .from('exam_session_questions')
    .select(`
      *,
      question:questions(*)
    `)
    .eq('session_id', sessionId)
    .order('question_order')

  if (!sessionQuestions || sessionQuestions.length === 0) redirect('/study')

  // Find first unanswered question index
  const firstUnanswered = sessionQuestions.findIndex((sq) => sq.user_answer === null)
  const startIndex = firstUnanswered === -1 ? sessionQuestions.length : firstUnanswered

  return (
    <StudySession
      sessionId={sessionId}
      sessionQuestions={sessionQuestions as (ExamSessionQuestion & { question: Question })[]}
      startIndex={startIndex}
      isCompleted={session.status === 'completed'}
    />
  )
}
