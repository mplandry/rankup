import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamSession from '@/components/exam/ExamSession'
import { EXAM_TIME_LIMIT_SECS } from '@/lib/constants'
import type { Question, ExamSessionQuestion } from '@/types'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function ExamSessionPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load session and verify ownership + mode
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session || session.mode !== 'exam') redirect('/exam')
  if (session.status === 'completed') redirect(`/exam/${sessionId}/results`)

  const { data: sessionQuestions } = await supabase
    .from('exam_session_questions')
    .select(`
      *,
      question:questions(*)
    `)
    .eq('session_id', sessionId)
    .order('question_order')

  if (!sessionQuestions || sessionQuestions.length === 0) redirect('/exam')

  return (
    <ExamSession
      sessionId={sessionId}
      timeLimitSecs={EXAM_TIME_LIMIT_SECS}
      startedAt={session.started_at}
      sessionQuestions={sessionQuestions as (ExamSessionQuestion & { question: Question })[]}
    />
  )
}
