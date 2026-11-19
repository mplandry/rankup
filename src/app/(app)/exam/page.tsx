import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamStart from '@/components/exam/ExamStart'
import { ACTIVE_EXAM_CYCLE, EXAM_QUESTION_COUNT } from '@/lib/constants'

export default async function ExamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('exam_type')
    .eq('id', user.id)
    .single()

  // Only this student's track (plus "both"), matching the filtering used by
  // Study Mode and Flashcards.
  const examTypes = profile?.exam_type
    ? [profile.exam_type, 'both']
    : ['lieutenant', 'captain', 'both']

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('exam_eligible', true)
    .eq('review_status', 'approved')
    .eq('exam_cycle', ACTIVE_EXAM_CYCLE)
    .in('exam_type', examTypes)

  // If this student walked away mid-exam (closed the tab, got pulled away,
  // navigated elsewhere), surface it here so they can resume instead of
  // unknowingly discarding it the moment they hit Start.
  const { data: existingSession } = await supabase
    .from('exam_sessions')
    .select('id, started_at, total_questions')
    .eq('user_id', user.id)
    .eq('mode', 'exam')
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div style={{ flex: 1, padding: '36px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, color: 'var(--text-strong)' }}>Exam Mode</div>
      <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 28 }}>Simulate the real promotional exam</div>
      <ExamStart
        availableCount={count || 0}
        requiredCount={EXAM_QUESTION_COUNT}
        existingSession={existingSession || null}
      />
    </div>
  )
}
