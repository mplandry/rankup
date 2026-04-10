import { createClient } from '@/lib/supabase/server'
import StudyConfigClient from '@/components/study/StudyConfig'

export default async function StudyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('exam_type')
    .eq('id', user!.id)
    .single()

  const userExamType = profile?.exam_type

  let query = supabase
    .from('questions')
    .select('book_title, chapter, topic')
    .eq('is_active', true)
    .eq('study_eligible', true)

  if (userExamType) {
    query = query.in('exam_type', [userExamType, 'both'])
  }

  const { data: allData } = await query
  const rows = allData || []

  const books = [...new Set(rows.map((r: { book_title: string }) => r.book_title).filter(Boolean))].sort() as string[]
  const chapters = [...new Set(rows.map((r: { chapter: string }) => r.chapter).filter(Boolean))].sort() as string[]
  const topics = [...new Set(rows.map((r: { topic: string }) => r.topic).filter(Boolean))].sort() as string[]

  const bookChapters: Record<string, string[]> = {}
  for (const row of rows as { book_title: string; chapter: string }[]) {
    if (!row.book_title || !row.chapter) continue
    if (!bookChapters[row.book_title]) bookChapters[row.book_title] = []
    if (!bookChapters[row.book_title].includes(row.chapter)) {
      bookChapters[row.book_title].push(row.chapter)
    }
  }
  for (const book of Object.keys(bookChapters)) {
    bookChapters[book].sort()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Study Mode</h1>
        <p className="text-gray-500 mt-1">Practice with instant feedback and chapter references</p>
      </div>
      <StudyConfigClient books={books} chapters={chapters} topics={topics} bookChapters={bookChapters} />
    </div>
  )
}
