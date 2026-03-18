import { createClient } from '@/lib/supabase/server'
import type { Profile, UserStatsCache } from '@/types'

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('profiles')
    .select(`
      *,
      user_stats_cache(*)
    `)
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Students</h1>
        <p className="text-gray-500 text-sm mt-0.5">{students?.length ?? 0} registered students</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Exams</th>
              <th className="px-4 py-3">Avg Score</th>
              <th className="px-4 py-3">Best Score</th>
              <th className="px-4 py-3">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(!students || students.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No students registered yet
                </td>
              </tr>
            )}
            {(students || []).map((s: Profile & { user_stats_cache: UserStatsCache | null }) => {
              const stats = s.user_stats_cache
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{s.full_name || '—'}</div>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{stats?.total_sessions ?? 0}</td>
                  <td className="px-4 py-3">
                    {stats?.avg_score_percent ? (
                      <span className={`font-semibold ${stats.avg_score_percent >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.avg_score_percent}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {stats?.best_score_percent ? (
                      <span className={`font-semibold ${stats.best_score_percent >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                        {stats.best_score_percent}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {stats?.last_session_at
                      ? new Date(stats.last_session_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
