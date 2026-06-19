import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudyConfig from '@/components/study/StudyConfig'

// Numeric chapters ascend numerically (so "2" sorts before "10"), suffixed
// chapters like "26A" sort near their numeric neighbor, and non-numeric
// values like "N/A" sort last.
function chapterSort(a: unknown, b: unknown) {
  const sa = String(a ?? '')
  const sb = String(b ?? '')
  const na = parseFloat(sa)
  const nb = parseFloat(sb)
  const aNum = !isNaN(na)
  const bNum = !isNaN(nb)
  if (aNum && bNum) return na !== nb ? na - nb : sa.localeCompare(sb)
  if (aNum) return -1
  if (bNum) return 1
  return sa.localeCompare(sb)
}

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; chapter?: string }>
}) {
  const { book: initialBook, chapter: initialChapter } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('exam_type')
    .eq('id', user.id)
    .single()

  const examTypes = profile?.exam_type
    ? [profile.exam_type, 'both']
    : ['lieutenant', 'captain', 'both']

  // Paginated fetch of filter metadata — an unbounded select caps at 1000
  // rows by default, which previously truncated books/chapters silently.
  const PAGE_SIZE = 1000
  let meta: { book_title: string; chapter: string | number | null; topic: string | null }[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('book_title, chapter, topic')
      .eq('is_active', true)
      .eq('study_eligible', true)
      .in('exam_type', examTypes)
      .range(from, from + PAGE_SIZE - 1)
    if (error || !data || data.length === 0) break
    meta = meta.concat(data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const books = [...new Set(meta.map((q) => q.book_title))].sort()
  const chapters = [...new Set(meta.map((q) => q.chapter))]
    .sort(chapterSort)
    .map((c) => String(c))
  const topics = [...new Set(meta.map((q) => q.topic).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b))) as string[]

  const bookChapters: Record<string, string[]> = {}
  const bookTopics: Record<string, string[]> = {}
  for (const b of books) {
    const rowsForBook = meta.filter((q) => q.book_title === b)
    bookChapters[b] = [...new Set(rowsForBook.map((q) => q.chapter))]
      .sort(chapterSort)
      .map((c) => String(c))
    bookTopics[b] = [...new Set(rowsForBook.map((q) => q.topic).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b))) as string[]
  }

  return (
    <div style={{ flex: 1, padding: '36px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, color: '#1B2A4A' }}>Study Mode</div>
      <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 28 }}>
        Practice with instant feedback and chapter references
      </div>
      <StudyConfig
        books={books}
        chapters={chapters}
        topics={topics}
        bookChapters={bookChapters}
        bookTopics={bookTopics}
        initialBook={initialBook}
        initialChapter={initialChapter}
      />
    </div>
  )
}
