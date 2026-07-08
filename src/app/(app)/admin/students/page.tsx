import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Profile } from "@/types";
import StudentsTable from "@/components/students/StudentsTable";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const supabase = createServiceRoleClient();

  const [{ data: students, error }, { data: sessions, error: sessionsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          `
      *,
      user_stats_cache(*)
    `,
        )
        .eq("role", "student")
        .order("created_at", { ascending: false }),
      supabase.from("exam_sessions").select("user_id, status"),
    ]);

  if (error) console.error("Students query error:", error);
  if (sessionsError) console.error("Sessions query error:", sessionsError);

  // user_stats_cache.total_sessions only counts *completed* sessions (by
  // design — avg/best score can only be computed from a finished, scored
  // session). That undercounts real engagement: a student who started 5
  // sessions but only finished 1 looks like "1 session" in the stats cache.
  // Build an attempts map (all statuses) here so the admin UI can show both.
  const attemptsByUser = new Map<string, { total: number; completed: number }>();
  for (const s of sessions || []) {
    const entry = attemptsByUser.get(s.user_id) || { total: 0, completed: 0 };
    entry.total += 1;
    if (s.status === "completed") entry.completed += 1;
    attemptsByUser.set(s.user_id, entry);
  }

  const studentsWithAttempts = (students || []).map((s) => ({
    ...s,
    attempts: attemptsByUser.get(s.id) || { total: 0, completed: 0 },
  }));

  const activeSince = Date.now() - 5 * 60_000;
  const activeNowCount = studentsWithAttempts.filter(
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
      <StudentsTable students={studentsWithAttempts} />
    </div>
  );
}
