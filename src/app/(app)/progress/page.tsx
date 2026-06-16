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
    <div className="min-h-screen bg-[#f8f9fb] p-8">
      <h1 className="text-3xl font-bold mb-8 text-[#1B2A4A]">My Progress</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Total Sessions</div>
          <div className="text-3xl font-bold text-[#1B2A4A]">{stats?.total_sessions || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Avg Exam Score</div>
          <div className="text-3xl font-bold text-[#1B2A4A]">
            {stats?.avg_exam_score ? Math.round(stats.avg_exam_score) : 0}%
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Questions Answered</div>
          <div className="text-3xl font-bold text-[#1B2A4A]">
            {stats?.total_questions || 0}
          </div>
        </div>
      </div>

      {/* Exam Sessions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-[#1B2A4A]">Exam History</h2>
        {examSessions.length === 0 ? (
          <p className="text-gray-400">No exam sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {examSessions.map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex justify-between items-center"
              >
                <div>
                  <div className="text-sm font-semibold text-[#1B2A4A]">Exam Session</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.started_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: (s.score_percent || 0) >= 70 ? "#27ae60" : "#C0392B" }}
                  >
                    {s.score_percent || 0}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {s.score || 0}/{s.total_questions || 0} correct
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study Sessions */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-[#1B2A4A]">Study History</h2>
        {studySessions.length === 0 ? (
          <p className="text-gray-400">No study sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {studySessions.map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex justify-between items-center"
              >
                <div>
                  <div className="text-sm font-semibold text-[#1B2A4A]">Study Session</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.started_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#1B2A4A]">
                    {s.score_percent || 0}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {s.score || 0}/{s.total_questions || 0} correct
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
