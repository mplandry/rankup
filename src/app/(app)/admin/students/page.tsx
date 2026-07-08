import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Profile } from "@/types";
import StudentsTable from "@/components/students/StudentsTable";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const supabase = createServiceRoleClient();

  const { data: students, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      user_stats_cache(*)
    `,
    )
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (error) console.error("Students query error:", error);

  const activeSince = Date.now() - 5 * 60_000;
  const activeNowCount = (students || []).filter(
    (s) => s.last_active_at && new Date(s.last_active_at).getTime() >= activeSince,
  ).length;

  return (
    <div className='p-8 max-w-6xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>Students</h1>
        <p className='text-gray-500 dark:text-gray-400 text-sm mt-0.5'>
          {students?.length ?? 0} registered students
          {activeNowCount > 0 && (
            <span className='text-green-600 dark:text-green-400 font-semibold'>
              {" "}
              · {activeNowCount} active now
            </span>
          )}
        </p>
      </div>
      <StudentsTable students={students || []} />
    </div>
  );
}
