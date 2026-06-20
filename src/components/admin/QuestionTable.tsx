'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Question } from '@/types'
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  questions: Question[]
  totalPages: number
  currentPage: number
  searchQuery: string
}

export default function QuestionTable({ questions, totalPages, currentPage, searchQuery }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(searchQuery)
  const [deleting, setDeleting] = useState<string | null>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/admin/questions?q=${encodeURIComponent(search)}`)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    setDeleting(id)
    await fetch(`/api/questions/${id}`, { method: 'DELETE' })
    router.refresh()
    setDeleting(null)
  }

  return (
    <div>
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question text…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#243660]">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Book / Chapter</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Study</th>
              <th className="px-4 py-3">Exam</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {questions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No questions found</td>
              </tr>
            )}
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-gray-800 dark:text-gray-200 truncate" title={q.question_text}>
                    {q.question_text.substring(0, 80)}{q.question_text.length > 80 ? '…' : ''}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <div className="truncate max-w-[140px]" title={q.book_title}>{q.book_title}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{q.chapter}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    q.difficulty === 'easy' && 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
                    q.difficulty === 'medium' && 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400',
                    q.difficulty === 'hard' && 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
                  )}>
                    {q.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${q.study_eligible ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    {q.study_eligible ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${q.exam_eligible ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    {q.exam_eligible ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/admin/questions/${q.id}`} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 hover:text-[#1B2A4A] dark:hover:text-[#e2e8f0]">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={deleting === q.id}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <Link
              href={`/admin/questions?page=${currentPage - 1}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm',
                currentPage <= 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Link>
            <Link
              href={`/admin/questions?page=${currentPage + 1}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm',
                currentPage >= totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
              )}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
