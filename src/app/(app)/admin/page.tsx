import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Users, Upload, Database, List, ClipboardCheck, Sparkles, Wand2, Bell, Activity, BarChart3, Video } from "lucide-react";
import ExamTypeSwitcher from "@/components/admin/ExamTypeSwitcher";
import AdminReadingList from "@/components/admin/AdminReadingList";

const ACTIVE_NOW_WINDOW_MINUTES = 5;

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const activeSinceIso = new Date(
    Date.now() - ACTIVE_NOW_WINDOW_MINUTES * 60_000,
  ).toISOString();

  const [questionsRes, studentsRes, sessionsRes, profileRes, pendingReviewRes, activeNowRes] =
    await Promise.all([
      supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabase
        .from("exam_sessions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .eq("mode", "exam"),
      supabase.from("profiles").select("exam_type").eq("id", user!.id).single(),
      supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .in("review_status", ["pending", "needs_revision"]),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student")
        .gte("last_active_at", activeSinceIso),
    ]);

  const pendingReview = pendingReviewRes.count ?? 0;

  const stats = [
    {
      label: "Active Now",
      value: activeNowRes.count ?? 0,
      icon: Activity,
      href: "/admin/students",
      live: true,
    },
    {
      label: "Active Questions",
      value: questionsRes.count ?? 0,
      icon: Database,
      href: "/admin/questions",
      live: false,
    },
    {
      label: "Students",
      value: studentsRes.count ?? 0,
      icon: Users,
      href: "/admin/students",
      live: false,
    },
    {
      label: "Exams Completed",
      value: sessionsRes.count ?? 0,
      icon: BookOpen,
      href: "/admin/students",
      live: false,
    },
  ];

  return (
    <div className='p-8 max-w-5xl mx-auto'>
      <div className='mb-8 flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>Admin Dashboard</h1>
          <p className='text-gray-500 dark:text-gray-400 mt-1'>
            Manage questions and monitor student progress
          </p>
        </div>
        <ExamTypeSwitcher
          currentExamType={profileRes.data?.exam_type || "lieutenant"}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        {stats.map(({ label, value, icon: Icon, href, live }) => (
          <Link
            key={label}
            href={href}
            className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all'
          >
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-9 h-9 bg-[#1B2A4A]/10 dark:bg-white/10 rounded-lg flex items-center justify-center'>
                <Icon className='w-5 h-5 text-[#1B2A4A] dark:text-[#e2e8f0]' />
              </div>
              {live && value > 0 && (
                <span className='relative flex h-2.5 w-2.5'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500'></span>
                </span>
              )}
            </div>
            <div className='text-3xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>{value}</div>
            <div className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
              {label}
              {live && (
                <span className='text-gray-400 dark:text-gray-500'> (last {ACTIVE_NOW_WINDOW_MINUTES}m)</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <Link
          href='/admin/questions'
          className='flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all'
        >
          <div className='w-11 h-11 bg-purple-100 dark:bg-purple-950/40 rounded-xl flex items-center justify-center'>
            <List className='w-5 h-5 text-purple-600 dark:text-purple-400' />
          </div>
          <div>
            <div className='font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]'>View Questions</div>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Browse and manage all questions
            </div>
          </div>
        </Link>
        <Link
          href='/admin/questions/new'
          className='flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all'
        >
          <div className='w-11 h-11 bg-green-100 dark:bg-green-950/40 rounded-xl flex items-center justify-center'>
            <BookOpen className='w-5 h-5 text-green-600 dark:text-green-400' />
          </div>
          <div>
            <div className='font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]'>Add Question</div>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Manually create a new question
            </div>
          </div>
        </Link>
        <Link
          href='/admin/import'
          className='flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all'
        >
          <div className='w-11 h-11 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center'>
            <Upload className='w-5 h-5 text-blue-600 dark:text-blue-400' />
          </div>
          <div>
            <div className='font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]'>Import CSV</div>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Bulk import from a CSV file
            </div>
          </div>
        </Link>
        <Link
          href="/admin/question-generator"
          className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 bg-pink-100 dark:bg-pink-950/40 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <div className="font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]">AI Generator</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Screenshots to questions
            </div>
          </div>
        </Link>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <Link
          href='/admin/review'
          className='flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all'
        >
          <div className='w-11 h-11 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center'>
            <ClipboardCheck className='w-5 h-5 text-amber-600 dark:text-amber-400' />
          </div>
          <div className='flex-1'>
            <div className='font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]'>Review Queue</div>
            <div className='text-sm text-gray-500 dark:text-gray-400'>Approve questions for students</div>
          </div>
          {pendingReview > 0 && (
            <span className='text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full'>
              {pendingReview}
            </span>
          )}
        </Link>
        <Link
          href="/admin/waitlist"
          className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 bg-teal-100 dark:bg-teal-950/40 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]">Waitlist</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Future exam signups</div>
          </div>
        </Link>
        <Link
          href="/admin/distractor-improver"
          className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 bg-orange-100 dark:bg-orange-950/40 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <div className="font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]">AI Improver</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Enhance question quality
            </div>
          </div>
        </Link>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <a
          href="https://analytics.google.com/analytics/web/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]">GA4 Realtime</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Live visitor traffic
            </div>
          </div>
        </a>
        <a
          href="https://clarity.microsoft.com/projects/view/xakb835hpu/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 bg-cyan-100 dark:bg-cyan-950/40 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <div className="font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]">Clarity</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Session replays & heatmaps
            </div>
          </div>
        </a>
      </div>

      <AdminReadingList />
    </div>
  );
}
