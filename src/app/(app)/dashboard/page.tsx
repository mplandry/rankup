import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  TrendingUp,
  Award,
  Target,
  Flame,
} from "lucide-react";
import type { UserStatsCache, ExamSession } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [statsRes, sessionsRes, profileRes] = await Promise.all([
    supabase
      .from("user_stats_cache")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("exam_sessions")
      .select(
        "id, mode, score_percent, total_questions, score, completed_at, status",
      )
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  const stats = statsRes.data as UserStatsCache | null;
  const sessions = (sessionsRes.data || []) as ExamSession[];
  const name = profileRes.data?.full_name?.split(" ")[0] || "there";

    // Determine if this is their first time on the dashboard
    const isFirstTime = !stats || stats.total_sessions === 0;
    const greeting = isFirstTime ? `Welcome, ${name}!` : `Welcome back, ${name}!`;

  return (
    <div className='p-8 max-w-5xl mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-[#1B2A4A]'>
          {greeting}
        </h1>
        <p className='text-gray-500 mt-1'>
          Ready to prep for your promotional exam?
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <StatCard
          label='Total Sessions'
          value={String(stats?.total_sessions ?? 0)}
          icon={<ClipboardList className='w-5 h-5 text-blue-500' />}
          bg='bg-blue-50'
        />
        <StatCard
          label='Questions Answered'
          value={String(stats?.total_questions ?? 0)}
          icon={<Target className='w-5 h-5 text-purple-500' />}
          bg='bg-purple-50'
        />
        <StatCard
          label='Avg Score'
          value={
            stats?.avg_score_percent
              ? `${Math.round(stats.avg_score_percent)}%`
              : "—"
          }
          icon={<TrendingUp className='w-5 h-5 text-green-500' />}
          bg='bg-green-50'
        />
        <StatCard
          label='Best Score'
          value={
            stats?.best_score_percent
              ? `${Math.round(stats.best_score_percent)}%`
              : "—"
          }
          icon={<Award className='w-5 h-5 text-amber-500' />}
          bg='bg-amber-50'
        />
      </div>

      {/* Quick Start */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
        <Link
          href='/study'
          className='group flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:border-red-300 hover:shadow-md transition-all'
        >
          <div className='w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors'>
            <BookOpen className='w-6 h-6 text-orange-600' />
          </div>
          <div>
            <div className='font-semibold text-[#1B2A4A]'>Study Mode</div>
            <div className='text-sm text-gray-500'>
              Practice with instant feedback
            </div>
          </div>
        </Link>
        <Link
          href='/exam'
          className='group flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:border-red-300 hover:shadow-md transition-all'
        >
          <div className='w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors'>
            <Flame className='w-6 h-6 text-red-600' />
          </div>
          <div>
            <div className='font-semibold text-[#1B2A4A]'>Exam Mode</div>
            <div className='text-sm text-gray-500'>
              90 questions, timed simulation
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className='bg-white border border-gray-200 rounded-xl p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='font-semibold text-[#1B2A4A]'>Recent Sessions</h2>
            <Link
              href='/progress'
              className='text-sm text-[#C0392B] hover:underline'
            >
              View all
            </Link>
          </div>
          <div className='space-y-3'>
            {sessions.map((s) => (
              <div
                key={s.id}
                className='flex items-center justify-between py-2 border-b border-gray-100 last:border-0'
              >
                <div className='flex items-center gap-3'>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.mode === "exam"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {s.mode === "exam" ? "Exam" : "Study"}
                  </span>
                  <span className='text-sm text-gray-600'>
                    {s.total_questions} questions
                  </span>
                </div>
                <div className='flex items-center gap-4'>
                  {s.score_percent !== null && (
                    <span
                      className={`text-sm font-semibold ${
                        s.mode === "exam"
                          ? s.score_percent >= 70
                            ? "text-green-600"
                            : "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {Math.round(s.score_percent)}%
                    </span>
                  )}
                  <span className='text-xs text-gray-400'>
                    {s.completed_at
                      ? new Date(s.completed_at).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-5'>
      <div
        className={`inline-flex w-9 h-9 rounded-lg ${bg} items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <div className='text-2xl font-bold text-[#1B2A4A]'>{value}</div>
      <div className='text-xs text-gray-500 mt-0.5'>{label}</div>
    </div>
  );
}
