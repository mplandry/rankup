import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Users, Upload, Database } from "lucide-react";
import ExamTypeSwitcher from "@/components/admin/ExamTypeSwitcher";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [questionsRes, studentsRes, sessionsRes, profileRes] =
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
    ]);

  const stats = [
    {
      label: "Active Questions",
      value: questionsRes.count ?? 0,
      icon: Database,
      href: "/admin/questions",
    },
    {
      label: "Students",
      value: studentsRes.count ?? 0,
      icon: Users,
      href: "/admin/students",
    },
    {
      label: "Exams Completed",
      value: sessionsRes.count ?? 0,
      icon: BookOpen,
      href: "/admin/students",
    },
  ];

  return (
    <div className='p-8 max-w-5xl mx-auto'>
      <div className='mb-8 flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-[#1B2A4A]'>Admin Dashboard</h1>
          <p className='text-gray-500 mt-1'>
            Manage questions and monitor student progress
          </p>
        </div>
        <ExamTypeSwitcher
          currentExamType={profileRes.data?.exam_type || "lieutenant"}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className='bg-white border border-gray-200 rounded-xl p-6 hover:border-red-300 hover:shadow-sm transition-all'
          >
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-9 h-9 bg-[#1B2A4A]/10 rounded-lg flex items-center justify-center'>
                <Icon className='w-5 h-5 text-[#1B2A4A]' />
              </div>
            </div>
            <div className='text-3xl font-bold text-[#1B2A4A]'>{value}</div>
            <div className='text-sm text-gray-500 mt-0.5'>{label}</div>
          </Link>
        ))}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Link
          href='/admin/questions/new'
          className='flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:border-red-300 hover:shadow-sm transition-all'
        >
          <div className='w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center'>
            <BookOpen className='w-5 h-5 text-green-600' />
          </div>
          <div>
            <div className='font-semibold text-[#1B2A4A]'>Add Question</div>
            <div className='text-sm text-gray-500'>
              Manually create a new question
            </div>
          </div>
        </Link>
        <Link
          href='/admin/import'
          className='flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:border-red-300 hover:shadow-sm transition-all'
        >
          <div className='w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center'>
            <Upload className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <div className='font-semibold text-[#1B2A4A]'>Import CSV</div>
            <div className='text-sm text-gray-500'>
              Bulk import from a CSV file
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
