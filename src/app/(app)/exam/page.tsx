import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamStart from '@/components/exam/ExamStart'
import { EXAM_QUESTION_COUNT } from '@/lib/constants'

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
    .in('exam_type', examTypes)

  return (
    <div style={{ flex: 1, padding: '36px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, color: '#1B2A4A' }}>Exam Mode</div>
      <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 28 }}>Simulate the real promotional exam</div>
      <ExamStart availableCount={count || 0} requiredCount={EXAM_QUESTION_COUNT} />
    </div>
  )
}
