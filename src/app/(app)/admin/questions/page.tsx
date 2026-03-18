import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import QuestionTableClient from '@/components/admin/QuestionTable'
import DedupeButton from '@/components/admin/DedupeButton'
import type { Question } from '@/types'

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminQuestionsPage({ searchParams }: Props) {
  const { q, page } = await searchParams
  const supabase = await createClient()
  const pageNum = parseInt(page || '1')
  const perPage = 25
  const offset = (pageNum - 1) * perPage

  let query = supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (q) {
    query = query.ilike('question_text', `%${q}%`)
  }

  const { data: questions, count } = await query
  const totalPages = Math.ceil((count ?? 0) / perPage)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Questions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{count ?? 0} active questions</p>
        </div>
        <div className="flex items-center gap-3">
          <DedupeButton />
          <Link
            href="/admin/questions/new"
            className="flex items-center gap-2 bg-[#C0392B] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#a93226]"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </Link>
        </div>
      </div>

      <QuestionTableClient
        questions={(questions || []) as Question[]}
        totalPages={totalPages}
        currentPage={pageNum}
        searchQuery={q || ''}
      />
    </div>
  )
}
