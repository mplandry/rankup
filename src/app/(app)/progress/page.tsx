import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ScoreTrendChart from '@/components/progress/ScoreTrendChart'
import WeakAreasChart from '@/components/progress/WeakAreasChart'
import type { UserStatsCache, ExamSession } from '@/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [statsRes, sessionsRes] = await Promise.all([
    supabase.from('user_stats_cache').select('*').eq('user_id', user.id).single(),
    supabase.from('exam_sessions')
      .select('id, mode, score_percent, total_questions, score, started_at, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true })
      .limit(30),
  ])

  const stats = statsRes.data as UserStatsCache | null
  const sessions = (sessionsRes.data || []) as ExamSession[]

  const examSessions = sessions.filter((s) => s.mode === 'exam')
  const studySessions = sessions.filter((s) => s.mode === 'study')

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">My Progress</h1>
        <p className="text-gray-500 mt-1">Track your performance over time</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Exams Taken', value: examSessions.length },
          { label: 'Study Sessions', value: studySessions.length },
          { label: 'Avg Exam Score', value: stats?.avg_score_percent ? `${stats.avg_score_percent}%` : '—' },
          { label: 'Best Exam Score', value: stats?.best_score_percent ? `${stats.best_score_percent}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-2xl font-bold text-[#1B2A4A]">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Exam Score Trend */}
      {examSessions.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-[#1B2A4A] mb-4">Exam Score Trend</h2>
          <ScoreTrendChart sessions={examSessions} />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 text-center text-gray-400">
          <p className="mb-3">No completed exams yet.</p>
          <Link href="/exam" className="text-sm text-[#C0392B] font-medium hover:underline">
            Take your first exam →
          </Link>
        </div>
      )}

      {/* Weak Areas */}
      {(() => {
        const weakChapters = stats?.weak_chapters ?? []
        const weakTopics = stats?.weak_topics ?? []
        if (!weakChapters.length && !weakTopics.length) return null
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {weakChapters.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="font-semibold text-[#1B2A4A] mb-4">Weakest Chapters</h2>
                <WeakAreasChart items={weakChapters} labelKey="chapter" />
              </div>
            )}
            {weakTopics.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="font-semibold text-[#1B2A4A] mb-4">Weakest Topics</h2>
                <WeakAreasChart items={weakTopics} labelKey="topic" />
              </div>
            )}
          </div>
        )
      })()}

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#1B2A4A] mb-4">Session History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Mode</th>
                  <th className="pb-3 pr-4">Questions</th>
                  <th className="pb-3 pr-4">Score</th>
                  <th className="pb-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...sessions].reverse().map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-4 text-gray-600">
                      {new Date(s.completed_at!).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.mode === 'exam' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {s.mode}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{s.total_questions}</td>
                    <td className="py-3 pr-4">
                      {s.score_percent !== null ? (
                        <span className={`font-semibold ${s.score_percent >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {s.score_percent}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3">
                      {s.mode === 'exam' && s.score_percent !== null && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.score_percent >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.score_percent >= 70 ? 'Pass' : 'Fail'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
