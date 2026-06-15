import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Profile } from "@/types";
import StudentsTable from "@/components/students/StudentsTable";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const supabase = createServiceRoleClient();

  const { data: students } = await supabase
    .from("profiles")
    .select(
      `
      *,
      user_stats_cache(*),
      payment_transactions(plan_type, status, created_at, amount_cents)
    `,
    )
    .eq("role", "student")
    .order("created_at", { ascending: false });

  return (
    <div className='p-8 max-w-6xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-[#1B2A4A]'>Students</h1>
        <p className='text-gray-500 text-sm mt-0.5'>
          {students?.length ?? 0} registered students
        </p>
      </div>
      <StudentsTable students={students || []} />
    </div>
  );
}
