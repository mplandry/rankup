import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
  const supabase = createServiceRoleClient();
  const { data: entries } = await supabase
    .from("waitlist")
    .select("*")
    .order("created_at", { ascending: false });

  const examLabel = (t: string | null) => {
    if (!t) return "—";
    return t === "lieutenant_2027" ? "Lieutenant 2027"
      : t === "captain_2027" ? "Captain 2027"
      : "Other";
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Future Exam Waitlist</h1>
        <p className="text-gray-500 text-sm mt-0.5">{entries?.length ?? 0} signups</p>
      </div>
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Exam</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Signed Up</th>
            </tr>
          </thead>
          <tbody>
            {entries?.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No signups yet</td></tr>
            )}
            {entries?.map((e) => (
              <tr key={e.id} className="border-b border-[#f1f5f9] hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{e.email}</td>
                <td className="px-4 py-3 text-gray-600">{examLabel(e.exam_type)}</td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(e.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
