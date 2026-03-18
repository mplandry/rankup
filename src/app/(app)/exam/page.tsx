import { createClient } from '@/lib/supabase/server'
import ExamStart from '@/components/exam/ExamStart'
import { EXAM_QUESTION_COUNT } from '@/lib/constants'

export default async function ExamPage() {
  const supabase = await createClient()

  // Count available exam-eligible questions
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('exam_eligible', true)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Exam Mode</h1>
        <p className="text-gray-500 mt-1">Simulate the real promotional exam</p>
      </div>
      <ExamStart availableCount={count ?? 0} requiredCount={EXAM_QUESTION_COUNT} />
    </div>
  )
}
