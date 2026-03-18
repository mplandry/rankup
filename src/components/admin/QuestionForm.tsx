'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Question } from '@/types'
import { Save, Loader2, ArrowLeft } from 'lucide-react'

interface Props {
  question?: Question
  mode: 'create' | 'edit'
}

const EMPTY: Partial<Question> = {
  book_title: '',
  edition: '',
  chapter: '',
  topic: '',
  page_start: undefined,
  page_end: undefined,
  question_text: '',
  answer_a: '',
  answer_b: '',
  answer_c: '',
  answer_d: '',
  correct_answer: 'A',
  explanation: '',
  study_eligible: true,
  exam_eligible: true,
  difficulty: 'medium',
}

export default function QuestionForm({ question, mode }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Question>>(question ?? EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = mode === 'create' ? '/api/questions' : `/api/questions/${question!.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save')
      setLoading(false)
    } else {
      router.push('/admin/questions')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-[#1B2A4A]">
          {mode === 'create' ? 'Add Question' : 'Edit Question'}
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Source metadata */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Book Title" required>
            <input value={form.book_title || ''} onChange={(e) => set('book_title', e.target.value)} required className={inputCls} />
          </Field>
          <Field label="Edition">
            <input value={form.edition || ''} onChange={(e) => set('edition', e.target.value)} className={inputCls} placeholder="e.g. 7th" />
          </Field>
          <Field label="Chapter" required>
            <input value={form.chapter || ''} onChange={(e) => set('chapter', e.target.value)} required className={inputCls} />
          </Field>
          <Field label="Topic">
            <input value={form.topic || ''} onChange={(e) => set('topic', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Page Start">
            <input type="number" value={form.page_start || ''} onChange={(e) => set('page_start', parseInt(e.target.value) || null)} className={inputCls} />
          </Field>
          <Field label="Page End">
            <input type="number" value={form.page_end || ''} onChange={(e) => set('page_end', parseInt(e.target.value) || null)} className={inputCls} />
          </Field>
        </div>

        {/* Question text */}
        <Field label="Question Text" required>
          <textarea
            value={form.question_text || ''}
            onChange={(e) => set('question_text', e.target.value)}
            required
            rows={3}
            className={inputCls + ' resize-none'}
          />
        </Field>

        {/* Answer options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Answer Options</label>
          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
            const key = `answer_${opt.toLowerCase()}` as keyof Question
            return (
              <div key={opt} className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="correct_answer"
                    value={opt}
                    checked={form.correct_answer === opt}
                    onChange={() => set('correct_answer', opt)}
                    className="accent-red-600 w-4 h-4"
                  />
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    form.correct_answer === opt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>{opt}</span>
                </label>
                <input
                  value={(form[key] as string) || ''}
                  onChange={(e) => set(key, e.target.value)}
                  required
                  placeholder={`Answer ${opt}`}
                  className={inputCls + ' flex-1'}
                />
              </div>
            )
          })}
          <p className="text-xs text-gray-400">Select the radio button next to the correct answer</p>
        </div>

        {/* Explanation */}
        <Field label="Explanation (shown after answer in study mode)">
          <textarea
            value={form.explanation || ''}
            onChange={(e) => set('explanation', e.target.value)}
            rows={2}
            className={inputCls + ' resize-none'}
          />
        </Field>

        {/* Flags & difficulty */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Difficulty">
            <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} className={inputCls}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Field>
          <div className="flex flex-col gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.study_eligible} onChange={(e) => set('study_eligible', e.target.checked)} className="accent-red-600 w-4 h-4" />
              <span className="text-sm text-gray-700">Study eligible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.exam_eligible} onChange={(e) => set('exam_eligible', e.target.checked)} className="accent-red-600 w-4 h-4" />
              <span className="text-sm text-gray-700">Exam eligible</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Saving…' : 'Save Question'}
        </button>
      </div>
    </form>
  )
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
