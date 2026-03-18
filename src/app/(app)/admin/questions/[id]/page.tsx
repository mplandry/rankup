import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuestionForm from '@/components/admin/QuestionForm'
import type { Question } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditQuestionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: question } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single()

  if (!question) redirect('/admin/questions')

  return (
    <div className="p-8">
      <QuestionForm mode="edit" question={question as Question} />
    </div>
  )
}
