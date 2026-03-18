import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calcScorePercent } from '@/lib/utils/score'

interface Props {
  params: Promise<{ sessionId: string }>
}

// POST /api/sessions/[sessionId]/complete
// Server-side: scores all answers against correct_answer, updates session, refreshes stats cache
export async function POST(_request: Request, { params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify session belongs to user and is in progress
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.status === 'completed') {
    return NextResponse.json({ ok: true, already_complete: true })
  }

  // Load all session questions WITH correct_answer (server-side only)
  const { data: sessionQuestions, error: sqErr } = await supabase
    .from('exam_session_questions')
    .select(`
      id,
      question_id,
      user_answer,
      question:questions(correct_answer)
    `)
    .eq('session_id', sessionId)

  if (sqErr || !sessionQuestions) {
    return NextResponse.json({ error: 'Failed to load session questions' }, { status: 500 })
  }

  // Score each question (Supabase returns joined relation as array)
  const scored = (sessionQuestions as unknown as {
    id: string
    question_id: string
    user_answer: string | null
    question: { correct_answer: string }[]
  }[]).map((sq) => ({
    id: sq.id,
    is_correct: sq.user_answer !== null && sq.user_answer === sq.question?.[0]?.correct_answer,
  }))

  const correctCount = scored.filter((s) => s.is_correct).length
  const totalCount = sessionQuestions.length
  const scorePct = calcScorePercent(correctCount, totalCount)
  const elapsedSecs = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)

  // Batch update is_correct for each session question
  // Supabase doesn't support bulk UPDATE with different values, so we update individually in parallel
  await Promise.all(
    scored.map((s) =>
      supabase
        .from('exam_session_questions')
        .update({ is_correct: s.is_correct })
        .eq('id', s.id)
    )
  )

  // Update session status
  const { error: updateErr } = await supabase
    .from('exam_sessions')
    .update({
      status: 'completed',
      score: correctCount,
      score_percent: scorePct,
      time_elapsed_secs: elapsedSecs,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Refresh user stats cache (fire and forget for exam mode speed, await for accuracy)
  try {
    await supabase.rpc('refresh_user_stats', { p_user_id: user.id })
  } catch {
    // Non-critical — stats cache will be stale until next completion
  }

  return NextResponse.json({
    ok: true,
    score: correctCount,
    total: totalCount,
    score_percent: scorePct,
  })
}
