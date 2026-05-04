import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProgressPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const profileRes = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  const statsRes = await supabase
    .from("user_stats_cache")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  const sessionsRes = await supabase
    .from("exam_sessions")
    .select(
      `
      id,
      mode,
      score_percent,
      total_questions,
      score,
      started_at,
      completed_at
    `,
    )
    .eq("user_id", session.user.id)
    .order("started_at", { ascending: false });

  const stats = statsRes.data as any | null;
  const sessions = (sessionsRes.data || []) as any[];

  const examSessions = sessions.filter((s) => s.mode === "exam");
  const studySessions = sessions.filter((s) => s.mode === "study");

  return (
    <div className='min-h-screen bg-[#1a1a1a] text-white p-8'>
      <h1 className='text-3xl font-bold mb-8'>My Progress</h1>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-[#2a2a2a] p-6 rounded-lg border border-[#3a3a3a]'>
          <div className='text-sm text-gray-400 mb-2'>Total Sessions</div>
          <div className='text-3xl font-bold'>{stats?.total_sessions || 0}</div>
        </div>
        <div className='bg-[#2a2a2a] p-6 rounded-lg border border-[#3a3a3a]'>
          <div className='text-sm text-gray-400 mb-2'>Avg Exam Score</div>
          <div className='text-3xl font-bold'>
            {stats?.avg_exam_score ? Math.round(stats.avg_exam_score) : 0}%
          </div>
        </div>
        <div className='bg-[#2a2a2a] p-6 rounded-lg border border-[#3a3a3a]'>
          <div className='text-sm text-gray-400 mb-2'>Questions Answered</div>
          <div className='text-3xl font-bold'>
            {stats?.total_questions || 0}
          </div>
        </div>
      </div>

      {/* Exam Sessions */}
      <div className='mb-8'>
        <h2 className='text-2xl font-bold mb-4'>Exam History</h2>
        {examSessions.length === 0 ? (
          <p className='text-gray-400'>No exam sessions yet.</p>
        ) : (
          <div className='space-y-4'>
            {examSessions.map((session) => (
              <div
                key={session.id}
                className='bg-[#2a2a2a] p-6 rounded-lg border border-[#3a3a3a]'
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <div className='text-lg font-semibold'>Exam Session</div>
                    <div className='text-sm text-gray-400'>
                      {new Date(session.started_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-2xl font-bold'>
                      {session.score_percent || 0}%
                    </div>
                    <div className='text-sm text-gray-400'>
                      {session.score || 0}/{session.total_questions || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study Sessions */}
      <div>
        <h2 className='text-2xl font-bold mb-4'>Study History</h2>
        {studySessions.length === 0 ? (
          <p className='text-gray-400'>No study sessions yet.</p>
        ) : (
          <div className='space-y-4'>
            {studySessions.map((session) => (
              <div
                key={session.id}
                className='bg-[#2a2a2a] p-6 rounded-lg border border-[#3a3a3a]'
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <div className='text-lg font-semibold'>Study Session</div>
                    <div className='text-sm text-gray-400'>
                      {new Date(session.started_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-2xl font-bold'>
                      {session.score_percent || 0}%
                    </div>
                    <div className='text-sm text-gray-400'>
                      {session.score || 0}/{session.total_questions || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
