import { createClient } from '@/lib/supabase/server'
import type { Profile, UserStatsCache } from '@/types'
import StudentsTable from '@/components/students/StudentsTable'

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('profiles')
    .select(`
      *,
      user_stats_cache(*)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Students</h1>
        <p className="text-gray-500 text-sm mt-0.5">{students?.length ?? 0} registered students</p>
      </div>
      <StudentsTable students={students || []} />
    </div>
  )
}
